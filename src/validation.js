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
  {n:'extraTurn',l:'Extra turn per layer',min:0,max:3}, {n:'overload',l:'Continuous overload',min:0,max:60,u:'%'}, POS('maxL','Maximum length','mm'), POS('maxB','Maximum breadth','mm'), POS('maxH','Maximum height','mm'), WHOLE('supports','Supports per straight side',0,20),
  POS('llTarget','Load loss target','W'), {n:'llTol',l:'Target tolerance',min:0,max:50,u:'%'}, NONNEG('capA','No-load capitalisation','₹/kW'), NONNEG('capB','Load capitalisation','₹/kW'), {n:'ovPct',l:'Over-voltage for flux check',min:0,max:30,u:'%'}, {n:'bSat',l:'Flux limit at over-voltage',min:1.5,max:2.1,u:'T'},
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
  { const t=(formEl.elements.harmonics||{}).value; if(t&&t.trim()&&!STD.parseSpectrum(t)) bad('harmonics','Harmonic spectrum not understood. Use order:percent pairs, for example 5:25, 7:14, 11:6.'); }
  for(const [n,l] of [['priTaps','Primary taps'],['secTaps','Secondary taps']]){ const t=(formEl.elements[n]||{}).value||''; if(t.trim()&&!/^\s*\d+(\.\d+)?(\s*[,;\s]\s*\d+(\.\d+)?)*\s*$/.test(t)) bad(n,l+': enter voltages separated by commas, for example 600, 630, 660.'); }
  if(formEl.elements.phases&&formEl.elements.phases.value==='1'&&formEl.elements.vg.value!=='Ii0') warns.push('Single-phase selected: the vector group is set to Ii0 automatically.');
}

// ---------- Round core (HV/LV) ----------
const ROUND_RULES=[
  POS('kVA','Capacity','kVA',{req:true,max:20000}), POS('hvV','HV line voltage','V',{req:true,max:72500}), POS('lvV','LV line voltage','V',{req:true,max:36000}),
  {n:'k',l:'Constant k',min:0.2,max:1.2}, {n:'B',l:'Flux density',min:1.0,max:1.8,u:'T',warn:v=>v>1.7?'Flux above 1.7 T is high for CRGO; expect high no-load loss and noise.':null},
  {n:'Jlv',l:'LV current density',min:0.3,max:6,u:'A/mm²'}, {n:'Jhv',l:'HV current density',min:0.3,max:6,u:'A/mm²'},
  NONNEG('tapPlus','Tap plus','%',{max:25}), NONNEG('tapMinus','Tap minus','%',{max:25}), NONNEG('tapStep','Tap step','%',{max:10}), NONNEG('zTarget','Target impedance','%',{max:25}),
  {n:'amb',l:'Ambient',min:-40,max:60,u:'°C'}, NONNEG('altitude','Altitude','m',{max:5000}), POS('faultMVA','System fault level','MVA',{max:100000}), {n:'scTime',l:'Short-circuit duration',min:0.25,max:10,u:'s'},
  POS('maxLoss50','Max total loss at 50 %','W'), POS('maxLoss100','Max total loss at 100 %','W'), {n:'noiseMax',l:'Noise max',min:20,max:120,u:'dB'},
  POS('window','Window height','mm',{max:5000}), POS('coreDia','Core diameter','mm',{max:1500}), WHOLE('coreSteps','Core steps',3,20), {n:'stepMult',l:'Step width multiple',min:1,max:20,int:true,u:'mm'}, {n:'minStep',l:'Minimum step width',min:10,max:200,u:'mm'}, NONNEG('lvEnd','LV end clearance','mm',{max:1000}), NONNEG('hvEnd','HV end clearance','mm',{max:1000}),
  WHOLE('lvTurns','LV turns',1,5000), WHOLE('lvLayers','LV layers',1,20), WHOLE('lvAx','LV axial parallels',1,40), WHOLE('lvRad','LV radial parallels',1,10), NONNEG('lvTransp','LV transposition','mm',{max:200}),
  WHOLE('lvDucts','LV air ducts',0,10), POS('lvDuctT','LV duct width','mm',{max:60}), NONNEG('coreLV','Core to LV','mm',{max:100}), WHOLE('hvCoils','HV coils',1,80), WHOLE('hvDucts','HV air ducts',0,10), POS('hvDuctT','HV duct width','mm',{max:60}),
  NONNEG('lvhvGap','LV–HV gap','mm',{max:300}), NONNEG('phaseGap','HV phase gap','mm',{max:500}), NONNEG('hvCoilGap','HV coil-to-coil gap','mm',{max:200}),
  NONNEG('hvMinIns','HV inter-layer minimum','mm',{max:5}), NONNEG('lvIns','LV conductor insulation','mm',{max:5}), NONNEG('hvInsRound','HV round insulation','mm',{max:5}), NONNEG('hvInsStrip','HV strip insulation','mm',{max:5}),
  NONNEG('enclClr','Enclosure clearance','mm',{max:2000}), {n:'riseCal1',l:'LV rise calibration',min:0.3,max:3}, {n:'riseCal2',l:'HV rise calibration',min:0.3,max:3},
  NONNEG('pCore','Core price','₹/kg'), NONNEG('pCu','Copper price','₹/kg'), NONNEG('pAl','Aluminium price','₹/kg'),
  {n:'overload',l:'Continuous overload',min:0,max:60,u:'%'}, POS('maxL','Maximum length','mm'), POS('maxB','Maximum breadth','mm'), POS('maxH','Maximum height','mm'), POS('llTarget','Load loss target','W'), {n:'llTol',l:'Target tolerance',min:0,max:50,u:'%'}, NONNEG('leadLoss','Lead loss','W'), NONNEG('capA','No-load capitalisation','₹/kW'), NONNEG('capB','Load capitalisation','₹/kW'), {n:'ovPct',l:'Over-voltage for flux check',min:0,max:30,u:'%'}, {n:'bSat',l:'Flux limit at over-voltage',min:1.5,max:2.1,u:'T'}];
function roundCross(val,bad,warns){ const formEl=document.getElementById('f');
  { const t=(formEl.elements.harmonics||{}).value; if(t&&t.trim()&&!STD.parseSpectrum(t)) bad('harmonics','Harmonic spectrum not understood. Use order:percent pairs, for example 5:25, 7:14, 11:6.'); }

  const hv=val('hvV'), lv=val('lvV'); if(hv&&lv&&hv<=lv) bad('hvV','HV voltage ('+hv+' V) must be higher than LV voltage ('+lv+' V). For LV/LV units use the rectangular-core module.');
  const tp=val('tapPlus')||0, tm=val('tapMinus')||0, ts=val('tapStep'); if(ts&&(tp||tm)&&Math.abs((tp+tm)/ts-Math.round((tp+tm)/ts))>1e-6) warns.push('The tap range '+tp+' % / −'+tm+' % is not a whole number of '+ts+' % steps.');
  if(!ts&&(tp||tm)) warns.push('Tap range is set but the tap step is 0, so no taps are calculated.');
  const cd=val('coreDia'), win=val('window'); if(cd&&win&&(win/cd<1.5||win/cd>8)) warns.push('Window height / core diameter = '+(win/cd).toFixed(1)+' is unusual (typical 2.5–6).');
}

// ================= Background worker for automatic design (both modules) =================
// Runs rectAuto / designAuto off the page so typing stays smooth; falls back to the page if workers are blocked.
let AUTO_WORKER=null, AUTO_WORKER_OK=true, AUTO_REQ=0;
function autoWorker(){ if(!AUTO_WORKER_OK) return null; if(AUTO_WORKER) return AUTO_WORKER;
  try{ const src=document.getElementById('engines').textContent+'\nself.onmessage=e=>{ try{ const f=e.data.kind==="round"?designAuto:rectAuto; self.postMessage({id:e.data.id,o:f(e.data.p)}); }catch(err){ self.postMessage({id:e.data.id,err:String(err&&err.message||err)}); } };';
    AUTO_WORKER=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); AUTO_WORKER.onerror=()=>{ AUTO_WORKER_OK=false; AUTO_WORKER=null; }; return AUTO_WORKER; }catch(e){ AUTO_WORKER_OK=false; return null; } }
function autoAsync(kind,p){ const run=()=>kind==='round'?designAuto(p):rectAuto(p);
  return new Promise((resolve,reject)=>{ const w=autoWorker(); if(!w){ try{ resolve(run()); }catch(e){ reject(e); } return; }
    const id=++AUTO_REQ; let done=false; const to=setTimeout(()=>{ if(done) return; done=true; AUTO_WORKER_OK=false; try{ resolve(run()); }catch(e){ reject(e); } },30000);
    const h=e=>{ if(e.data.id!==id) return; w.removeEventListener('message',h); if(done) return; done=true; clearTimeout(to); e.data.err?reject(new Error(e.data.err)):resolve(e.data.o); };
    w.addEventListener('message',h); try{ w.postMessage({id,kind,p}); }catch(e){ done=true; clearTimeout(to); w.removeEventListener('message',h); AUTO_WORKER_OK=false; try{ resolve(run()); }catch(e2){ reject(e2); } } }); }

// ================= Shared outputs: GTP, alternatives, cutting list =================
// g: normalised design summary built by each module (see rGtpData / roundGtpData). Layout follows the company's
// "Schedule of Technical Particulars as per IS 2026 / IEC 60076" (sections A–F), plus the particulars tenders usually ask for.
function gtpRows(g){ const f=(x,n)=>x==null||isNaN(x)?'—':Number(x).toFixed(n); const R=[]; let i=0; const sec=t=>R.push(['',t,'','',true]); const add=(t,u,v)=>R.push([String(++i),t,u,v==null||v===''?'—':v]);
  const c=(typeof companyGet==='function')?companyGet():{};
  sec('A. General information'); add('Name of the manufacturer','—',c.name||'—'); add('Customer','—',g.customer); add('Service','—',g.service); if(g.ul) add('UL / certification file','—',g.ul);
  sec('B. Applicable standards'); add('Design and testing standard','—',g.std);
  sec('C. Electrical'); add('kVA rating','kVA',String(g.kVA)); add('Primary voltage','V',g.w2.V+' ('+g.w2.conn+')'); add('Secondary voltage','V',g.w1.V+' ('+g.w1.conn+')');
  add('Primary tapping voltages','V',g.taps2||'No taps'); add('Secondary tapping voltages','V',g.taps1||'No taps'); add('Tap changer','—',g.tapChanger);
  add('Rated frequency','Hz',String(g.freq)); add('No. of phases / limbs','—',g.phases+' / '+g.limbs); add('Vector group','—',g.vg);
  add('Rated current, primary / secondary','A',f(g.w2.I,2)+' / '+f(g.w1.I,2)); add('Harmonic content (THDi / K-factor)','—',g.thd);
  add('Impedance at '+g.T+' °C','%',f(g.Z,2)); add('Total loss at rated voltage','W',f(g.NLL+g.LL,0)); add('No-load loss at rated voltage','W',f(g.NLL,0)); add('Load loss at rated current, '+g.T+' °C','W',f(g.LL,0)+(g.lead?' (incl. '+f(g.lead,0)+' W leads)':''));
  add('Efficiency at unity pf: 100 / 75 / 50 % load','%',[1,0.75,0.5].map(x=>f(STD.effAt(g.kVA,g.NLL,g.LL,x,1),2)).join(' / ')); add('Efficiency at pf 0.8: 100 / 75 / 50 % load','%',[1,0.75,0.5].map(x=>f(STD.effAt(g.kVA,g.NLL,g.LL,x,0.8),2)).join(' / '));
  add('Regulation at full load, pf 1 / pf 0.8','%',f(STD.reg(g.er,g.ex,1),2)+' / '+f(STD.reg(g.er,g.ex,0.8),2)); add('No-load current','%',f(g.I0,2));
  add('Dielectric withstand (power frequency / impulse)','kV',g.testV); add('Secondary fault current (symmetrical / peak)','kA',g.fault); add('Inrush current (estimate)','A peak',g.inrush);
  add('Short-circuit withstand (IEC 60076-5)','—',g.sc); add('Maximum flux density','T',f(g.B,3)); add('Current density, primary / secondary','A/mm²',f(g.J2,2)+' / '+f(g.J1,2));
  sec('D. Mechanical'); add('Construction','—',g.construction); add('Type of core','—','Iron'); add('Core material','—',g.grade); add('Winding material','—',g.mat);
  add('Electrostatic shield','—',g.shield); add('Insulation class','—',g.insClass); add('Interlayer insulation','—',g.interlayer); add('Primary termination','—',g.term2); add('Secondary termination','—',g.term1);
  add('Temperature sensor','—',g.sensor); add('Approximate overall weight','kg',f(g.mTot,0)); add('Approximate overall dimensions L × W × H','mm',g.dims);
  sec('E. Cooling system'); add('Type of cooling','—',g.cooling);
  sec('F. Environmental conditions'); add('Ambient temperature','°C',g.ambient); add('Temperature rise, primary / secondary','K',f(g.rise2,1)+' / '+f(g.rise1,1)+' (limit '+f(g.riseLim,0)+')'); add('Humidity','—',g.humidity); add('Ingress protection','—',g.ip);
  if(g.toc!=null){ sec('G. Evaluation'); add('Total owning cost (price + capitalised losses)','₹',Math.round(g.toc).toLocaleString('en-IN')); }
  return R; }
function gtpPdf(g,meta,file){ if(!window.jspdf){ toast('PDF library did not load.'); return; } const {jsPDF}=window.jspdf; const d=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const ink=[23,33,43];
  if(typeof pdfBrand==='function') pdfBrand(d,150,9,50,9);
  d.setTextColor(...ink); d.setFont('helvetica','bold'); d.setFontSize(11.5); d.text('SCHEDULE OF TECHNICAL PARTICULARS AS PER IS 2026 / IEC 60076',105,20,{align:'center'});
  d.setFont('helvetica','normal'); d.setFontSize(8); d.setTextColor(90); d.text(pdfText((meta.party?'Customer: '+meta.party+'   ':'')+(meta.wo?'Work order: '+meta.wo+'   ':'')+'Rating: '+g.kVA+' kVA, '+g.w2.V+' / '+g.w1.V+' V   Revision: '+(meta.rev||'R0')),105,25,{align:'center'});
  const rows=gtpRows(g); d.autoTable({theme:'grid',startY:28,margin:{left:10,right:10,bottom:12},styles:{fontSize:6.8,cellPadding:0.55,lineColor:[40,40,40],lineWidth:0.15,textColor:ink},headStyles:{fillColor:[235,238,241],textColor:ink,fontStyle:'bold'},
    head:[['Sl. No.','Description','Unit','Particulars']],body:rows.map(r=>r.slice(0,4).map(pdfText)),columnStyles:{0:{cellWidth:12,halign:'center'},1:{cellWidth:86},2:{cellWidth:16,halign:'center'},3:{halign:'center'}},
    didParseCell:h=>{ if(h.section==='body'&&rows[h.row.index][4]){ h.cell.styles.fontStyle='bold'; h.cell.styles.fillColor=[240,243,246]; h.cell.styles.halign='left'; } }});
  const y=Math.min(d.lastAutoTable.finalY+8,282); d.setFontSize(8); d.setTextColor(...ink); d.text(pdfText('Prepared by: '+(meta.by||'')+'      Checked by: '+(meta.chk||'')+'      Approved by: '+(meta.appr||'')+'      Date: '+new Date().toLocaleDateString('en-GB')),10,y);
  d.setFontSize(6); d.setTextColor(90); d.text(pdfText('Design (calculated) values; test tolerances per IEC 60076-1 / IS 2026 apply. Tool '+APP_VERSION),10,290);
  saveFile(file,d.output('blob')); }
// Tender calculations table, shared by both modules
function tenderRows(t){ const f=(x,n)=>x==null||isNaN(x)?'—':Number(x).toFixed(n); const rows=[];
  rows.push(['Secondary fault current (symmetrical / peak)',f(t.fault.Isc/1000,2)+' / '+f(t.fault.peak/1000,2)+' kA']);
  rows.push(['Inrush current, energised winding (estimate)',f(t.inrush.Ipk,0)+' A peak = '+f(t.inrush.times,1)+' × rated peak'+(t.inrush.tau?'; decay τ ≈ '+f(t.inrush.tau*1000,0)+' ms':'')]);
  rows.push(['Primary busbar / terminal (with 25 % margin)',t.bus1.size+' mm (≥ '+f(t.bus1.need,0)+' mm² at '+t.bus1.J+' A/mm²)']);
  rows.push(['Secondary busbar / terminal (with 25 % margin)',t.bus2.size+' mm (≥ '+f(t.bus2.need,0)+' mm²)']);
  if(t.ph===1) rows.push(['Neutral','Not applicable (single-phase)']); else rows.push(['Neutral current / busbar',f(t.neutralI,1)+' A → '+t.busN.size+' mm'+(t.harm&&t.harm.neutral>1?' (triplen harmonics exceed phase current)':'')]);
  rows.push(['Harmonics',t.harm?('THDi '+f(t.harm.thd*100,1)+' %, K-factor '+f(t.harm.K,2)+', neutral '+f(t.harm.neutral*100,0)+' % of phase rms'):('Linear load'+(t.Kf>1?' (K-factor '+f(t.Kf,1)+' entered)':''))]);
  if(t.ov>0) rows.push(['Temperature rise at '+t.ov+' % continuous overload',f(t.riseOv[0],1)+' / '+f(t.riseOv[1],1)+' K']);
  if(t.worst) rows.push(['Temperature rise at the worst (lowest-voltage) taps',f(t.worst[0],1)+' / '+f(t.worst[1],1)+' K (uniform conductor; sectional conductors not modelled)']);
  return rows; }
function cutRows(cut){ return cut.rows.map(r=>[r.grp,String(r.step),String(r.w),(Math.round(r.stack*10)/10).toString(),String(r.qty),Math.round(r.short)+' / '+Math.round(r.long),(Math.round(r.kg*10)/10).toString()]); }
// Alternatives table: rows with a "Use" button; cur = index of the design currently shown
function renderAlts(sel,alts,cols,onUse){ const el=document.querySelector(sel); if(!alts||alts.length<2){ el.innerHTML=''; return; }
  const e=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  el.innerHTML='<details><summary>Alternative designs ('+alts.length+') — compare and pick</summary><div class="tblwrap"><table><tr>'+cols.map(c=>'<th>'+e(c[0])+'</th>').join('')+'<th>Checks</th><th></th></tr>'+
    alts.map((a,i)=>'<tr'+(i===0?' class="cur"':'')+'>'+cols.map(c=>'<td>'+e(c[1](a))+'</td>').join('')+'<td class="'+(a.fails?'bad':'')+'">'+(a.fails?a.fails+' fail':'all pass')+'</td><td>'+(i===0?'shown':'<button type="button" class="btn sm" data-alt="'+i+'">Use</button>')+'</td></tr>').join('')+
    '</table></div><p class="hint">The first row is the design shown. Use copies that alternative into the design fields as a fixed design.</p></details>';
  el.querySelectorAll('[data-alt]').forEach(b=>b.addEventListener('click',()=>onUse(alts[+b.dataset.alt]))); }
