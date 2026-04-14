const equationQuizProgress = document.querySelector("#equationQuizProgress");
const equationQuizList = document.querySelector("#equationQuizList");
const equationQuizCheckButton = document.querySelector("#equationQuizCheckButton");
const equationQuizResetButton = document.querySelector("#equationQuizResetButton");
const equationQuizStatus = document.querySelector("#equationQuizStatus");

const state = {
  problems: [],
};

function createProblem() {
  const addend = 1 + Math.floor(Math.random() * 9);
  const isMinus = Math.random() < 0.5;

  if (isMinus) {
    const total = 1 + Math.floor(Math.random() * 9);
    return {
      addend,
      total,
      answer: total + addend,
      left: ["star", "addend"],
      right: ["total"],
      signs: { star: 1, addend: -1, total: 1 },
    };
  }

  const answer = 1 + Math.floor(Math.random() * 9);
  return {
    addend,
    total: answer + addend,
    answer,
    left: ["star", "addend"],
    right: ["total"],
    signs: { star: 1, addend: 1, total: 1 },
  };
}

function tokenLabel(problem, token) {
  if (token === "star") {
    return "★";
  }
  return String(problem[token]);
}

function renderSide(container, problem, side) {
  const tokens = problem[side];
  container.replaceChildren();

  if (!tokens.length) {
    const zero = document.createElement("span");
    zero.className = "empty-side-zero";
    zero.textContent = "0";
    container.append(zero);
    return;
  }

  tokens.forEach((token, index) => {
    const sign = problem.signs[token];
    const operator = index === 0 ? (sign < 0 ? "-" : "") : (sign < 0 ? "-" : "+");
    if (operator) {
      const signEl = document.createElement("span");
      signEl.className = "term-operator";
      signEl.textContent = operator;
      container.append(signEl);
    }

    const term = document.createElement("button");
    term.className = `equation-term equation-quiz-term ${token === "star" ? "star-symbol" : ""}`;
    term.type = "button";
    term.draggable = true;
    term.dataset.equationQuizToken = token;
    term.textContent = tokenLabel(problem, token);
    container.append(term);
  });
}

function renderRow(index) {
  const problem = state.problems[index];
  const left = equationQuizList.querySelector(`[data-equation-quiz-side="left"][data-equation-quiz-index="${index}"]`);
  const right = equationQuizList.querySelector(`[data-equation-quiz-side="right"][data-equation-quiz-index="${index}"]`);
  if (!left || !right) {
    return;
  }
  renderSide(left, problem, "left");
  renderSide(right, problem, "right");
}

function moveToken(index, token, side) {
  const problem = state.problems[index];
  if (!problem || !["star", "addend", "total"].includes(token) || !["left", "right"].includes(side)) {
    return;
  }

  const currentSide = problem.left.includes(token) ? "left" : "right";
  if (currentSide !== side) {
    problem.signs[token] *= -1;
  }
  problem.left = problem.left.filter((term) => term !== token);
  problem.right = problem.right.filter((term) => term !== token);
  problem[side].push(token);
  renderRow(index);
}

function resetQuiz() {
  state.problems = Array.from({ length: 10 }, () => createProblem());
  equationQuizList.replaceChildren();

  state.problems.forEach((problem, index) => {
    const item = document.createElement("li");
    item.className = "equation-quiz-item";

    const title = document.createElement("span");
    title.className = "equation-quiz-expression";
    title.textContent = `${index + 1}번`;

    const board = document.createElement("div");
    board.className = "equation-quiz-board";

    const left = document.createElement("div");
    left.className = "equation-quiz-side";
    left.dataset.equationQuizSide = "left";
    left.dataset.equationQuizIndex = String(index);

    const equals = document.createElement("span");
    equals.className = "equation-quiz-equals";
    equals.textContent = "=";

    const right = document.createElement("div");
    right.className = "equation-quiz-side";
    right.dataset.equationQuizSide = "right";
    right.dataset.equationQuizIndex = String(index);

    board.append(left, equals, right);

    const input = document.createElement("input");
    input.className = "equation-quiz-input";
    input.type = "text";
    input.inputMode = "numeric";
    input.dataset.equationQuizIndex = String(index);

    const result = document.createElement("span");
    result.className = "equation-quiz-result";
    result.dataset.equationQuizResult = String(index);

    item.append(title, board, input, result);
    equationQuizList.append(item);
    renderRow(index);
  });

  equationQuizProgress.textContent = "정답 0 / 10";
  equationQuizStatus.textContent = "10문제를 입력하고 전체 채점을 눌러보세요.";
}

function checkQuiz() {
  const inputs = equationQuizList.querySelectorAll(".equation-quiz-input[data-equation-quiz-index]");
  let answered = 0;
  let correct = 0;

  inputs.forEach((input) => {
    const index = Number(input.dataset.equationQuizIndex);
    const result = equationQuizList.querySelector(`[data-equation-quiz-result="${index}"]`);
    const value = input.value.trim();
    const hasValue = value !== "" && !Number.isNaN(Number(value));

    input.classList.remove("is-correct", "is-incorrect");
    result.classList.remove("is-correct", "is-incorrect");
    result.textContent = "";

    if (!hasValue) {
      result.textContent = "입력 필요";
      return;
    }

    answered += 1;
    const ok = Number(value) === state.problems[index].answer;
    if (ok) {
      correct += 1;
    }
    input.classList.add(ok ? "is-correct" : "is-incorrect");
    result.classList.add(ok ? "is-correct" : "is-incorrect");
    result.textContent = ok ? "정답" : `오답 (정답 ${state.problems[index].answer})`;
  });

  equationQuizProgress.textContent = `정답 ${correct} / ${state.problems.length}`;
  if (answered < state.problems.length) {
    equationQuizStatus.textContent = `아직 ${state.problems.length - answered}문제가 비어 있어요.`;
    return;
  }
  equationQuizStatus.textContent = `완료! 10문제 중 ${correct}문제를 맞혔어요.`;
}

equationQuizList.addEventListener("click", (event) => {
  const term = event.target.closest("[data-equation-quiz-token]");
  if (!term) {
    return;
  }
  const side = term.closest("[data-equation-quiz-side]");
  if (!side) {
    return;
  }
  const index = Number(side.dataset.equationQuizIndex);
  const nextSide = side.dataset.equationQuizSide === "left" ? "right" : "left";
  moveToken(index, term.dataset.equationQuizToken, nextSide);
});

equationQuizList.addEventListener("dragstart", (event) => {
  const term = event.target.closest("[data-equation-quiz-token]");
  if (!term) {
    return;
  }
  const side = term.closest("[data-equation-quiz-side]");
  if (!side) {
    return;
  }
  event.dataTransfer.setData("application/x-quiz-token", term.dataset.equationQuizToken);
  event.dataTransfer.setData("application/x-quiz-index", side.dataset.equationQuizIndex);
});

equationQuizList.addEventListener("dragover", (event) => {
  const target = event.target.closest("[data-equation-quiz-side]");
  if (!target) {
    return;
  }
  event.preventDefault();
  target.classList.add("is-dragging-over");
});

equationQuizList.addEventListener("dragleave", (event) => {
  const target = event.target.closest("[data-equation-quiz-side]");
  if (!target) {
    return;
  }
  target.classList.remove("is-dragging-over");
});

equationQuizList.addEventListener("drop", (event) => {
  const target = event.target.closest("[data-equation-quiz-side]");
  if (!target) {
    return;
  }
  event.preventDefault();
  target.classList.remove("is-dragging-over");
  const token = event.dataTransfer.getData("application/x-quiz-token");
  const sourceIndex = Number(event.dataTransfer.getData("application/x-quiz-index"));
  const targetIndex = Number(target.dataset.equationQuizIndex);
  if (sourceIndex !== targetIndex) {
    return;
  }
  moveToken(targetIndex, token, target.dataset.equationQuizSide);
});

equationQuizCheckButton.addEventListener("click", checkQuiz);
equationQuizResetButton.addEventListener("click", resetQuiz);

resetQuiz();
