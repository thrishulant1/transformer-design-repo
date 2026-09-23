// ===== Dry-type transformer design engine (step method, Sara Consultants style) =====
const MAT = {
  Cu:{name:'Copper',rho20:0.017241,k:234.5,dens:8.89,strayCoefStrip:0.9622,strayCoefRound:0.80},
  Al:{name:'Aluminium',rho20:0.02826,k:225,dens:2.703,strayCoefStrip:0.76,strayCoefRound:0.63}
};
const CORE_GRADES = { // Table 7 specific loss W/kg @50Hz
  'M4-0.27':{t:0.27,pts:[[1.40,0.70],[1.50,0.83],[1.60,1.01],[1.70,1.25],[1.73,1.33]]},
  'M3-0.23':{t:0.23,pts:[[1.40,0.57],[1.50,0.67],[1.60,0.80],[1.70,1.01],[1.73,1.04]]},
  '23ZDMH-0.23':{t:0.23,pts:[[1.40,0.49],[1.50,0.56],[1.60,0.65],[1.70,0.77],[1.73,0.80]]}
};
const CLASS_RISE = {A:60,E:75,B:80,F:100,H:125};
function interp(pts,x){ let i=0; if(x<=pts[0][0]) i=0; else if(x>=pts[pts.length-1][0]) i=pts.length-2; else {while(!(x>=pts[i][0]&&x<=pts[i+1][0]))i++;}
  const [x0,y0]=pts[i],[x1,y1]=pts[i+1]; return y0+(y1-y0)*(x-x0)/(x1-x0);}
function buildFactor(D,joint){ if(joint==='step'){return D<=300?1.20:1.10;} return D<=150?1.30:D<=300?1.25:1.20; }
function cornerRed(h){ if(h<=1.60)return 0.215; if(h<=2.24)return 0.363; if(h<=3.55)return 0.550; if(h<=5.60)return 0.860; return 1.340; }
function ductByLen(L){ return L<400?10:L<500?12:L<600?16:20; }
const r1=(x,n=1)=>Math.round(x*10**n)/10**n;
function hvClass(kVline){ if(kVline<=1.1) return {um:1.1,hvEnd:40,gap:10,phase:15,pf:3,li:0};
  if(kVline<=3.6) return {um:3.6,hvEnd:60,gap:15,phase:20,pf:10,li:40};
  if(kVline<=7.2) return {um:7.2,hvEnd:100,gap:22,phase:25,pf:20,li:60};
  if(kVline<=12) return {um:12,hvEnd:140,gap:31,phase:31,pf:28,li:75};
  if(kVline<=24) return {um:24,hvEnd:200,gap:45,phase:45,pf:50,li:125};
  return {um:36,hvEnd:260,gap:55,phase:60,pf:70,li:170}; }

// Stepped core: optimise step widths on a 5 mm grid, return steps & net area
const _sc={};
function stepCore(D,n,sf){ const key=D+'|'+n+'|'+sf; if(_sc[key]) return _sc[key]; return (_sc[key]=stepCore0(D,n,sf)); }
function stepCore0(D,n,sf){
  const R=D/2; let w=[]; for(let k=1;k<=n;k++){ const th=(k-0.5)/n*Math.PI/2*0.98; w.push(Math.max(20,Math.floor(2*R*Math.cos(th)/5)*5)); }
  w=[...new Set(w)].sort((a,b)=>b-a);
  const area=(ws)=>{ let prev=0,A=0; for(const x of ws){ if(x>D) return -1; const y=Math.sqrt(R*R-(x/2)**2); A+=x*2*(y-prev); prev=y;} return A; };
  let best=area(w), improved=true, it=0;
  while(improved&&it<200){ improved=false; it++;
    for(let i=0;i<w.length;i++) for(const d of [-5,5]){ const t=w.slice(); t[i]+=d;
      if(t[i]<20||t[i]>D-1) continue; if(i>0&&t[i]>=t[i-1]) continue; if(i<t.length-1&&t[i]<=t[i+1]) continue;
      const a=area(t); if(a>best+1e-9){best=a;w=t;improved=true;} } }
  let prev=0; const steps=w.map(x=>{ const y=Math.sqrt(R*R-(x/2)**2); const s=2*(y-prev); prev=y; return {w:x,stack:s,net:x*s*sf}; });
  return {steps,gross:best,net:best*sf,util:best/(Math.PI*R*R)};
}

function design(p){
  const out={inp:p,steps:[],warn:[],checks:[]}; const S=(n,title,formula,result,note)=>out.steps.push({n,title,formula,result,note});
  const kVA=p.kVA,f=p.freq; const sq3=Math.sqrt(3);
  const lvDelta=p.lvConn==='D', hvDelta=p.hvConn==='D';
  const Vlv=lvDelta?p.lvV:p.lvV/sq3, Vhv=hvDelta?p.hvV:p.hvV/sq3;
  const cls=hvClass(p.hvV/1000);
  const mLV=MAT[p.lvMat], mHV=MAT[p.hvMat];
  const T=p.refTemp; const rho=(m)=>m.rho20*(m.k+T)/(m.k+20);
  // Step 1-3
  const vtEst=p.k*Math.sqrt(kVA);
  S(1,'Volts / turn (estimate)','V/T = k × √kVA = '+p.k+' × √'+kVA, r1(vtEst,3)+' V');
  const Nlv=p.lvTurns||Math.max(1,Math.round(Vlv/vtEst));
  S(2,'LV turns / phase','N = V_LV,ph ÷ V/T = '+r1(Vlv,2)+' ÷ '+r1(vtEst,3), Nlv+' turns', p.lvTurns?'Fixed by user':'Rounded to integer');
  const vt=Vlv/Nlv;
  S(3,'Revised volts / turn','V/T = '+r1(Vlv,2)+' ÷ '+Nlv, r1(vt,4)+' V');
  // Step 4-6 core
  const Areq=vt/(4.44*f*p.B*1e-6);
  S(4,'Net core area required','A = V/T ÷ (4.44 × f × B × 10⁻⁶) = '+r1(vt,4)+' ÷ (4.44 × '+f+' × '+p.B+' × 10⁻⁶)', Math.round(Areq)+' mm²');
  let D=p.coreDia||Math.floor(Math.sqrt(4*Areq/(Math.PI*0.92))*0.97), core;
  const nSteps=(d)=>p.coreSteps||(d<120?6:d<180?8:d<250?10:d<350?12:14);
  if(p.coreDia){ core=stepCore(D,nSteps(D),p.sf); }
  else { for(let g=0;g<400;g++){ core=stepCore(D,nSteps(D),p.sf); if(core.net>=Areq) break; D++; } }
  const Anet=core.net, Bact=vt/(4.44*f*Anet*1e-6);
  S(5,'Gross core area / core factor','Gross = Net ÷ core factor = '+Math.round(Areq)+' ÷ '+r1(core.net/(Math.PI*D*D/4),3), Math.round(Areq/(core.net/(Math.PI*D*D/4)))+' mm²','Core factor = stacking × step utilisation');
  S(6,'Core diameter','D = √(Gross ÷ π/4), then stepped with '+core.steps.length+' steps', D+' mm','Net area obtained '+Math.round(Anet)+' mm² → B = '+r1(Bact,3)+' T');
  out.core={D,steps:core.steps,Anet,gross:core.gross,util:core.util,B:Bact};
  if(Bact>1.70) out.warn.push('Flux density '+r1(Bact,3)+' T is above 1.70 T — expect high no-load loss and noise.');
  // ---- window
  const Hw=p.window||Math.round(D*(p.lvMat==='Al'?4.6:3.2)/5)*5;
  out.window=Hw;
  const hvEnd=p.hvEnd||cls.hvEnd, lvEnd=p.lvEnd||Math.max(30,hvEnd-30);
  // ====== LV ======
  const Ilv=kVA*1000/(3*Vlv);
  S(7,'LV voltage / phase',(lvDelta?'Delta: V_ph = V_L':'Star: V_ph = V_L ÷ √3')+' = '+p.lvV+(lvDelta?'':' ÷ √3'), r1(Vlv,2)+' V');
  S(8,'LV current / phase','I = kVA ÷ (3 × V_ph) = '+kVA+'000 ÷ (3 × '+r1(Vlv,2)+')', r1(Ilv,2)+' A');
  const lvLayers=p.lvLayers||2; const tpl=Nlv/lvLayers;
  S(9,'LV turns / phase','From step 2',Nlv+' turns');
  S(10,'LV number of layers','Chosen (even layers preferred)',lvLayers+' layers');
  S(11,'LV turns / layer',Nlv+' ÷ '+lvLayers, r1(tpl,2));
  const insLV=p.lvIns; const Areqlv=Ilv/p.Jlv;
  const transp=p.lvTransp!=null?p.lvTransp:30;
  let best=null;
  const tryCfg=(a,r)=>{ const Lw=Hw-2*lvEnd-(r>1?transp:0); const bi=Lw/((tpl+1)*a); const b=Math.floor((bi-insLV)*10)/10;
    const per=Areqlv/(a*r); let h=Math.round(((per+cornerRed(per/b))/b)*10)/10; if(h<0.8) h=0.8;
    return {a,r,Lw,bi:b+insLV,b,h,hi:h+insLV,per}; };
  if(p.lvAx&&p.lvRad){ best=tryCfg(p.lvAx,p.lvRad); }
  else { const hmax=p.lvMat==='Al'?6.0:5.0; const cands=[];
    for(let r=1;r<=6;r++) for(let a=1;a<=24;a++){ const c=tryCfg(a,r); if(c.b<4||c.b>16||c.h<1.2||c.h>hmax) continue; cands.push(c);} 
    cands.sort((x,y)=>(x.a*x.r-y.a*y.r)||(x.h-y.h)); best=cands[0]; if(!best){ best=tryCfg(4,2); out.noStrip=true; } }
  const L=best; const crl=cornerRed(L.h); const lvCs=(L.b*L.h-crl)*L.a*L.r; const Jlv=Ilv/lvCs;
  S(12,'LV parallel conductors','Area = I ÷ J = '+r1(Ilv,2)+' ÷ '+p.Jlv+' = '+r1(Areqlv,1)+' mm²; '+L.a+' axial × '+L.r+' radial', r1(Areqlv/(L.a*L.r),2)+' mm² / conductor');
  S(13,'LV conductor breadth','Winding length = '+Hw+' − 2×'+lvEnd+(L.r>1?' − '+transp+' transposition':'')+' = '+Math.round(L.Lw)+'; bi = '+Math.round(L.Lw)+' ÷ {('+r1(tpl,2)+' + 1) × '+L.a+'}', 'b = '+L.b+' mm, bi = '+r1(L.bi,2)+' mm');
  S(14,'LV conductor height','h = (area + corner) ÷ b', 'h = '+L.h+' mm, hi = '+r1(L.hi,2)+' mm');
  S(15,'LV total cross section','{(b × h) − corner} × parallels = {('+L.b+' × '+L.h+') − '+crl+'} × '+(L.a*L.r), r1(lvCs,2)+' mm²');
  S(16,'LV current density',r1(Ilv,2)+' ÷ '+r1(lvCs,2), r1(Jlv,3)+' A/mm²');
  const lvVlayer=vt*2*2*tpl; const lvIL=Math.max(p.lvMinIns,lvVlayer/p.Eb-insLV);
  const lvDucts=p.lvDucts!=null?p.lvDucts:Math.floor(lvLayers/2); const lvDuctT=p.lvDuctT||ductByLen(L.Lw);
  S(17,'LV inter-layer insulation','V/T × 2 × 2 × turns/layer ÷ '+p.Eb+' − '+insLV+' = '+r1(lvVlayer/p.Eb-insLV,3), r1(lvIL,2)+' mm', lvDucts+' axial air duct(s) of '+lvDuctT+' mm');
  const lvRad=L.hi*L.r*lvLayers+lvDucts*lvDuctT+lvIL*Math.max(0,lvLayers-1-lvDucts)+p.lvTol*lvLayers;
  const lvRadR=Math.ceil(lvRad*2)/2;
  S(18,'LV radial thickness','hi × radial × layers + ducts + insulation + tolerance = '+r1(L.hi,2)+'×'+L.r+'×'+lvLayers+' + '+lvDucts+'×'+lvDuctT+' + '+r1(lvIL*Math.max(0,lvLayers-1-lvDucts),2)+' + '+p.lvTol+'×'+lvLayers, lvRadR+' mm');
  const lvID=D+2*p.coreLV, lvOD=lvID+2*lvRadR, lvLMT=Math.PI*(lvID+lvOD)/2/1000;
  S(19,'LV mean turn','ID = '+D+' + 2×'+p.coreLV+' = '+lvID+'; OD = '+lvID+' + 2×'+lvRadR+' = '+lvOD, r1(lvLMT,4)+' m');
  const lvLen=lvLMT*Nlv; const lvWire=lvLMT*L.a*L.r*Nlv*3*(1+L.a*L.r/100);
  S(20,'LV wire length','LMT × parallels × turns × 3 limbs × (1 + parallels/100)', Math.round(lvWire)+' m');
  const Rlv=rho(mLV)*lvLen/lvCs; const Rlv20=Rlv*(mLV.k+20)/(mLV.k+T);
  S(21,'LV resistance / phase','R = ρ'+T+' × LMT × N ÷ A = '+r1(rho(mLV),5)+' × '+r1(lvLMT,4)+' × '+Nlv+' ÷ '+r1(lvCs,2), (Rlv*1000).toFixed(4)+' mΩ @'+T+'°C; '+(Rlv20*1000).toFixed(4)+' mΩ @20°C');
  const lvBare=lvLMT*Nlv*lvCs*3*mLV.dens*1e-3; const lvIns=lvBare*(1+((L.bi*L.hi-L.b*L.h)/(L.b*L.h))*1.85/mLV.dens); const lvProc=lvIns*(1+L.a*L.r/100);
  S(22,'LV conductor weight','Bare = LMT × N × A × 3 × ρ; insulated & procurement', r1(lvBare,1)+' / '+r1(lvIns,1)+' / '+r1(lvProc,1)+' kg','Bare / insulated / procurement');
  const coefLV=Math.sqrt(Math.PI*f*4*Math.PI*1e-7/(rho(mLV)*1e-6))/1000; // per mm
  const fillLV=Math.min(1,(L.b*L.a*Math.ceil(tpl))/L.Lw); const mR=L.r*lvLayers;
  const lvStray=100*((mR*mR-0.2)/9)*Math.pow(Math.sqrt(fillLV)*coefLV*L.h,4);
  S(23,'LV stray (eddy) loss','[√fill × '+r1(coefLV*10,4)+' × h/10]⁴ × (m² − 0.2)/9; m = '+mR+', fill = '+r1(fillLV,3), r1(lvStray,3)+' %');
  const lvI2R=3*Ilv*Ilv*Rlv; const lvLL=lvI2R*(1+lvStray/100);
  S(24,'LV load loss','3 × I² × R × (1 + stray) = 3 × '+r1(Ilv,2)+'² × '+(Rlv*1000).toFixed(4)+'e-3 × '+r1(1+lvStray/100,4), Math.round(lvLL)+' W');
  const lvSurf=0.75*2*(lvDucts+1); const lvGrad=lvLL/(3*lvSurf*p.hdInner*(L.Lw/1000*lvLMT))*(p.riseCal1||1);
  S(25,'LV winding gradient','Loss ÷ {3 × '+lvSurf+' surfaces × '+p.hdInner+' × ('+r1(L.Lw/1000,3)+' × '+r1(lvLMT,4)+')}', r1(lvGrad,1)+' °C');
  const lvWound=(tpl+1)*L.a*L.bi+(L.r>1?transp:0);
  out.lv={V:Vlv,I:Ilv,N:Nlv,layers:lvLayers,tpl,a:L.a,r:L.r,b:L.b,h:L.h,bi:L.bi,hi:L.hi,cs:lvCs,J:Jlv,ins:insLV,IL:lvIL,ducts:lvDucts,ductT:lvDuctT,
    rad:lvRadR,ID:lvID,OD:lvOD,LMT:lvLMT,wire:lvWire,R:Rlv,R20:Rlv20,bare:lvBare,insW:lvIns,proc:lvProc,stray:lvStray,LL:lvLL,grad:lvGrad,Lw:L.Lw,wound:lvWound,end:lvEnd,transp:L.r>1?transp:0,surf:lvSurf,mat:mLV};
  // ====== HV ======
  const Ihv=kVA*1000/(3*Vhv);
  S(26,'HV voltage / phase',(hvDelta?'Delta: V_ph = V_L':'Star: V_ph = V_L ÷ √3'), r1(Vhv,1)+' V');
  S(27,'HV current / phase',kVA+'000 ÷ (3 × '+r1(Vhv,1)+')', r1(Ihv,3)+' A');
  const Vmax=Vhv*(1+p.tapPlus/100), Vmin=Vhv*(1-p.tapMinus/100);
  const Nn=Math.round(Vhv/vt), Nmax=Math.round(Vmax/vt), Nmin=Math.round(Vmin/vt);
  const nTaps=p.tapStep>0?Math.round((p.tapPlus+p.tapMinus)/p.tapStep)+1:1;
  const tapTurns=[]; if(p.tapStep>0){ for(let x=p.tapPlus;x>=-p.tapMinus-1e-9;x-=p.tapStep) tapTurns.push({pct:r1(x,2),N:Math.round(Vhv*(1+x/100)/vt)}); } else tapTurns.push({pct:0,N:Nn});
  const coils=p.hvCoils||(cls.um<=3.6?1:cls.um<=12?6:cls.um<=24?8:10);
  const tpc=Math.ceil(Nmax/coils); const coilGap=p.hvCoilGap;
  const hvLw=Hw-2*hvEnd; const coilLen=(hvLw-(coils-1)*coilGap)/coils;
  const Ahv=Ihv/p.Jhv; let cond=p.hvCond; if(cond==='auto') cond=Ahv<=10?'round':'strip';
  let H={};
  if(cond==='round'){ let d=Math.ceil(Math.sqrt(4*Ahv/Math.PI)*10)/10; const ins=p.hvInsRound; H={type:'round',d,di:d+ins,ax:d+ins,radb:d,radi:d+ins,cs:Math.PI*d*d/4,ins,np:1,desc:'Ø '+d.toFixed(2)+' mm bare / Ø '+(d+ins).toFixed(2)+' ins.'}; }
  else { const np=Ahv>70?2:1; const A1=Ahv/np; let w=Math.min(12.5,Math.max(4,Math.round(Math.sqrt(6*A1)))); let t=Math.ceil(((A1+cornerRed(A1/w))/w)*20)/20; if(t>5){t=5;}
    const ins=p.hvInsStrip; const cs=(w*t-cornerRed(t))*np; H={type:'strip',w,t,ax:(w+ins)*np,radb:t,radi:t+ins,cs,ins,np,desc:w+' × '+t.toFixed(2)+' mm'+(np>1?' ('+np+' axial)':'')}; }
  const hvTpl=Math.max(1,Math.floor(coilLen/H.ax)-1); const hvLayers=Math.ceil(tpc/hvTpl);
  S(28,'HV turns / phase','N = V_ph × (1 + tap) ÷ V/T', Nmax+' (max) / '+Nn+' (normal) / '+Nmin+' (min)', coils+(coils>1?' coils × ':' coil × ')+tpc+' turns; coil length = ('+hvLw+' − '+(coils-1)+'×'+coilGap+') ÷ '+coils+' = '+r1(coilLen,1)+' mm; '+hvTpl+' turns/layer, '+hvLayers+' layers');
  S(29,'HV conductor area','I ÷ J = '+r1(Ihv,3)+' ÷ '+p.Jhv, r1(Ahv,3)+' mm²');
  S(30,'HV conductor size',cond==='round'?'d = √(A ÷ π/4)':'strip, width ≈ √(6A)', H.desc);
  const Jn=Ihv/H.cs, Imin=kVA*1000/(3*Vmin), Jmin=Imin/H.cs;
  S(31,'HV current density','I ÷ A = '+r1(Ihv,3)+' ÷ '+r1(H.cs,3), r1(Jn,3)+' (normal) / '+r1(Jmin,3)+' A/mm² (lowest tap)');
  const hvVlayer=vt*2*2*hvTpl; const hvIL=Math.max(p.hvMinIns,Math.ceil((hvVlayer/p.Eb-H.ins)*100)/100);
  S(32,'HV inter-layer insulation','V/T × 2 × 2 × '+hvTpl+' ÷ '+p.Eb+' − '+H.ins+' = '+r1(hvVlayer/p.Eb-H.ins,3), r1(hvIL,2)+' mm');
  const hvDucts=p.hvDucts!=null?p.hvDucts:Math.floor(hvLayers/4); const hvDuctT=p.hvDuctT;
  const hvRad=Math.ceil((H.radi*hvLayers+hvIL*(hvLayers-1-hvDucts>0?hvLayers-1-hvDucts:0)+hvDucts*hvDuctT+p.hvTol*hvLayers)*2)/2;
  S(33,'HV radial thickness','hi × layers + insulation + ducts + tolerance = '+r1(H.radi,2)+'×'+hvLayers+' + '+r1(hvIL,2)+'×'+Math.max(0,hvLayers-1-hvDucts)+' + '+hvDucts+'×'+hvDuctT+' + '+p.hvTol+'×'+hvLayers, hvRad+' mm');
  const gap=p.lvhvGap||cls.gap; const hvID=lvOD+2*gap, hvOD=hvID+2*hvRad; const hvLMT=Math.PI*(hvID+hvOD)/2/1000;
  const phase=p.phaseGap||cls.phase; const CD=Math.ceil((hvOD+phase)/5)*5;
  S(34,'HV mean turn','ID = '+lvOD+' + 2×'+gap+' = '+hvID+'; OD = '+hvID+' + 2×'+hvRad+' = '+hvOD, r1(hvLMT,4)+' m','Leg centres = '+hvOD+' + '+phase+' → '+CD+' mm');
  const hvWire=hvLMT*H.np*Nmax*3*(1+H.np/100);
  S(35,'HV wire length','LMT × parallels × N_max × 3 × tolerance', Math.round(hvWire)+' m');
  const Rhv=rho(mHV)*hvLMT*Nn/H.cs, Rhv20=Rhv*(mHV.k+20)/(mHV.k+T); const RhvMin=rho(mHV)*hvLMT*Nmin/H.cs;
  S(36,'HV resistance / phase','ρ × LMT × N_normal ÷ A = '+r1(rho(mHV),5)+' × '+r1(hvLMT,4)+' × '+Nn+' ÷ '+r1(H.cs,3), r1(Rhv,4)+' Ω @'+T+'°C; '+r1(Rhv20,4)+' Ω @20°C');
  const hvBare=hvLMT*Nmax*H.cs*3*mHV.dens*1e-3;
  const insRatio=H.type==='round'?((H.di**2-H.d**2)/(H.d**2)):(((H.w+H.ins)*(H.t+H.ins)-H.w*H.t)/(H.w*H.t));
  const hvInsW=hvBare*(1+insRatio*1.85/mHV.dens); const hvProc=hvInsW*(1+H.np/100);
  S(37,'HV conductor weight','Bare / insulated / procurement', r1(hvBare,1)+' / '+r1(hvInsW,1)+' / '+r1(hvProc,1)+' kg');
  const coefHV=Math.sqrt(Math.PI*f*4*Math.PI*1e-7/(rho(mHV)*1e-6))/1000*(H.type==='round'?0.83:1);
  const hvAxBare=H.type==='round'?H.d:H.w*H.np; const fillHV=Math.min(1,hvAxBare*hvTpl*coils/hvLw);
  const hvStray=100*((hvLayers*hvLayers-0.2)/9)*Math.pow(Math.sqrt(fillHV)*coefHV*H.radb,4);
  S(38,'HV stray (eddy) loss','[√fill × '+r1(coefHV*10,4)+' × h/10]⁴ × (m² − 0.2)/9; m = '+hvLayers+', fill = '+r1(fillHV,3), r1(hvStray,3)+' %');
  const hvLL=3*Ihv*Ihv*Rhv*(1+hvStray/100), hvLLmin=3*Imin*Imin*RhvMin*(1+hvStray/100);
  S(39,'HV load loss','3 × I² × R × (1 + stray)', Math.round(hvLL)+' W (normal) / '+Math.round(hvLLmin)+' W (lowest tap)');
  const hvSurf=p.hvSurf||(1.0+0.75+1.5*hvDucts+(coils>1?1.5:0)); const hvGrad=hvLLmin/(3*hvSurf*p.hdOuter*(hvLw/1000*hvLMT))*(p.riseCal2||1);
  S(40,'HV winding gradient','Loss ÷ {3 × '+hvSurf+' surfaces × '+p.hdOuter+' × ('+r1(hvLw/1000,3)+' × '+r1(hvLMT,4)+')}', r1(hvGrad,1)+' °C');
  const hvWound=coils*(hvTpl+1)*H.ax+(coils-1)*coilGap;
  out.hv={V:Vhv,I:Ihv,Imin,Nn,Nmax,Nmin,taps:tapTurns,nTaps,coils,tpc,coilLen,tpl:hvTpl,layers:hvLayers,cond:H,J:Jn,Jmin,IL:hvIL,ducts:hvDucts,ductT:hvDuctT,rad:hvRad,ID:hvID,OD:hvOD,
    LMT:hvLMT,wire:hvWire,R:Rhv,R20:Rhv20,bare:hvBare,insW:hvInsW,proc:hvProc,stray:hvStray,LL:hvLL,LLmin:hvLLmin,grad:hvGrad,Lw:hvLw,wound:hvWound,end:hvEnd,gap,phase,CD,coilGap,surf:hvSurf,mat:mHV};
  // ====== Core weight & loss ======
  const coreLen=2*D+3*Hw+4*CD; const coreW=coreLen*Anet*7.65e-6;
  S(41,'Core weight','Length = 2D + 3L + 4A = 2×'+D+' + 3×'+Hw+' + 4×'+CD+' = '+coreLen+' mm; W = L × A_net × 7.65', Math.round(coreW)+' kg');
  const sl=interp(CORE_GRADES[p.grade].pts,Bact)*STD.fLoss(f); const bf=buildFactor(D,p.joint); const NLL=coreW*sl*bf;
  S(42,'No-load (core) loss','W × specific loss × build factor = '+Math.round(coreW)+' × '+r1(sl,3)+' × '+bf, Math.round(NLL)+' W',p.grade+' @ '+r1(Bact,3)+' T');
  // ====== Impedance ======
  const AT=Ilv*Nlv; const hMean=(lvWound+hvWound)/2; const g=gap, b1=lvRadR, b2=hvRad; const delta=g+b1+b2;
  const x=Math.PI*hMean/delta; const kr=1-(1-Math.exp(-x))/x; const Ls=hMean/kr;
  const Dg=lvOD+g, D1=(lvID+lvOD)/2, D2=(hvID+hvOD)/2; const sumATD=(Dg*g+(D1*b1+D2*b2)/3)/100; // cm²
  const ex=1.24e-3*(f/50)*AT*sumATD/(vt*Ls/10);
  const LLtot=lvLL+hvLL, LLmin=lvLL*1+hvLLmin; const er=LLtot/(kVA*10); const ek=Math.sqrt(ex*ex+er*er);
  S(43,'Impedance','ex = 1.24×10⁻³ × (f/50) × AT × ΣD·a ÷ (V/T × Ls); AT = '+Math.round(AT)+', Ls = '+r1(hMean/10,2)+' ÷ '+r1(kr,3)+' = '+r1(Ls/10,2)+' cm, ΣD·a = '+r1(sumATD,2)+' cm²', 'ex = '+r1(ex,3)+' %, er = '+r1(er,3)+' %, ez = '+r1(ek,3)+' %');
  if(p.zTarget){ const dz=(ek-p.zTarget)/p.zTarget*100; if(Math.abs(dz)>10) out.warn.push('Impedance '+r1(ek,2)+' % is '+r1(dz,1)+' % from the '+p.zTarget+' % target (IS 2026 tolerance ±10 %). Adjust window height, k or LV–HV gap.'); }
  // ====== Enclosure & weights ======
  const yoke=Math.round(D/5)*5; const activeL=2*CD+hvOD, activeB=hvOD, activeH=2*yoke+Hw;
  const eL=Math.ceil((activeL+2*p.enclClr)/10)*10, eB=Math.ceil((activeB+2*p.enclClr)/10)*10, eH=Math.ceil((p.bottomClr+activeH+p.enclClr)/10)*10;
  S(44,'Enclosure size','L = '+p.enclClr+' + 2×'+CD+' + '+hvOD+' + '+p.enclClr+'; B = '+p.enclClr+' + '+hvOD+' + '+p.enclClr+'; H = '+p.bottomClr+' + '+yoke+' + '+Hw+' + '+yoke+' + '+p.enclClr, eL+' × '+eB+' × '+eH+' mm');
  const clamps=coreW*0.10, insMisc=(lvBare+hvBare)*0.08+coreW*0.02; const active=coreW+lvIns+hvInsW+clamps+insMisc; const encl=p.enclosure?active*0.22:0; const total=active+encl;
  S(45,'Weights','Active part = core + conductors + clamps + insulation; enclosure ≈ 22 % of active part', Math.round(active)+' kg active, '+Math.round(total)+' kg total');
  out.imp={AT,hMean,kr,Ls,sumATD,ex,er,ek,delta};
  out.core.len=coreLen; out.core.W=coreW; out.core.sl=sl; out.core.bf=bf; out.core.NLL=NLL; out.core.CD=CD; out.core.yoke=yoke;
  out.loss={NLL,LL:LLtot,LLmin,total:NLL+LLtot,eff100:100*kVA*1000/(kVA*1000+NLL+LLtot),eff50:100*kVA*500/(kVA*500+NLL+0.25*LLtot)};
  out.dims={activeL,activeB,activeH,eL,eB,eH};
  out.wts={core:coreW,lv:lvIns,hv:hvInsW,clamps,insMisc,active,encl,total};
  out.cls=cls; out.rise=CLASS_RISE[p.insClass];
  const riseLimW=out.rise*STD.altitudeFactor(p.altitude); if(lvGrad>riseLimW) out.warn.push('LV gradient '+r1(lvGrad,1)+' °C exceeds the limit of '+r1(riseLimW,1)+' K. Add an LV duct or lower LV current density.');
  if(hvGrad>riseLimW) out.warn.push('HV gradient '+r1(hvGrad,1)+' °C exceeds the limit of '+r1(riseLimW,1)+' K.');
  // ====== Phase 2: ratio tolerance, no-load current, short circuit, noise, cost, checks ======
  const vrR=Vhv/Vlv, rerr=(vrR-Nn/Nlv)/vrR*100, ratioLim=STD.ratioLimit(ek);
  const vakg=rcLookup(RC.VAKG.B,RC.VAKG.v,Bact,'lin')*STD.fVA(f); const vacm=(11.823*Bact**3-44.891*Bact**2+61.585*Bact-29.304)*STD.fVA(f);
  const vaCore=coreW*vakg*(p.vaBuild||1.3), vaJoint=6*vacm*Anet/100*(p.joint==='step'?0.5:1); const VA=vaCore+vaJoint; const I0=VA/(kVA*1000)*100;
  const riseLim=out.rise*STD.altitudeFactor(p.altitude);
  const faultUsed=p.faultMVA!=null?p.faultMVA:STD.sysMVA(cls.um); out.faultUsed=faultUsed;
  const scRes=STD.shortCircuit({kVA,ek,er,ex,faultMVA:faultUsed,t:p.scTime||2,amb:p.amb??40,insClass:p.insClass,perim_m:Math.PI*Dg/1000,h_m:Ls/1000,span_mm:delta},
    [{name:'LV (inner)',I:Ilv,N:Nlv,cs:lvCs,mat:p.lvMat,rise:lvGrad,outer:false,stressLim:p.lvMat==='Cu'?(p.stressCu||80):(p.stressAl||35)},
     {name:'HV (outer)',I:Ihv,N:Nn,cs:H.cs,mat:p.hvMat,rise:hvGrad,outer:true,stressLim:p.hvMat==='Cu'?(p.stressCu||80):(p.stressAl||35)}]);
  const noise=STD.noise(p.noiseA??22,p.noiseB??35,coreW,Bact);
  const pr=p.price||{core:270,Cu:900,Al:440,steel:200,ins:500,others:15};
  const costRows=[['Core '+p.grade,coreW,pr.core],['LV conductor ('+p.lvMat+')',lvIns,pr[p.lvMat]],['HV conductor ('+p.hvMat+')',hvInsW,pr[p.hvMat]],['Clamps and steel (est.)',clamps,pr.steel],['Insulation, leads, resin (est.)',insMisc,pr.ins]];
  const matCost=costRows.reduce((a,r)=>a+r[1]*r[2],0), costOthers=matCost*pr.others/100;
  const loss50=NLL+0.25*LLtot;
  out.ratio={err:rerr,lim:ratioLim}; out.nl={vakg,vacm,vaCore,vaJoint,VA,I0}; out.sc=scRes; out.noise=noise; out.riseLim=riseLim;
  out.cost={rows:costRows,mat:matCost,others:costOthers,total:matCost+costOthers}; out.loss.total50=loss50;
  S(46,'Ratio error','(V ratio − N ratio) ÷ V ratio; limit = lower of 0.5 % and Z/10 (IEC 60076-1)', r1(rerr,3)+' % (limit '+r1(ratioLim,3)+' %)');
  S(47,'No-load current','core mass × VA/kg × '+(p.vaBuild||1.3)+' + 6 joints × VA/cm² × area', r1(VA,0)+' VA = '+r1(I0,3)+' %');
  S(48,'Short circuit','I_sc = I × 100 ÷ (Z + Z_system), system '+(faultUsed?faultUsed+' MVA'+(p.faultMVA==null?' (IS 2026-5 Table 2 default)':''):'infinite')+'; θ₁ per IEC 60076-5 after '+(p.scTime||2)+' s', scRes.windings.map(w=>w.name+' '+r1(w.th1,0)+' °C').join(', '));
  const chk=(name,req,got,ok)=>out.checks.push({name,req,got,ok});
  if(p.zTarget){ const tol=STD.zTol(p.zTarget); chk('Impedance','target '+p.zTarget+' % ± '+tol+' %',r1(ek,2)+' %',Math.abs(ek-p.zTarget)/p.zTarget*100<=tol); }
  chk('Turns-ratio error (IEC 60076-1)','≤ '+r1(ratioLim,3)+' %',r1(rerr,3)+' %',Math.abs(rerr)<=ratioLim+1e-9);
  chk('LV / HV winding rise','≤ '+r1(riseLim,1)+' K (class '+p.insClass+(riseLim<out.rise?', altitude '+p.altitude+' m':'')+')',r1(lvGrad,1)+' / '+r1(hvGrad,1)+' K',Math.max(lvGrad,hvGrad)<=riseLim);
  chk('Flux density','≤ 1.70 T',r1(Bact,3)+' T',Bact<=1.70);
  const jmx=(m)=>m==='Cu'?3.0:1.8; chk('Current density LV / HV (lowest tap)','≤ '+jmx(p.lvMat)+' / '+jmx(p.hvMat)+' A/mm²',r1(Jlv,2)+' / '+r1(Jmin,2),Jlv<=jmx(p.lvMat)&&Jmin<=jmx(p.hvMat));
  for(const w of scRes.windings) chk('Short-circuit thermal, '+w.name,'≤ '+w.lim+' °C after '+scRes.t+' s (IEC 60076-5)',r1(w.th1,0)+' °C',w.thermalOk);
  chk('Short-circuit hoop stress, HV (tensile)','≤ '+scRes.windings[1].stressLim+' MPa (0.9 × Rp0.2)',r1(scRes.windings[1].sigma,1)+' MPa',scRes.windings[1].stressOk);
  { const wi=scRes.windings[0]; const cLim=STD.compLimit(wi.stressLim,p.bonded); const sEq=wi.sigma*(lvLayers>=3?1.1:1);
    chk('Short-circuit hoop stress, LV (compressive)','≤ '+r1(cLim,1)+' MPa ('+(p.bonded?'0.6':'0.35')+' × Rp0.2, IS 2026-5 Annex A)',r1(sEq,1)+' MPa',sEq<=cLim); }
  { const zMin=STD.zMin(kVA); if(ek<zMin) out.warn.push('Impedance '+r1(ek,2)+' % is below the IEC 60076-5 recognised minimum of '+zMin+' %: short-circuit withstand is subject to agreement with the purchaser.'); }
  if(p.maxLoss50) chk('Total loss at 50 % load (IS 1180 / customer)','≤ '+p.maxLoss50+' W',Math.round(loss50)+' W',loss50<=p.maxLoss50);
  if(p.maxLoss100) chk('Total loss at 100 % load (IS 1180 / customer)','≤ '+p.maxLoss100+' W',Math.round(NLL+LLtot)+' W',NLL+LLtot<=p.maxLoss100);
  if(p.noiseMax) chk('Noise (estimate)','≤ '+p.noiseMax+' dB',r1(noise,1)+' dB',noise<=p.noiseMax);
  for(const c of out.checks) if(!c.ok&&!/Impedance|rise/.test(c.name)) out.warn.push(c.name+': required '+c.req+', obtained '+c.got+'.');
  if(p.hvV>=3600) out.warn.push('Um ≥ 3.6 kV: partial discharge test ≤ 10 pC applies (IEC 60076-11).');
  const jmax=(m)=>m==='Cu'?3.0:1.8;
  if(Jlv>jmax(p.lvMat)) out.warn.push('LV current density '+r1(Jlv,2)+' A/mm² is high for '+mLV.name+'.');
  if(Jmin>jmax(p.hvMat)) out.warn.push('HV current density at lowest tap '+r1(Jmin,2)+' A/mm² is high for '+mHV.name+'.');
  if(L.b<4||L.b>16) out.warn.push('LV strip breadth '+L.b+' mm is outside the normal 4–16 mm range. Change layers or parallels.');
  if(hvWound>hvLw+1) out.warn.push('HV coils need '+Math.round(hvWound)+' mm but only '+hvLw+' mm is available.');
  return out;
}

function designAuto(p){
  const base=design({...p,window:p.window||null});
  const D=base.core.D, rise=base.riseLim;
  const wins=p.window?[p.window]:(()=>{const a=[];for(let w=Math.round(D*2.2/5)*5;w<=Math.round(D*6.5/5)*5;w+=10)a.push(w);return a;})();
  const layerOpts=p.lvLayers?[p.lvLayers]:[2,4,3,6];
  const target=p.zTarget||null;
  let best=null,bestScore=Infinity;
  for(const w of wins) for(const L of layerOpts){
    let q={...p,window:w,lvLayers:L}; let o=null;
    const lvD=p.lvDucts!=null?[p.lvDucts]:Array.from({length:L},(_,i)=>i);
    for(const d of lvD){ o=design({...q,lvDucts:d}); if(o.lv.grad<=rise-5) { q.lvDucts=d; break; } q.lvDucts=d; }
    const hvD=p.hvDucts!=null?[p.hvDucts]:[0,1,2,3,4];
    for(const d of hvD){ o=design({...q,hvDucts:d}); if(o.hv.grad<=rise-5||d===hvD[hvD.length-1]) { q.hvDucts=d; break; } }
    let sc=0;
    if(o.noStrip) sc+=100;
    if(o.lv.b<4||o.lv.b>16) sc+=50;
    if(o.hv.wound>o.hv.Lw+1) sc+=50;
    if(o.lv.grad>rise) sc+=20+(o.lv.grad-rise); if(o.hv.grad>rise) sc+=20+(o.hv.grad-rise);
    sc+= target? 10*Math.abs(o.imp.ek-target)/target : 0;
    if(Math.abs(o.ratio.err)>o.ratio.lim) sc+=5;
    sc+= (q.lvDucts+q.hvDucts)*0.15 + (L-2)*0.1 + w/D*0.02 + o.loss.total/(p.kVA*1000)*5;
    if(sc<bestScore){bestScore=sc;best=o;}
  }
  best.auto={window:!p.window,layers:!p.lvLayers,lvDucts:p.lvDucts==null,hvDucts:p.hvDucts==null};
  return best;
}
const DEFAULTS={kVA:500,hvV:11000,lvV:415,hvConn:'D',lvConn:'Y',freq:50,lvMat:'Cu',hvMat:'Cu',insClass:'F',k:0.56,B:1.64,Jlv:2.0,Jhv:2.4,
  tapPlus:2.5,tapMinus:7.5,tapStep:2.5,grade:'M4-0.27',joint:'mitred',refTemp:75,zTarget:5,sf:0.97,
  window:650,lvEnd:110,hvEnd:140,lvLayers:2,lvAx:4,lvRad:2,lvTransp:30,lvIns:0.3,lvMinIns:0.1,lvTol:0.3,lvDucts:1,lvDuctT:10,coreLV:10,
  hvCoils:6,hvCoilGap:12,hvCond:'round',hvInsRound:0.2,hvInsStrip:0.44,hvMinIns:0.05,hvTol:0,hvDucts:0,hvDuctT:12,lvhvGap:31,phaseGap:31,
  Eb:10000,hdInner:6,hdOuter:8,enclClr:200,bottomClr:100,enclosure:true};
if(typeof module!=='undefined') module.exports={design,designAuto,DEFAULTS};
