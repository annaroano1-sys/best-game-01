// STARFALL — keyboard, mouse and fire input.
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};
export function createInput(canvas) {
  const held = new Set();
  const mouse = { x: null, y: null, active: false, firing: false };
  // Round 6.1: auto-fire — the ship always shoots, the player only steers.
  // (Modern mobile shmup style: on a phone the player just drags to fly.)
  const AUTO_FIRE = true;
  let pausePressed = false;
  let restartPressed = false;
  let startPressed = false;
  let mutePressed = false;
  let bombPressed = false;
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
      held.add('fire');
      startPressed = true;
      restartPressed = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyB') {
      bombPressed = true;
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
    if (event.target === canvas) mouse.firing = true;
  }
  function onMouseUp() { mouse.firing = false; }
  // Touch: same as mouse, but with preventDefault so the browser does not
  // scroll/zoom instead of steering (that is why touch firing failed on phones).
  function onTouchPos(touch) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    mouse.active = true;
  }
  function onTouchStart(event) {
    event.preventDefault();
    if (event.touches[0]) onTouchPos(event.touches[0]);
  }
  function onTouchMove(event) {
    event.preventDefault();
    if (event.touches[0]) onTouchPos(event.touches[0]);
  }
  function onTouchEnd(event) {
    event.preventDefault();
    if (event.touches.length === 0) mouse.active = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  return {
    held,
    mouse,
    get firing() { return AUTO_FIRE || held.has('fire') || mouse.firing; },
    consumePause() { const v = pausePressed; pausePressed = false; return v; },
    consumeRestart() { const v = restartPressed; restartPressed = false; return v; },
    consumeStart() { const v = startPressed; startPressed = false; return v; },
    consumeMute() { const v = mutePressed; mutePressed = false; return v; },
    consumeBomb() { const v = bombPressed; bombPressed = false; return v; },
    clearOneShots() { pausePressed = false; restartPressed = false; startPressed = false; mutePressed = false; bombPressed = false; },
  };
}
