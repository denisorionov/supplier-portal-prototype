const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const chips = [...document.querySelectorAll('.chip')];
const resultsSection = document.getElementById('resultsSection');
const loadingState = document.getElementById('loadingState');
const foundState = document.getElementById('foundState');
const notFoundState = document.getElementById('notFoundState');
const foundQuery = document.getElementById('foundQuery');
const notFoundQuery = document.getElementById('notFoundQuery');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalAction = document.getElementById('modalAction');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalIcon = document.getElementById('modalIcon');

function normalize(value){return value.trim().toLowerCase();}
function isNoContractQuery(query){const q=normalize(query);return q.includes('нестандарт')||q.includes('оборуд');}
function openModal(type,extra=''){
  const content={
    task:{icon:'→',title:'Переход в систему создания задач',text:'В рабочей версии здесь будет открываться форма создания задачи на закупку.'},
    contact:{icon:'✦',title:'Контакт ответственного закупщика',text:'Екатерина Морозова · Категорийный менеджер · e.morozova@company-demo.ru'},
    details:{icon:'i',title:'Подробная инструкция',text:'В рабочей версии здесь будет доступна расширенная инструкция с примерами и ответами на частые вопросы.'},
    profile:{icon:'●',title:'Профиль сотрудника в интранете',text:'В рабочей версии имя будет вести в профиль сотрудника в корпоративном интранете.'},
    contract:{icon:'✓',title:'Договор выбран',text:extra?`Вы выбрали: ${extra}. Теперь можно переходить к согласованию заказа с поставщиком.`:'Договор выбран.'}
  }[type];
  modalIcon.textContent=content.icon; modalTitle.textContent=content.title; modalText.textContent=content.text;
  modalBackdrop.classList.remove('hidden'); modalBackdrop.setAttribute('aria-hidden','false');
}
function closeModal(){modalBackdrop.classList.add('hidden');modalBackdrop.setAttribute('aria-hidden','true');}
function runSearch(query){
  const cleanQuery=query.trim()||'Сувенирная продукция';
  searchInput.value=cleanQuery; resultsSection.classList.remove('hidden'); foundState.classList.add('hidden'); notFoundState.classList.add('hidden'); loadingState.classList.remove('hidden');
  setTimeout(()=>{loadingState.classList.add('hidden');if(isNoContractQuery(cleanQuery)){notFoundQuery.textContent=`«${cleanQuery}»`;notFoundState.classList.remove('hidden');}else{foundQuery.textContent=cleanQuery;foundState.classList.remove('hidden');}resultsSection.scrollIntoView({behavior:'smooth',block:'start'});},650);
}
searchForm.addEventListener('submit',e=>{e.preventDefault();runSearch(searchInput.value);});
chips.forEach(chip=>chip.addEventListener('click',()=>runSearch(chip.dataset.query)));
document.querySelectorAll('.open-task').forEach(btn=>btn.addEventListener('click',()=>openModal('task')));
document.querySelectorAll('.open-contact').forEach(btn=>btn.addEventListener('click',()=>openModal('contact')));
document.querySelectorAll('[data-profile]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openModal('profile');}));
document.querySelectorAll('.select-contract').forEach(btn=>btn.addEventListener('click',()=>openModal('contract',btn.dataset.contract)));
document.getElementById('detailsButton').addEventListener('click',()=>openModal('details'));
modalClose.addEventListener('click',closeModal); modalAction.addEventListener('click',closeModal);
modalBackdrop.addEventListener('click',e=>{if(e.target===modalBackdrop)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});