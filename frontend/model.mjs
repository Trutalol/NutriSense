// Runs NutriSense's screening model (ridge logistic regression trained by train-model.py) in Node.
// The exported model.json holds every fitted number: medians for missing values, scaling, one-hot weights and coefficients.
import {readFileSync} from 'node:fs';

export const MODEL = JSON.parse(readFileSync(new URL('./model.json', import.meta.url), 'utf8'));
export const MODEL_VERSION = MODEL.version;

const sigmoid = z => 1 / (1 + Math.exp(-z));

// row: raw NHANES columns (numbers, null when not measured). Returns the probability and each input's contribution
// to the log-odds, so the dashboard can say which measurements pushed the risk up.
export function predictScreening(row, model = MODEL) {
  const parts = [];
  for (const f of model.numeric) {
    const raw = row[f.column];
    const value = raw === null || raw === undefined ? f.median : raw;
    parts.push({column: f.column, label: f.label, value: raw ?? null, contribution: f.coef * (value - f.mean) / f.scale});
  }
  for (const f of model.missing_indicators) {
    const missing = row[f.column] === null || row[f.column] === undefined ? 1 : 0;
    parts.push({column: f.column, label: f.label, value: missing, contribution: f.coef * (missing - f.mean) / f.scale, indicator: true});
  }
  for (const f of model.categorical) {
    const raw = row[f.column];
    const key = String(raw === null || raw === undefined ? f.missing_code : raw);
    parts.push({column: f.column, label: f.label, value: raw ?? null, contribution: f.coef_by_value[key] ?? 0});
  }
  const logit = model.intercept + parts.reduce((sum, p) => sum + p.contribution, 0);
  return {probability: sigmoid(logit), logit, parts};
}

const ANSWERS = {RIAGENDR: {1: 'male', 2: 'female'}, BAXPF11: {1: 'passed', 2: 'failed'}, BAQ110: {1: 'yes', 2: 'no'}, BAQ132: {1: 'yes', 2: 'no'}, BAQ140: {1: 'yes', 2: 'no'}};

// The measurements that raised this resident's risk the most (largest positive contributions), in plain words,
// e.g. "low arm circumference" or "dizzy (24 h): yes". Missing-value flags are left out.
// Lower-case the first letter only, so "BMI" and "Vitamin B12" read naturally mid-sentence.
const phrase = label => label === label.toUpperCase() ? label : label[0].toLowerCase() + label.slice(1);

export function topRiskFactors(parts, n = 3, model = MODEL) {
  const coef = Object.fromEntries(model.numeric.map(f => [f.column, f.coef]));
  return parts.filter(p => p.contribution > 0.02 && !p.indicator).sort((a, b) => b.contribution - a.contribution).slice(0, n).map(p => {
    if (p.column in coef) return `${coef[p.column] < 0 ? 'low' : 'high'} ${phrase(p.label)}`;
    const answer = ANSWERS[p.column]?.[p.value];
    return answer ? `${phrase(p.label)}: ${answer}` : `${phrase(p.label)} not recorded`;
  });
}

// Compact result stored with each resident and used by the daily score.
export function screeningModelResult(row, model = MODEL) {
  const {probability, parts} = predictScreening(row, model);
  return {probability: Math.round(probability * 1000) / 1000, factors: topRiskFactors(parts, 3, model), version: model.version};
}
