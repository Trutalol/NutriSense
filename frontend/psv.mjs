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

// Every PhysioNet PSV column mapped to its typed septisense.observations column.
// The first seven reuse the original column names; the rest are added by initialize().
// SepsisLabel is stored as the dataset's outcome label only; it is never a scoring input.
export const PSV_COLUMNS=[
 ['HR','heart_rate'],['O2Sat','spo2_pct'],['Temp','temperature_c'],['SBP','systolic_bp'],['MAP','map_mmhg'],['DBP','diastolic_bp'],['Resp','respiratory_rate'],['EtCO2','etco2_mmhg'],
 ['BaseExcess','base_excess_mmol_l'],['HCO3','hco3_mmol_l'],['FiO2','fio2'],['pH','ph'],['PaCO2','paco2_mmhg'],['SaO2','sao2_pct'],
 ['AST','ast_iu_l'],['BUN','bun_mg_dl'],['Alkalinephos','alkaline_phosphatase_iu_l'],['Calcium','calcium_mg_dl'],['Chloride','chloride_mmol_l'],['Creatinine','creatinine_mg_dl'],
 ['Bilirubin_direct','bilirubin_direct_mg_dl'],['Glucose','glucose_mg_dl'],['Lactate','lactate_mmol_l'],['Magnesium','magnesium_mg_dl'],['Phosphate','phosphate_mg_dl'],['Potassium','potassium_mmol_l'],
 ['Bilirubin_total','bilirubin_total_mg_dl'],['TroponinI','troponin_i_ng_ml'],['Hct','hematocrit_pct'],['Hgb','hemoglobin_g_dl'],['PTT','ptt_seconds'],['WBC','wbc_10e9_l'],['Fibrinogen','fibrinogen_mg_dl'],['Platelets','platelets_10e9_l'],
 ['Age','age_years'],['Gender','gender'],['Unit1','unit1_micu'],['Unit2','unit2_sicu'],['HospAdmTime','hosp_adm_time_hours'],['ICULOS','icu_los_hours'],['SepsisLabel','sepsis_label']
];
const ORIGINAL_COLUMNS=new Set(['heart_rate','respiratory_rate','systolic_bp','temperature_c','spo2_pct','wbc_10e9_l','lactate_mmol_l']);
export const ADDED_COLUMNS=PSV_COLUMNS.filter(([,column])=>!ORIGINAL_COLUMNS.has(column));
// Typed values for every PSV column; columns absent from a file stay null.
export function observationValues(row){return Object.fromEntries(PSV_COLUMNS.map(([key,column])=>[column,row[key]??null]))}
