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
  const mouse = { x: null, y: null, active: false, firing: false };
  let pausePressed = false;
  let restartPressed = false;
  let startPressed = false;
  let mutePressed = false;

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
    if (event.code === 'KeyM') {
      mutePressed = true;
      return;
    }
    if (event.code === 'Space') {
      // Space fires while playing, and starts / restarts on the screens.
      held.add('fire');
      startPressed = true;
      restartPressed = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyR' || event.code === 'Enter') {
      startPressed = true;
      restartPressed = true;
    }
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
    if (event.code === 'Space') held.delete('fire');
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    mouse.active = true;
  }

  function onMouseLeave() { mouse.active = false; }

  function onMouseDown(event) {
    // Clicking the canvas fires; clicks on buttons are their own business.
    if (event.target === canvas) mouse.firing = true;
  }

  function onMouseUp() { mouse.firing = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    held,
    mouse,
    /** The fire button is held right now (Space or mouse). */
    get firing() { return held.has('fire') || mouse.firing; },
    /** True once since the last read; then cleared. */
    consumePause() { const v = pausePressed; pausePressed = false; return v; },
    consumeRestart() { const v = restartPressed; restartPressed = false; return v; },
    consumeStart() { const v = startPressed; startPressed = false; return v; },
    consumeMute() { const v = mutePressed; mutePressed = false; return v; },
    /** Forget one-shot flags (e.g. when a screen changes). */
    clearOneShots() { pausePressed = false; restartPressed = false; startPressed = false; mutePressed = false; },
  };
}
