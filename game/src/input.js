// STARFALL input: keyboard (arrows + WASD), mouse steering, and the
// action keys (start, restart, pause). One object, read by the ship and by
// the game loop; nothing here knows about the game state.

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};

export function createInput(canvas) {
  const held = new Set();
  const mouse = { x: null, y: null, active: false };
  let pausePressed = false;
  let restartPressed = false;
  let startPressed = false;

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (action) {
      held.add(action);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP' || event.code === 'Escape') {
      pausePressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyR' || event.code === 'Enter' || event.code === 'Space') {
      if (event.code === 'Space') event.preventDefault();
      startPressed = true;
      restartPressed = true;
    }
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    mouse.active = true;
  }

  function onMouseLeave() { mouse.active = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);

  return {
    held,
    mouse,
    /** True once since the last read; then cleared. */
    consumePause() { const v = pausePressed; pausePressed = false; return v; },
    consumeRestart() { const v = restartPressed; restartPressed = false; return v; },
    consumeStart() { const v = startPressed; startPressed = false; return v; },
    /** Forget one-shot flags (e.g. when a screen changes). */
    clearOneShots() { pausePressed = false; restartPressed = false; startPressed = false; },
  };
}
