// Leonida Trophy Guide — the program that hands the guide in (Node 22,
// standard library only). It copies this directory's app/ (the offline
// static guide: index.html, its modules, styles and data/trophies.json) and
// screenshots/ (3 or 4 real renders of the guide's own code) to /output and
// writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the
// scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Before it copies anything it checks the guide itself: trophies.json must
// hold all 55 official trophies by their exact names, every one with a
// non-blank guide that says more than its description does, every one citing
// a source, and the screenshots and app files must sit inside the scorer's
// caps. A failed check stops the run with a clear error instead of handing
// in a broken entry.
//
// Serve the guide locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The 55 official PlayStation 5 trophy names, as PlayStation publishes
// them (the kit's starter carries the same list in app/data/trophies.json).
const OFFICIAL_NAMES = [
  'Vice Got a Price!', 'Just Like Paradise', 'Paradise Lost',
  'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma',
  'You Gotta Know When to Get Off', 'Trust', 'Break the Bank',
  'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'A Long Road',
  'Cunning Stunts', 'Master of None', 'The Shootist', 'Top Fun',
  'Earn Cash, Not Kudos', 'Baited My Tackle', 'Stick Fiddler',
  'Road to Rehabilitation', "This Was No Boat Accident", 'The Lone Rider',
  'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
  'Positive Mental Attitude', 'Fair Game', "Don't Touch My Deck",
  'You WAiNKer!', 'One Last Thing', 'Hot Together', 'Retail Therapy',
  'Whip It Good', 'Gunslinger', 'Catch Me If You Can', 'Challenging Tank',
  'Sneakthief', 'Maximum Withdrawal', 'A Classic Blitz Play',
  'The Goodtime State', 'Pest Control', 'In The Beginning…',
  'Capital Offense', 'Let’s Go Bowling', 'Personal Best',
  'Actions Speak Louder', 'Bad Luck, I Guess', 'The Truth Is Out There',
  'Ten Pin', 'Dime on the Dollar', 'Treat Yo Self', 'Little Boxes',
  'On the Spot',
];

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`leonida-trophy-guide: ${message}`);
}

function walk(dir, outPaths = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, outPaths);
    else outPaths.push(p);
  }
  return outPaths;
}

// 1. Check the trophy data before anything is copied.
const trophiesPath = join(here, 'app', 'data', 'trophies.json');
if (!existsSync(trophiesPath)) fail('app/data/trophies.json is missing');
const trophiesDoc = JSON.parse(readFileSync(trophiesPath, 'utf8'));
const trophies = Array.isArray(trophiesDoc) ? trophiesDoc : trophiesDoc.trophies;
if (!Array.isArray(trophies)) fail('trophies.json holds no trophies array');
const byName = new Map(trophies.map((t) => [t.name, t]));
const missing = OFFICIAL_NAMES.filter((n) => !byName.has(n));
if (missing.length) fail(`trophies.json is missing: ${missing.join(', ')}`);
const noGuide = OFFICIAL_NAMES.filter((n) => typeof byName.get(n).guide !== 'string' || !byName.get(n).guide.trim());
if (noGuide.length) fail(`trophies with no guide: ${noGuide.join(', ')}`);
// A guide that only repeats the trophy's description adds nothing (the
// judge gives it no credit), so require each guide to say more than the
// description does: at least 40 characters beyond it.
const thinGuide = OFFICIAL_NAMES.filter((n) => {
  const t = byName.get(n);
  return t.guide.trim().length < t.description.trim().length + 40;
});
if (thinGuide.length) fail(`trophies whose guide barely adds to the description: ${thinGuide.join(', ')}`);
const unsourced = OFFICIAL_NAMES.filter((n) => !Array.isArray(byName.get(n).sources) || byName.get(n).sources.length === 0);
if (unsourced.length) fail(`trophies with no cited source: ${unsourced.join(', ')}`);
const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
for (const t of trophies) {
  if (!(t.grade in grades)) fail(`trophy ${t.name} has unknown grade ${t.grade}`);
  grades[t.grade] += 1;
}
if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
  fail(`grade split is ${JSON.stringify(grades)}, expected 1 platinum, 2 gold, 6 silver, 46 bronze`);
}

// 2. Check the screenshots: 3 or 4, each at most 256 KiB, and the ones
// listed in shots.json must be exactly the ones on disk (a stray sample
// screenshot would be handed in silently otherwise).
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
if (shots.length < 3 || shots.length > 4) fail(`expected 3 or 4 screenshots, found ${shots.length}`);
const shotsJson = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const listed = shotsJson.map((s) => s.file).sort();
if (JSON.stringify(listed) !== JSON.stringify(shots)) fail(`shots.json lists ${listed.join(', ')}, but screenshots/ holds ${shots.join(', ')}`);
for (const f of shots) {
  const size = statSync(join(shotsDir, f)).size;
  if (size > 262144) fail(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
}

// 3. Check the app files: index.html at most 1 MiB, the whole app at most
// 993 files and directories and 48 MiB, trophies.json at most 2 MiB.
const indexPath = join(here, 'app', 'index.html');
if (!existsSync(indexPath)) fail('app/index.html is missing');
if (statSync(indexPath).size > 1048576) fail('app/index.html is over the 1 MiB cap');
if (statSync(trophiesPath).size > 2097152) fail('app/data/trophies.json is over the 2 MiB cap');
const appFiles = walk(join(here, 'app'));
if (appFiles.length > 993) fail(`app/ holds ${appFiles.length} files, over the 993 cap`);
const appBytes = appFiles.reduce((n, p) => n + statSync(p).size, 0);
if (appBytes > 50331648) fail(`app/ is ${appBytes} bytes, over the 48 MiB cap`);

// 4. Hand it in: copy app/ and screenshots/, then write the dossier.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`leonida-trophy-guide: handed in ${trophies.length} trophies (${grades.platinum} platinum, ${grades.gold} gold, ${grades.silver} silver, ${grades.bronze} bronze), ${shots.length} screenshots, ${appFiles.length} app files (${appBytes} bytes) to ${out}`);
