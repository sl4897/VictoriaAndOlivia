const equationResetButton = document.querySelector("#equationResetButton");
const equationStatus = document.querySelector("#equationStatus");
const equationDropZones = document.querySelectorAll("[data-equation-side]");
const equationLab = document.querySelector(".equation-lab");
const leftEquationTerms = document.querySelector("#leftEquationTerms");
const rightEquationTerms = document.querySelector("#rightEquationTerms");
const starAnswerInput = document.querySelector("#starAnswerInput");
const answerFeedback = document.querySelector("#answerFeedback");

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

function createEquationProblem() {
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

function resetEquation() {
  const problem = createEquationProblem();
  equationState.left = [...problem.left];
  equationState.right = [...problem.right];
  equationState.signs = { ...problem.signs };
  equationState.values = {
    addend: problem.addend,
    total: problem.total,
    answer: problem.answer,
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

function renderEquationSide(container, terms) {
  container.replaceChildren();

  if (!terms.length) {
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

    const term = document.createElement("button");
    term.className = `equation-term ${token === "star" ? "star-symbol" : ""}`;
    term.type = "button";
    term.draggable = true;
    term.dataset.equationToken = token;
    term.textContent = tokenLabel(token);
    container.append(term);
  });
}

function renderEquationTerms() {
  renderEquationSide(leftEquationTerms, equationState.left);
  renderEquationSide(rightEquationTerms, equationState.right);
}

function moveEquationToken(token, side) {
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

function signedLabel(token, index) {
  const sign = equationState.signs[token];
  const label = tokenLabel(token);
  if (index === 0) {
    return sign < 0 ? `- ${label}` : label;
  }
  return `${sign < 0 ? "-" : "+"} ${label}`;
}

function updateEquationStatus() {
  const leftText = equationState.left.map((token, index) => signedLabel(token, index)).join(" ") || "0";
  const rightText = equationState.right.map((token, index) => signedLabel(token, index)).join(" ") || "0";
  equationStatus.textContent = `지금 식은 ${leftText} = ${rightText} 이에요.`;
}

function checkAnswer() {
  const value = starAnswerInput.value.trim();
  if (value === "" || Number.isNaN(Number(value))) {
    answerFeedback.textContent = "";
    answerFeedback.classList.remove("is-correct", "is-incorrect");
    return;
  }

  const correct = Number(value) === equationState.values.answer;
  answerFeedback.textContent = correct ? "맞아요!" : "다시 생각해봐요";
  answerFeedback.classList.toggle("is-correct", correct);
  answerFeedback.classList.toggle("is-incorrect", !correct);
}

document.addEventListener("click", (event) => {
  const term = event.target.closest("[data-equation-token]");
  if (!term) {
    return;
  }
  const side = term.closest("[data-equation-side]");
  if (!side) {
    return;
  }
  const nextSide = side.dataset.equationSide === "left" ? "right" : "left";
  moveEquationToken(term.dataset.equationToken, nextSide);
});

document.addEventListener("dragstart", (event) => {
  const term = event.target.closest("[data-equation-token]");
  if (!term) {
    return;
  }
  event.dataTransfer.setData("application/x-equation-token", term.dataset.equationToken);
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
    moveEquationToken(event.dataTransfer.getData("application/x-equation-token"), zone.dataset.equationSide);
  });
});

equationResetButton.addEventListener("click", resetEquation);
starAnswerInput.addEventListener("input", checkAnswer);

equationLab.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, { passive: false });

resetEquation();
