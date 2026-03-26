const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const difficultyEl = document.getElementById("difficulty");
const gridSizeEl = document.getElementById("grid-size");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

const STORAGE_KEY = "retro-green-snake-high-score";
const TILE_COLOR = "#00ff66";
const FOOD_COLOR = "#00bb4b";
const GRID_COLOR = "#003d19";
const BG_COLOR = "#001900";

const difficultyMap = {
  easy: { tickMs: 180, points: 8 },
  normal: { tickMs: 130, points: 12 },
  hard: { tickMs: 90, points: 18 },
};

let cellCount = Number(gridSizeEl.value);
let cellSize = canvas.width / cellCount;

let snake = [];
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let isRunning = false;
let isPaused = false;
let gameLoop = null;
let audioCtx = null;

highScoreEl.textContent = String(highScore);

document.addEventListener("keydown", handleKeyInput);
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

gridSizeEl.addEventListener("change", () => {
  if (isRunning) {
    stopLoop();
    resetBoard("Grid size changed. Press Start.");
  } else {
    cellCount = Number(gridSizeEl.value);
    cellSize = canvas.width / cellCount;
    drawBoard();
  }
});

difficultyEl.addEventListener("change", () => {
  if (isRunning && !isPaused) {
    restartLoop();
  }
});

resetBoard("Press Start to begin.");

function startGame() {
  const restarting = isRunning || isPaused;

  cellCount = Number(gridSizeEl.value);
  cellSize = canvas.width / cellCount;
  score = 0;
  updateScore();

  snake = createInitialSnake();
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  spawnFood();

  isRunning = true;
  isPaused = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = "Pause";

  hideOverlay();
  drawBoard();
  restartLoop();

  if (restarting) {
    playBeep(720, 0.05, "square");
  } else {
    playBeep(520, 0.05, "square");
  }
}

function togglePause() {
  if (!isRunning) return;

  isPaused = !isPaused;

  if (isPaused) {
    stopLoop();
    overlayText.textContent = "Paused";
    overlay.classList.remove("hidden");
    pauseBtn.textContent = "Resume";
    playBeep(280, 0.04, "sine");
  } else {
    hideOverlay();
    pauseBtn.textContent = "Pause";
    restartLoop();
    playBeep(340, 0.04, "sine");
  }
}

function gameTick() {
  direction = queuedDirection;

  const nextHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isOutOfBounds(nextHead) || hitsSelf(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += difficultyMap[difficultyEl.value].points;
    updateScore();
    spawnFood();
    playBeep(820, 0.045, "triangle");
  } else {
    snake.pop();
  }

  drawBoard();
}

function drawBoard() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;

  for (let i = 1; i < cellCount; i += 1) {
    const line = i * cellSize;

    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, line);
    ctx.lineTo(canvas.width, line);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 1.5 : 2.5;
    ctx.fillStyle = TILE_COLOR;
    ctx.fillRect(
      segment.x * cellSize + inset,
      segment.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2
    );
  });
}

function drawFood() {
  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * cellSize + 3, food.y * cellSize + 3, cellSize - 6, cellSize - 6);
}

function handleKeyInput(event) {
  const key = event.key.toLowerCase();

  if (key === " " || key === "escape") {
    event.preventDefault();
    togglePause();
    return;
  }

  const nextDirection = keyToDirection(key);
  if (!nextDirection || !isRunning || isPaused) return;

  if (direction.x + nextDirection.x === 0 && direction.y + nextDirection.y === 0) {
    return;
  }

  queuedDirection = nextDirection;
}

function keyToDirection(key) {
  if (key === "arrowup" || key === "w") return { x: 0, y: -1 };
  if (key === "arrowdown" || key === "s") return { x: 0, y: 1 };
  if (key === "arrowleft" || key === "a") return { x: -1, y: 0 };
  if (key === "arrowright" || key === "d") return { x: 1, y: 0 };
  return null;
}

function createInitialSnake() {
  const middle = Math.floor(cellCount / 2);
  return [
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
  ];
}

function spawnFood() {
  const openTiles = [];

  for (let y = 0; y < cellCount; y += 1) {
    for (let x = 0; x < cellCount; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openTiles.push({ x, y });
      }
    }
  }

  if (openTiles.length === 0) {
    endGame(true);
    return;
  }

  food = openTiles[Math.floor(Math.random() * openTiles.length)];
}

function endGame(isWin = false) {
  isRunning = false;
  isPaused = false;
  stopLoop();
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";

  if (isWin) {
    overlayText.textContent = `You win! Final score: ${score}`;
    playBeep(900, 0.07, "square");
  } else {
    overlayText.textContent = `Game over. Final score: ${score}`;
    playBeep(210, 0.12, "sawtooth");
  }

  overlay.classList.remove("hidden");

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(STORAGE_KEY, String(highScore));
    highScoreEl.textContent = String(highScore);
  }
}

function updateScore() {
  scoreEl.textContent = String(score);
}

function restartLoop() {
  stopLoop();
  const ms = difficultyMap[difficultyEl.value].tickMs;
  gameLoop = setInterval(gameTick, ms);
}

function stopLoop() {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
}

function isOutOfBounds(tile) {
  return tile.x < 0 || tile.y < 0 || tile.x >= cellCount || tile.y >= cellCount;
}

function hitsSelf(tile) {
  return snake.some((segment) => segment.x === tile.x && segment.y === tile.y);
}

function resetBoard(message) {
  isRunning = false;
  isPaused = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";
  overlayText.textContent = message;
  overlay.classList.remove("hidden");
  snake = [];
  food = { x: -1, y: -1 };
  drawBoard();
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function playBeep(frequency, duration, type = "square") {
  try {
    if (!audioCtx) {
      audioCtx = new window.AudioContext();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration + 0.02);
  } catch {
    // Ignore audio failures (browser policy or unavailable audio context).
  }
}
