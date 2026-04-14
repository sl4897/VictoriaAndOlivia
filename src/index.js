const profileChoiceNote = document.querySelector("#profileChoiceNote");
const profileButtons = document.querySelectorAll("[data-profile-choice]");

function showOliviaMessage() {
  profileChoiceNote.textContent = "Olivia의 알파벳 게임은 다음에 여기서 시작할게요.";
}

profileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.profileChoice === "victoria") {
      window.location.href = "space.html";
      return;
    }
    showOliviaMessage();
  });
});
