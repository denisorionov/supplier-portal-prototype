"use strict";

// Вымышленные данные для презентации. Никаких внешних запросов.
(() => {
  function todayInMoscow(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type).value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
  const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
  const toISO = (date) => date.toISOString().slice(0, 10);
  function addMonths(iso, months) {
    const date = toDate(iso);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return toISO(new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay))));
  }
  function addDays(iso, days) {
    const date = toDate(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return toISO(date);
  }
  function isActive(contract, asOf) {
    return contract.starts <= asOf && contract.expires >= asOf;
  }
  function flags(contract, asOf) {
    return {
      lowLimit: contract.ceiling > 0 && contract.available / contract.ceiling < 0.2,
      expiring: isActive(contract, asOf) && contract.expires < addMonths(asOf, 3),
    };
  }
  const buyers = {
    marketing: { name: "Екатерина Морозова", role: "Категорийный закупщик", initials: "ЕМ", email: "marketing@procurement.example", phone: "+7 (000) 000-00-21" },
    it: { name: "Дмитрий Соколов", role: "Категорийный закупщик", initials: "ДС", email: "it@procurement.example", phone: "+7 (000) 000-00-22" },
    general: { name: "Команда закупок", role: "Поможем найти закупщика", initials: "ЗК", email: "help@procurement.example", phone: "+7 (000) 000-00-20" },
    gpb: { name: "Мария Лебедева", role: "Сотрудник ГПБ", initials: "МЛ", email: "tasks@gpb.example", phone: "+7 (000) 000-00-23" },
  };
  const categories = {
    merch: { title: "Сувенирная продукция", area: "Маркетинг", keywords: "сувениры мерч брендирование промо маркетинг", buyer: "marketing" },
    print: { title: "Полиграфия", area: "Маркетинг", keywords: "полиграфия печать типография маркетинг", buyer: "marketing" },
    it: { title: "ИТ-оборудование", area: "ИТ", keywords: "ит it оборудование техника", buyer: "it" },
    events: { title: "Организация мероприятий", area: "Маркетинг", keywords: "мероприятия события ивенты event маркетинг", buyer: "marketing" },
  };
  function createCatalog(asOf) {
    const supplier = (name, person, email, suffix) => ({ name, contact: { name: person, email, phone: `+7 (000) 000-01-${suffix}` } });
    const make = (id, category, subject, partner, ceiling, available, months, days, tags) => ({
      id, category, subject, supplier: partner.name, contact: partner.contact, ceiling, available,
      starts: addMonths(asOf, -6), expires: addDays(addMonths(asOf, months), days), tags,
    });
    return [
      make("SU-1042", "merch", "Корпоративные сувениры и брендированная продукция", supplier("ООО «БрендФабрика»", "Анна Волкова", "anna@brandfactory.example", "01"), 12000000, 7450000, 9, 0, "кружки ручки блокноты сумки сувениры"),
      make("SU-1187", "merch", "Подарочные наборы и комплекты для сотрудников", supplier("ООО «ПромоПак»", "Иван Петров", "ivan@promopack.example", "02"), 8000000, 1050000, 7, 0, "наборы подарки welcome onboarding"),
      make("SU-1210", "merch", "Сувениры для конференций и мероприятий", supplier("ООО «МерчЛайн»", "Мария Орлова", "maria@merchline.example", "03"), 5500000, 3200000, 1, 15, "бейджи шопперы ручки блокноты кружки"),
      make("SU-1264", "merch", "Брендированная одежда и текстиль", supplier("ООО «Форма»", "Олег Фролов", "oleg@forma.example", "04"), 9500000, 6830000, 10, 0, "одежда футболки худи кепки текстиль"),
      make("SU-1281", "merch", "Награды, призы и памятные подарки", supplier("ООО «АртПромо»", "Дарья Белова", "daria@artpromo.example", "05"), 4000000, 560000, 2, 10, "кубки награды призы подарки"),
      make("PR-2101", "print", "Печать буклетов, каталогов и брошюр", supplier("ООО «ПринтБюро»", "Максим Крылов", "max@printbureau.example", "06"), 6000000, 2600000, 6, 0, "буклеты каталоги брошюры печать"),
      make("PR-2102", "print", "Широкоформатная и рекламная печать", supplier("ООО «Формат»", "Ирина Павлова", "irina@format.example", "07"), 3500000, 1200000, 8, 0, "баннеры стенды плакаты печать"),
      make("PR-2103", "print", "Деловая полиграфия и печатные материалы", supplier("ООО «Линия принт»", "Алексей Жуков", "alex@lineprint.example", "08"), 2000000, 400000, 3, 0, "визитки бланки конверты печать"),
      make("IT-3401", "it", "Ноутбуки и рабочие станции", supplier("ООО «Техносфера»", "Сергей Миронов", "sergey@technosphere.example", "09"), 35000000, 18200000, 12, 0, "ноутбуки компьютеры рабочие станции"),
      make("IT-3402", "it", "Компьютерная техника и периферия", supplier("ООО «Цифровая среда»", "Елена Котова", "elena@digital.example", "10"), 20000000, 8600000, 2, 0, "ноутбуки компьютеры мониторы клавиатуры мыши"),
      make("IT-3403", "it", "Мониторы и офисные аксессуары", supplier("ООО «Системный подход»", "Павел Егоров", "pavel@systems.example", "11"), 8000000, 5750000, 7, 0, "мониторы док станции клавиатуры мыши"),
      make("EV-4101", "events", "Организация деловых мероприятий", supplier("ООО «Событие»", "Наталья Соколова", "natalia@event.example", "12"), 15000000, 10400000, 9, 0, "конференции форум площадка организация"),
      make("EV-4102", "events", "Техническое сопровождение мероприятий", supplier("ООО «Сцена»", "Артём Захаров", "artem@stage.example", "13"), 7000000, 910000, 5, 0, "свет звук трансляция сцена"),
      make("SU-0099", "merch", "Архивный договор на сувенирную продукцию", supplier("ООО «Архив промо»", "Демо-контакт", "archive@supplier.example", "99"), 3000000, 1700000, -1, 0, "сувениры"),
    ];
  }
  const normalize = (value) => value.toLowerCase().replaceAll("ё", "е").replace(/[^a-zа-я0-9]+/g, " ").trim();
  const stopWords = new Set(["и", "или", "для", "по", "на", "в", "у", "с", "со", "к", "из", "от", "мне", "нам", "нужно", "нужны", "нужен", "хочу", "купить", "приобрести", "заказать", "найти", "закупить", "ооо", "пул", "поставщиков", "поставщик", "поставщика", "договор", "договоры", "действующие"]);
  function root(word) {
    for (const [prefixes, replacement] of [
      [["мерч", "сувенир"], "сувенир"],
      [["полиграф", "типограф", "печат"], "полиграф"],
      [["ноутбук", "laptop"], "ноутбук"],
      [["компьютер", "computer"], "компьютер"],
      [["мероприят", "ивент", "event"], "мероприят"],
      [["брендир"], "брендир"],
      [["подар"], "подар"],
      [["ит", "it"], "ит"],
    ]) if (prefixes.some((prefix) => word.startsWith(prefix))) return replacement;
    return word.length > 4 ? word.replace(/(?:иями|ами|ями|ого|ему|ыми|ими|ов|ев|ий|ая|яя|ые|ое|ие|ую|юю|ей|ия|ы|и|а|я|у|ю|е)$/u, "") : word;
  }
  const tokens = (value) => normalize(value).split(/\s+/).filter((word) => word && !stopWords.has(word)).map(root);
  function searchContracts(catalog, query, asOf) {
    const terms = tokens(query);
    if (!terms.length) return [];
    return catalog.filter((contract) => {
      if (!isActive(contract, asOf)) return false;
      const category = categories[contract.category];
      const words = tokens([contract.subject, contract.supplier, contract.id, contract.tags, category.title, category.keywords].join(" "));
      return terms.every((term) => words.some((word) => word.includes(term)));
    });
  }
  function inferBuyer(contracts, query) {
    const keys = new Set(contracts.map((contract) => categories[contract.category].buyer));
    if (keys.size === 1) return buyers[[...keys][0]];
    if (keys.size > 1) return buyers.general;
    const queryTerms = tokens(query);
    for (const category of Object.values(categories)) {
      if (queryTerms.some((term) => tokens(category.keywords).includes(term))) return buyers[category.buyer];
    }
    return buyers.general;
  }
  function filterAndSort(contracts, filter, order, asOf) {
    const result = contracts.filter((contract) => {
      const status = flags(contract, asOf);
      return filter !== "safe" || (!status.lowLimit && !status.expiring);
    });
    if (order === "limit") result.sort((a, b) => b.available - a.available);
    if (order === "expiry") result.sort((a, b) => a.expires.localeCompare(b.expires));
    return result;
  }
  function plural(number, forms) {
    const mod10 = number % 10, mod100 = number % 100;
    return forms[mod10 === 1 && mod100 !== 11 ? 0 : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 1 : 2];
  }
  globalThis.PortalCatalog = Object.freeze({ todayInMoscow, addMonths, addDays, isActive, flags, createCatalog, searchContracts, inferBuyer, filterAndSort, plural, categories, buyers });
})();
