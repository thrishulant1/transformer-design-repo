// ================= Rectangular-core module UI =================
const rform=$('#rf');
const REQ_DEFAULT=[
 ['kva','kVA Rating','70 kVA'],['phase','Phase & Input Frequency','3 & 50Hz'],['app','Type of application','Linear loads'],
 ['pri','Primary Voltage','433 V, 3-Phase, 3-Wire, No Taps'],['sec','Secondary Voltage','400 V, 3-Phase, 4-Wire, Star (Y)'],['vg','Vector Group','Dyn11'],
 ['eff','Efficiency @ 115 deg c & 100% load','> 97%'],['imp','% Impedance @ 115 deg c','3.0% (+0% / −10%)'],['ins','Insulation class','Class H, 180 deg c'],
 ['rise','Temperature rise at rated load by change of dcr method','Within 115˚C @ ambient temperature of 50°C'],['cool','Cooling','Natural cooled'],
 ['mat','Winding material','Aluminium'],['core','Grade of core material','CRGO M4 or better'],['std','Design standard','IEC 60076-11 / IS 2026'],
 ['pt100','Thermal sensing','PT100 in inner wdg of all coils'],['term','Termination','Aluminium bus bar dia 11 hole'],['earth','Earthing','M10 bolt welded to bottom frame'],
 ['mech','Mechanical dimension (WxDxH) in mm','Vendor to specify.'],['mount','Mounting dimensions (WxD) in mm','Vendor to specify, Mounting hole:- dia 13 holes'],
 ['wt','Weight','Vendor to specify.'],['shield','Shield','Vendor to specify based on design requirement.'],['ir','Insulation resistance','>100Mohm @ 500VDC'],
 ['hv','Dielectric withstand (wdg-wdg, wdg-earth)','3kVAC'],['noise','Noise level','50dB max @ 4ft distance'],['encl','Enclosure','Not required.'],
 ['clh','Active parts will be insulated with class-H insulation materials.','Yes.'],['paint','All Yoke surfaces are painted with High temperature paint.','Yes.'],
 ['inst','Installation Type','Outdoor within container.'],
 ['test','FAT: IR Test before HV','Yes'],['test','FAT: HV test','Yes'],['test','FAT: IR Test after HV','Yes'],['test','FAT: Winding resistance test','Yes'],
 ['test','FAT: No Load test','Yes (V, A, Wo, vector group, magnetic balance)'],['test','FAT: Short circuit test','Yes (impedance, loss)'],['test','FAT: Dimensional and visual checks','Yes (overall and mounting)']];
let REQ=REQ_DEFAULT.map(r=>r.slice()); let REQ_NAME='TRX 70 kVA, 433 V / 400 V, Al, Dyn11 (built in)';
const RBASE={kVA:70,freq:50,priV:433,secV:400,vg:'Dyn11',mat:'Al',zTarget:3,zTolPlus:0,zTolMinus:10,effMin:97,riseLimit:115,amb:50,windTemp:115,insClass:'H',grade:'M4-27',noiseMax:50,enclosure:'0',
  basis:'sheet',B:1.4,lvType:'strip',hvType:'strip',gap:12,delta:12,am:15,plateD:4,lvEnd:40,hvEndMin:40,ductW:8,ins:0.11,il:0.13,bulge:1.1,tankWkVA:1.5,extraTurn:1,roundLen:'0',coreFactor:1.32,buildF:1.5,clrL:250,clrB:260,
  pCore:270,pCond:440,pSteel:200,pFg:500,pClh:5950,pResin:650,pOthers:15,party:'Delta Electronics India',wo:'',sheetNo:'',by:'Meghana N T',appr:'Geetha B',
  altitude:1000,kFactor:1,faultMVA:'',scTime:2,scRequired:'0',envClass:'E2',climClass:'C2',fireClass:'F1',condBasis:'standard',sigmaCustom:'',riseCal1:1,riseCal2:1,noiseA:22,noiseB:35,stressCu:80,stressAl:35,bonded:'0',bendModel:'bonded',supports:0,
  chk:'',rev:'R0',po:'',dwg:''};
const RPRESETS={
  sheet70:{...RBASE,condBasis:'sheet',roundLen:'1',K:79,W:80,D:'',lvLayers:4,hvLayers:4,lvB:10.5,lvH:3.5,lvRad:1,lvAx:2,hvB:10.5,hvH:3.5,hvRad:1,hvAx:1,lvDucts:0,hvDucts:0},
  auto70:{...RBASE,basis:'refined',B:'',K:'',W:'',D:'',lvLayers:'',hvLayers:'',lvB:'',lvH:'',lvRad:'',lvAx:'',hvB:'',hvH:'',hvRad:'',hvAx:'',lvDucts:'',hvDucts:'',J1:'',J2:''}};
function rLoad(p){ for(const el of rform.elements){ if(!el.name) continue; const v=p[el.name]; el.value=(v===undefined||v===null)?'':v; } rRun(); }
function rNum(n){ const el=rform.elements[n]; if(!el) return null; const s=String(el.value).trim(); return s===''?null:parseFloat(s); }
function rStr(n){ return rform.elements[n]?rform.elements[n].value:''; }
function rInputs(){
  const vg=rStr('vg'); const priConn=vg[0]==='D'?'D':'Y'; const sc=vg.slice(1).replace(/n/g,''); const secConn=/^d/i.test(sc)?'D':'Y';
  const mat=rStr('mat'); const n=rNum;
  const cond=(pre)=>{ const t=rStr(pre+'Type'), b=n(pre+'B'), h=t==='round'?b:n(pre+'H'), rad=n(pre+'Rad')||1, ax=n(pre+'Ax')||1; return (b&&h)?{type:t,b,h,rad,ax}:null; };
  const c1=cond('lv'), c2=cond('hv');
  const p={...RC_DEFAULTS,kVA:n('kVA'),freq:n('freq'),priV:n('priV'),priConn,secV:n('secV'),secConn,vg,mat,grade:rStr('grade'),insClass:rStr('insClass'),
    zTarget:n('zTarget'),zTolPlus:n('zTolPlus')??0,zTolMinus:n('zTolMinus')??10,effMin:n('effMin')??97,riseLimit:n('riseLimit')??115,amb:n('amb')??50,windTemp:n('windTemp')??115,noiseMax:n('noiseMax')??50,
    basis:rStr('basis'),K:n('K'),B:n('B'),W:n('W'),D:n('D'),lvLayers:n('lvLayers'),hvLayers:n('hvLayers'),N1:n('N1'),N2:n('N2'),J1:n('J1'),J2:n('J2'),
    gap:n('gap')??12,delta:n('delta')??12,am:n('am')??15,plateD:n('plateD')??4,lvEnd:n('lvEnd')??40,hvEndMin:n('hvEndMin')??40,lvDucts:n('lvDucts'),hvDucts:n('hvDucts'),
    lvDuctW:n('ductW')??8,hvDuctW:n('ductW')??8,lvIns:n('ins')??0.11,hvIns:n('ins')??0.11,lvIL:n('il')??0.13,hvIL:n('il')??0.13,bulge:n('bulge')??1.1,
    tankWkVA:n('tankWkVA')??1.5,extraTurn:n('extraTurn')??1,roundLen:rStr('roundLen')==='1',coreFactor:n('coreFactor')??1.32,buildF:n('buildF')??1.5,clrL:n('clrL')??250,clrB:n('clrB')??260,enclosure:rStr('enclosure')==='1',
    price:{core:n('pCore')??270,coreSteel:n('pSteel')??200,cond:n('pCond')??440,leads:n('pCond')??440,fg:n('pFg')??500,connFg:n('pFg')??500,clh:n('pClh')??5950,resin:n('pResin')??650,crca:90,others:n('pOthers')??15},
    altitude:n('altitude')??1000,kFactor:n('kFactor')??1,faultMVA:n('faultMVA'),scTime:n('scTime')??2,scRequired:rStr('scRequired')==='1',
    condBasis:rStr('condBasis')||'standard',sigmaCustom:n('sigmaCustom'),riseCal1:n('riseCal1')??1,riseCal2:n('riseCal2')??1,noiseA:n('noiseA')??22,noiseB:n('noiseB')??35,stressCu:n('stressCu')??80,stressAl:n('stressAl')??35,bonded:rStr('bonded')==='1',llTarget:n('llTarget'),llTol:n('llTol')??5,bendModel:rStr('bendModel')||'bonded',supports:n('supports')??0,capA:n('capA'),capB:n('capB'),ovPct:n('ovPct')??10,bSat:n('bSat')??1.9,
    lvCond:c1,hvCond:c2,lvCondFixed:c1&&n('lvLayers')?c1:null,hvCondFixed:c2&&n('hvLayers')?c2:null};
  if(p.condBasis==='custom'&&!p.sigmaCustom) p.condBasis='standard';
  const manual=p.K&&p.B&&p.W&&p.lvLayers&&p.hvLayers&&c1&&c2&&p.lvDucts!=null&&p.hvDucts!=null;
  const meta={party:rStr('party'),wo:rStr('wo'),sheetNo:rStr('sheetNo'),by:rStr('by'),appr:rStr('appr'),chk:rStr('chk'),rev:rStr('rev'),po:rStr('po'),dwg:rStr('dwg'),env:rStr('envClass')+' / '+rStr('climClass')+' / '+rStr('fireClass')};
  return {p,manual,meta};
}
let RCUR=null, rTimer;
rform.addEventListener('input',()=>{ clearTimeout(rTimer); rTimer=setTimeout(rRun,450); });
rform.addEventListener('change',e=>{ if(e.target.name==='mat'){ rform.pCond.value=e.target.value==='Cu'?900:440; } clearTimeout(rTimer); rTimer=setTimeout(rRun,60); });
// Automatic design runs in the shared background worker (see autoAsync in validation.js)
function rAutoAsync(p){ return autoAsync('rect',p); }
let rRunSeq=0;
function rRun(){
  if(!showInputCheck('#rInputCheck','#rKpis, #rWarns, #rOk, #rtab-sheet, #rtab-comp, #rtab-tests, #rtab-steps',validateForm(rform,RECT_RULES,(v,b,w)=>rectCross(v,b,w,rform)))){ ++rRunSeq; $('#rAutoNote').textContent=''; return; }
  const {p,manual,meta}=rInputs();
  const seq=++rRunSeq; $('#rAutoNote').textContent=manual?'Calculating…':'Designing automatically…';
  const t0=performance.now();
  const job=manual?Promise.resolve().then(()=>rectDesign(p)):rAutoAsync(p);
  job.then(o=>{ if(seq!==rRunSeq) return;
    if(!o){ $('#rWarns').classList.add('on'); $('#rWarns ul').innerHTML='<li>No winding arrangement fits these fixed values. Clear one of the design fields so it can be chosen automatically.</li>'; $('#rAutoNote').textContent=''; return; }
    const ms=Math.round(performance.now()-t0);
    $('#rAutoNote').textContent=manual?'All design values are fixed, so this is a direct calculation.'+(p.basis==='sheet'?' Basis: as per design sheet.':''):
      'Blank design values were chosen automatically: '+(o.searched||0).toLocaleString('en-IN')+' designs checked in '+ms+' ms'+(o.autoB?', flux density included':'')+(p.capA||p.capB?'. The design with the lowest total owning cost that meets the requirement is shown.':'. The cheapest design meeting the requirement is shown.')+(o.turnsAdjusted?' Turns were adjusted to meet the IEC ratio tolerance.':'');
    $('#rFix').hidden=manual;
    const M=rModel(o,meta); RCUR={o,M,meta,p}; rRender(o,M); rAfterRun();
  }).catch(e=>{ console.error(e); $('#rWarns').classList.add('on'); $('#rWarns ul').innerHTML='<li>These inputs cannot be designed: '+esc(e.message)+'.</li>'; });
}
function rAfterRun(){}
// Re-render from the last result (after ticking a confirmation or entering test values) without redesigning
function rRerender(){ if(!RCUR) return; RCUR.M=rModel(RCUR.o,RCUR.meta); rRender(RCUR.o,RCUR.M); rSaveLast(); }
function rSaveLast(){}
function rApplyCal(c){ const set=(k,v)=>{ if(rform.elements[k]) rform.elements[k].value=v; }; const cur=k=>rNum(k);
  if(c.key==='coreLoss') set('coreFactor',((cur('coreFactor')??1.32)*c.mult).toFixed(4));
  if(c.key==='riseCal1') set('riseCal1',((cur('riseCal1')??1)*c.mult).toFixed(3));
  if(c.key==='riseCal2') set('riseCal2',((cur('riseCal2')??1)*c.mult).toFixed(3));
  if(c.key==='sigma'){ const s=RCUR.o.sig*c.mult; set('condBasis','custom'); set('sigmaCustom',s.toFixed(3)); }
  if(c.key==='noiseA') set('noiseA',((cur('noiseA')??22)+c.add).toFixed(1));
  toast('Calibration applied to the form. Record the test report reference.'); rRun(); }
$('#rFix').addEventListener('click',()=>{ if(!RCUR) return; const o=RCUR.o, q=o.p; const set=(k,v)=>{ if(rform.elements[k]) rform.elements[k].value=v; };
  set('K',q.K); set('B',q.B); set('W',o.W); set('N1',o.N1); set('N2',o.N2); set('lvLayers',o.L1); set('hvLayers',o.L2); set('lvDucts',q.lvDucts); set('hvDucts',q.hvDucts);
  for(const [pre,C] of [['lv',o.C1],['hv',o.C2]]){ set(pre+'Type',C.type); set(pre+'B',C.b); set(pre+'H',C.type==='round'?'':C.h); set(pre+'Rad',C.rad); set(pre+'Ax',C.ax); }
  toast('Automatic values copied. Edit any of them to fine-tune.'); rRun(); });
const g=(x,n=2)=>(x==null||isNaN(x))?'–':Number(x).toFixed(n);
function condTxt(C,ins){ return C.type==='round'?'Ø '+g(C.b,2):g(C.b,2)+' × '+g(C.h,2); }
function condTxtI(C){ return C.type==='round'?'Ø '+g(C.bi,2):g(C.bi,2)+' × '+g(C.hi,2); }
function rModel(o,m){
  const p=o.p, W1=o.W1, W2=o.W2, T=p.windTemp, mat=RC.COND[p.mat].name;
  const cn=c=>c==='D'?'Delta':'Star';
  const date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const title={title:'Electrical design calculations — rect core type, '+p.kVA+' kVA '+p.priV+' / '+p.secV+' V, '+p.vg,
    cells:[['Party',m.party||'—'],['Work order',m.wo||'—'],['Calc. sheet no.',m.sheetNo||'—'],['Date',date],
      ['kVA / phase',p.kVA+' kVA, 3 phase'],['Connection',p.vg],['Cooling','AN, class '+p.insClass],['Frequency',p.freq+' Hz'],
      ['Frame W / D / limb H / C.dist',o.W+' / '+o.D+' / '+g(o.limb,2)+' / '+g(o.Cd,0)],['K / V per turn',p.K+' / '+g(o.Vt,4)],['Wind. temp / ambient',T+' °C / '+p.amb+' °C'],['Standards','IS 2026 / IS 11171, IEC 60076-11'],
      ['ek % calc / guaranteed',g(o.ek,2)+' / '+p.zTarget],['Calculation basis',(p.basis==='sheet'?'As per design sheet':'Refined')+', σ '+({sheet:'sheet',standard:'IEC',custom:'supplier'}[p.condBasis]||'')],['Designed / checked',(m.by||'—')+' / '+(m.chk||'—')],['Approved',m.appr||'—'],
      ['Revision',m.rev||'R0'],['Customer PO',m.po||'—'],['Drawing no.',m.dwg||'—'],['E / C / F class',m.env||'—'],['Altitude / K-factor',(p.altitude||0)+' m / K-'+(p.kFactor||1)],['Fault level / duration',(p.faultMVA?p.faultMVA+' MVA':'infinite bus')+' / '+p.scTime+' s'],['Tool version',APP_VERSION],['Freq. correction',p.freq===50?'none (50 Hz tables)':'× '+g(STD.fLoss(p.freq),3)+' on W/kg']]};
  const wind=[['Winding',W1.role+' (inner)',W2.role+' (outer)'],
    ['Connection',cn(W1.conn),cn(W2.conn)],['Line voltage, V',String(W1.V),String(W2.V)],['Rated voltage / phase, V',g(W1.Vph,2),g(W2.Vph,2)],['Rated current / phase, A',g(W1.Iph,3),g(W2.Iph,3)],
    ['Conductor',mat+' '+o.C1.type,mat+' '+o.C2.type],['Wire bare, mm',condTxt(o.C1),condTxt(o.C2)],['Wire insulated, mm',condTxtI(o.C1),condTxtI(o.C2)],['Insulation, mm',g(p.lvIns,2),g(p.hvIns,2)],
    ['No. in parallel R × A',o.C1.rad+' × '+o.C1.ax,o.C2.rad+' × '+o.C2.ax],['Cross section, mm²',g(o.C1.cs,2),g(o.C2.cs,2)],['Current density, A/mm²',g(o.J1,3),g(o.J2,3)],
    ['Turns / limb',String(o.N1),String(o.N2)],['Layers',String(o.L1),String(o.L2)],['Turns / layer (fullest layer)',g(o.tpl1,2)+' ('+o.tplAx1+')',g(o.tpl2,2)+' ('+o.tplAx2+')'],['Insulation b/w layers, mm (required)',g(p.lvIL,2)+' ('+g(o.ilReq1,3)+')',g(p.hvIL,2)+' ('+g(o.ilReq2,3)+')'],
    ['Radial ducts',p.lvDucts+' × '+p.lvDuctW+' mm',p.hvDucts+' × '+p.hvDuctW+' mm'],['Wind length (axial), mm',g(o.len1,2),g(o.len2,2)],['Winding length for impedance, mm',g(o.imp1,2),g(o.imp2,2)],
    ['End clearances, mm',g(o.end1,0),g(o.end2,0)],['Limb length, mm',g(o.limb,2),g(o.limb,2)],['Winding radial depth, mm',g(o.rad1,1),g(o.rad2,1)],['Turn length, m',g(o.m1/1000,4),g(o.m2/1000,4)],
    ['Wire length / phase, m',g(o.wire1,2),g(o.wire2,2)],['Conductivity @'+T+' °C, m/Ω·mm²',g(o.sig,3),g(o.sig,3)],['Resistance / phase @'+T+' °C, Ω',g(o.Rw1,6),g(o.Rw2,6)],['Conductor bare / insulated, kg',g(o.bare1,2)+' / '+g(o.ins1,2),g(o.bare2,2)+' / '+g(o.ins2,2)],
    ['Stray losses, %',g(o.st1,3),g(o.st2,3)],['Load loss @'+T+' °C, W',g(o.LL1,1),g(o.LL2,1)],['Surface area / limb, m²',g(o.S1,4),g(o.S2,4)],['Loading, W/m²',g(o.q1,1),g(o.q2,1)],
    ['Winding temp. rise, K',g(o.rise1,1),g(o.rise2,1)],['Halacsy cross-check, K',g(o.hal1,1),g(o.hal2,1)],
    ['S.C. current, A (× rated)',f0(o.sc.windings[0].Isc)+' ('+g(o.sc.mult,1)+')',f0(o.sc.windings[1].Isc)],['S.C. current density, A/mm²',g(o.sc.windings[0].J,1),g(o.sc.windings[1].J,1)],
    ['S.C. temperature after '+o.sc.t+' s, °C (limit)',g(o.sc.windings[0].th1,0)+' ('+o.sc.windings[0].lim+')',g(o.sc.windings[1].th1,0)+' ('+o.sc.windings[1].lim+')'],
    ['S.C. radial force, kN',g(o.sc.windings[0].Fr/1000,1),g(o.sc.windings[1].Fr/1000,1)],['S.C. hoop stress, MPa (limit)',g(o.sc.windings[0].sigma,1)+' compr.',g(o.sc.windings[1].sigma,1)+' ('+o.sc.windings[1].stressLim+')'],
    ['S.C. axial compression (est.), kN',g(o.sc.windings[0].Fa/1000,2),g(o.sc.windings[1].Fa/1000,2)],
    ['S.C. bending, straight sides (est.), MPa',g(o.bend1,1)+' (span '+g(o.span,0)+')',g(o.bend2,1)]];
  const build=[['Core W × D (with limb plate)',o.W+' × '+o.D+' ('+o.cW+' × '+o.cD+') mm'],['Bobbin gap / δ / am',p.gap+' / '+p.delta+' / '+p.am+' mm'],
    ['Inner ID / OD (W × D)',g(o.ID1w,1)+' × '+g(o.ID1d,1)+' / '+g(o.OD1w,1)+' × '+g(o.OD1d,1)],['Outer ID / OD (W × D)',g(o.ID2w,1)+' × '+g(o.ID2d,1)+' / '+g(o.OD2w,1)+' × '+g(o.OD2d,1)],
    ['Centre distance / yoke length',g(o.Cd,1)+' / '+g(o.yokeL,1)+' mm'],['Window width × height',g(o.winW,1)+' × '+g(o.limb,2)+' mm'],['Corner radii R1–R4',o.R.map(x=>g(x,1)).join(' / ')+' mm'],
    ['Perimeters P1–P4',o.P.join(' / ')+' mm'],['Mean length inner / gap / outer',g(o.m1,1)+' / '+g(o.mg,1)+' / '+g(o.m2,1)+' mm']];
  const core=[['Net cross section',g(o.Anet,2)+' cm²'],['Stacking factor',String(o.sf)],['Flux density',g(o.Bact,3)+' T'],['Steel grade',p.grade],['Core mass',g(o.coreMass,2)+' kg'],
    ['Specific loss × factor',g(o.spec,3)+' × '+p.coreFactor+' = '+g(o.spec*p.coreFactor,3)+' W/kg'],['Building factor',String(p.buildF)],['Core loss',g(o.NLL,1)+' W'],
    ['VA/kg / gap VA/cm²',g(o.vakg,3)+' / '+g(o.vacm,3)],['Σ VA (limb, yoke, corner, gap)',g(o.VA,1)+' VA'],['No-load current',g(o.I0,3)+' %'],['Extra no-load loss',g(o.extraNL,3)+' W']];
  const imp=[['h (mean wdg length)',g(o.h,2)+' mm'],['b (radial span)',g(o.bb,2)+' mm'],['k_r',g(o.kr,4)],['Ls',g(o.Ls,2)+' mm'],['δ′',g(o.dP,2)+' mm²'],
    ['Er',g(o.er,3)+' %'],['Ex',g(o.ex,3)+' %'],['Ek',g(o.ek,3)+' % (limits '+g(o.zLo,2)+'–'+g(o.zHi,2)+')']];
  const loss=[['Inner winding',g(o.LL1,1)+' W'],['Outer winding',g(o.LL2,1)+' W'],['Tank / stray (W/kVA × kVA)',g(o.tank,0)+' W'],['Total load loss',g(o.LL,1)+' W'],['Core loss',g(o.NLL,1)+' W'],
    ['Total loss',g(o.LL+o.NLL,1)+' W'],['Efficiency 100 % / 50 %, pf 1',g(o.eff,2)+' / '+g(o.eff50,2)+' %'],['McLyman overall rise',g(o.mcly,1)+' K'],['Noise estimate',g(o.noise,1)+' dB(A)'],['Turns-ratio error (limit)',g(o.rerr,3)+' % ('+g(o.ratioLim,3)+' %)'],['Rise limit (altitude-derated)',g(o.riseLim,1)+' K'],['Hot-spot (IEC 60076-12)',g(o.hs.tHS,0)+' °C (max '+o.hs.max+')'],['Insulation life at continuous rated load and '+p.amb+' °C',g(o.hs.lifeY,1)+' years (normal life at '+o.hs.rated+' °C hot-spot)'],...((p.capA||p.capB)?[['Total owning cost','₹ '+f0(o.toc)+' (price + '+f0(p.capA||0)+' ₹/kW × NLL + '+f0(p.capB||0)+' ₹/kW × LL)']]:[])];
  const mech=[['Active part L × B × H',o.aL+' × '+o.aB+' × '+o.aH+' mm'],['Overall L × B × H',o.oL+' × '+o.oB+' × '+o.oH+' mm'],['Core and winding mass',o.coreWdg+' kg'],['Total mass (without enclosure)',g(o.totMass-(o.bom.find(b=>b.k==='CRCA enclosure')||{q:0}).q,1)+' kg'],['Total mass',g(o.totMass,1)+' kg']];
  const bom=o.bom.map((b,i)=>[String(i+1),b.k,g(b.q,2),b.pr?String(b.pr):'—',b.amt?f0(b.amt):'—']);
  bom.push(['','Sub-total','','',f0(o.matCost)],['','Others @ '+p.price.others+' %','','',f0(o.others)],['','RM price','','',f0(o.cost)]);
  const comp=compRows(o);
  return {title,wind,build,core,imp,loss,mech,bom,comp,steps:rSteps(o),checks:o.checks,warn:o.warn,gt:gtRows(rGtSummary(o),R_GT).rows,values:rValues(o)};
}
function reqKey(t){ t=t.toLowerCase();
  const K=[['kva','kva'],['phase','phase'],['applicat','app'],['primary','pri'],['secondary','sec'],['vector','vg'],['efficien','eff'],['impedance','imp'],['resistance','ir'],['insulation class','ins'],
    ['temperature rise','rise'],['cooling','cool'],['winding material','mat'],['core','core'],['standard','std'],['thermal','pt100'],['terminat','term'],['earthing','earth'],['mechanical','mech'],['mounting','mount'],
    ['weight','wt'],['shield','shield'],['dielectric','hv'],['noise','noise'],['enclosure','encl'],['class-h','clh'],['class h insul','clh'],['paint','paint'],['installation','inst'],['test','test'],['check','test']];
  for(const [k,v] of K) if(t.includes(k)) return v; return 'other'; }
// Rows the tool cannot calculate are declarations: they stay 'To confirm' until the designer ticks them.
const R_DECL=new Set(['app','std','pt100','term','earth','shield','ir','hv','clh','paint','inst','test','other']);
let R_CONF=new Set();
let R_GT=gtDefaults();
function rGtSummary(o){ const p=o.p; return {NLL:o.NLL,LL:o.LL,Z:o.ek,I0:o.I0,ratio:o.rerr,R1:o.Rw1,R2:o.Rw2,T:p.windTemp,rise1:o.rise1,rise2:o.rise2,noise:o.noise,mat1:p.mat,mat2:p.mat,
  names:[o.W1.role+' (inner)',o.W2.role+' (outer)'],riseLim:o.riseLim,noiseMax:p.noiseMax,zTarget:p.zTarget,zWindow:[o.zLo,o.zHi]}; }
// Key results as numbers (for the Excel "Values" sheet)
function rValues(o){ const p=o.p; return [['kVA',p.kVA,'kVA'],['Volts per turn',o.Vt,'V'],['Turns inner',o.N1,''],['Turns outer',o.N2,''],['Ratio error',o.rerr,'%'],['Core width W',o.W,'mm'],['Core build D',o.D,'mm'],
  ['Net core area',o.Anet,'cm²'],['Flux density',o.Bact,'T'],['Limb length',o.limb,'mm'],['Centre distance',o.Cd,'mm'],['Inner axial length',o.len1,'mm'],['Outer axial length',o.len2,'mm'],['Inner radial depth',o.rad1,'mm'],['Outer radial depth',o.rad2,'mm'],
  ['Current density inner',o.J1,'A/mm²'],['Current density outer',o.J2,'A/mm²'],['Resistance inner @ref',o.Rw1,'Ω'],['Resistance outer @ref',o.Rw2,'Ω'],['Load loss inner',o.LL1,'W'],['Load loss outer',o.LL2,'W'],['Stray/tank loss',o.tank,'W'],
  ['Total load loss',o.LL,'W'],['Core loss',o.NLL,'W'],['No-load current',o.I0,'%'],['Er',o.er,'%'],['Ex',o.ex,'%'],['Ek',o.ek,'%'],['Efficiency 100 %',o.eff,'%'],['Efficiency 50 %',o.eff50,'%'],
  ['Rise inner',o.rise1,'K'],['Rise outer',o.rise2,'K'],['S.C. temperature inner',o.sc.windings[0].th1,'°C'],['S.C. temperature outer',o.sc.windings[1].th1,'°C'],['Hoop stress outer',o.sc.windings[1].sigma,'MPa'],['Noise estimate',o.noise,'dB(A)'],
  ['Core mass',o.coreMass,'kg'],['Conductor mass (insulated)',o.ins1+o.ins2,'kg'],['Total mass',o.totMass,'kg'],['Active part L',o.aL,'mm'],['Active part B',o.aB,'mm'],['Active part H',o.aH,'mm'],['RM price',o.cost,'Rs']]; }
function compRows(o){
  const p=o.p; const ck=n=>o.checks.find(c=>c.name.startsWith(n));
  const offer={kva:[p.kVA+' kVA',true],phase:['3 phase, '+p.freq+' Hz',true],app:['Designed for linear loads',true],
    pri:[p.priV+' V, '+(p.priConn==='D'?'delta, 3-wire':'star')+', no taps',true],sec:[p.secV+' V, '+(p.secConn==='Y'?'star (Y), 4-wire, neutral brought out':'delta'),true],vg:[p.vg,true],
    eff:[g(o.eff,2)+' % @'+p.windTemp+' °C, 100 % load',ck('Efficiency').ok],imp:[g(o.ek,2)+' % @'+p.windTemp+' °C',ck('Impedance').ok],ins:['Class '+p.insClass+' materials',true],
    rise:['Inner '+g(o.rise1,1)+' K, outer '+g(o.rise2,1)+' K at '+p.amb+' °C ambient',ck('Winding temperature').ok],cool:['AN, natural air cooled',true],mat:[RC.COND[p.mat].name.toLowerCase().replace(/^./,c=>c.toUpperCase())+' strip / wire',true],
    core:['CRGO '+p.grade+', '+g(o.Bact,3)+' T',true],std:[(Math.max(p.priV,p.secV)<=1100?'IS 2026 / IEC 60076-11 applied by agreement (LV/LV unit: IEC 60076-11 scope is windings above 1.1 kV)':'IS 2026 / IS 11171 / IEC 60076-11'),true],pt100:['PT100 in inner winding of each limb',true],term:['As specified: '+'aluminium bus bar',true],earth:['As specified',true],
    mech:['Active part '+o.aL+' × '+o.aB+' × '+o.aH+' (overall '+o.oL+' × '+o.oB+' × '+o.oH+')',true],mount:['Frame footprint '+o.aL+' × '+o.aB+', Ø13 holes',true],
    wt:[g(o.totMass,0)+' kg',true],shield:['Not required for linear loads; electrostatic shield optional',true],ir:['> 100 MΩ @ 500 V DC, verified at FAT',true],
    hv:[(Math.max(p.priV,p.secV)<=1100?'3 kV AC, 1 min (Um 1.1 kV)':'Per IS 11171 for Um '+Math.max(p.priV,p.secV)/1000+' kV'),true],noise:['Estimate '+ck('Noise').got+' (to be measured at FAT)',ck('Noise').ok],encl:[p.enclosure?'CRCA enclosure supplied':'Not supplied',true],clh:['Yes',true],paint:['Yes',true],
    inst:['Suitable for outdoor use within container',true],test:['Will be carried out',true],other:['Noted',true]};
  const numEq=(spec,val)=>{ const m=String(spec).match(/([\d.]+)/); return !m||Math.abs(parseFloat(m[1])-val)<0.01; };
  const vgEq=(spec)=>{ const s=String(spec).replace(/\s/g,'').toLowerCase(); return !s||s.includes(p.vg.toLowerCase()); };
  return REQ.map(([k,param,spec],i)=>{ const key=k||reqKey(param); let [v,ok]=offer[key]||offer.other;
    if(key==='kva') ok=numEq(spec,p.kVA); if(key==='pri') ok=numEq(spec,p.priV); if(key==='sec') ok=numEq(spec,p.secV); if(key==='vg') ok=vgEq(spec);
    if(key==='mat') ok=!/alu|copp/i.test(spec)||(/alu/i.test(spec)===(p.mat==='Al'));
    if(R_DECL.has(key)){ const conf=R_CONF.has(param); return [String(i+1),param,spec,v,conf?'Confirmed':'To confirm',key,true]; }
    return [String(i+1),param,spec,v,ok?'Complies':'Does not comply',key,false]; });
}
function rSteps(o){
  const p=o.p,W1=o.W1,W2=o.W2,T=p.windTemp; const s=[]; const S=(t,f,r)=>s.push([t,f,r]);
  S('Volts per turn','V/t = 1.01 × √(kVA/3) × K/100 = 1.01 × √('+p.kVA+'/3) × '+p.K+'/100',g(o.Vt0,4)+' V');
  S('Phase voltages',W1.role+' '+(W1.conn==='Y'?'star: V/√3':'delta: V')+'; '+W2.role+' '+(W2.conn==='Y'?'star: V/√3':'delta: V'),g(W1.Vph,2)+' / '+g(W2.Vph,2)+' V');
  S('Phase currents','I = kVA × 1000 ÷ (√3 V_L) for star, ÷ (3 V_L) for delta',g(W1.Iph,3)+' / '+g(W2.Iph,3)+' A');
  S('Turns per limb','N = round(V_ph ÷ V/t)',o.N1+' / '+o.N2);
  S('Turns-ratio error','(V ratio − N ratio) ÷ V ratio × 100',g(o.rerr,3)+' %');
  S('Net core area','A = V/t ÷ (4.44 × f × B × 10⁻⁴) = '+g(o.Vt,4)+' ÷ (4.44 × '+p.freq+' × '+p.B+' × 10⁻⁴)',g(o.Areq,2)+' cm²');
  S('Core build D','D = round(A ÷ stacking ÷ (W × 0.1) × 10) with W = '+o.W,o.D+' mm, B = '+g(o.Bact,3)+' T');
  S('Conductor section','{(b × h) − corner} × R × A; corner from strip height table',g(o.C1.cs,2)+' / '+g(o.C2.cs,2)+' mm²');
  S('Current density','I ÷ section',g(o.J1,3)+' / '+g(o.J2,3)+' A/mm²');
  S('Turns per layer','N ÷ layers = '+o.N1+' ÷ '+o.L1+', '+o.N2+' ÷ '+o.L2+'; the fullest layer holds whole turns (rounded up)',g(o.tpl1,2)+' / '+g(o.tpl2,2)+' → '+o.tplAx1+' / '+o.tplAx2+' turns');
  const et=p.extraTurn==null?1:p.extraTurn;
  const axw=(C,tpl,extra,len)=>{ const raw=C.bi*C.ax*(tpl+et)+extra;
    return g(C.bi,2)+' × '+C.ax+' × ('+g(tpl,2)+' + '+et+')'+(extra?' + '+g(extra,1):'')+' = '+g(raw,2)+(p.roundLen?' → '+len+' (rounded)':''); };
  S('Axial winding length','b_i × axial parallels × (turns/layer + '+et+' for the layer crossover) + transposition + ducts. Inner: '+axw(o.C1,o.tplAx1,p.lvTransp+p.lvComp+p.lvAxDucts,o.len1)+'; Outer: '+axw(o.C2,o.tplAx2,p.hvTransp+p.hvComp+p.hvAxDucts,o.len2),g(o.len1,2)+' / '+g(o.len2,2)+' mm');
  S('Limb length','inner length + '+p.lvEnd+' end clearance (outer end clearance = limb − outer length)',g(o.limb,2)+' mm, outer ends '+g(o.end2,2)+' mm');
  S('Radial depth','(h_i × R × layers + ducts × width + insulation × (layers − 1)) × '+p.bulge+', rounded to 0.5 mm',g(o.rad1,1)+' / '+g(o.rad2,1)+' mm');
  S('Build-up','ID = core + bobbin gap; OD = ID + 2 × radial; outer ID = inner OD + δ','inner '+g(o.OD1w,1)+' × '+g(o.OD1d,1)+', outer '+g(o.OD2w,1)+' × '+g(o.OD2d,1)+' mm');
  S('Centre distance, yoke','C = outer OD (W) + am; yoke = 2C + W',g(o.Cd,1)+' / '+g(o.yokeL,1)+' mm');
  S('Mean turn lengths','P = 2W + 2D + 2πR with R1…R4 = '+o.R.map(x=>g(x,1)).join(', '),g(o.m1,1)+' / '+g(o.m2,1)+' mm');
  S('Resistance','R = wire length ÷ (section × σ'+T+'), σ = '+g(o.sig,3)+' m/Ω·mm²',g(o.Rw1,6)+' / '+g(o.Rw2,6)+' Ω');
  S('Conductor mass','length × section × density × 3; insulated adds covering at density 2',g(o.ins1,2)+' / '+g(o.ins2,2)+' kg');
  S('Stray loss','[(h/10) × √(fill) × '+RC.COND[p.mat].sf+']⁴ × (layers × R)² ÷ 9 × 100',g(o.st1,3)+' / '+g(o.st2,3)+' %');
  S('Load loss','3 × I² × R × (1 + stray) per winding, plus '+p.tankWkVA+' W/kVA stray',g(o.LL1,1)+' + '+g(o.LL2,1)+' + '+o.tank+' = '+g(o.LL,1)+' W');
  S('Resistive voltage','Er = load loss ÷ (kVA × 10)',g(o.er,3)+' %');
  S('Reactance geometry','h = '+g(o.h,2)+', b = '+g(o.bb,2)+', k_r = 1 − 1/(π h/b) = '+g(o.kr,4)+', Ls = h/k_r','Ls '+g(o.Ls,2)+' mm, δ′ '+g(o.dP,1)+' mm²');
  S('Reactive voltage','Ex = 8π² f I N δ′ × 10⁻⁸ ÷ (Ls × V/t)',g(o.ex,3)+' %');
  S('Impedance','Ek = √(Er² + Ex²)',g(o.ek,3)+' %');
  S('Core mass','(3 × limb + 2 × yoke) × 0.1 × A × 7.65 × 10⁻³',g(o.coreMass,2)+' kg');
  S('Core loss','mass × specific loss × '+p.coreFactor+' × building factor '+p.buildF,g(o.NLL,1)+' W');
  S('No-load current','Σ VA = limb + yoke + 6 × corner VA/kg + 6 × gap VA/cm²',g(o.VA,1)+' VA = '+g(o.I0,3)+' %');
  S('Winding loading','load loss ÷ (3 × turn length × winding length × (2 + 2 × ducts))',g(o.q1,1)+' / '+g(o.q2,1)+' W/m²');
  S('Temperature rise','inner 15 + W/m² ÷ 5; outer 15 + W/m² ÷ 7',g(o.rise1,1)+' / '+g(o.rise2,1)+' K');
  S('McLyman check','Θ = 450 × (Σ loss ÷ Σ surface cm²)^0.826',g(o.mcly,1)+' K');
  S('Efficiency','kVA ÷ (kVA + core loss + load loss)',g(o.eff,2)+' %');
  S('Ratio tolerance (IEC 60076-1)','limit = lower of 0.5 % and Z/10 = min(0.5, '+g(o.ek,3)+'/10)',g(o.rerr,3)+' % vs ± '+g(o.ratioLim,3)+' %');
  S('Inter-layer insulation','V/t × 2 × 2 × turns in fullest layer ÷ '+(p.Eb||10000)+' V/mm − conductor insulation',g(o.ilReq1,3)+' / '+g(o.ilReq2,3)+' mm required');
  const s0=o.sc, w0=s0.windings[0], w1=s0.windings[1];
  S('Short-circuit current','I_sc = I × 100 ÷ (Z + Z_system), Z_system = '+g(s0.zs,3)+' %; peak factor k√2 = '+g(s0.kpk,3)+' at X/R '+g(s0.xr,2),f0(w0.Isc)+' / '+f0(w1.Isc)+' A (× '+g(s0.mult,1)+')');
  S('Short-circuit thermal (IEC 60076-5)','θ₁ = θ₀ + 2(θ₀ + k)/(C/(J²t) − 1), θ₀ = ambient + rise, t = '+s0.t+' s, C = '+(p.mat==='Cu'?'106000 (Cu)':'45700 (Al)'),g(w0.th1,0)+' / '+g(w1.th1,0)+' °C (limit '+w0.lim+')');
  S('Short-circuit forces','F_r = μ₀ (N I_pk)² × mean gap perimeter ÷ (2 Ls); hoop stress = F_r ÷ (2π N A)',g(w1.Fr/1000,1)+' kN, '+g(w1.sigma,1)+' MPa outer');
  S('Hot-spot (IEC 60076-12)','θ_hs = ambient + 1.25 × average rise; life = a·e^(b/T) with Table 1 constants for class '+p.insClass,g(o.hs.tHS,0)+' °C, '+g(o.hs.lifeY,1)+' years at continuous rated load');
  S('Straight-side bending (rectangular coil)','M = f × L² / 12 per straight side (fixed at the corners), f = F_r ÷ mean perimeter, L = '+g(o.span,0)+' mm; '+(p.bendModel==='loose'?'section of the individual turns':'resin-bonded block: section = winding length × radial depth² / 6'),g(o.bend1,1)+' / '+g(o.bend2,1)+' MPa');
  S('Noise estimate','L = A + 10 log₁₀(core kg) + slope × (B − 1.4); A = '+p.noiseA+' (calibrate from a measured unit)',g(o.noise,1)+' dB(A)');
  if(p.freq!==50) S('Frequency correction','core W/kg × (f/50)^1.5, VA × f/50','× '+g(STD.fLoss(p.freq),3));
  if((p.kFactor||1)>1) S('Harmonic loading','winding eddy loss × K = '+p.kFactor+', other stray × K^0.8','included in load loss');
  S('Dimensions','active: L = 2C + (outer OD − W), B = outer OD (D), H = 2W + limb + 5; overall adds '+p.clrL+' / '+p.clrB+' / 325',o.aL+' × '+o.aB+' × '+o.aH+'; '+o.oL+' × '+o.oB+' × '+o.oH+' mm');
  S('Mass and cost','BOM ratios from the design sheet, prices ₹/kg',g(o.totMass,1)+' kg, ₹ '+f0(o.cost));
  return s;
}
function rRender(o,M){
  const p=o.p; const k=[['Impedance',g(o.ek,2),'%',!o.checks[0].ok],['Efficiency',g(o.eff,2),'%',!o.checks[1].ok],['Rise inner / outer',g(o.rise1,0)+' / '+g(o.rise2,0),'K',!o.checks[2].ok],
    ['Core W × D',o.W+' × '+o.D,'mm'],['Core loss',f0(o.NLL),'W'],['Load loss',f0(o.LL),'W'],['Total mass',f0(o.totMass),'kg'],['RM price','₹ '+f0(o.cost),'']];
  $('#rKpis').innerHTML=k.map(x=>'<div class="kpi'+(x[3]?' bad':'')+'"><span>'+x[0]+'</span><strong>'+x[1]+'</strong><em>'+x[2]+'</em></div>').join('');
  const w=$('#rWarns'); w.classList.toggle('on',o.warn.length>0); $('ul',w).innerHTML=o.warn.map(x=>'<li>'+esc(x)+'</li>').join(''); $('#rOk').classList.toggle('on',o.warn.length===0);
  const t=M.title;
  $('#rSheet').innerHTML='<div class="titleblock"><div class="big">'+esc(t.title)+'</div>'+t.cells.map(c=>'<div><span>'+c[0]+'</span>'+esc(c[1])+'</div>').join('')+'</div>'+
    '<div class="cols"><div><h3>Winding data</h3>'+tbl(M.wind.slice(1),['Parameter',M.wind[0][1],M.wind[0][2]])+'<h3>Core and coil build-up</h3>'+tbl(M.build)+'</div><div>'+
    '<h3>Core</h3>'+tbl(M.core)+'<h3>Impedance voltage</h3>'+tbl(M.imp)+'<h3>Losses and efficiency</h3>'+tbl(M.loss)+'<h3>Mechanical details</h3>'+tbl(M.mech)+
    '<h3>Bill of materials</h3><table><tr><th>#</th><th>Item</th><th>kg</th><th>₹/kg</th><th>₹</th></tr>'+M.bom.map(r=>'<tr>'+r.map((c,i)=>'<td'+(i>=2?' class="n"':'')+'>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</table>'+'<h3>Core cutting list ('+esc(o.cut.type)+')</h3><table><tr><th>Part</th><th>Step</th><th>Width</th><th>Stack</th><th>Qty</th><th>Short / long, mm</th><th>kg</th></tr>'+cutRows(o.cut).map(r=>'<tr>'+r.map((c,i)=>'<td'+(i>=1?' class="n"':'')+'>'+esc(c)+'</td>').join('')+'</tr>').join('')+'<tr><th colspan="6">Calculated gross mass</th><td class="n">'+g(o.cut.total,1)+'</td></tr></table></div></div>';
  $('#rComp').innerHTML='<h3>Compliance with '+esc(REQ_NAME)+'</h3><p class="hint">Calculated rows are checked automatically. Rows the tool cannot calculate stay "To confirm" until you tick them.</p><div class="tblwrap"><table><tr><th>#</th><th>Parameter</th><th>Specification</th><th>Offered / design value</th><th>Status</th></tr>'+
    M.comp.map(r=>'<tr><td>'+r[0]+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td><td>'+esc(r[3])+'</td><td style="font-weight:600;white-space:nowrap;color:'+({Complies:'#2E7D4F',Confirmed:'#2E7D4F','To confirm':'#9A6B00'}[r[4]]||'#B23A2E')+'">'+(r[6]?'<label class="conf"><input type="checkbox" data-conf="'+esc(r[1])+'"'+(r[4]==='Confirmed'?' checked':'')+'> '+r[4]+'</label>':r[4])+'</td></tr>').join('')+'</table></div>'+
    '<h3>Design checks</h3><div class="tblwrap"><table><tr><th>Check</th><th>Requirement</th><th>Obtained</th><th>Result</th></tr>'+o.checks.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.req)+'</td><td>'+esc(c.got)+'</td><td style="font-weight:600;color:'+(c.ok?'#2E7D4F':'#B23A2E')+'">'+(c.ok?'Pass':'Fail')+'</td></tr>').join('')+'</table></div>';
  $$('#rComp [data-conf]').forEach(cb=>cb.addEventListener('change',()=>{ cb.checked?R_CONF.add(cb.dataset.conf):R_CONF.delete(cb.dataset.conf); rRerender(); }));
  $('#rSteps').innerHTML='<table><tr><th>#</th><th>Item</th><th>Working</th><th>Result</th></tr>'+M.steps.map((s,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(s[0])+'</td><td class="formula">'+esc(s[1])+'</td><td class="r">'+esc(s[2])+'</td></tr>').join('')+'</table>';
  gtRender($('#rTests'),rGtSummary(o),R_GT,rRerender,rApplyCal);
  rSVG(o);
}
// Rectangular core: front view (all three limbs, to scale) and plan of one limb, fully dimensioned
function rDrawing(o,print,meta){ const P=drwPal(print), p=o.p; const W=o.W, L=o.limb, Cd=o.Cd, FW=o.yokeL, FH=L+2*W;
  const fs=Math.max(11,(FW+o.OD2w)/62), sw=fs*0.07; const over=(o.OD2w-W)/2;
  const x0=over+fs*6.2, y0=fs*8.2; const pX=x0+FW+fs*8.5+2*over, planW=o.OD2w, pcx=pX+planW/2, pcy=y0+FH/2;
  const SW=pX+planW+fs*4.5, SH=y0+FH+fs*9.5;
  let s=DRW.svgOpen(SW,SH,P,fs,'Rectangular core and coils: front view and plan, dimensioned in millimetres');
  s+=DRW.text(x0-over,fs*1.4,'Front view, section through the coils (to scale, mm)',P,fs*1.05,{anchor:'start',weight:600});
  // core frame and windows
  s+=DRW.rect(x0,y0,FW,FH,P.core,P.coreEdge,sw);
  for(let i=0;i<2;i++) s+=DRW.rect(x0+W+i*Cd,y0+W,Cd-W,L,P.bg,P.coreEdge,sw);
  // coils on each limb
  const t1=y0+W+(L-o.len1)/2, t2=y0+W+(L-o.len2)/2;
  for(let i=0;i<3;i++){ const cx=x0+W/2+i*Cd;
    for(const side of [-1,1]){ const xo=side<0?cx-o.OD2w/2:cx+o.ID2w/2, xi=side<0?cx-o.OD1w/2:cx+o.ID1w/2;
      s+=DRW.band(xo,t2,o.rad2,o.len2,o.L2,p.hvDucts,p.hvDuctW,P.hv,P.hvEdge,P,sw,false);
      s+=DRW.band(xi,t1,o.rad1,o.len1,o.L1,p.lvDucts,p.lvDuctW,P.lv,P.lvEdge,P,sw,false); }
    s+=DRW.line(cx,y0-fs*2.2,cx,y0+FH+fs*0.8,P.sub,sw*0.8,' stroke-dasharray="'+DRW.n(fs*1.2)+' '+DRW.n(fs*0.35)+' '+DRW.n(fs*0.2)+' '+DRW.n(fs*0.35)+'"'); }
  // dimensions: top
  const c0=x0+W/2, c1=c0+Cd, c2=c1+Cd;
  s+=DRW.dimH(x0,x0+FW,y0-fs*4.2,'Yoke length '+DRW.f(FW),P,fs,y0,y0);
  s+=DRW.dimH(c0,c1,y0-fs*1.8,'Centres '+DRW.f(Cd),P,fs)+DRW.dimH(c1,c2,y0-fs*1.8,DRW.f(Cd),P,fs);
  // right
  s+=DRW.dimV(y0+W,y0+W+L,x0+FW+over+fs*1.8,'Window '+DRW.f(L),P,fs,x0+FW-W,x0+FW-W,'right');
  s+=DRW.dimV(y0,y0+FH,x0+FW+over+fs*4.4,'Height '+DRW.f(FH),P,fs,x0+FW,x0+FW,'right');
  // bottom
  const yb=y0+FH;
  s+=DRW.dimH(x0,x0+W,yb+fs*2.0,'W '+DRW.f(W),P,fs,yb,yb)+DRW.dimH(x0+W,x0+Cd,yb+fs*2.0,'Window '+DRW.f(Cd-W),P,fs,yb,yb);
  s+=DRW.dimH(c2-o.OD2w/2,c2+o.OD2w/2,yb+fs*4.6,'Outer coil '+DRW.f(o.OD2w),P,fs,t2+o.len2,t2+o.len2);
  // left: coil lengths
  const xl=c0-o.OD2w/2; s+=DRW.dimV(t2,t2+o.len2,xl-fs*1.3,'Outer '+DRW.f(o.len2),P,fs,xl,xl);
  s+=DRW.dimV(t1,t1+o.len1,xl-fs*3.6,'Inner '+DRW.f(o.len1),P,fs,c0-o.OD1w/2,c0-o.OD1w/2);
  // plan of one limb
  s+=DRW.text(pX,fs*1.4,'Plan of one limb',P,fs*1.05,{anchor:'start',weight:600});
  const rr=(w,h,r,fill,edge)=>'<rect x="'+DRW.n(pcx-w/2)+'" y="'+DRW.n(pcy-h/2)+'" width="'+DRW.n(w)+'" height="'+DRW.n(h)+'" rx="'+DRW.n(r)+'" fill="'+fill+'" stroke="'+edge+'" stroke-width="'+DRW.n(sw)+'"/>';
  s+=rr(o.OD2w,o.OD2d,o.R[3],P.hv,P.hvEdge)+rr(o.ID2w,o.ID2d,o.R[2],P.bg,P.coreEdge)+rr(o.OD1w,o.OD1d,o.R[1],P.lv,P.lvEdge)+rr(o.ID1w,o.ID1d,o.R[0],P.bg,P.coreEdge)+rr(o.cW,o.cD,0,P.core,P.coreEdge);
  s+=DRW.text(pcx,pcy+fs*0.35,o.W+' × '+o.D,P,fs,{weight:600});
  s+=DRW.dimH(pcx-o.OD2w/2,pcx+o.OD2w/2,pcy+o.OD2d/2+fs*2,DRW.f(o.OD2w),P,fs,pcy+o.OD2d/2,pcy+o.OD2d/2);
  s+=DRW.dimV(pcy-o.OD2d/2,pcy+o.OD2d/2,pcx+o.OD2w/2+fs*1.6,DRW.f(o.OD2d),P,fs,pcx+o.OD2w/2,pcx+o.OD2w/2,'right');
  // radial build and legend
  const yt=pcy+o.OD2d/2+fs*4.6; const lines=['Radial build per side, mm:','bobbin gap '+DRW.f(p.gap/2)+', inner '+DRW.f(o.rad1)+', gap '+DRW.f(p.delta/2)+', outer '+DRW.f(o.rad2),
    'Inner ID '+DRW.f(o.ID1w)+' × '+DRW.f(o.ID1d)+', OD '+DRW.f(o.OD1w)+' × '+DRW.f(o.OD1d),'Outer ID '+DRW.f(o.ID2w)+' × '+DRW.f(o.ID2d)+', OD '+DRW.f(o.OD2w)+' × '+DRW.f(o.OD2d)];
  lines.forEach((t,i)=>{ s+=DRW.text(pX-over,yt+i*fs*1.35,t,P,fs*0.9,{anchor:'start',fill:i?P.ink:P.sub}); });
  const yl=SH-fs*1.2; let lx=x0;
  const sw_=(fill,edge,label)=>{ const r=DRW.rect(lx,yl-fs*0.8,fs*1.1,fs*0.9,fill,edge,sw)+DRW.text(lx+fs*1.5,yl,label,P,fs*0.9,{anchor:'start'}); lx+=fs*1.5+label.length*fs*0.5+fs*1.6; return r; };
  s+=sw_(P.core,P.coreEdge,'Core '+p.grade+', '+o.W+' × '+o.D+' mm');
  s+=sw_(P.lv,P.lvEdge,o.W1.role+' (inner): '+o.N1+' turns, '+o.L1+' layers'+(p.lvDucts?', '+p.lvDucts+' duct':''));
  s+=sw_(P.hv,P.hvEdge,o.W2.role+' (outer): '+o.N2+' turns, '+o.L2+' layers'+(p.hvDucts?', '+p.hvDucts+' duct':''));
  s+='</svg>'; return (print&&meta)?addTitleBlock(s,titleMeta('rect',meta,o.p.kVA+' kVA, '+o.p.priV+' / '+o.p.secV+' V, '+o.p.vg+', core '+o.W+' × '+o.D)):s; }
function rSVG(o){ $('#rSvg').innerHTML=rDrawing(o,false); }
// tabs
$$('#rTabs button').forEach(b=>b.addEventListener('click',()=>{ $$('#rTabs button').forEach(x=>x.setAttribute('aria-selected',x===b)); for(const t of ['sheet','comp','tests','steps']) $('#rtab-'+t).hidden=b.dataset.rtab!==t; }));
$$('[data-rpreset]').forEach(b=>b.addEventListener('click',()=>rLoad(RPRESETS[b.dataset.rpreset])));
// mode switch
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-mode]').forEach(x=>x.setAttribute('aria-selected',x===b)); $('#layout-round').hidden=b.dataset.mode!=='round'; $('#layout-rect').hidden=b.dataset.mode!=='rect'; }));
// requirement import
$('#reqFile').addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file) return; if(!window.XLSX){ toast('Spreadsheet library did not load. Reload the page.'); return; }
  try{ const wb=XLSX.read(await file.arrayBuffer()); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    const items=[]; let fat=false;
    for(const r of rows){ const cells=r.map(c=>String(c).trim()).filter(c=>c!==''); if(!cells.length) continue;
      if(/^s\.?\s*no/i.test(cells[0])) continue; if(/^fat/i.test(cells[0])&&cells.length===1){ fat=true; continue; }
      const txt=cells.filter(c=>!/^\d+$/.test(c)); if(txt.length<2) continue; const param=txt[0], spec=txt[txt.length-1];
      items.push([fat?'test':reqKey(param),(fat?'FAT: ':'')+param,spec]); }
    if(!items.length) throw new Error('no parameter rows found');
    const find=k=>(items.find(x=>x[0]===k)||[])[2]||''; const num=(s,re)=>{ const m=String(s).match(re||/([\d.]+)/); return m?parseFloat(m[1]):null; };
    const set=(k,v)=>{ if(v!==null&&v!==undefined&&v!==''&&rform.elements[k]) rform.elements[k].value=v; };
    set('kVA',num(find('kva'))); set('freq',num(find('phase'),/(\d+)\s*hz/i));
    const pri=find('pri'), sec=find('sec'); set('priV',num(pri)); set('secV',num(sec));
    const vg=find('vg').replace(/\s/g,''); if(vg){ const opt=[...rform.vg.options].find(o=>o.value.toLowerCase()===vg.toLowerCase()); if(opt) rform.vg.value=opt.value; }
    set('effMin',num(find('eff'))); const effT=num(find('eff').replace(/.*@\s*/,''),/@?\s*(\d+)\s*deg/i);
    const imp=find('imp'); set('zTarget',num(imp)); const tp=imp.match(/\+\s*([\d.]+)\s*%/), tm=imp.match(/[−-]\s*([\d.]+)\s*%/); if(tp) set('zTolPlus',parseFloat(tp[1])); if(tm) set('zTolMinus',parseFloat(tm[1]));
    const it=REQ_DEFAULT; const ins=find('ins').match(/class\s*([A-Z])/i); if(ins) set('insClass',ins[1].toUpperCase());
    const rise=find('rise'); set('riseLimit',num(rise,/(\d+)\s*[˚°]?\s*c/i)); const amb=rise.match(/ambient[^\d]*(\d+)/i); if(amb) set('amb',amb[1]);
    const impT=(items.find(x=>x[0]==='imp')||['',''])[1].match(/@\s*(\d+)/); if(impT) set('windTemp',impT[1]);
    const mat=find('mat'); if(/alu/i.test(mat)) set('mat','Al'); if(/copp/i.test(mat)) set('mat','Cu'); rform.pCond.value=rform.mat.value==='Cu'?900:440;
    const core=find('core'); if(/moh/i.test(core)) set('grade','MOH-23'); else if(/crno/i.test(core)) set('grade','CRNO-35'); else if(/m4|crgo/i.test(core)) set('grade','M4-27');
    set('noiseMax',num(find('noise'),/(\d+)\s*db/i)); const en=find('encl'); set('enclosure',/not/i.test(en)?'0':(en?'1':''));
    REQ=items; REQ_NAME=file.name.replace(/\.[^.]+$/,'');
    $('#reqStatus').textContent='Requirement imported: '+file.name+' ('+items.length+' rows). Design fields left as they were.';
    toast('Requirement sheet imported'); rRun();
  }catch(err){ console.error(err); toast('Could not read that sheet: '+err.message+'. Use a sheet with Parameter and Specification columns.'); }
  e.target.value='';
});
// exports
function rfname(ext){ const p=RCUR.o.p, m=RCUR.meta; return designFileName(m.wo||m.party,'RECT',p.kVA,Math.max(p.priV,p.secV),Math.min(p.priV,p.secV),m.rev,ext); }
$('#rPdf').addEventListener('click',async()=>{
  if(!RCUR) return; if($('#rInputCheck').classList.contains('err')){ toast('Fix the highlighted inputs first.'); return; } if(!window.jspdf){ toast('PDF library did not load. Reload the page.'); return; }
  const png=await svgToPng(rDrawing(RCUR.o,true,RCUR.meta),2800);
  const {jsPDF}=window.jspdf; const M=RCUR.M; const P=v=>v.map(r=>r.map(pdfText)); const ink=[23,33,43];
  const B=(fs)=>({theme:'grid',styles:{fontSize:fs,cellPadding:fs*0.1,lineColor:[150,160,170],lineWidth:0.15,textColor:ink},headStyles:{fillColor:[228,233,238],textColor:ink,fontStyle:'bold'},columnStyles:{0:{fontStyle:'bold'}}});
  const col=(h,i,map)=>{ if(h.section==='body'&&h.column.index===i) h.cell.styles.textColor=map(h.cell.raw); };
  const okc=v=>(v==='Pass'||v==='Complies'||v==='Confirmed')?[46,125,79]:(v==='To confirm'?[154,107,0]:(v?[178,58,46]:ink));
  const title=(d,t,y)=>{ d.setTextColor(...ink); d.setFont('helvetica','bold'); d.setFontSize(11); d.text(pdfText(t),8,y||12); };
  // page 1: title block + winding data (left) + core, impedance, losses, mechanical (right)
  const d=pdfFirstPage((fs)=>{ const d=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    d.setDrawColor(...ink); d.setLineWidth(0.5); d.rect(8,8,281,30); d.setFont('helvetica','bold'); d.setFontSize(11); d.setTextColor(...ink); d.text(pdfText(M.title.title),10,13); pdfBrand(d,222,9.5,64,7); pdfBrand(d,222,9.2,64,7.6);
    d.setFont('helvetica','normal'); d.setFontSize(6.2); M.title.cells.forEach((c,i)=>{ const x=10+(i%8)*35, y=18+Math.floor(i/8)*6.5; d.setTextColor(90); d.text(pdfText(c[0]),x,y); d.setTextColor(...ink); d.text(pdfText(c[1]).slice(0,34),x,y+2.7); });
    d.autoTable({...B(fs),startY:41,margin:{left:8,right:140,bottom:9},head:[P([['Parameter',M.wind[0][1],M.wind[0][2]]])[0]],body:P(M.wind.slice(1)),columnStyles:{0:{fontStyle:'bold',cellWidth:52}}});
    let y=41; const sec=(h,b)=>{ d.autoTable({...B(fs),startY:y,margin:{left:161,right:8,bottom:9},head:[[h,'']],body:P(b),columnStyles:{0:{fontStyle:'bold',cellWidth:48}}}); y=d.lastAutoTable.finalY+1; };
    sec('Core',M.core); sec('Impedance voltage',M.imp); sec('Losses and efficiency',M.loss); sec('Mechanical details',M.mech); return d; });
  pdfDrawingPage(d,png,'General arrangement (to scale, dimensions in mm)',['Front view of all three limbs and plan of one limb. Winding layers and radial ducts are drawn to scale; clearances follow the design sheet values.']);
  // page 2: compliance
  d.addPage(); pdfFit(d,(fs)=>{ title(d,'Compliance with requirement — '+REQ_NAME);
    d.autoTable({...B(fs),startY:15,margin:{left:8,right:8,bottom:9},head:[['#','Parameter','Specification','Offered / design value','Status']],body:P(M.comp.map(r=>r.slice(0,5))),
      columnStyles:{0:{cellWidth:7},1:{cellWidth:70,fontStyle:'bold'},2:{cellWidth:70},4:{cellWidth:18,fontStyle:'bold'}},didParseCell:h=>col(h,4,okc)}); });
  // page 3: design checks + build-up (left), BOM (right)
  d.addPage(); pdfFit(d,(fs)=>{ const p0=d.getNumberOfPages(); title(d,'Design checks, build-up and bill of materials');
    d.autoTable({...B(fs),startY:15,margin:{left:8,right:150,bottom:9},head:[['Check','Requirement','Obtained','Result']],body:P(M.checks.map(c=>[c.name,c.req,c.got,c.ok?'Pass':'Fail'])),didParseCell:h=>col(h,3,okc)});
    d.autoTable({...B(fs),startY:d.lastAutoTable.finalY+3,margin:{left:8,right:150,bottom:9},head:[['Core and coil build-up','']],body:P(M.build)});
    d.setPage(p0);
    d.autoTable({...B(fs),startY:15,margin:{left:152,right:8,bottom:9},head:[['#','Item','kg','Rs/kg','Rs']],body:P(M.bom),columnStyles:{2:{halign:'right'},3:{halign:'right'},4:{halign:'right'}}});
    d.autoTable({...B(fs),startY:d.lastAutoTable.finalY+3,margin:{left:152,right:8,bottom:9},head:[['Core cutting','Step','W','Stack','Qty','Short / long','kg']],body:P(cutRows(RCUR.o.cut))}); });
  // page 4+: guarantees and tests, then steps
  d.addPage(); pdfFit(d,(fs)=>{ title(d,'Guarantees and factory test results');
    d.autoTable({...B(fs),startY:15,margin:{left:8,right:8,bottom:9},head:[['Item','Calculated','Guaranteed','Limit at test (IEC 60076-1)','Measured (FAT)','Result']],body:P(M.gt.map(r=>[r.item,r.calc,r.noG?'-':String(r.g),r.max,r.meas==null?'':String(r.meas),r.result])),didParseCell:h=>col(h,5,okc)});
    title(d,'Step-by-step calculation',d.lastAutoTable.finalY+8);
    d.autoTable({...B(fs),startY:d.lastAutoTable.finalY+11,margin:{left:8,right:8,bottom:9},head:[['#','Item','Working','Result']],body:P(M.steps.map((s,i)=>[String(i+1),...s])),columnStyles:{0:{cellWidth:7},1:{cellWidth:38,fontStyle:'bold'},3:{cellWidth:66,fontStyle:'bold'}}}); },[6.5,6,5.6,5.3]);
  const n=d.getNumberOfPages(); for(let i=1;i<=n;i++){ d.setPage(i); d.setFontSize(6); d.setTextColor(90); d.text(pdfText('Rect core design, '+RCUR.o.p.kVA+' kVA  |  Rev '+(RCUR.meta.rev||'R0')+'  |  Tool '+APP_VERSION+'  |  Page '+i+' of '+n+'  |  Generated '+new Date().toLocaleString('en-GB')),8,205); }
  saveFile(rfname('pdf'),d.output('blob'));
});
$('#rXlsx').addEventListener('click',()=>{
  if(!RCUR) return; if($('#rInputCheck').classList.contains('err')){ toast('Fix the highlighted inputs first.'); return; } if(!window.XLSX){ toast('Excel library did not load. Reload the page.'); return; }
  const M=RCUR.M, wb=XLSX.utils.book_new(); const cols=(ws,w)=>{ws['!cols']=w.map(x=>({wch:x}));return ws;};
  const a=[[M.title.title],[],...M.title.cells,[],['WINDING DATA','',''],['Parameter',M.wind[0][1],M.wind[0][2]],...M.wind.slice(1),[],['CORE AND COIL BUILD-UP'],...M.build,[],['CORE'],...M.core,[],['IMPEDANCE VOLTAGE'],...M.imp,[],['LOSSES AND EFFICIENCY'],...M.loss,[],['MECHANICAL DETAILS'],...M.mech];
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet(a),[36,34,34]),'CAL1');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['#','Parameter','Specification','Offered / design value','Status'],...M.comp.map(r=>r.slice(0,5)),[],['Check','Requirement','Obtained','Result'],...M.checks.map(c=>[c.name,c.req,c.got,c.ok?'Pass':'Fail'])]),[6,50,45,55,12]),'Compliance');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['#','Item','kg','Rs/kg','Rs'],...M.bom]),[5,28,12,10,14]),'BOM');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['Part','Step','Width mm','Stack mm','Qty','Short mm','Long mm','kg'],...RCUR.o.cut.rows.map(x=>[x.grp,x.step,x.w,x.stack,x.qty,Math.round(x.short),Math.round(x.long),Math.round(x.kg*10)/10]),['Total','','','','','','',Math.round(RCUR.o.cut.total*10)/10]]),[14,6,10,10,6,10,10,10]),'Core cutting');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['#','Particular','Unit','Value'],...gtpRows(rGtpData(RCUR.o,RCUR.meta))]),[5,48,8,40]),'GTP');
  if(RCUR.o.alts) XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['K','B','W','D','Layers','Z %','NLL W','LL W','Eff %','Rise K','Mass kg','Price','TOC','Failed checks'],...RCUR.o.alts.map(a=>[a.K,a.B,a.W,a.D,a.L1+'/'+a.L2,+a.ek.toFixed(3),Math.round(a.NLL),Math.round(a.LL),+a.eff.toFixed(2),+a.rise.toFixed(1),Math.round(a.mass),Math.round(a.cost),Math.round(a.toc),a.fails])]),[5,5,5,5,8,7,8,8,7,7,8,10,10,8]),'Alternatives');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['#','Item','Working','Result'],...M.steps.map((s,i)=>[i+1,...s])]),[5,28,90,40]),'Steps');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['Quantity','Value','Unit'],...M.values.map(r=>[r[0],typeof r[1]==='number'?Math.round(r[1]*1e6)/1e6:r[1],r[2]])]),[30,14,8]),'Values');
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['Item','Calculated','Guaranteed','Limit at test','Measured','Result'],...M.gt.map(r=>[r.item,isNaN(+r.calc)?r.calc:+r.calc,r.noG?'':r.g,r.max,r.meas??'',r.result])]),[34,12,12,36,12,8]),'Guarantees & tests');
  const snap=rSnapshot(); const labels={}; for(const el of rform.elements){ if(el.name){ const l=el.closest('label'); labels[el.name]=l?(l.querySelector('b')||l).textContent.replace('*','').trim():el.name; } }
  XLSX.utils.book_append_sheet(wb,cols(XLSX.utils.aoa_to_sheet([['Field','Value','Description'],...Object.entries(snap.v).map(([k,v])=>[k,v,labels[k]||'']),[],['__req__',JSON.stringify(snap.req),'Requirement rows'],['__reqName__',snap.reqName,'Requirement name'],['__conf__',JSON.stringify(snap.conf||[]),'Confirmed requirement rows'],['__gt__',JSON.stringify(snap.gt||{}),'Guarantees and test results'],['__ver__',snap.ver,'Tool version']]),[14,30,40]),'Inputs');
  const out=XLSX.write(wb,{bookType:'xlsx',type:'array'}); saveFile(rfname('xlsx'),new Blob([out]));
});

// ---------- Saved designs (kept in this browser; export/import to move between devices) ----------
const SKEY='rectDesigns.v1', LKEY='rectLast.v1';
const sGet=k=>{ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };
const sSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } };
function rSnapshot(){ const v={}; for(const el of rform.elements){ if(el.name) v[el.name]=el.value; } return {v,req:REQ,reqName:REQ_NAME,conf:[...R_CONF],gt:R_GT,ver:APP_VERSION,at:new Date().toISOString(),sum:RCUR&&RCUR.M?RCUR.M.values:null}; }
function rApply(s){ if(!s||!s.v) return; for(const el of rform.elements){ if(el.name&&s.v[el.name]!==undefined) el.value=s.v[el.name]; }
  if(s.ver!==APP_VERSION) setTimeout(()=>toast('This design was saved with '+(s.ver?'tool '+s.ver:'an older tool version')+'. It has been recalculated with '+APP_VERSION+', so results may differ slightly.'),1200);
  R_CONF=new Set(Array.isArray(s.conf)?s.conf:[]); R_GT=(s.gt&&typeof s.gt==='object')?{...gtDefaults(),...s.gt}:gtDefaults();
  if(Array.isArray(s.req)&&s.req.length){ REQ=s.req; REQ_NAME=s.reqName||REQ_NAME; $('#reqStatus').textContent='Requirement: '+REQ_NAME+'.'; } rRun(); }
// ---- Design library: shared when a backend is available, otherwise this browser ----
// To share designs between users on GitLab/GitHub Pages, fill in a free Supabase project (see README):
const SHARED_LIBRARY={supabaseUrl:'',supabaseAnonKey:'',table:'transformer_designs'};
const LIB={mode:'local',cache:{},db:null,
  label(){ return {local:'This browser only',claude:'Shared with everyone who opens this page, live',supabase:'Shared library (Supabase)'}[this.mode]; },
  slug(n){ let h=0; for(const c of n) h=(h*31+c.charCodeAt(0))|0; return n.replace(/[^A-Za-z0-9_.~-]/g,'_').slice(0,80)+'-'+(h>>>0).toString(36); },
  async init(){ this.cache=sGet(SKEY)||{};
    const S=SHARED_LIBRARY;
    if(S.supabaseUrl&&S.supabaseAnonKey){ try{ await this.sbList(); this.mode='supabase'; setInterval(()=>this.sbList().then(rList).catch(()=>{}),20000); window.addEventListener('focus',()=>this.sbList().then(rList).catch(()=>{})); return; }catch(e){ console.warn('Supabase library unavailable',e); } }
    if(window.claude&&window.claude.use){ try{ const db=await Promise.race([window.claude.use('db'),new Promise(r=>setTimeout(()=>r(null),4000))]); if(db){ this.db=db; this.mode='claude'; this.cache={};
        db.collection('designs').onSnapshot(snap=>{ const c={}; for(const d of snap.docs){ const x=d.data(); try{ c[x.name]=JSON.parse(x.json); }catch(_){} } this.cache=c; rList($('#savedList').value); },err=>{ console.warn('db',err); });
        return; } }catch(e){ console.warn('db unavailable',e); } }
    this.mode='local'; },
  all(){ return this.cache; },
  async save(name,s){ if(this.mode==='claude'){ await this.db.doc('designs/'+this.slug(name)).set({name,json:JSON.stringify(s),at:s.at,kVA:String(s.v.kVA||'')}); this.cache[name]=s; return; }
    if(this.mode==='supabase'){ await this.sb('POST','',[{name,data:s,updated_at:s.at}],{Prefer:'resolution=merge-duplicates'}); this.cache[name]=s; return; }
    this.cache[name]=s; if(!sSet(SKEY,this.cache)) throw new Error('this browser blocked saving; use Export designs'); },
  async del(name){ if(this.mode==='claude'){ await this.db.doc('designs/'+this.slug(name)).delete(); delete this.cache[name]; return; }
    if(this.mode==='supabase'){ await this.sb('DELETE','?name=eq.'+encodeURIComponent(name)); delete this.cache[name]; return; }
    delete this.cache[name]; sSet(SKEY,this.cache); },
  async sb(method,q,body,extra){ const S=SHARED_LIBRARY; const r=await fetch(S.supabaseUrl.replace(/\/$/,'')+'/rest/v1/'+S.table+(q||''),{method,headers:{apikey:S.supabaseAnonKey,Authorization:'Bearer '+S.supabaseAnonKey,'Content-Type':'application/json',...(extra||{})},body:body?JSON.stringify(body):undefined});
    if(!r.ok) throw new Error('Supabase '+r.status); return method==='GET'?r.json():null; },
  async sbList(){ const rows=await this.sb('GET','?select=name,data,updated_at&order=updated_at.desc'); const c={}; for(const x of rows) c[x.name]=x.data; this.cache=c; }
};
function rList(sel){ const all=LIB.all(); const names=Object.keys(all).filter(k=>!k.startsWith('round:')).sort((a,b)=>(all[b].at||'').localeCompare(all[a].at||''));
  const L=$('#savedList'); L.innerHTML=names.length?names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+' — '+esc((all[n].v.kVA||'?')+' kVA, '+new Date(all[n].at).toLocaleDateString('en-GB'))+'</option>').join(''):'<option value="">No saved designs yet</option>';
  if(sel&&all[sel]) L.value=sel; $('#libMode').textContent=LIB.label();
  const local=sGet(SKEY)||{}; const missing=Object.keys(local).filter(k=>!all[k]); const pb=$('#pushLocal'); pb.hidden=!(LIB.mode!=='local'&&missing.length); pb.textContent='Copy '+missing.length+' design'+(missing.length>1?'s':'')+' from this browser to the shared library'; }
$('#saveBtn').addEventListener('click',async()=>{ const s=rSnapshot(); const name=($('#saveName').value.trim())||((s.v.kVA||'')+' kVA '+(s.v.priV||'')+'/'+(s.v.secV||'')+' V');
  const exists=!!LIB.all()[name]; try{ await LIB.save(name,s); rList(name); $('#saveName').value=''; toast((exists?'Updated ':'Saved ')+'"'+name+'"'+(LIB.mode==='local'?'':' to the shared library')); }catch(e){ toast('Could not save: '+e.message); } });
$('#loadBtn').addEventListener('click',()=>{ const n=$('#savedList').value; const all=LIB.all(); if(!n||!all[n]){ toast('Choose a saved design first.'); return; } rApply(all[n]); toast('Loaded "'+n+'"'); });
$('#delBtn').addEventListener('click',async()=>{ const n=$('#savedList').value; if(!n||!LIB.all()[n]) return; try{ await LIB.del(n); rList(); toast('Deleted "'+n+'"'); }catch(e){ toast('Could not delete: '+e.message); } });
$('#pushLocal').addEventListener('click',async()=>{ const local=sGet(SKEY)||{}; let n=0; for(const [k,v] of Object.entries(local)){ if(!LIB.all()[k]){ try{ await LIB.save(k,v); n++; }catch(e){} } } rList(); toast('Copied '+n+' design'+(n===1?'':'s')+' to the shared library'); });
$('#expBtn').addEventListener('click',()=>{ const all=LIB.all(); if(!Object.keys(all).length){ toast('Save a design first, then export.'); return; }
  saveFile('rect-core-designs_'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify({type:'rect-core-designs',version:2,designs:all},null,1)],{type:'application/json'})); });
$('#impFile').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return;
  if(/\.xlsx?$/i.test(f.name)){ try{ const wb=XLSX.read(await f.arrayBuffer()); const ws=wb.Sheets['Inputs']; if(!ws) throw new Error('this Excel file has no Inputs sheet (only files downloaded from this page have one)');
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}); const v={}; let req=null,reqName=null,conf=[],gt=null,ver=null;
      for(const r of rows.slice(1)){ if(!r[0]) continue; if(r[0]==='__req__'){ try{req=JSON.parse(r[1]);}catch(_){} } else if(r[0]==='__reqName__') reqName=r[1]; else if(r[0]==='__conf__'){ try{conf=JSON.parse(r[1]);}catch(_){} } else if(r[0]==='__gt__'){ try{gt=JSON.parse(r[1]);}catch(_){} } else if(r[0]==='__ver__') ver=String(r[1]); else v[r[0]]=String(r[1]); }
      const name=f.name.replace(/\.[^.]+$/,''); const s={v,req,reqName,conf,gt,ver,at:new Date().toISOString()}; await LIB.save(name,s); rList(name); rApply(s); toast('Loaded and saved "'+name+'"');
    }catch(err){ toast('Could not load: '+err.message); } e.target.value=''; return; }
  try{ const j=JSON.parse(await f.text()); const inc=j.designs||j; let n=0; for(const [k,v] of Object.entries(inc)){ if(v&&v.v){ await LIB.save(k,v); n++; } } if(!n) throw new Error('no designs in file'); rList(); toast('Imported '+n+' design'+(n>1?'s':'')); }catch(err){ toast('Could not import: '+err.message); } e.target.value=''; });
rSaveLast=function(){ sSet(LKEY,rSnapshot()); };
const _rAfter=rAfterRun; rAfterRun=function(){ _rAfter(); rSaveLast(); };
rList(); LIB.init().then(()=>rList());
{ const last=sGet(LKEY); if(last&&last.v&&last.v.kVA){ rApply(last); setTimeout(()=>{ $('#rAutoNote').textContent='Restored the inputs from your last visit. '+$('#rAutoNote').textContent; },900); } else rLoad(RPRESETS.sheet70); }

// ---- GTP, alternatives (rectangular core) ----
function rGtpData(o,m){ const p=o.p, cn=c=>c==='D'?'delta':'star';
  return {kVA:p.kVA,freq:p.freq,type:'Dry type, rectangular core, class '+p.insClass,w1:{name:o.W1.role,V:o.W1.V,conn:cn(o.W1.conn),I:o.W1.conn==='Y'?o.W1.Iph:o.W1.Iph*Math.sqrt(3)},w2:{name:o.W2.role,V:o.W2.V,conn:cn(o.W2.conn),I:o.W2.conn==='Y'?o.W2.Iph:o.W2.Iph*Math.sqrt(3)},
    vg:p.vg,cooling:'AN (natural air)',insClass:p.insClass,riseLim:o.riseLim,taps:'No taps',tapChanger:'—',NLL:o.NLL,LL:o.LL,lead:0,T:p.windTemp,Z:o.ek,er:o.er,ex:o.ex,I0:o.I0,
    rise1:o.rise1,rise2:o.rise2,B:o.Bact,J1:o.J1,J2:o.J2,grade:'CRGO '+p.grade,mat:RC.COND[p.mat].name.toLowerCase(),mCore:o.coreMass,mCond:o.ins1+o.ins2,mTot:o.totMass,
    dims:o.aL+' × '+o.aB+' × '+o.aH+' (active part)',testV:Math.max(p.priV,p.secV)<=1100?'3 kV / —':'per IS 11171',sc:o.sc.windings.every(w=>w.thermalOk)&&o.sc.windings[1].stressOk?'Complies':'By agreement (see checks)',noise:o.noise,
    toc:(p.capA||p.capB)?o.toc:null,std:'IS 2026 / IEC 60076-11 (applied by agreement for LV/LV)'}; }
$('#rGtp').addEventListener('click',()=>{ if(!RCUR) return; if($('#rInputCheck').classList.contains('err')){ toast('Fix the highlighted inputs first.'); return; }
  gtpPdf(rGtpData(RCUR.o,RCUR.meta),RCUR.meta,rfname('pdf').replace(/\.pdf$/,'_GTP.pdf')); });
function rShowAlts(o){ const cols=[['Core W × D',a=>a.W+' × '+a.D],['K / B',a=>a.K+' / '+a.B],['Layers',a=>a.L1+' / '+a.L2],['Z %',a=>a.ek.toFixed(2)],['NLL W',a=>Math.round(a.NLL)],['LL W',a=>Math.round(a.LL)],['Eff %',a=>a.eff.toFixed(2)],['Rise K',a=>Math.round(a.rise)],['Price ₹',a=>Math.round(a.cost).toLocaleString('en-IN')]];
  if(o.p.capA||o.p.capB) cols.push(['TOC ₹',a=>Math.round(a.toc).toLocaleString('en-IN')]);
  renderAlts('#rAlts',o.alts,cols,a=>{ const set=(k,v)=>{ if(rform.elements[k]) rform.elements[k].value=v; };
    set('K',a.K); set('B',a.B); set('W',a.W); set('D',a.D); set('N1',a.N1); set('N2',a.N2); set('lvLayers',a.L1); set('hvLayers',a.L2); set('lvDucts',a.lvDucts); set('hvDucts',a.hvDucts);
    for(const [pre,C] of [['lv',a.C1],['hv',a.C2]]){ set(pre+'Type',C.type); set(pre+'B',C.b); set(pre+'H',C.type==='round'?'':C.h); set(pre+'Rad',C.rad); set(pre+'Ax',C.ax); }
    toast('Alternative copied into the design fields.'); rRun(); }); }
const _rRenderPrev=rRender; rRender=function(o,M){ _rRenderPrev(o,M); rShowAlts(o); };
