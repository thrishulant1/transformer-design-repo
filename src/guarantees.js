// ================= Guarantees and FAT test comparison (shared by both modules) =================
// S = calculated summary: {NLL, LL, Z, I0, ratio, R1, R2, T, rise1, rise2, noise, mat1, mat2, names:[inner,outer], riseLim, noiseMax, zTarget, zWindow:[lo,hi]|null}
// st = {margin, g:{NLL,LL,total,Z,I0}, m:{NLL,LL,Z,I0,ratio,R1,R2,Tm,rise1,rise2,noise}}
function gtDefaults(){ return {margin:5,g:{},m:{Tm:25}}; }
const gtCeil5=x=>Math.ceil(x/5)*5;
const gtNum=v=>(v===''||v==null||isNaN(v))?null:Number(v);
function gtGuar(S,st){ const k=1+(gtNum(st.margin)??5)/100; const g=st.g||{};
  const NLL=gtNum(g.NLL)??gtCeil5(S.NLL*k), LL=gtNum(g.LL)??gtCeil5(S.LL*k);
  return {NLL,LL,total:gtNum(g.total)??(NLL+LL),Z:gtNum(g.Z)??(S.zTarget||Math.round(S.Z*100)/100),I0:gtNum(g.I0)??Math.ceil(S.I0*k*10)/10,
    auto:{NLL:gtNum(g.NLL)==null,LL:gtNum(g.LL)==null,total:gtNum(g.total)==null,Z:gtNum(g.Z)==null,I0:gtNum(g.I0)==null}}; }
function gtRows(S,st){
  const G=gtGuar(S,st), m=st.m||{}, T=STD.TOL; const f=(x,n=0)=>x==null||isNaN(x)?'':Number(x).toFixed(n);
  const res=(ok)=>ok==null?'':(ok?'Pass':'Fail'); const rows=[];
  const mN=gtNum(m.NLL), mL=gtNum(m.LL), mTot=(mN!=null&&mL!=null)?mN+mL:null;
  const zTol=STD.zTol(G.Z); const zLo=S.zWindow?S.zWindow[0]:G.Z*(1-zTol/100), zHi=S.zWindow?S.zWindow[1]:G.Z*(1+zTol/100);
  const mZ=gtNum(m.Z), mI0=gtNum(m.I0), mR=gtNum(m.ratio);
  const totOk=mTot==null?null:mTot<=G.total*(1+T.total/100);
  rows.push({k:'NLL',item:'No-load loss, W',calc:f(S.NLL),g:G.NLL,max:'≤ '+f(G.NLL*(1+T.component/100))+' (+15 %)',meas:mN,ok:mN==null?null:(mN<=G.NLL*(1+T.component/100)&&totOk!==false)});
  rows.push({k:'LL',item:'Load loss @'+S.T+' °C, W',calc:f(S.LL),g:G.LL,max:'≤ '+f(G.LL*(1+T.component/100))+' (+15 %)',meas:mL,ok:mL==null?null:(mL<=G.LL*(1+T.component/100)&&totOk!==false)});
  rows.push({k:'total',item:'Total loss, W',calc:f(S.NLL+S.LL),g:G.total,max:'≤ '+f(G.total*(1+T.total/100))+' (+10 %)',meas:mTot,ok:totOk,measRO:true});
  rows.push({k:'Z',item:'Impedance @'+S.T+' °C, %',calc:f(S.Z,2),g:G.Z,max:f(zLo,2)+' to '+f(zHi,2)+(S.zWindow?' (spec)':' (±'+zTol+' %)'),meas:mZ,ok:mZ==null?null:(mZ>=zLo-1e-9&&mZ<=zHi+1e-9)});
  rows.push({k:'I0',item:'No-load current, %',calc:f(S.I0,2),g:G.I0,max:'≤ '+f(G.I0*(1+T.i0/100),2)+' (+30 %)',meas:mI0,ok:mI0==null?null:mI0<=G.I0*(1+T.i0/100)});
  const rLim=STD.ratioLimit(mZ??S.Z); rows.push({k:'ratio',item:'Voltage ratio error, %',calc:f(S.ratio,3),g:'',max:'± '+f(rLim,3)+' (lower of 0.5 % and Z/10)',meas:mR,ok:mR==null?null:Math.abs(mR)<=rLim+1e-9,noG:true});
  const Tm=gtNum(m.Tm)??25; const corr=(R,mat)=>{ const k=STD.RHO[mat].k; return R*(k+S.T)/(k+Tm); };
  for(const [i,key] of [[0,'R1'],[1,'R2']]){ const mr=gtNum(m[key]); const rc=mr==null?null:corr(mr,i?S.mat2:S.mat1); const calc=S[key]; const dev=rc==null?null:(rc-calc)/calc*100;
    rows.push({k:key,item:'Resistance / phase, '+S.names[i]+', Ω',calc:calc.toPrecision(4),g:'',max:'measured at '+Tm+' °C → '+(rc==null?'…':rc.toPrecision(4)+' @'+S.T+' °C ('+(dev>=0?'+':'')+f(dev,1)+' %)'),meas:mr,ok:rc==null?null:Math.abs(dev)<=5,noG:true,dev,rc}); }
  for(const [i,key] of [[0,'rise1'],[1,'rise2']]){ const mr=gtNum(m[key]); rows.push({k:key,item:'Temperature rise, '+S.names[i]+', K',calc:f(S[key],1),g:'',max:'≤ '+f(S.riseLim,1),meas:mr,ok:mr==null?null:mr<=S.riseLim,noG:true}); }
  if(S.noiseMax){ const mn=gtNum(m.noise); rows.push({k:'noise',item:'Noise, dB(A)',calc:f(S.noise,1),g:'',max:'≤ '+S.noiseMax,meas:mn,ok:mn==null?null:mn<=S.noiseMax,noG:true}); }
  for(const r of rows) r.result=res(r.ok);
  return {rows,G};
}
// Calibration: measured ÷ calculated, to feed back into the design constants
function gtCal(S,st){ const out=[]; const m=st.m||{}; const {rows}=gtRows(S,st);
  const mN=gtNum(m.NLL); if(mN) out.push({key:'coreLoss',label:'Core loss factor × '+(mN/S.NLL).toFixed(3),mult:mN/S.NLL});
  for(const [i,key] of [[1,'rise1'],[2,'rise2']]){ const v=gtNum(m[key]); if(v) out.push({key:'riseCal'+i,label:'Rise calibration '+S.names[i-1]+' × '+(v/S[key]).toFixed(3),mult:v/S[key]}); }
  const rr=rows.filter(r=>(r.k==='R1'||r.k==='R2')&&r.rc); if(rr.length){ const f=rr.reduce((a,r)=>a+S[r.k]/r.rc,0)/rr.length; out.push({key:'sigma',label:'Conductivity × '+f.toFixed(3)+' (from measured resistance)',mult:f}); }
  const mn=gtNum(m.noise); if(mn) out.push({key:'noiseA',label:'Noise constant '+(mn-S.noise>=0?'+':'')+(mn-S.noise).toFixed(1)+' dB',add:mn-S.noise});
  const mz=gtNum(m.Z); if(mz) out.push({key:'z',label:'Impedance measured ÷ calculated = '+(mz/S.Z).toFixed(3)+' (adjust δ, winding length or K)',info:true});
  return out; }
function gtRender(el,S,st,onChange,onApply){
  const {rows}=gtRows(S,st); const cal=gtCal(S,st); const e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const inp=(path,val,ph,ro)=>ro?'<span class="gtro">'+(val==null?'':e(Math.round(val)))+'</span>':'<input class="gtin" data-gt="'+path+'" type="number" step="any" value="'+(val==null?'':e(val))+'" placeholder="'+e(ph||'')+'" aria-label="'+e(path)+'">';
  el.innerHTML='<h3>Guarantees</h3><p class="hint">Guarantees default to the calculated value plus a design margin. Test limits follow IEC 60076-1 / IS 2026 tolerances. Enter factory test results to check them and to calibrate the design constants.</p>'+
   '<div class="gtbar"><label><b>Design margin, %</b>'+inp('margin',st.margin,'5')+'</label><label><b>Resistance measured at, °C</b>'+inp('m.Tm',(st.m||{}).Tm,'25')+'</label></div>'+
   '<div class="tblwrap"><table><tr><th>Item</th><th>Calculated</th><th>Guaranteed</th><th>Limit at test</th><th>Measured (FAT)</th><th>Result</th></tr>'+
   rows.map(r=>'<tr><td>'+e(r.item)+'</td><td class="n">'+e(r.calc)+'</td><td>'+(r.noG?'—':inp('g.'+r.k,(st.g||{})[r.k],r.g))+'</td><td>'+e(r.max)+'</td><td>'+inp('m.'+r.k,r.measRO?r.meas:(st.m||{})[r.k],'',r.measRO)+'</td><td style="font-weight:600;color:'+(r.result==='Pass'?'#2E7D4F':'#B23A2E')+'">'+r.result+'</td></tr>').join('')+'</table></div>'+
   '<h3>Calibration from test results</h3>'+(cal.length?'<ul class="callist">'+cal.map((c,i)=>'<li>'+e(c.label)+(c.info?'':' <button type="button" class="btn sm" data-cal="'+i+'">Apply</button>')+'</li>').join('')+'</ul><p class="hint">Apply updates the matching constant in the form. Keep a note of each change and the test report it came from.</p>':'<p class="hint">Enter measured values above to get calibration factors.</p>');
  el.querySelectorAll('[data-gt]').forEach(i=>i.addEventListener('change',()=>{ const [a,b]=i.dataset.gt.split('.'); const v=i.value===''?null:Number(i.value); if(b){ st[a]=st[a]||{}; st[a][b]=v; } else st[a]=v; onChange(); }));
  el.querySelectorAll('[data-cal]').forEach(b=>b.addEventListener('click',()=>onApply(cal[+b.dataset.cal])));
}
