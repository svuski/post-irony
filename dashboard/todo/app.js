const KEY='task-system-v1';
const SEED_KEY='task-system-seed-20260916-1';
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const esc=(s='')=>String(s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const areas={alpha:{name:'ALPHA'},beta:{name:'BETA'},gamma:{name:'GAMMA'}};
const HORIZONS=[['today','DAY'],['week','WEEK'],['month','MONTH'],['quarter','QUARTER']];
const TRAILS={quarter:'MONTH · WEEK · DAY',month:'WEEK · DAY',week:'DAY',today:''};
const COLORS=['red','orange','yellow','green','blue','purple'];
const COLOR_HEX={red:'#d95b5b',orange:'#e28b45',yellow:'#d6b73f',green:'#5d9a67',blue:'#5d83c4',purple:'#8b6ec1'};
let data=load();
seedTasksOnce();
let calendarDate=new Date();calendarDate.setDate(1);
let selectedDate='';let currentHorizon='today';

function load(){try{const x=JSON.parse(localStorage.getItem(KEY))||{};x.tasks=(x.tasks||[]).map(t=>({...t,focus:t.focus==='yes'||t.focus===true?'yes':''}));x.events=x.events||[];return x}catch{return{tasks:[],events:[]}}}
function seedTasksOnce(){
  if(localStorage.getItem(SEED_KEY))return;
  const additions=[
    {id:'seed-jpt-registration-20260916',text:'JPT 접수',horizon:'week',area:'alpha',due:'',priority:'normal',notes:'',focus:'',done:false},
    {id:'seed-resume-sales-pr-20260916',text:'이력서 해영/PR 작성',horizon:'week',area:'alpha',due:'',priority:'normal',notes:'',focus:'',done:false},
    {id:'seed-body-snatchers-20260916',text:'신체강탈자의 침입 마저 보기',horizon:'today',area:'beta',due:'2026-09-16',priority:'normal',notes:'',focus:'',done:false}
  ];
  additions.forEach(t=>{if(!data.tasks.some(x=>x.id===t.id||(x.text===t.text&&x.horizon===t.horizon&&x.area===t.area)))data.tasks.push(t)});
  localStorage.setItem(KEY,JSON.stringify(data));
  localStorage.setItem(SEED_KEY,'1');
}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render();refreshOpenDialogs()}
function fmt(d){if(!d)return'';return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric'}).format(new Date(d+'T00:00:00'))}
function isoToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function progressFor(key){const all=data.tasks.filter(t=>t.horizon===key);if(!all.length)return 0;return Math.round(all.filter(t=>t.done).length/all.length*100)}
function colorHex(name){return COLOR_HEX[COLORS.includes(name)?name:'red']}

const horizonsEl=document.getElementById('horizons');
const taskDialog=document.getElementById('taskDialog');const taskForm=document.getElementById('taskForm');
const eventDialog=document.getElementById('eventDialog');const eventForm=document.getElementById('eventForm');
const horizonDialog=document.getElementById('horizonDialog');const inboxDialog=document.getElementById('inboxDialog');const calendarDialog=document.getElementById('calendarDialog');

function render(){renderFocus();renderInbox();renderHorizons();renderCalendar()}
function renderFocus(){const items=data.tasks.filter(t=>t.focus==='yes'&&!t.done).slice(0,3);focusList.innerHTML=items.map((t,i)=>`<div class="focus-card"><span class="focus-index">0${i+1}</span><div><div class="focus-task">${esc(t.text)}</div><div class="task-meta">${t.due?fmt(t.due):''}</div></div><input type="checkbox" data-toggle="${t.id}" aria-label="완료"></div>`).join('')}
function renderInbox(){const items=data.tasks.filter(t=>t.horizon==='inbox');inboxCount.textContent=items.filter(t=>!t.done).length;inboxList.innerHTML=items.map(renderTask).join('')}
function renderHorizons(){horizonsEl.innerHTML=HORIZONS.map(([key,title])=>{const items=data.tasks.filter(t=>t.horizon===key);const left=items.filter(t=>!t.done).length;const pct=progressFor(key);return `<button class="horizon-line" type="button" data-open-horizon="${key}"><span class="horizon-title">${title}</span><span class="horizon-status"><span>${left} LEFT</span><span>${pct}%</span><span class="horizon-arrow">↗</span></span></button>`}).join('')}
function renderArea(horizon,area,a){const tasks=data.tasks.filter(t=>t.horizon===horizon&&t.area===area);return `<section class="area area-${area}"><div class="area-head"><span class="area-name">${a.name}</span></div><div class="task-list">${tasks.map(renderTask).join('')}</div></section>`}
function renderTask(t){return `<div class="task ${t.done?'done':''} priority-${esc(t.priority||'normal')}"><input type="checkbox" data-toggle="${t.id}" ${t.done?'checked':''} aria-label="완료"><div><div class="task-text">${esc(t.text)}</div><div class="task-meta">${t.due?fmt(t.due):''}${t.notes?(t.due?' · ':'')+esc(t.notes):''}</div></div><div class="task-actions"><button data-edit="${t.id}">EDIT</button><button data-delete-task="${t.id}">DELETE</button></div></div>`}
function renderHorizonDialog(){const item=HORIZONS.find(([k])=>k===currentHorizon);if(!item)return;horizonDialogTitle.textContent=item[1];horizonTrail.textContent=TRAILS[currentHorizon]||'';horizonDialogBody.innerHTML=`<div class="popup-areas">${Object.entries(areas).map(([area,a])=>renderArea(currentHorizon,area,a)).join('')}</div>`}
function openHorizon(key){currentHorizon=key;renderHorizonDialog();if(!horizonDialog.open)horizonDialog.showModal()}
function refreshOpenDialogs(){if(horizonDialog.open)renderHorizonDialog();if(inboxDialog.open)renderInbox();if(calendarDialog.open)renderCalendarLarge()}

function calendarCells(targetLarge=false){const year=calendarDate.getFullYear(),month=calendarDate.getMonth();const first=new Date(year,month,1),last=new Date(year,month+1,0),today=new Date();const cells=[];for(let i=0;i<first.getDay();i++)cells.push('<span class="cal-empty"></span>');for(let d=1;d<=last.getDate();d++){const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const related=data.events.filter(e=>e.date===iso);const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;const dots=related.slice(0,4).map(e=>`<b class="event-dot" style="background:${colorHex(e.color)}"></b>`).join('');cells.push(`<button class="cal-day ${targetLarge?'cal-day-large':''} ${isToday?'today':''} ${selectedDate===iso?'selected':''}" data-date="${iso}"><span>${d}</span><span class="event-dots">${dots}</span></button>`)}return cells.join('')}
function renderCalendar(){const title=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(calendarDate).toUpperCase();calendarTitle.textContent=title;calendarGrid.innerHTML=calendarCells(false);renderSmallAgenda()}
function renderEventRow(e,large=false){return `<div class="calendar-event-row ${large?'large':''}"><span class="event-dot" style="background:${colorHex(e.color)}"></span><div><strong>${esc(e.text)}</strong>${large&&e.notes?`<p>${esc(e.notes)}</p>`:''}</div>${large?`<div class="event-row-actions"><button data-edit-event="${e.id}">EDIT</button><button data-delete-event="${e.id}">DELETE</button></div>`:''}</div>`}
function renderSmallAgenda(){if(!selectedDate){dayAgenda.innerHTML='';return}const items=data.events.filter(e=>e.date===selectedDate);dayAgenda.innerHTML=`<div class="agenda-date">${new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(selectedDate+'T00:00:00'))}</div>${items.map(e=>renderEventRow(e,false)).join('')}`}
function renderCalendarLarge(){const title=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(calendarDate).toUpperCase();calendarDialogTitle.textContent=title;calendarGridLarge.innerHTML=calendarCells(true);renderLargeAgenda()}
function renderLargeAgenda(){if(!selectedDate){calendarAgendaLarge.innerHTML='';return}const items=data.events.filter(e=>e.date===selectedDate);calendarAgendaLarge.innerHTML=`<div class="agenda-date large-agenda-date">${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date(selectedDate+'T00:00:00'))}</div>${items.map(e=>renderEventRow(e,true)).join('')}`}

function openTask({horizon='today',due='',area='alpha'}={}){taskForm.reset();taskForm.elements.id.value='';taskForm.elements.horizon.value=horizon;taskForm.elements.area.value=area;taskForm.elements.due.value=due;deleteTaskBtn.style.display='none';taskDialog.showModal()}
function editTask(t){taskForm.reset();Object.entries(t).forEach(([k,v])=>{if(taskForm.elements[k]&&k!=='focus')taskForm.elements[k].value=v??''});taskForm.elements.focus.checked=t.focus==='yes';deleteTaskBtn.style.display='inline-flex';taskDialog.showModal()}
function openEvent(date=selectedDate||isoToday()){eventForm.reset();eventForm.elements.id.value='';eventForm.elements.date.value=date;eventForm.elements.color.value='red';deleteEventBtn.style.display='none';eventDialog.showModal()}
function editEvent(e){eventForm.reset();eventForm.elements.id.value=e.id;eventForm.elements.text.value=e.text||'';eventForm.elements.date.value=e.date||isoToday();eventForm.elements.notes.value=e.notes||'';eventForm.elements.color.value=COLORS.includes(e.color)?e.color:'red';deleteEventBtn.style.display='inline-flex';eventDialog.showModal()}

cancelTaskBtn.onclick=()=>taskDialog.close();cancelEventBtn.onclick=()=>eventDialog.close();
closeHorizonDialog.onclick=()=>horizonDialog.close();closeInboxDialog.onclick=()=>inboxDialog.close();closeCalendarDialog.onclick=()=>calendarDialog.close();
addHorizonTask.onclick=()=>openTask({horizon:currentHorizon});addInboxTask.onclick=()=>openTask({horizon:'inbox',area:'none'});openInbox.onclick=()=>{renderInbox();inboxDialog.showModal()};
openCalendar.onclick=()=>{renderCalendarLarge();calendarDialog.showModal()};
addCalendarEvent.onclick=()=>openEvent();addCalendarEventLarge.onclick=()=>openEvent();
deleteTaskBtn.onclick=()=>{const id=taskForm.elements.id.value;if(!id)return;if(confirm('이 할 일을 삭제할까?')){data.tasks=data.tasks.filter(t=>t.id!==id);taskDialog.close();save()}};
deleteEventBtn.onclick=()=>{const id=eventForm.elements.id.value;if(!id)return;if(confirm('이 일정을 삭제할까?')){data.events=data.events.filter(e=>e.id!==id);eventDialog.close();save()}};

[taskDialog,eventDialog,horizonDialog,inboxDialog,calendarDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
taskForm.addEventListener('submit',e=>{e.preventDefault();if(!taskForm.reportValidity())return;const f=Object.fromEntries(new FormData(taskForm));f.focus=taskForm.elements.focus.checked?'yes':'';if(f.horizon!=='inbox'&&f.area==='none')f.area='alpha';if(f.focus==='yes'){const others=data.tasks.filter(t=>t.focus==='yes'&&!t.done&&t.id!==f.id);if(others.length>=3){alert('FOCUS 3는 최대 3개까지 표시할 수 있어.');return}}if(f.id){Object.assign(data.tasks.find(t=>t.id===f.id),f)}else data.tasks.push({...f,id:uid(),done:false});taskDialog.close();save()});
eventForm.addEventListener('submit',e=>{e.preventDefault();if(!eventForm.reportValidity())return;const f=Object.fromEntries(new FormData(eventForm));if(f.id){Object.assign(data.events.find(x=>x.id===f.id),f)}else data.events.push({...f,id:uid()});selectedDate=f.date;eventDialog.close();save()});

document.body.addEventListener('change',e=>{const id=e.target.dataset.toggle;if(!id)return;const t=data.tasks.find(x=>x.id===id);if(t){t.done=e.target.checked;save()}});
document.body.addEventListener('click',e=>{const horizon=e.target.closest('[data-open-horizon]');if(horizon){openHorizon(horizon.dataset.openHorizon);return}const cal=e.target.closest('[data-date]');if(cal){selectedDate=cal.dataset.date;renderCalendar();if(calendarDialog.open)renderCalendarLarge();return}const edit=e.target.closest('[data-edit]');if(edit){const t=data.tasks.find(x=>x.id===edit.dataset.edit);if(t)editTask(t);return}const del=e.target.closest('[data-delete-task]');if(del){if(confirm('이 할 일을 삭제할까?')){data.tasks=data.tasks.filter(t=>t.id!==del.dataset.deleteTask);save()}return}const ee=e.target.closest('[data-edit-event]');if(ee){const ev=data.events.find(x=>x.id===ee.dataset.editEvent);if(ev)editEvent(ev);return}const de=e.target.closest('[data-delete-event]');if(de){if(confirm('이 일정을 삭제할까?')){data.events=data.events.filter(x=>x.id!==de.dataset.deleteEvent);save()}return}});
function moveMonth(delta){calendarDate.setMonth(calendarDate.getMonth()+delta);selectedDate='';renderCalendar();if(calendarDialog.open)renderCalendarLarge()}
prevMonth.onclick=()=>moveMonth(-1);nextMonth.onclick=()=>moveMonth(1);prevMonthLarge.onclick=()=>moveMonth(-1);nextMonthLarge.onclick=()=>moveMonth(1);
render();