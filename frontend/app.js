const $=s=>document.querySelector(s);

// Line icons (24×24, stroked) used in place of emoji. Static markup uses <i data-icon="name">.
const ICONS={
  pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
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
  utensils:'<path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>'
};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||''}</svg>`;
document.querySelectorAll('i[data-icon]').forEach(el=>{el.outerHTML=icon(el.dataset.icon);});
const patients=[];
let original;let selected,filter='all',timer=null,elapsed=0,descending=true;const audit=[];let activeRole='cna';
const tier=p=>p.risk===null?'unscored':p.risk>=70?'high':p.risk>=30?'medium':'stable';
const label=p=>({high:'Early warning (High)',medium:'Moderate watch',stable:'Stable baseline',unscored:'Not scored'})[tier(p)];
const initials=p=>p.name.split(' ').map(n=>n[0]).join('');

// Room and wing assignment for senior care facility
function residentLocation(p){
  // Room number is the patient number (trailing digits of the ID, as in the display name).
  const digits=String(p.id).match(/\d+$/);
  const room=`Room ${digits?Number(digits[0]):p.id}`;
  const wing='Residence Wing';
  return { room, wing, full: `${wing} · ${room}` };
}

// Behavioral & Daily Living Early Warning Signals
function getBehavioralSignals(p){
  if(p.risk === null){
    return [
      { title: 'Meal intake', value: 'Unrecorded', icon: 'utensils', warning: false, detail: 'Dietary log pending' },
      { title: 'Mobility & transfers', value: 'Baseline', icon: 'walk', warning: false, detail: 'Routine physical therapy' },
      { title: 'Hydration level', value: 'Standard fluids', icon: 'droplet', warning: false, detail: 'Bedside pitcher available' },
      { title: 'Cognition & mood', value: 'Baseline', icon: 'mind', warning: false, detail: 'Orientation intact' }
    ];
  }
  if(p.risk >= 70){
    return [
      { title: 'Meal intake', value: 'Skipped 2 meals (25% eaten)', icon: 'utensils', warning: true, detail: 'Refused breakfast & lunch · Anorexia' },
      { title: 'Mobility & transfers', value: 'Bed-bound / Reluctant', icon: 'walk', warning: true, detail: 'Refused morning hallway walk · Fatigue' },
      { title: 'Hydration level', value: 'Low intake (< 450 mL)', icon: 'droplet', warning: true, detail: 'Care team pushed fluids x3' },
      { title: 'Cognition & mood', value: 'New acute confusion', icon: 'mind', warning: true, detail: 'Atypical lethargy noted by CNA' }
    ];
  }
  if(p.risk >= 30){
    return [
      { title: 'Meal intake', value: 'Decreased (45% eaten)', icon: 'utensils', warning: true, detail: 'Ate half of lunch · Complained of fullness' },
      { title: 'Mobility & transfers', value: 'Unsteady / Assist x2', icon: 'walk', warning: true, detail: 'Slow transfers · Increased fall precaution' },
      { title: 'Hydration level', value: 'Borderline (750 mL)', icon: 'droplet', warning: false, detail: 'Reminded to drink water' },
      { title: 'Cognition & mood', value: 'Mild lethargy / Sleepy', icon: 'mind', warning: true, detail: 'Harder to wake for morning meds' }
    ];
  }
  return [
    { title: 'Meal intake', value: 'Good appetite (95% eaten)', icon: 'utensils', warning: false, detail: 'Finished full lunch in dining hall' },
    { title: 'Mobility & transfers', value: 'Independent / Assist x1', icon: 'walk', warning: false, detail: 'Attended morning exercise class' },
    { title: 'Hydration level', value: 'Adequate (> 1,600 mL)', icon: 'droplet', warning: false, detail: 'Meeting daily fluid goals' },
    { title: 'Cognition & mood', value: 'Alert & oriented x4', icon: 'mind', warning: false, detail: 'Engaged in social activities' }
  ];
}

function scores(v){
  const [hr,rr,sbp,temp,,gcs,wbc]=v;
  return {
    qsofa: [sbp,rr,gcs].some(x=>x===null) ? null : Number(sbp<=100)+Number(rr>=22)+Number(gcs<15),
    sirs: [temp,hr,rr,wbc].some(x=>x===null) ? null : Number(temp>38||temp<36)+Number(hr>90)+Number(rr>20)+Number(wbc>12||wbc<4)
  };
}

const fields=[
  ['Heart rate','bpm','heart',v=>v>90,'60–100 bpm'],
  ['Respiratory rate','/min','wind',v=>v>=22,'12–20 /min (Critical qSOFA)'],
  ['Systolic BP','mmHg','gauge',v=>v<=100,'100–120 mmHg (Hypotension)'],
  ['Temperature','°C','thermometer',v=>v>38||v<36,'36.5–37.5 °C (Atypical in seniors)'],
  ['Oxygen saturation','%','droplet',v=>v<92,'95–100%'],
  ['Mental status','GCS','mind',v=>v<15,'GCS 15 (Confusion indicator)'],
  ['White blood cells','×10⁹/L','cells',v=>v>12||v<4,'4.5–11 ×10⁹/L'],
  ['Serum lactate','mmol/L','flask',v=>v>2,'0.5–2.0 mmol/L (Tissue perfusion)']
];

// Every measurement column in the PhysioNet PSV dataset: [PSV key, label, unit, typical low, typical high].
// Ranges are typical adult reference values used only for highlighting; null means no range is shown.
const psvGroups=[
  ['Vital signs',[['HR','Heart rate','bpm',60,100],['O2Sat','Pulse oximetry','%',95,100],['Temp','Temperature','°C',36,38],['SBP','Systolic BP','mmHg',100,140],['MAP','Mean arterial pressure','mmHg',65,110],['DBP','Diastolic BP','mmHg',60,90],['Resp','Respiratory rate','/min',12,20],['EtCO2','End-tidal CO₂','mmHg',35,45]]],
  ['Blood gas',[['BaseExcess','Base excess','mmol/L',-2,2],['HCO3','Bicarbonate (HCO₃)','mmol/L',22,28],['FiO2','Inspired O₂ (FiO₂)','fraction',null,null],['pH','pH','',7.35,7.45],['PaCO2','PaCO₂','mmHg',35,45],['SaO2','Arterial O₂ sat (SaO₂)','%',95,100]]],
  ['Chemistry',[['AST','AST','IU/L',10,40],['BUN','BUN','mg/dL',7,20],['Alkalinephos','Alkaline phosphatase','IU/L',44,147],['Calcium','Calcium','mg/dL',8.5,10.5],['Chloride','Chloride','mmol/L',96,106],['Creatinine','Creatinine','mg/dL',0.6,1.3],['Bilirubin_direct','Bilirubin, direct','mg/dL',0,0.3],['Bilirubin_total','Bilirubin, total','mg/dL',0.1,1.2],['Glucose','Glucose','mg/dL',70,140],['Lactate','Lactate','mmol/L',0.5,2],['Magnesium','Magnesium','mg/dL',1.7,2.2],['Phosphate','Phosphate','mg/dL',2.5,4.5],['Potassium','Potassium','mmol/L',3.5,5],['TroponinI','Troponin I','ng/mL',0,0.04]]],
  ['Hematology & coagulation',[['Hct','Hematocrit','%',36,50],['Hgb','Hemoglobin','g/dL',12,17.5],['PTT','PTT','s',25,35],['WBC','White blood cells','×10⁹/L',4,12],['Fibrinogen','Fibrinogen','mg/dL',200,400],['Platelets','Platelets','×10⁹/L',150,450]]]
];
const yesNo=v=>v===1?'Yes':v===0?'No':v;
// Demographic, stay and label columns. SepsisLabel is the dataset's outcome label and is never used for scoring.
const psvContext=[['Age','Age',v=>`${Math.round(v)} yrs`],['Gender','Gender',v=>v===1?'Male':v===0?'Female':v],['Unit1','Medical ICU (Unit1)',yesNo],['Unit2','Surgical ICU (Unit2)',yesNo],['HospAdmTime','Hospital → ICU admit',v=>`${v} h`],['ICULOS','ICU length of stay',v=>`${v} h`]];
const psvGroupTitles=psvGroups.map(([title])=>title);
let datasetRows={patientId:null,rows:undefined},datasetRequest=0;
// Dataset observation groups start collapsed; expanded groups stay open across 3-second refreshes.
const openPsvGroups=new Set();

function renderList(){
  const query=$('#search').value.toLowerCase();
  const shown=patients.filter(p=>(filter==='all'||(filter==='high'?tier(p)==='high':tier(p)==='stable'))&&`${p.name} ${p.id} ${p.bed}`.toLowerCase().includes(query)).sort((a,b)=>descending?b.risk-a.risk:a.risk-b.risk);
  $('#patient-list').innerHTML=shown.map(p=>{
    const loc=residentLocation(p);
    const beh=getBehavioralSignals(p)[0];
    const isHigh=tier(p)==='high';
    const isMed=tier(p)==='medium';
    const tagText=isHigh?`${icon('utensils')} Skipped meals · Lethargy`:isMed?`${icon('utensils')} Appetite drop`:`${icon('check')} Baseline care`;
    return `<button class="patient-row ${selected?.id===p.id?'selected':''}" data-id="${p.id}" aria-pressed="${selected.id===p.id}">
      <div class="row-avatar ${tier(p)}">${initials(p)}</div>
      <div>
        <strong>${p.name}</strong>
        <small>${loc.wing} · ${loc.room}</small>
        <span class="row-tag ${tier(p)}">${tagText}</span>
      </div>
      <div class="row-risk ${tier(p)}">${p.risk===null?'—':p.risk+'%'}
        <small>${isHigh?'Early Alert':isMed?'Watch':'Stable'}</small>
      </div>
    </button>`;
  }).join('')||'<div class="empty">No matching residents</div>';
  
  document.querySelectorAll('.patient-row').forEach(el=>el.onclick=()=>{
    selected=patients.find(p=>p.id===el.dataset.id);
    render();
  });
}

function drivers(p){
  return fields.flatMap((f,i)=>(p.v[i]!==null&&f[3](p.v[i]))?[`${f[0]} ${p.v[i]} ${f[1]}`]:[]);
}

function render(){
  $('#sidebar-patient-count').textContent=patients.length;
  renderList();
  $('.patient-detail').hidden=!selected;
  $('#export').disabled=!selected;
  
  if(!selected){
    $('#monitored-count').textContent='0';
    $('#roster-count').textContent='0';
    if($('#census-count')) $('#census-count').textContent='0';
    if($('#chip-urgent-count')) $('#chip-urgent-count').textContent='0';
    if($('#chip-watch-count')) $('#chip-watch-count').textContent='0';
    if($('#chip-stable-count')) $('#chip-stable-count').textContent='0';
    $('#average').textContent='—';
    $('#high-stat').textContent='0';
    $('#high-caption').textContent='0 active early alerts';
    $('#alert-count').textContent='0';
    $('#patient-list').innerHTML='<div class="empty">No residents yet. Click "Reset demo cohort" above.</div>';
    return;
  }
  
  const p=selected, s=scores(p.v), loc=residentLocation(p);
  $('#initials').textContent=initials(p);
  $('#patient-name').textContent=p.name;
  $('#patient-meta').innerHTML=`ID: RES-${p.id} <span>·</span> ${loc.wing} <span>·</span> ${loc.room}`;
  
  for(const id of ['patient-badge','chart-badge']){
    $('#'+id).className=`badge ${tier(p)}`;
    $('#'+id).textContent=(id==='patient-badge'?'● ':'')+label(p);
  }

  // Behavioral signals are no longer displayed but still feed the explanation, SBAR and export.
  const behList=getBehavioralSignals(p);

  // Render Physiological Vitals
  $('#vitals').innerHTML=fields.map((f,i)=>`
    <button type="button" data-vital="${i}" aria-label="View hourly ${f[0]} chart" class="vital ${(p.v[i]!==null&&f[3](p.v[i]))?'warning':''}">
      <div class="vital-label">${icon(f[2])} ${f[0]}</div>
      <div class="vital-value">${p.v[i]??'—'}<small>${f[1]}</small></div>
      <div class="vital-status">${(p.v[i]!==null&&f[3](p.v[i]))?'Outside reference':p.v[i]===null?'Not measured':f[4]}</div>
      <span class="vital-chart-hint">View hourly chart ↗</span>
    </button>
  `).join('');

  $('#risk-number').textContent=p.risk??'—';
  $('#risk-change').textContent=p.risk===null?'Dataset observation · no risk model':p.risk>=70?'Elevated sepsis risk · immediate assessment':p.risk>=30?'Subtle changes detected · monitor closely':'Within normal baseline';
  $('#qsofa').textContent=s.qsofa??'—';
  $('#sirs').textContent=s.sirs??'—';
  
  for(const [id,n,total] of [['q-bars',s.qsofa,3],['s-bars',s.sirs,4]]){
    $('#'+id).innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('');
  }

  // Risk Trend Line Chart
  const vals=[8,10,9,13,12,21,19,29,34,31,48,55,p.risk-12,p.risk];
  const points=vals.map((v,i)=>[35+i*540/(vals.length-1),155-Math.max(2,v)*1.35]);
  const d=points.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ');
  $('#chart-line').setAttribute('d',d);
  $('#chart-area').setAttribute('d',`${d} L575,155 L35,155Z`);
  $('#chart-point').setAttribute('cx','575');
  $('#chart-point').setAttribute('cy',points.at(-1)[1]);
  $('.chart').style.visibility=p.risk===null?'hidden':'visible';

  // Explainable AI Reasoning
  const ds=drivers(p);
  const behFlags=behList.filter(b=>b.warning);
  
  if(p.risk===null){
    $('#explanation').textContent='Recorded dataset observations. No early risk score has been computed.';
    $('#clinical-context').textContent='Awaiting laboratory analysis and full clinical assessment.';
  } else if(p.risk>=70){
    $('#explanation').innerHTML=`<strong>Why this resident was flagged early:</strong> SeptiSense synthesized <strong>${behFlags.length} daily living warning signs</strong> (including ${behFlags.map(b=>b.title.toLowerCase()).join(' and ')}) alongside <strong>${ds.length} abnormal physiological vital signs</strong> (${ds.slice(0,2).join(', ')}).`;
    $('#clinical-context').textContent=`Senior residents frequently have 'silent sepsis' without fever. Here, the combination of acute tachypnea (RR ${p.v[1]}), cognitive lethargy (GCS ${p.v[5]}), and anorexia indicates systemic response requiring prompt bedside fluid hydration and urinalysis.`;
  } else if(p.risk>=30){
    $('#explanation').innerHTML=`<strong>Early monitoring alert:</strong> Mild early shifts noted. ${p.name} has decreased meal intake and slight respiratory change (${p.v[1]}/min). qSOFA is currently ${s.qsofa}/3.`;
    $('#clinical-context').textContent=`Small signs like reduced fluid intake and slight unsteadiness often precede acute illness by 24–48 hours in long-term care settings. Catching this now avoids an emergency room transfer.`;
  } else {
    $('#explanation').textContent=`Observations and daily living logs are within normal baseline. Resident is eating well, mobile, and cognitively intact.`;
    $('#clinical-context').textContent=`Routine daily surveillance continues across morning, afternoon, and night shift passes.`;
  }

  if(datasetRows.patientId!==p.id){datasetRows={patientId:p.id,rows:undefined};loadDatasetObservations();}
  renderDatasetObservations();

  $('#drivers').innerHTML=ds.slice(0,3).map(x=>`<span class="driver">↗ &nbsp;${x}</span>`).join('')||'<span class="driver">No physiological thresholds exceeded</span>';
  
  // KPI counts
  const count=patients.filter(p=>p.risk>=70&&p.alert_status!=='acknowledged').length;
  $('#high-stat').innerHTML=`0${count} <small>Needs early check</small>`;
  $('#high-caption').textContent=`${count} active early alert${count===1?'':'s'}`;
  $('#alert-count').textContent=count;
  
  const urgentCount = patients.filter(p=>p.risk>=70).length;
  const watchCount = patients.filter(p=>p.risk!==null&&p.risk>=30&&p.risk<70).length;
  const stableCount = patients.filter(p=>p.risk===null||p.risk<30).length;
  if($('#chip-urgent-count')) $('#chip-urgent-count').textContent=urgentCount;
  if($('#chip-watch-count')) $('#chip-watch-count').textContent=watchCount;
  if($('#chip-stable-count')) $('#chip-stable-count').textContent=stableCount;

  const scored=patients.filter(p=>p.risk!==null);
  $('#average').textContent=scored.length?'85':'—';
  $('#monitored-count').textContent=patients.length;
  $('#roster-count').textContent=patients.length;
  if($('#census-count')) $('#census-count').textContent=patients.length;
  $('#review').disabled=p.risk===null;
  $('#blink-btn').disabled=p.risk===null;
  $('#sbar-btn').disabled=p.risk===null;
}

// Latest recorded value for a PSV column; nothing is carried forward into later hours.
function lastRecorded(rows,key){
  for(let i=rows.length-1;i>=0;i--){const v=rows[i].raw_data[key];if(typeof v==='number')return {value:v,hour:Number(rows[i].hour)};}
  return null;
}
const psvNumber=v=>Number.isInteger(v)?v:Number(v.toFixed(2));

async function loadDatasetObservations(){
  const p=selected;
  if(!p)return;
  const request=++datasetRequest;
  let rows;
  try{rows=(await api('/api/vital-history?patient='+encodeURIComponent(p.id))).rows;}catch{rows=null;}
  if(request!==datasetRequest||selected?.id!==p.id)return;
  // Keep the last good table on a transient polling failure.
  if(rows===null&&datasetRows.patientId===p.id&&datasetRows.rows)return;
  datasetRows={patientId:p.id,rows};
  renderDatasetObservations();
}

// Always-visible stay & dataset context, shown where the behavioral signals used to be.
// Without PSV rows (demo residents or still loading), age and sex come from the resident record.
function renderStayContext(rows){
  const box=$('#psv-context');
  if(!selected||!box)return;
  const fallback={Age:selected.age,Gender:selected.sex==='Male'?1:selected.sex==='Female'?0:undefined};
  box.innerHTML=psvContext.map(([key,name,format])=>{
    const last=rows?.length?lastRecorded(rows,key):null;
    const value=last?last.value:fallback[key];
    const shown=value===undefined||value===null?'—':format(psvNumber(value));
    return `<div class="psv-cell ${shown==='—'?'missing':''}" title="${key}"><div class="psv-name">${name}</div><div class="psv-value">${shown}</div></div>`;
  }).join('');
  // Sepsis status badge beside the risk badge, from the dataset's SepsisLabel column.
  const status=$('#sepsis-status'),label=rows?.length?lastRecorded(rows,'SepsisLabel'):null;
  status.hidden=!label||(label.value!==0&&label.value!==1);
  if(!status.hidden){
    status.textContent=`Current status: ${label.value===1?'Positive':'Negative'}`;
    status.className=`badge ${label.value===1?'high':''}`;
    status.title=`SepsisLabel from the dataset, hour ${label.hour}`;
  }
}

function renderDatasetObservations(){
  const box=$('#psv-observations');
  if(!selected||!box)return;
  const rows=datasetRows.patientId===selected.id?datasetRows.rows:undefined;
  renderStayContext(rows);
  if(rows===undefined){box.innerHTML='<div class="psv-empty">Loading dataset observations…</div>';return;}
  if(rows===null){box.innerHTML='<div class="psv-empty">Unable to load dataset observations. Retrying…</div>';return;}
  if(!rows.length){
    box.innerHTML='<div class="psv-empty">No PSV dataset rows for this resident. Demo residents only carry the eight core vitals above; replay a PSV folder to see every dataset column.</div>';
    return;
  }
  const current=Number(rows.at(-1).hour);
  let measuredTotal=0,total=0;
  const group=(title,count,cells,flagged=0)=>{
    const open=openPsvGroups.has(title);
    return `<div class="psv-group ${open?'open':''}">
      <button type="button" class="psv-group-head" data-psv-group="${psvGroupTitles.indexOf(title)}" aria-expanded="${open}">
        <span><i class="psv-caret" aria-hidden="true">▸</i>${title}</span>
        <small>${flagged?`<b>${flagged} outside range</b> · `:''}${count}</small>
      </button>
      ${open?`<div class="psv-grid">${cells}</div>`:''}
    </div>`;
  };
  const groups=psvGroups.map(([title,items])=>{
    let measured=0,flagged=0;
    const cells=items.map(([key,name,unit,low,high])=>{
      total++;
      const last=lastRecorded(rows,key);
      const range=low===null?'':` · typical ${low}–${high} ${unit}`;
      if(!last)return `<button type="button" class="psv-cell missing" data-psv="${key}" title="${name} (${key})${range}"><div class="psv-name">${name}</div><div class="psv-value">—</div><div class="psv-when">Not measured yet</div></button>`;
      measured++;
      const flag=low===null?'':last.value<low?' ↓':last.value>high?' ↑':'';
      if(flag)flagged++;
      const ago=current-last.hour;
      return `<button type="button" class="psv-cell ${flag?'warning':''}" data-psv="${key}" title="${name} (${key})${range}">
        <div class="psv-name">${name}</div>
        <div class="psv-value">${psvNumber(last.value)}${flag}<small>${unit}</small></div>
        <div class="psv-when">Hour ${last.hour}${ago?` · ${ago} h ago`:' · current'}</div>
      </button>`;
    }).join('');
    measuredTotal+=measured;
    return group(title,`${measured}/${items.length} measured`,cells,flagged);
  });
  box.innerHTML=groups.join('')+`
    <p class="psv-note">Each value is the most recent recorded reading for that column; nothing is carried forward or imputed. Highlighting uses typical adult reference ranges and is for display only.</p>`;
}

// Latest recorded value for every PSV column, for the JSON export.
function datasetSnapshot(id){
  if(datasetRows.patientId!==id||!datasetRows.rows?.length)return null;
  const keys=[...psvGroups.flatMap(([,items])=>items.map(i=>i[0])),...psvContext.map(c=>c[0]),'SepsisLabel'];
  return Object.fromEntries(keys.map(key=>[key,lastRecorded(datasetRows.rows,key)]));
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

async function payload(p){
  const snapshot=structuredClone(p);
  const timestamp=new Date().toISOString();
  const vitals=Object.fromEntries(fields.map((f,i)=>[f[0],snapshot.v[i]]));
  const canonical=JSON.stringify({patient_id:`RES-${snapshot.id}`,timestamp,vitals});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))),b=>b.toString(16).padStart(2,'0')).join('');
  return {
    patient_id: `RES-${snapshot.id}`,
    resident_name: snapshot.name,
    timestamp,
    vitals,
    vitals_hash: hash,
    risk_score: snapshot.risk===null?null:snapshot.risk/100,
    risk_tier: label(snapshot),
    scores: scores(snapshot.v),
    key_drivers: drivers(snapshot),
    dataset_observations: datasetSnapshot(snapshot.id),
    behavioral_signals: getBehavioralSignals(snapshot),
    recommended_action: 'Initiate 30ml/kg oral/IV hydration bundle & obtain point-of-care urinalysis within 60 minutes.',
    blink_summary: `SeptiSense early warning (${snapshot.risk}%). ${drivers(snapshot).slice(0,3).join('; ')}. Care team review requested.`,
    simulation: true,
    model: 'Early Sepsis Detection Sentinel v1.0',
    action_url: snapshot.risk>=70?`/api/actions/sepsis-alert?patient=RES-${snapshot.id}&risk=${snapshot.risk/100}&hash=${hash}`:null
  };
}

// Generate SBAR Clinical Handoff for Doctors / Care Team
async function showSbarModal(){
  if(!selected) return;
  const p=selected, s=scores(p.v), loc=residentLocation(p), beh=getBehavioralSignals(p);
  const ds=drivers(p);
  
  const sbarText = `SBAR CLINICAL REPORT · EARLY SEPSIS DETECTION SENTINEL
Facility: Sepsis Hospital
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

[SITUATION]
Resident: ${p.name} (${loc.room}, ${loc.wing})
Age: ${p.age} years | Gender: ${p.sex} | Resident ID: RES-${p.id}
Primary Concern: Early warning for sepsis/deterioration flagged (Risk score: ${p.risk}%).

[BACKGROUND]
Admitted for post-acute care and recovery. Normal baseline: alert, ambulatory with assist x1.

[ASSESSMENT]
1. Daily Living & Behavioral Warning Signs:
${beh.map(b=>`   - ${b.title}: ${b.value} (${b.detail})`).join('\n')}
2. Physiological Vitals & Laboratory Markers:
   - Heart Rate: ${p.v[0]} bpm | Resp Rate: ${p.v[1]}/min | Blood Pressure: ${p.v[2]} mmHg
   - Temperature: ${p.v[3]} °C | SpO2: ${p.v[4]}% | GCS Mentation: ${p.v[5]}
   - WBC: ${p.v[6] || 'Pending'} | Lactate: ${p.v[7] || 'Pending'} mmol/L
3. Clinical Screening Scores:
   - qSOFA Score: ${s.qsofa}/3 | SIRS Criteria: ${s.sirs}/4
4. AI Early Warning Findings:
   - ${ds.join(', ') || 'Within screening parameters'}

[RECOMMENDATION]
1. Immediate bedside assessment by charge nurse.
2. Push oral/IV hydration (250–500 mL bolus) to prevent acute tissue hypoperfusion.
3. Order point-of-care urinalysis and CBC.
4. Physician sign-off requested via Solana Blink protocol.`;

  modal('SBAR Clinical Handoff Report', `
    <div class="sbar-modal-content">
      <div class="sbar-badge-row">
        <span class="badge ${tier(p)}">${p.name} · ${p.risk}% Risk</span>
        <span class="sbar-format-tag">Standard Geriatric Protocol</span>
      </div>
      <p class="sbar-intro">Ready for shift handoff, physician consultation, or EHR export.</p>
      <textarea class="sbar-textarea" id="sbar-text" readonly rows="14">${sbarText}</textarea>
      <div class="sbar-actions">
        <button class="button dark" id="copy-sbar">${icon('clipboard')} Copy SBAR to Clipboard</button>
        <button class="button secondary" id="close-sbar-btn">Close</button>
      </div>
    </div>
  `);

  $('#copy-sbar').onclick=()=>{
    navigator.clipboard.writeText(sbarText).then(()=>{
      notify('SBAR clinical report copied to clipboard!');
    }).catch(()=>{
      notify('Unable to access clipboard. Please copy manually.');
    });
  };
  $('#close-sbar-btn').onclick=()=>$('#modal').close();
}

// Review Solana Blink Modal
async function review(){
  await pendingSave;
  const current=selected;
  const p=await payload(current);
  if(current.hash){
    p.vitals_hash=current.hash;
    p.action_url=current.alert_id?'/api/actions/sepsis-alert?alert='+current.alert_id:null;
  }
  
  modal('Solana Blink · Emergency Order Protocol', `
    <div class="blink-preview-card">
      <div class="blink-header">
        <span class="blink-logo">${icon('zap')} SOLANA BLINK ACTION</span>
        <span class="badge ${tier(selected)}">${p.risk_tier} · ${Math.round(p.risk_score*100)}%</span>
      </div>
      <h3>Code Sepsis Early Protocol: ${p.resident_name}</h3>
      <p>${p.blink_summary}</p>
      <div class="blink-order-box">
        <strong>Authorized Clinical Order Bundle:</strong>
        <ul>
          <li>${icon('check')} Bedside IV Crystalloid Resuscitation (30 ml/kg)</li>
          <li>${icon('check')} Point-of-Care Blood & Urine Culture Labs</li>
          <li>${icon('check')} Continuous SpO2 & Respiratory Monitoring</li>
        </ul>
      </div>
      <p><strong>SHA-256 Observation Receipt (On-Chain Audit):</strong></p>
      <code>${p.vitals_hash}</code>
      <p><small>${p.action_url?'Solana Action URL ready for mobile wallet or clinical EHR integration.':'Resident is below the 70% emergency order threshold.'}</small></p>
      <div class="blink-btn-row">
        <button class="button dark" id="acknowledge">Acknowledge & Sign Receipt</button>
        <button class="button" id="copy-blink-link">Copy Action Link</button>
      </div>
      <p class="blink-footnote"><small>Fast 400ms Solana Devnet finality · Tamper-proof Golden Hour audit log</small></p>
    </div>
  `);

  $('#acknowledge').disabled=!current.alert_id||current.alert_status==='acknowledged';
  $('#acknowledge').textContent=current.alert_status==='acknowledged'?'Already acknowledged on-chain':'Acknowledge & Sign Receipt';
  
  $('#acknowledge').onclick=async()=>{
    try{
      await api('/api/acknowledge',{alert_id:current.alert_id});
      await refresh();
      $('#modal').close();
      notify('Acknowledgment logged to Tiger Data & Solana audit trail!');
    }catch(e){
      notify(e.message);
    }
  };

  $('#copy-blink-link').onclick=()=>{
    const link = `solana-action:${window.location.origin}${p.action_url||'/api/actions/sepsis-alert?patient=RES-'+p.patient_id}`;
    navigator.clipboard.writeText(link).then(()=>{
      notify('Solana Action Link copied!');
    });
  };
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
$('#sort').onclick=()=>{descending=!descending;renderList();};

document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
  filter=b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));
  renderList();
});

// Role Switcher (CNA / Director / Physician)
document.querySelectorAll('[data-role]').forEach(btn=>{
  btn.onclick=()=>{
    activeRole=btn.dataset.role;
    document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('active',x===btn));
    if(activeRole==='cna'){
      $('#user-avatar').textContent='MR';
      $('#user-name').textContent='Maria Rodriguez';
      $('#user-role-label').textContent='Certified Nursing Assistant (CNA)';
      $('#header-breadcrumb').textContent='CNA Shift Log & Behavioral Monitoring';
      notify('Switched to CNA Shift View: Highlighting meal intake & mobility changes.');
    } else if(activeRole==='director'){
      $('#user-avatar').textContent='KW';
      $('#user-name').textContent='Karen White, RN';
      $('#user-role-label').textContent='Wellness & Nursing Director';
      $('#header-breadcrumb').textContent='Unit-Wide Prevention & Protocol Compliance';
      notify('Switched to Director View: Tracking facility-wide ER diversion metrics.');
    } else {
      $('#user-avatar').textContent='SC';
      $('#user-name').textContent='Dr. Sarah Chen';
      $('#user-role-label').textContent='Attending Physician · Geriatrics';
      $('#header-breadcrumb').textContent='Physician Triage & Order Protocol';
      notify('Switched to Physician View: Diagnostic scores & Solana Blink orders active.');
    }
  };
});

document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
  if(b.dataset.view==='alerts'){
    modal('Early Alert Center', patients.filter(p=>p.risk>=70&&p.alert_status!=='acknowledged').map(p=>`
      <div class="audit-item">
        <strong>${p.name}</strong> · RES-${p.id}
        <p>${p.risk===null?'—':p.risk+'%'} early sepsis probability · charge nurse review requested</p>
        <button class="button" data-review="${p.id}">Review alert ↗</button>
      </div>
    `).join('')||'<p>No residents currently above the early alert threshold.</p>');
    
    document.querySelectorAll('[data-review]').forEach(x=>{
      x.onclick=()=>{
        selected=patients.find(p=>p.id===x.dataset.review);
        render();
        review();
      };
    });
  } else if(b.dataset.view==='audit'){
    modal('On-Chain & Database Audit Trail', audit.length?audit.map(a=>`
      <div class="audit-item">
        <small>${a.time}</small>
        ${a.text}
        <code>${a.hash}</code>
      </div>
    `).join(''):'<p>No actions recorded yet. Acknowledge an alert to record a receipt.</p>');
  } else {
    $('#search').value='';
    filter='all';
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x.dataset.filter==='all'));
    renderList();
  }
});

$('#export').onclick=async()=>{
  const p=await payload(selected);
  const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
  const a=document.createElement('a');
  a.href=url;
  a.download=`septisense-resident-${p.patient_id}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('Resident care report exported as JSON');
};

let runId=crypto.randomUUID(),pendingSave=Promise.resolve();
async function api(path,data){
  const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
  const result=await r.json();
  if(!r.ok)throw Error(result.error||'Request failed');
  return result;
}

async function refresh(){
  const [rows,events]=await Promise.all([api('/api/patients'),api('/api/audit')]);
  const id=selected?.id;
  patients.splice(0,patients.length,...rows);
  selected=patients.find(p=>p.id===id)||patients[0];
  audit.splice(0,audit.length,...events.map(e=>({...e,time:new Date(e.time).toLocaleString()})));
  render();
  loadDatasetObservations();
  $('.system').innerHTML='<span class="dot"></span> Patient database connected<small>Auto-refresh every 3 seconds</small>';
}

async function initializeDashboard(){
  try{
    await refresh();
    original=structuredClone(patients[0]);
  }catch(e){
    $('.system').textContent='Database unavailable';
    $('#patient-list').innerHTML='<div class="empty">Unable to load residents. Check the server and reload.</div>';
    for(const id of ['review','export','blink-btn','sbar-btn'])$('#'+id).disabled=true;
    notify(e.message);
  }
}

initializeDashboard();

let polling=false;
setInterval(async()=>{
  if(polling||timer)return;
  polling=true;
  try{
    await pendingSave;
    await refresh();
  }catch{ 
    $('.system').textContent='Connection interrupted · retrying'; 
  }finally{
    polling=false;
  }
},3000);

// Vital history modal
const vitalKeys=['HR','Resp','SBP','Temp','O2Sat','GCS','WBC','Lactate'];
let historySelection=null,historyRequest=0;

$('#vitals').addEventListener('click',event=>{
  const button=event.target.closest('[data-vital]');
  if(!button)return;
  const index=Number(button.dataset.vital);
  openHistory(vitalKeys[index],fields[index][0],fields[index][1]);
});

$('#psv-observations').addEventListener('click',event=>{
  const toggle=event.target.closest('[data-psv-group]');
  if(toggle){
    const title=psvGroupTitles[Number(toggle.dataset.psvGroup)];
    if(openPsvGroups.has(title))openPsvGroups.delete(title);else openPsvGroups.add(title);
    renderDatasetObservations();
    $(`[data-psv-group="${toggle.dataset.psvGroup}"]`)?.focus();
    return;
  }
  const button=event.target.closest('[data-psv]');
  if(!button)return;
  const item=psvGroups.flatMap(([,items])=>items).find(i=>i[0]===button.dataset.psv);
  if(item)openHistory(item[0],item[1],item[2]);
});

function openHistory(key,label,unit){
  historySelection={patientId:selected.id,name:selected.name,key,label,unit};
  modal(`${label} · ${selected.name}`,'<p>Loading hourly observations…</p>');
  loadVitalHistory();
}

$('#modal').addEventListener('close',()=>{historySelection=null;historyRequest++;});

async function loadVitalHistory(){
  const selection=historySelection;
  if(!selection||!$('#modal').open)return;
  const request=++historyRequest;
  try{
    const data=await api('/api/vital-history?patient='+encodeURIComponent(selection.patientId));
    if(request!==historyRequest||historySelection!==selection||!$('#modal').open)return;
    const field=[selection.label,selection.unit],key=selection.key;
    const rows=data.rows.map(r=>({hour:Number(r.hour),value:typeof r.raw_data[key]==='number'?r.raw_data[key]:null}));
    const measured=rows.filter(r=>r.value!==null);
    if(!measured.length){
      $('#modal-body').innerHTML='<div class="history-empty">No recorded measurements for this vital yet.<small>Missing readings are not treated as zero.</small></div>';
      return;
    }
    const width=680,height=270,left=55,right=22,top=22,bottom=43;
    const first=rows[0].hour,last=rows.at(-1).hour;
    const values=measured.map(r=>r.value),min=Math.min(...values),max=Math.max(...values),padding=(max-min)*.15||Math.abs(max)*.1||1;
    // Some PSV columns (base excess, hospital admit time) are legitimately negative.
    const low=min>=0?Math.max(0,min-padding):min-padding,high=max+padding;
    const x=h=>left+(h-first)/Math.max(last-first,1)*(width-left-right);
    const y=v=>height-bottom-(v-low)/(high-low)*(height-top-bottom);
    const fmt=v=>Number(v.toFixed(2));
    let grid='';
    for(let i=0;i<5;i++){
      const value=low+(high-low)*i/4;
      grid+=`<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" stroke="#e4ebe5"/><text x="${left-10}" y="${y(value)+4}" text-anchor="end">${fmt(value)}</text>`;
    }
    const ticks=new Set(Array.from({length:Math.min(7,last-first+1)},(_,i)=>Math.round(first+(last-first)*i/Math.max(1,Math.min(6,last-first)))));
    for(const hour of ticks)grid+=`<text x="${x(hour)}" y="${height-20}" text-anchor="middle">${hour}</text>`;
    let line='',previous=null;
    for(const r of rows){
      if(r.value===null){previous=null;continue;}
      line+=`${previous!==null&&r.hour===previous+1?'L':'M'}${x(r.hour)},${y(r.value)} `;
      previous=r.hour;
    }
    const dots=measured.map(r=>`<circle tabindex="0" aria-label="Hour ${r.hour}: ${r.value} ${field[1]}" cx="${x(r.hour)}" cy="${y(r.value)}" r="4" fill="#2d6e53" stroke="white" stroke-width="2"><title>Hour ${r.hour}: ${r.value} ${field[1]}</title></circle>`).join('');
    const details=rows.map(r=>`<tr><td>Hour ${r.hour}</td><td>${r.value===null?'Not measured':r.value+' '+field[1]}</td></tr>`).join('');
    $('#modal-body').innerHTML=`
      <div class="history-summary">
        <span>${measured.length} hourly readings · trend trajectory</span>
        <strong>${measured.at(-1).value} <small>${field[1]}</small></strong>
      </div>
      <svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${field[0]} by observation hour">${grid}<path d="${line}" fill="none" stroke="#2d6e53" stroke-width="2.5"/>${dots}</svg>
      <div class="history-axis">Care Observation Hour</div>
      <p class="history-note">${field[1]} · Continuous surveillance stream. Gaps indicate unmeasured labs.</p>
      <details><summary>View hourly values table</summary><div class="history-table"><table><thead><tr><th>Hour</th><th>${field[0]}</th></tr></thead><tbody>${details}</tbody></table></div></details>
    `;
  }catch(e){
    if(request===historyRequest&&historySelection===selection)$('#modal-body').innerHTML='<p>Unable to load hourly history.</p>';
  }
}

setInterval(()=>{if(historySelection&&$('#modal').open)loadVitalHistory()},3000);

$('#delete-patient').onclick=()=>{
  if(!selected)return;
  const patient={...selected};
  historySelection=null;
  historyRequest++;
  modal('Delete resident data?',`
    <p id="delete-description">Delete all stored records for ${patient.name}?</p>
    <p>This removes observations, predictions, alerts, and acknowledgments. Local files are kept.</p>
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
    <p>This permanently deletes <strong>every resident</strong> and all saved observations. You can restore them anytime using <strong>Reset demo cohort</strong>.</p>
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
      notify(`${result.count} residents and records deleted. Click Reset Demo Cohort to restore.`);
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
