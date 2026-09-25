// ===== Rectangular-core dry-type (LV/LV) design engine — follows the RECT CORE TYPE CAL1 sheet =====
const RC={};
// CORELOSS sheet: specific loss W/kg at 50 Hz vs flux density
RC.CORELOSS={B:[0.6,0.625,0.65,0.675,0.7,0.725,0.75,0.775,0.8,0.825,0.85,0.875,0.9,0.925,0.95,0.975,1,1.025,1.05,1.075,1.1,1.125,1.15,1.175,1.2,1.225,1.25,1.275,1.3,1.325,1.35,1.375,1.4,1.425,1.45,1.475,1.5,1.525,1.55,1.575,1.6,1.625,1.65,1.675,1.7,1.725,1.75],
 'CRNO-35':[0.45,0.475,0.5,0.525,0.55,0.575,0.6,0.625,0.65,0.675,0.725,0.765,0.8,0.825,0.85,0.9,0.95,1,1.05,1.1,1.15,1.2,1.25,1.3,1.35,1.425,1.5,1.55,1.6,1.675,1.75,1.825,1.9,1.975,2.05,2.15,2.25,2.35,2.45],
 'M4-27':[0.135,0.15,0.16,0.17,0.18,0.19,0.2,0.218,0.235,0.258,0.26,0.275,0.29,0.31,0.33,0.345,0.36,0.38,0.4,0.42,0.44,0.46,0.48,0.495,0.51,0.535,0.56,0.58,0.6,0.625,0.65,0.675,0.7,0.73,0.76,0.795,0.83,0.865,0.9,0.95,1,1.06,1.12,1.185,1.25,1.325,1.4],
 'MOH-23':[0.11,0.12,0.13,0.14,0.15,0.16,0.17,0.185,0.195,0.21,0.22,0.23,0.24,0.255,0.27,0.285,0.3,0.31,0.32,0.335,0.35,0.37,0.39,0.405,0.42,0.44,0.46,0.475,0.49,0.505,0.52,0.54,0.56,0.58,0.6,0.625,0.65,0.675,0.7,0.73,0.76,0.79,0.82,0.86,0.9,0.95,1]};
// VA sheet: magnetising VA/kg vs B (50 Hz)
RC.VAKG={B:[1.25,1.3,1.35,1.4,1.45,1.5,1.55,1.6,1.65,1.7,1.75],v:[0.65,0.7,0.76,0.82,0.9,1.03,1.2,1.45,1.85,2.5,4]};
// Conductivity used by the design sheet (m/Ω·mm² at 90 / 115 °C), density, stray factor
RC.COND={Cu:{t90:44.7,t115:42.76,dens:8.89,sf:0.9622,name:'COPPER'},Al:{t90:28,t115:26.73,dens:2.7,sf:0.7618,name:'ALUMINIUM'}};
RC.LAM=[30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,110,120,130,140,150,160,170,180,200,220,250];
function rcLookup(xs,ys,x,mode){ const n=Math.min(xs.length,ys.length); if(mode==='floor'){ let i=0; for(let k=0;k<n;k++) if(xs[k]<=x+1e-9) i=k; return ys[i]; }
  if(x<=xs[0]) return ys[0]; if(x>=xs[n-1]) return ys[n-1]+(ys[n-1]-ys[n-2])*(x-xs[n-1])/(xs[n-1]-xs[n-2]);
  let i=0; while(xs[i+1]<x) i++; return ys[i]+(ys[i+1]-ys[i])*(x-xs[i])/(xs[i+1]-xs[i]); }
function rcCorner(h){ return h<=1.6?0.216:h<=2.24?0.363:h<=3.55?0.55:h<=5.6?0.86:1.34; }
// Conductivity at T: 'sheet' = CAL1 cells F50:G51 (linear between 90 and 115 °C); 'standard' = IEC 60028 / 61 % IACS; 'custom' = value at T
function rcSigma(mat,T,basis,custom){ if(basis==='custom'&&custom) return custom; if(basis==='standard') return STD.sigmaStd(mat,T); const c=RC.COND[mat]; return c.t90+(c.t115-c.t90)*(T-90)/25; }
const r5=x=>Math.round(x/5)*5, rnd=(x,n)=>Math.round(x*10**n)/10**n;

// ---- conductor geometry helpers ----
function rcCond(c,ins){ // c:{type,b,h,rad,ax}
  if(c.type==='round'){ const d=c.b; return {...c,h:d,bi:d+ins,hi:d+ins,cs:Math.PI/4*d*d*c.rad*c.ax,corner:0}; }
  const corner=rcCorner(c.h); return {...c,bi:c.b+ins,hi:c.h+ins,cs:(c.b*c.h-corner)*c.rad*c.ax,corner};
}
let RC_EXTRA_TURN=1; // one conductor width per layer for the layer-to-layer crossover (strip and round)
let RC_ROUND_LEN=false; // false = exact (e.g. 138.33); true = ROUND(...,0) as in CAL1 cell B30
// Turns in the fullest layer are whole turns: ceil(N / layers)
const rcTplAx=(N,L)=>Math.ceil(N/L-1e-9);
function rcWindLen(C,tplAx,extra){ const x=C.bi*C.ax*(tplAx+RC_EXTRA_TURN)+extra; return RC_ROUND_LEN?Math.round(x):Math.round(x*100)/100; }
function rcRadial(C,layers,ducts,ductW,il,bulge){ return rnd((C.hi*C.rad*layers+ducts*ductW+il*(layers-1))*bulge/5,1)*5; }

function rectDesign(p){
  RC_EXTRA_TURN=(p.extraTurn==null?1:p.extraTurn); RC_ROUND_LEN=!!p.roundLen;
  const o={p,warn:[],checks:[]}; const sq3=Math.sqrt(3); const f=p.freq;
  // Inner = lower voltage winding
  const priLow=p.priV<=p.secV;
  const W1={role:priLow?'Primary':'Secondary',V:priLow?p.priV:p.secV,conn:priLow?p.priConn:p.secConn};
  const W2={role:priLow?'Secondary':'Primary',V:priLow?p.secV:p.priV,conn:priLow?p.secConn:p.priConn};
  for(const w of [W1,W2]){ w.Vph=w.conn==='Y'?w.V/sq3:w.V; w.Iph=w.conn==='Y'?p.kVA*1000/(sq3*w.V):p.kVA*1000/(3*w.V); }
  const sheet=p.basis==='sheet';
  // V/t (sheet: 1.01 × √(kVA/3) × K/100)
  const Vt0=1.01*Math.sqrt(p.kVA/3)*p.K/100; const vr=W2.Vph/W1.Vph;
  let N1,N2;
  if(p.N1&&p.N2){ N1=p.N1; N2=p.N2; }
  else if(p.N1){ N1=p.N1; N2=Math.round(N1*vr); }
  else if(p.N2){ N2=p.N2; N1=Math.max(1,Math.round(N2/vr)); }
  else { N1=Math.round(W1.Vph/Vt0); N2=Math.round(W2.Vph/Vt0); }
  let rerr=(vr-N2/N1)/vr*100;
  // Refined basis: choose turns that meet the IEC 60076-1 ratio tolerance (estimated with the lower impedance limit)
  const zLoEst=(p.zTarget||3)*(1-(p.zTolMinus||0)/100);
  if(!sheet&&!p.N1&&!p.N2&&Math.abs(rerr)>STD.ratioLimit(zLoEst)*0.9){
    const lim=STD.ratioLimit(zLoEst)*0.9, n0=W1.Vph/Vt0; let best=null;
    for(let n=Math.max(1,Math.round(n0)-8);n<=Math.round(n0)+8;n++){ const m=Math.round(n*vr); const e=(vr-m/n)/vr*100; const s=(Math.abs(e)>lim?100+Math.abs(e):0)+Math.abs(n-n0)/n0*20; if(!best||s<best.s) best={n,m,e,s}; }
    N1=best.n; N2=best.m; rerr=best.e; o.turnsAdjusted=true; }
  const Vt=sheet?Vt0:W1.Vph/N1;
  // Core
  const sf=p.grade==='CRNO-35'?0.95:0.96;
  const Areq=Vt/(4.44*f*p.B*1e-4); // cm²
  const W=p.W; const D=p.D||Math.round(((Areq/sf)/(W*0.1))*10);
  const Anet=sheet?Areq:W*D*sf/100; const Bact=Vt/(4.44*f*Anet*1e-4);
  const cW=W+p.plateW, cD=D+p.plateD;
  // Windings
  const L1=p.lvLayers, L2=p.hvLayers; const tpl1=N1/L1, tpl2=N2/L2; const tplAx1=rcTplAx(N1,L1), tplAx2=rcTplAx(N2,L2);
  const C1=rcCond(p.lvCond,p.lvIns), C2=rcCond(p.hvCond,p.hvIns);
  const len1=rcWindLen(C1,tplAx1,p.lvTransp+p.lvComp+p.lvAxDucts), len2=rcWindLen(C2,tplAx2,p.hvTransp+p.hvComp+p.hvAxDucts);
  const imp1=len1-(C1.bi*C1.ax), imp2=sheet?Math.round(len2-C2.bi*C2.ax):len2-C2.bi*C2.ax;
  const rad1=rcRadial(C1,L1,p.lvDucts,p.lvDuctW,p.lvIL,p.bulge), rad2=rcRadial(C2,L2,p.hvDucts,p.hvDuctW,p.hvIL,p.bulge);
  let limb=Math.max(len1+p.lvEnd, len2+p.hvEndMin); if(p.limb) limb=p.limb;
  const end2=limb-len2, end1=limb-len1;
  // Build-up (widths across W and D directions, mm)
  const ID1w=cW+p.gap, ID1d=cD+p.gap, OD1w=ID1w+2*rad1, OD1d=ID1d+2*rad1;
  const ID2w=OD1w+p.delta, ID2d=OD1d+p.delta, OD2w=ID2w+2*rad2, OD2d=ID2d+2*rad2;
  const Cd=p.Cdist||(OD2w+p.am); const yokeL=2*Cd+W; const winW=Cd-W;
  const R1=p.gap/2, R2=R1+rad1, R3=R2+p.delta/2, R4=R3+rad2;
  const per=R=>Math.round(2*W+2*cD+2*Math.PI*R);
  const P1=per(R1),P2=per(R2),P3=per(R3),P4=per(R4);
  const m1=(P1+P2)/2, mg=(P2+P3)/2, m2=(P3+P4)/2;
  // Resistance, weights
  const T=p.windTemp; const sig1=rcSigma(p.mat,T,p.condBasis,p.sigmaCustom); const mat=RC.COND[p.mat];
  const wire1=m1/1000*N1, wire2=m2/1000*N2;
  const Rw1=wire1/(C1.cs*sig1), Rw2=wire2/(C2.cs*sig1);
  const bare1=wire1*C1.cs*mat.dens*3/1000, bare2=wire2*C2.cs*mat.dens*3/1000;
  const insA=(C)=>C.type==='round'?(Math.PI/4*(C.bi*C.bi-C.b*C.b)):(C.bi*C.hi-C.b*C.h);
  const ins1=bare1+insA(C1)*C1.rad*C1.ax*wire1*2*3/1000, ins2=bare2+insA(C2)*C2.rad*C2.ax*wire2*2*3/1000;
  // Impedance geometry
  const h=(imp1+imp2)/2, bb=rad1+p.delta/2+rad2; const kr=1-1/((h/bb)*Math.PI); const Ls=h/kr;
  const dP=(p.delta/2)*mg+(rad1*m1+rad2*m2)/3;
  // Stray (eddy) loss
  const sf1=mat.sf;
  let st1,st2;
  if(sheet){ st1=Math.pow((C1.h/10)*Math.sqrt((C1.b*(tpl1+1)*kr)/len1)*sf1,4)*((L1*C1.rad)**2/9)*100;
             st2=Math.pow((C2.h/10)*Math.sqrt((C2.h*(tpl2+1)*kr)/len2)*sf1,4)*((L2*C2.rad)**2/9)*100; }
  else { const fill=(C,tpl,len)=>Math.min(1,C.b*C.ax*(tpl+RC_EXTRA_TURN)*kr/len); const m=(L,C)=>L*C.rad; const k=(C)=>C.type==='round'?sf1*0.83:sf1;
    st1=Math.pow((C1.h/10)*Math.sqrt(fill(C1,tplAx1,len1))*k(C1),4)*((m(L1,C1))**2-0.2)/9*100; st2=Math.pow((C2.h/10)*Math.sqrt(fill(C2,tplAx2,len2))*k(C2),4)*((m(L2,C2))**2-0.2)/9*100; }
  // Harmonic (non-linear) loading: winding eddy × K, other stray × K^0.8
  const Kf=p.kFactor||1; st1*=STD.kEddy(Kf); st2*=STD.kEddy(Kf);
  const LL1=W1.Iph**2*Rw1*3*(1+st1/100), LL2=W2.Iph**2*Rw2*3*(1+st2/100); const tank=Math.ceil(p.kVA*p.tankWkVA*STD.kOther(Kf));
  const LL=LL1+LL2+tank;
  const er=sheet?rnd((LL/p.kVA)*0.1,2):LL/(p.kVA*10);
  const ex=(8*Math.PI**2*f*W1.Iph*N1*dP*1e-8)/(Ls*Vt); const ek=Math.sqrt(er*er+ex*ex);
  // Core mass & loss (tables are 50 Hz; corrected for other frequencies)
  const coreMass=(limb*3+yokeL*2)*0.1*Anet*7.65e-3;
  const spec=rcLookup(RC.CORELOSS.B,RC.CORELOSS[p.grade],Bact,sheet?'floor':'lin')*STD.fLoss(f);
  const NLL=coreMass*p.coreFactor*spec*p.buildF;
  // No-load current
  const vakg=rcLookup(RC.VAKG.B,RC.VAKG.v,Bact,sheet?'floor':'lin')*STD.fVA(f); const vacm=(11.823*Bact**3-44.891*Bact**2+61.585*Bact-29.304)*STD.fVA(f);
  const mLimb=W*D*sf*limb*3*7.65e-6, mYoke=W*D*(Cd-W)*sf*4*7.65e-6, mCorner=W*W*D*sf*6*7.65e-6;
  const vaLimb=vakg*mLimb, vaYoke=vakg*mYoke, vaCorner=6*vakg*mCorner, vaGap=6*vacm*W*D*sf*1e-2; const VA=vaLimb+vaYoke+vaCorner+vaGap; const I0=VA/(p.kVA*1000)*100;
  const extraNL=((I0/100)*W2.Iph)**2*Rw2*3;
  // Thermal (design-sheet rule, with calibration factors from heat-run tests)
  const S1=m1/1000*(imp1/1000)*(2+2*p.lvDucts), S2=m2/1000*(imp2/1000)*(2+2*p.hvDucts);
  const q1=LL1/(3*S1), q2=LL2/(3*S2);
  const rise1=(15+q1/5)*(p.riseCal1||1), rise2=(sheet?15+Math.round(q2/7):15+q2/7)*(p.riseCal2||1);
  const hal=(q,len)=>Math.pow(q*Math.pow(len/1000,0.25)/1.4255,0.8);
  const coreSa=((2*W+D)*yokeL+(W*D*4))*1e-2, wdgSa=m2*imp2*1e-2*3; const mcly=450*Math.pow((NLL+LL)/(coreSa+wdgSa),0.826);
  // Mechanical
  const aL=r5(2*Cd+(OD2w-W)), aB=r5(OD2d+p.leads), aH=r5(5+2*W+limb);
  const oL=r5(aL+2*p.clrL), oB=r5(aB+2*p.clrB), oH=r5(aH+p.clrTop+p.clrBot);
  // BOM
  const bom=[]; const add=(k,q,pr)=>bom.push({k,q,pr,amt:q*pr});
  const cond=rnd(ins1+ins2*1.025,1);
  add('Core '+p.grade,coreMass,p.price.core); add('Core steel + SS',rnd(coreMass*0.1,1),p.price.coreSteel); add(mat.name+' conductor',cond,p.price.cond);
  add('Leads',0.05*cond,p.price.leads); add('Insulation FG',0.12*cond,p.price.fg); add('Connection FG',4*aL/1000,p.price.connFg); add('Insulation Cl-H',0.025*cond,p.price.clh);
  const s1=bom.reduce((a,x)=>a+x.q,0); add('Resin VT-50',s1*0.05,p.price.resin); const s2=bom.reduce((a,x)=>a+x.q,0); add('Misc',s2*0.05,0);
  const crca=p.enclosure?(((oL+oB)*2*oH)+(oL*oB))*p.enclThk*1e-3*7.84e-3:0; add('CRCA enclosure',crca,p.price.crca);
  const totMass=bom.reduce((a,x)=>a+x.q,0); const matCost=bom.reduce((a,x)=>a+x.amt,0); const others=matCost*p.price.others/100;
  const rmc=Math.round((coreMass*260+cond*360)*1.5);
  const eff=100*p.kVA*1000/(p.kVA*1000+NLL+LL), eff50=100*p.kVA*500/(p.kVA*500+NLL+0.25*LL);
  const coreWdg=Math.round(1.135*(coreMass+bare1+bare2));
  // Inter-layer insulation check (PDF method): V/t × 2 layers × 2 overvoltage × turns/layer ÷ breakdown − conductor insulation
  const ilReq=(tplAx,ins)=>Math.max(0,Vt*2*2*tplAx/(p.Eb||10000)-ins);
  const ilReq1=ilReq(tplAx1,p.lvIns), ilReq2=ilReq(tplAx2,p.hvIns);
  // Short-circuit withstand (IEC 60076-5)
  const riseLim=p.riseLimit*STD.altitudeFactor(p.altitude);
  const sc=STD.shortCircuit({kVA:p.kVA,ek,er,ex,faultMVA:p.faultMVA,t:p.scTime||2,amb:p.amb,insClass:p.insClass,perim_m:mg/1000,h_m:Ls/1000,span_mm:bb},
    [{name:W1.role+' (inner)',I:W1.Iph,N:N1,cs:C1.cs,mat:p.mat,rise:rise1,outer:false,stressLim:p.mat==='Cu'?p.stressCu:p.stressAl},
     {name:W2.role+' (outer)',I:W2.Iph,N:N2,cs:C2.cs,mat:p.mat,rise:rise2,outer:true,stressLim:p.mat==='Cu'?p.stressCu:p.stressAl}]);
  const noise=STD.noise(p.noiseA,p.noiseB,coreMass,Bact);
  Object.assign(o,{W1,W2,Vt0,Vt,N1,N2,rerr,sf,Areq,Anet,W,D,Bact,cW,cD,L1,L2,tpl1,tpl2,tplAx1,tplAx2,C1,C2,len1,len2,imp1,imp2,rad1,rad2,limb,end1,end2,
    ID1w,ID1d,OD1w,OD1d,ID2w,ID2d,OD2w,OD2d,Cd,yokeL,winW,R:[R1,R2,R3,R4],P:[P1,P2,P3,P4],m1,mg,m2,sig:sig1,wire1,wire2,Rw1,Rw2,bare1,bare2,ins1,ins2,
    h,bb,kr,Ls,dP,st1,st2,LL1,LL2,tank,LL,er,ex,ek,coreMass,spec,NLL,vakg,vacm,mLimb,mYoke,mCorner,vaLimb,vaYoke,vaCorner,vaGap,VA,I0,extraNL,
    S1,S2,q1,q2,rise1,rise2,hal1:hal(q1,imp1),hal2:hal(q2,imp2),coreSa,wdgSa,mcly,aL,aB,aH,oL,oB,oH,bom,totMass,matCost,others,cost:matCost+others,rmc,eff,eff50,coreWdg,
    J1:W1.Iph/C1.cs,J2:W2.Iph/C2.cs,ilReq1,ilReq2,sc,noise,riseLim,Kf,
    toc:STD.toc(matCost+others,NLL,LL,p.capA,p.capB), cut:STD.cutList([{w:W,stack:D}],limb,Cd,sf)});
  // Compliance
  const zLo=p.zTarget*(1-p.zTolMinus/100), zHi=p.zTarget*(1+p.zTolPlus/100);
  o.zLo=zLo; o.zHi=zHi; o.ratioLim=STD.ratioLimit(ek);
  const hsMax={A:105,E:120,B:130,F:155,H:180}[p.insClass];
  const chk=(name,req,got,ok)=>o.checks.push({name,req,got,ok});
  chk('Impedance @'+T+' °C',p.zTarget+' % (+'+p.zTolPlus+' / −'+p.zTolMinus+' %) → '+rnd(zLo,2)+'–'+rnd(zHi,2)+' %',rnd(ek,2)+' %',ek>=zLo-1e-9&&ek<=zHi+1e-9);
  chk('Efficiency @'+T+' °C, 100 % load','> '+p.effMin+' %',rnd(eff,2)+' %',eff>p.effMin);
  chk('Winding temperature rise (inner / outer)','≤ '+rnd(riseLim,1)+' K at '+p.amb+' °C ambient'+(riseLim<p.riseLimit?' (altitude '+p.altitude+' m)':''),rnd(rise1,1)+' / '+rnd(rise2,1)+' K',Math.max(rise1,rise2)<=riseLim);
  const hs=STD.hotSpot(p.insClass,p.amb,Math.max(rise1,rise2)); o.hs=hs;
  chk('Hot-spot temperature (IEC 60076-12)','≤ '+hs.max+' °C (class '+p.insClass+', Table 2)',rnd(hs.tHS,0)+' °C = '+p.amb+' + 1.25 × '+rnd(Math.max(rise1,rise2),1)+' K',hs.ok);
  chk('Turns-ratio error (IEC 60076-1)','≤ '+rnd(o.ratioLim,3)+' % (lower of 0.5 % and Z/10)',rnd(rerr,3)+' %',Math.abs(rerr)<=o.ratioLim+1e-9);
  chk('Flux density','≤ 1.55 T for low noise',rnd(Bact,3)+' T',Bact<=1.55);
  { const ov=STD.overflux(Bact,p.ovPct??10,p.bSat||1.9); o.overflux=ov; chk('Flux at '+(p.ovPct??10)+' % over-voltage','≤ '+(p.bSat||1.9)+' T',rnd(ov.Bov,3)+' T',ov.ok); }
  if(p.llTarget){ const tol=p.llTol??5, dev=(LL-p.llTarget)/p.llTarget*100; o.llDev=dev; chk('Load loss target','≤ '+p.llTarget+' W (tolerance −'+tol+' %)',Math.round(LL)+' W ('+(dev>=0?'+':'')+rnd(dev,1)+' %)',dev<=0.0001&&dev>=-tol); }
  chk('Noise (estimate, calibrate with a test)','≤ '+p.noiseMax+' dB',rnd(noise,1)+' dB',noise<=p.noiseMax);
  chk('Current density inner / outer',p.mat==='Al'?'≤ 1.8 A/mm² (Al)':'≤ 3.0 A/mm² (Cu)',rnd(o.J1,3)+' / '+rnd(o.J2,3),Math.max(o.J1,o.J2)<=(p.mat==='Al'?1.8:3.0));
  chk('Inter-layer insulation inner / outer','≥ '+rnd(ilReq1,3)+' / '+rnd(ilReq2,3)+' mm',p.lvIL+' / '+p.hvIL+' mm',p.lvIL>=ilReq1-1e-9&&p.hvIL>=ilReq2-1e-9);
  for(const w of sc.windings){ chk('Short-circuit thermal, '+w.name,'≤ '+w.lim+' °C after '+sc.t+' s (IEC 60076-5)',rnd(w.th1,0)+' °C',w.thermalOk); }
  // Rectangular coils: under short circuit the straight sides bend between corners/supports like a beam fixed at both ends.
  // Resin-bonded (VPI / cast) windings act as one block; loose windings bend turn by turn. Estimate: M = f·L²/12.
  const span=Math.max(cW,cD)/((p.supports||0)+1); o.span=span;
  const bend=(w,C,N,len,rad)=>{ const f=w.Fr/(mg/1000)/1000; /* N per mm of mean perimeter */ const M=f*span*span/12;
    return p.bendModel==='loose'? M/(N*C.rad*C.ax)/(C.b*C.h*C.h/6) : M/(len*rad*rad/6); };
  o.bend1=bend(sc.windings[0],C1,N1,len1,rad1); o.bend2=bend(sc.windings[1],C2,N2,len2,rad2);
  const wo=sc.windings[1]; chk('Short-circuit hoop stress, outer (tensile)','≤ '+wo.stressLim+' MPa (0.9 × Rp0.2)',rnd(wo.sigma,1)+' MPa',wo.stressOk);
  const wi=sc.windings[0]; const cLim=STD.compLimit(wi.stressLim,p.bonded); const sEq=wi.sigma*(L1>=3?1.1:1); o.compLim=cLim; o.compEq=sEq;
  chk('Short-circuit hoop stress, inner (compressive)','≤ '+rnd(cLim,1)+' MPa ('+(p.bonded?'0.6':'0.35')+' × Rp0.2, IS 2026-5 Annex A)',rnd(sEq,1)+' MPa'+(L1>=3?' (1.1 × mean)':''),sEq<=cLim);
  const lim=wo.stressLim; const tot2=wo.sigma+o.bend2, tot1=Math.abs(sc.windings[0].sigma)+o.bend1;
  chk('Short-circuit bending of straight sides, outer (estimate)','hoop + bending ≤ '+lim+' MPa; span '+rnd(span,0)+' mm, '+(p.bendModel==='loose'?'loose turns':'resin-bonded'),rnd(wo.sigma,1)+' + '+rnd(o.bend2,1)+' = '+rnd(tot2,1)+' MPa',tot2<=lim);
  chk('Short-circuit bending of straight sides, inner (estimate)','hoop + bending ≤ '+lim+' MPa',rnd(Math.abs(sc.windings[0].sigma),1)+' + '+rnd(o.bend1,1)+' = '+rnd(tot1,1)+' MPa',tot1<=lim);
  const zMin=STD.zMin(p.kVA); o.zMin=zMin;
  if(ek<zMin) o.warn.push('Impedance '+rnd(ek,2)+' % is below the IEC 60076-5 recognised minimum of '+zMin+' % for this rating: short-circuit withstand is subject to agreement with the purchaser'+(sc.mult>25?'; with the fault current above 25 × rated, a duration below 2 s may also be agreed (IEC 60076-5 4.1.3)':'')+'.');
  for(const c of o.checks) if(!c.ok) o.warn.push(c.name+': required '+c.req+', obtained '+c.got+'.');
  if(C1.type==='strip'&&(C1.b/C1.h<1.2)) o.warn.push('Inner strip breadth/height ratio is low; check winding practicality.');
  if(end2<p.hvEndMin-1e-6) o.warn.push('Outer winding end clearance is below the minimum.');
  if(p.priV>=3600||p.secV>=3600) o.warn.push('Um ≥ 3.6 kV: partial discharge test ≤ 10 pC applies (IEC 60076-11); insulation distances need a separate check.');
  return o;
}

// ---------- Auto design ----------
function rcPickCond(N,I,J,Ltarget,ins,il,fixed,maxLayers){
  let best=null; const A=I/J;
  const layers=fixed.layers?[fixed.layers]:Array.from({length:maxLayers},(_,i)=>i+1);
  for(const L of layers){ const tplAx=rcTplAx(N,L);
    if(A<=8 && !fixed.strip){ for(const ax of [1,2]){ const d0=Math.sqrt(4*A/Math.PI/ax); const d=Math.ceil(d0*20)/20; if(d<0.8||d>4) continue; const C=rcCond({type:'round',b:d,h:d,rad:1,ax},ins); const len=rcWindLen(C,tplAx,0);
      if(len>Ltarget*1.02||len<Ltarget*0.85) continue; const rad=C.hi*L+il*(L-1); const s=rad+Math.abs(len-Ltarget)*0.05+ax*0.3; if(!best||s<best.s) best={s,L,C,len}; } }
    for(const ax of [1,2,3,4]) for(const rad of [1,2]){ const biMax=Ltarget/(ax*(tplAx+RC_EXTRA_TURN)); const b=Math.floor((biMax-ins)*2)/2; if(b<4||b>16) continue;
      const per=A/(ax*rad); let h=Math.ceil(((per+rcCorner(per/b))/b)*10)/10; if(h<0.8||h>5.6||b/h<1.3) continue;
      const C=rcCond({type:'strip',b,h,rad,ax},ins); const len=rcWindLen(C,tplAx,0); const radial=C.hi*rad*L+il*(L-1);
      const s=radial+Math.abs(len-Ltarget)*0.05+(ax*rad-1)*0.6+(L>1?0:0.5); if(!best||s<best.s) best={s,L,C,len}; } }
  return best;
}
function rcScore(o,p,d1){
  const zc=p.zTarget*(1-(p.zTolMinus-p.zTolPlus)/200); let s=0;
  if(o.ek<o.zLo||o.ek>o.zHi) s+=100+50*Math.abs(o.ek-zc)/p.zTarget; else s+=8*Math.abs(o.ek-zc)/p.zTarget;
  const rmax=Math.max(o.rise1,o.rise2); if(rmax>o.riseLim) s+=60+(rmax-o.riseLim);
  if(o.eff<=p.effMin) s+=80+(p.effMin-o.eff)*20;
  if(Math.abs(o.rerr)>o.ratioLim) s+=40; if(o.Bact>1.6) s+=30;
  if(p.scRequired){ for(const w of o.sc.windings){ if(!w.thermalOk) s+=40+(w.th1-w.lim)*0.2; } if(!o.sc.windings[1].stressOk) s+=25; }
  // every other failed check costs 15
  for(const c of o.checks){ if(!c.ok&&/Flux|Noise|Current density|Hot-spot|Inter-layer/.test(c.name)) s+=15; }
  if(p.llTarget){ const tol=p.llTol??5, dev=(o.LL-p.llTarget)/p.llTarget*100; if(dev>0) s+=30+dev*3; else if(dev<-tol) s+=10+(-tol-dev); }
  if(p.capA||p.capB) s+= o.toc/(p.kVA*1000)*p.wCost + (d1+o.p.hvDucts)*0.3;
  else s+= o.cost/(p.kVA*1000)*p.wCost + (o.NLL+o.LL)/(p.kVA*10)*p.wLoss + (d1+o.p.hvDucts)*0.3;
  return s;
}
// One search pass. opt: {Ks, Lts, Jf (current-density factors)}
var rectAuto1=function(p,opt){
  const base={...p};
  const Ks=opt&&opt.Ks?opt.Ks:(p.K?[p.K]:[55,65,75,85,95,105]);
  const Lts=opt&&opt.Lts?opt.Lts:(()=>{const a=[];for(let L=100;L<=900;L+=20)a.push(L);return a;})();
  const Jfs=opt&&opt.Jf?opt.Jf:[1];
  const J10=p.J1||(p.mat==='Al'?1.4:2.3), J20=p.J2||(p.mat==='Al'?1.5:2.5);
  let best=null,bestS=Infinity,count=0; const cands=[];
  for(const K of Ks){
    const probe=rectDesign({...base,K,W:80,D:null,lvLayers:1,hvLayers:1,lvCond:{type:'strip',b:10,h:3,rad:1,ax:1},hvCond:{type:'strip',b:10,h:3,rad:1,ax:1},lvDucts:0,hvDucts:0});
    const N1=probe.N1,N2=probe.N2, I1=probe.W1.Iph, I2=probe.W2.Iph; const Areq=probe.Areq, sf=probe.sf;
    const Ws=p.W?[p.W]:RC.LAM.filter(w=>{const D=Areq/sf/(w*0.1)*10; return D/w>=1.1&&D/w<=2.6;});
    const bothFixed=p.lvCondFixed&&p.hvCondFixed;
    for(const jf of (bothFixed?[1]:Jfs)){ const J1=J10*jf, J2=J20*jf;
    for(const Lt of (bothFixed?[Lts[0]]:Lts)){
      const c1=(p.lvCondFixed)?{L:p.lvLayers,C:rcCond(p.lvCondFixed,p.lvIns)}:rcPickCond(N1,I1,J1,Lt,p.lvIns,p.lvIL,{layers:p.lvLayers},8);
      const c2=(p.hvCondFixed)?{L:p.hvLayers,C:rcCond(p.hvCondFixed,p.hvIns)}:rcPickCond(N2,I2,J2,Lt,p.hvIns,p.hvIL,{layers:p.hvLayers},10);
      if(!c1||!c2) continue;
      for(const W of Ws){
        for(const d1 of (p.lvDucts!=null?[p.lvDucts]:[0,1,2])){ let o=null;
          for(const d2 of (p.hvDucts!=null?[p.hvDucts]:[0,1,2])){
            o=rectDesign({...base,K,W,D:p.W?p.D:null,lvLayers:c1.L,hvLayers:c2.L,lvCond:c1.C,hvCond:c2.C,lvDucts:d1,hvDucts:d2,N1:probe.N1,N2:probe.N2}); count++;
            if(o.rise2<=o.riseLim) break; }
          const s=rcScore(o,p,d1); o._s=s; o._K=K; o._Lt=Lt; o._jf=jf; cands.push(o); if(cands.length>120){ cands.sort((a,b)=>a._s-b._s); cands.length=40; }
          if(s<bestS){bestS=s;best=o;}
          if(o.rise1<=o.riseLim) break; }
      }
    } }
  }
  if(best){ best.searched=count; best.score=bestS; best._cands=cands; }
  return best;
};
// Full automatic design: coarse pass (winding length step 20 mm), then a fine pass (step 10 mm, K ±5) around the best.
// Flux density is searched when left blank (1.30 / 1.40 / 1.50 T, then ±0.05 T). Current density is lowered when
// short-circuit withstand is required and cannot be met at the target densities.
function rectAutoCore(p){
  // Current density is searched when short-circuit withstand is required or a load-loss target is set (and no J is fixed)
  const scJ=(p.scRequired||p.llTarget)&&!p.J1&&!p.J2; const Jc=p.llTarget&&!p.J1&&!p.J2?[1.2,1,0.85,0.7]:(scJ?[1,0.85,0.7]:[1]);
  const fine=(q,b)=>{ if(!b) return null; let n=b.searched;
    const Ks=q.K?[q.K]:[b._K-5,b._K,b._K+5].filter(k=>k>=40);
    const Lts=[]; for(let L=b._Lt-30;L<=b._Lt+30;L+=10) if(L>=80) Lts.push(L);
    const Jf=scJ?[b._jf-0.1,b._jf-0.05,b._jf,b._jf+0.05,b._jf+0.1].filter(x=>x>0.4&&x<=(p.llTarget?1.3:1)):[b._jf];
    const f=rectAuto1(q,{Ks,Lts,Jf}); if(f){ n+=f.searched; if(f.score<b.score) b=f; } b.searched=n; return b; };
  if(p.B) return fine(p,rectAuto1(p,{Jf:Jc}));
  let best=null,n=0;
  for(const B of [1.3,1.4,1.5]){ const o=rectAuto1({...p,B},{Jf:Jc}); if(o){ n+=o.searched; if(!best||o.score<best.score) best=o; } }
  if(!best) return null;
  let top=null; for(const B of [best.p.B-0.05,best.p.B,best.p.B+0.05]){ const q={...p,B:Math.round(B*100)/100}; const o=fine(q,rectAuto1(q,{Ks:[best._K],Jf:[best._jf]})); if(o){ n+=o.searched; if(!top||o.score<top.score) top=o; } }
  top.searched=n; top.autoB=true; return top;
}
// Wraps the search and adds up to six alternative designs (different core width, K or layers) for comparison
function rectAuto(p){
  const pool=[]; const _a1=rectAuto1; rectAuto1=(q,opt)=>{ const b=_a1(q,opt); if(b&&b._cands) pool.push(...b._cands); return b; };
  let best; try{ best=rectAutoCore(p); } finally { rectAuto1=_a1; }
  if(!best) return null;
  pool.sort((a,b)=>a._s-b._s); const alts=[]; const sig=o=>o.W+'|'+o.p.K+'|'+o.L1+'|'+o.L2+'|'+o.p.B;
  for(const o of [best,...pool]){ if(alts.length>=6) break; if(alts.some(a=>a.sig===sig(o))) continue;
    alts.push({sig:sig(o),score:o._s??o.score,K:o.p.K,B:o.p.B,W:o.W,D:o.D,N1:o.N1,N2:o.N2,L1:o.L1,L2:o.L2,lvDucts:o.p.lvDucts,hvDucts:o.p.hvDucts,
      C1:{type:o.C1.type,b:o.C1.b,h:o.C1.h,rad:o.C1.rad,ax:o.C1.ax},C2:{type:o.C2.type,b:o.C2.b,h:o.C2.h,rad:o.C2.rad,ax:o.C2.ax},
      ek:o.ek,NLL:o.NLL,LL:o.LL,eff:o.eff,rise:Math.max(o.rise1,o.rise2),mass:o.totMass,cost:o.cost,toc:o.toc,fails:o.checks.filter(c=>!c.ok).length}); }
  for(const o of [best,...pool]) delete o._cands;
  best.alts=alts; return best;
}
const RC_DEFAULTS={kVA:70,freq:50,priV:433,priConn:'D',secV:400,secConn:'Y',vg:'Dyn11',mat:'Al',grade:'M4-27',insClass:'H',
  zTarget:3,zTolPlus:0,zTolMinus:10,effMin:97,riseLimit:115,amb:50,windTemp:115,noiseMax:50,basis:'sheet',condBasis:'sheet',sigmaCustom:null,
  K:79,B:1.4,W:80,D:null,plateW:0,plateD:4,gap:12,delta:12,am:15,lvEnd:40,hvEndMin:40,limb:null,Cdist:null,
  lvLayers:4,hvLayers:4,lvCond:{type:'strip',b:10.5,h:3.5,rad:1,ax:2},hvCond:{type:'strip',b:10.5,h:3.5,rad:1,ax:1},lvIns:0.11,hvIns:0.11,lvIL:0.13,hvIL:0.13,
  extraTurn:1,roundLen:false,lvDucts:0,hvDucts:0,lvDuctW:8,hvDuctW:8,lvAxDucts:0,hvAxDucts:0,lvTransp:0,hvTransp:0,lvComp:0,hvComp:0,bulge:1.1,
  tankWkVA:1.5,coreFactor:1.32,buildF:1.5,leads:0,clrL:250,clrB:260,clrTop:250,clrBot:75,enclosure:false,enclThk:2,
  altitude:1000,faultMVA:null,scTime:2,scRequired:false,ovPct:10,bSat:1.9,capA:null,capB:null,llTarget:null,llTol:5,stressCu:80,stressAl:35,bonded:false,bendModel:'bonded',supports:0,kFactor:1,riseCal1:1,riseCal2:1,noiseA:22,noiseB:35,Eb:10000,
  price:{core:270,coreSteel:200,cond:440,leads:440,fg:500,connFg:500,clh:5950,resin:650,crca:90,others:15},wCost:1,wLoss:0.5};
