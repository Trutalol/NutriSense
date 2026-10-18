import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {MODEL, predictScreening, topRiskFactors, screeningModelResult} from './model.mjs';
import {parseNhanesCsv} from './nhanes.mjs';
import {scoreNutrition} from './nutrition.mjs';

test('model never uses the file\'s risk columns or demographics', () => {
  const inputs = [...MODEL.numeric, ...MODEL.missing_indicators, ...MODEL.categorical].map(f => f.column);
  for (const c of ['MALNUTRITION_RISK_SCORE', 'MALNUTRITION_PROBABILITY_SYNTHETIC', 'MALNUTRITION_RANDOM_DRAW', 'HAS_MALNUTRITION', 'RIDRETH3', 'DMDEDUC2', 'DMDMARTZ', 'INDFMPIR'])
    assert.ok(!inputs.includes(c), c);
  assert.equal(MODEL.sklearn_params.model__penalty, 'l2');
  assert.equal(MODEL.sklearn_params.model__C, 0.018873918221350976);
  assert.equal(MODEL.sklearn_params.model__intercept_scaling, 10);
  assert.equal(MODEL.sklearn_params.model__class_weight, null);
});

const DATA = new URL('../data/csv/data.csv', import.meta.url);
test('JavaScript predictions match scikit-learn exactly', {skip: !existsSync(DATA) && 'data/csv/data.csv not found'}, () => {
  const rows = new Map(parseNhanesCsv(readFileSync(DATA, 'utf8')).map(r => [r.SEQN, r]));
  for (const c of MODEL.checks) assert.ok(Math.abs(predictScreening(rows.get(c.SEQN)).probability - c.probability) < 1e-9, `SEQN ${c.SEQN}`);
});

test('missing measurements fall back to the training median, never zero', () => {
  const empty = predictScreening({}).probability;
  const allMedian = predictScreening(Object.fromEntries(MODEL.numeric.map(f => [f.column, f.median]))).probability;
  assert.ok(empty > 0 && empty < 1);
  assert.notEqual(empty, allMedian); // the "not measured" flags are part of the model
});

test('lower body size and intake raise the predicted risk, and the reasons say so', () => {
  const base = Object.fromEntries(MODEL.numeric.map(f => [f.column, f.median]));
  const thin = {...base, BMXBMI: 18, BMXWT: 48, BMXARMC: 21, DR1TPROT: 30, DR1TKCAL: 900};
  assert.ok(predictScreening(thin).probability > predictScreening(base).probability);
  const factors = topRiskFactors(predictScreening(thin).parts);
  assert.ok(factors.some(f => /^low (BMI|weight|arm circumference)/.test(f)), factors.join(', '));
});

test('a high screening prediction adds an explained point to the daily score', () => {
  const day = {day: 1, breakfast_pct: 100, lunch_pct: 100, dinner_pct: 100, fluids_ml: 1700, weight_kg: 65, appetite: 'Good', chewing_difficulty: false, note: ''};
  const high = scoreNutrition([day], {height_cm: 165, screening_model: {probability: 0.74, factors: ['low BMI']}});
  const none = scoreNutrition([day], {height_cm: 165});
  assert.equal(high.risk - none.risk, 30);
  assert.match(high.drivers.find(d => d.key === 'model').detail, /74%.*low BMI/);
  assert.equal(scoreNutrition([day], {height_cm: 165, screening_model: {probability: 0.5}}).drivers.length, 0);
  assert.ok(screeningModelResult({}).version === MODEL.version);
});
