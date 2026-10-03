// Drag helpers. Works with touch and mouse through Phaser's pointer input.

// How far (game units) a finger can wobble and still count as a tap.
const TAP_SLOP = 24;

// Makes a container draggable, with a lift effect while held.
// Calls onTap if it was touched without moving, onDrop when released after a drag.
export function makeDraggable(scene, obj, { onTap, onDrop, onPickUp }) {
  scene.input.setDraggable(obj);
  scene.input.dragDistanceThreshold = TAP_SLOP;

  // Where on the object the finger landed. Phaser only starts a drag after
  // TAP_SLOP of movement and measures from there, which would leave the object
  // trailing behind the finger; keeping the grab point under the finger fixes that.
  let grab = { x: 0, y: 0 };
  obj.on('pointerdown', (pointer) => {
    grab = { x: pointer.worldX - obj.x, y: pointer.worldY - obj.y };
  });
  obj.on('dragstart', () => {
    scene.tweens.killTweensOf(obj);
    obj.setDepth(1000);
    scene.tweens.add({ targets: obj, scale: 1.12, duration: 100 });
    onPickUp?.();
  });
  obj.on('drag', (pointer) => {
    obj.setPosition(pointer.worldX - grab.x, pointer.worldY - grab.y);
  });
  obj.on('dragend', () => {
    scene.tweens.add({ targets: obj, scale: 1, duration: 100 });
    onDrop(obj.x, obj.y);
  });
  obj.on('pointerup', (pointer) => {
    if (pointer.getDistance() < TAP_SLOP) onTap?.();
  });
}

// Puts an object back where it came from with a bounce.
export function returnTo(scene, obj, x, y) {
  scene.tweens.add({ targets: obj, x, y, duration: 450, ease: 'Back.easeOut' });
}
