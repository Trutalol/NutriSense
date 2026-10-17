import {createHash,randomUUID} from 'node:crypto';
import {pool} from './database.mjs';
import {vitals,partialScores,observationValues,ADDED_COLUMNS} from './psv.mjs';

export async function migrateReplay(){
 await pool.query(`
 ALTER TABLE septisense.predictions ALTER COLUMN risk DROP NOT NULL;
 ALTER TABLE septisense.predictions ALTER COLUMN qsofa DROP NOT NULL;
 ALTER TABLE septisense.predictions ALTER COLUMN sirs DROP NOT NULL;
 CREATE TABLE IF NOT EXISTS septisense.replay_runs(id uuid PRIMARY KEY, started_at timestamptz NOT NULL, manifest jsonb NOT NULL);
 CREATE TABLE IF NOT EXISTS septisense.replay_rows(run_id uuid NOT NULL REFERENCES septisense.replay_runs(id), patient_id text NOT NULL REFERENCES septisense.patients(id), source_hour integer NOT NULL, observed_at timestamptz NOT NULL, ingested_at timestamptz NOT NULL DEFAULT now(), raw_data jsonb NOT NULL, PRIMARY KEY(run_id,patient_id,source_hour));
 `);
 // Backfill typed PSV columns for observations replayed before those columns existed.
 // Every replayed row has an ICULOS, so a NULL icu_los_hours marks a row that has not been backfilled.
 await pool.query(`UPDATE septisense.observations o SET ${ADDED_COLUMNS.map(([key,column])=>`${column}=(r.raw_data->>'${key}')::double precision`).join(', ')}
  FROM septisense.replay_rows r
  WHERE o.icu_los_hours IS NULL AND o.run_id=r.run_id AND o.observed_at=r.observed_at AND o.encounter_id='ICU-'||r.patient_id||'-01'`);
}
export async function openRun(id,manifest,start){
 await pool.query('INSERT INTO septisense.replay_runs VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,start,JSON.stringify(manifest)]);
 const {rows:[run]}=await pool.query('SELECT * FROM septisense.replay_runs WHERE id=$1',[id]);
 if(JSON.stringify(run.manifest)!==JSON.stringify(manifest))throw Error('This run ID belongs to different input files; start a new run.');
 return run;
}
export async function writeHour(run, patient, row){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  // Serialize retries of a single replay hour, including multiple replay processes.
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`${run.id}:${patient.id}:${row.ICULOS}`]);
  const timestamp=new Date(new Date(run.started_at).getTime()+(row.ICULOS-1)*3600000).toISOString();
  await c.query('INSERT INTO septisense.patients(id,name,age,sex,bed) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[patient.id,`Patient ${patient.id.match(/\d+$/) ? Number(patient.id.match(/\d+$/)[0]) : patient.id}`,Math.round(row.Age||0),row.Gender===1?'Male':row.Gender===0?'Female':'Unknown','Dataset']);
  const inserted=await c.query('INSERT INTO septisense.replay_rows(run_id,patient_id,source_hour,observed_at,raw_data) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING source_hour',[run.id,patient.id,row.ICULOS,timestamp,JSON.stringify(row)]);
  if(!inserted.rowCount){await c.query('COMMIT');return false}
  const encounter=`ICU-${patient.id}-01`;
  await c.query('INSERT INTO septisense.encounters(id,patient_id,admitted_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[encounter,patient.id,run.started_at]);
  const v=vitals(row),s=partialScores(v);
  // All PSV columns go into typed observation columns; GCS is not in the dataset and stays NULL.
  const observation={observed_at:timestamp,id:randomUUID(),encounter_id:encounter,run_id:run.id,gcs:null,...observationValues(row)};
  const names=Object.keys(observation);
  await c.query(`INSERT INTO septisense.observations(${names.join(',')}) VALUES(${names.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(observation));
  const canonical=JSON.stringify({patient_id:patient.id,run_id:run.id,source_hour:row.ICULOS,observed_at:timestamp,raw_data:row});
  const hash=createHash('sha256').update(canonical).digest('hex');
  // Store an unscored snapshot so the existing dashboard can show this hour.
  // No invented probability or diagnostic alert is generated from outcome labels.
  await c.query(`INSERT INTO septisense.predictions(id,encounter_id,predicted_at,run_id,risk,qsofa,sirs,snapshot,canonical,hash,model_version) VALUES($1,$2,now(),$3,NULL,$4,$5,$6,$7,$8,'psv_unscored_v1')`,[randomUUID(),encounter,run.id,s.qsofa,s.sirs,JSON.stringify(v),canonical,hash]);
  await c.query('COMMIT');return true;
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
