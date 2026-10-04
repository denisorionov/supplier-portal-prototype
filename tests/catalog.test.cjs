const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../assets/catalog.js');
const C = globalThis.PortalCatalog;
const asOf = '2026-10-04';
const catalog = C.createCatalog(asOf);
const contract = { starts: '2026-01-01', expires: '2027-04-01', ceiling: 1000, available: 200 };

test('Предупреждение о лимите: 20% допустимо, менее 20% выделяется', () => {
  assert.equal(C.flags(contract, asOf).lowLimit, false);
  assert.equal(C.flags({ ...contract, available: 199.99 }, asOf).lowLimit, true);
  assert.equal(C.flags({ ...contract, available: 0 }, asOf).lowLimit, true);
});
test('Три календарных месяца: точная граница не выделяется', () => {
  assert.equal(C.flags({ ...contract, expires: '2027-01-04' }, asOf).expiring, false);
  assert.equal(C.flags({ ...contract, expires: '2027-01-03' }, asOf).expiring, true);
  assert.equal(C.flags({ ...contract, expires: asOf }, asOf).expiring, true);
});
test('Календарные месяцы корректно обрабатывают конец месяца и високосный год', () => {
  assert.equal(C.addMonths('2026-11-30', 3), '2027-02-28');
  assert.equal(C.addMonths('2027-11-30', 3), '2028-02-29');
  assert.equal(C.addMonths('2026-01-31', 1), '2026-02-28');
});
test('Поиск исключает истёкшие договоры и ещё не вступившие в силу', () => {
  const data = [...catalog, { ...catalog[0], id: 'FUTURE', starts: '2026-10-05' }];
  const result = C.searchContracts(data, 'сувениры', asOf);
  assert.equal(result.length, 5);
  assert.ok(!result.some((item) => ['SU-0099', 'FUTURE'].includes(item.id)));
});
test('Ключевые слова, синонимы, разные регистры и название поставщика', () => {
  for (const query of ['сувениры', 'МЕРЧ', 'Сувенирная продукция', 'Нужно купить сувениры', 'пул поставщиков сувениров']) {
    assert.equal(C.searchContracts(catalog, query, asOf).length, 5, query);
  }
  assert.deepEqual(C.searchContracts(catalog, 'БрендФабрика', asOf).map((item) => item.id), ['SU-1042']);
  assert.deepEqual(C.searchContracts(catalog, 'SU-1187', asOf).map((item) => item.id), ['SU-1187']);
});
test('Узкий запрос не подменяется всей категорией', () => {
  assert.equal(C.searchContracts(catalog, 'Ноутбуки', asOf).length, 2);
  assert.equal(C.searchContracts(catalog, 'визитки', asOf).length, 1);
  assert.equal(C.searchContracts(catalog, 'худи', asOf).length, 1);
  assert.equal(C.searchContracts(catalog, 'мерч кружки', asOf).length, 2);
  assert.equal(C.searchContracts(catalog, 'Полиграфия', asOf).length, 3);
});
test('Неизвестный и пустой запросы не показывают посторонние договоры', () => {
  for (const query of ['', '  ', 'мебель', '<script>alert(1)</script>']) assert.equal(C.searchContracts(catalog, query, asOf).length, 0);
});
test('Фильтр исключает оба типа предупреждений, сортировка не меняет источник', () => {
  const found = C.searchContracts(catalog, 'мерч', asOf);
  const before = found.map((item) => item.id);
  assert.equal(C.filterAndSort(found, 'safe', 'relevance', asOf).length, 2);
  const sorted = C.filterAndSort(found, 'all', 'limit', asOf);
  assert.equal(sorted[0].id, 'SU-1042');
  assert.equal(sorted.at(-1).id, 'SU-1281');
  assert.deepEqual(found.map((item) => item.id), before);
});
test('Категорийный закупщик соответствует запросу, для неизвестного есть общая команда', () => {
  assert.equal(C.inferBuyer(C.searchContracts(catalog, 'ноутбуки', asOf), 'ноутбуки').name, 'Дмитрий Соколов');
  assert.equal(C.inferBuyer([], 'мебель').name, 'Команда закупок');
});
test('Демонстрация сохраняет предупреждения на будущих датах', () => {
  const future = '2029-01-31';
  const result = C.searchContracts(C.createCatalog(future), 'сувениры', future);
  assert.equal(result.length, 5);
  assert.equal(result.filter((item) => C.flags(item, future).expiring).length, 2);
});
test('Дата среза учитывает часовой пояс Москвы', () => {
  assert.equal(C.todayInMoscow(new Date('2026-10-03T22:10:00Z')), '2026-10-04');
});
