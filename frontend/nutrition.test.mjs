import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreNutrition, generateResident, formatNutritionCsv, parseNutritionCsv} from './nutrition.mjs';

const profile = {height_cm: 165, diet: 'Regular'};
const day = (n, meals, fluids = 1700, weight = null, extra = {}) =>
  ({day: n, breakfast_pct: meals, lunch_pct: meals, dinner_pct: meals, fluids_ml: fluids, weight_kg: weight, appetite: null, chewing_difficulty: false, note: '', ...extra});

test('a resident eating and drinking well scores zero', () => {
  const logs = Array.from({length: 21}, (_, i) => day(i + 1, 100, 1700, i % 7 === 0 ? 65 : null));
  const s = scoreNutrition(logs, profile);
  assert.equal(s.risk, 0);
  assert.equal(s.tier, 'stable');
  assert.deepEqual(s.drivers, []);
});

test('falling intake is flagged against the resident\'s own baseline before weight changes', () => {
  const logs = [...Array.from({length: 14}, (_, i) => day(i + 1, 100, 1700, i === 0 ? 65 : null)),
    ...Array.from({length: 7}, (_, i) => day(15 + i, 50, 1700))];
  const s = scoreNutrition(logs, profile);
  assert.deepEqual(s.drivers.map(d => d.key).sort(), ['decline', 'intake']);
  assert.equal(s.tier, 'medium');
  assert.match(s.drivers.find(d => d.key === 'decline').detail, /from usual 100%/);
});

test('combined weight loss, low intake and low fluids reaches the high tier with every reason listed', () => {
  const logs = [...Array.from({length: 14}, (_, i) => day(i + 1, 100, 1700, i === 0 ? 65 : null)),
    ...Array.from({length: 7}, (_, i) => day(15 + i, 25, 1000, i === 6 ? 61 : null, {chewing_difficulty: i > 4}))];
  const s = scoreNutrition(logs, profile);
  assert.equal(s.tier, 'high');
  const keys = s.drivers.map(d => d.key);
  for (const k of ['intake', 'decline', 'weight', 'fluids', 'chewing']) assert.ok(keys.includes(k), k);
  assert.match(s.drivers.find(d => d.key === 'weight').detail, /6\.2%/);
  assert.equal(s.risk, Math.min(100, s.points * 10));
  // Drivers are ordered by weight so the strongest reason is shown first.
  assert.deepEqual(s.drivers.map(d => d.points), [...s.drivers.map(d => d.points)].sort((a, b) => b - a));
});

test('only data up to the scored day is used', () => {
  const logs = [day(1, 100), day(2, 100), day(3, 0)];
  assert.equal(scoreNutrition(logs.slice(0, 2), profile).risk, 0);
  assert.ok(scoreNutrition(logs, profile).risk > 0);
});

test('missing values are ignored rather than treated as zero', () => {
  const logs = [day(1, 100), {...day(2, 100), breakfast_pct: null, fluids_ml: null}];
  const s = scoreNutrition(logs, profile);
  assert.equal(s.risk, 0);
  assert.equal(s.summary.intake7, 100);
});

test('generator is deterministic and round-trips through CSV', () => {
  const a = generateResident({id: 'p100002', age: 83, sex: 'Male'});
  const b = generateResident({id: 'p100002', age: 83, sex: 'Male'});
  assert.deepEqual(a, b);
  assert.equal(a.logs.length, 28);
  const parsed = parseNutritionCsv(formatNutritionCsv(a.profile, a.logs));
  assert.deepEqual(parsed.logs, a.logs);
  assert.equal(parsed.profile.height_cm, a.profile.height_cm);
});

test('declining residents are flagged well before stable residents', () => {
  const firstFlag = pattern => {
    const r = generateResident({id: `t-${pattern}`, age: 80, sex: 'Female', pattern});
    return r.logs.findIndex((_, d) => scoreNutrition(r.logs.slice(0, d + 1), r.profile).risk >= 30);
  };
  assert.ok(firstFlag('gradual') >= 0);
  assert.ok(firstFlag('acute') >= 0);
  const stable = generateResident({id: 't-stable', age: 80, sex: 'Female', pattern: 'stable'});
  assert.ok(scoreNutrition(stable.logs, stable.profile).risk < 70);
});

test('rejects malformed nutrition files', () => {
  assert.throws(() => parseNutritionCsv('day,breakfast_pct\n1,50'), /profile/);
  assert.throws(() => parseNutritionCsv('# profile,height_cm=165\nday,breakfast_pct,lunch_pct,dinner_pct,fluids_ml,weight_kg,appetite,chewing_difficulty,note\n1,500,0,0,1000,,,0,'), /invalid breakfast_pct/);
  assert.throws(() => parseNutritionCsv('# profile,height_cm=165\nday,breakfast_pct,lunch_pct,dinner_pct,fluids_ml,weight_kg,appetite,chewing_difficulty,note\n2,50,50,50,1000,,,0,\n1,50,50,50,1000,,,0,'), /strictly increasing/);
});

test('screening profile has all 36 fields, top-codes age at 80 and matches the care logs', async () => {
  const {SCREENING_FIELDS} = await import('./nutrition.mjs');
  const r = generateResident({id: 'p100011', age: 100, sex: 'Male', vitals: {sbp: 125, dbp: 60, hr: 89}});
  const s = r.profile.screening;
  const keys = SCREENING_FIELDS.flatMap(([, f]) => f.map(([k]) => k));
  assert.equal(keys.length, 36);
  for (const k of keys) assert.ok(k in s, k);
  assert.equal(s.age, 80); assert.equal(s.age_top_coded, true);
  assert.equal(s.height_cm, r.profile.height_cm);
  assert.equal(s.weight_kg, r.logs[0].weight_kg);
  assert.ok(Math.abs(s.sbp1 - 125) < 15 && Math.abs(s.pulse - 89) < 15, 'vitals seeded from PSV medians');
  // Adding the screening profile must not change the daily logs.
  assert.deepEqual(generateResident({id: 'p100011', age: 100, sex: 'Male'}).logs, r.logs);
});
