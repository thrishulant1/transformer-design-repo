// ================= Round core: saved designs, requirement import, compliance; adapters for extras =================
// Loaded last, after both modules. Round designs share the design library with the prefix "round:".
let ROUND_REQ=[], ROUND_REQ_NAME='', ROUND_CONF=new Set();
const OKEY=n=>'round:'+n;
function oSnapshot(){ const v={}; for(const el of form.elements){ if(el.name) v[el.name]=el.value; }
  return {kind:'round',v,req:ROUND_REQ,reqName:ROUND_REQ_NAME,conf:[...ROUND_CONF],gt:R_GT_ROUND,ver:APP_VERSION,at:new Date().toISOString(),sum:CUR&&CUR.M?CUR.M.values:null}; }
function oApply(s){ if(!s||!s.v) return; for(const el of form.elements){ if(el.name&&s.v[el.name]!==undefined) el.value=s.v[el.name]; }
  ROUND_REQ=Array.isArray(s.req)?s.req:[]; ROUND_REQ_NAME=s.reqName||''; ROUND_CONF=new Set(Array.isArray(s.conf)?s.conf:[]); R_GT_ROUND=(s.gt&&typeof s.gt==='object')?{...gtDefaults(),...s.gt}:gtDefaults();
  $('#oReqStatus').textContent=ROUND_REQ.length?'Requirement: '+ROUND_REQ_NAME+' ('+ROUND_REQ.length+' rows).':'No requirement sheet imported. Import one to get the compliance tab.';
  if(s.ver!==APP_VERSION) setTimeout(()=>toast('This design was saved with '+(s.ver?'tool '+s.ver:'an older tool version')+'. It has been recalculated with '+APP_VERSION+', so results may differ slightly.'),1200);
  run(); }
function oList(sel){ const all=LIB.all(); const names=Object.keys(all).filter(k=>k.startsWith('round:')).sort((a,b)=>(all[b].at||'').localeCompare(all[a].at||''));
  const L=$('#oSavedList'); L.innerHTML=names.length?names.map(k=>'<option value="'+esc(k)+'">'+esc(k.slice(6))+' — '+esc((all[k].v.kVA||'?')+' kVA, '+new Date(all[k].at).toLocaleDateString('en-GB'))+'</option>').join(''):'<option value="">No saved designs yet</option>';
  if(sel&&all[sel]) L.value=sel; $('#oLibMode').textContent=LIB.label(); }
$('#oSaveBtn').addEventListener('click',async()=>{ const s=oSnapshot(); const name=$('#oSaveName').value.trim()||((s.v.kVA||'')+' kVA '+(s.v.hvV||'')+'/'+(s.v.lvV||'')+' V');
  const key=OKEY(name), exists=!!LIB.all()[key]; try{ await LIB.save(key,s); oList(key); $('#oSaveName').value=''; toast((exists?'Updated ':'Saved ')+'"'+name+'"'); }catch(e){ toast('Could not save: '+e.message); } });
$('#oLoadBtn').addEventListener('click',()=>{ const k=$('#oSavedList').value; const s=LIB.all()[k]; if(!s){ toast('Choose a saved design first.'); return; } oApply(s); toast('Loaded "'+k.slice(6)+'"'); });
$('#oDelBtn').addEventListener('click',async()=>{ const k=$('#oSavedList').value; if(!k||!LIB.all()[k]) return; try{ await LIB.del(k); oList(); toast('Deleted "'+k.slice(6)+'"'); }catch(e){ toast('Could not delete: '+e.message); } });
// keep both lists in sync when the shared library updates
const _rListPrev=rList; rList=function(sel){ _rListPrev(sel); if(document.getElementById('oSavedList')) oList(); };
// compare buttons (both modules)
$('#oCmpBtn').addEventListener('click',()=>{ const box=$('#oCmp'); box.hidden=!box.hidden; if(!box.hidden){ const all=LIB.all(); compareRender('#oCmp',Object.keys(all).filter(k=>k.startsWith('round:')).map(k=>k.slice(6)),n=>all[OKEY(n)]); } });
$('#rCmpBtn').addEventListener('click',()=>{ const box=$('#rCmp'); box.hidden=!box.hidden; if(!box.hidden){ const all=LIB.all(); compareRender('#rCmp',Object.keys(all).filter(k=>!k.startsWith('round:')),n=>all[n]); } });
// remember the last round-core inputs too
function roundAfterRun(){ try{ localStorage.setItem('roundLast.v1',JSON.stringify(oSnapshot())); }catch(e){} roundCompRender(); }

// ---- requirement sheet import (same sheet layout as the rectangular module) ----
$('#oReqFile').addEventListener('change',async e=>{ const file=e.target.files[0]; if(!file) return;
  try{ const wb=XLSX.read(await file.arrayBuffer()); const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''}); const items=[]; let fat=false;
    for(const r of rows){ const cells=r.map(c=>String(c).trim()).filter(c=>c!==''); if(!cells.length) continue; if(/^s\.?\s*no/i.test(cells[0])) continue; if(/^fat/i.test(cells[0])&&cells.length===1){ fat=true; continue; }
      const txt=cells.filter(c=>!/^\d+$/.test(c)); if(txt.length<2) continue; items.push([fat?'test':reqKey(txt[0]),(fat?'FAT: ':'')+txt[0],txt[txt.length-1]]); }
    if(!items.length) throw new Error('no parameter rows found');
    const find=k=>(items.find(x=>x[0]===k)||[])[2]||''; const num=(s,re)=>{ const m=String(s).match(re||/([\d.]+)/); return m?parseFloat(m[1]):null; };
    const set=(k,v)=>{ if(v!==null&&v!==undefined&&v!==''&&form.elements[k]) form.elements[k].value=v; };
    set('kVA',num(find('kva'))); set('freq',num(find('phase'),/(\d+)\s*hz/i));
    const a=num(find('pri')), b=num(find('sec')); if(a&&b){ set('hvV',Math.max(a,b)); set('lvV',Math.min(a,b)); }
    const vg=find('vg').replace(/\s/g,''); if(vg){ const opt=[...form.vg.options].find(o=>o.value.toLowerCase()===vg.toLowerCase()); if(opt) form.vg.value=opt.value; }
    const imp=find('imp'); if(num(imp)) set('zTarget',num(imp)); const ins=find('ins').match(/class\s*([A-Z])/i); if(ins&&/[BFH]/i.test(ins[1])) set('insClass',ins[1].toUpperCase());
    const mat=find('mat'); if(/alu/i.test(mat)){ set('lvMat','Al'); set('hvMat','Al'); } if(/copp/i.test(mat)){ set('lvMat','Cu'); set('hvMat','Cu'); }
    const core=find('core'); if(/m3/i.test(core)) set('grade','M3-0.23'); else if(/zdmh/i.test(core)) set('grade','23ZDMH-0.23'); else if(/m4|crgo/i.test(core)) set('grade','M4-0.27');
    set('noiseMax',num(find('noise'),/(\d+)\s*db/i)); const amb=find('rise').match(/ambient[^\d]*(\d+)/i); if(amb) set('amb',amb[1]);
    ROUND_REQ=items; ROUND_REQ_NAME=file.name.replace(/\.[^.]+$/,''); ROUND_CONF=new Set();
    $('#oReqStatus').textContent='Requirement imported: '+file.name+' ('+items.length+' rows). See the Compliance tab.'; toast('Requirement sheet imported'); run();
  }catch(err){ console.error(err); toast('Could not read that sheet: '+err.message+'. Use a sheet with Parameter and Specification columns.'); }
  e.target.value=''; });

// ---- compliance (round core) ----
function roundCompRows(o){ const p=o.inp, m=CUR.meta, ck=n=>o.checks.find(c=>c.name.startsWith(n)); const cn=c=>c==='D'?'delta':'star';
  const zOk=ck('Impedance'), riseOk=ck('LV / HV winding rise');
  const offer={kva:[p.kVA+' kVA',null],phase:['3 phase, '+p.freq+' Hz',null],app:['Designed for linear loads',true],
    pri:[p.hvV+' V '+cn(p.hvConn)+' / '+p.lvV+' V '+cn(p.lvConn),null],sec:[p.lvV+' V, '+cn(p.lvConn),null],vg:[m.vg,null],
    eff:['Efficiency '+o.loss.eff100.toFixed(2)+' % at 100 % load, pf 1',null],imp:[o.imp.ek.toFixed(2)+' % @'+p.refTemp+' °C',zOk?zOk.ok:true],ins:['Class '+p.insClass,null],
    rise:['LV '+o.lv.grad.toFixed(1)+' K, HV '+o.hv.grad.toFixed(1)+' K (limit '+o.riseLim.toFixed(0)+' K)',riseOk?riseOk.ok:true],cool:['AN, natural air cooled',true],
    mat:['LV '+p.lvMat+', HV '+p.hvMat,null],core:['CRGO '+p.grade+', '+o.core.B.toFixed(3)+' T',true],std:['IS 11171 / IS 2026 / IEC 60076-11',true],
    mech:[p.enclosure?('Enclosure '+o.dims.eL+' × '+o.dims.eB+' × '+o.dims.eH):('Active part '+o.dims.activeL+' × '+o.dims.activeB+' × '+o.dims.activeH),true],
    wt:[Math.round(o.wts.total)+' kg',true],hv:[o.cls.pf+' kV AC / '+o.cls.li+' kVp',true],noise:['Estimate '+o.noise.toFixed(0)+' dB(A) (to be measured at FAT)',p.noiseMax?o.noise<=p.noiseMax:true],
    encl:[p.enclosure?'IP23 enclosure supplied':'Not supplied',true],other:['Noted',true]};
  const numEq=(spec,val)=>{ const mm=String(spec).match(/([\d.]+)/); return !mm||Math.abs(parseFloat(mm[1])-val)<0.01; };
  return ROUND_REQ.map(([k,param,spec],i)=>{ const key=k||reqKey(param); let [v,ok]=offer[key]||offer.other;
    if(key==='kva') ok=numEq(spec,p.kVA); if(key==='vg') ok=!spec||String(spec).replace(/\s/g,'').toLowerCase().includes(m.vg.toLowerCase());
    if(key==='pri'||key==='sec'){ const mm=String(spec).match(/([\d.]+)/); ok=!mm||[p.hvV,p.lvV].some(x=>Math.abs(x-parseFloat(mm[1]))<0.5); }
    if(key==='eff'){ const mm=String(spec).match(/([\d.]+)/); ok=!mm||o.loss.eff100>=parseFloat(mm[1]); }
    if(key==='mat') ok=!/alu|copp/i.test(spec)||(/alu/i.test(spec)?(p.lvMat==='Al'&&p.hvMat==='Al'):(p.lvMat==='Cu'&&p.hvMat==='Cu'));
    if(key==='ins'){ const mm=String(spec).match(/class\s*([A-Z])/i); ok=!mm||mm[1].toUpperCase()===p.insClass; }
    if(R_DECL.has(key)) return [String(i+1),param,spec,v,ROUND_CONF.has(param)?'Confirmed':'To confirm',key,true];
    return [String(i+1),param,spec,v,ok===false?'Does not comply':'Complies',key,false]; }); }
function roundCompRender(){ const el=$('#oComp'); if(!el||!CUR) return;
  if(!ROUND_REQ.length){ el.innerHTML='<h3>Compliance</h3><p class="hint">Import the customer requirement sheet (button at the top of the form) to check this design against it row by row.</p>'; return; }
  const rows=roundCompRows(CUR.o); CUR.comp=rows;
  el.innerHTML='<h3>Compliance with '+esc(ROUND_REQ_NAME)+'</h3><p class="hint">Calculated rows are checked automatically. Rows the tool cannot calculate stay "To confirm" until you tick them.</p><div class="tblwrap"><table><tr><th>#</th><th>Parameter</th><th>Specification</th><th>Offered / design value</th><th>Status</th></tr>'+
    rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td><td>'+esc(r[3])+'</td><td style="font-weight:600;white-space:nowrap;color:'+({Complies:'#2E7D4F',Confirmed:'#2E7D4F','To confirm':'#9A6B00'}[r[4]]||'#B23A2E')+'">'+(r[6]?'<label class="conf"><input type="checkbox" data-oconf="'+esc(r[1])+'"'+(r[4]==='Confirmed'?' checked':'')+'> '+r[4]+'</label>':r[4])+'</td></tr>').join('')+'</table></div>';
  el.querySelectorAll('[data-oconf]').forEach(cb=>cb.addEventListener('change',()=>{ cb.checked?ROUND_CONF.add(cb.dataset.oconf):ROUND_CONF.delete(cb.dataset.oconf); roundCompRender(); roundAfterRun(); })); }

// ---- adapters for the shared extras ----
EXTRAS.register('rect',{kind:'rect',
  ready:()=>!!RCUR&&!$('#rInputCheck').classList.contains('err'), errMsg:()=>$('#rInputCheck').classList.contains('err')?'Fix the highlighted inputs first.':'Calculate a design first.',
  gtpData:()=>rGtpData(RCUR.o,RCUR.meta), meta:()=>RCUR.meta, gtSummary:()=>rGtSummary(RCUR.o), gtState:()=>R_GT, drawing:pr=>rDrawing(RCUR.o,pr), fileName:rfname,
  pdRequired:()=>Math.max(RCUR.o.p.priV,RCUR.o.p.secV)>=3600,
  plateExtra:()=>({title:'Dry-type transformer, rectangular core',ecf:RCUR.meta.env,altitude:(RCUR.o.p.altitude||1000)+' m',taps:[]}),
  cadParams:()=>{ const o=RCUR.o, p=o.p; return [['Core_W',o.W,'mm','Core (lamination) width'],['Core_D',o.D,'mm','Core build (stack)'],['Limb_H',o.limb,'mm','Limb / window height'],['Window_W',o.winW,'mm','Window width'],
    ['Centre_C',o.Cd,'mm','Limb centre distance'],['Yoke_L',o.yokeL,'mm','Yoke length'],['Yoke_H',o.W,'mm','Yoke height'],['Bobbin_gap',p.gap/2,'mm','Core to inner winding, per side'],
    ['Inner_ID_W',o.ID1w,'mm','Inner winding inside, W direction'],['Inner_ID_D',o.ID1d,'mm','Inner winding inside, D direction'],['Inner_OD_W',o.OD1w,'mm','Inner winding outside, W'],['Inner_OD_D',o.OD1d,'mm','Inner winding outside, D'],
    ['Inner_len',o.len1,'mm','Inner winding axial length'],['Inner_rad',o.rad1,'mm','Inner winding radial depth'],['Gap_delta',p.delta/2,'mm','Inner to outer gap, per side'],
    ['Outer_ID_W',o.ID2w,'mm','Outer winding inside, W'],['Outer_ID_D',o.ID2d,'mm','Outer winding inside, D'],['Outer_OD_W',o.OD2w,'mm','Outer winding outside, W'],['Outer_OD_D',o.OD2d,'mm','Outer winding outside, D'],
    ['Outer_len',o.len2,'mm','Outer winding axial length'],['Outer_rad',o.rad2,'mm','Outer winding radial depth'],['Coil_gap_am',p.am,'mm','Coil to coil'],['R1',o.R[0],'mm','Corner radius, inner ID'],['R2',o.R[1],'mm','Corner radius, inner OD'],['R3',o.R[2],'mm','Corner radius, outer ID'],['R4',o.R[3],'mm','Corner radius, outer OD'],
    ['Active_L',o.aL,'mm','Active part length'],['Active_B',o.aB,'mm','Active part breadth'],['Active_H',o.aH,'mm','Active part height'],['Overall_L',o.oL,'mm','Overall length'],['Overall_B',o.oB,'mm','Overall breadth'],['Overall_H',o.oH,'mm','Overall height'],
    ['Inner_turns',o.N1,'','Turns per limb'],['Outer_turns',o.N2,'','Turns per limb'],['Inner_layers',o.L1,'',''],['Outer_layers',o.L2,'',''],['Core_mass',Math.round(o.coreMass*10)/10,'kg',''],['Total_mass',Math.round(o.totMass*10)/10,'kg','']]; },
  batchTemplate:()=>{ const res=validateForm(rform,RECT_RULES,(v,b,w)=>rectCross(v,b,w,rform)); if(res.errs.length) return null; const {p}=rInputs();
    return {...p,K:null,W:null,D:null,lvLayers:null,hvLayers:null,N1:null,N2:null,lvCond:null,hvCond:null,lvCondFixed:null,hvCondFixed:null,lvDucts:null,hvDucts:null,llTarget:null}; },
  batchHead:()=>['kVA','Core W × D','B, T','K','Z %','NLL W','LL W','Total W','Eff %','Rise K','Mass kg','Price ₹','TOC ₹','Checks'],
  batchRow:o=>[String(o.p.kVA),o.W+' × '+o.D,o.Bact.toFixed(3),String(o.p.K),o.ek.toFixed(2),String(Math.round(o.NLL)),String(Math.round(o.LL)),String(Math.round(o.NLL+o.LL)),o.eff.toFixed(2),String(Math.round(Math.max(o.rise1,o.rise2))),String(Math.round(o.totMass)),Math.round(o.cost).toLocaleString('en-IN'),(o.p.capA||o.p.capB)?Math.round(o.toc).toLocaleString('en-IN'):'—',(n=>n?n+' fail':'all pass')(o.checks.filter(c=>!c.ok).length)],
  applyTypical:()=>{ const f=rform, mat=f.mat.value; f.B.value=1.4; f.J1.value=mat==='Al'?1.4:2.3; f.J2.value=mat==='Al'?1.5:2.5; for(const k of ['K','W','D','N1','N2','lvLayers','hvLayers','lvB','lvH','lvRad','lvAx','hvB','hvH','hvRad','hvAx','lvDucts','hvDucts']) if(f.elements[k]) f.elements[k].value='';
    rRun(); return 'flux 1.4 T, current density '+f.J1.value+' / '+f.J2.value+' A/mm² ('+(mat==='Al'?'aluminium':'copper')+'), design fields cleared for automatic sizing'; }});
EXTRAS.register('round',{kind:'round',
  ready:()=>!!CUR&&!$('#inputCheck').classList.contains('err'), errMsg:()=>$('#inputCheck').classList.contains('err')?'Fix the highlighted inputs first.':'Calculate a design first.',
  gtpData:()=>roundGtpData(CUR.o,CUR.meta), meta:()=>CUR.meta, gtSummary:()=>roundGtSummary(CUR.o), gtState:()=>R_GT_ROUND, drawing:pr=>roundDrawing(CUR.o,pr), fileName:fname,
  pdRequired:()=>CUR.o.inp.hvV>=3600,
  plateExtra:()=>({title:'Dry-type transformer, round core',ecf:'—',altitude:(CUR.o.inp.altitude||1000)+' m',taps:CUR.o.hv.taps.map((t,i)=>[String(i+1)+' ('+(t.pct>0?'+':'')+t.pct+'%)',String(Math.round(CUR.o.inp.hvV*(1+t.pct/100)))])}),
  cadParams:()=>{ const o=CUR.o, c=o.core; const rows=[['Core_D',c.D,'mm','Core circle diameter'],['Core_steps',c.steps.length,'','Number of steps'],['Window_H',o.window,'mm','Window (limb) height'],['Centre_C',c.CD,'mm','Limb centre distance'],['Yoke_H',c.yoke,'mm','Yoke height (approx.)'],
    ['LV_ID',o.lv.ID,'mm','LV inside diameter'],['LV_OD',o.lv.OD,'mm','LV outside diameter'],['LV_len',Math.round(o.window-2*o.lv.end),'mm','LV axial length'],['LV_end',o.lv.end,'mm','LV end clearance'],['LV_ducts',o.lv.ducts,'',''],['LV_duct_W',o.lv.ductT,'mm',''],
    ['HV_ID',o.hv.ID,'mm','HV inside diameter'],['HV_OD',o.hv.OD,'mm','HV outside diameter'],['HV_coils',o.hv.coils,'','Coils per limb'],['HV_coil_len',Math.round(o.hv.coilLen*10)/10,'mm','Axial length of one coil'],['HV_coil_gap',o.hv.coilGap,'mm',''],['HV_end',o.hv.end,'mm','HV end clearance'],
    ['Active_L',o.dims.activeL,'mm',''],['Active_B',o.dims.activeB,'mm',''],['Active_H',o.dims.activeH,'mm',''],['Encl_L',o.dims.eL,'mm',''],['Encl_B',o.dims.eB,'mm',''],['Encl_H',o.dims.eH,'mm',''],['Core_mass',Math.round(o.wts.core),'kg',''],['Total_mass',Math.round(o.wts.total),'kg','']];
    c.steps.forEach((s,i)=>rows.push(['Step'+(i+1)+'_W',s.w,'mm','Step '+(i+1)+' width'],['Step'+(i+1)+'_T',Math.round(s.stack*10)/10,'mm','Step '+(i+1)+' total stack'])); return rows; },
  batchTemplate:()=>{ const res=validateForm(form,ROUND_RULES,roundCross); if(res.errs.length) return null; const {p}=readInputs();
    return {...p,window:null,coreDia:null,lvTurns:null,lvLayers:null,lvAx:null,lvRad:null,lvDucts:null,lvDuctT:null,hvCoils:null,hvDucts:null,llTarget:null}; },
  batchHead:()=>['kVA','Core Ø','B, T','Window','Z %','NLL W','LL W','Total W','Eff %','Rise K','Mass kg','Price ₹','TOC ₹','Checks'],
  batchRow:o=>[String(o.inp.kVA),String(o.core.D),o.core.B.toFixed(3),String(o.window),o.imp.ek.toFixed(2),String(Math.round(o.loss.NLL)),String(Math.round(o.loss.LL)),String(Math.round(o.loss.total)),o.loss.eff100.toFixed(2),String(Math.round(Math.max(o.lv.grad,o.hv.grad))),String(Math.round(o.wts.total)),Math.round(o.cost.total).toLocaleString('en-IN'),(o.inp.capA||o.inp.capB)?Math.round(o.toc).toLocaleString('en-IN'):'—',(n=>n?n+' fail':'all pass')(o.checks.filter(c=>!c.ok).length)],
  applyTypical:()=>{ const f=form, kVA=parseFloat(f.kVA.value)||0, cu=f.lvMat.value==='Cu', cuH=f.hvMat.value==='Cu'; if(!kVA){ toast('Enter the kVA first.'); return ''; }
    const z=STD.zMin(kVA); f.zTarget.value=z; if(kVA>100){ f.tapPlus.value=5; f.tapMinus.value=5; f.tapStep.value=2.5; } else { f.tapPlus.value=0; f.tapMinus.value=0; f.tapStep.value=0; }
    f.k.value=cu?0.5:0.43; f.B.value=1.6; f.Jlv.value=cu?2.2:1.4; f.Jhv.value=cuH?2.4:1.5;
    for(const k of ['window','coreDia','lvTurns','lvLayers','lvAx','lvRad','lvDucts','hvCoils','hvDucts']) if(f.elements[k]) f.elements[k].value='';
    run(); return 'impedance '+z+' % (IEC 60076-5 minimum for '+kVA+' kVA), taps '+(kVA>100?'±5 % in 2.5 % steps':'none')+', k '+f.k.value+', flux 1.6 T, current density '+f.Jlv.value+' / '+f.Jhv.value+' A/mm²'; }});
bindExtras(); oList();
{ let last=null; try{ last=JSON.parse(localStorage.getItem('roundLast.v1')||'null'); }catch(e){} if(last&&last.v&&last.v.kVA){ ROUND_REQ=last.req||[]; ROUND_REQ_NAME=last.reqName||''; ROUND_CONF=new Set(last.conf||[]); R_GT_ROUND=(last.gt&&typeof last.gt==='object')?{...gtDefaults(),...last.gt}:gtDefaults();
  for(const el of form.elements){ if(el.name&&last.v[el.name]!==undefined) el.value=last.v[el.name]; } if(ROUND_REQ.length) $('#oReqStatus').textContent='Requirement: '+ROUND_REQ_NAME+' ('+ROUND_REQ.length+' rows).'; run(); } }
