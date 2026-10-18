// Generates synthetic daily nutrition care logs for NutriSense, one CSV per resident.
// Residents are the people in the NHANES screening file: their real age, sex, height, weight, diet recall and
// screening answers seed each log, and their real nutrition risk inputs set how likely their intake is to decline.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readNhanes, screeningFromNhanes, baselineRisk} from './nhanes.mjs';
import {generateResident, formatNutritionCsv, scoreNutrition, seededRandom} from './nutrition.mjs';

const help = `Usage: npm.cmd run generate -- [options]
  --nhanes PATH     NHANES screening CSV (default: project data/csv/data.csv)
  --out PATH        Output folder (default: project data/nutrition)
  --days N          Days of logs per resident (default: 28)
  --limit N         Only the first N residents (default: all)
Every resident is assigned a wing and room. About 1 in 6 residents declines over the month; residents with lower BMI,
arm circumference, calories and protein at screening are more likely to be among them.`;

const WINGS = ['Birch', 'Cedar', 'Maple', 'Willow'];

// Chance that a resident's month includes a decline: 5% for the best-nourished, rising to about 35% for the least.
export function declineChance(probability) {
  if (probability === null || probability === undefined) return 0.15;
  return Math.min(0.35, Math.max(0.05, 0.05 + (probability - 0.3) * 0.55));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(help); return; }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (!['--nhanes', '--out', '--days', '--limit'].includes(args[i]) || !args[i + 1]) throw Error(`Invalid argument ${args[i]}\n${help}`);
    options[args[i]] = args[++i];
  }
  const source = path.resolve(options['--nhanes'] ?? fileURLToPath(new URL('../data/csv/data.csv', import.meta.url)));
  const out = path.resolve(options['--out'] ?? fileURLToPath(new URL('../data/nutrition/', import.meta.url)));
  const days = Number(options['--days'] ?? 28), limit = Number(options['--limit'] ?? Infinity);
  if (!Number.isInteger(days) || days < 7 || days > 365) throw Error('days must be 7–365.');
  if (!(limit === Infinity || (Number.isInteger(limit) && limit > 0))) throw Error('limit must be a positive integer.');

  let rows;
  try { rows = await readNhanes(source); } catch (e) { throw Error(e.code === 'ENOENT' ? `NHANES file not found at ${source}` : e.message); }
  rows = rows.sort((a, b) => a.SEQN - b.SEQN).slice(0, limit);
  const perWing = Math.ceil(rows.length / WINGS.length);

  await mkdir(out, {recursive: true});
  const tally = {stable: 0, gradual: 0, acute: 0}, finals = {high: 0, medium: 0, stable: 0};
  for (const [i, row] of rows.entries()) {
    const id = `r${row.SEQN}`;
    const screening = screeningFromNhanes(row);
    const roll = seededRandom(`${id}:pattern`);
    const pattern = roll() < declineChance(baselineRisk(row)) ? (roll() < 0.6 ? 'gradual' : 'acute') : 'stable';
    const wing = WINGS[Math.floor(i / perWing)], room = 101 + (i % perWing);
    const resident = generateResident({
      id, age: row.RIDAGEYR, sex: screening.sex ?? 'Unknown', days, pattern, screening,
      baseline: {height_cm: row.BMXHT ?? undefined, weight_kg: row.BMXWT ?? undefined, kcal: row.DR1TKCAL},
      extra: {wing, room, nhanes_seqn: row.SEQN},
    });
    await writeFile(path.join(out, `${id}.csv`), formatNutritionCsv(resident.profile, resident.logs));
    tally[pattern]++;
    finals[scoreNutrition(resident.logs, resident.profile).tier]++;
  }
  console.log(`Wrote ${rows.length} residents (${days} days each) to ${out}`);
  console.log(`Patterns: ${tally.stable} stable, ${tally.gradual} gradual decline, ${tally.acute} sudden drop`);
  console.log(`Final day: ${finals.high} high risk, ${finals.medium} watch, ${finals.stable} on track`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(e => { console.error('Generate failed:', e.message); process.exitCode = 1; });
}
