var SEARCH_ENDPOINT = '/.netlify/functions/search';
var DR_ENDPOINT     = '/.netlify/functions/deepresearch';
var CACHE_KEY   = "sch_hunter_v7";
var lastData    = null;
var curStep     = 1;
var drList      = [];

// ── CARD STATE — one function controls everything ─────────────────────────────
// states: 's1' | 's2' | 's3' | 'loader' | 'error'
function setCard(state) {
  var stepbar = document.getElementById('stepbar-wrap');
  var s1      = document.getElementById('s1wrap');
  var s2      = document.getElementById('s2wrap');
  var s3      = document.getElementById('s3wrap');
  var loader  = document.getElementById('loader-wrap');
  var err     = document.getElementById('error-wrap');

  stepbar.style.display = (state==='s1'||state==='s2'||state==='s3') ? 'block' : 'none';
  s1.style.display      = state==='s1'     ? 'block' : 'none';
  s2.style.display      = state==='s2'     ? 'block' : 'none';
  s3.style.display      = state==='s3'     ? 'block' : 'none';
  loader.style.display  = state==='loader' ? 'block' : 'none';
  err.style.display     = state==='error'  ? 'block' : 'none';
}

// ── STEP BAR ──────────────────────────────────────────────────────────────────
function updateBar(s) {
  curStep = s;
  for(var i=1;i<=3;i++){
    var d = document.getElementById('sd'+i);
    d.className = 'step-dot' + (i<s?' done':(i===s?' act':''));
  }
  document.getElementById('sl1').className = 'step-line' + (s>1?' done':'');
  document.getElementById('sl2').className = 'step-line' + (s>2?' done':'');
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function goNext(from) {
  if(from===1 && !val1()) return;
  if(from===2 && !val2()) return;
  updateBar(from+1);
  setCard('s'+(from+1));
}
function goBack(from) {
  updateBar(from-1);
  setCard('s'+(from-1));
}

// ── VALIDATION ────────────────────────────────────────────────────────────────
function hl(id){ var e=document.getElementById(id); e.style.borderColor='#e53e3e'; setTimeout(function(){e.style.borderColor='';},2200); }
function val1(){
  var fs=['s1_name','s1_age','s1_gender','s1_citizenship','s1_residence'];
  var ls=['full name','age','gender','country of citizenship','country of residence'];
  for(var i=0;i<fs.length;i++){
    if(!document.getElementById(fs[i]).value.trim()){hl(fs[i]);alert('Please enter your '+ls[i]+'.');return false;}
  }
  return true;
}
function val2(){
  if(!document.getElementById('s2_level').value){alert('Please select your study level.');return false;}
  if(!document.getElementById('s2_field').value.trim()){hl('s2_field');alert('Please enter your field of study.');return false;}
  return true;
}

// ── SCORE TOGGLE ──────────────────────────────────────────────────────────────
function toggleScore(sid,bid,lid){
  var v=document.getElementById(sid).value;
  if(v){document.getElementById(bid).classList.add('show');document.getElementById(lid).textContent=v+' Score';}
  else{document.getElementById(bid).classList.remove('show');}
}

// ── COLLECT DATA ──────────────────────────────────────────────────────────────
function collectData(){
  var ecas=[];
  document.querySelectorAll('input[name=eca]:checked').forEach(function(c){ecas.push(c.value);});
  return{
    name:document.getElementById('s1_name').value.trim(),
    age:document.getElementById('s1_age').value.trim(),
    gender:document.getElementById('s1_gender').value.trim(),
    citizenship:document.getElementById('s1_citizenship').value.trim(),
    residence:document.getElementById('s1_residence').value.trim(),
    studyLevel:document.getElementById('s2_level').value,
    fieldOfStudy:document.getElementById('s2_field').value.trim(),
    gpa:document.getElementById('s2_gpa').value.trim(),
    university:document.getElementById('s2_uni').value.trim(),
    engTest:document.getElementById('s2_eng').value,
    engScore:document.getElementById('s2_eng_score').value.trim(),
    stdTest:document.getElementById('s2_std').value,
    stdScore:document.getElementById('s2_std_score').value.trim(),
    prefCountry:document.getElementById('s3_country').value.trim(),
    prefRegion:document.getElementById('s3_region').value,
    prefDegree:document.getElementById('s3_degree').value,
    prefField:document.getElementById('s3_pfield').value.trim(),
    schType:document.getElementById('s3_type').value,
    workExp:document.getElementById('s3_work').value.trim(),
    deadline:document.getElementById('s3_deadline').value,
    studyMode:document.getElementById('s3_mode').value,
    eca:ecas
  };
}

function fillForm(d){
  if(!d)return;
  function sv(id,v){var e=document.getElementById(id);if(e&&v!=null)e.value=v;}
  sv('s1_name',d.name);sv('s1_age',d.age);sv('s1_gender',d.gender);
  sv('s1_citizenship',d.citizenship);sv('s1_residence',d.residence);
  sv('s2_level',d.studyLevel);sv('s2_field',d.fieldOfStudy);
  sv('s2_gpa',d.gpa);sv('s2_uni',d.university);
  sv('s2_eng',d.engTest);
  if(d.engTest){document.getElementById('eng_score_box').classList.add('show');document.getElementById('eng_score_lbl').textContent=d.engTest+' Score';}
  sv('s2_eng_score',d.engScore);sv('s2_std',d.stdTest);
  if(d.stdTest){document.getElementById('std_score_box').classList.add('show');document.getElementById('std_score_lbl').textContent=d.stdTest+' Score';}
  sv('s2_std_score',d.stdScore);sv('s3_country',d.prefCountry);sv('s3_region',d.prefRegion);
  sv('s3_degree',d.prefDegree);sv('s3_pfield',d.prefField);sv('s3_type',d.schType);
  sv('s3_work',d.workExp);sv('s3_deadline',d.deadline);sv('s3_mode',d.studyMode);
  if(d.eca&&d.eca.length)document.querySelectorAll('input[name=eca]').forEach(function(cb){cb.checked=d.eca.indexOf(cb.value)>=0;});
}

// ── CACHE ─────────────────────────────────────────────────────────────────────
function saveCache(d){try{localStorage.setItem(CACHE_KEY,JSON.stringify(d));}catch(e){}}
function loadCache(){try{var s=localStorage.getItem(CACHE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function clearCache(){try{localStorage.removeItem(CACHE_KEY);}catch(e){}}

function cacheYes(){document.getElementById('cache-popup').style.display='none';var c=loadCache();fillForm(c);runSearch(c);}
function cacheNo(){document.getElementById('cache-popup').style.display='none';clearCache();}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
function handleSubmit(){var d=collectData();saveCache(d);runSearch(d);}

// ── PAGE SWITCH ───────────────────────────────────────────────────────────────
function goHome(){
  document.getElementById('form-page').style.display='';
  document.getElementById('results-page').style.display='none';
  updateBar(1);
  setCard('s1');
  window.scrollTo({top:0,behavior:'smooth'});
}
function resetToForm(){
  updateBar(curStep);
  setCard('s'+curStep);
}
function showResults(){
  document.getElementById('form-page').style.display='none';
  document.getElementById('results-page').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── LOADER ────────────────────────────────────────────────────────────────────
var ldInt=null, ldStep=1, coffeeT=null;
function startLoader(){
  setCard('loader');
  document.getElementById('coffee-msg').style.display='none';
  for(var i=1;i<=6;i++){var e=document.getElementById('ls'+i);if(e)e.className='lstep';}
  if(ldInt)clearInterval(ldInt);
  if(coffeeT)clearTimeout(coffeeT);
  ldStep=1;
  document.getElementById('ls1').className='lstep on';
  ldInt=setInterval(function(){
    var c=document.getElementById('ls'+ldStep);if(c)c.className='lstep done';
    ldStep++;if(ldStep>6){for(var i=1;i<=6;i++){var e=document.getElementById('ls'+i);if(e)e.className='lstep';}ldStep=1;}
    var n=document.getElementById('ls'+ldStep);if(n)n.className='lstep on';
  },4000);
  coffeeT=setTimeout(function(){document.getElementById('coffee-msg').style.display='block';},18000);
}
function stopLoader(){
  if(ldInt){clearInterval(ldInt);ldInt=null;}
  if(coffeeT){clearTimeout(coffeeT);coffeeT=null;}
}

// -- PROMPT BUILDER ----------------------------------------------------------
function buildPrompt(p){
  var now=new Date();
  var cy=now.getFullYear();
  var cm=now.getMonth();
  var minD=new Date(now), maxD=new Date(now);
  var dlText='';
  if(p.deadline==='Within 3 months'){
    maxD.setMonth(cm+3);
    dlText='Deadline between today and '+maxD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'. NO past deadlines.';
  } else if(p.deadline==='3-6 months'){
    minD.setMonth(cm+3); maxD.setMonth(cm+6);
    dlText='Deadline between '+minD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+' and '+maxD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'.';
  } else if(p.deadline==='6-12 months'){
    minD.setMonth(cm+6); maxD.setMonth(cm+12);
    dlText='Deadline between '+minD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+' and '+maxD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'.';
  } else if(p.deadline==='12-24 months'){
    minD.setMonth(cm+12); maxD.setMonth(cm+24);
    dlText='Deadline between '+minD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+' and '+maxD.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'.';
  } else {
    dlText='Deadline must be after '+now.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'.';
  }
  var deg=p.prefDegree||p.studyLevel||"Bachelor's";
  var fld=p.prefField||p.fieldOfStudy||'any';
  var cit=p.citizenship||'international';
  var loc=p.prefCountry||(p.prefRegion?'region: '+p.prefRegion:null)||'any country';
  var fund=p.schType||'any';
  var profile=[
    'Citizenship: '+cit,
    'Age: '+(p.age||'N/A')+', Gender: '+(p.gender||'N/A'),
    'Current study level: '+p.studyLevel,
    'Field of study: '+p.fieldOfStudy,
    p.gpa?'GPA/CGPA: '+p.gpa:null,
    p.university?'University: '+p.university:null,
    p.engTest?'English test: '+p.engTest+(p.engScore?' score '+p.engScore:''):null,
    p.stdTest?'Standardized test: '+p.stdTest+(p.stdScore?' score '+p.stdScore:''):null,
    p.workExp?'Work experience: '+p.workExp:null,
    (p.eca&&p.eca.length)?'Extracurriculars: '+p.eca.join(', '):null,
    '--- PREFERENCES ---',
    'Preferred degree: '+deg,
    'Preferred field: '+fld,
    'Preferred country/region: '+loc,
    'Scholarship type: '+fund,
    p.studyMode?'Study mode: '+p.studyMode:null,
    'Deadline window: '+dlText
  ].filter(Boolean).join('\n');
  // Map degree to related levels for context
  var degMap={
    "Bachelor's":    "undergraduate / bachelor's degree programs ONLY. Do NOT include Master's, PhD, or postgraduate.",
    "Master's":      "postgraduate master's degree programs ONLY. Do NOT include Bachelor's or PhD.",
    "PhD":           "doctoral / PhD programs ONLY. Do NOT include Bachelor's or Master's.",
    "High School":   "high school students ONLY. Do NOT include university-level programs.",
    "Diploma":       "diploma programs ONLY.",
    "PG Diploma":    "postgraduate diploma programs ONLY."
  };
  var degRule = degMap[deg] || ('"'+deg+'" level ONLY. No other degree level allowed.');

  return 'You are a scholarship advisor. Today is '+now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'.\n\n'
    +'TASK: Find 8 REAL currently open scholarships for this student.\n\n'
    +'STUDENT PROFILE:\n'+profile+'\n\n'
    +'=== NON-NEGOTIABLE RULES (break any = invalid) ===\n'
    +'RULE 1 - DEGREE [MOST IMPORTANT]: Every single scholarship must target '+degRule+'\n'
    +'  - If a scholarship is for any other degree level, EXCLUDE IT. No exceptions.\n'
    +'  - Double-check: is this scholarship specifically for '+deg+' students? If not, skip it.\n'
    +'RULE 2 - DEADLINE: '+dlText+' Never include past deadlines.\n'
    +'RULE 3 - CITIZENSHIP: All scholarships must accept '+cit+' applicants.\n'
    +(p.schType?'RULE 4 - FUNDING: EVERY scholarship must be "'+p.schType+'". Exclude all others.\n':'')
    +((p.prefCountry||p.prefRegion)?'RULE 5 - LOCATION: ONLY include scholarships hosted in '+loc+'. Exclude all others.\n':'')
    +'RULE 6 - FORMAT: Respond ONLY with valid JSON. Zero markdown, zero extra text.\n\n'
    +'JSON format:\n'
    +'{"scholarships":[{"name":"Official Name","country":"Country","degree":"'+deg+'","funding":"Fully Funded","amount":"details","deadline":"Month YYYY","url":"https://official.com","description":"2-3 sentences","matchScore":90,"matchReasons":["reason1","reason2","reason3"]}]}';
}

// -- SHORT SEARCH QUERY FOR TAVILY ------------------------------------------
function buildSearchQuery(p){
  var deg = p.prefDegree || p.studyLevel || "Bachelor's";
  var fld = p.prefField || p.fieldOfStudy || '';
  var loc = p.prefCountry || (p.prefRegion ? p.prefRegion : '') || '';
  var fund = p.schType || '';
  var parts = ['scholarships', deg, fld, loc, fund, '2025 2026 open applications international students'];
  return parts.filter(Boolean).join(' ').slice(0, 200);
}

// -- OPENROUTER FETCH ---------------------------------------------------------
async function fetchWithRetry(prompt, query, attempts){
  attempts = attempts || 3;
  var lastErr;
  for(var i=0; i<attempts; i++){
    if(i>0){
      var wait = i * 2000; // 2s, 4s backoff
      await new Promise(function(r){setTimeout(r,wait);});
      console.log('[ASH] Retry attempt '+(i+1)+'...');
    }
    try{
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function(){controller.abort();}, 55000) : null;
      var res = await fetch(SEARCH_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: prompt, query: query}),
        signal: controller ? controller.signal : undefined
      });
      if(timeoutId) clearTimeout(timeoutId);
      if(!res.ok){
        if(res.status===401||res.status===403) throw new Error('API key invalid.');
        if(res.status===429) throw new Error('Rate limit. Please wait a moment and try again.');
        if(res.status===402) throw new Error('Credits exhausted.');
        if(res.status>=500){ lastErr=new Error('Server error ('+res.status+'). Retrying...'); continue; }
        throw new Error('API error: HTTP '+res.status);
      }
      var data = await res.json();
      console.log('[ASH] API response attempt '+(i+1)+':', JSON.stringify(data).slice(0,300));
      var raw=((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'').trim();
      if(!raw){ lastErr=new Error('Empty response.'); continue; }
      raw=raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
      var parsed;
      try{ parsed=JSON.parse(raw); }
      catch(e){
        var m=raw.match(/\{[\s\S]*\}/);
        if(!m){ lastErr=new Error('Could not parse results.'); continue; }
        try{ parsed=JSON.parse(m[0]); }
        catch(e2){ lastErr=new Error('Could not parse results.'); continue; }
      }
      var list=Array.isArray(parsed)?parsed:(parsed.scholarships||[]);
      if(!list.length){ lastErr=new Error('No scholarships found. Try broadening preferences.'); continue; }
      return list;
    }catch(e){
      if(e.name==='AbortError'){ lastErr=new Error('Request timed out. Check your connection.'); continue; }
      if(e.message==='API key invalid.'||e.message.indexOf('Credits')>=0||e.message.indexOf('Rate limit')>=0) throw e;
      lastErr=e; continue;
    }
  }
  throw lastErr || new Error('Search failed after '+attempts+' attempts. Please try again.');
}

async function fetchScholarships(p){
  var prompt=buildPrompt(p);
  var query=buildSearchQuery(p);
  try{
    return await fetchWithRetry(prompt, query, 3);
  }catch(e){
    if(e.message.indexOf('file://')>=0||e.message==='Failed to fetch'){
      throw new Error('Network error. Make sure you are using a local server (not file://).');
    }
    throw e;
  }
}

// ── DEADLINE FILTER (client-side enforcement) ─────────────────────────────────
function deadlineInRange(deadlineStr, preference){
  if(!deadlineStr || !preference) return true; // no filter if missing
  // Parse "Month YYYY" e.g. "March 2026"
  var d = new Date(deadlineStr);
  if(isNaN(d.getTime())){
    // Try "Month YYYY" manually
    var parts = deadlineStr.trim().split(/\s+/);
    if(parts.length>=2){
      d = new Date(parts[0]+' 1, '+parts[parts.length-1]);
    }
  }
  if(isNaN(d.getTime())) return true; // can't parse, keep it

  var now = new Date();
  now.setHours(0,0,0,0);
  var cm = now.getMonth();
  var minD = new Date(now);
  var maxD = new Date(now);

  if(preference==='Within 3 months'){
    maxD.setMonth(cm+3);
    return d >= now && d <= maxD;
  } else if(preference==='3-6 months'){
    minD.setMonth(cm+3);
    maxD.setMonth(cm+6);
    return d >= minD && d <= maxD;
  } else if(preference==='6-12 months'){
    minD.setMonth(cm+6);
    maxD.setMonth(cm+12);
    return d >= minD && d <= maxD;
  } else if(preference==='12-24 months'){
    minD.setMonth(cm+12);
    maxD.setMonth(cm+24);
    return d >= minD && d <= maxD;
  }
  return d >= now; // default: just not past
}

// ── MAIN SEARCH ───────────────────────────────────────────────────────────────
async function runSearch(data){
  lastData=data;
  startLoader();
  try{
    var list=await fetchScholarships(data);
    // Client-side deadline enforcement
    if(data.deadline){
      var filtered=list.filter(function(s){
        return deadlineInRange(s.deadline, data.deadline);
      });
      // Only use filtered if it has results; otherwise show all with warning
      if(filtered.length>0) list=filtered;
      else console.warn('[ASH] Deadline filter removed all results — showing unfiltered.');
    }
    list.sort(function(a,b){return(b.matchScore||0)-(a.matchScore||0);});
    stopLoader();
    buildResults(list,data);
    showResults();
  }catch(err){
    stopLoader();
    document.getElementById('error-msg').textContent=err.message||'Something went wrong.';
    setCard('error');
  }
}
function retrySearch(){if(lastData)runSearch(lastData);else goHome();}

// ── RESULT HELPERS ────────────────────────────────────────────────────────────
function mc(s){if(s>=90)return{c:'#16a34a',r:'#16a34a'};if(s>=75)return{c:'#1d4ed8',r:'#3b82f6'};return{c:'#ca8a04',r:'#eab308'};}
function fbadge(f){
  if(!f)return'';var fl=f.toLowerCase();
  if(fl.indexOf('fully')>=0)return'<span class="bf">&#10003; Fully Funded</span>';
  if(fl.indexOf('partial')>=0)return'<span class="bp">Partial</span>';
  if(fl.indexOf('research')>=0)return'<span class="br">Research</span>';
  if(fl.indexOf('fellow')>=0)return'<span class="br">Fellowship</span>';
  return'<span class="bt">Tuition</span>';
}
function flag(c){
  var m={'usa':'&#127482;&#127480;','united states':'&#127482;&#127480;','uk':'&#127468;&#127463;','united kingdom':'&#127468;&#127463;','germany':'&#127465;&#127466;','australia':'&#127462;&#127482;','canada':'&#127464;&#127462;','japan':'&#127471;&#127477;','south korea':'&#127472;&#127479;','korea':'&#127472;&#127479;','turkey':'&#127481;&#127479;','switzerland':'&#127464;&#127469;','china':'&#127464;&#127475;','singapore':'&#127480;&#127468;','netherlands':'&#127475;&#127473;','sweden':'&#127480;&#127466;','norway':'&#127475;&#127476;','hungary':'&#127469;&#127482;','malaysia':'&#127474;&#127486;','russia':'&#127479;&#127482;','europe':'&#127466;&#127482;'};
  return m[(c||'').toLowerCase()]||'&#127758;';
}

// ── BUILD RESULTS ─────────────────────────────────────────────────────────────
function buildResults(list,p){
  drList=list;
  var pills=[p.name,p.studyLevel,p.fieldOfStudy,p.citizenship,p.prefDegree,p.schType].filter(Boolean);
  document.getElementById('profile-bar').innerHTML='<span style="font-size:.78rem;font-weight:800;color:#8ab0cc;margin-right:6px;">YOUR PROFILE:</span>'+pills.map(function(x){return'<span class="ppill">'+x+'</span>';}).join('');
  document.getElementById('res-sub').textContent='Found '+list.length+' scholarships matching your profile';
  var medals=['&#129351;','&#129352;','&#129353;'];
  var rankC=['#f6ad55','#a0aec0','#cd7f32'];
  document.getElementById('res-list').innerHTML=list.map(function(s,i){
    var m=mc(s.matchScore||75);
    var r=(s.matchReasons||[]).slice(0,3);
    var score=s.matchScore||75;
    var circ=2*Math.PI*26,offset=circ*(1-score/100);
    var rnk=i<3
      ?'<span style="font-size:.7rem;font-weight:900;color:'+rankC[i]+';margin-right:6px;">'+medals[i]+'</span>'
      :'<span style="font-size:.75rem;font-weight:900;color:#8ab0cc;margin-right:6px;">#'+(i+1)+'</span>';
    return'<div class="rcard" style="position:relative;overflow:hidden;">'
      +(i<3?'<div style="position:absolute;top:0;left:0;right:0;height:4px;background:'+rankC[i]+';border-radius:18px 18px 0 0;"></div>':'')
      +'<div style="display:flex;align-items:flex-start;gap:14px;">'
        +'<div style="flex:1;min-width:0;">'
          +'<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:5px;">'+rnk
            +'<h3 style="font-size:.95rem;font-weight:900;color:#1a3050;margin:0;line-height:1.3;">'+(s.name||'Scholarship')+'</h3>'
          +'</div>'
          +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">'
            +'<span style="font-size:.8rem;color:#6a8aaa;font-weight:700;">'+flag(s.country)+' '+(s.country||'')+'</span>'
            +fbadge(s.funding)
            +(s.degree?'<span style="font-size:.72rem;font-weight:800;color:#4a7090;background:#f0f8ff;border:1.5px solid #d0e8f8;border-radius:999px;padding:2px 8px;">'+s.degree+'</span>':'')
          +'</div>'
          +'<p style="font-size:.79rem;color:#6a8aaa;margin:0 0 8px;line-height:1.55;">'+(s.description||'')+'</p>'
          +'<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:8px;">'
            +(s.amount?'<div style="font-size:.77rem;font-weight:800;color:#2474c8;">&#128176; '+s.amount+'</div>':'')
            +(s.deadline?'<div style="font-size:.77rem;font-weight:700;color:#e07820;">&#8987; Deadline: '+s.deadline+'</div>':'')
          +'</div>'
          +(r.length?'<div style="background:#f8fbff;border-radius:10px;padding:8px 12px;margin-bottom:10px;border:1px solid #e0eefa;">'
            +'<div style="font-size:.68rem;font-weight:900;color:#8ab0cc;margin-bottom:4px;">WHY IT MATCHES YOU</div>'
            +r.map(function(x){return'<div style="font-size:.76rem;color:#4a7090;font-weight:700;margin-bottom:2px;">&#10003; '+x+'</div>';}).join('')
          +'</div>':'')
          +(s.url?'<a href="'+s.url+'" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#2474c8,#3a9de8);color:#fff;font-weight:800;font-size:.82rem;padding:8px 18px;border-radius:9px;text-decoration:none;">Apply Now &#8594;</a>':'')
          +'<button onclick="drOpen('+i+')" style="margin-left:8px;margin-top:6px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:800;font-size:.82rem;padding:8px 18px;border-radius:9px;border:none;cursor:pointer;">Deep Research</button>'
        +'</div>'
        +'<div style="flex-shrink:0;"><div style="position:relative;width:62px;height:62px;">'
          +'<svg width="62" height="62" viewBox="0 0 62 62" style="transform:rotate(-90deg);">'
            +'<circle cx="31" cy="31" r="26" fill="none" stroke="#e0eefa" stroke-width="5"/>'
            +'<circle cx="31" cy="31" r="26" fill="none" stroke="'+m.r+'" stroke-width="5" stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'" stroke-linecap="round"/>'
          +'</svg>'
          +'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
            +'<span style="font-size:.85rem;font-weight:900;color:'+m.c+';line-height:1;">'+score+'%</span>'
            +'<span style="font-size:.55rem;font-weight:700;color:#8ab0cc;line-height:1;">match</span>'
          +'</div>'
        +'</div></div>'
      +'</div>'
    +'</div>';
  }).join('');
}


// -- DEEP RESEARCH ------------------------------------------------------------
function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function drOpen(idx){
  var s=drList[idx]; if(!s)return;
  var p=lastData||{};
  var dark=isDark; // capture current theme
  var tab=window.open('','_blank');
  if(!tab){alert('Allow popups to use Deep Research.');return;}

  // Loading page — theme-aware
  var lBg  = dark ? 'linear-gradient(135deg,#0d1b2e,#112240)' : 'linear-gradient(135deg,#f3e8ff,#ede9fe)';
  var lSpin= dark ? '#1e3a5f' : '#ddd6fe';
  var lSpT = dark ? '#63b3ed' : '#7c3aed';
  var lH   = dark ? '#c8dff0' : '#4c1d95';
  var lP   = dark ? '#7aa8cc' : '#7c6aaa';
  var lRow = dark ? '#3a5a7a' : '#c4b5e0';
  var lDot = dark ? '#1e3a5f' : '#ddd6fe';

  var lhtml=[
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    '<title>Deep Research</title>',
    '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">',
    '<style>',
    'body{font-family:Nunito,sans-serif;margin:0;min-height:100vh;background:'+lBg+';display:flex;align-items:center;justify-content:center;}',
    '.box{text-align:center;padding:40px 24px;}',
    '.sp{width:60px;height:60px;border:5px solid '+lSpin+';border-top:5px solid '+lSpT+';border-radius:50%;animation:sp 1s linear infinite;margin:0 auto 20px;}',
    '@keyframes sp{to{transform:rotate(360deg);}}',
    '.row{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:700;color:'+lRow+';padding:6px 0;}',
    '.dot{width:9px;height:9px;border-radius:50%;background:'+lDot+';}',
    '</style></head><body>',
    '<div class="box">',
    '<div class="sp"></div>',
    '<h2 style="font-size:1.2rem;color:'+lH+';margin-bottom:8px;">Deep Research in Progress...</h2>',
    '<p style="color:'+lP+';font-size:.88rem;margin-bottom:20px;">Researching <strong>'+esc(s.name||'')+'</strong></p>',
    '<div style="text-align:left;max-width:280px;margin:0 auto;">',
    '<div class="row"><div class="dot"></div>Analyzing scholarship details</div>',
    '<div class="row"><div class="dot"></div>Checking requirements</div>',
    '<div class="row"><div class="dot"></div>Searching Reddit and blogs</div>',
    '<div class="row"><div class="dot"></div>Finding past recipient stories</div>',
    '<div class="row"><div class="dot"></div>Looking up YouTube videos</div>',
    '<div class="row"><div class="dot"></div>Compiling your report</div>',
    '</div></div></body></html>'
  ].join('');
  tab.document.open(); tab.document.write(lhtml); tab.document.close();

  // Build prompt
  var plines=[
    'You are a scholarship research expert. Today: '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'.',
    'Do a DEEP RESEARCH on this scholarship for this student.',
    'SCHOLARSHIP: '+(s.name||''), 'Country: '+(s.country||''), 'Degree: '+(s.degree||''), 'Funding: '+(s.funding||''), 'URL: '+(s.url||''),
    'STUDENT: Citizenship: '+(p.citizenship||'')+', Field: '+(p.fieldOfStudy||'')+', Level: '+(p.studyLevel||''),
    p.gpa?'GPA: '+p.gpa:'', p.engTest?p.engTest+(p.engScore?' '+p.engScore:''):'',
    '',
    'Answer ALL sections thoroughly. Search Reddit, blogs, official sites.',
    'For youtubeVideos: Instead of videoId, provide a "searchQuery" — the exact search terms someone would type on YouTube to find a genuinely useful English-language video about this scholarship (e.g. "Chevening Scholarship 2025 how to apply guide"). Make each query specific and different.',
    'Respond ONLY with valid JSON, no markdown:',
    '{"scholarshipName":"","whyForYou":"3-5 sentences","minRequirements":[{"label":"","value":""}],"requiredDocuments":[{"name":"","note":""}],"pros":[""],"cons":[""],"pastRecipients":{"anyFromCountry":true,"stories":[{"name":"","year":"","profile":"","strategy":"","source":""}]},"youtubeVideos":[{"title":"descriptive title","searchQuery":"exact youtube search terms","channel":"likely channel name","relevance":"why helpful"}]}'
  ].filter(Boolean).join('\n');

  fetch(DR_ENDPOINT, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({prompt:plines})
  })
  .then(function(r){return r.json();})
  .then(function(data){
    var raw=((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'').trim();
    raw=raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
    var d; try{d=JSON.parse(raw);}catch(e){var m=raw.match(/\{[\s\S]*\}/);try{d=JSON.parse(m[0]);}catch(e2){d=null;}}
    if(!d){tab.document.body.innerHTML='<p style="padding:40px;color:red;">Parse error. Please try again.</p>';return;}
    tab.document.open(); tab.document.write(drHTML(d,s,p,dark)); tab.document.close();
  })
  .catch(function(e){tab.document.body.innerHTML='<p style="padding:40px;color:red;">Error: '+e.message+'</p>';});
}

function drHTML(d,s,p,dark){
  var sn=esc(d.scholarshipName||s.name||'');

  // Light mode colors
  var bg   = dark ? 'linear-gradient(135deg,#07111f,#0d1b2e,#0a1628)' : 'linear-gradient(135deg,#f3e8ff,#ede9fe,#f5f3ff)';
  var tbBg = dark ? 'rgba(8,20,45,.96)'  : 'rgba(255,255,255,.95)';
  var tbBr = dark ? '#1a3356'            : '#e9d5ff';
  var bbBr = dark ? '#1e3a5f'            : '#ddd6fe';
  var bbCl = dark ? '#63b3ed'            : '#7c3aed';
  var hcBg = dark ? 'rgba(10,24,55,.9)'  : '#fff';
  var hcBr = dark ? '#1a3356'            : '#ede9fe';
  var scBg = dark ? 'rgba(10,24,55,.85)' : 'rgba(255,255,255,.92)';
  var stCl = dark ? '#c8dff0'            : '#4c1d95';
  var rlCl = dark ? '#63b3ed'            : '#6d28d9';
  var rvCl = dark ? '#8ab0cc'            : '#4a3070';
  var rrBr = dark ? '#1a3356'            : '#f3e8ff';
  var diBg = dark ? '#0b1a33'            : '#faf5ff';
  var diBr = dark ? '#1a3356'            : '#ede9fe';
  var dnCl = dark ? '#c8dff0'            : '#3a2060';
  var dtCl = dark ? '#7aa8cc'            : '#7c6aaa';
  var skBg = dark ? '#0b1a33'            : '#faf5ff';
  var skBr = dark ? '#1e3a5f'            : '#ddd6fe';
  var skH  = dark ? '#c8dff0'            : '#4c1d95';
  var skT  = dark ? '#8ab0cc'            : '#5a4080';
  var skS  = dark ? '#5a8aaa'            : '#9d7fcc';
  var ytBg = dark ? '#0b1a33'            : '#fff';
  var ytTi = dark ? '#c8dff0'            : '#1a0050';
  var ytCh = dark ? '#5a8aaa'            : '#9d7fcc';
  var ytRl = dark ? '#4a7090'            : '#7c6aaa';
  var h1Cl = dark ? '#c8dff0'            : '#1a0050';
  var amCl = dark ? '#63b3ed'            : '#2474c8';
  var dlCl = dark ? '#f6ad55'            : '#e07820';
  var whCl = dark ? '#8ab0cc'            : '#3a2060';
  var piCl = dark ? '#4ade80'            : '#166534';
  var ciCl = dark ? '#f87171'            : '#991b1b';
  var cntCl= dark ? '#6a8aaa'            : '#6a8aaa';

  // Print styles — always light
  var printCss='@media print{'
    +'body{background:white!important;}'
    +'.tb{display:none!important;}'
    +'.no-print{display:none!important;}'
    +'*{color:#000!important;background:transparent!important;box-shadow:none!important;border-color:#ccc!important;}'
    +'a{color:#2474c8!important;}'
    +'.pi span,.ci span{color:inherit!important;}'
    +'}';

  var css='*{box-sizing:border-box;}'
    +'body{font-family:Nunito,sans-serif;margin:0;background:'+bg+';min-height:100vh;padding:0 0 60px;}'
    +'.tb{background:'+tbBg+';border-bottom:1px solid '+tbBr+';padding:0 20px;position:sticky;top:0;z-index:50;}'
    +'.tbi{max-width:860px;margin:0 auto;height:58px;display:flex;align-items:center;gap:10px;}'
    +'.bb{background:transparent;border:2px solid '+bbBr+';color:'+bbCl+';font-weight:800;font-size:.83rem;padding:7px 14px;border-radius:9px;cursor:pointer;font-family:Nunito,sans-serif;}'
    +'.pdf-btn{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;font-weight:800;font-size:.83rem;padding:7px 16px;border-radius:9px;cursor:pointer;font-family:Nunito,sans-serif;display:flex;align-items:center;gap:6px;}'
    +'.w{max-width:860px;margin:0 auto;padding:24px 16px;}'
    +'.hc{background:'+hcBg+';border-radius:18px;padding:26px;box-shadow:0 12px 40px rgba(124,58,237,.12);border:1.5px solid '+hcBr+';margin-bottom:20px;}'
    +'.sc{background:'+scBg+';border-radius:14px;padding:20px 22px;box-shadow:0 6px 24px rgba(124,58,237,.08);border:1.5px solid '+hcBr+';margin-bottom:16px;}'
    +'.st{font-size:.95rem;font-weight:900;color:'+stCl+';margin-bottom:12px;}'
    +'.rr{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid '+rrBr+';}'
    +'.rl{font-size:.78rem;font-weight:900;color:'+rlCl+';min-width:130px;flex-shrink:0;}'
    +'.rv{font-size:.8rem;color:'+rvCl+';font-weight:700;line-height:1.5;}'
    +'.di{display:flex;gap:10px;padding:8px 10px;background:'+diBg+';border-radius:9px;margin-bottom:7px;border:1.5px solid '+diBr+';}'
    +'.pi{display:flex;gap:8px;padding:6px 0;font-size:.83rem;font-weight:700;color:'+piCl+';}'
    +'.ci{display:flex;gap:8px;padding:6px 0;font-size:.83rem;font-weight:700;color:'+ciCl+';}'
    +'.pc{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}'
    +'.sc2{background:'+scBg+';border-radius:14px;padding:20px 22px;box-shadow:0 6px 24px rgba(124,58,237,.08);border:1.5px solid '+hcBr+';}'
    +'.sk{background:'+skBg+';border:1.5px solid '+skBr+';border-radius:12px;padding:14px 16px;margin-bottom:10px;}'
    +'.yg{display:flex;flex-direction:column;gap:10px;}'
    +'@media(max-width:580px){.pc,.yg{grid-template-columns:1fr;}.rr{flex-direction:column;gap:3px;}}'
    +printCss;

  var reqs=(d.minRequirements||[]).map(function(r){
    return '<div class="rr"><div class="rl">'+esc(r.label||'')+'</div><div class="rv">'+esc(r.value||'')+'</div></div>';
  }).join('');
  var docs=(d.requiredDocuments||[]).map(function(r){
    return '<div class="di"><span>&#128204;</span><div>'
      +'<div style="font-size:.83rem;font-weight:900;color:'+dnCl+';">'+esc(r.name||'')+'</div>'
      +(r.note?'<div style="font-size:.76rem;color:'+dtCl+';font-weight:700;margin-top:2px;">'+esc(r.note)+'</div>':'')
      +'</div></div>';
  }).join('');
  var pros=(d.pros||[]).map(function(x){return '<div class="pi"><span>&#10003;</span><span>'+esc(x)+'</span></div>';}).join('');
  var cons=(d.cons||[]).map(function(x){return '<div class="ci"><span>&#10007;</span><span>'+esc(x)+'</span></div>';}).join('');
  var stories=((d.pastRecipients&&d.pastRecipients.stories)||[]).map(function(st){
    return '<div class="sk">'
      +'<div style="font-size:.85rem;font-weight:900;color:'+skH+';margin-bottom:6px;">&#128100; '+esc(st.name||'Anonymous')+(st.year?' ('+esc(st.year)+')':'')+'</div>'
      +(st.profile?'<div style="font-size:.78rem;font-weight:700;color:'+skT+';margin-bottom:4px;"><b>Profile:</b> '+esc(st.profile)+'</div>':'')
      +(st.strategy?'<div style="font-size:.78rem;font-weight:700;color:'+skT+';margin-bottom:4px;"><b>Strategy:</b> '+esc(st.strategy)+'</div>':'')
      +(st.source?'<div style="font-size:.74rem;color:'+skS+';font-weight:700;">&#128279; '+esc(st.source)+'</div>':'')
      +'</div>';
  }).join('');
  var vids=(d.youtubeVideos||[]).slice(0,4).map(function(v){
    if(!v.searchQuery&&!v.title)return'';
    var q=encodeURIComponent((v.searchQuery||v.title)+' english');
    var ytSearch='https://www.youtube.com/results?search_query='+q;
    var icons=['&#127891;','&#127775;','&#127909;','&#128218;'];
    var iconIdx=Math.floor(Math.random()*icons.length);
    return '<a href="'+ytSearch+'" target="_blank" rel="noopener" class="no-print" style="display:flex;gap:14px;align-items:flex-start;text-decoration:none;border-radius:12px;padding:14px 16px;border:1.5px solid '+hcBr+';background:'+ytBg+';transition:transform .2s;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">'
      +'<div style="width:48px;height:48px;background:rgba(255,0,0,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.4rem;">&#128269;</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="font-size:.82rem;font-weight:900;color:'+ytTi+';line-height:1.4;margin-bottom:4px;">'+esc(v.title||v.searchQuery||'')+'</div>'
      +(v.channel?'<div style="font-size:.73rem;color:'+ytCh+';font-weight:700;margin-bottom:3px;">Likely channel: '+esc(v.channel)+'</div>':'')
      +'<div style="font-size:.72rem;font-weight:800;color:rgba(255,0,0,.8);display:flex;align-items:center;gap:4px;">'
      +'<svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,0,0,.8)"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>'
      +'Search on YouTube &#8594;'
      +'</div>'
      +(v.relevance?'<div style="font-size:.71rem;color:'+ytRl+';font-weight:700;margin-top:4px;">'+esc(v.relevance)+'</div>':'')
      +'</div></a>';
  }).join('');
  var hasS=d.pastRecipients&&d.pastRecipients.anyFromCountry;
  var sbadge=hasS
    ?'<span style="background:#dcfce7;color:#16a34a;font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:8px;">YES - Stories Found</span>'
    :'<span style="background:#fef9c3;color:#ca8a04;font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:8px;">Limited Info</span>';

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'
    +'<title>Deep Research - '+sn+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">'
    +'<style>'+css+'</style></head><body>'
    // Sticky top bar
    +'<div class="tb no-print"><div class="tbi">'
    +'<button class="bb" onclick="window.close()">&#8592; Close</button>'
    +'<div style="flex:1;min-width:0;">'
    +'<div style="font-size:.68rem;font-weight:800;color:'+cntCl+';">DEEP RESEARCH</div>'
    +'<div style="font-size:.92rem;font-weight:900;color:'+stCl+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+sn+'</div>'
    +'</div>'
    +'<button class="pdf-btn" onclick="window.print()">'
    +'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    +'Download Result (PDF)'
    +'</button>'
    +'</div></div>'
    // Content
    +'<div class="w">'
    +'<div class="hc">'
    +'<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px;">'
    +(s.country?'<span style="font-size:.8rem;font-weight:700;color:'+cntCl+';">&#127758; '+esc(s.country)+'</span>':'')
    +(s.funding?'<span style="background:#ede9fe;color:#7c3aed;font-size:.7rem;font-weight:800;padding:2px 9px;border-radius:999px;">'+esc(s.funding)+'</span>':'')
    +(s.degree?'<span style="background:#dbeafe;color:#1d4ed8;font-size:.7rem;font-weight:800;padding:2px 9px;border-radius:999px;">'+esc(s.degree)+'</span>':'')
    +'</div>'
    +'<h1 style="font-size:clamp(1rem,3vw,1.4rem);font-weight:900;color:'+h1Cl+';margin-bottom:8px;">'+sn+'</h1>'
    +(s.amount?'<div style="font-size:.88rem;font-weight:800;color:'+amCl+';margin-bottom:6px;">&#128176; '+esc(s.amount)+'</div>':'')
    +(s.deadline?'<div style="font-size:.83rem;font-weight:700;color:'+dlCl+';margin-bottom:12px;">&#8987; Deadline: '+esc(s.deadline)+'</div>':'')
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    +(s.url?'<a href="'+esc(s.url)+'" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:800;font-size:.83rem;padding:9px 20px;border-radius:9px;text-decoration:none;">Official Website &#8594;</a>':'')
    +'</div>'
    +'</div>'
    +'<div class="sc"><div class="st">Why This is For You</div><p style="font-size:.86rem;color:'+whCl+';font-weight:700;line-height:1.7;">'+esc(d.whyForYou||'')+'</p></div>'
    +'<div class="sc"><div class="st">Minimum Requirements</div>'+reqs+'</div>'
    +'<div class="sc"><div class="st">Required Documents</div>'+docs+'</div>'
    +'<div class="pc"><div class="sc2"><div class="st">Pros</div>'+pros+'</div><div class="sc2"><div class="st">Cons</div>'+cons+'</div></div>'
    +'<div class="sc"><div class="st">Past Recipients from '+esc(p.citizenship||'Your Country')+sbadge+'</div>'
    +(stories||'<div style="font-size:.83rem;color:'+skS+';font-weight:700;padding:6px 0;">No verified stories found yet.</div>')
    +'</div>'
    +(vids?'<div class="sc"><div class="st">Watch Before You Apply</div><div class="yg">'+vids+'</div></div>':'')
    +'</div></body></html>';
}

// ── THEME TOGGLE ──────────────────────────────────────────────────────────────
var isDark = false;
function toggleTheme(){
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  document.getElementById('icon-sun').style.display  = isDark ? 'none'  : '';
  document.getElementById('icon-moon').style.display = isDark ? ''      : 'none';
  try{ localStorage.setItem('sch_theme', isDark ? 'dark' : 'light'); }catch(e){}
}
// Restore saved theme on load
(function(){
  try{
    var saved = localStorage.getItem('sch_theme');
    if(saved === 'dark'){ isDark = false; toggleTheme(); }
  }catch(e){}
})();

// ── NAV POPUPS ────────────────────────────────────────────────────────────────
function openNavPopup(id){
  var el = document.getElementById('popup-' + id);
  if(el){ el.classList.add('show'); document.body.style.overflow='hidden'; }
}
function closeNavPopup(id){
  var el = document.getElementById('popup-' + id);
  if(el){ el.classList.remove('show'); document.body.style.overflow=''; }
}
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    ['about','howitworks','contact','manual'].forEach(function(id){
      closeNavPopup(id);
    });
  }
});


var menuOpen=false;
function checkNav(){
  var w=window.innerWidth;
  document.getElementById('ham-btn').style.display=w<768?'flex':'none';
  document.querySelector('.hidden-mob').style.display=w<768?'none':'flex';
  if(w>=768){document.getElementById('mob-menu').classList.remove('open');menuOpen=false;}
}
checkNav();
window.addEventListener('resize',checkNav);
document.getElementById('ham-btn').addEventListener('click',function(){
  menuOpen=!menuOpen;
  document.getElementById('mob-menu').classList.toggle('open',menuOpen);
  document.getElementById('hh1').style.transform=menuOpen?'rotate(45deg) translateY(7px)':'';
  document.getElementById('hh2').style.opacity=menuOpen?'0':'1';
  document.getElementById('hh3').style.transform=menuOpen?'rotate(-45deg) translateY(-7px)':'';
});

// ── INIT ──────────────────────────────────────────────────────────────────────
updateBar(1);
setCard('s1');
var cached=loadCache();
if(cached&&cached.name)document.getElementById('cache-popup').style.display='flex';
