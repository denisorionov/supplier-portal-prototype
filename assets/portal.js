"use strict";

(() => {
  const C = globalThis.PortalCatalog;
  const $ = (id) => document.getElementById(id);
  const asOf = C.todayInMoscow();
  const catalog = C.createCatalog(asOf);
  const state = { query: "", matches: [], selectedId: null, filter: "all", order: "relevance", page: 0 };
  const pageSize = 5;
  const money = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
  const shortDate = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
  const longDate = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  const dateText = (iso) => shortDate.format(new Date(`${iso}T00:00:00Z`));
  const amount = (value) => `${money.format(value)} ₽`;
  const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const selected = () => state.matches.find((contract) => contract.id === state.selectedId);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let searchTimer = null;
  let toastTimer = null;
  let dialogOpener = null;

  function notify(message) {
    window.clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    toastTimer = window.setTimeout(() => { $("toast").hidden = true; }, 3500);
  }
  function setBusy(busy) {
    $("search-field").setAttribute("aria-busy", String(busy));
    $("search-button").setAttribute("aria-disabled", String(busy));
    $("search-spinner").hidden = !busy;
    $("button-label").textContent = busy ? "Ищем…" : "Найти";
  }
  function cancelSearch() {
    window.clearTimeout(searchTimer);
    searchTimer = null;
    setBusy(false);
  }
  function clearValidation() {
    $("purchase-query").removeAttribute("aria-invalid");
    delete $("search-field").dataset.invalid;
    delete $("search-feedback").dataset.tone;
    $("search-feedback").textContent = "";
  }
  function home({ focus = true } = {}) {
    cancelSearch();
    clearValidation();
    Object.assign(state, { query: "", matches: [], selectedId: null, filter: "all", order: "relevance", page: 0 });
    $("purchase-query").value = "";
    $("clear-query").hidden = true;
    $("results").hidden = true;
    document.body.classList.remove("has-results");
    if (focus) $("purchase-query").focus();
  }
  function runSearch() {
    if (searchTimer !== null) return;
    const query = $("purchase-query").value.trim();
    clearValidation();
    if (!query) {
      $("purchase-query").setAttribute("aria-invalid", "true");
      $("search-field").dataset.invalid = "true";
      $("search-feedback").dataset.tone = "error";
      $("search-feedback").textContent = "Напишите, что нужно закупить";
      $("purchase-query").focus();
      return;
    }
    $("purchase-query").value = query;
    $("clear-query").hidden = false;
    $("results").hidden = true;
    document.body.classList.add("has-results");
    setBusy(true);
    $("search-feedback").textContent = "Проверяем действующие договоры…";
    searchTimer = window.setTimeout(() => {
      searchTimer = null;
      setBusy(false);
      clearValidation();
      Object.assign(state, { query, matches: C.searchContracts(catalog, query, asOf), selectedId: null, filter: "all", order: "relevance", page: 0 });
      $("sort-order").value = "relevance";
      renderResults();
      $("results").hidden = false;
      $("results-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    }, 420);
  }
  function categoryCaption() {
    const ids = [...new Set(state.matches.map((contract) => contract.category))];
    if (ids.length === 1) {
      const category = C.categories[ids[0]];
      return `${category.area} / ${category.title}`;
    }
    return `По запросу «${state.query}»`;
  }
  function renderResults() {
    const count = state.matches.length;
    $("category-label").textContent = categoryCaption();
    $("results-title").textContent = count ? `${count} ${C.plural(count, ["действующий договор", "действующих договора", "действующих договоров"])}` : "Договор не найден";
    $("open-pool").hidden = count === 0;
    $("found-content").hidden = count === 0;
    $("empty-state").hidden = count > 0;
    if (count) renderTable();
    renderGuidance();
    $("data-note").textContent = `Демонстрационные данные на ${longDate.format(new Date(`${asOf}T00:00:00Z`))} Поставщики, договоры, суммы и контакты вымышлены.`;
  }
  function renderTable() {
    const filtered = C.filterAndSort(state.matches, state.filter, state.order, asOf);
    if (state.selectedId && !filtered.some((contract) => contract.id === state.selectedId)) state.selectedId = null;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    state.page = Math.min(state.page, pages - 1);
    const rows = filtered.slice(state.page * pageSize, (state.page + 1) * pageSize);
    const safeCount = C.filterAndSort(state.matches, "safe", "relevance", asOf).length;
    $("filter-all").textContent = `Все договоры · ${state.matches.length}`;
    $("filter-safe").textContent = `Без предупреждений · ${safeCount}`;
    $("filter-all").setAttribute("aria-pressed", String(state.filter === "all"));
    $("filter-safe").setAttribute("aria-pressed", String(state.filter === "safe"));
    $("table-shell").hidden = !rows.length;
    $("filter-empty").hidden = rows.length > 0;
    $("contracts-body").innerHTML = rows.map((contract) => {
      const status = C.flags(contract, asOf);
      const percent = contract.ceiling ? Math.max(0, Math.min(100, contract.available / contract.ceiling * 100)) : 0;
      const percentText = percent > 0 && percent < 1 ? "менее 1%" : `${Math.floor(percent)}%`;
      return `<tr data-contract="${esc(contract.id)}" class="${state.selectedId === contract.id ? "is-selected" : ""}">
        <td><label class="contract-choice"><input type="radio" name="contract" value="${esc(contract.id)}" aria-label="Выбрать договор ${esc(contract.id)}, ${esc(contract.supplier)}" ${state.selectedId === contract.id ? "checked" : ""}><span><strong>${esc(contract.subject)}</strong><span class="cell-secondary">№ ${esc(contract.id)}</span></span></label></td>
        <td>${esc(contract.supplier)}</td>
        <td class="number-cell"><span class="amount">${amount(contract.ceiling)}</span></td>
        <td class="number-cell"><span class="amount ${status.lowLimit ? "warning" : ""}">${amount(contract.available)}</span><span class="cell-secondary ${status.lowLimit ? "warning" : ""}">Остаток ${percentText}</span><span class="limit-meter ${status.lowLimit ? "is-low" : ""}" aria-hidden="true"><i style="width:${percent}%"></i></span></td>
        <td><span class="expiry-date ${status.expiring ? "warning" : ""}">${dateText(contract.expires)}</span>${status.expiring ? '<span class="cell-secondary warning">Менее 3 месяцев</span>' : ""}</td>
        <td><span class="contact-name">${esc(contract.contact.name)}</span><button class="contact-link" type="button" data-contact="${esc(contract.id)}" aria-label="Контакты ${esc(contract.contact.name)}">${esc(contract.contact.email)}</button></td>
      </tr>`;
    }).join("");
    $("pagination").hidden = pages < 2;
    $("page-label").textContent = `${state.page + 1} / ${pages}`;
    $("previous-page").disabled = state.page === 0;
    $("next-page").disabled = state.page === pages - 1;
    renderSelected();
  }
  function renderSelected() {
    const contract = selected();
    $("selected-contract").hidden = !contract;
    if (!contract) return;
    const status = C.flags(contract, asOf);
    const warnings = [];
    if (status.lowLimit) warnings.push("Остаток лимита менее 20%");
    if (status.expiring) warnings.push("Срок заканчивается менее чем через 3 месяца");
    $("selected-contract").innerHTML = `<div><strong>Договор выбран</strong>№ ${esc(contract.id)} · ${esc(contract.supplier)}${warnings.length ? `<p class="warning">${warnings.join(". ")}. Уточните возможность заказа у закупщика.</p>` : ""}</div><button type="button" class="text-button" id="selected-contact">Связаться с поставщиком ↗</button>`;
    $("selected-contact").addEventListener("click", () => showContact(contract.contact, contract.supplier));
  }
  function chooseContract(id) {
    state.selectedId = id;
    document.querySelectorAll("tr[data-contract]").forEach((row) => {
      const active = row.dataset.contract === id;
      row.classList.toggle("is-selected", active);
      row.querySelector("input").checked = active;
    });
    renderSelected();
    notify(`Выбран договор № ${id}`);
  }
  function renderGuidance() {
    const found = state.matches.length > 0;
    const steps = found ? [
      ["Проверьте условия", "Сопоставьте предмет, доступный лимит и срок действия с вашей задачей. Выберите подходящий договор в таблице."],
      ["Согласуйте заказ с поставщиком", "Обсудите состав, стоимость и сроки. Подготовьте заказ, который нужно подписать к действующему договору."],
      ["Передайте заказ на оформление", "Создайте задачу в Jira: укажите договор и приложите согласованный заказ. По вопросам заполнения задачи обратитесь в ГПБ."],
    ] : [
      ["Опишите, что нужно закупить", "Укажите товар или услугу, предполагаемый бюджет и желаемый срок. Это поможет быстрее подобрать решение."],
      ["Обсудите закупку с закупщиком", "Закупщик проверит другие варианты, поможет найти поставщика и подскажет порядок проведения закупки."],
      ["Создайте задачу в Jira", "Передайте описание потребности и договорённости с закупщиком. Если нужна помощь с заполнением задачи, обратитесь в ГПБ."],
    ];
    $("steps-list").innerHTML = steps.map(([title, text], index) => `<li><span class="step-number" aria-hidden="true">${index + 1}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join("");
    $("steps-caption").textContent = found ? "По действующему договору" : "Для новой закупки";
    $("task-hint").textContent = found ? "На оформление заказа к договору" : "На проведение новой закупки";
    const buyer = C.inferBuyer(state.matches, state.query);
    const people = [[buyer, "По условиям договора и проведению закупки", "buyer"], [C.buyers.gpb, "По созданию и заполнению задачи", "gpb"]];
    $("support-contacts").innerHTML = people.map(([person, caption, key]) => `<div class="support-person"><p class="support-label">${caption}</p><div class="person-line"><span class="person-avatar ${key === "gpb" ? "person-avatar--neutral" : ""}" aria-hidden="true">${person.initials}</span><div><strong>${person.name}</strong><small>${person.role}</small></div></div><button class="text-button" type="button" data-support="${key}">Контакты и связь <span aria-hidden="true">↗</span></button></div>`).join("");
    $("support-contacts").querySelectorAll("[data-support]").forEach((button) => button.addEventListener("click", () => {
      const person = button.dataset.support === "gpb" ? C.buyers.gpb : buyer;
      showContact(person, person.role);
    }));
    renderSelected();
  }
  function openDialog(title, content) {
    if (!$("portal-dialog").open) dialogOpener = document.activeElement;
    $("dialog-title").textContent = title;
    $("dialog-content").innerHTML = content;
    if (!$("portal-dialog").open) $("portal-dialog").showModal();
    document.body.classList.add("modal-open");
    $("close-dialog").focus();
  }
  async function copyText(text, button) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      button.textContent = "Скопировано";
      const status = $("dialog-copy-status");
      if (status) status.textContent = "Текст скопирован";
    } catch {
      let fallback = $("copy-fallback");
      if (!fallback) {
        fallback = document.createElement("div");
        fallback.id = "copy-fallback";
        fallback.className = "task-form";
        fallback.innerHTML = '<label>Скопируйте текст вручную<textarea id="manual-copy" readonly></textarea></label>';
        $("dialog-content").append(fallback);
      }
      $("manual-copy").value = text;
      $("manual-copy").focus();
      $("manual-copy").select();
    }
  }
  function showContact(contact, subtitle, fromPool = false) {
    openDialog(contact.name, `<p class="dialog-intro">${esc(subtitle)}</p><dl class="contact-details"><div class="contact-detail"><div><dt>Почта</dt><dd>${esc(contact.email)}</dd></div><button class="text-button copy-button" type="button" id="copy-email">Скопировать</button></div><div class="contact-detail"><div><dt>Телефон</dt><dd>${esc(contact.phone)}</dd></div><button class="text-button copy-button" type="button" id="copy-phone">Скопировать</button></div></dl><p class="dialog-status" id="dialog-copy-status" role="status"></p>${fromPool ? '<button class="text-button" id="back-to-pool" type="button">← К пулу поставщиков</button>' : ""}<p class="dialog-note">Пример контакта для демонстрации. Отправка сообщений и звонки не выполняются.</p>`);
    $("copy-email").addEventListener("click", (event) => copyText(contact.email, event.currentTarget));
    $("copy-phone").addEventListener("click", (event) => copyText(contact.phone, event.currentTarget));
    if (fromPool) $("back-to-pool").addEventListener("click", showPool);
  }
  function showPool() {
    const categoryIds = new Set(state.matches.map((contract) => contract.category));
    const pool = catalog.filter((contract) => C.isActive(contract, asOf) && categoryIds.has(contract.category));
    const partners = [...new Map(pool.map((contract) => [contract.supplier, contract])).values()];
    openDialog("Пул поставщиков", `<p class="dialog-intro">${partners.length} ${C.plural(partners.length, ["поставщик", "поставщика", "поставщиков"])} по найденным категориям. Откройте контакты, чтобы обсудить вашу задачу.</p><ul class="pool-list">${partners.map((contract) => `<li><div><strong>${esc(contract.supplier)}</strong><p>${esc(C.categories[contract.category].title)} · № ${esc(contract.id)}</p></div><button class="text-button" type="button" data-pool-contact="${esc(contract.id)}">Контакты ↗</button></li>`).join("")}</ul><p class="dialog-note">Пул и контакты показаны на вымышленных примерах.</p>`);
    $("dialog-content").querySelectorAll("[data-pool-contact]").forEach((button) => button.addEventListener("click", () => {
      const contract = pool.find((item) => item.id === button.dataset.poolContact);
      showContact(contract.contact, contract.supplier, true);
    }));
  }
  function showTask() {
    const contract = selected();
    if (state.matches.length && !contract) {
      const available = C.filterAndSort(state.matches, state.filter, state.order, asOf);
      if (!available.length) {
        state.filter = "all";
        state.page = 0;
        renderTable();
      }
      $("table-shell").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
      $("contracts-body").querySelector("input")?.focus({ preventScroll: true });
      notify("Сначала выберите подходящий договор в таблице");
      return;
    }
    openDialog("Задача на закупку", `<p class="dialog-intro">Так будет выглядеть переход к оформлению задачи. Часть данных уже заполнена из поиска.</p>${contract ? `<div class="task-contract">${esc(contract.supplier)}<br>Договор № ${esc(contract.id)} · доступно ${amount(contract.available)}</div>` : ""}<form class="task-form" id="task-form"><label>Тема<input id="task-title" maxlength="200" autocomplete="off"></label><label>Описание<textarea id="task-description" rows="8" maxlength="5000"></textarea></label><button class="button button--primary" type="submit">Скопировать текст задачи</button><p class="dialog-status" id="dialog-copy-status" role="status"></p></form><p class="dialog-note">Демонстрационный макет. Подключения к Jira нет, задача не создаётся и никуда не отправляется.</p>`);
    $("task-title").value = contract ? `Оформление заказа: ${state.query}` : `Новая закупка: ${state.query}`;
    $("task-description").value = [
      `Потребность: ${state.query}`,
      ...(contract ? [`Поставщик: ${contract.supplier}`, `Договор: № ${contract.id}`, `Срок действия: до ${dateText(contract.expires)}`, `Доступный лимит: ${amount(contract.available)}`] : ["Действующий договор не найден. Порядок закупки уточняется с закупщиком."]),
      "", "Состав заказа: [укажите товар или услугу]", "Стоимость: [укажите сумму]", "Желаемый срок: [укажите дату]", ...(contract ? ["Приложение: согласованный заказ к договору"] : []),
    ].join("\n");
    $("task-form").addEventListener("submit", (event) => {
      event.preventDefault();
      copyText(`${$("task-title").value}\n\n${$("task-description").value}`, $("task-form").querySelector("button"));
    });
  }

  $("search-form").addEventListener("submit", (event) => { event.preventDefault(); runSearch(); });
  $("purchase-query").addEventListener("input", () => {
    cancelSearch();
    clearValidation();
    $("clear-query").hidden = !$("purchase-query").value.length;
    if (!$("purchase-query").value.trim()) { home({ focus: false }); return; }
    if (state.query && $("purchase-query").value.trim() !== state.query) {
      $("results").hidden = true;
      $("search-feedback").textContent = "Нажмите «Найти», чтобы обновить результаты";
    } else if (state.query) $("results").hidden = false;
  });
  $("purchase-query").addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); home(); }
  });
  $("clear-query").addEventListener("click", () => home());
  $("home-link").addEventListener("click", (event) => { event.preventDefault(); home({ focus: false }); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-query]").forEach((button) => button.addEventListener("click", () => {
    cancelSearch(); $("purchase-query").value = button.dataset.query; runSearch();
  }));
  $("contracts-body").addEventListener("change", (event) => {
    if (event.target.matches('input[name="contract"]')) chooseContract(event.target.value);
  });
  $("contracts-body").addEventListener("click", (event) => {
    const contactButton = event.target.closest("[data-contact]");
    if (contactButton) {
      const contract = state.matches.find((item) => item.id === contactButton.dataset.contact);
      showContact(contract.contact, contract.supplier);
      return;
    }
    if (event.target.closest("input, label, button, a")) return;
    const row = event.target.closest("tr[data-contract]");
    if (row) { chooseContract(row.dataset.contract); row.querySelector("input").focus(); }
  });
  function setFilter(value) { state.filter = value; state.page = 0; renderTable(); }
  $("filter-all").addEventListener("click", () => setFilter("all"));
  $("filter-safe").addEventListener("click", () => setFilter("safe"));
  $("reset-filter").addEventListener("click", () => setFilter("all"));
  $("sort-order").addEventListener("change", (event) => { state.order = event.target.value; state.page = 0; renderTable(); });
  $("previous-page").addEventListener("click", () => { state.page -= 1; renderTable(); });
  $("next-page").addEventListener("click", () => { state.page += 1; renderTable(); });
  $("change-query").addEventListener("click", () => { $("purchase-query").focus(); $("purchase-query").select(); $("search-form").scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" }); });
  $("open-pool").addEventListener("click", showPool);
  $("create-task").addEventListener("click", showTask);
  $("close-dialog").addEventListener("click", () => $("portal-dialog").close());
  $("portal-dialog").addEventListener("click", (event) => {
    if (event.target !== $("portal-dialog")) return;
    const box = $("portal-dialog").getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $("portal-dialog").close();
  });
  $("portal-dialog").addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
  });
})();
