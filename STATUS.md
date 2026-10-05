# Status (last updated 2026-10-03)

## Where things stand
- **Plan** written (PLAN.md), based on the owner's original AGENTS.md draft plus review changes: blending as the core mechanic, letters before pictures, "always end with the right answer" feedback instead of "every answer moves forward", a fixed teaching order (4 letter sets, 44 picturable words), one reward currency (Lab Energy), quiet mastery tracking, no speech recognition.
- **M0 shell** built: copied and adapted from `../chemistry app` (tap to start, narration with device-voice fallback, save, parent corner, service worker, tools). Light theme, Andika font, flask app icon.
- **M1** built:
  - Home: current set's letters on a shelf (tap to hear), Sound Lab and Word Mixer cards, experiment collection, new-letters celebration.
  - Sound Lab: 6 sounds per round, three letters to choose from, "listen again" with the right letter glowing.
  - Word Mixer: 5 words per round; letter tiles, sound dots, slide-to-blend arrow (sounds can overlap once recorded), pictures appear only after every sound is heard, look-alike pictures, the "that one is… let's listen together" path, first-visit walkthrough with a pointing hand, idle hints, 💡 slow sound-out.
  - Experiments: rocket, volcano, potion, taking turns; play again or go home.
  - Set progression (8 of last 10 first tries + 6 words seen), parent corner with easier/harder and a needs-practice list.
- **In-app recorder** (2026-10-03): ⚙️ panel → Record sounds. Grid of the 26 letter sounds (and an optional Words tab), record / listen / next, automatic trim and volume, saved in the iPad's IndexedDB and used by the game immediately (`src/systems/recordings.js`, `src/scenes/RecorderScene.js`).
- Repo: https://github.com/jgaffney923/reading-lab (public, same noreply commit email as chemistry-app). GitHub Pages: https://jgaffney923.github.io/reading-lab/

## Tested
In Edge on the PC (1366x1024) with automated Playwright runs: boot, home, a full Word Mixer round (tapping, sliding, choosing another picture once, retry), all three experiments, play again / home, a full Sound Lab round including the retry path, the new-letters celebration, the parent corner (easier/harder, needs-practice list), and offline reload with the service worker. No console errors.
Recorder tested in Edge with a simulated microphone: record, save, play back, survive a reload, and get picked up by the game's sound player.
Not yet tested on the iPad (including the real microphone and permission prompt), and not yet with him. Narration has only been heard as device speech (in a headless browser, so effectively not heard at all).

## Next steps
1. Install on the iPad from the Pages URL (README), then **record the 26 letter sounds** in the app (⚙️ → Record sounds). Milestone M1.5, before the first test with him.
2. Check on the iPad: microphone prompt, that playback volume is normal after recording (iOS can route sound quietly while the mic is open), and that sounds blend when sliding fast.
3. Play with him for a few days. Watch: does he slide the arrow or only tap? Does he say the word out loud before picking a picture? Is 5 words per round the right length? Does he notice the coral vowels?
4. M1.7 farm theme (PLAN.md section 15). It can be built before or after the first kid test.
5. Then M2 Word Builder (PLAN.md 8.3).

## Chickens / farm theme (2026-10-04)
The family's 8 hens are drawn (`src/art/chickens.js`) and approved by the owner. **Decision: replace the science-lab theme with a farm theme** (eggs instead of Lab Energy, a coop that unlocks a hen per letter set, a hen guide). Full plan is in PLAN.md section 15, milestone M1.7. Not built yet.

## Decisions made along the way
- Emoji pictures as placeholders. They look different on Windows; check them on the iPad, and swap any he names differently (PLAN.md 11).
- c and k never appear together as Sound Lab choices (same sound).
- "tin" dropped (its picture looks like "can"); "sip" dropped (picture reads as "cup").
- The 💡 hint sounds the word out but never says the word.
- q added (2026-10-03) as the sound "kw" at the end of set 4, so all 26 letters can be learned and recorded. No q words until "qu" is taught with digraphs.

## Where the letter sounds come from (researched 2026-10-03)
Decision: **the owner records them in the app** (⚙️ → Record sounds). No complete, freely licensed set of pure, isolated letter sounds was found. Don't add third-party audio to this repo without checking its license: the repo is public.
- **Wikipedia/Wikimedia Commons** IPA samples (CC BY-SA 3.0, one is public domain): only the short vowels (a æ, e ɛ, i ɪ, o ɑ, u ʌ, ~0.6 s each, files like `Near-open front unrounded vowel.ogg`) and probably v are isolated. The other consonants are recorded inside syllables ("sa asa", "ta ata"), so they're unusable. No x or q. Possible use: default vowels with a credits line, replaced by home recordings. Not done.
- **Freesound** "English Phonemes" pack by margo_heston (pack 12249): only 12 sounds left, CC BY-NC 4.0; covers v, z, x ("kss") and w, plus y, but "Wuh"/"Yyuh" have an added "uh". "letters_phonemes" by drummy (CC0) is one 51 s alphabet recording, probably letter names.
- **Not usable** (copyrighted, or terms forbid extraction): Yellow Door free phonics MP3 (British, no reuse terms), Phonicademy, PhonicPal (GitHub, all rights reserved).
- **Untried option:** generate sounds with Kokoro (open-source TTS, Apache-2.0) and cut phonemes out with praat-parselmouth, as PhonicPal did. Held sounds would likely be fine; stops (t, p, k) likely robotic. Only worth trying if the owner asks.
