const STORAGE='myQuizV3';
const HANDLE_KEY='questionBankDirectoryHandle';
const SAMPLE=[
 {question:'What year was the Leica I introduced?',a:'1918',b:'1925',c:'1930',d:'1935',correct:'B'},
 {question:'Who wrote 1984?',a:'Orwell',b:'Huxley',c:'Bradbury',d:'Atwood',correct:'A'},
 {question:'What is the capital of Japan?',a:'Kyoto',b:'Osaka',c:'Tokyo',d:'Nagoya',correct:'C'}
];
let bank=load();
let source='local';
let state={screen:'home',set:null,count:10,standard:70,mode:'fixed',questions:[],i:0,score:0,answers:[],directoryName:'',review:null};

function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(x)&&x.length?x:sampleRows()}catch{return sampleRows()}}
function sampleRows(){return SAMPLE.map((q,i)=>({...q,set:'Sample_Set',id:'sample-'+i}))}
function save(){localStorage.setItem(STORAGE,JSON.stringify(bank))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function sets(){return [...new Set(bank.map(q=>q.set))].sort((a,b)=>a.localeCompare(b))}
function setQuestions(s){return bank.filter(q=>q.set===s)}
function countSet(s){return setQuestions(s).length}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function render(){document.querySelector('#app').innerHTML=`<div class="wrap">${view()}</div>`}
function view(){if(state.screen==='quiz')return quizView();if(state.screen==='result')return resultView();if(state.screen==='source')return sourceView();return homeView()}

function homeView(){
  const ss=sets();
  const max=state.set?countSet(state.set):1;
  if(state.set)state.count=Math.min(Math.max(1,state.count),max);

  return `<div class="topbar"><div class="brand">MY QUIZ</div><button class="iconbtn" onclick="state.screen='source';render()">Question Bank</button></div>

  <div class="card">
    <div class="row">
      <div>
        <h2>Choose a quiz</h2>
        <div class="muted">${bank.length} questions loaded${state.directoryName?` · ${esc(state.directoryName)}`:''}</div>
      </div>
    </div>

    ${ss.length?`<div class="grid" style="margin-top:16px">${ss.map(s=>`<button class="set ${state.set===s?'selected':''}" onclick='chooseSet(${JSON.stringify(s)})'>${esc(s)}<span class="muted">${countSet(s)} questions</span></button>`).join('')}</div>`:'<div class="notice">No quiz sets loaded yet.</div>'}
  </div>

  <div class="card">
    <h2>Quiz settings</h2>

    <div class="settings-row">
      <div class="row">
        <span>Questions</span>
        <b>${state.count}</b>
      </div>
      <input class="slider" type="range" min="1" max="${max}" value="${state.count}" oninput="state.count=Number(this.value);render()">
    </div>

    <div class="settings-row">
      <div class="row">
        <span>Mode</span>
        <b>${state.mode==='adaptive'?'Adaptive':'Standard / Hard'}</b>
      </div>
      <select class="select" onchange="state.mode=this.value;render()">
        <option value="fixed" ${state.mode==='fixed'?'selected':''}>Standard / Hard percentage</option>
        <option value="adaptive" ${state.mode==='adaptive'?'selected':''}>Adaptive difficulty</option>
      </select>
    </div>

    ${state.mode==='fixed'?`
    <div class="settings-row">
      <div class="row">
        <span class="ratio-label">Standard</span>
        <b>${state.standard}%</b>
      </div>
      <input class="slider" type="range" min="0" max="100" value="${state.standard}" oninput="state.standard=Number(this.value);render()">
      <div class="muted small">Hard: ${100-state.standard}%</div>
    </div>
    `:`
    <div class="notice small">
      <b>Adaptive difficulty:</b> Answer a Standard question correctly and it becomes Hard next time. A Hard question stays Hard when correct, but drops to Standard when you get it wrong.
    </div>
    `}

    <div class="notice small">Hard uses the same question but hides A-D. You type the answer instead.</div>

    <button type="button" class="btn" onclick="startQuiz()" ${state.set&&countSet(state.set)>0?'':'disabled'}>START QUIZ</button>
  </div>
  `
}
function chooseSet(s){state.set=String(s);const n=countSet(state.set);state.count=Math.max(1,Math.min(state.count||1,n));render()}

const PROGRESS_STORAGE='myQuizV4Progress';

function loadProgress(){
  try{
    return JSON.parse(localStorage.getItem(PROGRESS_STORAGE)||'{}');
  }catch(e){
    return {};
  }
}

function saveProgress(progress){
  localStorage.setItem(PROGRESS_STORAGE,JSON.stringify(progress));
}

function questionKey(q){
  return `${q.set}|${q.question}`;
}

async function startQuiz(){
  if(!state.set){
    alert('Please select a quiz set first.');
    return;
  }

  const pool=shuffle(setQuestions(state.set));
  if(!pool.length)return;

  const total=Math.min(state.count,pool.length);
  const selected=pool.slice(0,total);

  if(state.mode==='adaptive'){
    const progress=loadProgress();

    state.questions=selected.map(q=>({
      ...q,
      mode:progress[questionKey(q)]||'standard'
    }));
  }else{
    const hard=Math.round(total*(100-state.standard)/100);
    const hardIdx=new Set(shuffle([...Array(total).keys()]).slice(0,hard));

    state.questions=selected.map((q,i)=>({
      ...q,
      mode:hardIdx.has(i)?'hard':'standard'
    }));
  }

  state.i=0;
  state.score=0;
  state.answers=[];
  state.review=null;
  state.screen='quiz';
  render();
}
function quizView(){
 const q=state.questions[state.i];
 const pct=Math.round((state.i/state.questions.length)*100);
 return `<div class="topbar"><button class="iconbtn" onclick="state.screen='home';render()">Exit</button><span class="pill">${q.mode==='hard'?'HARD':'STANDARD'}</span></div>
 <div class="row"><span class="muted">Question ${state.i+1} of ${state.questions.length}</span><span class="muted">${state.score} correct</span></div>
 <div class="progress"><div style="width:${pct}%"></div></div>
 <div class="card">
   <div class="question">${esc(q.question)}</div>
   ${state.review ? reviewView(q) : (q.mode==='standard'?standardQuestion(q):hardQuestion(q))}
 </div>`
}
function standardQuestion(q){return `<div class="grid">${['A','B','C','D'].map(k=>`<button type="button" class="option" data-action="answer" data-answer="${k}"><span class="letter">${k}</span><span>${esc(q[k.toLowerCase()])}</span></button>`).join('')}</div>`}
function hardQuestion(q){return `<div class="hard-note"><b>Hard mode</b><br><span class="small">The choices are hidden. Enter the answer you think is correct.</span></div><input id="typed" class="answer-input" autocomplete="off" autocapitalize="sentences" placeholder="Type your answer"><button type="button" class="btn" data-action="submitTyped">SUBMIT ANSWER</button>`}
function submitTyped(){const el=document.querySelector('#typed');if(el&&el.value.trim())answer(el.value)}
function normal(s){return String(s??'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").replace(/[.,!?;:()[\]{}"]+/g,'').replace(/\s+/g,' ')}
function answer(val){
  if(state.review)return;

  const q=state.questions[state.i];
  const correctText=q[q.correct.toLowerCase()];

  const ok=q.mode==='standard'
    ? String(val).toUpperCase()===q.correct
    : normal(val)===normal(correctText);

  if(ok)state.score++;

  if(state.mode==='adaptive'){
    const progress=loadProgress();
    const key=questionKey(q);

    if(q.mode==='standard' && ok){
      progress[key]='hard';
    }else if(q.mode==='hard' && !ok){
      progress[key]='standard';
    }else{
      progress[key]=q.mode;
    }

    saveProgress(progress);
  }

  state.answers.push({q,ok,given:val});
  state.review={ok,given:val};
  render();
}
function reviewView(q){
 const r=state.review;
 const correctText=q[q.correct.toLowerCase()];
 if(q.mode==='standard') return `<div class="grid">${['A','B','C','D'].map(k=>{const cls=k===q.correct?'option correct-option':(k===String(r.given).toUpperCase()&&!r.ok?'option wrong-option':'option answer-disabled');return `<button type="button" class="${cls}" disabled><span class="letter">${k}</span><span>${esc(q[k.toLowerCase()])}</span>${k===q.correct?'<span class="answer-mark">✓</span>':''}</button>`}).join('')}</div>${feedbackBox(r.ok,correctText)}<button type="button" class="btn" data-action="nextQuestion">${state.i===state.questions.length-1?'SEE RESULTS':'NEXT QUESTION'}</button>`;
 return `<div class="feedback-answer"><div class="muted small">Correct answer</div><div class="correct-answer">${esc(correctText)}</div></div>${feedbackBox(r.ok,correctText)}<button type="button" class="btn" data-action="nextQuestion">${state.i===state.questions.length-1?'SEE RESULTS':'NEXT QUESTION'}</button>`;
}
function feedbackBox(ok,correctText){return `<div class="feedback ${ok?'feedback-correct':'feedback-incorrect'}"><strong>${ok?'Correct!':'Not quite.'}</strong><div>${ok?'Your answer was correct.':'The correct answer is '} ${ok?'':`<b>${esc(correctText)}</b>`}</div></div>`}
function nextQuestion(){state.review=null;state.i++;if(state.i>=state.questions.length)state.screen='result';render()}
function resultView(){
 const total=state.questions.length,p=Math.round(state.score/total*100);
 const cls=p>=80?'good':p>=50?'mid':'low';
 return `<div class="topbar"><div class="brand">RESULTS</div></div>
 <div class="card result ${cls}"><div class="big">${p}%</div><h2>${state.score} / ${total} correct</h2><div class="muted">${esc(state.set)} · Standard ${state.standard}% / Hard ${100-state.standard}%</div><button class="btn" onclick="state.screen='home';render()">BACK TO QUIZZES</button></div>
 <div class="card"><h3>Review</h3>${state.answers.map(a=>`<div class="review"><div class="row"><span>${esc(a.q.question)}</span><span class="${a.ok?'correct':'incorrect'}">${a.ok?'✓':'✕'}</span></div>${a.ok?'':`<div class="muted small" style="margin-top:6px">Correct answer: <b>${esc(a.q[a.q.correct.toLowerCase()])}</b>${a.q.mode==='hard'&&a.given?` · Your answer: ${esc(a.given)}`:''}</div>`}</div>`).join('')}</div>`
}

function sourceView(){
  const supported='showDirectoryPicker' in window;
  return `<div class="topbar"><div class="brand">QUESTION BANK</div><button class="iconbtn" onclick="state.screen='home';render()">Back</button></div>
  <div class="card">
    <h2>Connect your Question-Bank</h2>
    <p class="muted">Choose how you want to load your quiz sets.</p>

    <button class="btn" onclick="loadGitHubBank()">LOAD GITHUB QUESTION BANK</button>

    ${supported ? `<button class="btn secondary" onclick="connectFolder()">SELECT QUESTION-BANK FOLDER</button>` : ''}

    <button class="btn secondary" onclick="importFiles()">IMPORT CSV FILES MANUALLY</button>
    <input id="manualFiles" class="hidden" type="file" accept=".csv,text/csv" multiple onchange="importSelectedFiles()">

    <div class="notice small">
      <b>Phone:</b> use LOAD GITHUB QUESTION BANK.<br>
      <b>Desktop:</b> you can also select your local Question-Bank folder.
    </div>
  </div>

  <div class="card"><h3>Current quiz sets</h3>${sets().map(s=>`<div class="row review"><span><b>${esc(s)}</b></span><span class="pill">${countSet(s)} questions</span></div>`).join('')}</div>
  <div class="footer-note">Your GitHub question bank is built into the app and can be used from your phone.</div>`
}
async function loadGitHubBank(){
  try{
    const names=[
      'Horror Movie Release Dates.csv',
      'Slasher trivia.csv',
      'Horror Movie Deep Cuts.csv',
      'Horror Movie Cult clasics.csv',
      '80s Horror Movies.csv',
      '90s Horror Movies.csv',
      '2000s Horror Movies.csv',
      '2010s Horror Movies.csv',
      '2020s Horror Movies.csv',
      'Horror Franchises.csv',
      'Super Hard Horror Trivia.csv',
      'Scary Toys.csv',
      'Reader Digest.csv',
      'Random Mix.csv',
      'Tag Lines.csv'
    ];

    const files=[];

    for(const name of names){
      const url=`Question-Bank/${encodeURIComponent(name)}`;
      const response=await fetch(url);

      if(!response.ok) throw new Error(`Could not load ${name}`);

      const text=await response.text();
      files.push(new File([text],name,{type:'text/csv'}));
    }

    await importFileObjects(files,false);
    source='github';
    state.screen='home';
    render();

    alert(`Loaded ${files.length} quiz sets from GitHub.`);
  }catch(e){
    console.error(e);
    alert('Could not load the GitHub Question Bank. Please check your internet connection and try again.');
  }
}

async function connectFolder(){
 try{
   const dir=await window.showDirectoryPicker({mode:'read'});
   const perm=await dir.requestPermission({mode:'read'}); if(perm!=='granted')return alert('Folder access was not granted.');
   state.directoryName=dir.name;source='folder';
   try{localStorage.setItem(HANDLE_KEY,'connected')}catch{}
   await scanDirectory(dir);
 }catch(e){if(e&&e.name!=='AbortError')alert('Could not open the folder.');}
}
async function scanDirectory(dir){
 const files=[];
 for await(const entry of dir.values()){
   if(entry.kind==='file'&&entry.name.toLowerCase().endsWith('.csv'))files.push(await entry.getFile());
 }
 if(!files.length){alert('No CSV files were found in this folder.');return}
 await importFileObjects(files,false);
 state.screen='home';render();
}
function importFiles(){document.querySelector('#manualFiles').click()}
async function importSelectedFiles(){const files=[...document.querySelector('#manualFiles').files];await importFileObjects(files,true)}
async function importFileObjects(files,notify=true){
 let added=0;const names=[];
 for(const file of files){
   const rows=parseCSV(await file.text());
   const set=file.name.replace(/\.[^.]+$/,'');
   const valid=[];
   rows.forEach((r,i)=>{
     const question=r.Question??r.question??'';const a=r.A??r.a??'';const b=r.B??r.b??'';const c=r.C??r.c??'';const d=r.D??r.d??'';const correct=String(r.Correct??r.correct??'').trim().toUpperCase();
     if(question.trim()&&a.trim()&&b.trim()&&c.trim()&&d.trim()&&['A','B','C','D'].includes(correct))valid.push({id:`${set}-${i}-${Date.now()}`,set,question:question.trim(),a:a.trim(),b:b.trim(),c:c.trim(),d:d.trim(),correct});
   });
   if(valid.length){bank=bank.filter(q=>q.set!==set);bank.push(...valid);added+=valid.length;names.push(`${set} (${valid.length})`)}
 }
 save();
 if(notify) {alert(added?`Loaded ${added} questions:\n${names.join('\n')}`:'No valid questions found. Expected columns: Question, A, B, C, D, Correct.');state.screen='home';render()}
}
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()!==''))rows.push(row);row=[];cell=''}else cell+=ch}
 row.push(cell);if(row.some(x=>x.trim()!==''))rows.push(row);
 if(!rows.length)return[];const headers=rows[0].map(x=>x.trim());return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}

// Use delegated events so quiz answer buttons work reliably when the view is re-rendered.
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'answer') answer(el.dataset.answer);
  else if (action === 'submitTyped') submitTyped();
  else if (action === 'nextQuestion') nextQuestion();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.id === 'typed') submitTyped();
});
render();
