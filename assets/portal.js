"use strict";

(() => {
  const form = document.querySelector("#search-form");
  const input = document.querySelector("#purchase-query");
  const field = document.querySelector("#search-field");
  const clear = document.querySelector("#clear-query");
  const submit = document.querySelector("#search-button");
  const label = document.querySelector("#button-label");
  const spinner = document.querySelector(".spinner");
  const feedback = document.querySelector("#search-feedback");
  let pendingSearch = null;

  function setBusy(busy) {
    field.setAttribute("aria-busy", String(busy));
    submit.setAttribute("aria-disabled", String(busy));
    spinner.hidden = !busy;
    label.textContent = busy ? "Ищем…" : "Найти";
  }

  function resetFeedback() {
    window.clearTimeout(pendingSearch);
    pendingSearch = null;
    setBusy(false);
    input.removeAttribute("aria-invalid");
    delete field.dataset.invalid;
    delete feedback.dataset.tone;
    feedback.textContent = "";
    clear.hidden = input.value.length === 0;
  }

  function clearQuery() {
    input.value = "";
    resetFeedback();
    input.focus();
  }

  input.addEventListener("input", resetFeedback);
  input.addEventListener("search", resetFeedback);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      clearQuery();
    }
  });
  clear.addEventListener("click", clearQuery);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pendingSearch !== null) return;

    const query = input.value.trim();
    resetFeedback();

    if (!query) {
      input.setAttribute("aria-invalid", "true");
      field.dataset.invalid = "true";
      feedback.dataset.tone = "error";
      feedback.textContent = "Введите, что вы хотите приобрести";
      input.focus();
      return;
    }

    input.value = query;
    clear.hidden = false;
    setBusy(true);
    feedback.textContent = "Ищем подходящие договоры…";

    // Only the interaction is demonstrated at this stage. No network request,
    // fabricated contract count, or search results are produced.
    pendingSearch = window.setTimeout(() => {
      pendingSearch = null;
      setBusy(false);
      feedback.textContent = "Это демонстрация поиска. Результаты появятся на следующем этапе.";
    }, 800);
  });

  resetFeedback();
})();
