const KEY='task-system-v1';
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const areas={alpha:{name:'Alpha',desc:'CAREER'},beta:{name:'Beta',desc:'CULTURE'},gamma:{name:'Gamma',desc:'SELF'}};
const horizons=[['quarter','QUARTER'],['month','MONTH'],['week','WEEK'],['today','DAY']];
let data=load();
let calendarDate=new Date();
calendarDate.setDate(1);
function load(){try{const x=JSON.parse(localStorage.getItem(KEY))||{tasks:[]};x.tasks=(x.tasks||[]).map(t=>({...t,focus:t.focus==='yes'||t.focus===true?'yes':''}));return x}catch{return{tasks:[]}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function fmt(d){if(!d)return'';return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric'}).format(new Date(d+'T00:00:00'))}
function areaLabel(a){return areas[a]?.desc||'INBOX'}

function render(){renderFocus();renderInbox();renderHorizons();renderCalendar()}
function renderFocus(){const items=data.tasks.filter(t=>t.focus==='yes'&&!t.done).slice(0,3);focusList.innerHTML=items.length?items.map((t,i)=>`<div class="focus-card"><span class="focus-index">0${i+1}</span><div><div class="focus-task">${esc(t.text)}</div><div class="task-meta">${areaLabel(t.area)}${t.due?` · ${fmt(t.due)}`:''}</div></div><input type="checkbox" data-toggle="${t.id}" aria-label="완료"></div>`).join(''):'<div class="empty">집중할 일을 최대 3개 표시할 수 있음.</div>'}
function renderInbox(){const items=data.tasks.filter(t=>t.horizon==='inbox');inboxCount.textContent=items.filter(t=>!t.done).length;inboxList.innerHTML=items.length?items.map(renderTask).join(''):'<div class="empty">일단 던져둘 것 없음.</div>'}
function progressFor(key){const all=data.tasks.filter(t=>t.horizon===key);if(!all.length)return 0;return Math.round(all.filter(t=>t.done).length/all.length*100)}
function renderHorizons(){horizons.innerHTML=horizonsData().map(([key,title])=>{const items=data.tasks.filter(t=>t.horizon===key);const left=items.filter(t=>!t.done).length;const pct=progressFor(key);return `<section class="horizon glass"><button class="horizon-head accordion-toggle" type="button" data-toggle-section="panel-${key}"><div><div class="section-kicker">Planning horizon</div><div class="horizon-title">${title}</div></div><div class="horizon-status"><span>${left} LEFT</span><div class="mini-progress"><i style="width:${pct}%"></i></div><span>${pct}%</span><span class="chevron">⌄</span></div></button><div id="panel-${key}" class="accordion-panel ${key==='today'?'open':''}"><div class="areas">${Object.entries(areas).map(([area,a])=>renderArea(key,area,a)).join('')}</div></div></section>`}).join('')}
function horizonsData(){return horizons}
function renderArea(horizon,area,a){const tasks=data.tasks.filter(t=>t.horizon===horizon&&t.area===area);return `<section class="area"><div class="area-head"><span class="area-name">${a.name}</span><span class="area-desc">${a.desc}</span></div><div class="task-list">${tasks.length?tasks.map(renderTask).join(''):'<div class="empty">비어 있음.</div>'}</div></section>`}
function renderTask(t){return `<div class="task ${t.done?'done':''} priority-${esc(t.priority||'normal')}"><input type="checkbox" data-toggle="${t.id}" ${t.done?'checked':''} aria-label="완료"><div><div class="task-text">${esc(t.text)}</div><div class="task-meta">${t.due?fmt(t.due):''}${t.notes?(t.due?' · ':'')+esc(t.notes):''}</div></div><button data-edit="${t.id}">EDIT</button></div>`}

function renderCalendar(){const year=calendarDate.getFullYear(),month=calendarDate.getMonth();calendarTitle.textContent=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(calendarDate).toUpperCase();const first=new Date(year,month,1),last=new Date(year,month+1,0),today=new Date();const cells=[];for(let i=0;i<first.getDay();i++)cells.push('<span class="cal-empty"></span>');for(let d=1;d<=last.getDate();d++){const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const related=data.tasks.filter(t=>t.due===iso);const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;cells.push(`<button class="cal-day ${isToday?'today':''} ${related.length?'has-task':''}" data-date="${iso}"><span>${d}</span>${related.length?`<i>${related.length}</i>`:''}</button>`)}calendarGrid.innerHTML=cells.join('')}
function showAgenda(date){const items=data.tasks.filter(t=>t.due===date);dayAgenda.innerHTML=`<div class="agenda-date">${new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(date+'T00:00:00'))}</div>`+(items.length?items.map(t=>`<div class="agenda-item ${t.done?'done':''}"><span>${esc(t.text)}</span><small>${areaLabel(t.area)}</small></div>`).join(''):'<div class="muted">등록된 일정 없음.</div>')}

const taskDialog=document.getElementById('taskDialog');
const taskForm=document.getElementById('taskForm');
addTaskBtn.onclick=()=>{taskForm.reset();taskForm.elements.id.value='';taskForm.elements.horizon.value='today';taskForm.elements.area.value='alpha';taskDialog.showModal()};
cancelTaskBtn.onclick=e=>{e.preventDefault();taskDialog.close()};
taskDialog.addEventListener('click',e=>{if(e.target===taskDialog)taskDialog.close()});
taskForm.addEventListener('submit',e=>{e.preventDefault();if(!taskForm.reportValidity())return;const f=Object.fromEntries(new FormData(taskForm));f.focus=taskForm.elements.focus.checked?'yes':'';if(f.id){Object.assign(data.tasks.find(t=>t.id===f.id),f)}else data.tasks.push({...f,id:uid(),done:false});taskDialog.close();save()});

document.body.addEventListener('change',e=>{const id=e.target.dataset.toggle;if(!id)return;const t=data.tasks.find(x=>x.id===id);if(t){t.done=e.target.checked;save()}});
document.body.addEventListener('click',e=>{const toggle=e.target.closest('[data-toggle-section]');if(toggle){document.getElementById(toggle.dataset.toggleSection)?.classList.toggle('open');toggle.classList.toggle('expanded');return}const cal=e.target.closest('[data-date]');if(cal){document.querySelectorAll('.cal-day.selected').forEach(x=>x.classList.remove('selected'));cal.classList.add('selected');showAgenda(cal.dataset.date);return}const id=e.target.dataset.edit;if(!id)return;const t=data.tasks.find(x=>x.id===id);if(!t)return;taskForm.reset();Object.entries(t).forEach(([k,v])=>{if(taskForm.elements[k]&&k!=='focus')taskForm.elements[k].value=v??''});taskForm.elements.focus.checked=t.focus==='yes';taskDialog.showModal()});
document.body.addEventListener('dblclick',e=>{const id=e.target.dataset.edit;if(!id)return;if(confirm('이 할 일을 삭제할까?')){data.tasks=data.tasks.filter(t=>t.id!==id);save()}});
prevMonth.onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();dayAgenda.innerHTML='<div class="muted">날짜를 누르면 일정이 보임.</div>'};
nextMonth.onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();dayAgenda.innerHTML='<div class="muted">날짜를 누르면 일정이 보임.</div>'};
render();