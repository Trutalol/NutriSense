import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePsv,vitals,partialScores,observationValues,PSV_COLUMNS} from './psv.mjs';
const header='HR|O2Sat|Temp|SBP|Resp|WBC|Lactate|Age|Gender|ICULOS|SepsisLabel';
test('missing observations stay unknown, including unavailable GCS',()=>{
 const [r]=parsePsv(header+'\nNaN|NaN|NaN|NaN|NaN|NaN|NaN|83.14|0|1|0');
 assert.deepEqual(vitals(r),Array(8).fill(null));assert.deepEqual(partialScores(vitals(r)),{qsofa:null,sirs:null});
});
test('outcome label never enters vitals or scores',()=>{
 const a=parsePsv(header+'\n125|91|38.9|85|28|15|3.8|83|0|1|0')[0];
 const b={...a,SepsisLabel:1};assert.deepEqual(vitals(a),vitals(b));
 assert.deepEqual(partialScores(vitals(a)),{qsofa:null,sirs:4});
});
test('rejects malformed, infinite and duplicate-hour rows',()=>{
 assert.throws(()=>parsePsv(header+'\n1|2'),/number of columns/);
 assert.throws(()=>parsePsv(header+'\nInfinity|91|38|85|28|15|3|83|0|1|0'),/invalid HR/);
 const line='125|91|38|85|28|15|3|83|0|1|0';
 assert.throws(()=>parsePsv(header+'\n'+line+'\n'+line),/strictly increasing/);
});
test('supports BOM, CRLF, reordered columns and source-hour gaps',()=>{
 const rows=parsePsv('\uFEFF'+header+'\r\n75|99|37|120|16|7|1|50|1|1|0\r\n76|98|37|119|17|7|1|50|1|3|0\r\n');
 assert.equal(rows.length,2);assert.equal(rows[1].ICULOS,3);
});
test('every PhysioNet column maps to a typed observation column',()=>{
 const full='HR|O2Sat|Temp|SBP|MAP|DBP|Resp|EtCO2|BaseExcess|HCO3|FiO2|pH|PaCO2|SaO2|AST|BUN|Alkalinephos|Calcium|Chloride|Creatinine|Bilirubin_direct|Glucose|Lactate|Magnesium|Phosphate|Potassium|Bilirubin_total|TroponinI|Hct|Hgb|PTT|WBC|Fibrinogen|Platelets|Age|Gender|Unit1|Unit2|HospAdmTime|ICULOS|SepsisLabel';
 assert.deepEqual(PSV_COLUMNS.map(([key])=>key),full.split('|'));
 assert.equal(new Set(PSV_COLUMNS.map(([,column])=>column)).size,PSV_COLUMNS.length);
 const [r]=parsePsv(full+'\n93|92.5|NaN|110|76|56|22|NaN|-2|24|0.4|7.38|NaN|NaN|NaN|18|NaN|NaN|NaN|1.1|NaN|142|NaN|NaN|NaN|4.1|NaN|NaN|NaN|NaN|NaN|NaN|NaN|210|73|1|1|0|-214.64|2|0');
 const o=observationValues(r);
 assert.equal(o.map_mmhg,76);assert.equal(o.base_excess_mmol_l,-2);assert.equal(o.ph,7.38);assert.equal(o.platelets_10e9_l,210);
 assert.equal(o.temperature_c,null);assert.equal(o.hosp_adm_time_hours,-214.64);assert.equal(o.icu_los_hours,2);
 // Older narrow files still map; absent columns stay null rather than zero.
 assert.equal(observationValues(parsePsv(header+'\n75|99|37|120|16|7|1|50|1|1|0')[0]).map_mmhg,null);
});
