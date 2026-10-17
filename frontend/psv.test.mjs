import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePsv,vitals,partialScores} from './psv.mjs';
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
