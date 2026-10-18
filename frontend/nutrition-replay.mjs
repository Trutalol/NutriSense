// Replays synthetic nutrition care logs into the database one day at a time, scoring each resident every day.
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {parseNutritionCsv, scoreNutrition} from './nutrition.mjs';

const help = `Usage: npm.cmd run replay-nutrition -- [options]
  --folder PATH       Nutrition CSV folder (default: project data/nutrition; create it with npm.cmd run generate)
  --interval SECONDS  Wall-clock delay between days (default: 5)
  --max-days N        Stop after N days
  --start ISO_DATE    Calendar date assigned to day 1 (default: 27 days before today, so the last day is today)
  --dry-run           Validate and print each resident's final score without touching the database
Each tick writes one day of care logs for every resident and scores them. Ctrl+C stops safely.`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(help); return; }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') { options[args[i]] = true; continue; }
    if (!['--folder', '--interval', '--max-days', '--start'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Invalid argument ${args[i]}\n${help}`);
    options[args[i]] = args[++i];
  }
  const folder = path.resolve(options['--folder'] ?? fileURLToPath(new URL('../data/nutrition/', import.meta.url)));
  const interval = Number(options['--interval'] ?? 5), limit = Number(options['--max-days'] ?? Infinity);
  if (!Number.isFinite(interval) || interval < 0.1 || !(limit === Infinity || (Number.isInteger(limit) && limit > 0))) throw Error('Interval must be at least 0.1 seconds and max-days a positive integer.');

  let names;
  try { names = (await readdir(folder)).filter(f => /\.csv$/i.test(f)).sort(); }
  catch { throw Error(`No nutrition folder at ${folder}. Run npm.cmd run generate first.`); }
  if (!names.length) throw Error(`No .csv files in ${folder}. Run npm.cmd run generate first.`);
  const residents = [];
  for (const name of names) {
    const id = path.basename(name, path.extname(name));
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id)) throw Error(`Unsupported resident filename: ${name}`);
    const {profile, logs} = parseNutritionCsv(await readFile(path.join(folder, name), 'utf8'), name);
    residents.push({id, profile, logs, byDay: new Map(logs.map(l => [l.day, l]))});
  }
  const maxDay = Math.max(...residents.map(r => r.logs.at(-1).day));
  console.log(`Validated ${residents.length} residents, days 1–${maxDay}.`);
  if (options['--dry-run']) {
    for (const r of residents) { const s = scoreNutrition(r.logs, r.profile); console.log(`${r.id}: risk ${s.risk} (${s.tier}) ${s.drivers.map(d => d.label).join('; ')}`); }
    return;
  }

  const start = options['--start'] ? new Date(options['--start']) : new Date(Date.now() - (maxDay - 1) * 86400000);
  if (Number.isNaN(start.getTime())) throw Error('Invalid start date');
  const {initialize, writeNutritionDay, pool} = await import('./database.mjs');
  const run = {id: randomUUID(), started_at: start.toISOString()};
  let stopped = false;
  const controller = new AbortController();
  process.once('SIGINT', () => { stopped = true; controller.abort(); console.log('\nFinishing current write, then stopping…'); });
  try {
    await initialize();
    console.log(`Nutrition run ${run.id}`);
    let ticks = 0;
    for (let day = 1; day <= maxDay && !stopped && ticks < limit; day++) {
      let saved = 0, high = 0;
      for (const r of residents) {
        if (stopped) break;
        const log = r.byDay.get(day);
        if (!log) continue;
        const score = scoreNutrition(r.logs.filter(l => l.day <= day), r.profile);
        if (await writeNutritionDay(run, r, log, score)) saved++;
        if (score.risk >= 70) high++;
      }
      ticks++;
      console.log(`Day ${day}: logged ${saved} residents · ${high} at high malnutrition risk`);
      if (!stopped && day < maxDay && ticks < limit) await sleep(interval * 1000, undefined, {signal: controller.signal}).catch(e => { if (e.name !== 'AbortError') throw e; });
    }
    console.log(stopped ? 'Stopped.' : 'Nutrition replay finished.');
  } finally { await pool.end(); }
}
main().catch(e => { console.error('Nutrition replay failed:', e.code || e.message); process.exitCode = 1; });
