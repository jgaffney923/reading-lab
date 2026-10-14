---
id: 0001
title: "Word Builder: drag letters into slots"
status: todo        # todo | in-progress | blocked | review | done
priority: 2         # 1 = high, 2 = normal, 3 = low
depends_on: []      # e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan: needed        # needed = the Architect writes a design plan before anyone builds; done = it has one
kind: code          # code | content (facts, data, text, spoken lines: researched, cited, and fact-checked)
---

## Goal
A new Word Builder game opens from the home screen. He sees a picture, hears the word, and drags letter tiles into empty slots; a tile that doesn't fit floats back gently while the game says that slot's sound.

## Context
- PLAN.md section 8.3 (Word Builder), 5.3 (feedback is never 'wrong'), 5.4 (pure sounds), 5.5 (teaching order), 11 (accuracy guardrails). Milestone M2.
- New scene `src/scenes/BuilderScene.js` (PLAN.md section 6 already reserves 'Builder'); register it in `src/main.js`. Follow `MixerScene.js` (Egg Words) for structure: nest, guide hen, round of 5 words, picture cards, sound playback.
- Reuse, don't rewrite: `src/systems/drag.js` (`makeDraggable`, `returnTo`), `src/ui/tile.js` (`makeTile`, vowels coral, consonants blue), `src/systems/phonics.js` (`chooseWords`, `lettersOf`, `picture`, `sndId`, `wordId`, `soundLookAlikes`), `src/systems/audio.js` (`clip`, `sayAll`).
- Round: 5 words from the current set (plus the usual review words, as `chooseWords` does). Each word shows its picture and the spoken word ('Build: map!'). Empty slots (one per letter) sit in a nest/basket-style holder; 4-5 tiles on a shelf: the word's letters plus 1-2 look-alike letters from the learned sets (never one that makes the same sound, as in Cluck Sounds; keep b and d apart). If a word repeats a letter, show one tile per needed copy.
- Dragging a tile plays its sound (use recordings when present). Dropping on the correct slot snaps in. Dropping on a wrong slot, or elsewhere, floats the tile back and says that slot's sound (what the slot needs, not 'wrong'). No fail state, no score, no timer; he can always keep trying. Letters can go into any empty slot only if they fit it; the slot order is left to right.
- Home: add a third game card next to Cluck Sounds and Egg Words in `HomeScene.js` (it currently has two cards at W/2 -/+ 450, so the layout needs reworking for three at 1180x820 landscape-equivalent game units). Unlocked from the start, since sets 1-4 are available. Card name assumed 'Word Builder' and the guide hen assumed to be Gertrude (decided by owner: see questions); guide lives in `src/data/farm.json`.
- Narration: new lines in `src/data/narration.json` (ids like `builder.intro`, `builder.build`, `builder.slot`), then run `node tools/check-content.mjs` and regenerate `narration-script.md` (`tools/make-narration-script.mjs`). Only decodable words he can sound out with the letters he has; every word and picture comes from `src/data/phonics.json`.
- Touch targets at least 200 game units. No network, no new libraries, no text input. Save code name: scene key `Builder`.
- Celebration, eggs, and walkthrough are separate tickets (builder-finish, builder-guide); here a completed word can just move on to the next word after the word is spoken.
- Bump the cache version (`node tools/update-sw.mjs`) because game files change.

## Acceptance criteria
- [ ] The home screen shows three game cards, all fully visible and tappable at 1180x820, and the Word Builder card opens the new game.
- [ ] A round shows a picture, says the word, shows one empty slot per letter and 4-5 tiles on the shelf; vowel tiles are coral and consonant tiles blue.
- [ ] Dragging a tile plays its sound; tapping without dragging also plays it.
- [ ] Dropping a tile on its correct slot snaps it in place; dropping on a slot where it doesn't belong floats it back gently and the game says that slot's sound. Nothing says 'wrong' and nothing is scored.
- [ ] Look-alike tiles never make the same sound as a needed letter and never include a letter from a set he hasn't reached.
- [ ] Works with touch (finger drag) as well as mouse, and tiles never get stuck mid-air after quick drags.
- [ ] Leaving with the home button mid-round stops all speech and doesn't carry lines onto the home screen.
- [ ] `node tools/check-content.mjs` passes and `narration-script.md` lists the new lines.
- [ ] App builds (or serves) and runs locally with no console errors, and existing features still work
- [ ] Follows the design rules in this repo's CLAUDE.md

## Log
<!-- Agents append entries here. Newest at the bottom. -->
- 2026-10-13 [claude] (sonnet-5-5): created by the Ticket writer from the owner's request
