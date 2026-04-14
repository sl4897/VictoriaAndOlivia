const backButtons = document.querySelectorAll("[data-back-button]");

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const fallback = button.dataset.backFallback;
    if (fallback) {
      window.location.href = fallback;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    }
  });
});
