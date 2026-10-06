import { W, H, COLORS, INK } from '../layout.js';
import { say, stopNarration, narrationKey } from '../systems/audio.js';
import {
  openMic, saveRecording, deleteRecording, hasRecording, recordingCount,
} from '../systems/recordings.js';
import { lettersUpTo, wordsUpTo, setCount, sndId, wordId } from '../systems/phonics.js';
import { makeTile } from '../ui/tile.js';
import { makeRoundButton, addHomeButton } from '../ui/button.js';
import { addLabel, addEmoji } from '../ui/text.js';

// Grown-ups only (from the ⚙️ panel). Record each letter sound, or word, in
// your own voice, right on the iPad. Saved on this device; the game uses a
// recording as soon as it's saved.
export default class RecorderScene extends Phaser.Scene {
  constructor() {
    super('Recorder');
  }

  create({ tab = 'sounds' } = {}) {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.lines = this.cache.json.get('narration');
    this.mic = null;
    this.opening = false;
    this.recording = false;
    this.events.once('shutdown', () => {
      stopNarration();
      this.closeMic();
    });
    addHomeButton(this);
    this.grid = this.add.container(0, 0);
    this.tabs = this.add.container(0, 0);
    this.showTab(tab);
  }

  items(tab) {
    return tab === 'sounds'
      ? lettersUpTo(setCount()).map((l) => ({ id: sndId(l), label: l, letter: l }))
      : wordsUpTo(setCount()).map((w) => ({ id: wordId(w), label: w }));
  }

  showTab(tab) {
    this.tab = tab;
    this.tabs.removeAll(true);
    const sounds = this.items('sounds'), words = this.items('words');
    this.tabs.add([
      tabButton(this, W / 2 - 370, 130, `Letter sounds  ${recordingCount('snd.')}/${sounds.length}`, tab === 'sounds',
        () => this.showTab('sounds')),
      tabButton(this, W / 2 + 370, 130, `Words  ${recordingCount('word.')}/${words.length}`, tab === 'words',
        () => this.showTab('words')),
      addLabel(this, W / 2, 260, tab === 'sounds'
        ? 'Record these first. Tap a letter, then tap the red button and say its sound.'
        : 'Optional: the iPad voice says words well. Record them to use your own voice.', 40),
    ]);
    this.drawGrid();
  }

  drawGrid() {
    this.grid.removeAll(true);
    const list = this.items(this.tab);
    const sounds = this.tab === 'sounds';
    const cols = sounds ? 7 : 8;
    const stepX = sounds ? 240 : 235, stepY = sounds ? 250 : 170;
    const top = sounds ? 450 : 420;
    list.forEach((item, i) => {
      const x = W / 2 + ((i % cols) - (cols - 1) / 2) * stepX;
      const y = top + Math.floor(i / cols) * stepY;
      const open = () => this.open(i);
      const thing = sounds
        ? makeTile(this, x, y, item.letter, { w: 180, h: 200, onTap: open })
        : wordCard(this, x, y, item.label, open);
      this.grid.add(thing);
      if (hasRecording(item.id)) {
        const cx = x + (sounds ? 80 : 95), cy = y - (sounds ? 90 : 55);
        this.grid.add([this.add.circle(cx, cy, 30, COLORS.go), addLabel(this, cx, cy, '✓', 40, '#ffffff')]);
      }
    });
  }

  // The panel for one line: what to say, record, listen, next.
  open(index) {
    this.modal?.destroy();
    const list = this.items(this.tab);
    const item = list[index];
    const line = this.lines[item.id];
    const m = this.add.container(0, 0).setDepth(3000);
    this.modal = m;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.card, 1);
    panel.fillRoundedRect(W / 2 - 820, H / 2 - 600, 1640, 1200, 70);
    m.add([this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setInteractive(), panel]);

    if (item.letter) {
      m.add(makeTile(this, W / 2, H / 2 - 370, item.letter, { w: 230, h: 260 }));
    } else {
      m.add(addLabel(this, W / 2, H / 2 - 370, item.label, 170));
    }
    const how = item.letter
      ? `Say the sound, not the letter's name. ${line.note ?? ''}`
      : 'Say the word clearly, the normal way. No need to stretch it out.';
    m.add(addLabel(this, W / 2, H / 2 - 150, how, 44).setWordWrapWidth(1400));
    const status = addLabel(this, W / 2, H / 2 + 10, '', 42, '#8e5cff').setWordWrapWidth(1400);
    m.add(status);
    const setStatus = (text) => status.setText(text);
    setStatus(hasRecording(item.id) ? 'Recorded. Tap ▶ to listen, or record again to replace it.' : 'Not recorded yet.');

    // Record / stop.
    const dot = this.add.circle(0, 0, 48, 0xffffff);
    const square = this.add.rectangle(0, 0, 90, 90, 0xffffff).setVisible(false);
    const rec = makeRoundButton(this, W / 2 - 340, H / 2 + 250, 130, 0xe8453c, [dot, square], () => {
      if (this.recording) this.stopRecording(item, setStatus);
      else this.startRecording(item, setStatus);
    });
    this.recUi = { dot, square, rec };

    // Listen: the recording, or whatever the game would play now.
    const tri = this.add.graphics();
    tri.fillStyle(0xffffff, 1);
    tri.fillTriangle(-40, -60, -40, 60, 65, 0);
    const play = makeRoundButton(this, W / 2, H / 2 + 250, 130, COLORS.go, tri, () => {
      if (this.recording) return;
      if (!hasRecording(item.id) && !this.cache.audio.exists(narrationKey(item.id))) {
        setStatus('Not recorded yet, so this is the iPad voice.');
      }
      say(this, item.id);
    });

    const next = makeRoundButton(this, W / 2 + 340, H / 2 + 250, 130, COLORS.consonant,
      addLabel(this, 0, 0, 'Next', 54, '#ffffff'), () => {
        this.cancelRecording();
        this.open((index + 1) % list.length);
      });

    const remove = makeRoundButton(this, W / 2 - 650, H / 2 + 470, 90, 0xf2f2f2, addEmoji(this, 0, 0, '🗑️', 80), async () => {
      if (this.recording || !hasRecording(item.id)) return;
      await deleteRecording(this.game, item.id);
      setStatus('Deleted. The game will use the iPad voice for this one.');
    });
    const done = makeRoundButton(this, W / 2 + 650, H / 2 + 470, 90, COLORS.go, addLabel(this, 0, 0, '✓', 80, '#ffffff'), () => {
      this.cancelRecording();
      stopNarration();
      m.destroy();
      this.modal = null;
      this.showTab(this.tab);
    });
    m.add([rec, play, next, remove, done]);
  }

  // The microphone is opened for each recording and closed straight after:
  // while it's open, iOS can play sound quietly, which would make ▶ hard to hear.
  async startRecording(item, setStatus) {
    if (this.opening) return; // a second tap while the mic is still opening
    stopNarration();
    this.opening = true;
    try {
      this.mic = await openMic(this.sound.context);
    } catch {
      setStatus('The microphone is blocked. On the iPad: Settings → Apps → Safari → Microphone → Allow, then come back.');
      return;
    } finally {
      this.opening = false;
    }
    if (!this.sys.isActive() || !this.modal) {
      this.closeMic();
      return;
    }
    this.recording = true;
    this.mic.start(() => this.stopRecording(item, setStatus));
    const { dot, square, rec } = this.recUi;
    dot.setVisible(false);
    square.setVisible(true);
    this.recPulse = this.tweens.add({ targets: rec, scale: 1.08, duration: 400, yoyo: true, repeat: -1 });
    setStatus('Recording… say it now, then tap ■.');
  }

  async stopRecording(item, setStatus) {
    if (!this.recording) return;
    const clip = this.mic.stop();
    this.closeMic();
    this.resetRecordButton();
    if (!clip) {
      setStatus("I didn't hear anything. Hold the iPad a little closer and record again.");
      return;
    }
    try {
      await saveRecording(this.game, item.id, clip);
    } catch {
      setStatus("Couldn't save on this iPad (storage may be full).");
      return;
    }
    setStatus('Saved! Listen to check it. Not right? Just record again.');
    say(this, item.id);
  }

  cancelRecording() {
    if (!this.recording) return;
    this.mic.stop();
    this.closeMic();
    this.resetRecordButton();
  }

  closeMic() {
    this.mic?.close();
    this.mic = null;
  }

  resetRecordButton() {
    this.recording = false;
    this.recPulse?.stop();
    const { dot, square, rec } = this.recUi;
    if (rec.active) {
      rec.setScale(1);
      dot.setVisible(true);
      square.setVisible(false);
    }
  }
}

function tabButton(scene, x, y, text, active, onTap) {
  const w = 680, h = 130;
  const button = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(active ? COLORS.purple : 0xd5dbe8, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, 40);
  button.add([bg, addLabel(scene, 0, 0, text, 50, active ? '#ffffff' : INK)]);
  button.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  button.on('pointerup', onTap);
  return button;
}

function wordCard(scene, x, y, word, onTap) {
  const w = 210, h = 130;
  const card = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.card, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, 30);
  card.add([bg, addLabel(scene, 0, 0, word, 70)]);
  card.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  card.on('pointerup', onTap);
  return card;
}
