import { W, H, INK } from '../layout.js';
import { addEmoji, addLabel } from './text.js';
import { isSoundOn, setSoundOn, resetProgress, currentSet, setCurrentSet } from '../systems/save.js';
import { setMuted } from '../systems/audio.js';
import { lettersOfSet, setCount, needsPractice } from '../systems/phonics.js';

const HOLD_MS = 3000;

// A small gear in the corner. Holding it for 3 seconds opens the grown-ups'
// panel; a quick tap does nothing, so kids won't wander in.
// `onChange` runs after anything that changes what the home screen shows.
export function addParentCorner(scene, onChange) {
  const x = W - 110, y = 110;
  const gear = addEmoji(scene, x, y, '⚙️', 70).setAlpha(0.45);
  const ring = scene.add.graphics();
  gear.setInteractive(new Phaser.Geom.Circle(gear.width / 2, gear.height / 2, 80), Phaser.Geom.Circle.Contains);

  let timer = null;
  const cancel = () => {
    timer?.remove();
    timer = null;
    ring.clear();
  };

  gear.on('pointerdown', () => {
    cancel();
    timer = scene.time.addEvent({
      delay: HOLD_MS,
      callback: () => {
        cancel();
        openPanel(scene, onChange);
      },
    });
  });
  gear.on('pointerup', cancel);
  gear.on('pointerout', cancel);

  const drawRing = () => {
    if (!timer) return;
    ring.clear();
    ring.lineStyle(10, 0x1d2a4a, 0.6);
    ring.beginPath();
    ring.arc(x, y, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timer.getProgress());
    ring.strokePath();
  };
  // Scene event listeners outlive a restart, so remove this one on shutdown.
  scene.events.on('update', drawRing);
  scene.events.once('shutdown', () => scene.events.off('update', drawRing));
}

function openPanel(scene, onChange) {
  const layer = scene.add.container(0, 0).setDepth(5000);
  const top = H / 2 - 600;

  const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
  const panel = scene.add.rectangle(W / 2, H / 2, 1500, 1300, 0xffffff).setStrokeStyle(8, 0xdddddd);
  const title = addLabel(scene, W / 2, top + 80, 'Grown-ups', 72);
  layer.add([shade, panel, title]);

  const soundLabel = () => `Sound: ${isSoundOn() ? 'On' : 'Off'}`;
  const sound = rectButton(scene, W / 2, top + 230, 700, soundLabel(), 0x34c759, () => {
    const on = !isSoundOn();
    setSoundOn(on);
    setMuted(scene.game, !on);
    sound.label.setText(soundLabel());
  });

  // Letter set: what he's working on now, with easier/harder.
  const setText = addLabel(scene, W / 2, top + 400, '', 48);
  const practiceText = addLabel(scene, W / 2, top + 590, '', 40, INK).setWordWrapWidth(1300).setOrigin(0.5, 0);
  const refresh = () => {
    const n = currentSet();
    setText.setText(`Letter set ${n} of ${setCount()}:  ${lettersOfSet(n).join(' ')}`);
    const { sounds, words } = needsPractice();
    practiceText.setText(
      `Needs practice (recent first tries):\n` +
      `sounds: ${sounds.join(' ') || 'none yet'}\n` +
      `words: ${words.join(', ') || 'none yet'}`
    );
  };
  refresh();
  const easier = rectButton(scene, W / 2 - 300, top + 500, 460, '◀ Easier', 0x8e5cff, () => {
    if (currentSet() > 1) setCurrentSet(currentSet() - 1);
    refresh();
    onChange?.();
  });
  const harder = rectButton(scene, W / 2 + 300, top + 500, 460, 'Harder ▶', 0x8e5cff, () => {
    if (currentSet() < setCount()) setCurrentSet(currentSet() + 1);
    refresh();
    onChange?.();
  });

  // Record the letter sounds (and words) in a grown-up's voice, on this iPad.
  const record = rectButton(scene, W / 2, top + 830, 700, '🎙 Record sounds', 0xe8453c, () => {
    scene.scene.start('Recorder');
  });

  let armed = false;
  const reset = rectButton(scene, W / 2, top + 980, 700, 'Reset progress', 0xf0a030, () => {
    if (!armed) {
      armed = true;
      reset.label.setText('Tap again to erase');
      reset.bg.setFillStyle(0xe8453c);
      return;
    }
    resetProgress();
    reset.label.setText('Progress reset');
    reset.disableInteractive();
    refresh();
    onChange?.();
  });

  const close = rectButton(scene, W / 2, top + 1130, 700, 'Done', 0x3d7bff, () => layer.destroy());
  layer.add([sound, setText, easier, harder, practiceText, record, reset, close]);
}

function rectButton(scene, x, y, w, text, color, onTap) {
  const h = 130;
  const button = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(6, 0x000000, 0.12);
  const label = addLabel(scene, 0, 0, text, 52, '#ffffff');
  button.add([bg, label]);
  button.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  button.on('pointerup', onTap);
  button.bg = bg;
  button.label = label;
  return button;
}
