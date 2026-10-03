# Reading Lab Jr.

A touch-first reading game for a 5-year-old: he sounds out words to power science experiments. It runs offline on an iPad as a home-screen web app. See [PLAN.md](PLAN.md) for the design (section 5 is how reading is taught), [STATUS.md](STATUS.md) for where things stand.

- Engine: Phaser **3.90.0**, vendored at `vendor/phaser.min.js` (no CDN, no build step). Shell shared with `../chemistry app`.
- Font: Andika Bold (SIL Open Font License, `assets/fonts/OFL.txt`).
- Games: **Sound Lab** (find the letter for a sound) and **Word Mixer** (sound out a word, pick its picture). Each round ends with an experiment.
- Words, letters and pictures: `src/data/phonics.json`. Spoken lines: `src/data/narration.json`. After editing either, run `node tools/check-content.mjs` (add `--fix` to create lines for new sounds and words).

## Run it on the PC
Open the folder in VS Code and use **Live Server** on `index.html`, or run `python -m http.server 8080` and open `http://localhost:8080`.
Edge/Chrome devtools → device toolbar → iPad, landscape.

On `localhost` the offline service worker is switched off, so edits show up on reload.
To test offline mode locally, add `?sw=1` to the URL.

## Deploy (GitHub Pages)
1. `node tools/update-sw.mjs` (refreshes the offline file list and bumps `CACHE_VERSION`).
2. Bump `APP_VERSION` in `src/version.js` (shown faintly in the corner so you can tell which build the iPad has).
3. Commit and push to `main`. GitHub Pages publishes in a minute or two at `https://jgaffney923.github.io/reading-lab/`.

## How to test on the iPad
Service workers only run over HTTPS, so test on the iPad from the GitHub Pages URL.

1. Open the Pages URL in **Safari**. Share → **Add to Home Screen**.
2. Launch it from the home screen, tap the green button, check you hear the voice.
3. **Offline:** Airplane Mode on, close the app fully, reopen. It should still work.
4. **Update:** after a deploy, open once with Wi-Fi on, close fully, reopen. The corner version number should change.
5. **Word Mixer:** tap each letter, then slide a finger along the purple arrow (fast and slow). Pictures appear only after every sound has been heard. Pick a different picture once: it should say what you picked, sound the word out, and glow the right one. Nothing should ever sound like "wrong".
6. **Sound Lab:** pick a different letter once; it says that letter's sound, then the target sound again, and the right letter glows.
7. **Experiments:** each finished round launches one (rocket, volcano, potion in turn); they show up along the bottom of the home screen.
8. **Grown-ups panel:** hold the ⚙️ for 3 seconds. Check the letter set, Easier/Harder, and the "needs practice" list.

Notes:
- The home-screen app keeps its own storage, separate from Safari tabs.
- No sound? Check the side switch / silent mode and volume.
- **Guided Access** (Settings → Accessibility → Guided Access) keeps him inside the app: triple-click the side/home button to start it.

## Recording the letter sounds (on the iPad)
**Record the letter sounds before the first real test with him.** Until they're recorded, the iPad's built-in voice reads them, and it can't say pure sounds (it says "tuh" for t, and some vowels come out wrong).

1. In the installed app, hold the ⚙️ for 3 seconds → **Record sounds**.
2. Tap a letter. Read the tip, tap the red button, say the sound, tap ■. It plays back automatically.
3. Not right? Record again (it replaces the old one). Happy? Tap **Next**. A ✓ marks each recorded letter.
4. Allow the microphone when the iPad asks. If it was refused: Settings → Apps → Safari → Microphone → Allow.

The app trims the silence and evens out the volume itself. Recordings are saved on that iPad only (inside the installed app), so they survive updates but not deleting the app, and they aren't uploaded anywhere. The **Words** tab is optional: the iPad voice says whole words well.

## Recording narration on the PC (optional)
For recordings that ship with the app to every device. Every line, with how to say it, is in [narration-script.md](narration-script.md).

1. Record each line with the iPhone **Voice Memos** app (it saves `.m4a`).
2. Save it into `recordings-raw/` (kept on this PC only, never published).
3. Run `node tools/prepare-narration.mjs "recordings-raw/<file>.m4a" <line-id>` (e.g. `snd.m`).
   It trims the quiet, evens out the volume, saves `assets/audio/narration/<line-id>.m4a`, and marks the line recorded.
   Needs ffmpeg on PATH, or `FFMPEG` set to its full path. (ffmpeg isn't installed on this PC yet: `winget install ffmpeg` or `choco install ffmpeg`.)
4. Run `node tools/make-narration-script.mjs` to update the checklist, then deploy.

`node tools/make-placeholder-voices.mjs` (Windows, needs ffmpeg) makes stand-in computer-voice files for instructions and words, but never for letter sounds.

## Dev tools (`tools/`, never loaded by the game)
- `check-content.mjs`: phonics rules check (letters taught before use, pictures unique, every sound and word has a line).
- `update-sw.mjs`: offline file list + cache version.
- `make-narration-script.mjs`: regenerates `narration-script.md`.
- `prepare-narration.mjs`: cleans up a recording and adds it to the game.
- `make-placeholder-voices.mjs`: stand-in computer voice for unrecorded instructions and words.
- `make-icons.mjs`: redraws the placeholder app icons.
