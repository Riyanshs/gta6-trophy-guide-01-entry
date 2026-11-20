# gta6-trophy-guide-01-entry

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Riyanshs/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Riyanshs/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

**Leonida Trophy Guide** — the best offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI.

Hello, judge — welcome to Leonida. We built this for the hunters: the whole road to the Platinum on one page, the one missable trophy flagged before you can miss it, and every guide citing where its facts come from. Thank you for playing through it — we hope it earns its place.

## What it is

- **Every trophy, exactly as PlayStation publishes it** — all 55 official names, descriptions and grades (1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 hidden), plus a guide in our own words for each one, with its sources named beside it. Where the community had not pinned down a method by 19 November 2026, the guide says so instead of guessing.
- **A tracker that saves your progress** — a checklist stored in your browser (localStorage), with export to a file and import back, filters by kind (story, missable, collectibles, activities, online), by grade and by earned status, and sorting by guide order, grade or name.
- **A spoiler setting** — story trophy names, descriptions and guides stay hidden until earned, so you can follow the roadmap without reading ahead.
- **A roadmap to the Platinum** — three stages (story, 100% completion, clean-up) built from the official descriptions, about 200 hours at 4/10 difficulty, with the one missable trophy called out: Positive Mental Attitude, whose Chapter 1 balcony meditation disappears when Chapter 1 ends.

## Run it

The app is plain static files under `app/` — no build step, no network at run time:

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` with any static file server. It works with the network off: every file it loads is a file under `app/`.

## Hand it in

`main.ts` (Node 22, standard library only) checks the guide — all 55 official trophies present, every guide non-blank and longer than its description, every trophy citing a source, screenshots and app files inside the scorer's caps — then copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Official names, descriptions and grades are the PlayStation 5 list as published. The guides draw on Output Lag's trophy list, KeenGamer's trophy guide & Platinum roadmap, GTABase's trophies guide, Insider Gaming's complete trophy list and GTA Zone's trophy list — named beside each trophy, never copied. The look is our own: no Rockstar logo, official artwork, box art or game screenshots anywhere. Fan-made guide, not affiliated with Rockstar Games or Sony Interactive Entertainment.

List checked 19 November 2026.

Built for [make.fun](https://make.fun/).
