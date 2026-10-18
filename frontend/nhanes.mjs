// Loads the NHANES screening file (data/csv/data.csv) and turns each row into a readable resident screening profile.
// NHANES stores categories as number codes; blanks and "refused / don't know" codes stay missing (null), never zero.
import {readFile} from 'node:fs/promises';

const code = map => v => (v === null ? null : map[v] ?? null);
const yesNo = code({1: 'Yes', 2: 'No'});

const DECODE = {
  RIAGENDR: code({1: 'Male', 2: 'Female'}),
  RIDRETH3: code({1: 'Mexican American', 2: 'Other Hispanic', 3: 'Non-Hispanic White', 4: 'Non-Hispanic Black', 6: 'Non-Hispanic Asian', 7: 'Other / Multi-racial'}),
  DMDEDUC2: code({1: 'Less than 9th grade', 2: '9–11th grade', 3: 'High school / GED', 4: 'Some college / AA', 5: 'College graduate+'}),
  DMDMARTZ: code({1: 'Married / partner', 2: 'Widowed / divorced / separated', 3: 'Never married'}),
  RIDSTATR: code({1: 'Interviewed only', 2: 'Interviewed & examined'}),
  DR1DRSTZ: code({1: 'Reliable, complete', 2: 'Not reliable', 4: 'Breast-fed infant', 5: 'Not done'}),
  BAXPF11: code({1: 'Pass', 2: 'Fail'}),
};

// Screening field -> NHANES column. Numeric columns are copied as numbers; coded ones go through DECODE.
const NUMERIC = {
  income_ratio: 'INDFMPIR', weight_kg: 'BMXWT', bmi: 'BMXBMI', height_cm: 'BMXHT', arm_cm: 'BMXARMC', waist_cm: 'BMXWAIST', hip_cm: 'BMXHIP',
  kcal: 'DR1TKCAL', protein_g: 'DR1TPROT', carbs_g: 'DR1TCARB', fat_g: 'DR1TTFAT', fiber_g: 'DR1TFIBE', vit_d_ug: 'DR1TVD', b12_ug: 'DR1TVB12',
  calcium_mg: 'DR1TCALC', moisture_g: 'DR1TMOIS', sbp1: 'BPXOSY1', dbp1: 'BPXODI1', sbp2: 'BPXOSY2', dbp2: 'BPXODI2', sbp3: 'BPXOSY3', dbp3: 'BPXODI3',
  pulse: 'BPXOPLS1', balance_time_s: 'BAXTC11',
};
export const REQUIRED_COLUMNS = ['SEQN', 'RIDAGEYR', 'RIAGENDR', ...Object.values(NUMERIC)];

export function parseNhanesCsv(text, filename = 'data.csv') {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const header = lines.shift().split(',').map(h => h.trim());
  for (const c of REQUIRED_COLUMNS) if (!header.includes(c)) throw new Error(`${filename}: missing column ${c}`);
  const seen = new Set();
  return lines.map((line, i) => {
    const cells = line.split(',');
    if (cells.length !== header.length) throw new Error(`${filename}: row ${i + 2} has the wrong number of columns`);
    const row = {};
    header.forEach((h, j) => {
      const v = cells[j].trim();
      if (v === '' || /^(nan|na|null)$/i.test(v)) { row[h] = null; return; }
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`${filename}: invalid ${h} at row ${i + 2}`);
      row[h] = n;
    });
    if (!Number.isInteger(row.SEQN) || seen.has(row.SEQN)) throw new Error(`${filename}: SEQN must be a unique integer (row ${i + 2})`);
    seen.add(row.SEQN);
    return row;
  });
}

export async function readNhanes(file) { return parseNhanesCsv(await readFile(file, 'utf8'), file); }

// Readable screening profile using the same field names the dashboard shows.
export function screeningFromNhanes(row) {
  const s = {
    age: row.RIDAGEYR, age_top_coded: row.RIDAGEYR !== null && row.RIDAGEYR >= 80,
    sex: DECODE.RIAGENDR(row.RIAGENDR), race: DECODE.RIDRETH3(row.RIDRETH3), education: DECODE.DMDEDUC2(row.DMDEDUC2),
    marital: DECODE.DMDMARTZ(row.DMDMARTZ), exam_status: DECODE.RIDSTATR(row.RIDSTATR), recall_status: DECODE.DR1DRSTZ(row.DR1DRSTZ),
    balance_exam: row.BAXPF11 === null && row.BAXTC11 === null ? 'Not done' : 'Done',
    balance_test1: DECODE.BAXPF11(row.BAXPF11 ?? null),
    stands_unaided: yesNo(row.BAQ110 ?? null), dizzy_24h: yesNo(row.BAQ132 ?? null), dizzy_fall_12m: yesNo(row.BAQ140 ?? null),
    nhanes_seqn: row.SEQN, source: 'NHANES',
  };
  for (const [field, column] of Object.entries(NUMERIC)) s[field] = row[column] ?? null;
  return s;
}
