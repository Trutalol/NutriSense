const $=s=>document.querySelector(s);

// Line icons (24×24, stroked) used in place of emoji. Static markup uses <i data-icon="name">.
const ICONS={
  pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9"/>',
  hospital:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M12 8v6M9 11h6M10 21v-3h4v3"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  triangle:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sort:'<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  clipboard:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  sparkle:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  bulb:'<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  layers:'<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  wind:'<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  thermometer:'<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/>',
  droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
  mind:'<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15s1.3 1.5 3.5 1.5 3.5-1.5 3.5-1.5"/>',
  cells:'<circle cx="8" cy="9" r="4"/><circle cx="16.5" cy="15.5" r="4"/><circle cx="17" cy="5.5" r="2"/>',
  flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10"/>',
  scale:'<path d="M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0zM12 3v18M8 21h8"/>',
  utensils:'<path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>'
};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||''}</svg>`;
document.querySelectorAll('i[data-icon]').forEach(el=>{el.outerHTML=icon(el.dataset.icon);});
const rawPatients=[]; // compact rows for every resident, as stored (from /api/patients)
const patients=[]; // the same rows with the risk shown in the chosen mode (see scoreView)
// Risk score mode: 'all' = daily care-log signs + screening model (the stored score); 'ai' = the AI model's prediction alone.
let riskMode=(()=>{try{return localStorage.getItem('nutrisense-risk-mode')==='ai'?'ai':'all';}catch{return 'all';}})();
const capFirst=t=>t?t[0].toUpperCase()+t.slice(1):t;
// In AI mode a resident's risk is the model's predicted chance of malnutrition (0–100%); 70%+ is high, 60%+ is watch.
function scoreView(row){
  if(riskMode!=='ai')return row;
  const m=row.model_risk??null,f=Array.isArray(row.model_factors)?row.model_factors:[];
  return {...row,risk:m,risk_prev:m,combined_risk:row.risk,
    top_reason:m===null?null:m>=60?(f.length?capFirst(f[0]):'Elevated predicted risk'):'Low predicted risk',reason_count:m!==null&&m>=60?f.length:0};
}
let selected=null,selectedId=null,filter='all',wingFilter='all',descending=true;
let detailCache={id:null,data:null}; // full record for the selected resident (from /api/resident)
const tier=p=>p.risk===null||p.risk===undefined?'unscored':p.risk>=70?'high':p.risk>=(riskMode==='ai'?60:30)?'medium':'stable';
const label=p=>({high:'High malnutrition risk',medium:'Nutrition watch',stable:'Stable',unscored:'Not scored'})[tier(p)];
const shortLabel=p=>({high:'High risk',medium:'Watch',stable:'Stable',unscored:'No log'})[tier(p)];
// "Resident 100013" shows as "13"; other names use their initials.
const initials=p=>{const m=/^Resident (\d+)$/.exec(p.name);return m?m[1].slice(-2):p.name.split(' ').map(n=>n[0]).join('');};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fmt=(v,d=0)=>v===null||v===undefined?'—':Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
const drivers=p=>p.details?.drivers||[];
const summary=p=>p.details?.summary||{};
const profile=p=>p.details?.profile||{};
const mealAvg=r=>{const m=[r.breakfast_pct,r.lunch_pct,r.dinner_pct].filter(v=>v!==null&&v!==undefined);return m.length?m.reduce((a,b)=>a+b,0)/m.length:null;};

// Wing and room come from the resident's bed field, e.g. "Maple 214".
function residentLocation(p){
  const m=/^(\w+) (\d+)$/.exec(p.bed||'');
  if(m)return {wing:`${m[1]} Wing`,room:`Room ${m[2]}`,full:`${m[1]} Wing · Room ${m[2]}`};
  const digits=String(p.id).match(/\d+$/);
  return {wing:'Residence Wing',room:`Room ${digits?Number(digits[0]):p.id}`,full:'Residence Wing'};
}

// What the care team should do for each reason the score flags.
const CARE_STEPS={
  intake:['Meals','Offer preferred foods, smaller and more frequent meals, and snacks between meals. Start a 3-day food chart.'],
  decline:['Appetite change','Ask about pain, mood, mouth problems or new medications that could explain eating less than usual.'],
  weight:['Weight','Weigh twice a week and refer to the dietitian.'],
  bmi:['Low body weight','Dietitian review for oral nutritional supplements or fortified foods.'],
  fluids:['Hydration','Hydration rounds: offer a drink every hour while awake and record intake.'],
  missed:['Missed meals','Find out why meals were refused and let the nurse know the same day.'],
  chewing:['Chewing / swallowing','Check mouth and dentures; request a speech-language pathology swallow assessment.'],
  model:['Screening risk','Dietitian to complete a full nutrition assessment (e.g. MNA) to confirm the screening model\'s flag.']
};

// ---------- Nutrition history (daily logs + daily scores) for the selected resident ----------
let nutrition={patientId:null,rows:undefined},nutritionRequest=0;
async function loadNutrition(){
  const p=selected;
  if(!p)return;
  const request=++nutritionRequest;
  let rows;
  try{rows=(await api('/api/nutrition-history?patient='+encodeURIComponent(p.id))).rows;}catch{rows=null;}
  if(request!==nutritionRequest||selected?.id!==p.id)return;
  if(rows===null&&nutrition.patientId===p.id&&nutrition.rows)return; // keep the last good data on a polling hiccup
  nutrition={patientId:p.id,rows};
  renderNutrition();
}
const nutritionRows=()=>nutrition.patientId===selected?.id&&Array.isArray(nutrition.rows)?nutrition.rows:[];

// ---------- Resident list: grouped by urgency, compact rows, built for hundreds of residents ----------
// High-risk residents whose alert has been signed off move out of "Needs review" into "Signed off".
const isSignedOff=p=>tier(p)==='high'&&p.alert_status==='acknowledged';
const listKey=p=>isSignedOff(p)?'signed':tier(p);
const LIST_GROUPS=[['high','Critical Warning'],['signed','Signed off'],['medium','Watch'],['stable','Stable'],['unscored','No care log yet']];
const openListGroups=new Set(['high','medium']); // quiet groups start collapsed
const TIER_RANK={unscored:0,stable:1,medium:2,high:3};
const tierOf=risk=>tier({risk});
// "New" = risk moved up a tier since the previous day's score.
const isRising=p=>p.risk!==null&&p.risk_prev!==null&&p.risk_prev!==undefined&&TIER_RANK[tierOf(p.risk)]>TIER_RANK[tierOf(p.risk_prev)];
let lastListSignature='';

function visibleResidents(){
  const query=$('#search').value.trim().toLowerCase();
  return patients.filter(p=>{
    const t=tier(p);
    if(filter==='high'&&!['high','medium'].includes(t))return false;
    if(filter==='stable'&&t!=='stable')return false;
    if(wingFilter!=='all'&&!(p.bed||'').startsWith(wingFilter+' '))return false;
    return !query||`${p.name} ${p.id} ${p.bed} ${p.top_reason||''}`.toLowerCase().includes(query);
  });
}

function renderList(){
  const query=$('#search').value.trim();
  const shown=visibleResidents();
  const byRisk=(a,b)=>descending?(b.risk??-1)-(a.risk??-1)||(b.risk_prev??-1)-(a.risk_prev??-1):(a.risk??-1)-(b.risk??-1);
  // Only rebuild the list when something visible changed, so scrolling and hover are not reset every refresh.
  const signature=JSON.stringify([selectedId,filter,wingFilter,query,descending,[...openListGroups],shown.map(p=>[p.id,p.risk,p.risk_prev,p.top_reason,p.bed])]);
  updateFilterCounts();
  if(signature===lastListSignature)return;
  lastListSignature=signature;
  if(!patients.length){$('#patient-list').innerHTML='<div class="empty">No residents yet. Run the nutrition replay to load residents.</div>';return;}
  const html=LIST_GROUPS.map(([key,title])=>{
    const rows=shown.filter(p=>listKey(p)===key).sort(byRisk);
    // The four main groups always show, even when empty, so staff can see at a glance that nothing is waiting.
    if(!rows.length&&key==='unscored')return '';
    // A search or a matching filter opens every group that has results.
    const open=openListGroups.has(key)||!!query||(filter==='stable'&&key==='stable');
    const rising=rows.filter(isRising).length;
    return `<div class="list-group ${key} ${open?'open':''}">
      <button type="button" class="list-group-head" data-list-group="${key}" aria-expanded="${open}">
        <span><i class="psv-caret" aria-hidden="true">▸</i>${title}</span>
        <small>${rising?`<b>${rising} new</b> · `:''}${rows.length}</small>
      </button>
      ${open&&!rows.length?`<div class="list-group-empty">${query?'No matching residents':'None right now'}</div>`:''}
      ${open?rows.map(p=>{
        const t=tier(p),loc=residentLocation(p);
        const signed=isSignedOff(p);
        const reason=t==='unscored'?'No care log yet':t==='stable'?(p.top_reason||'Eating well'):(p.top_reason||'Review');
        return `<button type="button" class="res-row ${signed?'signed':''} ${selectedId===p.id?'selected':''}" data-id="${esc(p.id)}" aria-pressed="${selectedId===p.id}">
          <span class="res-score ${signed?'signed':t}">${signed?icon('check'):(p.risk??'—')}</span>
          <span class="res-main"><strong>${esc(p.name)}</strong><small title="${esc(loc.full)}">${esc(p.bed||'')}</small></span>
          <span class="res-reason">${signed?`<b class="res-signed">Signed off</b> · ${p.risk} · `:''}${isRising(p)&&!signed?'<b class="res-new">↑ New</b> ':''}${esc(reason)}${p.reason_count>1&&t!=='stable'?` <em>+${p.reason_count-1}</em>`:''}</span>
        </button>`;
      }).join(''):''}
    </div>`;
  }).join('');
  $('#patient-list').innerHTML=html||'<div class="empty">No matching residents</div>';
}

function updateFilterCounts(){
  const warn=patients.filter(p=>['high','medium'].includes(tier(p))).length,ok=patients.filter(p=>tier(p)==='stable').length;
  const set=(f,text)=>{const b=document.querySelector(`[data-filter="${f}"]`);if(b&&b.textContent!==text)b.textContent=text;};
  set('all',`All (${patients.length})`);set('high',`Warning (${warn})`);set('stable',`Stable (${ok})`);
  const select=$('#wing-filter'),wings=[...new Set(patients.map(p=>/^(\w+) \d+$/.exec(p.bed||'')?.[1]).filter(Boolean))].sort();
  const options='<option value="all">All wings</option>'+wings.map(w=>`<option value="${esc(w)}">${esc(w)} Wing (${patients.filter(p=>(p.bed||'').startsWith(w+' ')).length})</option>`).join('');
  if(select&&select.dataset.options!==options){select.innerHTML=options;select.dataset.options=options;select.value=wings.includes(wingFilter)?wingFilter:'all';}
}

// Selecting a resident shows their row immediately and loads the full record (screening, reasons) in the background.
function selectResident(id){
  if(!id)return;
  selectedId=id;
  mergeSelected();
  render();
  loadDetail(id);
}
function mergeSelected(){
  const base=rawPatients.find(p=>p.id===selectedId);
  selected=base?{...scoreView({...base,...(detailCache.id===base.id?detailCache.data:{})}),loaded:detailCache.id===base.id}:null;
}
let detailRequest=0;
async function loadDetail(id){
  const request=++detailRequest;
  try{
    const data=await api('/api/resident?id='+encodeURIComponent(id));
    if(request!==detailRequest||selectedId!==id)return;
    detailCache={id,data};
    mergeSelected();
    render();
  }catch{/* keep showing the last good record; the next refresh retries */}
}

function render(){
  $('#sidebar-patient-count').textContent=patients.length;
  renderList();
  $('.patient-detail').hidden=!selected;
  $('#export').disabled=!selected;
  renderSummaryCards();
  if(!selected)return;
  const p=selected,loc=residentLocation(p);
  $('#initials').innerHTML=icon('user');
  $('#patient-name').textContent=p.name;
  $('#patient-meta').innerHTML=`ID: RES-${esc(p.id)} <span>·</span> ${loc.wing} <span>·</span> ${loc.room}`;
  const signed=isSignedOff(p);
  for(const id of ['patient-badge','chart-badge']){
    $('#'+id).className=`badge ${signed?'signed':tier(p)}`;
    $('#'+id).textContent=signed?(id==='patient-badge'?'✓ Signed off':'High risk · signed off'):(id==='patient-badge'?'● ':'')+label(p);
  }

  if(!p.loaded){
    $('#psv-context').innerHTML='<p class="psv-empty">Loading resident…</p>';
    $('#screening').innerHTML='';
    $('#explanation').textContent='Loading…';
  }else renderResidentInfo(p);

  // Score, screening measures and the explanation all come from the stored NutriSense score.
  $('#risk-number').textContent=p.risk??'—';
  $('#risk-unit').textContent=riskMode==='ai'?'%':'/100';
  $('#risk-change').textContent=p.risk===null?'No nutrition log for this resident':signed?`Reviewed and signed off${p.signed_off_at?' '+new Date(p.signed_off_at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):''} · keep monitoring`:riskMode==='ai'?(tier(p)==='high'?'AI predicts high risk · review with the nurse today':tier(p)==='medium'?'AI predicts elevated risk · monitor closely':'AI predicts low risk')
    :tier(p)==='high'?'High risk · review with the nurse today':tier(p)==='medium'?'Early changes · monitor closely':'Eating, drinking and weight on track';
  if(p.loaded){renderScreening(p);renderExplanation(p);}

  if(nutrition.patientId!==p.id){nutrition={patientId:p.id,rows:undefined};loadNutrition();}
  renderNutrition();

  $('#review').disabled=!p.prediction_id;
  $('#blink-btn').disabled=!p.prediction_id;
  // The sign-off button shows that this resident's review is done (it can still be opened to sign again).
  const signLabel=signed?`${icon('check')} &nbsp; Signed off`:`${icon('check')} &nbsp; Sign off`;
  if($('#blink-btn').innerHTML!==signLabel)$('#blink-btn').innerHTML=signLabel;
  $('#blink-btn').classList.toggle('done',signed);
  $('#sbar-btn').disabled=p.risk===null;
}

// Screening profile shown under "Resident information": 37 fields in five groups (synthesized in the same
// NHANES-style shape as the real survey, so a real file can replace it). Values that matter clinically are highlighted.
const SCREENING_GROUPS=[
  ['Demographics',[['age','Age'],['sex','Sex'],['race','Race/ethnicity'],['education','Education'],['marital','Marital status'],['income_ratio','Income ratio'],['exam_status','Exam status']]],
  ['Body measures',[['weight_kg','Weight (kg)'],['bmi','BMI'],['height_cm','Height (cm)'],['arm_cm','Arm circ. (cm)'],['waist_cm','Waist (cm)'],['hip_cm','Hip (cm)']]],
  ['Diet (24-h recall)',[['recall_status','Recall status'],['kcal','Calories (kcal)'],['protein_g','Protein (g)'],['carbs_g','Carbs (g)'],['fat_g','Fat (g)'],['fiber_g','Fiber (g)'],['vit_d_ug','Vitamin D (µg)'],['b12_ug','Vitamin B12 (µg)'],['calcium_mg','Calcium (mg)'],['moisture_g','Water from diet (g)']]],
  ['Vitals at screening',[['sbp1','Systolic BP 1'],['dbp1','Diastolic BP 1'],['sbp2','Systolic BP 2'],['dbp2','Diastolic BP 2'],['sbp3','Systolic BP 3'],['dbp3','Diastolic BP 3'],['pulse','Pulse']]],
  ['Balance & falls',[['balance_test1','Balance test 1'],['balance_time_s','Balance time (s)'],['stands_unaided','Stands unaided'],['dizzy_24h','Dizzy (24 h)'],['dizzy_fall_12m','Dizzy fall (12 mo)']]]
];
// Returns a short reason when a screening value is a concern, otherwise null.
function screeningConcern(key,v,sc){
  if(v===null||v===undefined)return null;
  switch(key){
    case 'bmi':return v<21?'Low for an older adult':null;
    case 'arm_cm':return v<22?'Under 22 cm suggests malnutrition':null;
    case 'kcal':return v<1200?'Very low energy intake':null;
    case 'protein_g':return sc.weight_kg&&v<sc.weight_kg?'Below 1 g per kg body weight':null;
    case 'sbp1':case 'sbp2':case 'sbp3':return v<100?'Low':v>=160?'High':null;
    case 'balance_test1':return v==='Fail'?'Failed balance test':null;
    case 'stands_unaided':return v==='No'?'Needs help to stand':null;
    case 'dizzy_24h':case 'dizzy_fall_12m':return v==='Yes'?'Fall risk':null;
    default:return null;
  }
}
// Groups start collapsed; ones the user opens stay open across the 3-second refreshes.
const openInfoGroups=new Set();
function renderResidentInfo(p){
  const sc=p.screening||{},prof=profile(p);
  const value=key=>{
    if(key==='age')return sc.age!==undefined?(sc.age_top_coded?'80+':sc.age):(p.age??null);
    if(key==='sex')return sc.sex??(p.sex&&p.sex!=='Unknown'?p.sex:null);
    // NHANES residents show only what NHANES measured; the generator's stand-in height is never shown as real.
    if(key==='height_cm')return sc.source==='NHANES'?(sc.height_cm??null):(sc.height_cm??prof.height_cm??null);
    return sc[key]??null;
  };
  $('#psv-context').innerHTML=SCREENING_GROUPS.map(([title,items])=>{
    let flagged=0;
    const cells=items.map(([key,name])=>{
      const v=value(key),concern=screeningConcern(key,v,sc);
      if(concern)flagged++;
      const shown=typeof v==='number'?fmt(v,1):v;
      return `<div class="psv-cell ${v===null?'missing':''} ${concern?'warning':''}" title="${esc(concern||name)}"><div class="psv-name">${esc(name)}</div><div class="psv-value">${esc(shown??'—')}</div>${concern?`<div class="psv-when">${esc(concern)}</div>`:''}</div>`;
    }).join('');
    const open=openInfoGroups.has(title);
    return `<div class="info-group psv-group ${open?'open':''}">
      <button type="button" class="psv-group-head" data-info-group="${esc(title)}" aria-expanded="${open}">
        <span><i class="psv-caret" aria-hidden="true">▸</i>${title}</span>
        <small>${flagged?`<b>${flagged} to note</b> · `:''}${items.length} fields</small>
      </button>
      ${open?`<div class="psv-grid">${cells}</div>`:''}
    </div>`;
  }).join('')+(p.screening?`<p class="psv-note">Blank = not measured; age 80 and over is shown as 80+.</p>`:'<p class="psv-note">No screening profile for this resident yet. Run the nutrition replay to load one.</p>');
}

function renderSummaryCards(){
  const scored=patients.filter(p=>p.risk!==null);
  const open=patients.filter(p=>p.risk>=70&&p.alert_status!=='acknowledged').length;
  $('#monitored-count').textContent=patients.length;
  $('#roster-count').textContent=patients.length;
  $('#high-stat').innerHTML=`${open} <small>Need review today</small>`;
  $('#alert-count').textContent=open;
  const intakes=scored.map(p=>p.intake7).filter(v=>v!==null&&v!==undefined);
  $('#avg-intake').textContent=intakes.length?fmt(intakes.reduce((a,b)=>a+b,0)/intakes.length):'—';
  $('#losing-count').textContent=scored.filter(p=>(p.weight_change??0)<=-2).length;
  $('#chip-urgent-count').textContent=patients.filter(p=>tier(p)==='high'&&!isSignedOff(p)).length;
  $('#chip-signed-count').textContent=patients.filter(isSignedOff).length;
  $('#chip-watch-count').textContent=patients.filter(p=>tier(p)==='medium').length;
  $('#chip-stable-count').textContent=patients.filter(p=>tier(p)==='stable').length;
}

function renderScreening(p){
  const s=summary(p),flagged=new Set(drivers(p).map(d=>d.key));
  const meter=(name,hint,value,display,percent,warn)=>`
    <div class="screen-row ${warn?'warning':''}">
      <div><strong>${name}</strong><small>${hint}</small></div>
      <b>${display}</b>
    </div>
    <div class="meter ${warn?'warning':''}"><i style="width:${value===null||value===undefined?0:Math.max(2,Math.min(100,percent))}%"></i></div>`;
  $('#screening').innerHTML=p.risk===null?'<p class="screen-empty">No nutrition log for this resident yet.</p>':
    meter('Meal intake','7-day average · usual '+(s.baseline!==null&&s.baseline!==undefined?fmt(s.baseline)+'%':'n/a'),s.intake7,`${fmt(s.intake7)}%`,s.intake7,flagged.has('intake')||flagged.has('decline'))+
    meter('Weight change','Since first weigh-in',s.weightChangePct,s.weightChangePct===null||s.weightChangePct===undefined?'—':`${s.weightChangePct>0?'+':''}${fmt(s.weightChangePct,1)}%`,Math.abs(s.weightChangePct??0)*10,flagged.has('weight'))+
    meter('Fluids','3-day average · goal 1,500 mL',s.fluids3,`${fmt(s.fluids3)} mL`,(s.fluids3??0)/20,flagged.has('fluids'))+
    meter('BMI','Older adults: below 21 is a concern',s.bmi,fmt(s.bmi,1),((s.bmi??15)-15)/15*100,flagged.has('bmi'))+
    meter('Predicted malnutrition risk','From screening · 60%+ raises the score',s.modelRisk,s.modelRisk===null||s.modelRisk===undefined?'—':`${s.modelRisk}%`,s.modelRisk??0,flagged.has('model'));
}

function renderExplanation(p){
  const ds=drivers(p),s=summary(p);
  if(p.risk===null){
    $('#explanation').textContent='No nutrition log for this resident yet, so no score has been calculated.';
    $('#drivers').innerHTML='<span class="driver">No data</span>';
    $('#clinical-context').textContent='Run the nutrition replay to load daily meal, fluid and weight records.';
    $('#plan-steps').innerHTML='<li>Start recording meals, fluids and weekly weights.</li>';
    return;
  }
  if(riskMode==='ai'){
    const f=profile(p).screening_model?.factors||[];
    $('#explanation').innerHTML=`<strong>AI prediction for ${esc(p.name)}:</strong> the screening model gives a ${p.risk}% chance of malnutrition${f.length?`, mainly from ${f.map(esc).join(', ')}`:''}. Daily meals, fluids and weight are not counted in this view.`;
    $('#drivers').innerHTML=f.length?f.map(x=>`<span class="driver">↗ ${esc(capFirst(x))}</span>`).join(''):'<span class="driver">No strong risk factors</span>';
    $('#clinical-context').innerHTML='The AI model looks only at the resident\'s screening results (body measures, diet recall, blood pressure and balance). Switch to "All factors" to include the daily care logs.';
    const steps=[];
    if(p.risk>=60)steps.push(`<li><strong>${CARE_STEPS.model[0]}:</strong> ${CARE_STEPS.model[1]}</li>`);
    if(p.risk>=70)steps.push('<li><strong>Nurse review:</strong> Assess today and share the SBAR handoff with the physician.</li>');
    $('#plan-steps').innerHTML=steps.join('')||'<li><strong>Routine:</strong> Continue recording meals and fluids each shift and weighing weekly.</li>';
    return;
  }
  $('#explanation').innerHTML=ds.length
    ?`<strong>Flag brief:</strong> a score of ${p.risk}/100 built from ${ds.length} warning sign${ds.length===1?'':'s'} in the care logs — ${ds.map(d=>esc(d.label.replace(/^[A-Z][a-z]/,m=>m.toLowerCase()))).join(', ')}.`
    :`<strong>${esc(p.name)} is on track:</strong> eating ${fmt(s.intake7)}% of meals, drinking about ${fmt(s.fluids3)} mL a day, and weight is steady.`;
  $('#drivers').innerHTML=ds.length?ds.map(d=>`<span class="driver" title="+${d.points} points">↗ ${esc(d.label)} · ${esc(d.detail)}</span>`).join(''):'<span class="driver">No warning signs</span>';
  $('#clinical-context').innerHTML=`Weight loss in older adults is often noticed late, after weeks of eating less. NutriSense watches each resident's own normal so small, steady drops show up early.${s.latestNote?` <br><br><strong>Latest CNA note:</strong> “${esc(s.latestNote)}”`:''}`;
  const steps=[...new Set(ds.map(d=>d.key))].filter(k=>CARE_STEPS[k]).map(k=>`<li><strong>${CARE_STEPS[k][0]}:</strong> ${CARE_STEPS[k][1]}</li>`);
  if(p.risk>=70)steps.push('<li><strong>Nurse review:</strong> Assess today and share the SBAR handoff with the physician.</li>');
  $('#plan-steps').innerHTML=steps.join('')||'<li><strong>Routine:</strong> Continue recording meals and fluids each shift and weighing weekly.</li>';
}

// Daily nutrition cards, the risk trajectory and the context strip need the day-by-day logs.
function renderNutrition(){
  if(!selected)return;
  const p=selected,rows=nutritionRows(),last=rows.at(-1),s=summary(p),flagged=new Set(drivers(p).map(d=>d.key));
  const weighed=[...rows].reverse().find(r=>r.weight_kg!==null);
  $('#nutrition-context').innerHTML=last
    ?`<span>Monitoring <b>day ${last.day} of ${rows.length}</b></span><span>Last weighed <b>${weighed?`${fmt(weighed.weight_kg,1)} kg · day ${weighed.day}`:'—'}</b></span><span>Diet <b>${esc(profile(p).diet||'—')}</b></span><span>Attending <b>Dr. Sarah Chen</b></span>`
    :'<span>No nutrition log yet</span>';
  if(isSignedOff(p)&&p.signed_off_at){
    const who=String(p.signed_off_by||'').replace(/^solana:/,''),short=who.length>12?`${who.slice(0,4)}…${who.slice(-4)}`:(who||'care team');
    $('#nutrition-context').insertAdjacentHTML('afterbegin',`<span class="signed-note">${icon('check')} Signed off <b>${esc(new Date(p.signed_off_at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))}</b> by <b title="${esc(who)}">${esc(short)}</b></span>`);
  }
  const card=(key,iconName,title,value,unit,status,warn)=>`
    <button type="button" class="vital ${warn?'warning':''}" data-nutri="${key}" aria-label="View daily ${title} chart" ${last?'':'disabled'}>
      <div class="vital-label">${icon(iconName)} ${title}</div>
      <div class="vital-value">${value}<small>${unit}</small></div>
      <div class="vital-status">${status}</div>
      <span class="vital-chart-hint">View daily chart ↗</span>
    </button>`;
  const today=last?mealAvg(last):null;
  $('#nutrition-cards').innerHTML=!last?'<div class="psv-empty">No nutrition log for this resident yet.</div>':
    card('meals','utensils','Meals eaten today',fmt(today),'%',`7-day avg ${fmt(s.intake7)}% · usual ${s.baseline!==null&&s.baseline!==undefined?fmt(s.baseline)+'%':'n/a'}`,flagged.has('intake')||flagged.has('decline'))+
    card('fluids','droplet','Fluids today',fmt(last.fluids_ml),'mL',`3-day avg ${fmt(s.fluids3)} mL · goal 1,500`,flagged.has('fluids'))+
    card('weight','gauge','Weight',fmt(s.weight,1),'kg',s.weightChangePct===null||s.weightChangePct===undefined?'Weighed weekly':`${s.weightChangePct>0?'+':''}${fmt(s.weightChangePct,1)}% since day 1`,flagged.has('weight')||flagged.has('bmi'))+
    card('risk','mind','Appetite today',esc(last.appetite||'—'),'',last.chewing_difficulty?'Chewing / swallowing difficulty noted':esc(last.note||'No CNA note today'),last.appetite==='Poor'||flagged.has('chewing'));

  // Risk trajectory: the real daily NutriSense score.
  const series=rows.filter(r=>r.risk!==null&&r.risk!==undefined);
  // The AI prediction comes from one-time screening results, so it has no day-by-day trend to chart.
  const show=riskMode!=='ai'&&p.risk!==null&&series.length>1;
  $('.chart').hidden=!show;
  $('.chart-legend').hidden=!show;
  $('.risk-panel').classList.toggle('compact',!show);
  $('#trajectory-tag').textContent=riskMode==='ai'?'AI prediction · from screening':series.length?`Daily score · ${series.length} days`:'Daily score';
  if(!show)return;
  const x=i=>35+i*540/(series.length-1),y=v=>155-Math.max(1,v)*1.35;
  const d=series.map((r,i)=>`${i?'L':'M'}${x(i)},${y(r.risk)}`).join(' ');
  $('#chart-line').setAttribute('d',d);
  $('#chart-area').setAttribute('d',`${d} L575,155 L35,155Z`);
  $('#chart-point').setAttribute('cx',x(series.length-1));
  $('#chart-point').setAttribute('cy',y(series.at(-1).risk));
  const ticks=6,labels=Array.from({length:ticks},(_,i)=>series[Math.round(i*(series.length-1)/(ticks-1))].day);
  $('.chart-times').innerHTML=labels.map((day,i)=>`<span>${i===ticks-1?'Today':'Day '+day}</span>`).join('');
}

function notify(text){
  $('#toast').textContent=text;
  $('#toast').classList.add('visible');
  setTimeout(()=>$('#toast').classList.remove('visible'),3500);
}

function modal(title,body){
  $('#modal-title').textContent=title;
  $('#modal-body').innerHTML=body;
  if(!$('#modal').open)$('#modal').showModal();
}

function payload(p){
  return {
    resident_id:`RES-${p.id}`,
    resident_name:p.name,
    exported_at:new Date().toISOString(),
    malnutrition_risk_score:p.risk,
    risk_tier:label(p),
    reasons:drivers(p),
    nutrition_summary:summary(p),
    profile:{age:p.age,sex:p.sex,...profile(p)},
    screening:p.screening||null,
    daily_logs:nutritionRows(),
    assessment_hash:p.hash||null,
    model:'NutriSense rule-based score (nutrition_rules_v1)',
    action_url:p.prediction_id?`/api/actions/nutrition-review?prediction=${p.prediction_id}`:null
  };
}

// SBAR handoff built from the real score, reasons and logs.
function showSbarModal(){
  if(!selected)return;
  const p=selected,loc=residentLocation(p),s=summary(p),ds=drivers(p),prof=profile(p);
  const steps=[...new Set(ds.map(d=>d.key))].filter(k=>CARE_STEPS[k]).map(k=>CARE_STEPS[k][1]);
  // On-track residents only need routine monitoring; anyone on watch or higher also gets a physician review.
  const recommendations=steps.length?[...steps,'Physician review and sign-off.']:['Continue routine monitoring: record meals and fluids each shift and weigh weekly.'];
  const sbarText=`SBAR NUTRITION HANDOFF · NUTRISENSE
Facility: Maplewood Senior Living
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

[SITUATION]
Resident: ${p.name} (${loc.room}, ${loc.wing}) · ID RES-${p.id}
Age ${p.age} · ${p.sex} · Diet: ${prof.diet||'—'}
Malnutrition risk score ${p.risk}/100 (${label(p)}).

[BACKGROUND]
Daily meal, fluid and weight records over ${s.day??'—'} days. Usual meal intake ${s.baseline!==null&&s.baseline!==undefined?fmt(s.baseline)+'%':'not yet established'}.

[ASSESSMENT]
- Meals: ${fmt(s.intake7)}% eaten (7-day average)
- Weight: ${fmt(s.weight,1)} kg, ${s.weightChangePct===null||s.weightChangePct===undefined?'no change data':`${s.weightChangePct>0?'+':''}${fmt(s.weightChangePct,1)}% since first weigh-in`}; BMI ${fmt(s.bmi,1)}
- Fluids: ${fmt(s.fluids3)} mL/day (3-day average)
- Warning signs: ${ds.length?ds.map(d=>`${d.label} (${d.detail})`).join('; '):'none'}
${s.latestNote?`- Latest CNA note: "${s.latestNote}"\n`:''}
[RECOMMENDATION]
${recommendations.map((t,i)=>`${i+1}. ${t}`).join('\n')}`;
  modal('SBAR Nutrition Handoff',`
    <div class="sbar-modal-content">
      <div class="sbar-badge-row">
        <span class="badge ${tier(p)}">${esc(p.name)} · ${p.risk}/100</span>
        <span class="sbar-format-tag">Generated from care logs</span>
      </div>
      <p class="sbar-intro">Ready for shift handoff, dietitian referral or physician review.</p>
      <textarea class="sbar-textarea" id="sbar-text" readonly rows="16">${esc(sbarText)}</textarea>
      <div class="sbar-actions">
        <button class="button dark" id="copy-sbar">${icon('clipboard')} Copy SBAR to Clipboard</button>
        <button class="button secondary" id="close-sbar-btn">Close</button>
      </div>
    </div>`);
  $('#copy-sbar').onclick=()=>navigator.clipboard.writeText(sbarText).then(()=>notify('SBAR copied to clipboard')).catch(()=>notify('Unable to access clipboard. Please copy manually.'));
  $('#close-sbar-btn').onclick=()=>$('#modal').close();
}

// ---- Solana Blink ----
// The dialog is a small blink client: it reads the Action served by /api/actions/nutrition-review (the same URL a
// wallet or dial.to would use), has the browser wallet sign and send the transaction, then posts the signature
// back so the server can verify it on devnet before recording the receipt.
const B58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58(bytes){
  let n=0n;for(const b of bytes)n=n*256n+BigInt(b);
  let out='';while(n>0n){out=B58[Number(n%58n)]+out;n/=58n;}
  for(const b of bytes){if(b!==0)break;out='1'+out;}
  return out;
}
const walletProvider=()=>window.phantom?.solana||(window.solana?.isPhantom?window.solana:null);
async function actionFetch(path,data){
  const r=await fetch(path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','Accept':'application/json'},body:data?JSON.stringify(data):undefined});
  const result=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(result.message||result.error||'Request failed');
  return result;
}

async function review(){
  const current=selected;
  if(!current?.prediction_id)return;
  const href=`/api/actions/nutrition-review?prediction=${current.prediction_id}`;
  modal('Sign off','<p>Loading…</p>');
  let action;
  try{action=await actionFetch(href);}
  catch(e){$('#modal-body').innerHTML=`<p>${esc(e.message)}</p>`;return;}
  $('#modal-body').innerHTML=`
    <div class="blink-preview-card">
      <div class="blink-header">
        <span class="blink-logo">${icon('check')} SIGN-OFF · RECORDED ON SOLANA</span>
        <span class="badge ${tier(current)}">${esc(label(current))}</span>
      </div>
      <div class="blink-card">
        <img class="blink-icon" src="${esc(action.icon)}" alt="">
        <div><h3>${esc(action.title)}</h3><p>${esc(action.description)}</p></div>
      </div>
      <div class="blink-btn-row">
        ${action.links.actions.map((a,i)=>`<button class="button dark" data-blink-action="${i}">${icon('check')} ${esc(a.label)}</button>`).join('')}
        <button class="button" id="copy-blink-link">Copy sign-off link</button>
      </div>
      <div class="blink-status" id="blink-status" role="status" hidden></div>
      <p class="blink-footnote"><small>Needs a browser wallet such as Phantom set to Devnet, with a little devnet SOL for the fee.</small></p>
    </div>`;
  document.querySelectorAll('[data-blink-action]').forEach(button=>{
    button.onclick=()=>signAction(action.links.actions[Number(button.dataset.blinkAction)].href,button);
  });
  $('#copy-blink-link').onclick=()=>{
    navigator.clipboard.writeText(`solana-action:${location.origin}${href}`)
      .then(()=>notify('Sign-off link copied'))
      .catch(()=>notify('Unable to access clipboard'));
  };
}

async function signAction(actionHref,button){
  const box=$('#blink-status');
  const status=(html,kind='')=>{box.hidden=false;box.className=`blink-status ${kind}`;box.innerHTML=html;};
  const provider=walletProvider();
  if(!provider){status('No Solana wallet found. Install Phantom, switch it to Devnet, then reload this page.','error');return;}
  button.disabled=true;
  try{
    status('Connecting wallet…');
    const {publicKey}=await provider.connect();
    const account=publicKey.toString();
    status('Preparing transaction…');
    const tx=await actionFetch(actionHref,{account});
    const bytes=Uint8Array.from(atob(tx.transaction),c=>c.charCodeAt(0));
    status('Approve the transaction in your wallet…');
    // Phantom expects the whole unsigned transaction (empty signature slot + message), base58-encoded.
    // Some older wallet builds expect only the message, so retry with that if the wallet cannot parse it.
    let result;
    try{
      result=await provider.request({method:'signAndSendTransaction',params:{message:base58(bytes)}});
    }catch(e){
      if(!/buffer|deserializ|invalid transaction/i.test(e?.message||''))throw e;
      result=await provider.request({method:'signAndSendTransaction',params:{message:base58(bytes.slice(1+64*bytes[0]))}});
    }
    const signature=result.signature;
    status('Waiting for devnet confirmation…');
    const done=await actionFetch(tx.links.next.href,{account,signature});
    status(`${icon('check')} ${esc(done.description)} <a href="${esc(done.explorer)}" target="_blank" rel="noopener">View on Solana Explorer ↗</a>`,'success');
    notify(done.acknowledged?'Signed off and alert acknowledged':'Signed off');
    await refresh();
  }catch(e){
    status(esc(e?.message||'Signing was cancelled'),'error');
    button.disabled=false;
  }
}


$('#review').onclick=review;
$('#blink-btn').onclick=review;
$('#sbar-btn').onclick=showSbarModal;
$('#close-modal').onclick=()=>$('#modal').close();

$('#modal').addEventListener('click',e=>{
  if(e.target===$('#modal')){
    const r=$('#modal').getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close();
  }
});

$('#search').oninput=renderList;
$('#wing-filter').onchange=e=>{wingFilter=e.target.value;renderList();};
$('#patient-list').addEventListener('click',event=>{
  const head=event.target.closest('[data-list-group]');
  if(head){const k=head.dataset.listGroup;if(openListGroups.has(k))openListGroups.delete(k);else openListGroups.add(k);renderList();return;}
  const row=event.target.closest('.res-row');
  if(row)selectResident(row.dataset.id);
});
$('#sort').onclick=()=>{descending=!descending;renderList();};

document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
  filter=b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));
  renderList();
});

document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
  if(b.dataset.view==='alerts'){
    modal('Early Alert Center',patients.filter(p=>p.risk>=70&&p.alert_status!=='acknowledged').map(p=>`
      <div class="audit-item">
        <strong>${esc(p.name)}</strong> · RES-${esc(p.id)}
        <p>Malnutrition risk ${p.risk}/100 · ${esc(p.top_reason||'review requested')}${p.reason_count>1?` +${p.reason_count-1} more`:''}</p>
        <button class="button" data-review="${esc(p.id)}">Review alert ↗</button>
      </div>`).join('')||'<p>No residents currently above the alert threshold.</p>');
    document.querySelectorAll('[data-review]').forEach(x=>{
      x.onclick=async()=>{selectedId=x.dataset.review;await loadDetail(selectedId);review();};
    });
  } else {
    $('#search').value='';
    filter='all';
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x.dataset.filter==='all'));
    renderList();
  }
});

$('#export').onclick=()=>{
  const p=payload(selected);
  const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
  const a=document.createElement('a');
  a.href=url;
  a.download=`nutrisense-resident-${p.resident_id}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('Resident nutrition report exported as JSON');
};

async function api(path,data){
  const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
  const result=await r.json();
  if(!r.ok)throw Error(result.error||'Request failed');
  return result;
}

async function refresh(){
  const rows=await api('/api/patients');
  rawPatients.splice(0,rawPatients.length,...rows);
  patients.splice(0,patients.length,...rows.map(scoreView));
  if(!patients.some(p=>p.id===selectedId))selectedId=patients[0]?.id??null; // list arrives sorted by risk
  mergeSelected();
  render();
  if(selectedId){loadDetail(selectedId);loadNutrition();}
  $('.system').innerHTML='<span class="dot"></span> Resident database connected<small>Auto-refresh every 3 seconds</small>';
}

async function initializeDashboard(){
  try{await refresh();}
  catch(e){
    $('.system').textContent='Database unavailable';
    $('#patient-list').innerHTML='<div class="empty">Unable to load residents. Check the server and reload.</div>';
    for(const id of ['review','export','blink-btn','sbar-btn'])$('#'+id).disabled=true;
    notify(e.message);
  }
}
initializeDashboard();

let polling=false;
setInterval(async()=>{
  if(polling)return;
  polling=true;
  try{await refresh();}
  catch{$('.system').textContent='Connection interrupted · retrying';}
  finally{polling=false;}
},3000);

// ---------- History charts: hourly vitals (PSV replay) or daily nutrition logs ----------
const NUTRITION_SERIES={
  meals:['Meals eaten','%',r=>mealAvg(r)],
  fluids:['Fluids','mL',r=>r.fluids_ml],
  weight:['Weight','kg',r=>r.weight_kg],
  risk:['Malnutrition risk score','/100',r=>r.risk]
};
let historySelection=null,historyRequest=0;

$('#psv-context').addEventListener('click',event=>{
  const head=event.target.closest('[data-info-group]');
  if(!head||!selected)return;
  const title=head.dataset.infoGroup;
  if(openInfoGroups.has(title))openInfoGroups.delete(title);else openInfoGroups.add(title);
  renderResidentInfo(selected);
  $(`[data-info-group="${CSS.escape(title)}"]`)?.focus();
});
$('#nutrition-cards').addEventListener('click',event=>{
  const button=event.target.closest('[data-nutri]');
  if(!button)return;
  const [labelText,unit]=NUTRITION_SERIES[button.dataset.nutri];
  openHistory({source:'nutrition',key:button.dataset.nutri,label:labelText,unit});
});
$('.chart').addEventListener('click',()=>openHistory({source:'nutrition',key:'risk',label:NUTRITION_SERIES.risk[0],unit:'/100'}));

function openHistory(selection){
  historySelection={patientId:selected.id,name:selected.name,...selection};
  modal(`${selection.label} · ${selected.name}`,'<p>Loading…</p>');
  loadHistory();
}

$('#modal').addEventListener('close',()=>{historySelection=null;historyRequest++;});

async function loadHistory(){
  const selection=historySelection;
  if(!selection||!$('#modal').open)return;
  const request=++historyRequest;
  try{
    const daily=selection.source==='nutrition';
    const data=await api((daily?'/api/nutrition-history':'/api/vital-history')+'?patient='+encodeURIComponent(selection.patientId));
    if(request!==historyRequest||historySelection!==selection||!$('#modal').open)return;
    const unit=selection.unit,step=daily?'Day':'Hour';
    const rows=daily
      ?data.rows.map(r=>({t:Number(r.day),value:NUTRITION_SERIES[selection.key][2](r)??null}))
      :data.rows.map(r=>({t:Number(r.hour),value:typeof r.raw_data[selection.key]==='number'?r.raw_data[selection.key]:null}));
    rows.forEach(r=>{if(r.value!==null)r.value=Math.round(r.value*10)/10;});
    const measured=rows.filter(r=>r.value!==null);
    if(!measured.length){
      $('#modal-body').innerHTML='<div class="history-empty">No recorded measurements yet.<small>Missing readings are not treated as zero.</small></div>';
      return;
    }
    const width=680,height=270,left=55,right=22,top=22,bottom=43;
    const first=rows[0].t,last=rows.at(-1).t;
    const values=measured.map(r=>r.value),min=Math.min(...values),max=Math.max(...values),padding=(max-min)*.15||Math.abs(max)*.1||1;
    const low=min>=0?Math.max(0,min-padding):min-padding,high=max+padding;
    const x=t=>left+(t-first)/Math.max(last-first,1)*(width-left-right);
    const y=v=>height-bottom-(v-low)/(high-low)*(height-top-bottom);
    const f=v=>Number(v.toFixed(1));
    let grid='';
    for(let i=0;i<5;i++){
      const value=low+(high-low)*i/4;
      grid+=`<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" stroke="#e9e9e9"/><text x="${left-10}" y="${y(value)+4}" text-anchor="end">${f(value)}</text>`;
    }
    const ticks=new Set(Array.from({length:Math.min(7,last-first+1)},(_,i)=>Math.round(first+(last-first)*i/Math.max(1,Math.min(6,last-first)))));
    for(const t of ticks)grid+=`<text x="${x(t)}" y="${height-20}" text-anchor="middle">${t}</text>`;
    // Weight is only measured weekly, so its points are joined across the days in between.
    const joinGaps=selection.key==='weight';
    let line='',previous=null;
    for(const r of rows){
      if(r.value===null){if(!joinGaps)previous=null;continue;}
      line+=`${previous!==null?'L':'M'}${x(r.t)},${y(r.value)} `;
      previous=r.t;
    }
    const dots=measured.map(r=>`<circle tabindex="0" aria-label="${step} ${r.t}: ${r.value} ${unit}" cx="${x(r.t)}" cy="${y(r.value)}" r="4" fill="#626262" stroke="white" stroke-width="2"><title>${step} ${r.t}: ${r.value} ${unit}</title></circle>`).join('');
    const table=rows.map(r=>`<tr><td>${step} ${r.t}</td><td>${r.value===null?'Not measured':r.value+' '+unit}</td></tr>`).join('');
    $('#modal-body').innerHTML=`
      <div class="history-summary">
        <span>${measured.length} ${daily?'daily':'hourly'} readings</span>
        <strong>${measured.at(-1).value} <small>${unit}</small></strong>
      </div>
      <svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(selection.label)} by ${step.toLowerCase()}">${grid}<path d="${line}" fill="none" stroke="#626262" stroke-width="2.5"/>${dots}</svg>
      <div class="history-axis">${daily?'Care log day':'Observation hour'}</div>
      <p class="history-note">${daily?'From the daily care logs. Weight is recorded weekly.':'Bedside vitals. Gaps are hours with no reading.'}</p>
      <details><summary>View values table</summary><div class="history-table"><table><thead><tr><th>${step}</th><th>${esc(selection.label)}</th></tr></thead><tbody>${table}</tbody></table></div></details>`;
  }catch(e){
    if(request===historyRequest&&historySelection===selection)$('#modal-body').innerHTML='<p>Unable to load history.</p>';
  }
}
setInterval(()=>{if(historySelection&&$('#modal').open)loadHistory()},3000);


$('#delete-patient').onclick=()=>{
  if(!selected)return;
  const patient={...selected};
  historySelection=null;
  historyRequest++;
  modal('Delete resident data?',`
    <p id="delete-description">Delete all stored records for ${esc(patient.name)}?</p>
    <p>This removes care logs, scores, vitals, alerts and acknowledgments. Local files are kept.</p>
    <div class="delete-actions">
      <button class="button" id="cancel-delete">Cancel</button>
      <button class="button danger" id="confirm-delete">Delete permanently</button>
    </div>
    <p id="delete-error" role="alert"></p>
  `);
  $('#cancel-delete').onclick=()=>$('#modal').close();
  $('#confirm-delete').onclick=async()=>{
    $('#confirm-delete').disabled=true;
    $('#confirm-delete').textContent='Deleting…';
    try{
      await api('/api/delete-patient',{patient_id:patient.id,confirm:true});
      $('#modal').close();
      await refresh();
      notify('Resident record removed');
    }catch(e){
      $('#delete-error').textContent=e.message;
      const button=$('#confirm-delete');
      if(button){button.disabled=false;button.textContent='Delete permanently';}
    }
  };
};

$('#delete-all-patients').onclick=()=>{
  historySelection=null;
  historyRequest++;
  modal('Delete all resident records?',`
    <p>This permanently deletes <strong>every resident</strong> and all saved observations. Run the replays again to reload them.</p>
    <label for="delete-all-text">Type <strong>DELETE ALL</strong> to confirm</label>
    <input id="delete-all-text" class="delete-confirm-input" autocomplete="off" placeholder="DELETE ALL">
    <div class="delete-actions">
      <button class="button" id="cancel-delete-all">Cancel</button>
      <button class="button danger" id="confirm-delete-all" disabled>Delete all permanently</button>
    </div>
    <p id="delete-all-error" role="alert"></p>
  `);
  $('#cancel-delete-all').onclick=()=>$('#modal').close();
  $('#delete-all-text').oninput=()=>{$('#confirm-delete-all').disabled=$('#delete-all-text').value!=='DELETE ALL';};
  $('#confirm-delete-all').onclick=async()=>{
    const button=$('#confirm-delete-all');
    button.disabled=true;
    $('#delete-all-text').disabled=true;
    button.textContent='Deleting…';
    try{
      const result=await api('/api/delete-all-patients',{confirm:'DELETE ALL'});
      $('#modal').close();
      await refresh();
      notify(`${result.count} residents and records deleted. Run the replays again to reload them.`);
    }catch(e){
      const error=$('#delete-all-error');
      if(error){
        error.textContent=e.message;
        button.disabled=false;
        button.textContent='Delete all permanently';
        $('#delete-all-text').disabled=false;
      }
    }
  };
};

// ---------- Risk score mode toggle ----------
function applyRiskMode(){
  document.querySelectorAll('.risk-mode button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===riskMode)));
  patients.splice(0,patients.length,...rawPatients.map(scoreView));
  lastListSignature=null;
  mergeSelected();
  render();
}
document.querySelector('.risk-mode').addEventListener('click',e=>{
  const b=e.target.closest('[data-mode]');
  if(!b||b.dataset.mode===riskMode)return;
  riskMode=b.dataset.mode;
  try{localStorage.setItem('nutrisense-risk-mode',riskMode);}catch{}
  applyRiskMode();
});
applyRiskMode();
