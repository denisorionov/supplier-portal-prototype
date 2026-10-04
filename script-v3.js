const searchForm=document.getElementById('searchForm');
const searchInput=document.getElementById('searchInput');
const exampleQueries=[...document.querySelectorAll('.example-query')];
const resultsSection=document.getElementById('resultsSection');
const loadingState=document.getElementById('loadingState');
const foundState=document.getElementById('foundState');
const notFoundState=document.getElementById('notFoundState');
const foundQuery=document.getElementById('foundQuery');
const notFoundQuery=document.getElementById('notFoundQuery');

const modalBackdrop=document.getElementById('modalBackdrop');
const modalClose=document.getElementById('modalClose');
const modalAction=document.getElementById('modalAction');
const modalTitle=document.getElementById('modalTitle');
const modalText=document.getElementById('modalText');
const modalMark=document.getElementById('modalMark');

function isNoContractQuery(value){
  const q=value.trim().toLowerCase();
  return q.includes('нестандарт')||q.includes('оборуд');
}

function openModal(type){
  const content={
    task:{
      mark:'→',
      title:'Переход к созданию задачи',
      text:'В рабочей версии здесь будет открываться Jira с формой создания задачи на закупку.'
    },
    contact:{
      mark:'?',
      title:'Ответственный закупщик',
      text:'Екатерина Морозова · Категорийный менеджер. В рабочей версии здесь будут доступны профиль в интранете и рабочие контакты.'
    },
    profile:{
      mark:'●',
      title:'Профиль в интранете',
      text:'В рабочей версии имя сотрудника будет ссылкой на его профиль в корпоративном интранете.'
    }
  }[type];
  modalMark.textContent=content.mark;
  modalTitle.textContent=content.title;
  modalText.textContent=content.text;
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden','false');
}

function closeModal(){
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden','true');
}

function runSearch(value){
  const query=value.trim()||'Сувенирная продукция';
  searchInput.value=query;

  resultsSection.classList.remove('hidden');
  foundState.classList.add('hidden');
  notFoundState.classList.add('hidden');
  loadingState.classList.remove('hidden');

  setTimeout(()=>{
    loadingState.classList.add('hidden');

    if(isNoContractQuery(query)){
      notFoundQuery.textContent='«'+query+'»';
      notFoundState.classList.remove('hidden');
    }else{
      foundQuery.textContent='«'+query+'»';
      foundState.classList.remove('hidden');
    }

    resultsSection.scrollIntoView({behavior:'smooth',block:'start'});
  },550);
}

searchForm.addEventListener('submit',event=>{
  event.preventDefault();
  runSearch(searchInput.value);
});

exampleQueries.forEach(button=>{
  button.addEventListener('click',()=>runSearch(button.dataset.query));
});

document.querySelectorAll('.open-task').forEach(button=>{
  button.addEventListener('click',()=>openModal('task'));
});

document.querySelectorAll('.open-contact').forEach(button=>{
  button.addEventListener('click',()=>openModal('contact'));
});

document.querySelectorAll('[data-profile]').forEach(link=>{
  link.addEventListener('click',event=>{
    event.preventDefault();
    openModal('profile');
  });
});

modalClose.addEventListener('click',closeModal);
modalAction.addEventListener('click',closeModal);
modalBackdrop.addEventListener('click',event=>{
  if(event.target===modalBackdrop)closeModal();
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeModal();
});