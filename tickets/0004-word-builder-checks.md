---
id: 0004
title: "Word Builder: automatic checks and notes"
status: todo        # todo | in-progress | blocked | review | done
priority: 3         # 1 = high, 2 = normal, 3 = low
depends_on: [0002, 0003]# e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan:               # needed = the Architect writes a design plan before anyone builds; done = it has one
kind: code          # code | content (facts, data, text, spoken lines: researched, cited, and fact-checked)
---

## Goal
The automatic browser checks play a whole Word Builder round so future changes can't quietly break it, and the notes tell the owner how to try it on the iPad.

## Context
- `tools/browser-check.mjs` already covers Egg Words, Cluck Sounds, the reward shows and the recorder; follow how it drives rounds (speeds up game time with `time.timeScale` / `tweens.timeScale`, runs in Chromium and WebKit through `.github/workflows/checks.yml`).
- Cover: open Word Builder from home, drag one tile to a wrong slot and see it return, then complete 5 words, reach the reward, and return home. Check no console errors.
- Update STATUS.md (what was built, what is untested on the iPad, next steps) and README's 'how to test on the iPad'. Mark M2 in PLAN.md section 9 as built only if the owner agrees, otherwise just note it in STATUS.md.
- Run `node tools/update-sw.mjs --check` and make sure `CACHE_VERSION` was bumped.

## Acceptance criteria
- [ ] `node tools/browser-check.mjs` includes a Word Builder round (wrong drop returns the tile, correct drops fill slots, five words reach the reward) and passes.
- [ ] The pull-request checks (content, offline file list, cache version, browser checks in Chromium and WebKit) all pass.
- [ ] STATUS.md and README describe Word Builder and how to try it on the iPad, without any personal details.
- [ ] App builds (or serves) and runs locally with no console errors, and existing features still work
- [ ] Follows the design rules in this repo's CLAUDE.md

## Log
<!-- Agents append entries here. Newest at the bottom. -->
- 2026-10-13 [claude] (sonnet-5-5): created by the Ticket writer from the owner's request
