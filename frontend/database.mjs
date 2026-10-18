import pg from 'pg';
import {loadEnvFile} from 'node:process';
import {createHash, randomUUID} from 'node:crypto';
try { loadEnvFile(new URL('../.env', import.meta.url)); } catch(e) { if(e.code!=='ENOENT') throw e; }
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing from the project-root .env');
const url=new URL(process.env.DATABASE_URL);
// Honor the TLS mode configured in DATABASE_URL using PostgreSQL semantics.
url.searchParams.set('uselibpqcompat','true');
if(!url.searchParams.has('sslmode'))url.searchParams.set('sslmode','verify-full');
import {demoPatients} from './demo-data.mjs';
import {ADDED_COLUMNS} from './psv.mjs';
import {MODEL_VERSION} from './nutrition.mjs';

export const pool=new pg.Pool({connectionString:url.toString(),max:5,connectionTimeoutMillis:10000,query_timeout:15000});
pool.on('error',()=>console.error('Database pool connection interrupted'));
export async function initialize(){
 const c=await pool.connect();
 try{await c.query('BEGIN');await c.query("SELECT pg_advisory_xact_lock(4025173)");
 await c.query(`CREATE SCHEMA IF NOT EXISTS septisense;
 CREATE TABLE IF NOT EXISTS septisense.patients(id text PRIMARY KEY, name text NOT NULL, age integer NOT NULL, sex text NOT NULL, bed text NOT NULL);
 CREATE TABLE IF NOT EXISTS septisense.encounters(id text PRIMARY KEY, patient_id text NOT NULL REFERENCES septisense.patients(id), admitted_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS septisense.observations(observed_at timestamptz NOT NULL, id uuid NOT NULL, encounter_id text NOT NULL REFERENCES septisense.encounters(id), run_id uuid NOT NULL, heart_rate double precision, respiratory_rate double precision, systolic_bp double precision, temperature_c double precision, spo2_pct double precision, gcs double precision, wbc_10e9_l double precision, lactate_mmol_l double precision, PRIMARY KEY(observed_at,id));
 CREATE INDEX IF NOT EXISTS observations_encounter_time ON septisense.observations(encounter_id,observed_at DESC);
 CREATE TABLE IF NOT EXISTS septisense.predictions(id uuid PRIMARY KEY, encounter_id text NOT NULL REFERENCES septisense.encounters(id), predicted_at timestamptz NOT NULL, run_id uuid NOT NULL, risk integer NOT NULL CHECK(risk BETWEEN 0 AND 100), qsofa integer NOT NULL, sirs integer NOT NULL, snapshot jsonb NOT NULL, canonical text NOT NULL, hash text NOT NULL, model_version text NOT NULL DEFAULT 'demo_preset_v1');
 CREATE INDEX IF NOT EXISTS predictions_encounter_time ON septisense.predictions(encounter_id,predicted_at DESC);
 CREATE TABLE IF NOT EXISTS septisense.alerts(id uuid PRIMARY KEY, prediction_id uuid NOT NULL REFERENCES septisense.predictions(id), encounter_id text NOT NULL REFERENCES septisense.encounters(id), run_id uuid NOT NULL, status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(encounter_id,run_id));
 CREATE TABLE IF NOT EXISTS septisense.alert_events(id uuid PRIMARY KEY, alert_id uuid NOT NULL REFERENCES septisense.alerts(id), created_at timestamptz NOT NULL DEFAULT now(), event_type text NOT NULL, actor text NOT NULL DEFAULT 'demo-user');`);
 await c.query("SELECT create_hypertable('septisense.observations', by_range('observed_at'), if_not_exists => TRUE)");
 // Typed columns for the rest of the PSV dataset. Only missing columns are added; existing rows get NULL.
 const existing=new Set((await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='septisense' AND table_name='observations'")).rows.map(r=>r.column_name));
 for(const [,column] of ADDED_COLUMNS)if(!existing.has(column))await c.query(`ALTER TABLE septisense.observations ADD COLUMN ${column} double precision`);
 // Older replays named people "Patient N"; the dashboard now calls them residents.
 await c.query("UPDATE septisense.patients SET name='Resident '||substring(name from 9) WHERE name ~ '^Patient [0-9]+$'");
 // Solana Blink receipts: one row per verified on-chain review signature.
 // NutriSense: scored predictions carry their reasons in `details`; scores are nullable because some snapshots are unscored.
 await c.query(`ALTER TABLE septisense.predictions ALTER COLUMN risk DROP NOT NULL, ALTER COLUMN qsofa DROP NOT NULL, ALTER COLUMN sirs DROP NOT NULL, ADD COLUMN IF NOT EXISTS details jsonb`);
 // Screening profile (demographics, body measures, diet recall, vitals, balance & falls) stored per resident.
 await c.query('ALTER TABLE septisense.patients ADD COLUMN IF NOT EXISTS screening jsonb');
 await c.query(`CREATE TABLE IF NOT EXISTS septisense.nutrition_logs(run_id uuid NOT NULL, patient_id text NOT NULL REFERENCES septisense.patients(id), day integer NOT NULL, log_date date NOT NULL, breakfast_pct smallint, lunch_pct smallint, dinner_pct smallint, fluids_ml integer, weight_kg numeric(5,1), appetite text, chewing_difficulty boolean NOT NULL DEFAULT false, note text, ingested_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(run_id,patient_id,day))`);
 await c.query(`CREATE TABLE IF NOT EXISTS septisense.blink_receipts(signature text PRIMARY KEY, prediction_id uuid NOT NULL REFERENCES septisense.predictions(id), account text NOT NULL, memo text NOT NULL, cluster text NOT NULL, slot bigint, signed_at timestamptz NOT NULL DEFAULT now())`);
 await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function save(c,id,v,risk,run){
 const encounter=`ICU-${id}-01`,timestamp=new Date().toISOString(),prediction=randomUUID();
 const [hr,rr,sbp,temp,,gcs,wbc]=v;
 const q=Number(sbp<=100)+Number(rr>=22)+Number(gcs<15),s=Number(temp>38||temp<36)+Number(hr>90)+Number(rr>20)+Number(wbc>12||wbc<4);
 const canonical=JSON.stringify({patient_id:id,timestamp,vitals:v,run_id:run});const hash=createHash('sha256').update(canonical).digest('hex');
 await c.query('INSERT INTO septisense.observations VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[timestamp,randomUUID(),encounter,run,...v]);
 await c.query('INSERT INTO septisense.predictions(id,encounter_id,predicted_at,run_id,risk,qsofa,sirs,snapshot,canonical,hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[prediction,encounter,timestamp,run,risk,q,s,JSON.stringify(v),canonical,hash]);
 if(risk>=70){const a=await c.query('INSERT INTO septisense.alerts(id,prediction_id,encounter_id,run_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id',[randomUUID(),prediction,encounter,run]);if(a.rowCount)await c.query("INSERT INTO septisense.alert_events(id,alert_id,event_type) VALUES($1,$2,'created')",[randomUUID(),a.rows[0].id]);}
 return {prediction_id:prediction,vitals_hash:hash};
}
export async function record(id,v,risk,run){const c=await pool.connect();try{await c.query('BEGIN');const p=await c.query('SELECT id FROM septisense.patients WHERE id=$1 FOR UPDATE',[id]);if(!p.rowCount)throw Object.assign(new Error('Unknown patient'),{status:404});const result=await save(c,id,v,risk,run);await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
// Latest state per resident. Risk, reasons and alerts come from the newest NutriSense score; vitals come from the
// newest vitals snapshot (PSV replay or demo). Residents without a nutrition score show as "Not scored".
export async function patients(){return (await pool.query(`SELECT p.*, n.risk, n.details, vit.snapshot AS v,
 COALESCE(n.hash,vit.hash) AS hash, COALESCE(n.id,vit.id) AS prediction_id, a.id AS alert_id, a.status AS alert_status
 FROM septisense.patients p JOIN septisense.encounters e ON e.patient_id=p.id
 LEFT JOIN LATERAL (SELECT * FROM septisense.predictions WHERE encounter_id=e.id AND model_version<>'${MODEL_VERSION}' ORDER BY predicted_at DESC LIMIT 1) vit ON true
 LEFT JOIN LATERAL (SELECT * FROM septisense.predictions WHERE encounter_id=e.id AND model_version='${MODEL_VERSION}' ORDER BY predicted_at DESC LIMIT 1) n ON true
 LEFT JOIN septisense.alerts a ON a.encounter_id=e.id AND a.run_id=n.run_id
 WHERE n.id IS NOT NULL OR vit.id IS NOT NULL ORDER BY p.id`)).rows}
export async function audit(){return (await pool.query(`SELECT ev.created_at AS time, e.patient_id || ' alert ' || ev.event_type AS text, p.hash FROM septisense.alert_events ev JOIN septisense.alerts a ON a.id=ev.alert_id JOIN septisense.encounters e ON e.id=a.encounter_id JOIN septisense.predictions p ON p.id=a.prediction_id ORDER BY ev.created_at DESC LIMIT 100`)).rows}
export async function acknowledge(id){const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query("UPDATE septisense.alerts SET status='acknowledged' WHERE id=$1 AND status='open' RETURNING id",[id]);if(r.rowCount)await c.query("INSERT INTO septisense.alert_events(id,alert_id,event_type) VALUES($1,$2,'acknowledged')",[randomUUID(),id]);await c.query('COMMIT');return {acknowledged:!!r.rowCount}}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}


// Caller owns the transaction so dependent records are removed atomically.
export async function deletePatientData(c,id){
 const found=await c.query('SELECT id FROM septisense.patients WHERE id=$1 FOR UPDATE',[id]);
 if(!found.rowCount)return false;
 const encounters=(await c.query('SELECT id FROM septisense.encounters WHERE patient_id=$1',[id])).rows.map(r=>r.id);
 await c.query('DELETE FROM septisense.alert_events WHERE alert_id IN (SELECT id FROM septisense.alerts WHERE encounter_id=ANY($1::text[]))',[encounters]);
 await c.query('DELETE FROM septisense.blink_receipts WHERE prediction_id IN (SELECT id FROM septisense.predictions WHERE encounter_id=ANY($1::text[]))',[encounters]);
 for(const table of ['alerts','predictions','observations'])await c.query(`DELETE FROM septisense.${table} WHERE encounter_id=ANY($1::text[])`,[encounters]);
 if((await c.query("SELECT to_regclass('septisense.replay_rows') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_rows WHERE patient_id=$1',[id]);
 await c.query('DELETE FROM septisense.nutrition_logs WHERE patient_id=$1',[id]);
 await c.query('DELETE FROM septisense.encounters WHERE patient_id=$1',[id]);
 await c.query('DELETE FROM septisense.patients WHERE id=$1',[id]);
 return true;
}

export async function deleteAllPatientData(c){
 // Lock patient writes until the deletion transaction commits.
 await c.query('LOCK TABLE septisense.patients IN EXCLUSIVE MODE');
 for(const table of ['alert_events','blink_receipts','alerts','predictions','observations','nutrition_logs'])await c.query(`DELETE FROM septisense.${table}`);
 if((await c.query("SELECT to_regclass('septisense.replay_rows') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_rows');
 if((await c.query("SELECT to_regclass('septisense.replay_runs') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_runs');
 await c.query('DELETE FROM septisense.encounters');
 return (await c.query('DELETE FROM septisense.patients')).rowCount;
}

export async function seedDemoPatients(c){
 const seedRun = randomUUID();
 let count = 0;
 for(const p of demoPatients){
  await c.query('INSERT INTO septisense.patients(id,name,age,sex,bed) VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, age=EXCLUDED.age, sex=EXCLUDED.sex, bed=EXCLUDED.bed',[p.id,p.name,p.age,p.sex,p.bed]);
  await c.query('INSERT INTO septisense.encounters(id,patient_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[`ICU-${p.id}-01`,p.id]);
  await save(c,p.id,p.v,p.risk,seedRun);
  count++;
 }
 return count;
}

// Everything the Solana Blink needs about one prediction snapshot, including any alert raised in the same run.
export async function predictionForAction(id){
 const {rows:[row]}=await pool.query(`SELECT r.id, r.hash, r.risk, r.qsofa, r.sirs, p.id AS patient_id, p.name, a.id AS alert_id, a.status AS alert_status,
  (SELECT json_build_object('signature',b.signature,'account',b.account,'signed_at',b.signed_at) FROM septisense.blink_receipts b WHERE b.prediction_id=r.id ORDER BY b.signed_at DESC LIMIT 1) AS receipt
  FROM septisense.predictions r JOIN septisense.encounters e ON e.id=r.encounter_id JOIN septisense.patients p ON p.id=e.patient_id
  LEFT JOIN septisense.alerts a ON a.encounter_id=r.encounter_id AND a.run_id=r.run_id WHERE r.id=$1`,[id]);
 return row||null;
}

// Stores a verified signature and acknowledges the open alert (if any) on behalf of the signing wallet.
export async function recordBlinkReceipt(prediction,{signature,account,memo,cluster,slot}){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query('INSERT INTO septisense.blink_receipts(signature,prediction_id,account,memo,cluster,slot) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (signature) DO NOTHING',[signature,prediction.id,account,memo,cluster,slot??null]);
  let acknowledged=false;
  if(prediction.alert_id){
   const r=await c.query("UPDATE septisense.alerts SET status='acknowledged' WHERE id=$1 AND status='open' RETURNING id",[prediction.alert_id]);
   if(r.rowCount){acknowledged=true;await c.query("INSERT INTO septisense.alert_events(id,alert_id,event_type,actor) VALUES($1,$2,'acknowledged',$3)",[randomUUID(),prediction.alert_id,`solana:${account}`]);}
  }
  await c.query('COMMIT');
  return {acknowledged};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}

// One replayed day for one resident: the care log, its score (with reasons) and an alert when the score is high.
export async function writeNutritionDay(run,resident,log,score){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`${run.id}:${resident.id}:${log.day}`]);
  const logDate=new Date(new Date(run.started_at).getTime()+(log.day-1)*86400000).toISOString().slice(0,10);
  const number=resident.id.match(/\d+$/);
  await c.query('INSERT INTO septisense.patients(id,name,age,sex,bed,screening) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET screening=COALESCE(EXCLUDED.screening,septisense.patients.screening)',
   [resident.id,`Resident ${number?Number(number[0]):resident.id}`,Math.round(resident.profile.age||0),resident.profile.sex||'Unknown','Residence',resident.profile.screening?JSON.stringify(resident.profile.screening):null]);
  const encounter=`ICU-${resident.id}-01`;
  await c.query('INSERT INTO septisense.encounters(id,patient_id,admitted_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[encounter,resident.id,run.started_at]);
  const inserted=await c.query(`INSERT INTO septisense.nutrition_logs(run_id,patient_id,day,log_date,breakfast_pct,lunch_pct,dinner_pct,fluids_ml,weight_kg,appetite,chewing_difficulty,note)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING RETURNING day`,
   [run.id,resident.id,log.day,logDate,log.breakfast_pct,log.lunch_pct,log.dinner_pct,log.fluids_ml,log.weight_kg,log.appetite,log.chewing_difficulty,log.note]);
  if(!inserted.rowCount){await c.query('COMMIT');return false}
  const details={day:log.day,log_date:logDate,points:score.points,tier:score.tier,drivers:score.drivers,summary:score.summary,profile:resident.profile};
  const canonical=JSON.stringify({resident_id:resident.id,run_id:run.id,day:log.day,log,risk:score.risk,drivers:score.drivers,model_version:MODEL_VERSION});
  const hash=createHash('sha256').update(canonical).digest('hex'),prediction=randomUUID();
  await c.query(`INSERT INTO septisense.predictions(id,encounter_id,predicted_at,run_id,risk,qsofa,sirs,snapshot,canonical,hash,model_version,details) VALUES($1,$2,now(),$3,$4,NULL,NULL,$5,$6,$7,$8,$9)`,
   [prediction,encounter,run.id,score.risk,JSON.stringify(log),canonical,hash,MODEL_VERSION,JSON.stringify(details)]);
  if(score.risk>=70){
   const a=await c.query('INSERT INTO septisense.alerts(id,prediction_id,encounter_id,run_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id',[randomUUID(),prediction,encounter,run.id]);
   if(a.rowCount)await c.query("INSERT INTO septisense.alert_events(id,alert_id,event_type) VALUES($1,$2,'created')",[randomUUID(),a.rows[0].id]);
  }
  await c.query('COMMIT');return true;
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}

// Daily care logs for the resident's most recent nutrition replay, each with that day's score.
export async function nutritionHistory(id){
 const latest=await pool.query('SELECT run_id FROM septisense.nutrition_logs WHERE patient_id=$1 ORDER BY ingested_at DESC LIMIT 1',[id]);
 if(!latest.rowCount)return {rows:[]};
 const run=latest.rows[0].run_id;
 const {rows}=await pool.query(`SELECT l.day, to_char(l.log_date,'YYYY-MM-DD') AS log_date, l.breakfast_pct, l.lunch_pct, l.dinner_pct, l.fluids_ml, l.weight_kg::float AS weight_kg, l.appetite, l.chewing_difficulty, l.note, r.risk
  FROM septisense.nutrition_logs l LEFT JOIN septisense.predictions r ON r.run_id=l.run_id AND r.encounter_id='ICU-'||l.patient_id||'-01' AND r.model_version='${MODEL_VERSION}' AND (r.details->>'day')::int=l.day
  WHERE l.patient_id=$1 AND l.run_id=$2 ORDER BY l.day`,[id,run]);
 return {run_id:run,rows};
}
