function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const ball of balls) {
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  }

  if (!volleyActive && gameMode === "playing") {
    const aimX = paddle.x + paddle.width / 2 + Math.sin(aimAngle) * 80;
    const aimY = paddle.y + paddle.height / 2 - Math.cos(aimAngle) * 80;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.moveTo(paddle.x + paddle.width / 2, paddle.y);
    ctx.lineTo(aimX, aimY);
    ctx.stroke();
  }

  drawBricks();
  drawBoardGuides();
  drawBrickChunks();
  drawHud();
  if (gameMode === "intermission") {
    drawIntermission();
  } else if (gameMode === "gameover") {
    drawGameOver();
  }
}

function drawBoardGuides() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= BRICK_COLUMNS; col++) {
    const x = col * BRICK_WIDTH;
    ctx.beginPath();
    ctx.moveTo(x, BOARD_TOP);
    ctx.lineTo(x, BOARD_BOTTOM);
    ctx.stroke();
  }
  for (let row = 0; row <= BRICK_ROWS; row++) {
    const y = BOARD_TOP + row * BRICK_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#f5c542";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, BOARD_BOTTOM - BRICK_HEIGHT);
  ctx.lineTo(WIDTH, BOARD_BOTTOM - BRICK_HEIGHT);
  ctx.stroke();
}

function drawBrickChunks() {
  ctx.fillStyle = "#f5c542";
  for (const chunk of brickChunks) {
    ctx.save();
    ctx.translate(chunk.x + chunk.width / 2, chunk.y + chunk.height / 2);
    ctx.rotate(chunk.angle);
    ctx.fillRect(-chunk.width / 2, -chunk.height / 2, chunk.width, chunk.height);
    ctx.restore();
  }
}

function drawHud() {
  ctx.fillStyle = "#f5c542";
  ctx.font = "14px Courier New";
  ctx.textAlign = "left";
  ctx.fillText(`CHUNKS: ${chunkBalance}`, 12, 22);
  ctx.fillText(`BALLS: ${balls.length}`, 140, 22);
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  ctx.fillText(`WAVE ${wave}  PIECES ${spawnedPieces}/${piecesThisWave}`, WIDTH - 12, 22);
}

function drawIntermission() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 26px Courier New";
  ctx.fillText("WAVE CLEAR", WIDTH / 2, 350);
  ctx.fillStyle = "white";
  ctx.font = "15px Courier New";
  ctx.fillText(`BRICK CHUNKS: ${chunkBalance}`, WIDTH / 2, 385);

  for (let index = 0; index < 2; index++) {
    const x = 126 + index * 242;
    const upgrade = upgradeOffers[index];
    ctx.strokeStyle = upgrade ? "#f5c542" : "#555";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 430, 222, 138);
    ctx.fillStyle = upgrade ? "white" : "#888";
    ctx.font = "bold 17px Courier New";
    ctx.fillText(`${index + 1}: ${upgrade ? upgrade.name : "No upgrade"}`, x + 111, 470);
    if (upgrade) {
      ctx.font = "13px Courier New";
      ctx.fillText(upgrade.description, x + 111, 502);
      ctx.fillStyle = chunkBalance >= upgrade.cost ? "#f5c542" : "#ff7777";
      ctx.fillText(`COST: ${upgrade.cost} CHUNKS`, x + 111, 536);
    }
  }

  ctx.fillStyle = "white";
  ctx.font = "14px Courier New";
  ctx.fillText("BUY WITH 1 OR 2  |  ENTER TO CONTINUE", WIDTH / 2, 610);
  ctx.textAlign = "left";
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 30px Courier New";
  ctx.fillText("YOU HAVE BEEN DELETED", WIDTH / 2, HEIGHT / 2 - 30);
  ctx.fillStyle = "white";
  ctx.font = "16px Courier New";
  ctx.fillText(gameOverReason, WIDTH / 2, HEIGHT / 2 + 5);
  ctx.fillText("REFRESH TO PLAY AGAIN", WIDTH / 2, HEIGHT / 2 + 40);
  ctx.textAlign = "left";
}
