// ================= Input checks (both modules) =================
// Each rule: {n: field name, l: label, req, min, max, gt (strictly greater than min), int, u: unit, warn: v => message|null}
// Errors block the calculation and outline the field in red; warnings are shown but the design still runs.
function validateForm(formEl,rules,cross){
  const errs=[], warns=[];
  formEl.querySelectorAll('.invalid').forEach(el=>{ el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('title'); });
  const val=n=>{ const el=formEl.elements[n]; if(!el) return undefined; const s=String(el.value).trim(); return s===''?null:Number(s); };
  const bad=(n,msg)=>{ const el=formEl.elements[n]; if(el){ el.classList.add('invalid'); el.setAttribute('aria-invalid','true'); el.setAttribute('title',msg); const d=el.closest('details'); if(d) d.open=true; } errs.push(msg); };
  for(const r of rules){ const v=val(r.n); if(v===undefined) continue;
    const el=formEl.elements[r.n]; const typed=el&&el.validity&&el.validity.badInput;
    if(typed){ bad(r.n,r.l+' is not a valid number.'); continue; }
    if(v===null){ if(r.req) bad(r.n,r.l+' is required.'); continue; }
    if(isNaN(v)){ bad(r.n,r.l+' must be a number.'); continue; }
    if(r.int&&!Number.isInteger(v)){ bad(r.n,r.l+' must be a whole number.'); continue; }
    if(r.min!=null&&(r.gt?v<=r.min:v<r.min)){ bad(r.n,r.l+' must be '+(r.gt?'more than ':'at least ')+r.min+(r.u?' '+r.u:'')+'.'); continue; }
    if(r.max!=null&&v>r.max){ bad(r.n,r.l+' must be at most '+r.max+(r.u?' '+r.u:'')+'.'); continue; }
    if(r.warn){ const w=r.warn(v); if(w) warns.push(w); } }
  if(cross) cross(val,bad,warns);
  return {errs,warns};
}
// Show the result of validateForm in a box above the results; dims the results while there are errors
function showInputCheck(boxSel,resultsSel,res){ const box=document.querySelector(boxSel); const results=document.querySelectorAll(resultsSel);
  const li=a=>a.map(x=>'<li>'+String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</li>').join('');
  if(res.errs.length){ box.className='inputcheck err on'; box.innerHTML='<strong>Fix '+(res.errs.length===1?'this input':'these inputs')+' to calculate</strong><ul>'+li(res.errs)+'</ul>'+(res.warns.length?'<p class="sub">Also check:</p><ul>'+li(res.warns)+'</ul>':''); }
  else if(res.warns.length){ box.className='inputcheck warn on'; box.innerHTML='<strong>Unusual inputs, please check</strong><ul>'+li(res.warns)+'</ul>'; }
  else { box.className='inputcheck'; box.innerHTML=''; }
  results.forEach(el=>el.classList.toggle('stale',res.errs.length>0));
  return res.errs.length===0;
}
const POS=(n,l,u,extra)=>Object.assign({n,l,min:0,gt:true,u},extra||{});
const NONNEG=(n,l,u,extra)=>Object.assign({n,l,min:0,u},extra||{});
const WHOLE=(n,l,min,max)=>({n,l,int:true,min:min??1,max});

// ---------- Rectangular core (LV/LV) ----------
const RECT_RULES=[
  POS('kVA','Rating','kVA',{req:true,max:5000,warn:v=>v>1000?'Ratings above 1000 kVA are unusual for LV/LV units; check current densities and parallels.':null}),
  POS('priV','Primary voltage','V',{req:true,max:36000,warn:v=>v>1100?'Primary above 1.1 kV: this module is for LV/LV units. Insulation distances and PD are not designed here; consider the round-core module.':null}),
  POS('secV','Secondary voltage','V',{req:true,max:36000,warn:v=>v>1100?'Secondary above 1.1 kV: this module is for LV/LV units; consider the round-core module.':null}),
  POS('zTarget','Impedance','%',{req:true,max:20,warn:v=>v<1||v>10?'Impedance '+v+' % is unusual for this type of unit.':null}),
  NONNEG('zTolPlus','Impedance tolerance (+)','%',{max:30}), NONNEG('zTolMinus','Impedance tolerance (−)','%',{max:50}),
  {n:'effMin',l:'Efficiency',req:true,min:50,max:99.9,u:'%',warn:v=>v>=99.5?'Efficiency above 99.5 % is very hard to reach at this size.':null},
  POS('riseLimit','Rise limit','K',{req:true,max:150}), {n:'amb',l:'Ambient',min:-40,max:60,u:'°C'}, {n:'noiseMax',l:'Noise max',min:20,max:100,u:'dB'},
  NONNEG('altitude','Altitude','m',{max:5000}), {n:'kFactor',l:'K-factor',min:1,max:50}, POS('faultMVA','System fault level','MVA',{max:100000}), {n:'scTime',l:'Short-circuit duration',min:0.25,max:10,u:'s'},
  {n:'K',l:'Constant K',min:10,max:300}, {n:'B',l:'Flux density',min:1.0,max:1.8,u:'T',warn:v=>v>1.6?'Flux above 1.6 T raises no-load loss, magnetising current and noise.':null},
  POS('W','Core width W','mm',{max:600}), POS('D','Core build D','mm',{max:1500}), WHOLE('N1','Inner turns',1,5000), WHOLE('N2','Outer turns',1,5000),
  WHOLE('lvLayers','Inner layers',1,60), WHOLE('hvLayers','Outer layers',1,60), {n:'J1',l:'Inner current density target',min:0.3,max:6,u:'A/mm²'}, {n:'J2',l:'Outer current density target',min:0.3,max:6,u:'A/mm²'},
  POS('lvB','Inner conductor b / Ø','mm',{max:40}), POS('lvH','Inner conductor h','mm',{max:20}), WHOLE('lvRad','Inner radial parallels',1,20), WHOLE('lvAx','Inner axial parallels',1,20),
  POS('hvB','Outer conductor b / Ø','mm',{max:40}), POS('hvH','Outer conductor h','mm',{max:20}), WHOLE('hvRad','Outer radial parallels',1,20), WHOLE('hvAx','Outer axial parallels',1,20),
  NONNEG('gap','Bobbin gap','mm',{max:200}), NONNEG('delta','Inner–outer gap δ','mm',{max:200}), NONNEG('am','Coil-to-coil gap','mm',{max:300}), NONNEG('plateD','Limb plate','mm',{max:100}),
  NONNEG('lvEnd','Inner end clearance','mm',{max:1000}), NONNEG('hvEndMin','Outer minimum end clearance','mm',{max:1000}),
  WHOLE('lvDucts','Inner radial ducts',0,10), WHOLE('hvDucts','Outer radial ducts',0,10), POS('ductW','Duct width','mm',{max:60}),
  NONNEG('ins','Conductor insulation','mm',{max:5}), NONNEG('il','Inter-layer insulation','mm',{max:5}), {n:'bulge',l:'Radial bulge factor',min:1,max:1.5},
  NONNEG('tankWkVA','Stray/tank loss','W/kVA',{max:30}), POS('coreFactor','Core loss factor','',{max:5}), {n:'buildF',l:'Core building factor',min:1,max:3},
  NONNEG('clrL','Overall clearance L','mm'), NONNEG('clrB','Overall clearance B','mm'), POS('sigmaCustom','Conductivity','m/Ω·mm²',{max:70}),
  {n:'riseCal1',l:'Inner rise calibration',min:0.3,max:3}, {n:'riseCal2',l:'Outer rise calibration',min:0.3,max:3}, POS('stressCu','Copper stress limit','MPa',{max:500}), POS('stressAl','Aluminium stress limit','MPa',{max:500}),
  {n:'extraTurn',l:'Extra turn per layer',min:0,max:3},
  NONNEG('pCore','Core price','₹/kg'), NONNEG('pCond','Conductor price','₹/kg'), NONNEG('pSteel','Steel price','₹/kg'), NONNEG('pFg','FG price','₹/kg'), NONNEG('pClh','Class H price','₹/kg'), NONNEG('pResin','Resin price','₹/kg'), {n:'pOthers',l:'Others',min:0,max:100,u:'%'}];
function rectCross(val,bad,warns,formEl){
  const pv=val('priV'), sv=val('secV'); if(pv&&sv&&pv===sv) warns.push('Primary and secondary voltages are equal ('+pv+' V). This is correct for an isolation transformer; check it is intended.');
  for(const [pre,name] of [['lv','inner'],['hv','outer']]){ const type=formEl.elements[pre+'Type'].value, b=val(pre+'B'), h=val(pre+'H');
    if(type==='strip'&&((b==null)!==(h==null))) bad(b==null?pre+'B':pre+'H','Enter both b and h for the '+name+' strip, or leave both blank for automatic sizing.');
    if(type==='strip'&&b&&h&&b<h) warns.push('The '+name+' strip has b ('+b+') smaller than h ('+h+'). b is the axial width; check they are not swapped.'); }
  const N1=val('N1'),L1=val('lvLayers'),N2=val('N2'),L2=val('hvLayers');
  if(N1&&L1&&L1>N1) bad('lvLayers','Inner layers ('+L1+') cannot exceed inner turns ('+N1+').');
  if(N2&&L2&&L2>N2) bad('hvLayers','Outer layers ('+L2+') cannot exceed outer turns ('+N2+').');
  if(formEl.elements.condBasis.value==='custom'&&val('sigmaCustom')==null) bad('sigmaCustom','Enter the supplier conductivity, or choose another conductivity option.');
  const mat=formEl.elements.mat.value, lim=mat==='Al'?1.8:3.0; for(const [n,t] of [['J1','Inner'],['J2','Outer']]){ const j=val(n); if(j&&j>lim) warns.push(t+' current density target '+j+' A/mm² is high for '+(mat==='Al'?'aluminium':'copper')+'.'); }
  const B=val('B'),W=val('W'),D=val('D'); if(W&&D&&(D/W<0.8||D/W>3.5)) warns.push('Core build D / width W = '+(D/W).toFixed(2)+' is unusual (typical 1.2–2.6).');
  if(val('zTolMinus')!=null&&val('zTolMinus')>=100) bad('zTolMinus','Impedance tolerance (−) must be below 100 %.');
}

// ---------- Round core (HV/LV) ----------
const ROUND_RULES=[
  POS('kVA','Capacity','kVA',{req:true,max:20000}), POS('hvV','HV line voltage','V',{req:true,max:72500}), POS('lvV','LV line voltage','V',{req:true,max:36000}),
  {n:'k',l:'Constant k',min:0.2,max:1.2}, {n:'B',l:'Flux density',min:1.0,max:1.8,u:'T',warn:v=>v>1.7?'Flux above 1.7 T is high for CRGO; expect high no-load loss and noise.':null},
  {n:'Jlv',l:'LV current density',min:0.3,max:6,u:'A/mm²'}, {n:'Jhv',l:'HV current density',min:0.3,max:6,u:'A/mm²'},
  NONNEG('tapPlus','Tap plus','%',{max:25}), NONNEG('tapMinus','Tap minus','%',{max:25}), NONNEG('tapStep','Tap step','%',{max:10}), NONNEG('zTarget','Target impedance','%',{max:25}),
  {n:'amb',l:'Ambient',min:-40,max:60,u:'°C'}, NONNEG('altitude','Altitude','m',{max:5000}), POS('faultMVA','System fault level','MVA',{max:100000}), {n:'scTime',l:'Short-circuit duration',min:0.25,max:10,u:'s'},
  POS('maxLoss50','Max total loss at 50 %','W'), POS('maxLoss100','Max total loss at 100 %','W'), {n:'noiseMax',l:'Noise max',min:20,max:120,u:'dB'},
  POS('window','Window height','mm',{max:5000}), POS('coreDia','Core diameter','mm',{max:1500}), NONNEG('lvEnd','LV end clearance','mm',{max:1000}), NONNEG('hvEnd','HV end clearance','mm',{max:1000}),
  WHOLE('lvTurns','LV turns',1,5000), WHOLE('lvLayers','LV layers',1,20), WHOLE('lvAx','LV axial parallels',1,40), WHOLE('lvRad','LV radial parallels',1,10), NONNEG('lvTransp','LV transposition','mm',{max:200}),
  WHOLE('lvDucts','LV air ducts',0,10), POS('lvDuctT','LV duct width','mm',{max:60}), NONNEG('coreLV','Core to LV','mm',{max:100}), WHOLE('hvCoils','HV coils',1,80), WHOLE('hvDucts','HV air ducts',0,10), POS('hvDuctT','HV duct width','mm',{max:60}),
  NONNEG('lvhvGap','LV–HV gap','mm',{max:300}), NONNEG('phaseGap','HV phase gap','mm',{max:500}), NONNEG('hvCoilGap','HV coil-to-coil gap','mm',{max:200}),
  NONNEG('hvMinIns','HV inter-layer minimum','mm',{max:5}), NONNEG('lvIns','LV conductor insulation','mm',{max:5}), NONNEG('hvInsRound','HV round insulation','mm',{max:5}), NONNEG('hvInsStrip','HV strip insulation','mm',{max:5}),
  NONNEG('enclClr','Enclosure clearance','mm',{max:2000}), {n:'riseCal1',l:'LV rise calibration',min:0.3,max:3}, {n:'riseCal2',l:'HV rise calibration',min:0.3,max:3},
  NONNEG('pCore','Core price','₹/kg'), NONNEG('pCu','Copper price','₹/kg'), NONNEG('pAl','Aluminium price','₹/kg')];
function roundCross(val,bad,warns){
  const hv=val('hvV'), lv=val('lvV'); if(hv&&lv&&hv<=lv) bad('hvV','HV voltage ('+hv+' V) must be higher than LV voltage ('+lv+' V). For LV/LV units use the rectangular-core module.');
  const tp=val('tapPlus')||0, tm=val('tapMinus')||0, ts=val('tapStep'); if(ts&&(tp||tm)&&Math.abs((tp+tm)/ts-Math.round((tp+tm)/ts))>1e-6) warns.push('The tap range '+tp+' % / −'+tm+' % is not a whole number of '+ts+' % steps.');
  if(!ts&&(tp||tm)) warns.push('Tap range is set but the tap step is 0, so no taps are calculated.');
  const cd=val('coreDia'), win=val('window'); if(cd&&win&&(win/cd<1.5||win/cd>8)) warns.push('Window height / core diameter = '+(win/cd).toFixed(1)+' is unusual (typical 2.5–6).');
}
