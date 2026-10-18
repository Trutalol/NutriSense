// NutriSense: daily nutrition care logs and a transparent malnutrition early-warning score.
// Pure functions only (no database), shared by the generator, the replay and the tests.

export const MODEL_VERSION = 'nutrition_rules_v1';
export const LOG_COLUMNS = ['day', 'breakfast_pct', 'lunch_pct', 'dinner_pct', 'fluids_ml', 'weight_kg', 'appetite', 'chewing_difficulty', 'note'];
export const PROFILE_COLUMNS = ['height_cm', 'diet'];

// ---------- CSV ----------
// One file per resident: a "# profile" line, then a header row and one row per day.
const csvCell = value => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function splitCsvLine(line) {
  const cells = []; let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { cells.push(cell); cell = ''; }
    else cell += c;
  }
  cells.push(cell);
  return cells;
}

export function formatNutritionCsv(profile, logs) {
  const lines = [`# profile ${JSON.stringify(profile)}`, LOG_COLUMNS.join(',')];
  for (const log of logs) lines.push(LOG_COLUMNS.map(k => csvCell(k === 'chewing_difficulty' ? (log[k] ? 1 : 0) : log[k])).join(','));
  return lines.join('\n') + '\n';
}

export function parseNutritionCsv(text, filename = 'input.csv') {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const profileLine = lines.shift();
  if (!profileLine?.startsWith('# profile')) throw new Error(`${filename}: missing "# profile" line`);
  let profile;
  const json = profileLine.slice('# profile'.length).trim();
  if (json.startsWith('{')) {
    try { profile = JSON.parse(json); } catch { throw new Error(`${filename}: profile line is not valid JSON`); }
  } else profile = Object.fromEntries(profileLine.split(',').slice(1).map(p => p.split('='))); // older key=value format
  profile.height_cm = Number(profile.height_cm);
  profile.age = Number(profile.age);
  if (!Number.isFinite(profile.height_cm) || profile.height_cm < 120 || profile.height_cm > 220) throw new Error(`${filename}: invalid height_cm`);
  const header = splitCsvLine(lines.shift() || '');
  for (const key of LOG_COLUMNS) if (!header.includes(key)) throw new Error(`${filename}: missing column ${key}`);
  let previous = 0;
  const logs = lines.map((line, i) => {
    const cells = splitCsvLine(line);
    if (cells.length !== header.length) throw new Error(`${filename}: row ${i + 3} has the wrong number of columns`);
    const raw = Object.fromEntries(header.map((k, j) => [k, cells[j]]));
    const num = (key, min, max) => {
      if (raw[key] === '') return null;
      const n = Number(raw[key]);
      if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${filename}: invalid ${key} at row ${i + 3}`);
      return n;
    };
    const log = {
      day: num('day', 1, 3650),
      breakfast_pct: num('breakfast_pct', 0, 100), lunch_pct: num('lunch_pct', 0, 100), dinner_pct: num('dinner_pct', 0, 100),
      fluids_ml: num('fluids_ml', 0, 6000), weight_kg: num('weight_kg', 20, 250),
      appetite: raw.appetite || null, chewing_difficulty: raw.chewing_difficulty === '1', note: raw.note || '',
    };
    if (!Number.isInteger(log.day) || log.day <= previous) throw new Error(`${filename}: day must be a positive, strictly increasing integer`);
    previous = log.day;
    return log;
  });
  return {profile, logs};
}

// ---------- Scoring ----------
const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const mealsOf = log => [log.breakfast_pct, log.lunch_pct, log.dinner_pct].filter(v => v !== null);
const round = (v, d = 0) => v === null ? null : Math.round(v * 10 ** d) / 10 ** d;

// Score for the latest day in `history` (ordered, oldest first). Uses only data recorded up to that day.
// Points follow the logic of common screening tools (MUST, MNA-SF, MDS 75% intake trigger):
// unplanned weight loss, low or falling intake, low BMI, low fluids, missed meals and chewing problems.
export function scoreNutrition(history, profile) {
  if (!history.length) return {risk: null, points: 0, tier: 'unscored', drivers: [], summary: {}};
  const today = history.at(-1).day;
  const window = (from, to) => history.filter(l => l.day > today - from && l.day <= today - to);
  const last7 = window(7, 0), prior = window(21, 7), last3 = window(3, 0), last2 = window(2, 0);

  const intake7 = mean(last7.flatMap(mealsOf));
  const baseline = prior.length >= 5 ? mean(prior.flatMap(mealsOf)) : null;
  const fluids3 = mean(last3.map(l => l.fluids_ml).filter(v => v !== null));
  const weights = history.filter(l => l.weight_kg !== null);
  const firstWeight = weights[0]?.weight_kg ?? null, latestWeight = weights.at(-1)?.weight_kg ?? null;
  const weightChangePct = firstWeight && weights.length > 1 ? (latestWeight - firstWeight) / firstWeight * 100 : null;
  const bmi = latestWeight && profile?.height_cm ? latestWeight / (profile.height_cm / 100) ** 2 : null;
  const missed = last2.flatMap(mealsOf).filter(v => v === 0).length;
  const chewingDays = last7.filter(l => l.chewing_difficulty).length;
  const latestNote = [...history].reverse().find(l => l.note)?.note || '';

  const drivers = [];
  const add = (points, key, label, detail) => drivers.push({points, key, label, detail});
  if (intake7 !== null) {
    if (intake7 < 50) add(3, 'intake', 'Eating less than half of meals', `7-day average ${round(intake7)}% of meals eaten`);
    else if (intake7 < 75) add(1, 'intake', 'Eating less than three-quarters of meals', `7-day average ${round(intake7)}% of meals eaten`);
  }
  if (intake7 !== null && baseline !== null) {
    const drop = baseline - intake7;
    if (drop >= 25) add(2, 'decline', 'Sharp drop from usual appetite', `Down ${round(drop)} points from usual ${round(baseline)}%`);
    else if (drop >= 15) add(1, 'decline', 'Eating less than usual', `Down ${round(drop)} points from usual ${round(baseline)}%`);
  }
  if (weightChangePct !== null) {
    if (weightChangePct <= -5) add(3, 'weight', 'Significant weight loss', `Lost ${round(-weightChangePct, 1)}% (${round(firstWeight - latestWeight, 1)} kg) since day ${weights[0].day}`);
    else if (weightChangePct <= -2) add(1, 'weight', 'Weight trending down', `Lost ${round(-weightChangePct, 1)}% (${round(firstWeight - latestWeight, 1)} kg) since day ${weights[0].day}`);
  }
  if (bmi !== null) {
    if (bmi < 19) add(2, 'bmi', 'Underweight for age', `BMI ${round(bmi, 1)}`);
    else if (bmi < 21) add(1, 'bmi', 'Low BMI for an older adult', `BMI ${round(bmi, 1)}`);
  }
  if (fluids3 !== null) {
    if (fluids3 < 1200) add(2, 'fluids', 'Low fluid intake', `3-day average ${round(fluids3)} mL/day`);
    else if (fluids3 < 1500) add(1, 'fluids', 'Below fluid goal', `3-day average ${round(fluids3)} mL/day`);
  }
  if (missed >= 2) add(1, 'missed', 'Missed meals', `${missed} meals refused or skipped in the last 2 days`);
  if (chewingDays) add(1, 'chewing', 'Chewing or swallowing difficulty', `Noted on ${chewingDays} of the last 7 days`);

  drivers.sort((a, b) => b.points - a.points);
  const points = drivers.reduce((sum, d) => sum + d.points, 0);
  const risk = Math.min(100, points * 10);
  return {
    risk, points, tier: risk >= 70 ? 'high' : risk >= 30 ? 'medium' : 'stable', drivers,
    summary: {day: today, intake7: round(intake7), baseline: round(baseline), fluids3: round(fluids3), weight: latestWeight,
      weightChangePct: round(weightChangePct, 1), bmi: round(bmi, 1), missed, chewingDays, latestNote, diet: profile?.diet ?? null},
  };
}

// ---------- Synthetic generator ----------
// Deterministic per-resident random numbers, so regenerating gives the same data.
export function seededRandom(seedText) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const quarter = v => clamp(Math.round(v / 25) * 25, 0, 100); // care homes record meals as 0/25/50/75/100%

const NOTES = {
  stable: ['Ate well in the dining room', 'Enjoyed lunch, asked for seconds', 'Finished breakfast independently', 'Good appetite at dinner', 'Drank well throughout the shift'],
  declining: ['Left most of dinner, said not hungry', 'Needed encouragement to eat', 'Refused breakfast', 'Only picked at lunch', 'Drank about half of water jug', 'Said food has no taste', 'Fell asleep during lunch'],
  chewing: ['Slow to chew, pocketing food', 'Coughed while eating dinner', 'Complained of sore mouth while eating'],
};

// Builds 28 days of logs following one of three patterns: stable, gradual decline or acute drop.
export function generateResident({id, age, sex, days = 28, pattern, vitals = {}}) {
  const rand = seededRandom(id);
  const normal = (mu, sd) => mu + sd * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const roll = rand();
  pattern ??= roll < 0.5 ? 'stable' : roll < 0.8 ? 'gradual' : 'acute';
  const height_cm = Math.round(clamp(normal(sex === 'Male' ? 173 : 160, 6), 148, 192));
  const startWeight = clamp(normal(24.5, 3), 19.5, 32) * (height_cm / 100) ** 2; // starting BMI 19.5–32
  const diet = ['Regular', 'Regular', 'Regular', 'Soft & bite-sized', 'Minced & moist', 'Pureed'][Math.floor(rand() * 6)];
  const baseIntake = clamp(normal(86, 6), 70, 98);
  const baseFluids = clamp(normal(1650, 150), 1350, 2000);
  const onset = pattern === 'gradual' ? 6 + Math.floor(rand() * 8) : pattern === 'acute' ? 16 + Math.floor(rand() * 6) : Infinity;
  const floor = pattern === 'gradual' ? clamp(normal(42, 8), 25, 55) : clamp(normal(38, 8), 20, 50);
  const chewing = pattern !== 'stable' && rand() < 0.45;

  let weight = startWeight;
  const logs = [];
  for (let day = 1; day <= days; day++) {
    const since = day - onset;
    let level = baseIntake;
    if (since >= 0) level = pattern === 'gradual' ? Math.max(floor, baseIntake - (since + 1) * ((baseIntake - floor) / 12)) : floor;
    const declining = since >= 0;
    const meal = () => rand() < (declining ? 0.08 : 0.02) ? 0 : quarter(normal(level, 12));
    const meals = [meal(), meal(), meal()];
    const fluids = Math.round(clamp(normal(declining ? baseFluids * (0.55 + 0.45 * level / baseIntake) : baseFluids, 120), 500, 2600) / 10) * 10;
    // Weight follows intake: roughly -0.2 kg/day when eating ~40%, near zero when eating normally.
    const delta = mean(meals) - baseIntake;
    weight += (delta < 0 ? delta * 0.42 : delta * 0.2) / 100 + normal(0, 0.04);
    const weighed = day === 1 || day % 7 === 1 || day === days;
    const chewingToday = chewing && declining && rand() < 0.5;
    const pool = chewingToday ? NOTES.chewing : declining ? NOTES.declining : NOTES.stable;
    const note = rand() < (declining ? 0.6 : 0.3) ? pool[Math.floor(rand() * pool.length)] : '';
    const avg = mean(meals);
    logs.push({day, breakfast_pct: meals[0], lunch_pct: meals[1], dinner_pct: meals[2], fluids_ml: fluids,
      weight_kg: weighed ? Math.round((weight + normal(0, 0.2)) * 10) / 10 : null,
      appetite: avg >= 75 ? 'Good' : avg >= 50 ? 'Fair' : 'Poor', chewing_difficulty: chewingToday, note});
  }
  const screening = generateScreening({id, age, sex, height_cm, weight_kg: logs[0].weight_kg, pattern, vitals});
  return {profile: {height_cm, diet, age, sex, screening}, logs, pattern};
}

// ---------- Screening profile (NHANES-style fields, one snapshot per resident at screening) ----------
// Short labels in display order, grouped as on the dashboard. Keys are the stored field names.
export const SCREENING_FIELDS = [
  ['Demographics', [['age', 'Age'], ['sex', 'Sex'], ['race', 'Race/ethnicity'], ['education', 'Education'], ['marital', 'Marital status'], ['income_ratio', 'Income ratio'], ['exam_status', 'Exam status']]],
  ['Body measures', [['weight_kg', 'Weight (kg)'], ['bmi', 'BMI'], ['height_cm', 'Height (cm)'], ['arm_cm', 'Arm circ. (cm)'], ['waist_cm', 'Waist (cm)'], ['hip_cm', 'Hip (cm)']]],
  ['Diet (24-h recall)', [['recall_status', 'Recall status'], ['kcal', 'Calories (kcal)'], ['protein_g', 'Protein (g)'], ['carbs_g', 'Carbs (g)'], ['fat_g', 'Fat (g)'], ['fiber_g', 'Fiber (g)'], ['vit_d_ug', 'Vitamin D (µg)'], ['b12_ug', 'Vitamin B12 (µg)'], ['calcium_mg', 'Calcium (mg)'], ['moisture_g', 'Water from diet (g)']]],
  ['Vitals at screening', [['sbp1', 'Systolic BP 1'], ['dbp1', 'Diastolic BP 1'], ['sbp2', 'Systolic BP 2'], ['dbp2', 'Diastolic BP 2'], ['sbp3', 'Systolic BP 3'], ['dbp3', 'Diastolic BP 3'], ['pulse', 'Pulse']]],
  ['Balance & falls', [['balance_exam', 'Balance exam'], ['balance_test1', 'Balance test 1'], ['balance_time_s', 'Balance time (s)'], ['stands_unaided', 'Stands unaided'], ['dizzy_24h', 'Dizzy (24 h)'], ['dizzy_fall_12m', 'Dizzy fall (12 mo)']]],
];

const pick = (rand, options) => { let r = rand() * options.reduce((s, [, w]) => s + w, 0); for (const [v, w] of options) { if ((r -= w) < 0) return v; } return options.at(-1)[0]; };

// Synthetic screening values for one resident. Age (coded 80 for 80+, as NHANES does) and sex come from the PSV file;
// blood pressure and pulse start from the resident's real PSV medians when available; body measures follow height,
// weight and BMI so they agree with the care logs. Residents who later decline start with slightly lower intake.
export function generateScreening({id, age, sex, height_cm, weight_kg, pattern = 'stable', vitals = {}}) {
  const rand = seededRandom(`${id}:screening`);
  const normal = (mu, sd) => mu + sd * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const r1 = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
  const male = sex === 'Male', atRisk = pattern !== 'stable';
  const bmi = r1(weight_kg / (height_cm / 100) ** 2);
  const kcal = Math.round(clamp(normal(male ? 1950 : 1600, 300) * (atRisk ? 0.85 : 1), 900, 3000));
  const sbp = vitals.sbp ?? clamp(normal(134, 15), 100, 180), dbp = vitals.dbp ?? clamp(normal(70, 9), 45, 100), hr = vitals.hr ?? clamp(normal(72, 10), 50, 105);
  const bp = (base, sd) => Math.round(base + normal(0, sd));
  const elderly = Math.min(age ?? 70, 100);
  const passes = rand() < clamp(0.95 - (elderly - 65) * 0.012 - (atRisk ? 0.1 : 0), 0.4, 0.95);
  return {
    age: Math.min(Math.round(age ?? 0), 80), age_top_coded: (age ?? 0) >= 80, sex,
    race: pick(rand, [['Non-Hispanic White', 60], ['Non-Hispanic Black', 12], ['Mexican American', 8], ['Other Hispanic', 7], ['Non-Hispanic Asian', 8], ['Other / Multi-racial', 5]]),
    education: pick(rand, [['Less than 9th grade', 8], ['9–11th grade', 10], ['High school / GED', 28], ['Some college / AA', 29], ['College graduate+', 25]]),
    marital: pick(rand, [['Married / partner', 45], ['Widowed / divorced / separated', 48], ['Never married', 7]]),
    income_ratio: r1(clamp(normal(2.4, 1.3), 0.3, 5), 2),
    exam_status: 'Interviewed & examined',
    weight_kg, bmi, height_cm,
    arm_cm: r1(clamp(10 + 0.72 * bmi + normal(0, 1.2), 18, 45)),
    waist_cm: r1(clamp((male ? 2.6 * bmi + 33 : 2.5 * bmi + 27) + normal(0, 5), 60, 160)),
    hip_cm: r1(clamp(1.7 * bmi + 58 + normal(0, 4), 75, 150)),
    recall_status: 'Reliable, complete',
    kcal,
    protein_g: r1(kcal * clamp(normal(0.16, 0.02), 0.1, 0.24) / 4),
    carbs_g: r1(kcal * clamp(normal(0.5, 0.05), 0.35, 0.65) / 4),
    fat_g: r1(kcal * clamp(normal(0.34, 0.05), 0.2, 0.45) / 9),
    fiber_g: r1(clamp(normal(16, 5), 4, 40)),
    vit_d_ug: r1(clamp(normal(4.5, 2.5), 0.3, 20)),
    b12_ug: r1(clamp(normal(4.5, 2), 0.5, 15)),
    calcium_mg: Math.round(clamp(normal(850, 250), 250, 2000)),
    moisture_g: Math.round(clamp(normal(2400, 500), 900, 4500)),
    sbp1: bp(sbp, 3), dbp1: bp(dbp, 2), sbp2: bp(sbp, 3), dbp2: bp(dbp, 2), sbp3: bp(sbp, 3), dbp3: bp(dbp, 2), pulse: bp(hr, 3),
    balance_exam: 'Complete',
    balance_test1: passes ? 'Pass' : 'Fail',
    balance_time_s: passes ? 15 : r1(3 + rand() * 11),
    stands_unaided: rand() < (atRisk ? 0.8 : 0.93) ? 'Yes' : 'No',
    dizzy_24h: rand() < (atRisk ? 0.2 : 0.07) ? 'Yes' : 'No',
    dizzy_fall_12m: rand() < (atRisk ? 0.2 : 0.08) ? 'Yes' : 'No',
  };
}
