// Generates synthetic daily nutrition care logs for NutriSense, one CSV per resident.
// Resident IDs, ages and sex come from the PSV files so the logs line up with the real vitals.
import {readdir, readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parsePsv} from './psv.mjs';
import {generateResident, formatNutritionCsv, scoreNutrition} from './nutrition.mjs';

const help = `Usage: npm.cmd run generate -- [options]
  --psv PATH        PSV folder used for resident IDs, ages and sex (default: project data/psv)
  --out PATH        Output folder (default: project data/nutrition)
  --min-age N       Only residents aged N or older (default: 65)
  --days N          Days of logs per resident (default: 28)
Patterns rotate stable / gradual decline / stable / sudden drop / stable so every cohort has a mix.`;

const PATTERNS = ['stable', 'gradual', 'stable', 'acute', 'stable'];

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(help); return; }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (!['--psv', '--out', '--min-age', '--days'].includes(args[i]) || !args[i + 1]) throw Error(`Invalid argument ${args[i]}\n${help}`);
    options[args[i]] = args[++i];
  }
  const psv = path.resolve(options['--psv'] ?? fileURLToPath(new URL('../data/psv/', import.meta.url)));
  const out = path.resolve(options['--out'] ?? fileURLToPath(new URL('../data/nutrition/', import.meta.url)));
  const minAge = Number(options['--min-age'] ?? 65), days = Number(options['--days'] ?? 28);
  if (!Number.isFinite(minAge) || !Number.isInteger(days) || days < 7 || days > 365) throw Error('min-age must be a number and days 7–365.');

  const residents = [];
  for (const name of (await readdir(psv)).filter(f => /\.psv$/i.test(f)).sort()) {
    const rows = parsePsv(await readFile(path.join(psv, name), 'utf8'), name), first = rows[0];
    if (!first || first.Age === null || first.Age < minAge) continue;
    // Real median blood pressure and pulse from the PSV file seed the screening vitals.
    const median = key => { const v = rows.map(r => r[key]).filter(x => x !== null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : undefined; };
    residents.push({id: path.basename(name, path.extname(name)), age: Math.round(first.Age), sex: first.Gender === 1 ? 'Male' : first.Gender === 0 ? 'Female' : 'Unknown',
      vitals: {sbp: median('SBP'), dbp: median('DBP'), hr: median('HR')}});
  }
  if (!residents.length) throw Error(`No PSV residents aged ${minAge}+ found in ${psv}`);

  await mkdir(out, {recursive: true});
  for (const [i, r] of residents.entries()) {
    const resident = generateResident({...r, days, pattern: PATTERNS[i % PATTERNS.length]});
    await writeFile(path.join(out, `${r.id}.csv`), formatNutritionCsv(resident.profile, resident.logs));
    const final = scoreNutrition(resident.logs, resident.profile);
    console.log(`${r.id}  age ${r.age}  ${resident.pattern.padEnd(7)}  final risk ${String(final.risk).padStart(3)}  weight ${final.summary.weightChangePct ?? 0}%`);
  }
  console.log(`Wrote ${residents.length} synthetic nutrition logs (${days} days each) to ${out}`);
}
main().catch(e => { console.error('Generate failed:', e.message); process.exitCode = 1; });
