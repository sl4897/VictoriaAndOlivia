const targetText = document.querySelector("#oliviaAlphabetTarget");
const grid = document.querySelector("#oliviaAlphabetGrid");
const statusText = document.querySelector("#oliviaAlphabetStatus");
const nextButton = document.querySelector("#oliviaAlphabetNextButton");

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
let target = "A";

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

function pickTarget() {
  target = letters[Math.floor(Math.random() * letters.length)];
}

function createOptions() {
  const others = shuffled(letters.filter((letter) => letter !== target)).slice(0, 5);
  return shuffled([target, ...others]);
}

function renderRound() {
  pickTarget();
  targetText.textContent = target;
  grid.replaceChildren();

  const options = createOptions();
  options.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "olivia-option-button";
    button.dataset.letter = letter;
    button.textContent = letter;
    grid.append(button);
  });

  statusText.textContent = "같은 글자를 찾아 눌러요.";
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button) {
    return;
  }
  const isCorrect = button.dataset.letter === target;
  statusText.textContent = isCorrect ? "맞았어요! 정말 잘했어요." : "한 번 더 찾아볼까요?";
  button.classList.add(isCorrect ? "is-correct" : "is-incorrect");
});

nextButton.addEventListener("click", renderRound);

renderRound();
