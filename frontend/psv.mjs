import {readFile} from 'node:fs/promises';

export function parsePsv(text, filename='input.psv') {
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 const headers=lines.shift().split('|').map(x=>x.trim());
 for(const key of ['HR','O2Sat','Temp','SBP','Resp','WBC','Lactate','Age','Gender','ICULOS'])
  if(!headers.includes(key))throw Error(`${filename}: missing column ${key}`);
 if(new Set(headers).size!==headers.length)throw Error(`${filename}: duplicate columns`);
 let previous=0;
 return lines.map((line,index)=>{
  const cells=line.split('|');
  if(cells.length!==headers.length)throw Error(`${filename}: row ${index+2} has the wrong number of columns`);
  const row=Object.fromEntries(headers.map((key,i)=>{
   const value=cells[i].trim();
   if(value===''||/^(nan|null|na)$/i.test(value))return [key,null];
   const number=Number(value);
   if(!Number.isFinite(number))throw Error(`${filename}: invalid ${key} at row ${index+2}`);
   return [key,number];
  }));
  if(!Number.isInteger(row.ICULOS)||row.ICULOS<=previous)throw Error(`${filename}: ICULOS must be positive and strictly increasing`);
  previous=row.ICULOS;
  return row;
 });
}
export async function readPsv(file){return parsePsv(await readFile(file,'utf8'),file)}
export function vitals(row){return [row.HR,row.Resp,row.SBP,row.Temp,row.O2Sat,null,row.WBC,row.Lactate]}
// Missing criteria stay unknown. SepsisLabel is never an input to scoring.
export function partialScores(v){
 const [hr,rr,sbp,temp,,gcs,wbc]=v;
 const q=[sbp===null?null:sbp<=100,rr===null?null:rr>=22,gcs===null?null:gcs<15];
 const s=[temp===null?null:temp>38||temp<36,hr===null?null:hr>90,rr===null?null:rr>20,wbc===null?null:wbc>12||wbc<4];
 return {qsofa:q.includes(null)?null:q.filter(Boolean).length,sirs:s.includes(null)?null:s.filter(Boolean).length};
}
