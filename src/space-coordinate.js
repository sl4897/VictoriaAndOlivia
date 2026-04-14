const canvas = document.querySelector("#coordinateCanvas");
const ctx = canvas.getContext("2d");
const targetXInput = document.querySelector("#targetXInput");
const targetYInput = document.querySelector("#targetYInput");
const moveShipButton = document.querySelector("#moveShipButton");
const resetShipButton = document.querySelector("#resetShipButton");
const shipStatus = document.querySelector("#coordinateShipStatus");
const guideText = document.querySelector("#coordinateGuideText");
const moveXDirSelect = document.querySelector("#moveXDirSelect");
const moveYDirSelect = document.querySelector("#moveYDirSelect");
const moveXStepsInput = document.querySelector("#moveXStepsInput");
const moveYStepsInput = document.querySelector("#moveYStepsInput");

const GRID_MIN = -10;
const GRID_MAX = 10;
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 560;
const GRID_PADDING = 52;
const SEGMENT_MS = 170;

const state = {
  shipCell: { x: 0, y: 0 },
  shipDraw: { x: 0, y: 0 },
  shipHeading: 0,
  target: null,
  animating: false,
  path: [],
  segmentIndex: 0,
  segmentFrom: { x: 0, y: 0 },
  segmentTo: { x: 0, y: 0 },
  segmentProgressMs: 0,
  stars: [],
  nebulae: [],
  shootingStars: [],
  nextShootingStarAt: 0,
  lastFrameTime: 0,
};

function randomIn(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function gridToCanvas(point) {
  const usableWidth = WORLD_WIDTH - GRID_PADDING * 2;
  const usableHeight = WORLD_HEIGHT - GRID_PADDING * 2;
  const xRatio = (point.x - GRID_MIN) / (GRID_MAX - GRID_MIN);
  const yRatio = (point.y - GRID_MIN) / (GRID_MAX - GRID_MIN);
  return {
    x: GRID_PADDING + usableWidth * xRatio,
    y: WORLD_HEIGHT - (GRID_PADDING + usableHeight * yRatio),
  };
}

function buildBackgroundObjects() {
  state.stars = Array.from({ length: 220 }, () => ({
    x: randomIn(0, WORLD_WIDTH),
    y: randomIn(0, WORLD_HEIGHT),
    radius: randomIn(0.35, 1.8),
    alpha: randomIn(0.35, 0.95),
    twinkleSpeed: randomIn(0.6, 2.2),
    twinkleOffset: randomIn(0, Math.PI * 2),
  }));

  state.nebulae = [
    { x: 180, y: 90, r: 220, color: "rgba(65, 120, 170, 0.18)" },
    { x: 810, y: 130, r: 210, color: "rgba(160, 110, 220, 0.12)" },
    { x: 420, y: 490, r: 230, color: "rgba(45, 170, 180, 0.12)" },
  ];
}

function spawnShootingStar(nowMs) {
  const fromLeft = Math.random() < 0.5;
  const startX = fromLeft ? randomIn(-120, 120) : randomIn(WORLD_WIDTH - 120, WORLD_WIDTH + 120);
  const startY = randomIn(30, WORLD_HEIGHT * 0.45);
  const speed = randomIn(520, 720);
  const angle = fromLeft ? randomIn(0.22, 0.42) : randomIn(Math.PI - 0.42, Math.PI - 0.22);

  state.shootingStars.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length: randomIn(70, 120),
    life: 0,
    maxLife: randomIn(0.6, 1.0),
  });

  state.nextShootingStarAt = nowMs + randomIn(3500, 9000);
}

function drawSpaceBackground(nowSec, deltaSec) {
  const gradient = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  gradient.addColorStop(0, "#050812");
  gradient.addColorStop(0.52, "#081e2f");
  gradient.addColorStop(1, "#1d1430");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  state.nebulae.forEach((nebula) => {
    const haze = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
    haze.addColorStop(0, nebula.color);
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(nebula.x, nebula.y, nebula.r, 0, Math.PI * 2);
    ctx.fill();
  });

  state.stars.forEach((star) => {
    const twinkle = (Math.sin(nowSec * star.twinkleSpeed + star.twinkleOffset) + 1) * 0.5;
    ctx.globalAlpha = star.alpha * (0.55 + twinkle * 0.45);
    ctx.fillStyle = "#f7fbff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  state.shootingStars = state.shootingStars.filter((meteor) => {
    meteor.life += deltaSec;
    meteor.x += meteor.vx * deltaSec;
    meteor.y += meteor.vy * deltaSec;

    const alive =
      meteor.life < meteor.maxLife &&
      meteor.x > -220 &&
      meteor.x < WORLD_WIDTH + 220 &&
      meteor.y > -160 &&
      meteor.y < WORLD_HEIGHT + 220;
    if (!alive) {
      return false;
    }

    const direction = Math.atan2(meteor.vy, meteor.vx);
    const tailX = meteor.x - Math.cos(direction) * meteor.length;
    const tailY = meteor.y - Math.sin(direction) * meteor.length;
    const trail = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    trail.addColorStop(0, "rgba(255,255,255,0.95)");
    trail.addColorStop(0.45, "rgba(210,240,255,0.55)");
    trail.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = trail;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    return true;
  });
}

function drawGrid() {
  const axisColor = "rgba(255,255,255,0.52)";
  const lineColor = "rgba(151, 210, 225, 0.25)";

  for (let x = GRID_MIN; x <= GRID_MAX; x += 1) {
    const p1 = gridToCanvas({ x, y: GRID_MIN });
    const p2 = gridToCanvas({ x, y: GRID_MAX });
    ctx.strokeStyle = x === 0 ? axisColor : lineColor;
    ctx.lineWidth = x === 0 ? 2.2 : 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  for (let y = GRID_MIN; y <= GRID_MAX; y += 1) {
    const p1 = gridToCanvas({ x: GRID_MIN, y });
    const p2 = gridToCanvas({ x: GRID_MAX, y });
    ctx.strokeStyle = y === 0 ? axisColor : lineColor;
    ctx.lineWidth = y === 0 ? 2.2 : 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 12px system-ui";
  for (let x = GRID_MIN; x <= GRID_MAX; x += 5) {
    const p = gridToCanvas({ x, y: 0 });
    ctx.fillText(String(x), p.x - 7, p.y + 17);
  }
  for (let y = GRID_MIN; y <= GRID_MAX; y += 5) {
    const p = gridToCanvas({ x: 0, y });
    if (y !== 0) {
      ctx.fillText(String(y), p.x + 8, p.y + 4);
    }
  }
}

function drawStart() {
  const p = gridToCanvas({ x: 0, y: 0 });
  ctx.fillStyle = "#f1c44e";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 13px system-ui";
  ctx.fillText("출발", p.x + 14, p.y - 12);
}

function drawEarth(point) {
  if (!point) {
    return;
  }
  const p = gridToCanvas(point);
  const r = 10;
  const ocean = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.4, 2, p.x, p.y, r);
  ocean.addColorStop(0, "#9de3f7");
  ocean.addColorStop(0.55, "#3b9dd9");
  ocean.addColorStop(1, "#0f4b91");
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#57bf73";
  ctx.beginPath();
  ctx.arc(p.x - 3, p.y - 1, 3.5, 0, Math.PI * 2);
  ctx.arc(p.x + 3, p.y + 2, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "800 13px system-ui";
  ctx.fillText("지구", p.x + 14, p.y - 12);
}

function drawShip() {
  const p = gridToCanvas(state.shipDraw);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(state.shipHeading);

  if (state.animating) {
    const flameLength = 13 + Math.sin(performance.now() * 0.04) * 3;
    const flame = ctx.createLinearGradient(-16, 0, -16 - flameLength, 0);
    flame.addColorStop(0, "rgba(255,235,150,0.95)");
    flame.addColorStop(0.45, "rgba(255,150,70,0.82)");
    flame.addColorStop(1, "rgba(255,80,60,0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-16 - flameLength, -4);
    ctx.lineTo(-16 - flameLength, 4);
    ctx.closePath();
    ctx.fill();
  }

  const hull = ctx.createLinearGradient(-14, 0, 20, 0);
  hull.addColorStop(0, "#7ea0bd");
  hull.addColorStop(0.4, "#e9f2fa");
  hull.addColorStop(1, "#9fc1d9");
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.quadraticCurveTo(13, -8, 1, -10);
  ctx.lineTo(-11, -7);
  ctx.lineTo(-15, -3);
  ctx.lineTo(-15, 3);
  ctx.lineTo(-11, 7);
  ctx.lineTo(1, 10);
  ctx.quadraticCurveTo(13, 8, 19, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d74f5a";
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(-19, -13);
  ctx.lineTo(-14, -3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, 9);
  ctx.lineTo(-19, 13);
  ctx.lineTo(-14, 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f05345";
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(12, -5);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#174a76";
  ctx.beginPath();
  ctx.ellipse(4, 0, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(10, -4);
  ctx.stroke();

  ctx.strokeStyle = "rgba(10, 28, 44, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(10, 4);
  ctx.stroke();

  ctx.restore();
}

function drawScene(nowMs, deltaMs) {
  const nowSec = nowMs * 0.001;
  const deltaSec = deltaMs * 0.001;
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawSpaceBackground(nowSec, deltaSec);
  drawGrid();
  drawStart();
  drawEarth(state.target);
  drawShip();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(
    (rect.width / WORLD_WIDTH) * dpr,
    0,
    0,
    (rect.height / WORLD_HEIGHT) * dpr,
    0,
    0
  );
}

function setStatus() {
  shipStatus.textContent = `현재 좌표: (${state.shipCell.x}, ${state.shipCell.y})`;
}

function setRandomTarget() {
  let tx = 0;
  let ty = 0;
  while ((tx === 0 && ty === 0) || (tx === state.shipCell.x && ty === state.shipCell.y)) {
    tx = randomInt(GRID_MIN, GRID_MAX);
    ty = randomInt(GRID_MIN, GRID_MAX);
  }
  state.target = { x: tx, y: ty };
  targetXInput.value = String(tx);
  targetYInput.value = String(ty);
}

function buildPath(from, to) {
  const path = [];
  let x = from.x;
  let y = from.y;
  while (x !== to.x) {
    x += x < to.x ? 1 : -1;
    path.push({ x, y });
  }
  while (y !== to.y) {
    y += y < to.y ? 1 : -1;
    path.push({ x, y });
  }
  return path;
}

function beginNextSegment() {
  if (state.segmentIndex >= state.path.length) {
    state.animating = false;
    state.shipDraw = { ...state.shipCell };
    setStatus();
    if (state.target && state.shipCell.x === state.target.x && state.shipCell.y === state.target.y) {
      guideText.textContent = `성공! 목표 좌표 (${state.target.x}, ${state.target.y})에 도착했어요.`;
    } else if (state.target) {
      guideText.textContent = `실패! 현재 (${state.shipCell.x}, ${state.shipCell.y}) / 목표 (${state.target.x}, ${state.target.y})`;
    }
    return;
  }
  state.segmentFrom = { ...state.shipCell };
  state.segmentTo = { ...state.path[state.segmentIndex] };
  state.shipHeading = Math.atan2(
    -(state.segmentTo.y - state.segmentFrom.y),
    state.segmentTo.x - state.segmentFrom.x
  );
  state.segmentProgressMs = 0;
}

function moveShip() {
  if (state.animating) {
    return;
  }
  if (!state.target) {
    setRandomTarget();
  }

  const rawXSteps = Number(moveXStepsInput.value.trim());
  const rawYSteps = Number(moveYStepsInput.value.trim());
  const xSteps = Number.isInteger(rawXSteps) && rawXSteps >= 0 ? rawXSteps : NaN;
  const ySteps = Number.isInteger(rawYSteps) && rawYSteps >= 0 ? rawYSteps : NaN;
  if (Number.isNaN(xSteps) || Number.isNaN(ySteps)) {
    guideText.textContent = "이동 칸 수는 0 이상의 정수로 입력해요.";
    return;
  }

  const dx = moveXDirSelect.value === "left" ? -xSteps : xSteps;
  const dy = moveYDirSelect.value === "down" ? -ySteps : ySteps;
  if (dx === 0 && dy === 0) {
    guideText.textContent = "이동 칸 수를 입력해 주세요.";
    return;
  }

  const destination = {
    x: state.shipCell.x + dx,
    y: state.shipCell.y + dy,
  };
  if (
    destination.x < GRID_MIN ||
    destination.x > GRID_MAX ||
    destination.y < GRID_MIN ||
    destination.y > GRID_MAX
  ) {
    guideText.textContent = "격자 범위(-10~10)를 벗어나요. 칸 수를 줄여보세요.";
    return;
  }

  state.path = buildPath(state.shipCell, destination);
  state.segmentIndex = 0;
  state.animating = state.path.length > 0;
  if (!state.animating) {
    guideText.textContent = "이미 도착해 있어요.";
    return;
  }
  guideText.textContent = `이동 중... 현재 이동 목표 (${destination.x}, ${destination.y})`;
  beginNextSegment();
}

function resetShip() {
  state.animating = false;
  state.path = [];
  state.segmentIndex = 0;
  state.shipCell = { x: 0, y: 0 };
  state.shipDraw = { x: 0, y: 0 };
  state.shipHeading = 0;
  setRandomTarget();
  moveXDirSelect.value = "right";
  moveYDirSelect.value = "up";
  setStatus();
  guideText.textContent = "새 랜덤 지구가 생겼어요. 이동 방법을 입력하고 이동을 눌러요.";
}

function updateAnimation(deltaMs) {
  if (!state.animating) {
    state.shipDraw = { ...state.shipCell };
    if (state.target) {
      const dx = state.target.x - state.shipDraw.x;
      const dy = state.target.y - state.shipDraw.y;
      if (dx !== 0 || dy !== 0) {
        state.shipHeading = Math.atan2(-dy, dx);
      }
    }
    return;
  }

  state.segmentProgressMs += deltaMs;
  const t = Math.min(1, state.segmentProgressMs / SEGMENT_MS);
  const eased = 1 - (1 - t) ** 3;
  state.shipDraw.x = state.segmentFrom.x + (state.segmentTo.x - state.segmentFrom.x) * eased;
  state.shipDraw.y = state.segmentFrom.y + (state.segmentTo.y - state.segmentFrom.y) * eased;

  if (t >= 1) {
    state.shipCell = { ...state.segmentTo };
    state.shipDraw = { ...state.shipCell };
    state.segmentIndex += 1;
    beginNextSegment();
    setStatus();
  }
}

function loop(nowMs) {
  if (state.lastFrameTime === 0) {
    state.lastFrameTime = nowMs;
  }
  const deltaMs = Math.min(50, nowMs - state.lastFrameTime);
  state.lastFrameTime = nowMs;

  if (nowMs > state.nextShootingStarAt && state.shootingStars.length < 2) {
    spawnShootingStar(nowMs);
  }

  updateAnimation(deltaMs);
  drawScene(nowMs, deltaMs);
  state.renderId = requestAnimationFrame(loop);
}

moveShipButton.addEventListener("click", moveShip);
resetShipButton.addEventListener("click", resetShip);
window.addEventListener("resize", resizeCanvas);

buildBackgroundObjects();
state.nextShootingStarAt = performance.now() + randomInt(1500, 4000);
setRandomTarget();
setStatus();
guideText.textContent = "랜덤 지구가 생성됐어요. 이동 방법을 입력하고 이동을 눌러요.";
resizeCanvas();
state.renderId = requestAnimationFrame(loop);
