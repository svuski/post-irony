const STORAGE_KEY='job-hunt-control-room-v1';
const RESUME_DB='job-hunt-resumes-v1';
const RESUME_STORE='files';
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const todayISO=()=>new Date().toLocaleDateString('sv-SE');
const fmt=d=>d?new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric'}).format(new Date(d+'T00:00:00')):'—';
const daysUntil=d=>{const a=new Date();a.setHours(0,0,0,0);const b=new Date(d+'T00:00:00');return Math.ceil((b-a)/86400000)};
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const starter={jobs:[],exams:[
  {id:uid(),name:'JPT',registrationDate:'',fee:'',date:'2026-10-18',resultDate:'2026-10-23',goal:'700+',notes:'메인 시험'},
  {id:uid(),name:'JLPT',registrationDate:'',fee:'',date:'2026-12-06',resultDate:'',goal:'',notes:'서브'}
],todos:[]};
let data=load();
let resumes=[];
function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!x)return structuredClone(starter);x.jobs=x.jobs||[];x.exams=x.exams||[];x.todos=x.todos||[];return x}catch{return structuredClone(starter)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));render()}

function openResumeDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(RESUME_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(RESUME_STORE))r.result.createObjectStore(RESUME_STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function resumeAll(){const db=await openResumeDB();return new Promise((resolve,reject)=>{const tx=db.transaction(RESUME_STORE,'readonly');const req=tx.objectStore(RESUME_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}
async function resumePut(item){const db=await openResumeDB();return new Promise((resolve,reject)=>{const tx=db.transaction(RESUME_STORE,'readwrite');tx.objectStore(RESUME_STORE).put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function resumeGet(id){const db=await openResumeDB();return new Promise((resolve,reject)=>{const tx=db.transaction(RESUME_STORE,'readonly');const req=tx.objectStore(RESUME_STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function resumeDelete(id){const db=await openResumeDB();return new Promise((resolve,reject)=>{const tx=db.transaction(RESUME_STORE,'readwrite');tx.objectStore(RESUME_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function refreshResumes(){resumes=await resumeAll();resumes.sort((a,b)=>b.addedAt-a.addedAt);renderResumes();fillResumeSelect()}

function render(){renderHeader();renderMetrics();renderJobs();renderExams();renderResumes();fillResumeSelect()}
function renderHeader(){today.textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date())}
function renderMetrics(){const active=data.jobs.filter(j=>['제출','서류합','면접'].includes(j.status)).length;const deadlines=data.jobs.filter(j=>j.deadline&&daysUntil(j.deadline)>=0&&!['최종합','종료'].includes(j.status)).sort((a,b)=>a.deadline.localeCompare(b.deadline));const exams=data.exams.filter(e=>e.date&&daysUntil(e.date)>=0).sort((a,b)=>a.date.localeCompare(b.date));mActive.textContent=active;mDeadline.textContent=deadlines[0]?`D-${daysUntil(deadlines[0].deadline)}`:'—';mDeadlineSub.textContent=deadlines[0]?`${deadlines[0].company} · ${fmt(deadlines[0].deadline)}`:'등록된 마감 없음';mExam.textContent=exams[0]?`D-${daysUntil(exams[0].date)}`:'—';mExamSub.textContent=exams[0]?`${exams[0].name} · ${fmt(exams[0].date)}`:'등록된 시험 없음'}
function priorityTag(p){return `<span class="tag ${(p||'B').toLowerCase()}">${esc(p||'B')}</span>`}
function statusTag(s){const cls=s==='최종합'?'good':s==='종료'?'bad':['서류합','면접'].includes(s)?'warn':'';return `<span class="tag ${cls}">${esc(s||'관심')}</span>`}
function resumeName(id){return resumes.find(r=>r.id===id)?.name||''}
function renderJobs(){const q=jobSearch.value.trim().toLowerCase(),sf=jobStatusFilter.value,tf=jobTrackFilter.value;const rows=data.jobs.filter(j=>!q||`${j.company} ${j.role}`.toLowerCase().includes(q)).filter(j=>sf==='all'||j.status===sf).filter(j=>tf==='all'||j.track===tf).sort((a,b)=>({A:0,B:1,C:2}[a.priority]??9)-({A:0,B:1,C:2}[b.priority]??9)||(a.deadline||'9999').localeCompare(b.deadline||'9999'));if(!rows.length){jobBody.innerHTML='<tr><td colspan="8"><div class="empty">지원할 공고를 추가하면 여기서 관리할 수 있음.</div></td></tr>';return}jobBody.innerHTML=rows.map(j=>{const d=j.deadline?daysUntil(j.deadline):null;const deadline=j.deadline?`${fmt(j.deadline)} <span class="muted tiny">${d>=0?`D-${d}`:'마감'}</span>`:'—';const title=j.url?`<a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.company)}</a>`:esc(j.company);const rn=resumeName(j.resumeId);return `<tr><td><div class="company">${title}</div><div class="role">${esc(j.role)}</div></td><td>${esc(j.track||'—')}</td><td>${esc(j.salary||'—')}</td><td>${deadline}</td><td>${priorityTag(j.priority)}</td><td>${statusTag(j.status)}</td><td>${rn?`<button class="btn ghost tiny" data-open-resume="${esc(j.resumeId)}">${esc(rn)}</button>`:'—'}</td><td><button class="btn ghost tiny" data-edit-job="${esc(j.id)}">수정</button></td></tr>`}).join('')}
function renderExams(){const list=[...data.exams].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));if(!list.length){examList.innerHTML='<div class="empty">시험 없음.</div>';return}examList.innerHTML=list.map(e=>{const d=e.date?daysUntil(e.date):null;const dtext=d===0?'D-DAY':d>0?`D-${d}`:d!==null?'DONE':'—';return `<div class="exam-row exam-schedule-row"><div class="exam-row-head"><div><div class="exam-name">${esc(e.name)}</div>${e.goal?`<div class="muted tiny">목표 ${esc(e.goal)}</div>`:''}</div><div class="dday">${dtext}</div></div><div class="exam-dates"><div class="exam-date-block"><span class="exam-date-label">접수</span><strong>${fmt(e.registrationDate)}</strong>${e.fee?`<span class="tiny muted">${esc(e.fee)}</span>`:''}</div><div class="exam-date-block"><span class="exam-date-label">시험</span><strong>${fmt(e.date)}</strong></div><div class="exam-date-block"><span class="exam-date-label">결과</span><strong>${fmt(e.resultDate)}</strong></div></div><div class="exam-row-foot">${e.notes?`<span class="muted tiny">${esc(e.notes)}</span>`:'<span></span>'}<button class="btn ghost tiny" data-edit-exam="${esc(e.id)}">수정</button></div></div>`}).join('')}
function renderResumes(){if(!resumes.length){resumeList.innerHTML='<div class="empty">이력서 파일을 넣으면 지원 항목과 연결할 수 있음.</div>';return}resumeList.innerHTML=resumes.map(r=>`<div class="resume-row"><div class="resume-top"><div><div class="resume-name">${esc(r.name)}</div><div class="muted tiny">${(r.size/1024/1024).toFixed(2)} MB · ${new Date(r.addedAt).toLocaleDateString('ko-KR')}</div></div></div><div class="resume-actions"><button class="btn ghost tiny" data-open-resume="${esc(r.id)}">열기</button><button class="btn ghost tiny" data-download-resume="${esc(r.id)}">다운로드</button><button class="btn danger ghost tiny" data-delete-resume="${esc(r.id)}">삭제</button></div></div>`).join('')}
function fillResumeSelect(){const current=jobResumeSelect.value;jobResumeSelect.innerHTML='<option value="">연결 안 함</option>'+resumes.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');if([...jobResumeSelect.options].some(o=>o.value===current))jobResumeSelect.value=current}
function fillForm(form,obj){form.reset();Object.entries(obj||{}).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??''})}

addJobBtn.addEventListener('click',()=>{fillForm(jobForm,{id:'',priority:'B',status:'관심'});fillResumeSelect();jobDialog.showModal()});
addExamBtn.addEventListener('click',()=>{fillForm(examForm,{id:''});examDialog.showModal()});
document.querySelectorAll('[data-open-vault]').forEach(b=>b.addEventListener('click',()=>resumeDialog.showModal()));

document.addEventListener('click',e=>{const b=e.target.closest('[data-close-dialog]');if(!b)return;e.preventDefault();e.stopPropagation();const d=document.getElementById(b.dataset.closeDialog);if(d?.open)d.close()});
[jobDialog,examDialog,resumeDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));

jobForm.addEventListener('submit',e=>{e.preventDefault();if(!jobForm.reportValidity())return;const f=Object.fromEntries(new FormData(jobForm));if(f.id)Object.assign(data.jobs.find(x=>x.id===f.id),f);else data.jobs.push({...f,id:uid()});jobDialog.close();save()});
examForm.addEventListener('submit',e=>{e.preventDefault();if(!examForm.reportValidity())return;const f=Object.fromEntries(new FormData(examForm));if(f.id)Object.assign(data.exams.find(x=>x.id===f.id),f);else data.exams.push({...f,id:uid()});examDialog.close();save()});

document.body.addEventListener('click',async e=>{const jb=e.target.closest('[data-edit-job]');if(jb){const x=data.jobs.find(v=>v.id===jb.dataset.editJob);fillForm(jobForm,x);fillResumeSelect();jobForm.elements.resumeId.value=x.resumeId||'';jobDialog.showModal();return}const eb=e.target.closest('[data-edit-exam]');if(eb){fillForm(examForm,data.exams.find(v=>v.id===eb.dataset.editExam));examDialog.showModal();return}const open=e.target.closest('[data-open-resume]');if(open){const r=await resumeGet(open.dataset.openResume);if(r)openBlob(r);return}const dl=e.target.closest('[data-download-resume]');if(dl){const r=await resumeGet(dl.dataset.downloadResume);if(r)downloadBlob(r);return}const del=e.target.closest('[data-delete-resume]');if(del){if(confirm('이 이력서를 브라우저 저장소에서 삭제할까?')){await resumeDelete(del.dataset.deleteResume);data.jobs.forEach(j=>{if(j.resumeId===del.dataset.deleteResume)j.resumeId=''});save();await refreshResumes()}return}});
document.body.addEventListener('dblclick',e=>{for(const [attr,key] of [['data-edit-job','jobs'],['data-edit-exam','exams']]){const b=e.target.closest(`[${attr}]`);if(!b)continue;if(confirm('이 항목을 삭제할까?')){data[key]=data[key].filter(x=>x.id!==b.getAttribute(attr));save()}}});
['jobSearch','jobStatusFilter','jobTrackFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='jobSearch'?'input':'change',renderJobs));

resumeInput.onchange=async e=>{for(const file of [...e.target.files]){await resumePut({id:uid(),name:file.name,type:file.type,size:file.size,addedAt:Date.now(),blob:file})}e.target.value='';await refreshResumes()};
function openBlob(r){const u=URL.createObjectURL(r.blob);window.open(u,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(u),60000)}
function downloadBlob(r){const u=URL.createObjectURL(r.blob);const a=document.createElement('a');a.href=u;a.download=r.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
searchSaraminBtn.onclick=()=>window.open(`https://www.saramin.co.kr/zf_user/search?searchword=${encodeURIComponent(siteKeyword.value.trim())}`,'_blank','noopener');
searchJobkoreaBtn.onclick=()=>window.open(`https://www.jobkorea.co.kr/Search/?stext=${encodeURIComponent(siteKeyword.value.trim())}`,'_blank','noopener');
siteKeyword.addEventListener('keydown',e=>{if(e.key==='Enter')searchSaraminBtn.click()});

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`job-dashboard-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)};
importInput.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed.jobs||!parsed.exams)throw new Error();parsed.todos=parsed.todos||[];data=parsed;save()}catch{alert('이 대시보드에서 내보낸 JSON 파일이 아닌 것 같아.')}e.target.value=''};
resetBtn.onclick=()=>{if(confirm('지원/시험 데이터를 초기화할까? 이력서 파일은 남아 있어.')){data=structuredClone(starter);save()}};

(async()=>{render();try{await refreshResumes()}catch(err){console.error(err);resumeList.innerHTML='<div class="empty">이 브라우저에서 이력서 저장소를 열 수 없음.</div>'}})();