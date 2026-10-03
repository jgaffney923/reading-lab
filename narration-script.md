# Narration script

**0 of 95 lines recorded** (letter sounds: 0 of 26).

How to add a recording (details in README.md):
1. Record the line (iPhone Voice Memos is fine) and save it into `recordings-raw/`.
2. Run `node tools/prepare-narration.mjs "recordings-raw/<file>.m4a" <id>`.
3. Regenerate this file with `node tools/make-narration-script.mjs`.

Tips: quiet room, phone about a hand's width from your mouth, a short pause
before and after each line, one line per file. Upbeat and slow, as if talking
to a 5-year-old.

## 1. Letter sounds — record these first
The computer voice can't say pure sounds, so these matter most. Say the
**sound**, never the letter's name.
- Sounds you can hold (m, s, f, l, n, r, v, z, and the vowels): hold for about one second, "mmmm".
- Short sounds (b, c/k, d, g, h, j, p, t, w, y, x): as short and crisp as you can, with no "uh" after. "t" is a puff of air, not "tuh".
- Vowels are the short sounds: a as in ant, e as in egg, i as in itch, o as in octopus, u as in up.
- Record each one twice and keep the cleaner one.

| File name (id) | Say this | How | Status |
|---|---|---|---|
| `snd.s` | **sss** | Hold it like a snake, about a second. No 'uh'. | TO RECORD |
| `snd.a` | **a (as in ant)** | Short a, the start of 'ant'. Hold it about a second. | TO RECORD |
| `snd.t` | **t** | Short and crisp, just a puff of air. No 'tuh'. | TO RECORD |
| `snd.p` | **p** | Short and crisp, just a puff of air. No 'puh'. | TO RECORD |
| `snd.i` | **i (as in itch)** | Short i, the start of 'itch'. Hold it about a second. | TO RECORD |
| `snd.n` | **nnn** | Hold it, humming through your nose, about a second. | TO RECORD |
| `snd.m` | **mmm** | Hold it, lips together, about a second. | TO RECORD |
| `snd.d` | **d** | Short and crisp. No 'duh'. | TO RECORD |
| `snd.o` | **o (as in octopus)** | Short o, the start of 'octopus'. Hold it about a second. | TO RECORD |
| `snd.g` | **g** | Short and crisp, from the back of the throat. No 'guh'. | TO RECORD |
| `snd.c` | **c (as in cat)** | The hard 'k' sound, short and crisp. Record the same as k. | TO RECORD |
| `snd.k` | **k** | Short and crisp. No 'kuh'. | TO RECORD |
| `snd.e` | **e (as in egg)** | Short e, the start of 'egg'. Hold it about a second. | TO RECORD |
| `snd.u` | **u (as in up)** | Short u, the start of 'up'. Hold it about a second. | TO RECORD |
| `snd.h` | **h** | Just a breath out, like fogging a window. No 'huh'. | TO RECORD |
| `snd.b` | **b** | Short and crisp. No 'buh'. | TO RECORD |
| `snd.r` | **rrr** | Hold it like a growl, about a second. Not 'er' or 'ruh'. | TO RECORD |
| `snd.f` | **fff** | Hold it, top teeth on your lip, about a second. | TO RECORD |
| `snd.l` | **lll** | Hold it, tongue behind your top teeth, about a second. Not 'luh'. | TO RECORD |
| `snd.w` | **w** | Round lips, short. No 'wuh'. | TO RECORD |
| `snd.v` | **vvv** | Hold it, a buzzy 'f', about a second. | TO RECORD |
| `snd.x` | **ks (as at the end of box)** | The 'ks' at the end of 'box'. Short. | TO RECORD |
| `snd.z` | **zzz** | Hold it like a buzzing bee, about a second. | TO RECORD |
| `snd.j` | **j** | Short and crisp. No 'juh'. | TO RECORD |
| `snd.y` | **y (as in yes)** | Short, the start of 'yes'. No 'yuh'. | TO RECORD |
| `snd.q` | **kw (as in queen)** | q nearly always comes with u, so say 'kw' as at the start of 'queen'. Short, no 'uh'. | TO RECORD |

## 2. Words
Say each word normally and clearly, like reading it to him. Don't stretch it out:
the game blends the sound recordings itself.

| File name (id) | Say this | Status |
|---|---|---|
| `word.ant` | ant | TO RECORD |
| `word.map` | map | TO RECORD |
| `word.man` | man | TO RECORD |
| `word.nap` | nap | TO RECORD |
| `word.tap` | tap | TO RECORD |
| `word.pan` | pan | TO RECORD |
| `word.pin` | pin | TO RECORD |
| `word.sad` | sad | TO RECORD |
| `word.mad` | mad | TO RECORD |
| `word.dog` | dog | TO RECORD |
| `word.pig` | pig | TO RECORD |
| `word.cat` | cat | TO RECORD |
| `word.cap` | cap | TO RECORD |
| `word.can` | can | TO RECORD |
| `word.pot` | pot | TO RECORD |
| `word.kid` | kid | TO RECORD |
| `word.sun` | sun | TO RECORD |
| `word.nut` | nut | TO RECORD |
| `word.red` | red | TO RECORD |
| `word.hen` | hen | TO RECORD |
| `word.ten` | ten | TO RECORD |
| `word.pen` | pen | TO RECORD |
| `word.bed` | bed | TO RECORD |
| `word.bus` | bus | TO RECORD |
| `word.bug` | bug | TO RECORD |
| `word.mug` | mug | TO RECORD |
| `word.hat` | hat | TO RECORD |
| `word.bat` | bat | TO RECORD |
| `word.rat` | rat | TO RECORD |
| `word.tub` | tub | TO RECORD |
| `word.hug` | hug | TO RECORD |
| `word.run` | run | TO RECORD |
| `word.leg` | leg | TO RECORD |
| `word.lip` | lip | TO RECORD |
| `word.log` | log | TO RECORD |
| `word.lab` | lab | TO RECORD |
| `word.web` | web | TO RECORD |
| `word.van` | van | TO RECORD |
| `word.box` | box | TO RECORD |
| `word.fox` | fox | TO RECORD |
| `word.six` | six | TO RECORD |
| `word.zip` | zip | TO RECORD |
| `word.jet` | jet | TO RECORD |
| `word.yum` | yum | TO RECORD |

## 3. Instructions and praise

| File name (id) | Say this | Status |
|---|---|---|
| `boot.welcome` | Hi, scientist! Let's read and do experiments! | TO RECORD |
| `home.pick` | Pick a machine! | TO RECORD |
| `home.levelUp` | Wow! You unlocked new letters! Listen. | TO RECORD |
| `praise.1` | You got it! | TO RECORD |
| `praise.2` | Great reading! | TO RECORD |
| `praise.3` | Awesome, scientist! | TO RECORD |
| `praise.4` | Yes! | TO RECORD |
| `praise.5` | Nice mixing! | TO RECORD |
| `effort.1` | Great effort! | TO RECORD |
| `effort.2` | Nice experimenting! | TO RECORD |
| `effort.3` | That's it! | TO RECORD |
| `soundlab.intro` | This is the Sound Lab! I'll say a sound. You tap the letter that makes that sound. | TO RECORD |
| `soundlab.find` | Find the letter that says | TO RECORD |
| `soundlab.listen` | Let's listen again. | TO RECORD |
| `mixer.intro` | This is the Word Mixer! Touch each letter to hear its sound. Then slide along the arrow to mix the sounds into a word. | TO RECORD |
| `mixer.touch` | Touch each letter to hear its sound. | TO RECORD |
| `mixer.slide` | Slide along the arrow to mix the sounds. Faster makes a word! | TO RECORD |
| `mixer.which` | Which picture is it? | TO RECORD |
| `mixer.thatOne` | That one is | TO RECORD |
| `mixer.listen` | Let's listen to the sounds together. | TO RECORD |
| `reward.full` | The lab energy is full! Tap the big button to start the experiment! | TO RECORD |
| `reward.rocket` | Three, two, one, blast off! | TO RECORD |
| `reward.volcano` | Whoa! The volcano is erupting! | TO RECORD |
| `reward.potion` | Look at all the colors! | TO RECORD |
| `reward.again` | Great work, scientist! Play again, or go home. | TO RECORD |
