const startText = document.querySelector("#coordinateStartText");
const moveList = document.querySelector("#coordinateMoveList");
const statusText = document.querySelector("#coordinateStatus");
const answerXInput = document.querySelector("#coordinateAnswerX");
const answerYInput = document.querySelector("#coordinateAnswerY");
const feedback = document.querySelector("#coordinateFeedback");
const checkButton = document.querySelector("#coordinateCheckButton");
const resetButton = document.querySelector("#coordinateResetButton");

const coordinateState = {
  startX: 0,
  startY: 0,
  moves: [],
  finalX: 0,
  finalY: 0,
};

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function createMove() {
  let dx = 0;
  let dy = 0;
  while (dx === 0 && dy === 0) {
    dx = randomInt(-4, 4);
    dy = randomInt(-4, 4);
  }
  return { dx, dy };
}

function moveLabel(move, index) {
  const xText = move.dx === 0 ? "x 그대로" : `x ${move.dx > 0 ? "+" : "-"} ${Math.abs(move.dx)}`;
  const yText = move.dy === 0 ? "y 그대로" : `y ${move.dy > 0 ? "+" : "-"} ${Math.abs(move.dy)}`;
  return `${index + 1}단계: ${xText}, ${yText}`;
}

function renderProblem() {
  startText.textContent = `출발 좌표: (${coordinateState.startX}, ${coordinateState.startY})`;
  moveList.replaceChildren();
  coordinateState.moves.forEach((move, index) => {
    const item = document.createElement("li");
    item.textContent = moveLabel(move, index);
    moveList.append(item);
  });
  statusText.textContent = "최종 좌표를 입력하고 채점해보세요.";
  feedback.textContent = "";
  feedback.classList.remove("is-correct", "is-incorrect");
  answerXInput.value = "";
  answerYInput.value = "";
}

function createProblem() {
  coordinateState.startX = randomInt(-8, 8);
  coordinateState.startY = randomInt(-8, 8);
  coordinateState.moves = Array.from({ length: 3 }, () => createMove());

  let currentX = coordinateState.startX;
  let currentY = coordinateState.startY;
  coordinateState.moves.forEach((move) => {
    currentX += move.dx;
    currentY += move.dy;
  });

  coordinateState.finalX = currentX;
  coordinateState.finalY = currentY;
  renderProblem();
}

function checkAnswer() {
  const xValue = answerXInput.value.trim();
  const yValue = answerYInput.value.trim();
  const hasX = xValue !== "" && !Number.isNaN(Number(xValue));
  const hasY = yValue !== "" && !Number.isNaN(Number(yValue));

  feedback.classList.remove("is-correct", "is-incorrect");

  if (!hasX || !hasY) {
    feedback.textContent = "x, y 모두 입력해요.";
    statusText.textContent = "빈칸을 채운 뒤 다시 채점해보세요.";
    return;
  }

  const isCorrect =
    Number(xValue) === coordinateState.finalX &&
    Number(yValue) === coordinateState.finalY;

  if (isCorrect) {
    feedback.textContent = "정답!";
    feedback.classList.add("is-correct");
    statusText.textContent = "좋아요! 새 문제로 계속 도전해보세요.";
    return;
  }

  feedback.textContent = "다시!";
  feedback.classList.add("is-incorrect");
  statusText.textContent = `정답은 (${coordinateState.finalX}, ${coordinateState.finalY})`;
}

checkButton.addEventListener("click", checkAnswer);
resetButton.addEventListener("click", createProblem);

createProblem();
