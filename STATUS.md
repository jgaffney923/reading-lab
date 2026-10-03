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
- **In-app recorder** (2026-10-03): ⚙️ panel → Record sounds. Grid of the 25 letter sounds (and an optional Words tab), record / listen / next, automatic trim and volume, saved in the iPad's IndexedDB and used by the game immediately (`src/systems/recordings.js`, `src/scenes/RecorderScene.js`).
- Repo: https://github.com/jgaffney923/reading-lab (public, same noreply commit email as chemistry-app). GitHub Pages: https://jgaffney923.github.io/reading-lab/

## Tested
In Edge on the PC (1366x1024) with automated Playwright runs: boot, home, a full Word Mixer round (tapping, sliding, choosing another picture once, retry), all three experiments, play again / home, a full Sound Lab round including the retry path, the new-letters celebration, the parent corner (easier/harder, needs-practice list), and offline reload with the service worker. No console errors.
Recorder tested in Edge with a simulated microphone: record, save, play back, survive a reload, and get picked up by the game's sound player.
Not yet tested on the iPad (including the real microphone and permission prompt), and not yet with him. Narration has only been heard as device speech (in a headless browser, so effectively not heard at all).

## Next steps
1. Install on the iPad from the Pages URL (README), then **record the 25 letter sounds** in the app (⚙️ → Record sounds). Milestone M1.5, before the first test with him.
2. Check on the iPad: microphone prompt, that playback volume is normal after recording (iOS can route sound quietly while the mic is open), and that sounds blend when sliding fast.
3. Play with him for a few days. Watch: does he slide the arrow or only tap? Does he say the word out loud before picking a picture? Is 5 words per round the right length? Does he notice the coral vowels?
4. Then M2 Word Builder (PLAN.md 8.3).

## Decisions made along the way
- Emoji pictures as placeholders. They look different on Windows; check them on the iPad, and swap any he names differently (PLAN.md 11).
- c and k never appear together as Sound Lab choices (same sound).
- "tin" dropped (its picture looks like "can"); "sip" dropped (picture reads as "cup").
- The 💡 hint sounds the word out but never says the word.
