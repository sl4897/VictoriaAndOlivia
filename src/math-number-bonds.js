const progressText = document.querySelector("#numberBondsProgress");
const targetText = document.querySelector("#numberBondsTarget");
const statusText = document.querySelector("#numberBondsStatus");
const grid = document.querySelector("#numberBondsGrid");
const selectionText = document.querySelector("#numberBondsSelection");
const feedbackText = document.querySelector("#numberBondsFeedback");
const checkButton = document.querySelector("#numberBondsCheckButton");
const nextButton = document.querySelector("#numberBondsNextButton");
const motivationBurst = document.querySelector("#motivationBurst");
const motivationText = document.querySelector("#motivationText");
const motivationMascot = document.querySelector("#motivationMascot");

const TOTAL_ROUNDS = 10;

const state = {
  round: 1,
  target: 10,
  cards: [],
  answer: [],
  selected: [],
  solvedCount: 0,
  checked: false,
  motivationTimer: null,
};

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffled(values) {
  const array = [...values];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function buildRound() {
  const target = randomInt(8, 15);
  const left = randomInt(1, target - 1);
  const right = target - left;

  const distractors = [];
  while (distractors.length < 4) {
    const candidate = randomInt(1, 15);
    if (candidate === left || candidate === right) {
      continue;
    }
    if (distractors.includes(candidate)) {
      continue;
    }
    distractors.push(candidate);
  }

  state.target = target;
  state.answer = [left, right];
  state.cards = shuffled([left, right, ...distractors]);
  state.selected = [];
  state.checked = false;
}

function setSelectionText() {
  if (state.selected.length === 0) {
    selectionText.textContent = "선택: -";
    return;
  }
  const selectedValues = state.selected.map((index) => state.cards[index]);
  if (state.selected.length === 1) {
    selectionText.textContent = `선택: ${selectedValues[0]}`;
    return;
  }
  selectionText.textContent = `선택: ${selectedValues[0]} + ${selectedValues[1]} =`;
}

function renderCards() {
  grid.replaceChildren();
  state.cards.forEach((value, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-bonds-card";
    button.dataset.cardIndex = String(index);
    button.textContent = String(value);
    button.classList.toggle("is-selected", state.selected.includes(index));
    grid.append(button);
  });
}

function render() {
  progressText.textContent = `문제 ${state.round} / ${TOTAL_ROUNDS} (정답 ${state.solvedCount})`;
  targetText.textContent = `목표: ${state.target}`;
  setSelectionText();
  renderCards();
}

function resetFeedback(message) {
  feedbackText.textContent = message;
  feedbackText.classList.remove("is-correct", "is-incorrect");
}

function showMotivation(text, mascot) {
  motivationText.textContent = text;
  motivationMascot.textContent = mascot;
  motivationBurst.classList.remove("is-visible");
  void motivationBurst.offsetWidth;
  motivationBurst.classList.add("is-visible");

  if (state.motivationTimer) {
    clearTimeout(state.motivationTimer);
  }
  state.motivationTimer = setTimeout(() => {
    motivationBurst.classList.remove("is-visible");
  }, 900);
}

function selectCard(index) {
  if (state.checked) {
    return;
  }

  const selectedPos = state.selected.indexOf(index);
  if (selectedPos >= 0) {
    state.selected.splice(selectedPos, 1);
    render();
    return;
  }

  if (state.selected.length >= 2) {
    state.selected.shift();
  }
  state.selected.push(index);
  render();
}

function checkAnswer() {
  if (state.selected.length !== 2) {
    resetFeedback("두 카드를 골라주세요.");
    statusText.textContent = "카드 두 개를 선택한 뒤 확인을 눌러요.";
    return;
  }

  state.checked = true;
  const selectedValues = state.selected.map((index) => state.cards[index]);
  const sum = selectedValues[0] + selectedValues[1];
  const isCorrect = sum === state.target;

  if (isCorrect) {
    state.solvedCount += 1;
    const cheerText = state.solvedCount % 2 === 0 ? "Excellent!" : "Great!";
    const mascot = state.solvedCount % 2 === 0 ? "🦸" : "🧑‍🚀";
    showMotivation(cheerText, mascot);
  }

  feedbackText.textContent = isCorrect ? "정답!" : "다시 생각해봐요";
  feedbackText.classList.add(isCorrect ? "is-correct" : "is-incorrect");
  statusText.textContent = isCorrect
    ? "좋아요! 다음 문제로 가볼까요?"
    : `목표는 ${state.target}입니다. 다시 생각해봐요.`;
}

function nextRound() {
  if (state.round >= TOTAL_ROUNDS) {
    statusText.textContent = `완료! 10문제 중 ${state.solvedCount}문제를 맞혔어요.`;
    resetFeedback("");
    if (state.solvedCount >= 8) {
      showMotivation("Excellent!", "🏆");
    } else if (state.solvedCount >= 5) {
      showMotivation("Great!", "🌟");
    }
    return;
  }

  state.round += 1;
  buildRound();
  statusText.textContent = "두 카드를 골라보세요.";
  resetFeedback("");
  render();
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-card-index]");
  if (!card) {
    return;
  }
  selectCard(Number(card.dataset.cardIndex));
});

checkButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextRound);

buildRound();
resetFeedback("");
render();
