# Reading Lab Jr. (PWA) — Build Plan

## 1. Goal
A touch-first reading game for one 5-year-old kindergartener who knows most letters and many letter sounds but can't yet blend sounds into words. It runs as a Progressive Web App on an iPad (Safari, "Add to Home Screen"), works fully offline, and is tested at home with him after every milestone.

The aim is not testing or grading. The aim is:
- strong letter-sound links,
- **blending sounds into words** (the main gap),
- reading simple words, then short sentences,
- confidence: reading feels like play.

**Design principle:** reading is the tool, experiments are the reward. He reads words to power machines in a Junior Scientist lab; every finished round fills the Lab Energy flask and he launches an experiment (rocket, volcano, color potion).

Sister project: `chemistry app` (Chemistry Play). This app reuses its shell (boot/audio unlock, narration pipeline, save, parent corner, service worker, tools) but is a separate app with its own home screen, tuned for a 5-year-old.

## 2. Who it's for
- Age 5, kindergarten. Recognizes most letters, knows many sounds, struggles to blend, few sight words.
- Loves science, chemistry, robots, experiments, colorful effects.
- Attention span 5 to 10 minutes. A round is about 2 minutes; a session is two to four rounds.
- **Cannot read instructions.** Every instruction is spoken; the only text he is asked to read is the reading practice itself.

## 3. Constraints (non-negotiable)
- **Target device:** iPad, Safari, landscape primary. A friendly "turn me sideways" picture in portrait until real portrait layouts exist.
- **Static files only**, hosted on GitHub Pages (HTTPS). No build step.
- **Offline-first:** everything works with no network after first load. Libraries and fonts are vendored.
- **Kid-safe:** no ads, analytics, accounts, network requests, links out, or text input. Progress lives in localStorage on the device.
- **No speech recognition.** Recognizing a 5-year-old reading aloud isn't reliable, and it would need the network. He responds by tapping and building; a grown-up can listen to him read aloud.
- **Never punishing** (section 5.3): no fail states, no lost progress, no score that goes down.
- **Phonics accurate** (section 11): pure sounds, only words he can sound out with letters he has.

## 4. Tech stack
Same as Chemistry Play:
- Plain JavaScript ES modules, no framework or bundler.
- Phaser 3.90.0 vendored at `vendor/phaser.min.js`.
- `manifest.webmanifest` + hand-written `sw.js` (versioned cache, cache-first assets, network-first page).
- **Font:** Andika Bold (SIL, Open Font License), vendored at `assets/fonts/`. It's designed for beginning readers: single-story "a" and "g", clearly different b/d/p/q and I/l. All letters and words in the game use it, in **lowercase**.
- Audio: recorded `.m4a` narration in a parent's voice, with device speech as a stand-in (but see section 13: stand-in speech can't say pure letter sounds).
- Local dev: Live Server or `python -m http.server`, Edge/Chrome device emulation. Automated checks with Playwright driving Edge.

## 5. How reading is taught
This is the most important section. Every game follows it.

### 5.1 The core loop: see letters → say sounds → blend → meaning
1. **Letters first, picture last.** A word appears as letter tiles. Pictures are hidden until he has sounded it out, so he reads the letters, not the picture.
2. **Sound buttons.** A dot under each letter (tap to hear its sound) and an arrow under the whole word. Sliding a finger along the arrow plays the sounds in order; sliding faster runs them together into the word. This is the classroom "sound buttons and swoop" routine made touchable.
3. **Meaning check.** Then three pictures appear that differ by one sound (map, nap, tap). He taps the one he read.
4. **Celebrate with the blend:** the tiles slide together, the game says the stretched sounds and then the word ("mmmaaap... map!").

### 5.2 Spelling builds blending
Building words from letter tiles (hear "map", see the picture, drag m-a-p into the slots) is one of the strongest ways to practice blending. It's the reading app's version of the Molecule Builder: letters are atoms, words are molecules.

### 5.3 Feedback: never a mistake, always the right answer
The child should never feel wrong. But in phonics, if a wrong tap moves forward with the same reward, he learns to guess. So:
- **Never say:** wrong, incorrect, failed, oops, no, "try again" said as a verdict. No red X, buzzer, or shaking "no" animation.
- **When he picks something else:** the game tells him what he picked ("That one is pan"), says "Let's listen to the sounds together," replays the sounds and the word, and the right answer glows. He taps it and gets the success animation.
- **Every attempt ends with him hearing and doing it right**, then the reward. Rewards are for finishing, never for accuracy.
- Accuracy is recorded quietly (first try or not) only to choose what to practice and when to move on (section 5.6).
- Effort phrases: "Great effort!", "Nice experimenting!", "Let's listen to the sounds." Success phrases: "You got it!", "Great reading!", "Awesome, scientist!"

### 5.4 Sounds
- **Pure sounds.** "mmm", not "muh"; "sss", not "suh"; stops (b, c/k, d, g, p, t) said short and crisp, with as little "uh" as possible.
- **Hold the sounds you can hold** (m, s, f, l, n, r, v, z and the vowels) for about a second. Held sounds blend easily.
- **Short vowels only** at first: a as in ant, e as in egg, i as in itch, o as in octopus, u as in up.
- x says /ks/ (box, fox, six). It's one tile with one recording.
- q says /kw/, since it nearly always comes with u (queen). No q words until set 5, where "qu" is taught as a pair.
- **Letter names are never used** in the game during M1–M3. Everything is sounds.

### 5.5 Teaching order (scope and sequence)
Based on the Jolly Phonics / SATPIN order, adjusted so early words can be pictured and so b and d come in different sets. Letters accumulate; a set's words use only letters from that set and earlier ones. The word lists live in `src/data/phonics.json` and are checked by `tools/check-content.mjs`.

| Set | New letters | Example words (all picturable) |
|---|---|---|
| 1 | s a t p i n m | map, nap, tap, pan, pin, man, ant |
| 2 | d o g c k | dog, pig, cat, cap, can, pot, kid, sad, mad |
| 3 | e u h b r f | bed, hen, pen, sun, bus, bug, hat, bat, nut, tub |
| 4 | l w v x z j y q | log, leg, lip, web, van, box, fox, six, zip, lab (q is taught as its sound "kw", as in queen; qu words come with digraphs) |
| 5 | digraphs sh ch th ck | fish, ship, chick, duck, sock, bath |
| 6 | blends | frog, crab, drum, flag, sled, tent, hand, milk |
| 7 | heart words | the, a, I, is, to, of, and, my (taught as "heart words": the part that doesn't sound out is the part to learn by heart) |

Words are added in this order within each set: vowel-first words (ant), then words starting with a held sound (map, man, sun), then words starting with a stop (tap, cat, dog). Avoid words that don't sound out regularly (was, said, put) until heart words.

### 5.6 Review, mastery and moving on
- Each round mixes current-set words (most) with one or two review words from earlier sets. Words missed recently come back sooner.
- **Moving on:** the next set opens when 8 of his last 10 Word Mixer words from the current set were right on the first try, and he has seen at least 6 different words from the set. The home screen celebrates: "You unlocked new letters!" and plays each new sound.
- The parent corner shows which sounds and words need practice, and can move him up or down a set by hand.
- Nothing about mastery is ever shown to the child as a score.

### 5.7 Looks
- Clean, bright, friendly (Apple-style): soft sky-blue background, white rounded cards, big shadows, simple bouncy animations. No clutter.
- **Vowels are coral, consonants are blue** on every tile. Children learn quickly that every word needs a coral one.
- Big touch targets (at least 96 CSS px), nothing important near the screen edges.
- Almost no text. Icons and voice. The only words on screen are the ones he reads.

## 6. Project structure
```
/
├── index.html, manifest.webmanifest, sw.js
├── PLAN.md, AGENTS.md, README.md, STATUS.md
├── narration-script.md        # every line to record, generated
├── vendor/phaser.min.js
├── assets/
│   ├── fonts/                 # Andika Bold + OFL license
│   ├── icons/
│   └── audio/narration/       # <line-id>.m4a
├── src/
│   ├── main.js, layout.js, version.js
│   ├── scenes/                # Boot, Home, SoundLab, Mixer, Reward, Recorder (+ Builder, Robot later)
│   ├── systems/
│   │   ├── audio.js           # narration, overlapping sound clips for blending, speech fallback
│   │   ├── save.js            # localStorage progress, try/catch safe
│   │   ├── phonics.js         # sets, words, pictures, choosing rounds and look-alikes
│   │   ├── recordings.js      # in-app recording: mic, clean-up, IndexedDB, audio cache
│   │   └── drag.js
│   ├── ui/                    # tiles, cards, buttons, hand pointer, energy flasks, parent corner
│   └── data/
│       ├── phonics.json       # sounds, sets, words and pictures
│       └── narration.json     # every spoken line
└── tools/                     # dev-only scripts, never loaded by the game
```

## 7. PWA and iOS requirements
Same as Chemistry Play PLAN.md section 5: viewport/apple meta tags, standalone manifest with relative paths, "tap to start" to unlock audio, `touch-action: none`, 4 active pointers, FIT scaling, silent service-worker updates, `CACHE_VERSION` bump on every deploy, separate storage for the installed app, offline testing from GitHub Pages only.

Extra for this app: the game waits for the Andika font to load before drawing any letters, because Phaser draws text once and won't redraw it if the font arrives late.

## 8. Games ("machines" in the lab)

### 8.1 Sound Lab (letter sounds) — M1
- The game says "Find the letter that says… mmm." Three letter flasks; he taps one.
- His pick always says its own sound. If it's a different letter: "Let's listen again… mmm," and the right flask glows.
- A 🔊 button replays the sound. Any flask can be tapped just to hear it.
- 6 sounds per round, weighted toward current-set letters and letters he's missed.

### 8.2 Word Mixer (blending, reading) — M1, the core game
- One word at a time as letter tiles with sound dots and a blending arrow (section 5.1).
- Pictures appear only after he has heard every sound (by tapping or sliding).
- Three pictures: the word plus two look-alikes (sharing the most letters in the same places).
- 5 words per round. The first visit includes a spoken walkthrough and a pointing hand. If he does nothing for a few seconds, the hand shows the next step.
- 💡 replays the sounds slowly without saying the word.

### 8.3 Word Builder (spelling) — M2
- A picture and the spoken word ("Build: map!"). Empty slots in a beaker, 4–5 letter tiles on a shelf (the word's letters plus one or two look-alikes).
- Dragging a tile plays its sound. A tile that doesn't fit that slot floats back gently while the game says that slot's sound.
- Finished word: tiles fuse, sounds blend, word is spoken, beaker fizzes.

### 8.4 Robot Reader (phrases and sentences) — M4
- A robot follows a short command he reads: "hop", "a red hat", "the cat is on the bed". Tap each word to hear its sounds; tap the "go" button and the robot acts it out.
- Uses only decodable words plus heart words he has had.

### 8.5 Heart Word Lab — M5
- Heart words with the tricky part marked with a heart. Matching and finding them in robot sentences.

### 8.6 Experiments (the reward) — M1
- Each round fills a row of energy flasks (one per word or sound). Full energy opens the experiment screen: one big button, he launches it.
- M1 experiments: rocket launch, volcano, color potion fireworks, rotating so each feels new. Each launch adds to the collection shown on the home screen.
- Later: unlockable experiments (robot dance, slime, rainbow, crystal) tied to new sets.

### 8.7 Parent corner — M1
- Hold the gear for 3 seconds. Sound on/off, current letter set with easier/harder buttons, "needs practice" list (sounds and words with low recent first-try rates), reset progress.

## 9. Milestones (each ends with something playable on the iPad)
| # | Milestone | Acceptance criteria |
|---|-----------|--------------------|
| M0 | Shell | Tap to start, home screen, installable, offline, Andika font, deployed to GitHub Pages |
| M1 | Sound Lab + Word Mixer + experiments | Both games playable end to end for sets 1–4; feedback follows 5.3; set progression and parent corner work; first-visit walkthrough; stand-in voice for instructions and words |
| M1.5 | **Record the sounds** | In-app recorder (⚙️ → Record sounds) built. Parent records all 26 letter sounds on the iPad before the first kid test. Without them the stand-in voice mispronounces sounds. |
| M1.7 | **Farm theme** | Science lab replaced by the family's hens (section 15): hen guide, eggs instead of Lab Energy, coop on the home screen that unlocks a hen per letter set |
| M2 | Word Builder | Drag-to-spell for sets 1–4, gentle float-back, blend on completion, stickers |
| M3 | Kid-test pass | Play with him for a week, log issues, fix the top 5, tune round lengths and the move-on rule |
| M4 | Robot Reader | Phrases and 3–6 word sentences with robot actions; heart words a, the, is |
| M5 | Digraphs, blends, heart words | Sets 5–7 added to data, sound recordings, Heart Word Lab |
| M6+ | Chosen after testing | Ideas: decodable mini-stories, "read to a grown-up" mode, sticker book of experiments, two-player sibling mode |

Every milestone ends with a short test with him before the next starts. Each milestone that adds narration updates `narration-script.md`.

## 10. Agent working rules
- Work milestone by milestone. Don't start the next until the current one's acceptance criteria are met.
- Keep files small and single-purpose. Content (sounds, words, pictures, lines) lives in JSON, not in scenes.
- Placeholder art is fine (emoji pictures, drawn shapes). Don't block on assets.
- No new dependencies without asking. No CDN links. No network calls of any kind.
- Every interaction works with touch (Pointer Events). Touch targets at least 96 CSS px (200 game units).
- Run `node tools/check-content.mjs` after any change to `phonics.json` or `narration.json`.
- Bump `CACHE_VERSION` (`node tools/update-sw.mjs`) on every deploy that changes cached files.
- Keep README's "how to test on the iPad" and STATUS.md current. After each milestone, summarize what was built, what was tested and what's next.

## 11. Phonics accuracy guardrails
- Every sound is a pure sound (section 5.4). Never a letter name in M1–M3.
- Every word in a set uses only letters from that set or earlier ones, with their short-vowel, one-letter-one-sound values (x = /ks/).
- No word whose spelling doesn't follow those rules (no "was", "of", "put", "said") outside heart-word activities.
- Look-alike choices must be real words he could read, and each must have a clearly different picture.
- Pictures must name the word clearly. If a 5-year-old would call the picture something else (a "tin" that looks like a can), change the word or the picture.
- Words are always lowercase in Andika. Sentences in M4 start with a capital only once capitals have been introduced.
- Never stretch a stop sound ("t-t-t"); blend into it.

## 12. Language and tone
- The child is a Junior Scientist. Lines are short, warm and slow.
- Banned words and effects: wrong, incorrect, failed, oops, no, try again (as a verdict), red X, buzzer, sad faces, losing points or energy.
- Said instead: "Let's listen to the sounds." "Let's mix that together!" "Great effort!" "Nice experimenting!"

## 13. Narration and recording
- Every spoken line has an ID in `src/data/narration.json`; `narration-script.md` lists them with how to say them.
- **Sound lines (`snd.*`) must be recorded by a person.** Stand-in device speech can't say a pure sound: it says letter names or adds "uh". The game works with the stand-in, but the first kid test waits for the recordings (M1.5).
- Recording tips for sounds: hold held sounds for about a second ("mmmm"), keep stops short with no "uh", record each sound twice and keep the cleaner one.
- Words (`word.*`) are said normally and clearly. Blending is built in the game by playing the sound recordings close together, so stretched words don't need separate recordings.
- **Recording on the iPad (main way):** ⚙️ panel → Record sounds. A grid of letters (and a Words tab); tap one, record, listen, next. The app trims the quiet, evens the volume, and keeps the clips in the iPad's IndexedDB, where they replace the published file or device voice for that line right away. They stay on that iPad only and are not in the repo.
- Same PC pipeline as Chemistry Play also works, for recordings to publish with the app: Voice Memos → `recordings-raw/` → `tools/prepare-narration.mjs` (needs ffmpeg).

## 14. Out of scope (for now)
- Speech recognition, accounts, cloud sync, multiple child profiles.
- Letter names and capitals (later, after blending is solid).
- Handwriting.

## 15. Farm theme: our hens (decided 2026-10-04)
The owner chose to **replace the science-lab theme** with the family's 8 real hens. (Peppa Pig was considered and ruled out: it's licensed and the site is public.) Sections 1, 8.6 and 12 still describe the lab; update them when this is built.

**The hens** are already drawn, as code-generated SVG in `src/art/chickens.js`; the owner approved the looks. Preview: `node tools/make-chicken-preview.mjs`, then open `chicken-preview.html` (git-ignored). Load into Phaser with `this.load.svg(key, chickenDataURI(id), { width, height })`.

| Hen | Breed | Look |
|---|---|---|
| Gertrude | Prairie Bluebell Egger | Head hen (gold crown). Honey neck, tan body, blue-grey wing, silver tail |
| Oreo | Barred Rock | Black and white mixed together (not stripes) |
| Bella | Lavender Orpington | Round, fluffy, grey |
| Marsala | Buff Orpington | Round, fluffy, golden |
| Tina | White-crested Black Polish | Small, black, white pom-pom crest |
| Luna | Black Jersey Giant | Tallest, black |
| Rhoda | Rhode Island Red | Red-brown, black tail |
| Harriet | Australorp | Round, black |

**How the theme works**
- **Hen guide:** one hen leads each round. She points at letters, bobs her head when he's right, and clucks along on the "let's listen together" path (section 5.3 still applies; no sad chickens).
- **Eggs replace Lab Energy:** one egg per word or sound in a round, filling a nest. A full nest is the reward moment (replaces the experiments): an egg hatches a chick, the hens dance, a feather burst, and so on.
- **The coop:** the home screen becomes a coop and yard. Gertrude is there from the start, and each letter set he moves up to adds another hen. Tapping a hen makes her cluck or do a little animation. There are 8 hens and 4 sets for now, so later sets (M5) or milestones unlock the rest.
- **Words:** hen, egg, peck, nest and similar are good picture words, but only add them when the letters he has can spell them (sections 5.5 and 11; run `tools/check-content.mjs`).
- **Language:** replace the lab phrases ("Nice experimenting!", "Awesome, scientist!") with farm ones in `narration.json`, and update `narration-script.md` so the owner can record them.

**Still to decide when building:** new names for Sound Lab and Word Mixer, the app name and icon (a hen instead of a flask), and which hen guides which game.
