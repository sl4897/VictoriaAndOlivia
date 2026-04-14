const starBoard = document.querySelector("#oliviaStarBoard");
const numberRow = document.querySelector("#oliviaNumberRow");
const statusText = document.querySelector("#oliviaMathStatus");
const nextButton = document.querySelector("#oliviaMathNextButton");

let answer = 1;

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function renderStars(count) {
  starBoard.replaceChildren();
  for (let index = 0; index < count; index += 1) {
    const star = document.createElement("span");
    star.className = "olivia-star";
    star.textContent = "★";
    starBoard.append(star);
  }
}

function renderNumbers() {
  numberRow.replaceChildren();
  for (let value = 1; value <= 5; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "olivia-option-button";
    button.dataset.value = String(value);
    button.textContent = String(value);
    numberRow.append(button);
  }
}

function renderRound() {
  answer = randomInt(1, 5);
  renderStars(answer);
  renderNumbers();
  statusText.textContent = "별 개수를 세어 숫자를 골라요.";
}

numberRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-value]");
  if (!button) {
    return;
  }
  const value = Number(button.dataset.value);
  const isCorrect = value === answer;
  statusText.textContent = isCorrect ? "정답! 정말 멋져요." : "다시 세어보고 골라요.";
  button.classList.add(isCorrect ? "is-correct" : "is-incorrect");
});

nextButton.addEventListener("click", renderRound);

renderRound();
