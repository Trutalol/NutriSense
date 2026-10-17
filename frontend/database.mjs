import pg from 'pg';
import {loadEnvFile} from 'node:process';
import {createHash, randomUUID} from 'node:crypto';
try { loadEnvFile(new URL('../.env', import.meta.url)); } catch(e) { if(e.code!=='ENOENT') throw e; }
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing from the project-root .env');
const url=new URL(process.env.DATABASE_URL);
// Honor the TLS mode configured in DATABASE_URL using PostgreSQL semantics.
url.searchParams.set('uselibpqcompat','true');
if(!url.searchParams.has('sslmode'))url.searchParams.set('sslmode','verify-full');
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
export async function patients(){return (await pool.query(`SELECT p.*, r.risk, r.snapshot AS v, r.hash, r.id AS prediction_id, a.id AS alert_id, a.status AS alert_status FROM septisense.patients p JOIN septisense.encounters e ON e.patient_id=p.id JOIN LATERAL (SELECT * FROM septisense.predictions WHERE encounter_id=e.id ORDER BY predicted_at DESC LIMIT 1) r ON true LEFT JOIN septisense.alerts a ON a.encounter_id=e.id AND a.run_id=r.run_id ORDER BY p.id='0402' DESC,p.id`)).rows}
export async function audit(){return (await pool.query(`SELECT ev.created_at AS time, e.patient_id || ' alert ' || ev.event_type AS text, p.hash FROM septisense.alert_events ev JOIN septisense.alerts a ON a.id=ev.alert_id JOIN septisense.encounters e ON e.id=a.encounter_id JOIN septisense.predictions p ON p.id=a.prediction_id ORDER BY ev.created_at DESC LIMIT 100`)).rows}
export async function acknowledge(id){const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query("UPDATE septisense.alerts SET status='acknowledged' WHERE id=$1 AND status='open' RETURNING id",[id]);if(r.rowCount)await c.query("INSERT INTO septisense.alert_events(id,alert_id,event_type) VALUES($1,$2,'acknowledged')",[randomUUID(),id]);await c.query('COMMIT');return {acknowledged:!!r.rowCount}}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}


// Caller owns the transaction so dependent records are removed atomically.
export async function deletePatientData(c,id){
 const found=await c.query('SELECT id FROM septisense.patients WHERE id=$1 FOR UPDATE',[id]);
 if(!found.rowCount)return false;
 const encounters=(await c.query('SELECT id FROM septisense.encounters WHERE patient_id=$1',[id])).rows.map(r=>r.id);
 await c.query('DELETE FROM septisense.alert_events WHERE alert_id IN (SELECT id FROM septisense.alerts WHERE encounter_id=ANY($1::text[]))',[encounters]);
 for(const table of ['alerts','predictions','observations'])await c.query(`DELETE FROM septisense.${table} WHERE encounter_id=ANY($1::text[])`,[encounters]);
 if((await c.query("SELECT to_regclass('septisense.replay_rows') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_rows WHERE patient_id=$1',[id]);
 await c.query('DELETE FROM septisense.encounters WHERE patient_id=$1',[id]);
 await c.query('DELETE FROM septisense.patients WHERE id=$1',[id]);
 return true;
}

export async function deleteAllPatientData(c){
 // Lock patient writes until the deletion transaction commits.
 await c.query('LOCK TABLE septisense.patients IN EXCLUSIVE MODE');
 for(const table of ['alert_events','alerts','predictions','observations'])await c.query(`DELETE FROM septisense.${table}`);
 if((await c.query("SELECT to_regclass('septisense.replay_rows') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_rows');
 if((await c.query("SELECT to_regclass('septisense.replay_runs') AS name")).rows[0].name)await c.query('DELETE FROM septisense.replay_runs');
 await c.query('DELETE FROM septisense.encounters');
 return (await c.query('DELETE FROM septisense.patients')).rowCount;
}
