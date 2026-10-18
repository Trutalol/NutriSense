import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseNhanesCsv, screeningFromNhanes, REQUIRED_COLUMNS} from './nhanes.mjs';
import {declineChance} from './generate-nutrition.mjs';
import {generateResident} from './nutrition.mjs';

const header = 'SEQN,RIDAGEYR,RIAGENDR,RIDRETH3,DMDEDUC2,DMDMARTZ,INDFMPIR,RIDSTATR,BMXWT,BMXBMI,BMXHT,BMXARMC,BMXWAIST,BMXHIP,DR1DRSTZ,DR1TKCAL,DR1TPROT,DR1TCARB,DR1TTFAT,DR1TFIBE,DR1TVD,DR1TVB12,DR1TCALC,DR1TMOIS,BPXOSY1,BPXODI1,BPXOSY2,BPXODI2,BPXOSY3,BPXODI3,BPXOPLS1,BAXPF11,BAXTC11,BAQ110,BAQ132,BAQ140,MALNUTRITION_PROBABILITY_SYNTHETIC,HAS_MALNUTRITION';
const full = '130379,66,1,3,5,1,5,2,101.8,33.5,174.2,33.7,114.7,112.4,1,2741,86.45,314.86,67.18,29.6,0.4,2.89,674,4115.06,121,84,117,76,113,76,72,1,15,1,2,2,0.36,0';
const sparse = '130500,80,2,7,9,77,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0.6,1';

test('decodes NHANES codes into readable labels', () => {
  const [row] = parseNhanesCsv(`${header}\r\n${full}\r\n`);
  const s = screeningFromNhanes(row);
  assert.equal(s.sex, 'Male'); assert.equal(s.race, 'Non-Hispanic White'); assert.equal(s.education, 'College graduate+');
  assert.equal(s.marital, 'Married / partner'); assert.equal(s.exam_status, 'Interviewed & examined'); assert.equal(s.recall_status, 'Reliable, complete');
  assert.equal(s.balance_exam, 'Done'); assert.equal(s.balance_test1, 'Pass'); assert.equal(s.stands_unaided, 'Yes'); assert.equal(s.dizzy_24h, 'No');
  assert.equal(s.weight_kg, 101.8); assert.equal(s.kcal, 2741); assert.equal(s.sbp1, 121); assert.equal(s.pulse, 72);
  assert.equal(s.age_top_coded, false);
});

test('blanks and refused / don\'t know codes stay missing, never zero', () => {
  const [row] = parseNhanesCsv(`${header}\n${sparse}`);
  const s = screeningFromNhanes(row);
  assert.equal(s.age, 80); assert.equal(s.age_top_coded, true);
  assert.equal(s.education, null); assert.equal(s.marital, null); // 9 and 77 = don't know / refused
  for (const k of ['weight_kg', 'bmi', 'kcal', 'sbp1', 'income_ratio', 'balance_test1', 'stands_unaided']) assert.equal(s[k], null, k);
  assert.equal(s.balance_exam, 'Not done');
  assert.equal(s.exam_status, 'Interviewed only');
});

test('rejects malformed NHANES files', () => {
  assert.throws(() => parseNhanesCsv('SEQN,RIDAGEYR\n1,70'), /missing column/);
  assert.throws(() => parseNhanesCsv(`${header}\n${full}\n${full}`), /unique/);
  assert.throws(() => parseNhanesCsv(`${header}\n1,2`), /wrong number of columns/);
  assert.ok(REQUIRED_COLUMNS.includes('BMXARMC'));
});

test('care logs start from the real NHANES weight and height', () => {
  const [row] = parseNhanesCsv(`${header}\n${full}`);
  const r = generateResident({id: 'r130379', age: 66, sex: 'Male', screening: screeningFromNhanes(row), baseline: {height_cm: 174.2, weight_kg: 101.8, kcal: 2741}, extra: {wing: 'Birch', room: 101}});
  assert.equal(r.profile.height_cm, 174.2);
  assert.ok(Math.abs(r.logs[0].weight_kg - 101.8) < 1, `day 1 weight ${r.logs[0].weight_kg}`);
  assert.equal(r.profile.screening.source, 'NHANES');
  assert.equal(r.profile.wing, 'Birch');
});

test('better-nourished residents are less likely to decline', () => {
  assert.ok(declineChance(0.1) < declineChance(0.5) && declineChance(0.5) < declineChance(0.85));
  assert.ok(declineChance(0.06) >= 0.05 && declineChance(0.99) <= 0.35);
});
