---
id: 0002
title: "Word Builder: fuse, blend, speak and reward"
status: todo        # todo | in-progress | blocked | review | done
priority: 2         # 1 = high, 2 = normal, 3 = low
depends_on: [0001]  # e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan:               # needed = the Architect writes a design plan before anyone builds; done = it has one
kind: code          # code | content (facts, data, text, spoken lines: researched, cited, and fact-checked)
---

## Goal
When all the slots are filled, the letters fuse, their sounds blend into the word, the word is spoken and the farm celebrates; finished words lay eggs toward the usual reward show.

## Context
- PLAN.md 8.3 ('Finished word: tiles fuse, sounds blend, word is spoken'), 8.6 (farm shows). The plan's 'beaker fizzes' is from the old lab theme; assumed replacement: the tiles join into one word, hop, and the nest/egg burst effect plays (`src/ui/effects.js`, `burst`). Owner may want a different celebration: see questions.
- Build on `BuilderScene.js` from builder-core. Reuse Egg Words behaviour: blending with overlapping sound clips in `src/systems/audio.js`, the hen guide's success hop (`src/ui/hen.js`), praise lines (`src/ui/praise.js`), the egg nest (`src/ui/nest.js`) and `RewardScene.js` when the nest is full. Look at how `MixerScene.js` calls `addReward` and `recordWord` in `src/systems/save.js`.
- Each finished word lays an egg. Assumption: Word Builder does NOT count toward moving up a letter set (PLAN.md 5.6 ties that to Egg Words); it doesn't change the 'needs practice' list either. So don't call `recordWord` in a way that affects `readyToMoveOn()`. Asked in questions.
- After the reward show, returning continues the game or goes home the same way Egg Words does (the reward screen's 'play again' / 'home' choices).
- New narration lines go in `src/data/narration.json`; run `node tools/check-content.mjs` and regenerate `narration-script.md`. Bump the cache version.

## Acceptance criteria
- [ ] Filling the last slot makes the tiles join into one word, the sounds blend, and the word is spoken aloud, then the hen hops and a praise line plays.
- [ ] A finished word adds an egg to the nest; after 5 words (a full nest) the reward screen and a farm show appear and then offer play again or home, as in Egg Words.
- [ ] Finishing words in Word Builder doesn't change which letter set he is on and doesn't appear as a score anywhere.
- [ ] The celebration is not blocked if he taps during it, and the next word's tiles and slots are all reset (no leftover tiles from the last word).
- [ ] Checked at 1180x820: the fused word and the nest are fully on screen with no overlap with the picture or shelf.
- [ ] App builds (or serves) and runs locally with no console errors, and existing features still work
- [ ] Follows the design rules in this repo's CLAUDE.md

## Log
<!-- Agents append entries here. Newest at the bottom. -->
- 2026-10-13 [claude] (sonnet-5-5): created by the Ticket writer from the owner's request
