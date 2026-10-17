import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {initialize,patients,record,audit,acknowledge,pool,deletePatientData,deleteAllPatientData,seedDemoPatients} from './database.mjs';
const assets={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>16000)throw Object.assign(new Error('Request too large'),{status:413})}try{return JSON.parse(text)}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const server=http.createServer(async(req,res)=>{
 try{
 const route=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Origin not allowed'});
 if(route==='/api/seed'&&req.method==='POST'){
 const c=await pool.connect();try{await c.query('BEGIN');const count=await seedDemoPatients(c);await c.query('COMMIT');return json(res,200,{seeded:true,count});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
 }
 if(route==='/api/delete-all-patients'&&req.method==='POST'){
 const b=await body(req);if(b.confirm!=='DELETE ALL')return json(res,400,{error:'Explicit DELETE ALL confirmation is required'});
 const c=await pool.connect();try{await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");const count=await deleteAllPatientData(c);await c.query('COMMIT');return json(res,200,{deleted:true,count});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
 }
 if(route==='/api/delete-patient'&&req.method==='POST'){
 const b=await body(req);
 if(typeof b.patient_id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(b.patient_id)||b.confirm!==true)return json(res,400,{error:'Patient ID and explicit confirmation are required'});
 const c=await pool.connect();
 try{await c.query('BEGIN');const deleted=await deletePatientData(c,b.patient_id);await c.query('COMMIT');return json(res,deleted?200:404,deleted?{deleted:true}:{error:'Patient not found'});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
 }
 if(route==='/api/patients'&&req.method==='GET')return json(res,200,await patients());
 if(route==='/api/vital-history'&&req.method==='GET'){
 const id=new URL(req.url,'http://localhost').searchParams.get('patient');
 if(!id||!/^[a-zA-Z0-9_-]{1,64}$/.test(id))return json(res,400,{error:'Invalid patient ID'});
 const latest=await pool.query('SELECT r.run_id FROM septisense.predictions r JOIN septisense.encounters e ON e.id=r.encounter_id WHERE e.patient_id=$1 ORDER BY r.predicted_at DESC LIMIT 1',[id]);
 if(!latest.rowCount)return json(res,200,{rows:[]});
 const result=await pool.query('SELECT source_hour AS hour, observed_at, raw_data FROM septisense.replay_rows WHERE patient_id=$1 AND run_id=$2 ORDER BY source_hour',[id,latest.rows[0].run_id]);
 return json(res,200,{run_id:latest.rows[0].run_id,rows:result.rows});
 }
 if(route==='/api/audit'&&req.method==='GET')return json(res,200,await audit());
 if(route==='/api/health'&&req.method==='GET'){await pool.query('SELECT 1');return json(res,200,{database:'connected'})}
 if(route==='/api/observations'&&req.method==='POST'){
 const b=await body(req);if(!/^\d{4}$/.test(b.id)||!uuid.test(b.run_id)||!Number.isInteger(b.risk)||b.risk<0||b.risk>100||!Array.isArray(b.v)||b.v.length!==8||!b.v.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0))return json(res,400,{error:'Invalid synthetic observation'});
 return json(res,201,await record(b.id,b.v,b.risk,b.run_id));
 }
 if(route==='/api/acknowledge'&&req.method==='POST'){const b=await body(req);if(!uuid.test(b.alert_id))return json(res,400,{error:'Invalid alert'});return json(res,200,await acknowledge(b.alert_id))}
 if(req.method==='GET'&&assets[route]){const [file,type]=assets[route];const contents=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});return res.end(contents)}
 json(res,404,{error:'Not found'});
 }catch(e){console.error('Request failed:',e.code||e.status||'database error');json(res,e.status||503,{error:e.status?e.message:'Database unavailable. Please retry.'})}
});
let port=Number(process.env.PORT)||5173;
server.on('error',e=>{if(e.code==='EADDRINUSE'&&port<5193){console.log(`Port ${port} is in use; trying ${port+1}...`);server.listen(++port,'127.0.0.1')}else{console.error('Server failed:',e.code);pool.end();process.exitCode=1}});
server.on('listening',()=>console.log(`Tiger Data connected. Local: http://127.0.0.1:${port}`));
try{await initialize();server.listen(port,'127.0.0.1')}catch(e){console.error('Database initialization failed:',e.code||e.name);await pool.end();process.exitCode=1}
