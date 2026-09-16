const KEY='task-system-v1';
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const areas={alpha:{name:'Alpha',desc:'취준'},beta:{name:'Beta',desc:'교양 · 취미'},gamma:{name:'Gamma',desc:'자기관리'}};
const horizons=[['quarter','이번 분기','Q4'],['month','이번 달','MONTH'],['week','이번 주','WEEK'],['today','오늘','TODAY']];
let data=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{tasks:[]}}catch{return{tasks:[]}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function fmt(d){if(!d)return'';return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric'}).format(new Date(d+'T00:00:00'))}

function render(){renderInbox();renderHorizons()}
function renderInbox(){const items=data.tasks.filter(t=>t.horizon==='inbox');inboxList.innerHTML=items.length?items.map(t=>`<div class="inbox-item ${t.done?'done':''}"><input type="checkbox" data-toggle="${t.id}" ${t.done?'checked':''}><span>${esc(t.text)}</span><button data-edit="${t.id}">수정</button></div>`).join(''):'<div class="empty">일단 던져둘 것 없음.</div>'}
function renderHorizons(){horizonsEl.innerHTML=horizons.map(([key,title,sub])=>`<section class="horizon"><div class="horizon-head"><div><div class="horizon-sub">${sub}</div><div class="horizon-title">${title}</div></div></div><div class="areas">${Object.entries(areas).map(([area,a])=>renderArea(key,area,a)).join('')}</div></section>`).join('')}
function renderArea(horizon,area,a){const tasks=data.tasks.filter(t=>t.horizon===horizon&&t.area===area);return `<section class="area glass"><div class="area-head"><span class="area-name">${a.name}</span><span class="area-desc">${a.desc}</span></div><div class="task-list">${tasks.length?tasks.map(renderTask).join(''):'<div class="empty">비어 있음.</div>'}</div></section>`}
function renderTask(t){return `<div class="task ${t.done?'done':''} priority-${esc(t.priority||'normal')}"><input type="checkbox" data-toggle="${t.id}" ${t.done?'checked':''}><div><div class="task-text">${esc(t.text)}</div><div class="task-meta">${t.due?fmt(t.due):''}${t.notes?(t.due?' · ':'')+esc(t.notes):''}</div></div><button data-edit="${t.id}">수정</button></div>`}

const horizonsEl=document.getElementById('horizons');
const taskDialog=document.getElementById('taskDialog');
const taskForm=document.getElementById('taskForm');
addTaskBtn.onclick=()=>{taskForm.reset();taskForm.elements.id.value='';taskForm.elements.horizon.value='today';taskForm.elements.area.value='alpha';taskDialog.showModal()};
cancelTaskBtn.onclick=()=>taskDialog.close();
taskDialog.addEventListener('click',e=>{if(e.target===taskDialog)taskDialog.close()});
taskForm.addEventListener('submit',e=>{e.preventDefault();if(!taskForm.reportValidity())return;const f=Object.fromEntries(new FormData(taskForm));if(f.id){Object.assign(data.tasks.find(t=>t.id===f.id),f)}else data.tasks.push({...f,id:uid(),done:false});taskDialog.close();save()});
document.body.addEventListener('change',e=>{const id=e.target.dataset.toggle;if(!id)return;const t=data.tasks.find(x=>x.id===id);if(t){t.done=e.target.checked;save()}});
document.body.addEventListener('click',e=>{const id=e.target.dataset.edit;if(!id)return;const t=data.tasks.find(x=>x.id===id);if(!t)return;taskForm.reset();Object.entries(t).forEach(([k,v])=>{if(taskForm.elements[k])taskForm.elements[k].value=v??''});taskDialog.showModal()});
document.body.addEventListener('dblclick',e=>{const id=e.target.dataset.edit;if(!id)return;if(confirm('이 할 일을 삭제할까?')){data.tasks=data.tasks.filter(t=>t.id!==id);save()}});
render();