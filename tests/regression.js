// Reference-design regression test. Run: node tests/regression.js
// Extracts the calculation engines from index.html and checks them against the released reference sheets.
const fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const m=html.match(/<script id="engines">([\s\S]*?)<\/script>/); if(!m){ console.error('engines script not found'); process.exit(1); }
const ctx={console,Math}; vm.createContext(ctx);
vm.runInContext(m[1]+'\nthis.X={STD,design,DEFAULTS,rectDesign,rectAuto,RC_DEFAULTS};',ctx); const X=ctx.X;
let fail=0, n=0;
const near=(name,got,exp,tol)=>{ n++; const ok=Math.abs(got-exp)<=tol; if(!ok) fail++; console.log((ok?'  ok  ':'  FAIL')+'  '+name.padEnd(46)+' got '+(+got).toFixed(4)+'  expected '+exp+' ± '+tol); };
const is=(name,cond)=>{ n++; if(!cond) fail++; console.log((cond?'  ok  ':'  FAIL')+'  '+name); };

console.log('\n70 kVA rectangular core — CAL1 design sheet (basis: as per sheet)');
const r=X.rectDesign({...X.RC_DEFAULTS,roundLen:true});
near('V/t',r.Vt,3.8542,0.0005); near('Turns inner',r.N1,60,0); near('Turns outer',r.N2,112,0); near('Core build D',r.D,161,0);
near('Wind length inner',r.len1,340,0); near('Wind length outer',r.len2,308,0); near('Limb',r.limb,380,0); near('Centre distance',r.Cd,185,0);
near('Resistance inner (Ω)',r.Rw1,0.0179667,1e-6); near('Resistance outer (Ω)',r.Rw2,0.0834537,1e-6);
near('Load loss total (W)',r.LL,1384.01,0.05); near('Core loss (W)',r.NLL,268.23,0.05); near('Ek (%)',r.ek,2.9149,0.0005);
near('Rise inner (K)',r.rise1,114.484,0.01); near('Rise outer (K)',r.rise2,96,0); near('No-load current (%)',r.I0,1.94497,0.0001);
near('Total mass (kg)',r.totMass,297.52,0.01); near('Overall L',r.oL,960,0); near('Overall B',r.oB,775,0); near('Overall H',r.oH,870,0); near('RM price (Rs)',r.cost,111256.74,1);
is('Ratio check flags 0.442 % > 0.291 %',!r.checks.find(c=>/Turns-ratio/.test(c.name)).ok);

console.log('\n138.33 mm axial length (round Ø2.5, 2.61 insulated, 52 turns/layer, +1)');
const q=X.rectDesign({...X.RC_DEFAULTS,basis:'refined',condBasis:'standard',hvCond:{type:'round',b:2.5,h:2.5,rad:1,ax:1},N1:null,N2:104,hvLayers:2});
near('Outer axial length',q.len2,138.33,0.001);

console.log('\n500 kVA round core — step method (Sara Consultants)');
const o=X.design(X.DEFAULTS);
near('Core diameter',o.core.D,219,0); near('Core weight (kg)',o.core.W,1123.6,1); near('No-load loss (W)',o.loss.NLL,1537,2);
near('LV load loss (W)',o.lv.LL,1515,5); near('LV strip b',o.lv.b,9.2,0); near('LV strip h',o.lv.h,4.8,0); near('Enclosure L',o.dims.eL,1750,0); near('Enclosure B',o.dims.eB,830,0);

console.log('\n600 kVA round core, aluminium — VS design sheet');
const p6={...X.DEFAULTS,kVA:600,hvConn:'Y',lvConn:'D',lvMat:'Al',hvMat:'Al',insClass:'H',k:0.4236,B:1.55,Jlv:1.55,Jhv:1.62,tapPlus:0,tapMinus:0,tapStep:0,refTemp:115,zTarget:6,window:995,lvEnd:130,hvEnd:140,lvLayers:2,lvAx:3,lvRad:2,lvTransp:20,lvDucts:1,lvDuctT:12,hvCoils:1,hvCond:'strip',hvDucts:2,hvDuctT:12,hvMinIns:0.26,hvTol:0.1,lvhvGap:29,phaseGap:43};
const s=X.design(p6);
near('LV strip b',s.lv.b,11,0); near('LV strip h',s.lv.h,4.8,0); near('LV section (mm²)',s.lv.cs,311.64,0.01); near('Core weight (kg)',s.core.W,1244,3); near('Impedance (%)',s.imp.ek,5.92,0.05);

console.log('\nStandards helpers');
near('IEC ratio limit at Z = 2.91 %',X.STD.ratioLimit(2.91),0.291,1e-9); near('Altitude factor 2000 m',X.STD.altitudeFactor(2000),0.95,1e-9);
near('Al σ @115 °C (61 % IACS)',X.STD.sigmaStd('Al',115),25.49,0.01); near('SC temp Al θ0=164.5 J=47.9 t=2',X.STD.scTemp('Al',164.5,47.9,2),251,1);

console.log('\n'+(n-fail)+' / '+n+' checks passed'); process.exit(fail?1:0);
