const canvas = document.querySelector("#spaceCanvas");
const ctx = canvas.getContext("2d");
const launchButton = document.querySelector("#launchButton");
const resetButton = document.querySelector("#resetButton");
const nextButton = document.querySelector("#nextButton");
const toolButtons = document.querySelectorAll(".tool-card");
const levelButtons = document.querySelectorAll(".level-button");
const missionName = document.querySelector("#missionName");
const missionHint = document.querySelector("#missionHint");
const equationResetButton = document.querySelector("#equationResetButton");
const equationStatus = document.querySelector("#equationStatus");
const equationResult = document.querySelector("#equationResult");
const equationLab = document.querySelector(".equation-lab");
const equationDropZones = document.querySelectorAll("[data-equation-side]");
const leftEquationTerms = document.querySelector("#leftEquationTerms");
const rightEquationTerms = document.querySelector("#rightEquationTerms");
const starAnswerInput = document.querySelector("#starAnswerInput");
const answerFeedback = document.querySelector("#answerFeedback");

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 560;

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

const equationState = {
  left: ["star", "addend"],
  right: ["total"],
  signs: {
    star: 1,
    addend: 1,
    total: 1,
  },
  values: {
    addend: 5,
    total: 7,
    answer: 2,
  },
};

const levels = [
  {
    name: "Mission 1",
    hint: "행성을 드래그해서 탐사선의 길을 살짝 구부려요.",
    start: { x: 110, y: 470 },
    velocity: { vx: 3.1, vy: -1.55 },
    goal: { x: 820, y: 150, radius: 30 },
    maxPlanets: 3,
    planets: [{ x: 415, y: 275, radius: 34, mass: 0.55, color: "#f1c44e", ring: "#e65f51" }],
    obstacles: [],
  },
  {
    name: "Mission 2",
    hint: "위성이 더 높이 있어요. 무거운 행성 하나로 크게 꺾어보세요.",
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
    name: "Mission 3",
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
    name: "Mission 4",
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
  state.obstacles = level.obstacles.map((obstacle) => ({ ...obstacle }));
  state.probe = {
    x: state.start.x,
    y: state.start.y,
    vx: state.startVelocity.vx,
    vy: state.startVelocity.vy,
    trail: [],
  };
  state.planets = level.planets.map((planet) => ({ ...planet }));
  missionName.textContent = `${level.name} / ${levels.length}`;
  missionHint.textContent = level.hint;
  updateLevelButtons();
  cancelAnimationFrame(state.animationId);
  draw();
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
    missionHint.textContent = `이 미션은 행성을 ${level.maxPlanets}개까지만 쓸 수 있어요.`;
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
  state.running = true;
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
      ? "성공! 마지막 미션까지 해냈어요."
      : "성공! 다음 미션으로 가볼까요?";
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
  ctx.strokeStyle = "#77d0dd";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f1c44e";
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "800 14px system-ui";
  ctx.fillText("위성", goal.x - 16, goal.y + 52);
}

function drawStart() {
  ctx.fillStyle = "#fff";
  ctx.font = "800 14px system-ui";
  ctx.fillText("출발", state.start.x - 18, state.start.y - 26);
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

function resetEquation() {
  const answer = 1 + Math.floor(Math.random() * 9);
  const addend = 1 + Math.floor(Math.random() * 9);
  const total = answer + addend;
  equationState.left = ["star", "addend"];
  equationState.right = ["total"];
  equationState.signs = {
    star: 1,
    addend: 1,
    total: 1,
  };
  equationState.values = {
    addend,
    total,
    answer,
  };
  starAnswerInput.value = "";
  answerFeedback.textContent = "";
  answerFeedback.classList.remove("is-correct", "is-incorrect");
  renderEquationTerms();
  updateEquationStatus();
}

function tokenLabel(token) {
  if (token === "star") {
    return "★";
  }

  return String(equationState.values[token]);
}

function tokenName(token) {
  if (token === "star") {
    return "별";
  }

  return tokenLabel(token);
}

function signedTokenLabel(token, index) {
  const sign = equationState.signs[token];
  const label = tokenLabel(token);

  if (index === 0) {
    return sign < 0 ? `- ${label}` : label;
  }

  return `${sign < 0 ? "-" : "+"} ${label}`;
}

function createEquationTerm(token) {
  const button = document.createElement("button");
  button.className = `equation-term ${token === "star" ? "star-symbol" : ""}`;
  button.type = "button";
  button.draggable = true;
  button.dataset.equationToken = token;
  button.setAttribute("aria-label", `${tokenName(token)} 조각`);
  button.textContent = tokenLabel(token);
  return button;
}

function renderEquationSide(container, terms) {
  container.replaceChildren();

  if (terms.length === 0) {
    const zero = document.createElement("span");
    zero.className = "empty-side-zero";
    zero.textContent = "0";
    container.append(zero);
    return;
  }

  terms.forEach((token, index) => {
    const sign = equationState.signs[token];
    const operator = index === 0 ? (sign < 0 ? "-" : "") : (sign < 0 ? "-" : "+");

    if (operator) {
      const operatorElement = document.createElement("span");
      operatorElement.className = "term-operator";
      operatorElement.textContent = operator;
      container.append(operatorElement);
    }

    container.append(createEquationTerm(token));
  });
}

function renderEquationTerms() {
  renderEquationSide(leftEquationTerms, equationState.left);
  renderEquationSide(rightEquationTerms, equationState.right);
}

function moveEquationTerm(token, side) {
  if (!["star", "addend", "total"].includes(token) || !["left", "right"].includes(side)) {
    return;
  }

  const currentSide = equationState.left.includes(token) ? "left" : "right";

  if (currentSide !== side) {
    equationState.signs[token] *= -1;
  }

  equationState.left = equationState.left.filter((term) => term !== token);
  equationState.right = equationState.right.filter((term) => term !== token);
  equationState[side].push(token);
  renderEquationTerms();
  updateEquationStatus();
}

function updateEquationStatus() {
  const leftText = equationState.left.map((token, index) => signedTokenLabel(token, index)).join(" ") || "0";
  const rightText = equationState.right.map((token, index) => signedTokenLabel(token, index)).join(" ") || "0";
  equationStatus.textContent = `지금 식은 ${leftText} = ${rightText} 이에요. 조각을 끌거나 눌러서 옮겨보세요.`;
}

function checkStarAnswer() {
  const answer = starAnswerInput.value.trim();

  if (!answer) {
    answerFeedback.textContent = "";
    answerFeedback.classList.remove("is-correct", "is-incorrect");
    return;
  }

  const isCorrect = Number(answer) === equationState.values.answer;
  answerFeedback.textContent = isCorrect ? "맞아요!" : "다시 생각해봐요";
  answerFeedback.classList.toggle("is-correct", isCorrect);
  answerFeedback.classList.toggle("is-incorrect", !isCorrect);
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
window.addEventListener("resize", resizeCanvas);

equationLab.addEventListener("dragstart", (event) => {
  const term = event.target.closest("[data-equation-token]");

  if (!term) {
    return;
  }

  event.dataTransfer.setData("text/plain", term.dataset.equationToken);
});

equationLab.addEventListener("click", (event) => {
  const term = event.target.closest("[data-equation-token]");

  if (!term) {
    return;
  }

  const currentSide = term.closest("[data-equation-side]").dataset.equationSide;
  moveEquationTerm(term.dataset.equationToken, currentSide === "left" ? "right" : "left");
});

equationDropZones.forEach((zone) => {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragging-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("is-dragging-over");
  });

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-dragging-over");
    const token = event.dataTransfer.getData("text/plain");
    moveEquationTerm(token, zone.dataset.equationSide);
  });
});

starAnswerInput.addEventListener("input", checkStarAnswer);
equationResetButton.addEventListener("click", resetEquation);

createStars();
resetGame();
resetEquation();
resizeCanvas();
