---
id: 0001
title: "Word Builder: drag letters into slots"
status: todo        # todo | in-progress | blocked | review | done
priority: 2         # 1 = high, 2 = normal, 3 = low
depends_on: []      # e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan: done          # needed = the Architect writes a design plan before anyone builds; done = it has one
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

## Design plan

_Written by the Architect (claude-opus-5-5) on 2026-10-13. The owner approves it by merging; builders follow it._

A new third game, Word Builder, guided by Gertrude, opens from a reworked home screen that has three narrower game cards side by side. Each word shows its picture and says "Let's build… map". He drags letter tiles from a shelf into empty spots in a straw basket. A tile that fits snaps in. A tile that doesn't fit floats back, the game says the sound a spot needs, and the tile that belongs there glows, so every word ends with him getting it right. Nothing is scored or marked wrong. This ticket covers dragging and checking only: a finished word is spoken, then the next word appears. After 5 words it goes back home for now, until ticket 0002 adds eggs and the reward show.

### What the user sees
The game is drawn on a 2048x1536 canvas that Phaser scales to fit the screen. On the 1180x820 iPad that is about 0.53 CSS px per game unit, so 200 units is about 107 CSS px. All positions below are in game units.

**Home** (`HomeScene`): three cards in a row instead of two. Each card is 600 wide and 560 tall, centred at y 700, at x `W/2 - 640`, `W/2` and `W/2 + 640` (384, 1024, 1664; the outer edges sit 84 units from the screen sides). The cards are too narrow for the hen beside the letters, so each card stacks its contents (positions inside the card):
- 3 sample tiles (120x140) at y -165, at x -140, 0, 140;
- the hen with her feet at (0, 175), 230 tall;
- the name at (0, 230), size 50.

The order is Cluck Sounds, Egg Words, Word Builder. Word Builder's sample letters are `['p','i','n']` and its hen is `guideFor('builder')`.

**Word Builder** (`BuilderScene`), 5 words per round:
- Top: 🏠 at (130,130) from `addHomeButton(this)`, and an empty nest from `makeNest(this, 130, 5)`. Ticket 0002 lays the eggs.
- Picture card: `makePictureCard(this, W/2, 430, word, picture(word), { size: 380, onTap: () => this.sayWord() })`. Tapping it says the word again.
- Basket: a straw rounded rectangle (`COLORS.straw`, with darker straw strokes like `nest.js`) centred at (W/2, 880), 340 tall, `n*320 + 80` wide.
- Slots: one per letter, 280x320, white at 0.7 alpha with a faint ink outline (`COLORS.ink`, 0.2), at y 880 and x = `W/2 + (i - (n-1)/2) * 320`. Every slot looks the same. Each slot also has a hidden yellow halo (`COLORS.glow`) behind it, used for pulsing.
- Shelf: 5 tiles (`makeTile`, 250x290) in shuffled order at y 1250, x = `W/2 + (i - 2) * 290`. A wooden plank (0xb8873a, 36 tall) sits under them at y 1405, from x 280 to x 1750.
- Gertrude: `makeHen(this, guideFor('builder'), W - 150, H - 40, 260, { facing: 'left', onTap: (h) => h.cluck() })`. The bottom-left corner stays empty; ticket 0003 may use it for 💡.

**Flow** (the full calls, with `this` as the scene):
1. **New word** (`next()`):
   - `this.announceTimer = this.time.delayedCall(400, () => this.announce(this.index))`;
   - `announce(i)` does nothing unless `alive()`, `i === this.index` and `this.state === 'build'`; otherwise it runs `sayAll(this, ['builder.build', wordId(this.word)])` ("Let's build… map").
2. He can start straight away. Tapping or picking up any tile first calls `this.cancelAnnounce()`, which does `this.announceTimer?.remove(); this.announceTimer = null`, then `stopNarration()`. So a waiting announcement can't cut off a tile's sound.
3. **Tap without dragging** (`tapTile(tile)`): `cancelAnnounce()`, `stopNarration()`, `clip(this, sndId(tile.letter))`, and `tile.hop()` (shelf tiles only).
4. **Start a drag** (`pickUp(tile)`): `cancelAnnounce()`, `stopNarration()`, `clip(this, sndId(tile.letter))`. `drag.js` already does the lift and the depth change.
5. **Drop** (`dropTile(tile, x, y)`; x and y are the tile's position, from `makeDraggable`):
   - **If `this.state !== 'build'`:** `returnTo` and stop.
   - **Target slot:** the nearest slot whose centre is within 200 units.
   - **The target slot is empty and its letter matches:**
     - tween the tile to the slot centre (150 ms) and play `sfx(this, 'pop')`;
     - set `tile.placed = true` and `slot.filled = true`, and call `tile.disableInteractive()`;
     - turn off any glow on the tile, and if every slot is now filled, call `wordDone()`.
   - **No match** (the target slot needs another letter, the slot is already filled, or there is no slot nearby):
     - always float the tile back with `returnTo(this, tile, tile.homeX, tile.homeY)`;
     - if the tile still sits within 150 units of its shelf spot, stop there quietly (a tiny accidental drag);
     - otherwise pick the slot to talk about: the target slot if it is empty, else the leftmost empty slot (reading order);
     - call `needSlot(slot)`: pulse that slot's halo twice, play `sayAll(this, ['builder.slot', sndId(slot.letter)])` ("This spot needs… mmm"), and make the first unplaced shelf tile with `slot.letter` `glow(true)`;
     - only one tile glows at a time: clear the old glow first. The glow stays on until that tile is placed;
     - nothing locks: grabbing another tile cuts the line straight away.
   - Every drop resets the tile to depth 10.
6. **All slots filled** (`async wordDone()`):
   - set `this.state = 'done'` and run the rest only if the state was `'build'` before, so two quick drops can't finish the word twice;
   - `cancelAnnounce()`, and turn off input on all tiles;
   - `await this.wait(300)`, then `await say(this, wordId(this.word))`, then `if (!this.alive()) return`;
   - `await this.wait(600)`, check `alive()` again;
   - `this.index += 1`, then `index < 5 ? this.next() : this.roundDone()`.
   - `roundDone()` is just `this.scene.start('Home')` for now; ticket 0002 replaces it.
   - `wait(ms)` is the same `time.delayedCall` promise helper as in `MixerScene`.
7. **Repeated letters:** a word that uses a letter twice gets one tile per copy, and either copy fits either matching slot. No word repeats a letter yet, but the code must allow for it.

### Files
- **New `src/scenes/BuilderScene.js`**: scene key `'Builder'`, about 260 lines, structured like `MixerScene.js`.
  - Methods: `create`, `alive`, `wait`, `next`, `announce`, `cancelAnnounce`, `sayWord`, `pickUp(tile)`, `tapTile(tile)`, `dropTile(tile, x, y)`, `needSlot(slot)`, `wordDone`, `roundDone`.
  - Fields: `word`, `letters`, `slots` (each `{ x, y, letter, filled, box, halo }`), `tiles` (each tile also gets `homeX`, `homeY` and `placed`), `state` (`'build'` | `'done'`), `index`, `nest`, `hen`, `pictureCard`, `announceTimer`.
- **`src/main.js`**: one import, and `BuilderScene` added to the `scene` array after `MixerScene`.
- **`src/data/farm.json`**: add `"builder": "gertrude"` to `guides`.
- **`src/systems/phonics.js`**: one new export at the end, `spellingExtras(word)`. Existing functions stay as they are.
- **`src/scenes/HomeScene.js`**:
  - three `gameCard` calls in `create()`;
  - in `gameCard`, w 600 and the stacked positions and sizes;
  - the peck timer's `startAt` becomes `Math.round((x / W) * 2600)`, so the three hens peck at different times.
- **`src/data/narration.json`**: a `builder.*` block after the `mixer.listen` line, one line per entry:
  - `"builder.build": { "text": "Let's build", "recorded": false }`
  - `"builder.slot": { "text": "This spot needs", "recorded": false }`
  - Don't add `builder.intro` or `builder.drag`; ticket 0003 owns those.
- **`tools/check-content.mjs`**: add `'builder.build', 'builder.slot'` to `idsUsedByCode`.
- **`narration-script.md`**: regenerate with `node tools/make-narration-script.mjs`.
- **`sw.js`**: regenerate with `node tools/update-sw.mjs`. This adds the new file to the offline list and moves `CACHE_VERSION` from 7 to 8.
- **`STATUS.md`**: a short note, "Word Builder core (ticket 0001)". Leave `src/version.js` as it is.

### Data and storage
- Nothing is saved. Don't call `recordWord`, `recordSound` or `markTipShown`, so set progress and the needs-practice list are unaffected.
- Words come from `chooseWords(5)`, unchanged. Letters come from `lettersOf(word)`, pictures from `picture(word)`.
- `spellingExtras(word)` returns 2 extra letters ("distractors"): one vowel and one consonant from `lettersUpTo(currentSet())`, neither of them in the word. It also leaves out:
  - any letter that `sameSound` matches with a letter in the word (no k for "cat");
  - b when the word has d, and d when it has b. The word's own letters always stay, so "bed" still gets its b and d tiles;
  - q, always.
- If a pool is empty, that extra is skipped. That can't happen in sets 1-4.
- The shelf is `Phaser.Utils.Array.Shuffle([...letters, ...spellingExtras(word)])`, which gives 5 tiles for every 3-letter word.

### Reuse
- **`src/systems/drag.js`**: it calls `onTap()` and `onPickUp()` with no arguments, and `onDrop(x, y)` with the tile's position. So wrap each callback to pass the tile:
  - `makeDraggable(this, tile, { onTap: () => this.tapTile(tile), onPickUp: () => this.pickUp(tile), onDrop: (x, y) => this.dropTile(tile, x, y) })`.
  - Before that call: `tile.setInteractive(new Phaser.Geom.Rectangle(-125, -145, 250, 290), Phaser.Geom.Rectangle.Contains)`. A container has no size, and `setDraggable` needs it to take input.
  - Return tiles with `returnTo(this, tile, tile.homeX, tile.homeY)`.
- **`src/ui/tile.js`**: `makeTile(this, x, y, letter, { w: 250, h: 290 })` **without** `onTap`, because its tap handling would fight the drag. Use its `tile.glow(on)` and `tile.hop()`. Also `makePictureCard`.
- **Other UI:** `src/ui/nest.js` `makeNest`; `src/ui/hen.js` `makeHen` and `guideFor`; `src/ui/button.js` `addHomeButton(this)`.
- **`src/systems/audio.js`:** every call takes the scene first: `say(this, id)`, `sayAll(this, ids)`, `clip(this, id)`, `sfx(this, name)`. Only `stopNarration()` takes no arguments. `clip` already picks up the owner's in-app recordings.
- **`src/systems/phonics.js`:** `chooseWords`, `lettersOf`, `picture`, `sndId`, `wordId`, `isVowel`, `sameSound`, `lettersUpTo`.
- **`src/layout.js`:** `W`, `H`, `COLORS`, `MIN_TOUCH`.

### Rules
- **Feedback (PLAN 5.3 and 12):**
  - no "wrong" line or sound, no shake, no red, no `sfx(this, 'soft')`;
  - a tile that doesn't fit has already said its own sound when picked up, then he hears what a spot needs and the tile that fits glows, so the word always ends with him placing it right;
  - no score, timer or fail state.
- **Accuracy (5.4, 5.5 and 11):**
  - every word comes from `phonics.json`;
  - extra tiles never come from a set he hasn't reached and never sound the same as a needed letter;
  - b and d are never both added as extras; a word's own letters always stay;
  - no q, and only pure sounds (`snd.*`), never letter names;
  - lowercase Andika (`makeTile`).
- **Narration:** every spoken line lives in `narration.json`; run `node tools/check-content.mjs` and regenerate the script.
- **Touch:**
  - tiles 250x290 and slots 280x320, both above 200 units, with a generous drop zone;
  - tiles are added to the scene directly, not to a container, so a dragged tile can go on top of everything.
- **Leaving the game:**
  - add `this.events.once('shutdown', () => stopNarration())`;
  - check `alive()` (`this.sys.isActive()`) after every `await`;
  - use only `this.time` timers, never `setTimeout`;
  - don't add an `alive()` guard to the first `next()` called from `create()` (see the comment in `SoundLabScene.next`).
- **Between words:** call `this.tweens.killTweensOf(obj)` before destroying each tile, slot and halo, and stop any glow.
- **Kid-safe:** no network, no new libraries, no text input.
- **Release:** bump the cache version (merging puts it on the iPad).

### Build order
1. Add `guides.builder` to `farm.json` and `spellingExtras` to `phonics.js`.
2. Add the two narration lines and the two `idsUsedByCode` entries. Run `node tools/check-content.mjs` and `node tools/make-narration-script.mjs`.
3. Create `BuilderScene` with the static layout and the announcement (with its timer handle), and register it in `main.js`. Open it with `__game.scene.start('Builder')` on localhost.
4. Add tap, drag and drop: the three drop outcomes, `needSlot`, the glow, the depth resets and `cancelAnnounce`.
5. Add the awaited `wordDone` (finishes only once), `next` and `roundDone`, plus the shutdown and `alive()` guards.
6. Rework the Home cards for three games.
7. Run `node tools/update-sw.mjs` and `node tools/browser-check.mjs`; the existing checks must still pass. Take screenshots at 1180x820 and update STATUS.md.

### Risks
- **Merge hotspots, keep both sides:**
  - the `builder.*` lines in `narration.json`;
  - `idsUsedByCode` in `check-content.mjs`;
  - `STATUS.md`;
  - `sw.js`: take main's version, then run `node tools/update-sw.mjs` again.
- **Tickets 0002 and 0003 may both change `BuilderScene.js` after this merges.**
  - 0002 owns `wordDone` (from the spoken word onward) and `roundDone`.
  - 0003 owns the intro and idle hints. It adds its own state values (such as `'intro'`), calls `cancelAnnounce()` and hides the hand in `pickUp`. It must keep `state === 'build'` meaning "he can play" and `'done'` meaning "word finished".
  - Whoever merges second runs the browser checks with a hint showing during play and during a word's finish.
- **Stuck tiles:** every `dragend` reaches `dropTile`, which always places the tile or sends it back. Check `slot.filled` at drop time, in case two fingers drop on the same slot.
- **`tile.hop()` puts the tile back to where it was made:** only call it on shelf tiles.
- **No spoken how-to yet:** that comes with ticket 0003. Tell the owner.
- **Card name width:** if "Word Builder" doesn't fit a 600-wide card at size 50, use 46.

### For the Tester
- **Home at 1180x820:**
  - three cards fully visible, not overlapping the letters at the top or the yard;
  - each card opens its game;
  - the hens peck at different times.
- **Word Builder layout:**
  - you see a picture, hear "Let's build… <word>", and get 3 slots and 5 tiles;
  - vowels are coral, consonants blue;
  - nothing overlaps;
  - tapping the picture says the word.
- **Start of a word:** grab a tile within half a second of the word appearing. The tile's sound plays and isn't cut off by "Let's build".
- **Tiles:**
  - a tap plays the sound and the tile hops;
  - a drag plays the sound once, and the tile follows the finger;
  - dropping on the right slot snaps it in.
- **Tiles that don't fit:**
  - on a wrong empty slot: the tile floats back, "This spot needs…" plus that slot's sound plays, the slot pulses, and the matching tile glows;
  - on the floor, the picture or a filled slot: the same, about the leftmost empty slot;
  - a tiny drag near the shelf: back quietly.
- **Filling order:** fill the slots in any order. The word is spoken all the way through before the next word appears, with no leftover tiles. After 5 words you're back on the home screen.
- **Two fingers:** drop two tiles on the last two slots at once. The word finishes only once.
- **Extra tiles:** across sets 1-4 (parent corner, harder/easier), never c with k, no extra b or d beside the other ("bed" still shows its own b and d), never q, never a letter above the current set.
- **Rough use:** quick flicks, two fingers at once, grabbing a tile while it floats back. No tile is left stuck in mid-air. Try with touch emulation and with a mouse.
- **Leaving:** press 🏠 during "This spot needs…", during "Let's build" and during the spoken word. The home screen stays quiet.
- **Checks:** `node tools/check-content.mjs`, `node tools/update-sw.mjs --check` and `node tools/browser-check.mjs` pass, with no console errors.

### Questions for the owner

- Name and guide: the home card is called "Word Builder" and the guide hen is Gertrude. Until you answer, the plan assumes both.
- Spoken lines: the plan assumes "Let's build… map" when each word appears, and "This spot needs… mmm" when a letter doesn't fit. Do you want different wording?
- Extra letters: the plan always puts 2 extra tiles on the shelf, one vowel and one consonant, so he has to listen for the middle sound (the hardest part of spelling). Should there be fewer extras at first? Until you answer, the plan assumes always 2 (5 tiles).
- Spot colours: the plan keeps all spots plain white, so he finds each letter by listening; the tiles stay coral and blue. Should the vowel's spot get a coral outline as a hint? Until you answer, the plan assumes plain spots.
- Dropping a tile away from the spots: the ticket asks for the game to say a spot's sound. The plan uses the leftmost empty spot, and stays quiet only for a tiny drag next to the shelf. Should it stay quiet for every drop away from the spots instead? Until you answer, the plan follows the ticket.

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
- 2026-10-13 [claude] (opus-5-5): design plan written by the Architect; waiting for the owner's OK
