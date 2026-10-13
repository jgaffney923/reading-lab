---
id: 0003
title: "Word Builder: first-visit walkthrough and hints"
status: todo        # todo | in-progress | blocked | review | done
priority: 3         # 1 = high, 2 = normal, 3 = low
depends_on: [0001]  # e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan:               # needed = the Architect writes a design plan before anyone builds; done = it has one
kind: code          # code | content (facts, data, text, spoken lines: researched, cited, and fact-checked)
---

## Goal
The first time he opens Word Builder, the hen explains it by voice and a pointing hand shows how to drag a tile; if he stalls, the hand shows the next tile to move.

## Context
- Copy the pattern from Egg Words: the first-visit walkthrough, `src/ui/hand.js` (pointing hand), `tipShown` / `markTipShown` in `src/systems/save.js`, and idle hints in `MixerScene.js` (hand shows the next step after a few seconds of nothing).
- Hint here means: the hand drags the correct tile for the first empty slot. It must not say the answer in words; it only points and moves. 'Wrong' is never said (PLAN.md 5.3).
- Narration lines for the intro and hints in `src/data/narration.json` (ids like `builder.intro`, `builder.drag`); the intro must only describe what to do, in short sentences for a 5-year-old. Run `node tools/check-content.mjs`, regenerate `narration-script.md`, bump cache version.
- The walkthrough plays only once per save (reset progress in the parent corner replays it). Stop the hand and speech if he leaves the screen.

## Acceptance criteria
- [ ] On the first visit the hen speaks the intro and the hand drags one tile into its slot as a demo; on later visits the intro is skipped.
- [ ] Doing nothing for about 6 seconds in a word makes the hand show the next correct tile and slot, and the hint repeats if he still waits.
- [ ] The hint never says the letters or word aloud beyond the normal spoken word, and nothing says 'wrong'.
- [ ] Starting to drag cancels any hint hand at once.
- [ ] Resetting progress in the parent corner makes the walkthrough play again.
- [ ] App builds (or serves) and runs locally with no console errors, and existing features still work
- [ ] Follows the design rules in this repo's CLAUDE.md

## Log
<!-- Agents append entries here. Newest at the bottom. -->
- 2026-10-13 [claude] (sonnet-5-5): created by the Ticket writer from the owner's request
