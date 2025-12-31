const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const overlay = document.getElementById("overlay");
const overlayStart = document.getElementById("overlay-start");
const overlayHelp = document.getElementById("overlay-help");
const helpPanel = document.getElementById("help");

const scoreLabel = document.getElementById("score");
const livesLabel = document.getElementById("lives");
const speedLabel = document.getElementById("speed");

const jumpBtn = document.getElementById("jump-btn");
const slideBtn = document.getElementById("slide-btn");

const width = canvas.width;
const height = canvas.height;

const groundY = height - 90;
const colors = {
  sky: "#1f2937",
  ground: "#0f172a",
  line: "#1f2937",
  fox: "#f97316",
  foxBody: "#f59e0b",
  obstacle: "#22d3ee",
  star: "#fbbf24",
};

let state = "idle"; // idle, running, gameover
let score = 0;
let speed = 6;
let lives = 3;
let frame = 0;
let stars = [];
let obstacles = [];

const fox = {
  x: 120,
  y: groundY,
  w: 70,
  h: 60,
  vy: 0,
  jumpStrength: 13,
  gravity: 0.7,
  sliding: false,
};

function resetGame() {
  state = "idle";
  score = 0;
  speed = 6;
  lives = 3;
  frame = 0;
  fox.y = groundY;
  fox.vy = 0;
  fox.sliding = false;
  stars = [];
  obstacles = [];
  overlay.classList.remove("hidden");
  updateHud();
}

function updateHud() {
  scoreLabel.textContent = Math.floor(score);
  livesLabel.textContent = lives;
  speedLabel.textContent = speed.toFixed(1);
}

function spawnObstacle() {
  const size = 40 + Math.random() * 30;
  obstacles.push({
    x: width + 20,
    y: groundY - size + 6,
    w: size,
    h: size,
  });
}

function spawnStar() {
  stars.push({
    x: width + 20,
    y: groundY - 120 - Math.random() * 160,
    r: 10 + Math.random() * 5,
  });
}

function jump() {
  if (state !== "running") return;
  if (fox.y >= groundY) {
    fox.vy = -fox.jumpStrength;
    fox.sliding = false;
  }
}

function slide(down) {
  if (state !== "running") return;
  fox.sliding = down;
}

function handleCollision() {
  lives -= 1;
  updateHud();
  if (lives <= 0) {
    state = "gameover";
    overlay.classList.remove("hidden");
    overlay.querySelector("h2").textContent = "游戏结束！";
    overlay.querySelector("p").textContent = "按重新开始或 Enter 再试一次。";
  }
}

function update() {
  if (state === "running") {
    frame++;
    speed += 0.003;
    fox.vy += fox.gravity;
    fox.y += fox.vy;
    if (fox.y > groundY) {
      fox.y = groundY;
      fox.vy = 0;
    }
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 80 === 0) spawnStar();

    obstacles.forEach((o) => {
      o.x -= speed;
    });
    stars.forEach((s) => {
      s.x -= speed * 0.9;
    });

    obstacles = obstacles.filter((o) => o.x + o.w > -10);
    stars = stars.filter((s) => s.x + s.r > -10);

    obstacles.forEach((o) => {
      const foxH = fox.sliding ? fox.h * 0.55 : fox.h;
      const foxY = fox.sliding ? fox.y + fox.h * 0.45 : fox.y;
      if (
        fox.x < o.x + o.w &&
        fox.x + fox.w > o.x &&
        foxY < o.y + o.h &&
        foxY + foxH > o.y
      ) {
        handleCollision();
        o.x = -999;
      }
    });

    stars.forEach((s) => {
      const dx = fox.x + fox.w / 2 - s.x;
      const dy = fox.y + fox.h / 2 - s.y;
      if (Math.hypot(dx, dy) < s.r + fox.w * 0.35) {
        score += 5;
        s.x = -999;
      }
    });

    score += 0.05 * speed;
    updateHud();
  }
}

function drawFox() {
  const y = fox.sliding ? fox.y + fox.h * 0.45 : fox.y;
  const h = fox.sliding ? fox.h * 0.55 : fox.h;
  ctx.save();
  ctx.translate(fox.x, y);
  // body
  ctx.fillStyle = colors.foxBody;
  ctx.beginPath();
  ctx.roundRect(0, 10, fox.w, h - 10, 12);
  ctx.fill();
  // head
  ctx.fillStyle = colors.fox;
  ctx.beginPath();
  ctx.roundRect(fox.w * 0.5, -6, fox.w * 0.5, h * 0.6, 10);
  ctx.fill();
  // ear
  ctx.beginPath();
  ctx.moveTo(fox.w * 0.75, -6);
  ctx.lineTo(fox.w * 0.6, -24);
  ctx.lineTo(fox.w * 0.9, -6);
  ctx.closePath();
  ctx.fill();
  // tail
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(12, h * 0.6);
  ctx.quadraticCurveTo(-10, h * 0.4, -26, h * 0.9);
  ctx.quadraticCurveTo(6, h * 1.1, 26, h * 0.7);
  ctx.fill();
  // eye
  ctx.fillStyle = "#0b1120";
  ctx.beginPath();
  ctx.arc(fox.w * 0.78, h * 0.18, 4, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.beginPath();
  ctx.arc(fox.w * 0.98, h * 0.24, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(o) {
  ctx.fillStyle = colors.obstacle;
  ctx.beginPath();
  ctx.roundRect(o.x, o.y, o.w, o.h, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.stroke();
}

function drawStar(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = colors.star;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 * Math.PI) / 180;
    const x = Math.cos(angle) * s.r;
    const y = Math.sin(angle) * s.r;
    ctx.lineTo(x, y);
    const innerAngle = angle + (36 * Math.PI) / 180;
    ctx.lineTo(Math.cos(innerAngle) * (s.r * 0.5), Math.sin(innerAngle) * (s.r * 0.5));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, groundY + 30, width, height - groundY - 30);
  ctx.fillStyle = colors.line;
  ctx.fillRect(0, groundY + 20, width, 10);
  for (let i = 0; i < width / 50; i++) {
    const offset = (frame * speed * 0.5 + i * 120) % width;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(width - offset, groundY + 24, 40, 4);
  }
}

function drawBackground() {
  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 20; i++) {
    const x = (i * 120 + frame * 0.6) % (width + 120) - 60;
    const y = 100 + Math.sin((frame + i * 30) * 0.02) * 30;
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  update();
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  drawGround();
  stars.forEach(drawStar);
  obstacles.forEach(drawObstacle);
  drawFox();
  requestAnimationFrame(render);
}

function startGame() {
  if (state === "running") return;
  if (state === "gameover") resetGame();
  state = "running";
  overlay.classList.add("hidden");
}

function restartGame() {
  resetGame();
  startGame();
}

startBtn?.addEventListener("click", startGame);
overlayStart?.addEventListener("click", startGame);
restartBtn?.addEventListener("click", restartGame);

overlayHelp?.addEventListener("click", () => {
  helpPanel.classList.toggle("hidden");
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    jump();
  } else if (e.code === "ArrowDown") {
    slide(true);
  } else if (e.code === "Enter") {
    if (state === "idle" || state === "gameover") startGame();
  } else if (e.key.toLowerCase() === "p") {
    state = state === "running" ? "idle" : "running";
    overlay.classList.toggle("hidden", state === "running");
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") slide(false);
});

// Touch controls
let slideTimeout;
function onPressJump() {
  jump();
  clearTimeout(slideTimeout);
}
function onPressSlideStart() {
  slide(true);
  slideTimeout = setTimeout(() => slide(true), 10);
}
function onPressSlideEnd() {
  slide(false);
  clearTimeout(slideTimeout);
}

jumpBtn?.addEventListener("click", onPressJump);
slideBtn?.addEventListener("mousedown", onPressSlideStart);
slideBtn?.addEventListener("touchstart", (e) => {
  e.preventDefault();
  onPressSlideStart();
});
["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) =>
  slideBtn?.addEventListener(ev, onPressSlideEnd)
);

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  onPressJump();
});

// Start loop
resetGame();
render();
