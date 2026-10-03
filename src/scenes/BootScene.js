import { W, H, COLORS, MIN_TOUCH } from '../layout.js';
import { preloadNarration, unlockAudio, sayAll } from '../systems/audio.js';
import { initPhonics } from '../systems/phonics.js';
import { loadRecordings } from '../systems/recordings.js';

// "Tap to start": iOS only allows sound after a tap, so every session begins here.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.json('narration', 'src/data/narration.json');
    this.load.json('phonics', 'src/data/phonics.json');
    this.load.once('filecomplete-json-narration', () => preloadNarration(this));
  }

  create() {
    initPhonics(this.cache.json.get('phonics'));
    // Phaser draws text once, so letters must wait for the reading font.
    const fontReady = document.fonts
      ? document.fonts.load('700 100px Andika').catch(() => {})
      : Promise.resolve();
    // Sounds a grown-up recorded on this iPad (Record sounds, in the ⚙️ panel).
    const ready = Promise.all([fontReady, loadRecordings(this.game)]);

    const radius = Math.max(MIN_TOUCH, 260);
    const button = this.add.container(W / 2, H / 2);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.18);
    g.fillCircle(0, 18, radius);
    g.fillStyle(COLORS.go, 1);
    g.fillCircle(0, 0, radius);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(-radius * 0.28, -radius * 0.42, -radius * 0.28, radius * 0.42, radius * 0.45, 0);
    button.add(g);

    this.tweens.add({
      targets: button,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    button.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    button.once('pointerup', () => {
      // Both of these must happen inside the tap itself.
      unlockAudio(this);
      sayAll(this, ['boot.welcome', 'home.pick']);
      this.tweens.killTweensOf(button);
      this.tweens.add({
        targets: button,
        scale: 0,
        duration: 250,
        ease: 'Back.easeIn',
        onComplete: () => ready.then(() => this.scene.start('Home')),
      });
    });
  }
}
