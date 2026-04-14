const canvas = document.querySelector("#spaceCanvas");
const ctx = canvas.getContext("2d");
const launchButton = document.querySelector("#launchButton");
const resetButton = document.querySelector("#resetButton");
const nextButton = document.querySelector("#nextButton");
const toolButtons = document.querySelectorAll(".tool-card");
const levelButtons = document.querySelectorAll(".level-button");
const missionName = document.querySelector("#missionName");
const missionHint = document.querySelector("#missionHint");
const profilePicker = document.querySelector("#profilePicker");
const siteHeader = document.querySelector("#siteHeader");
const victoriaPage = document.querySelector("#victoriaPage");
const profileChoiceNote = document.querySelector("#profileChoiceNote");
const profileButtons = document.querySelectorAll("[data-profile-choice]");

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 560;
const OBSTACLE_SCALE = 0.65;

const state = {
  selectedTool: "planet",
  levelIndex: 0,
  running: false,
  draggingPlanet: null,
  probe: null,
  planets: [],
  obstacles: [],
  stars: [],
  goal: { x: 820, y: 150, radius: 30 },
  start: { x: 110, y: 470 },
  startVelocity: { vx: 3.1, vy: -1.55 },
  completedLevels: new Set(),
  animationId: null,
};

const levels = [
  {
    name: "단계 1",
    hint: "행성을 드래그해서 탐사선의 길을 살짝 구부려요.",
    start: { x: 110, y: 470 },
    velocity: { vx: 3.1, vy: -1.55 },
    goal: { x: 820, y: 150, radius: 30 },
    maxPlanets: 3,
    planets: [{ x: 415, y: 275, radius: 34, mass: 0.55, color: "#f1c44e", ring: "#e65f51" }],
    obstacles: [],
  },
  {
    name: "단계 2",
    hint: "지구가 더 높이 있어요. 무거운 행성 하나로 크게 꺾어보세요.",
    start: { x: 90, y: 490 },
    velocity: { vx: 3.3, vy: -0.95 },
    goal: { x: 820, y: 78, radius: 28 },
    maxPlanets: 3,
    planets: [
      { x: 340, y: 255, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
      { x: 610, y: 245, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
    ],
    obstacles: [],
  },
  {
    name: "단계 3",
    hint: "소행성에 닿으면 실패예요. 아래쪽으로 크게 돌아가요.",
    start: { x: 100, y: 310 },
    velocity: { vx: 3.2, vy: -0.18 },
    goal: { x: 835, y: 340, radius: 28 },
    maxPlanets: 4,
    planets: [
      { x: 330, y: 430, radius: 34, mass: 0.55, color: "#f1c44e", ring: "#e65f51" },
      { x: 660, y: 180, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
    ],
    obstacles: [
      { x: 455, y: 300, radius: 54, label: "소행성" },
      { x: 585, y: 310, radius: 42, label: "소행성" },
    ],
  },
  {
    name: "단계 4",
    hint: "두 소행성 사이의 좁은 길을 지나야 해요. 작은 힘을 여러 번 써보세요.",
    start: { x: 92, y: 115 },
    velocity: { vx: 3.05, vy: 0.84 },
    goal: { x: 825, y: 470, radius: 26 },
    maxPlanets: 5,
    planets: [
      { x: 300, y: 210, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 520, y: 390, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 705, y: 245, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
    ],
    obstacles: [
      { x: 440, y: 245, radius: 50, label: "바위" },
      { x: 440, y: 365, radius: 50, label: "바위" },
      { x: 650, y: 325, radius: 46, label: "바위" },
    ],
  },
  {
    name: "단계 5",
    hint: "중간 장애물을 피해 S자 모양으로 궤도를 꺾어보세요.",
    start: { x: 96, y: 468 },
    velocity: { vx: 3.2, vy: -1.15 },
    goal: { x: 836, y: 118, radius: 26 },
    maxPlanets: 5,
    planets: [
      { x: 290, y: 425, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 455, y: 225, radius: 34, mass: 0.55, color: "#f1c44e", ring: "#e65f51" },
      { x: 660, y: 355, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
    ],
    obstacles: [
      { x: 390, y: 335, radius: 48, label: "소행성" },
      { x: 560, y: 235, radius: 44, label: "소행성" },
    ],
  },
  {
    name: "단계 6",
    hint: "두 개의 소행성대를 넘어 지구까지 안전하게 통과해요.",
    start: { x: 88, y: 172 },
    velocity: { vx: 3.0, vy: 0.62 },
    goal: { x: 842, y: 456, radius: 25 },
    maxPlanets: 6,
    planets: [
      { x: 258, y: 145, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 408, y: 260, radius: 34, mass: 0.55, color: "#f1c44e", ring: "#e65f51" },
      { x: 572, y: 420, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 726, y: 265, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
    ],
    obstacles: [
      { x: 330, y: 235, radius: 44, label: "바위" },
      { x: 500, y: 340, radius: 54, label: "바위" },
      { x: 648, y: 360, radius: 46, label: "바위" },
    ],
  },
  {
    name: "단계 7",
    hint: "마지막 단계예요. 여러 행성의 힘을 이어서 정밀 도착해요.",
    start: { x: 98, y: 494 },
    velocity: { vx: 3.28, vy: -1.22 },
    goal: { x: 846, y: 88, radius: 23 },
    maxPlanets: 6,
    planets: [
      { x: 246, y: 420, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 388, y: 300, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
      { x: 560, y: 396, radius: 30, mass: 0.42, color: "#f1c44e", ring: "#e65f51" },
      { x: 690, y: 210, radius: 44, mass: 0.9, color: "#187a8c", ring: "#77d0dd" },
    ],
    obstacles: [
      { x: 340, y: 190, radius: 42, label: "소행성" },
      { x: 515, y: 265, radius: 48, label: "소행성" },
      { x: 620, y: 120, radius: 38, label: "소행성" },
      { x: 760, y: 320, radius: 46, label: "바위" },
    ],
  },
];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * pixelRatio);
  canvas.height = Math.floor(rect.height * pixelRatio);
  ctx.setTransform(
    (rect.width / WORLD_WIDTH) * pixelRatio,
    0,
    0,
    (rect.height / WORLD_HEIGHT) * pixelRatio,
    0,
    0
  );
  draw();
}

function createStars() {
  state.stars = Array.from({ length: 120 }, (_, index) => ({
    x: (index * 83) % WORLD_WIDTH,
    y: (index * 47) % WORLD_HEIGHT,
    r: 0.7 + (index % 4) * 0.35,
    twinkle: index % 7,
  }));
}

function resetGame() {
  const level = levels[state.levelIndex];
  state.running = false;
  state.start = { ...level.start };
  state.startVelocity = { ...level.velocity };
  state.goal = { ...level.goal };
  state.obstacles = level.obstacles.map((obstacle) => ({
    ...obstacle,
    radius: Math.round(obstacle.radius * OBSTACLE_SCALE),
  }));
  state.probe = {
    x: state.start.x,
    y: state.start.y,
    vx: state.startVelocity.vx,
    vy: state.startVelocity.vy,
    trail: [],
  };
  state.planets = level.planets.map((planet) => ({ ...planet }));
  missionName.textContent = `지구 귀환 게임 · ${level.name} / ${levels.length}`;
  missionHint.textContent = level.hint;
  updateLevelButtons();
  cancelAnimationFrame(state.animationId);
  launchButton.textContent = "발사";
  draw();
}

function resetProbe() {
  state.probe = {
    x: state.start.x,
    y: state.start.y,
    vx: state.startVelocity.vx,
    vy: state.startVelocity.vy,
    trail: [],
  };
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
  };
}

function findPlanet(point) {
  return state.planets.find((planet) => {
    const dx = point.x - planet.x;
    const dy = point.y - planet.y;
    return Math.hypot(dx, dy) <= planet.radius + 10;
  });
}

function addPlanet(point) {
  const level = levels[state.levelIndex];
  if (state.planets.length >= level.maxPlanets) {
    missionHint.textContent = `이 단계는 행성을 ${level.maxPlanets}개까지만 쓸 수 있어요.`;
    return null;
  }
  const isHeavy = state.selectedTool === "heavy";
  const planet = {
    x: point.x,
    y: point.y,
    radius: isHeavy ? 44 : 30,
    mass: isHeavy ? 0.9 : 0.42,
    color: isHeavy ? "#187a8c" : "#f1c44e",
    ring: isHeavy ? "#77d0dd" : "#e65f51",
  };
  state.planets.push(planet);
  missionHint.textContent = level.hint;
  draw();
  return planet;
}

function launch() {
  if (state.running) {
    return;
  }
  resetProbe();
  state.running = true;
  launchButton.textContent = "다시 발사";
  missionHint.textContent = "탐사선이 중력에 끌려가는 길을 관찰해요.";
  tick();
}

function tick() {
  updateProbe();
  draw();
  if (state.running) {
    state.animationId = requestAnimationFrame(tick);
  }
}

function updateProbe() {
  const probe = state.probe;
  for (const planet of state.planets) {
    const dx = planet.x - probe.x;
    const dy = planet.y - probe.y;
    const distanceSq = Math.max(dx * dx + dy * dy, 900);
    const force = (planet.mass * 70) / distanceSq;
    const angle = Math.atan2(dy, dx);
    probe.vx += Math.cos(angle) * force;
    probe.vy += Math.sin(angle) * force;
  }

  probe.x += probe.vx;
  probe.y += probe.vy;
  probe.trail.push({ x: probe.x, y: probe.y });
  if (probe.trail.length > 140) {
    probe.trail.shift();
  }

  const goalDistance = Math.hypot(probe.x - state.goal.x, probe.y - state.goal.y);
  if (goalDistance < state.goal.radius + 14) {
    state.running = false;
    state.completedLevels.add(state.levelIndex);
    updateLevelButtons();
    missionHint.textContent = state.levelIndex === levels.length - 1
      ? "성공! 마지막 단계까지 해냈어요."
      : "성공! 다음 단계로 가볼까요?";
  }

  for (const obstacle of state.obstacles) {
    const obstacleDistance = Math.hypot(probe.x - obstacle.x, probe.y - obstacle.y);
    if (obstacleDistance < obstacle.radius + 11) {
      state.running = false;
      missionHint.textContent = `${obstacle.label}에 닿았어요. 행성 위치를 바꿔 다시 해봐요.`;
    }
  }

  if (probe.x < -50 || probe.x > WORLD_WIDTH + 50 || probe.y < -50 || probe.y > WORLD_HEIGHT + 50) {
    state.running = false;
    missionHint.textContent = "우주 밖으로 멀어졌어요. 행성 위치를 바꿔 다시 해봐요.";
  }
}

function draw() {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawSpace(WORLD_WIDTH, WORLD_HEIGHT);
  state.obstacles.forEach(drawObstacle);
  drawGoal();
  drawStart();
  state.planets.forEach(drawPlanet);
  drawProbe();
}

function drawSpace(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#050813");
  gradient.addColorStop(0.55, "#102022");
  gradient.addColorStop(1, "#2b1d2f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const star of state.stars) {
    ctx.globalAlpha = 0.42 + star.twinkle * 0.06;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawObstacle(obstacle) {
  ctx.fillStyle = "#5b5f67";
  ctx.strokeStyle = "#f7fbff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(22, 22, 22, 0.35)";
  ctx.beginPath();
  ctx.arc(obstacle.x - obstacle.radius * 0.24, obstacle.y - obstacle.radius * 0.18, obstacle.radius * 0.14, 0, Math.PI * 2);
  ctx.arc(obstacle.x + obstacle.radius * 0.28, obstacle.y + obstacle.radius * 0.12, obstacle.radius * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "800 14px system-ui";
  ctx.fillText(obstacle.label, obstacle.x - 24, obstacle.y + obstacle.radius + 22);
}

function drawGoal() {
  const goal = state.goal;
  const earthRadius = Math.max(18, goal.radius * 0.78);

  ctx.save();

  ctx.strokeStyle = "rgba(138, 217, 242, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, earthRadius + 3, 0, Math.PI * 2);
  ctx.stroke();

  const ocean = ctx.createRadialGradient(
    goal.x - earthRadius * 0.25,
    goal.y - earthRadius * 0.4,
    2,
    goal.x,
    goal.y,
    earthRadius
  );
  ocean.addColorStop(0, "#9de3f7");
  ocean.addColorStop(0.55, "#3b9dd9");
  ocean.addColorStop(1, "#0f4b91");
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, earthRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(goal.x, goal.y, earthRadius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#4fbe6f";
  ctx.beginPath();
  ctx.moveTo(goal.x - earthRadius * 0.66, goal.y - earthRadius * 0.02);
  ctx.bezierCurveTo(
    goal.x - earthRadius * 0.56,
    goal.y - earthRadius * 0.56,
    goal.x - earthRadius * 0.18,
    goal.y - earthRadius * 0.62,
    goal.x + earthRadius * 0.08,
    goal.y - earthRadius * 0.24
  );
  ctx.bezierCurveTo(
    goal.x + earthRadius * 0.22,
    goal.y - earthRadius * 0.04,
    goal.x - earthRadius * 0.08,
    goal.y + earthRadius * 0.2,
    goal.x - earthRadius * 0.38,
    goal.y + earthRadius * 0.16
  );
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3fa860";
  ctx.beginPath();
  ctx.moveTo(goal.x + earthRadius * 0.02, goal.y + earthRadius * 0.02);
  ctx.bezierCurveTo(
    goal.x + earthRadius * 0.24,
    goal.y - earthRadius * 0.08,
    goal.x + earthRadius * 0.58,
    goal.y + earthRadius * 0.02,
    goal.x + earthRadius * 0.48,
    goal.y + earthRadius * 0.33
  );
  ctx.bezierCurveTo(
    goal.x + earthRadius * 0.36,
    goal.y + earthRadius * 0.46,
    goal.x + earthRadius * 0.1,
    goal.y + earthRadius * 0.38,
    goal.x + earthRadius * 0.02,
    goal.y + earthRadius * 0.12
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(goal.x + earthRadius * 0.08, goal.y - earthRadius * 0.05, earthRadius * 0.66, -0.35, 0.95);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
  ctx.beginPath();
  ctx.arc(goal.x - earthRadius * 0.1, goal.y + earthRadius * 0.12, earthRadius * 0.52, -0.1, 1.35);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.beginPath();
  ctx.arc(goal.x - earthRadius * 0.28, goal.y - earthRadius * 0.34, earthRadius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "800 14px system-ui";
  ctx.fillText("지구", goal.x - 16, goal.y + 52);
}

function drawStart() {
  const start = state.start;
  const launchAngle = Math.atan2(state.startVelocity.vy, state.startVelocity.vx);
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(launchAngle);

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.beginPath();
  ctx.ellipse(-12, 0, 38, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7fbff";
  ctx.strokeStyle = "#77d0dd";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-14, -17);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e65f51";
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(-32, -24);
  ctx.lineTo(-24, -4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.lineTo(-32, 24);
  ctx.lineTo(-24, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#187a8c";
  ctx.beginPath();
  ctx.arc(12, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f1c44e";
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(-38, -8);
  ctx.lineTo(-38, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "800 14px system-ui";
  ctx.fillText("출발", start.x - 18, start.y + 42);
}

function drawPlanet(planet) {
  ctx.strokeStyle = planet.ring;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(planet.x, planet.y, planet.radius * 1.45, planet.radius * 0.52, -0.35, 0, Math.PI * 2);
  ctx.stroke();

  const gradient = ctx.createRadialGradient(
    planet.x - planet.radius * 0.35,
    planet.y - planet.radius * 0.35,
    4,
    planet.x,
    planet.y,
    planet.radius
  );
  gradient.addColorStop(0, "#fff7bd");
  gradient.addColorStop(0.32, planet.color);
  gradient.addColorStop(1, "#3d2f4d");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawProbe() {
  const probe = state.probe;
  if (!probe) {
    return;
  }

  if (probe.trail.length > 1) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(probe.trail[0].x, probe.trail[0].y);
    for (const point of probe.trail) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(probe.x, probe.y);
  ctx.rotate(Math.atan2(probe.vy, probe.vx));
  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-12, -9);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e65f51";
  ctx.fillRect(-18, -5, 8, 10);
  ctx.restore();
}

function loadLevel(levelIndex) {
  state.levelIndex = (levelIndex + levels.length) % levels.length;
  resetGame();
}

function updateLevelButtons() {
  levelButtons.forEach((button) => {
    const buttonLevel = Number(button.dataset.level);
    button.classList.toggle("is-active", buttonLevel === state.levelIndex);
    button.classList.toggle("is-complete", state.completedLevels.has(buttonLevel));
  });
}

function showVictoriaPage() {
  profilePicker.hidden = true;
  siteHeader.hidden = false;
  victoriaPage.hidden = false;
  window.location.hash = "earth-return-game";
  requestAnimationFrame(resizeCanvas);
}

function showOliviaMessage() {
  profileChoiceNote.textContent = "Olivia의 알파벳 게임은 다음에 여기서 시작할게요.";
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    toolButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.selectedTool = button.dataset.tool;
  });
});

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.running) {
      return;
    }
    loadLevel(Number(button.dataset.level));
  });
});

canvas.addEventListener("pointerdown", (event) => {
  if (state.running) {
    return;
  }
  const point = canvasPoint(event);
  const planet = findPlanet(point);
  if (planet) {
    state.draggingPlanet = planet;
  } else {
    state.draggingPlanet = addPlanet(point);
  }
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.draggingPlanet || state.running) {
    return;
  }
  const point = canvasPoint(event);
  state.draggingPlanet.x = point.x;
  state.draggingPlanet.y = point.y;
  draw();
});

canvas.addEventListener("pointerup", (event) => {
  state.draggingPlanet = null;
  canvas.releasePointerCapture(event.pointerId);
});

launchButton.addEventListener("click", launch);
resetButton.addEventListener("click", resetGame);
nextButton.addEventListener("click", () => loadLevel(state.levelIndex + 1));
window.addEventListener("resize", () => {
  if (!victoriaPage.hidden) {
    resizeCanvas();
  }
});

profileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.profileChoice === "victoria") {
      showVictoriaPage();
      return;
    }
    showOliviaMessage();
  });
});

createStars();
resetGame();
draw();

if (window.location.hash === "#earth-return-game") {
  showVictoriaPage();
}
