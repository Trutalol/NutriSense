import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {readPsv} from './psv.mjs';

const args=process.argv.slice(2);
const help=`Usage: npm.cmd run replay -- --folder "C:\\data\\patients" --interval 5
Options:
  --folder PATH        PSV folder (default: project data/psv)
  --interval SECONDS    Wall-clock delay between source hours (default: 5)
  --max-hours N         Stop after N replay ticks
  --run-id UUID         Resume an interrupted run; committed hours are skipped
  --start ISO_TIME      Synthetic time assigned to ICU hour 1 (new runs only)
  --dry-run            Validate every file without connecting or uploading
Each tick uploads the matching ICULOS hour from every file. Ctrl+C stops safely.`;
async function main(){
 if(args.includes('--help')){console.log(help);return}
 const options={};for(let i=0;i<args.length;i++){const key=args[i];if(key==='--dry-run'){options[key]=true;continue}if(!['--folder','--interval','--max-hours','--run-id','--start'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error(`Invalid argument ${key}\n${help}`);options[key]=args[++i]}
 options['--folder']??=fileURLToPath(new URL('../data/psv/',import.meta.url));
 const interval=Number(options['--interval']??5),limit=Number(options['--max-hours']??Infinity);
 if(!Number.isFinite(interval)||interval<0.1||!(limit===Infinity||Number.isInteger(limit)&&limit>0))throw Error('Interval must be at least 0.1 seconds and max-hours a positive integer.');
 const folder=path.resolve(options['--folder']);const names=(await readdir(folder)).filter(f=>/\.psv$/i.test(f)).sort();
 if(!names.length)throw Error('No .psv files found in this folder.');
 const files=[];
 for(const name of names){const id=path.basename(name,path.extname(name));if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id))throw Error(`Unsupported patient filename: ${name}`);const file=path.join(folder,name),rows=await readPsv(file);if(!rows.length)throw Error(`${name} has no observations`);files.push({id,rows,byHour:new Map(rows.map(r=>[r.ICULOS,r])),sha256:createHash('sha256').update(await readFile(file)).digest('hex')});}
 const maxHour=Math.max(...files.map(f=>f.rows.at(-1).ICULOS));
 console.log(`Validated ${files.length} patients, ${files.reduce((sum,f)=>sum+f.rows.length,0)} rows; ICU hours 1–${maxHour}. Missing values stay NULL.`);
 if(options['--dry-run'])return;
 const id=options['--run-id']??randomUUID();if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid run ID');
 const start=options['--start']?new Date(options['--start']):new Date();if(Number.isNaN(start.getTime()))throw Error('Invalid start timestamp');
 const {initialize,pool}=await import('./database.mjs');
 const {migrateReplay,openRun,writeHour}=await import('./replay-store.mjs');
 let stopped=false;const controller=new AbortController();process.once('SIGINT',()=>{stopped=true;controller.abort();console.log('\nFinishing current write, then stopping…')});
 try{
  await initialize();await migrateReplay();const run=await openRun(id,files.map(f=>({id:f.id,sha256:f.sha256})),start.toISOString());
  console.log(`Run ID: ${run.id}\nResume with --run-id ${run.id}`);
  const existing=await pool.query('SELECT patient_id,source_hour FROM septisense.replay_rows WHERE run_id=$1',[id]);const done=new Set(existing.rows.map(r=>`${r.patient_id}:${r.source_hour}`));
  let ticks=0,total=0;
  for(let hour=1;hour<=maxHour&&!stopped&&ticks<limit;hour++){
   const pending=files.filter(f=>f.byHour.has(hour)&&!done.has(`${f.id}:${hour}`));if(!pending.length)continue;
   let count=0;for(const f of pending){if(stopped)break;if(await writeHour(run,f,f.byHour.get(hour)))count++}
   ticks++;total+=count;console.log(`ICU hour ${hour}: saved ${count} patient observations (${total} this session)`);
   if(!stopped&&hour<maxHour&&ticks<limit)await sleep(interval*1000,undefined,{signal:controller.signal}).catch(e=>{if(e.name!=='AbortError')throw e});
  }
  console.log(`${stopped?'Stopped':'Replay finished'}: ${total} new observations. Run ${id}`);
 }finally{await pool.end()}
}
main().catch(e=>{console.error('Replay failed:',e.code||e.message);process.exitCode=1});
