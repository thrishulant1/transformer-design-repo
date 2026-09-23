// ===== Shared standards helpers (used by both engines) =====
const APP_VERSION='1.2.0 (23 Sep 2026)';
const STD={};
// Resistivity at 20 °C (Ω·mm²/m) and temperature constant: Cu 100 % IACS, EC aluminium 61 % IACS
STD.RHO={Cu:{r20:0.017241,k:234.5},Al:{r20:0.028264,k:225}};
STD.sigmaStd=(mat,T)=>{ const s=STD.RHO[mat]; return 1/(s.r20*(s.k+T)/(s.k+20)); }; // m/(Ω·mm²)
// IEC 60076-11 reference temperature for losses by insulation system class
STD.REF_TEMP={A:75,E:95,B:100,F:120,H:145};
// IEC 60076-11 average winding temperature-rise limits (K)
STD.RISE={A:60,E:75,B:80,F:100,H:125};
// IEC 60076-11: AN cooling above 1000 m — rise limit reduced 2.5 % per 500 m (or part)
STD.altitudeFactor=(alt)=> (alt&&alt>1000)?(1-0.025*Math.ceil((alt-1000)/500)):1;
// IEC 60076-1 ratio tolerance: the lower of ±0.5 % and ±1/10 of the actual impedance (%)
STD.ratioLimit=(ek)=>Math.min(0.5,ek/10);
// IEC 60076-1 test tolerances
STD.TOL={total:10,component:15,i0:30,zLow:10,zHigh:7.5};
STD.zTol=(z)=>z<10?STD.TOL.zLow:STD.TOL.zHigh;
// IEC 60076-5 Table 3, dry type: max average winding temperature after short circuit (°C)
STD.SC_LIMIT={A:{Cu:180,Al:180},E:{Cu:250,Al:200},B:{Cu:350,Al:200},F:{Cu:350,Al:200},H:{Cu:350,Al:200}};
// IEC 60076-5 thermal: θ1 = θ0 + 2(θ0+k)/(C/(J²t) − 1), C = 106000 (Cu) / 45700 (Al)
STD.scTemp=(mat,theta0,J,t)=>{ const C=mat==='Cu'?106000:45700, k=mat==='Cu'?235:225; const d=C/(J*J*t)-1; return d<=0?Infinity:theta0+2*(theta0+k)/d; };
// Short-circuit withstand for a two-winding transformer.
// c: {kVA, ek, er, ex, faultMVA, t, amb, insClass, perim_m (mean gap perimeter), h_m (Ls), span_mm}
// w: [{name, I, N, cs, mat, rise, outer, stressLim}]
STD.shortCircuit=(c,ws)=>{
  const zs=c.faultMVA?c.kVA/(c.faultMVA*1000)*100:0; const mult=100/(c.ek+zs);
  const xr=Math.min(14,c.ex/Math.max(c.er,1e-6)); const phi=Math.atan(xr);
  const kpk=Math.SQRT2*(1+Math.exp(-(phi+Math.PI/2)/xr)*Math.sin(phi));
  const mu0=4*Math.PI*1e-7; const res={zs,mult,xr,kpk,t:c.t,windings:[]};
  for(const w of ws){ const Isc=w.I*mult, J=Isc/w.cs, th0=c.amb+w.rise, th1=STD.scTemp(w.mat,th0,J,c.t);
    const lim=(STD.SC_LIMIT[c.insClass]||STD.SC_LIMIT.H)[w.mat];
    const ATpk=w.N*Isc*kpk; const Fr=mu0*ATpk*ATpk*c.perim_m/(2*c.h_m); // N, whole winding
    const sigma=Fr/(2*Math.PI*w.N*w.cs); // MPa (N/mm²), circular-equivalent hoop stress
    const Fa=Fr*c.span_mm/(2*c.h_m*1000); // N, axial compression estimate
    res.windings.push({name:w.name,Isc,J,th0,th1,lim,thermalOk:th1<=lim,ATpk,Fr,sigma,Fa,stressLim:w.stressLim,stressOk:sigma<=w.stressLim,outer:w.outer}); }
  return res;
};
// IEC 60076-5 / IS 2026-5 Table 1: recognised minimum short-circuit impedance (%) for two-winding transformers
STD.zMin=(kVA)=>kVA<=630?4.0:kVA<=1250?5.0:kVA<=2500?6.0:kVA<=6300?7.0:kVA<=25000?8.0:kVA<=40000?10.0:kVA<=63000?11.0:12.5;
// IS 2026-5 Table 2: system short-circuit power (MVA) to use when the purchaser does not specify it (European practice)
STD.sysMVA=(umKV)=>umKV<=1.1?null:umKV<=24?500:umKV<=36?1000:3000;
// IS 2026-5 Annex A guidance: hoop tensile ≤ 0.9·Rp0.2; hoop compressive ≤ 0.35·Rp0.2 (regular strands) or 0.6·Rp0.2 (resin-bonded).
// Layer windings with 3+ layers use 1.1 × the mean value as the equivalent compressive stress.
STD.compLimit=(tensileLim,bonded)=>tensileLim/0.9*(bonded?0.6:0.35);
// Sound pressure estimate (dB(A)): Lp = A + 10·log10(core mass) + Bk·(B − 1.4). Calibrate A with a measured unit.
STD.noise=(A,Bk,mass,B)=>A+10*Math.log10(Math.max(mass,1))+Bk*(B-1.4);
// Core loss at other frequencies (same B): P ∝ f^1.5 (approximate); magnetising VA ∝ f
STD.fLoss=(f)=>Math.pow(f/50,1.5); STD.fVA=(f)=>f/50;
// Harmonic loading (IEEE C57.110 style): winding eddy loss × K, other stray × K^0.8 (approximate)
STD.kEddy=(K)=>K||1; STD.kOther=(K)=>Math.pow(K||1,0.8);
