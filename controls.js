const keys = {};

function movePaddleToPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = WIDTH / bounds.width;
  paddle.x = (event.clientX - bounds.left) * scaleX - paddle.width / 2;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
}

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (gameMode === "intermission" && !event.repeat) {
    if (key === "1" || key === "2") {
      buyUpgrade(Number(key) - 1);
    } else if (key === "enter") {
      continueWave();
    }
  }
  if (!event.repeat && gameMode === "playing" && (key === " " || key === "enter")) {
    launchBalls();
  }
  if (event.key.startsWith("Arrow") || key === " ") {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", function () {
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
});

canvas.addEventListener("pointerdown", function (event) {
  canvas.setPointerCapture(event.pointerId);
  updateAim(event);
  movePaddleToPointer(event);
  launchBalls();
});

canvas.addEventListener("pointermove", function (event) {
  updateAim(event);
  if (event.buttons > 0 || event.pointerType === "touch") {
    movePaddleToPointer(event);
  }
});
