import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {initialize,patients,record,audit,acknowledge,pool,deletePatientData,deleteAllPatientData,seedDemoPatients,predictionForAction,recordBlinkReceipt,nutritionHistory} from './database.mjs';
import {ACTION_HEADERS,CLUSTER,parsePublicKey,latestBlockhash,memoMessage,unsignedTransaction,reviewMemo,verifyMemoTransaction,explorerUrl} from './solana.mjs';
const assets={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css'],'/logo.png':['logo.png','image/png']};
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>16000)throw Object.assign(new Error('Request too large'),{status:413})}try{return JSON.parse(text)}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---- Solana Actions (Blink) ----
// Spec: GET returns metadata, POST {account} returns an unsigned transaction, and the "next" POST
// {account, signature} verifies the signed transaction on devnet before anything is recorded.
function actionJson(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...ACTION_HEADERS});res.end(JSON.stringify(value))}
// Absolute base URL as the client sees it (works behind a tunnel such as cloudflared or ngrok).
function publicBase(req){const proto=String(req.headers['x-forwarded-proto']||'http').split(',')[0].trim();const host=String(req.headers['x-forwarded-host']||req.headers.host).split(',')[0].trim();return `${proto}://${host}`}
const signaturePattern=/^[1-9A-HJ-NP-Za-km-z]{64,90}$/;
async function handleAction(req,res,route){
 const id=new URL(req.url,'http://localhost').searchParams.get('prediction');
 if(!uuid.test(id||''))return actionJson(res,400,{message:'A valid prediction ID is required'});
 const prediction=await predictionForAction(id);
 if(!prediction)return actionJson(res,404,{message:'This assessment no longer exists'});
 const icon=`${publicBase(req)}/logo.png`,memo=reviewMemo(prediction);
 const href=`/api/actions/nutrition-review?prediction=${id}`;
 if(route==='/api/actions/nutrition-review'&&req.method==='GET'){
  const risk=prediction.risk===null?'malnutrition risk not scored':`malnutrition risk ${prediction.risk}/100`;
  const alert=prediction.alert_status==='open'?' Signing also acknowledges the open malnutrition alert.':'';
  const last=prediction.receipt?` Last signed by ${prediction.receipt.account.slice(0,4)}…${prediction.receipt.account.slice(-4)}.`:'';
  return actionJson(res,200,{type:'action',icon,title:`Nutrition review · ${prediction.name}`,label:'Sign review',
   description:`Sign this resident's latest nutrition assessment (${risk}) on Solana ${CLUSTER}. The on-chain memo holds only the assessment ID and its SHA-256 hash, no resident details.${alert}${last}`,
   links:{actions:[{type:'transaction',label:'Sign review on Solana',href}]}});
 }
 if(route==='/api/actions/nutrition-review'&&req.method==='POST'){
  const b=await body(req);const payer=parsePublicKey(b.account);
  const transaction=unsignedTransaction(memoMessage(payer,await latestBlockhash(),memo));
  return actionJson(res,200,{type:'transaction',transaction,message:`Nutrition review for ${prediction.name} ready to sign on ${CLUSTER}`,
   links:{next:{type:'post',href:`/api/actions/nutrition-review/confirm?prediction=${id}`}}});
 }
 if(route==='/api/actions/nutrition-review/confirm'&&req.method==='POST'){
  const b=await body(req);parsePublicKey(b.account);
  if(typeof b.signature!=='string'||!signaturePattern.test(b.signature))return actionJson(res,400,{message:'Invalid transaction signature'});
  const verified=await verifyMemoTransaction(b.signature,b.account,memo);
  if(!verified)return actionJson(res,504,{message:'The transaction was sent but not confirmed on devnet yet. Try again in a moment.'});
  const {acknowledged}=await recordBlinkReceipt(prediction,{signature:b.signature,account:b.account,memo,cluster:CLUSTER,slot:verified.slot});
  return actionJson(res,200,{type:'completed',icon,title:'Review signed on Solana',label:'Signed',
   description:`Verified on ${CLUSTER} in slot ${verified.slot}.${acknowledged?' The malnutrition alert is now acknowledged.':''}`,
   signature:b.signature,explorer:explorerUrl(b.signature),acknowledged});
 }
 return actionJson(res,405,{message:'Method not allowed'});
}
const server=http.createServer(async(req,res)=>{
 try{
 const route=new URL(req.url,'http://localhost').pathname;
 // Blink endpoints are public by design (wallets and dial.to call them cross-origin); everything else is same-origin only.
 const actionRoute=route==='/actions.json'||route.startsWith('/api/actions/');
 if(actionRoute){
  if(req.method==='OPTIONS'){res.writeHead(204,ACTION_HEADERS);return res.end()}
  if(route==='/actions.json'&&req.method==='GET')return actionJson(res,200,{rules:[{pathPattern:'/api/actions/**',apiPath:'/api/actions/**'}]});
  try{return await handleAction(req,res,route)}
  catch(e){console.error('Action failed:',e.status||e.code||e.message);return actionJson(res,e.status||503,{message:e.status?e.message:'Patient database or Solana devnet unavailable. Please retry.'})}
 }
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
 // Vitals come from the newest PSV replay for this resident (nutrition replays have no vitals).
 const latest=await pool.query('SELECT run_id FROM septisense.replay_rows WHERE patient_id=$1 ORDER BY ingested_at DESC LIMIT 1',[id]);
 if(!latest.rowCount)return json(res,200,{rows:[]});
 const result=await pool.query('SELECT source_hour AS hour, observed_at, raw_data FROM septisense.replay_rows WHERE patient_id=$1 AND run_id=$2 ORDER BY source_hour',[id,latest.rows[0].run_id]);
 return json(res,200,{run_id:latest.rows[0].run_id,rows:result.rows});
 }
 if(route==='/api/nutrition-history'&&req.method==='GET'){
 const id=new URL(req.url,'http://localhost').searchParams.get('patient');
 if(!id||!/^[a-zA-Z0-9_-]{1,64}$/.test(id))return json(res,400,{error:'Invalid resident ID'});
 return json(res,200,await nutritionHistory(id));
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
