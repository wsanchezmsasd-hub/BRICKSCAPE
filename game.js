// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 800


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 4;
let permanentBallCount = 1;
let balls = [];
let pendingBallLaunches = [];
let aimAngle = 0;
let volleyActive = false;

function createBall(x, y, temporary = false) {
  return { x, y, width: 18, height: 18, vx: 0, vy: 0, state: "held", temporary };
}

function resetBalls() {
  balls = Array.from({ length: permanentBallCount }, () => createBall());
  pendingBallLaunches = [];
  volleyActive = false;
  positionHeldBalls();
}

function positionHeldBalls() {
  const heldBalls = balls.filter((ball) => ball.state === "held");
  heldBalls.forEach((ball, index) => {
    const spacing = Math.min(ball.width + 5, paddle.width / heldBalls.length);
    ball.x = paddle.x + paddle.width / 2 - ball.width / 2 + (index - (heldBalls.length - 1) / 2) * spacing;
    ball.y = paddle.y - ball.height;
  });
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 60,
  y: HEIGHT - 30,
  width: 120,
  height: 12,
  speed: 10
};


// ------------------------------------------------------------
// FALLING TETRIS PIECES
// ------------------------------------------------------------
let bricks = [];
let enemyEntities = [];
let spawnedPieces = 0;
let piecesThisWave = 0;
let brickChunks = [];
let chunkBalance = 0;
let chunkValue = GAME_CONFIG.brickChunks.value;
let chunkDropChance = GAME_CONFIG.brickChunks.dropChance;
let gameMode = "playing";
let wave = 1;
let gameOverReason = "";
let upgradeOffers = [];
const purchasedUpgrades = new Set();

const upgrades = [
  {
    id: "paddle5",
    name: "+5% Paddle",
    description: "Paddle width +5%",
    cost: 4,
    apply() {
      paddle.width = Math.min(WIDTH * 0.4, paddle.width * 1.05);
    }
  },
  {
    id: "paddle10",
    name: "+10% Paddle",
    description: "Paddle width +10%",
    cost: 6,
    apply() {
      paddle.width = Math.min(WIDTH * 0.4, paddle.width * 1.1);
    }
  },
  {
    id: "chunkChance",
    name: "+15% Chunk Chance",
    description: "Higher chunk drop chance",
    cost: 5,
    apply() {
      chunkDropChance = Math.min(0.95, chunkDropChance + 0.15);
    }
  },
  {
    id: "chunkBonus",
    name: "+1 Chunk Value",
    description: "Chunks are worth +1",
    cost: 5,
    apply() {
      chunkValue += 1;
    }
  },
  {
    id: "extraBall",
    name: "+1 Starting Ball",
    description: "Launch one more ball each volley",
    cost: 8,
    apply() {
      permanentBallCount += 1;
    }
  }
];


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  enemiesSystem(enemyEntities);
  movePaddle();
  updateBrickChunks();

  if (gameMode === "gameover") {
    return;
  }
  if (gameMode === "intermission") {
    return;
  }

  updatePendingBallLaunches();
  positionHeldBalls();
  if (!volleyActive) {
    return;
  }

  for (let index = balls.length - 1; index >= 0; index--) {
    const ball = balls[index];
    if (ball.state !== "active") continue;
    moveBall(ball);
    bounceOffWalls(ball);
    bounceOffPaddle(ball);
    bounceOffBottom(ball);
    if (ball.state === "active") bounceOffBricks(ball);
  }

  if (balls.every((ball) => ball.state === "held") && pendingBallLaunches.length === 0) {
    finishVolley();
  }
}

function scheduleExtraBall(x, y, vx, vy) {
  pendingBallLaunches.push({ x, y, vx, vy, ticksRemaining: 12 });
}

function updatePendingBallLaunches() {
  for (let index = pendingBallLaunches.length - 1; index >= 0; index--) {
    const launch = pendingBallLaunches[index];
    launch.ticksRemaining -= 1;
    if (launch.ticksRemaining > 0) continue;

    const extraBall = createBall(launch.x, launch.y, true);
    extraBall.state = "active";
    extraBall.vx = launch.vx;
    extraBall.vy = launch.vy;
    balls.push(extraBall);
    pendingBallLaunches.splice(index, 1);
  }
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall(ball) {
  ball.x = ball.x + ball.vx;
  ball.y = ball.y + ball.vy;
}

function updateAim(event) {
  const bounds = canvas.getBoundingClientRect();
  const pointerX = (event.clientX - bounds.left) * WIDTH / bounds.width;
  aimAngle = Math.max(-0.85, Math.min(0.85, (pointerX - WIDTH / 2) / WIDTH * 1.7));
}

function launchBalls() {
  if (gameMode !== "playing" || volleyActive || balls.length === 0) return;
  for (const ball of balls) {
    if (ball.state !== "held") continue;
    ball.state = "active";
    ball.vx = Math.sin(aimAngle) * BALL_SPEED;
    ball.vy = -Math.cos(aimAngle) * BALL_SPEED;
  }
  volleyActive = true;
}

function finishVolley() {
  volleyActive = false;
  positionHeldBalls();
  if (gameMode !== "playing") return;

  clearCompletedRows();
  const rowsToDrop = Math.random() < 0.5 ? 1 : 2;
  if (!dropBoardRows(rowsToDrop)) {
    endGame("THE STACK REACHED THE BOTTOM");
    return;
  }
  checkBottomRow();
  if (gameMode !== "playing") return;

  if (spawnedPieces < piecesThisWave) {
    spawnFallingPiece();
  } else {
    beginIntermission();
    return;
  }
}

function dropBoardRows(rowCount) {
  if (bricks.some((brick) => brick.y + rowCount * BRICK_HEIGHT >= BOARD_BOTTOM)) {
    return false;
  }
  for (const brick of bricks) {
    brick.y += rowCount * BRICK_HEIGHT;
  }
  return true;
}

function spawnFallingPiece() {
  const shapeOrder = TETROMINO_SHAPES
    .map((shape) => ({ shape, order: Math.random() }))
    .sort((a, b) => a.order - b.order);

  for (const { shape } of shapeOrder) {
    const shapeWidth = Math.max(...shape.map(([col]) => col)) + 1;
    const possibleColumns = Array.from(
      { length: BRICK_COLUMNS - shapeWidth + 1 },
      (_, column) => column
    ).sort(() => Math.random() - 0.5);

    for (const column of possibleColumns) {
      const positions = shape.map(([col, row]) => ({
        x: (column + col) * BRICK_WIDTH,
        y: BOARD_TOP + row * BRICK_HEIGHT
      }));
      const overlaps = positions.some((position) => bricks.some((brick) =>
        brick.x === position.x && brick.y === position.y
      ));
      if (overlaps) {
        continue;
      }

      const minimumStrength = 1 + Math.floor((wave - 1) / GAME_CONFIG.fallingPieces.strengthWavesPerIncrease);
      const effectIndex = Math.floor(Math.random() * positions.length);
      const effects = ["ROW", "BALL"];
      const effect = effects[Math.floor(Math.random() * effects.length)];
      const cells = positions.map(({ x, y }, index) =>
        createBrick(
          x,
          y,
          minimumStrength + Math.floor(Math.random() * (minimumStrength + 1)),
          index === effectIndex ? effect : null
        )
      );
      bricks.push(...cells);
      spawnedPieces += 1;
      return true;
    }
  }

  endGame("THE STACK REACHED THE TOP");
  return false;
}

function clearCompletedRows() {
  for (let row = BRICK_ROWS - 2; row >= 0; row--) {
    const y = BOARD_TOP + row * BRICK_HEIGHT;
    const occupiedColumns = new Set(
      bricks.filter((brick) => brick.y === y).map((brick) => Math.round(brick.x / BRICK_WIDTH))
    );
    if (occupiedColumns.size !== BRICK_COLUMNS) {
      continue;
    }

    bricks = bricks.filter((brick) => brick.y !== y);
    for (const brick of bricks) {
      if (brick.y < y) {
        brick.y += BRICK_HEIGHT;
      }
    }
    row += 1;
  }
}

function checkBottomRow() {
  const bottomY = BOARD_BOTTOM - BRICK_HEIGHT;
  const occupiedColumns = new Set(
    bricks.filter((brick) => brick.y === bottomY).map((brick) => Math.round(brick.x / BRICK_WIDTH))
  );
  if (occupiedColumns.size === BRICK_COLUMNS) {
    endGame("THE BOTTOM ROW IS FULL");
  }
}

function createBrickChunk(x, y) {
  const settings = GAME_CONFIG.brickChunks;
  brickChunks.push({
    x,
    y,
    width: settings.size,
    height: settings.size,
    vx: (Math.random() - 0.5) * settings.horizontalSpread,
    vy: settings.launchVelocity,
    angle: 0
  });
}

function updateBrickChunks() {
  for (let index = brickChunks.length - 1; index >= 0; index--) {
    const chunk = brickChunks[index];
    chunk.x += chunk.vx;
    chunk.y += chunk.vy;
    chunk.vy += GAME_CONFIG.brickChunks.gravity;
    chunk.angle += GAME_CONFIG.brickChunks.rotationSpeed;

    if (boxesTouch(chunk, paddle)) {
      chunkBalance += chunkValue;
      brickChunks.splice(index, 1);
    } else if (chunk.y > HEIGHT) {
      brickChunks.splice(index, 1);
    }
  }
}

function chooseUpgrade(excludedId = null) {
  const available = upgrades.filter((upgrade) =>
    upgrade.id !== excludedId && !purchasedUpgrades.has(upgrade.id)
  );
  if (available.length === 0) {
    return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

function beginIntermission() {
  gameMode = "intermission";
  upgradeOffers = [chooseUpgrade(), chooseUpgrade()];
  if (upgradeOffers[0] && upgradeOffers[0].id === upgradeOffers[1]?.id) {
    upgradeOffers[1] = chooseUpgrade(upgradeOffers[0].id);
  }
}

function buyUpgrade(index) {
  const upgrade = upgradeOffers[index];
  if (!upgrade || purchasedUpgrades.has(upgrade.id)) {
    return;
  }
  if (chunkBalance < upgrade.cost) {
    return;
  }

  chunkBalance -= upgrade.cost;
  upgrade.apply();
  purchasedUpgrades.add(upgrade.id);
  upgradeOffers[index] = chooseUpgrade(upgradeOffers[1 - index]?.id);
}

function continueWave() {
  wave += 1;
  bricks = [];
  spawnedPieces = 0;
  piecesThisWave = GAME_CONFIG.fallingPieces.startingPieces + (wave - 1) * GAME_CONFIG.fallingPieces.extraPiecesPerWave;
  resetBalls();
  spawnFallingPiece();
  gameMode = "playing";
}

function endGame(reason) {
  gameMode = "gameover";
  gameOverReason = reason;
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw. Updates
// use fixed 60 Hz steps, with held Space feeding the simulation faster.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  const elapsed = Math.min(now - lastTime, 250);
  leftover += elapsed * (keys[" "] ? 4 : 1);
  lastTime = now;

  while (leftover >= STEP) {
    update();
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  piecesThisWave = GAME_CONFIG.fallingPieces.startingPieces;
  resetBalls();
  spawnFallingPiece();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

window.addEventListener("load", start, { once: true });
