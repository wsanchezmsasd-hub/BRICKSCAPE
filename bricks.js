// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 12;
const BRICK_ROWS = 14;
const BRICK_WIDTH = WIDTH / BRICK_COLUMNS;
const BRICK_HEIGHT = BRICK_WIDTH;
const BOARD_TOP = 48;
const BOARD_BOTTOM = BOARD_TOP + BRICK_ROWS * BRICK_HEIGHT;

const TETROMINO_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[2, 0], [0, 1], [1, 1], [2, 1]]
];

function createBrick(x, y, hitsRequired = 1, effect = null) {
  return {
    x,
    y,
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    hitsRequired,
    hitsRemaining: hitsRequired,
    effect
  };
}

function drawBricks() {
  for (const brick of bricks) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 10px Courier New";
    const label = brick.effect || (brick.hitsRequired > 1 ? `x${brick.hitsRemaining}` : "BLOCK");
    ctx.fillText(label, brick.x + brick.width / 2, brick.y + brick.height / 2, brick.width - 4);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
