// ================= Extras shared by both modules =================
// Each module registers an adapter: EXTRAS.register('rect'|'round', {...}). See ui-rect.js and page.html.
const EXTRAS={mods:{},register(k,a){ this.mods[k]=a; }};

// ---------- Company name and logo (kept in this browser, used on every PDF) ----------
const COMPANY_KEY='companySettings.v1';
function companyGet(){ try{ return JSON.parse(localStorage.getItem(COMPANY_KEY)||'{}'); }catch(e){ return {}; } }
function companySet(c){ try{ localStorage.setItem(COMPANY_KEY,JSON.stringify(c)); }catch(e){ toast('This browser blocked saving the company settings.'); } companyShow(); }
function companyShow(){ const c=companyGet(); document.querySelectorAll('[data-company="name"]').forEach(el=>{ if(document.activeElement!==el) el.value=c.name||''; });
  document.querySelectorAll('[data-company-status]').forEach(el=>el.textContent=c.logo?'Logo set':'No logo'); }
function bindCompany(){ document.querySelectorAll('[data-company="name"]').forEach(el=>el.addEventListener('change',()=>companySet({...companyGet(),name:el.value.trim()})));
  document.querySelectorAll('[data-company="logo"]').forEach(el=>el.addEventListener('change',()=>{ const f=el.files[0]; if(!f) return;
    if(f.size>600000){ toast('Please use a logo under 600 kB (PNG or JPG).'); el.value=''; return; }
    const rd=new FileReader(); rd.onload=()=>{ companySet({...companyGet(),logo:rd.result}); toast('Logo saved. It will appear on the PDFs.'); }; rd.readAsDataURL(f); el.value=''; }));
  document.querySelectorAll('[data-company="clear"]').forEach(el=>el.addEventListener('click',()=>{ const c=companyGet(); delete c.logo; companySet(c); toast('Logo removed.'); }));
  companyShow(); }
// Draw the logo (fitted into w × h mm) and/or company name at (x, y) on a jsPDF page
function pdfBrand(d,x,y,w,h){ const c=companyGet(); let used=0;
  if(c.logo){ try{ const fmt=c.logo.startsWith('data:image/png')?'PNG':'JPEG'; const p=d.getImageProperties(c.logo); const k=Math.min(w/p.width,h/p.height); d.addImage(c.logo,fmt,x+w-p.width*k,y,p.width*k,p.height*k); used=1; }catch(e){} }
  if(c.name){ d.setFont('helvetica','bold'); d.setFontSize(9); d.setTextColor(23,33,43); d.text(pdfText(c.name),x+w-(used?w+2:0),y+4,{align:'right'}); }
}

// ---------- "More downloads" menu ----------
function moreAction(mod,act){ const A=EXTRAS.mods[mod]; if(!A||!A.ready()){ toast(A&&A.errMsg?A.errMsg():'Calculate a design first.'); return; }
  if(act==='plate') ratingPlatePdf(A); else if(act==='cert') testCertPdf(A); else if(act==='dxf') dxfDownload(A); else if(act==='cad') cadParamsDownload(A); }
function bindMore(){ document.querySelectorAll('[data-more]').forEach(b=>b.addEventListener('click',()=>{ const det=b.closest('details'); if(det) det.open=false; if(b.dataset.more!=='gtp') moreAction(b.dataset.mod,b.dataset.more); }));
  document.addEventListener('click',e=>{ document.querySelectorAll('details.more[open]').forEach(d=>{ if(!d.contains(e.target)) d.open=false; }); }); }

// ---------- Rating plate (IEC 60076-11 clause 9 data), A5 landscape ----------
function ratingPlatePdf(A){ const {jsPDF}=window.jspdf; const d=new jsPDF({orientation:'landscape',unit:'mm',format:'a5'}); const g=A.gtpData(), x=A.plateExtra(), c=companyGet(); const ink=[23,33,43];
  d.setDrawColor(...ink); d.setLineWidth(0.8); d.roundedRect(8,8,194,132,3,3); d.setLineWidth(0.3); d.roundedRect(11,11,188,126,2,2);
  for(const [cx,cy] of [[16,16],[194,16],[16,132],[194,132]]) d.circle(cx,cy,1.6);
  pdfBrand(d,120,14,74,12); d.setTextColor(...ink); d.setFont('helvetica','bold'); d.setFontSize(12); d.text(pdfText(x.title),22,20);
  d.setFont('helvetica','normal'); d.setFontSize(7.5); d.text(pdfText(g.std),22,25);
  const rows=[['Serial no.','','Year of manufacture',''],['Rated power',g.kVA+' kVA','Frequency / phases',g.freq+' Hz / 3'],
    ['Rated voltage '+g.w2.name,g.w2.V+' V','Rated current '+g.w2.name,(Math.round(g.w2.I*100)/100)+' A'],['Rated voltage '+g.w1.name,g.w1.V+' V','Rated current '+g.w1.name,(Math.round(g.w1.I*100)/100)+' A'],
    ['Vector group',g.vg,'Impedance at '+g.T+' °C',(Math.round(g.Z*100)/100)+' %'],['Cooling',g.cooling,'Insulation class',g.insClass],
    ['Temperature rise',Math.round(g.riseLim)+' K','Insulation level',g.testV],['Total mass',Math.round(g.mTot)+' kg','E / C / F class',x.ecf||'—'],
    ['Altitude',x.altitude,'Tapping',g.taps]];
  d.autoTable({theme:'grid',startY:30,margin:{left:18,right:18},styles:{fontSize:8,cellPadding:1.3,lineColor:[120,130,140],lineWidth:0.2,textColor:ink},
    columnStyles:{0:{fontStyle:'bold',cellWidth:38},2:{fontStyle:'bold',cellWidth:38}},body:rows.map(r=>r.map(pdfText))});
  if(x.taps&&x.taps.length){ d.autoTable({theme:'grid',startY:d.lastAutoTable.finalY+2,margin:{left:18,right:18},styles:{fontSize:7,cellPadding:0.8,halign:'center',lineColor:[120,130,140],lineWidth:0.2,textColor:ink},headStyles:{fillColor:[235,238,241],textColor:ink},
    head:[['Tap position',...x.taps.map(t=>t[0])]],body:[['HV voltage, V',...x.taps.map(t=>t[1])]]}); }
  d.setFontSize(6); d.setTextColor(90); d.text(pdfText('Rating plate data per IEC 60076-11 clause 9 / IS 11171. Check against the customer specification before engraving. Tool '+APP_VERSION),18,134);
  saveFile(A.fileName('pdf').replace(/\.pdf$/,'_RatingPlate.pdf'),d.output('blob')); }

// ---------- Routine test certificate, A4 portrait ----------
function testCertPdf(A){ const {jsPDF}=window.jspdf; const d=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const g=A.gtpData(), m=A.meta(), S=A.gtSummary(), st=A.gtState(); const ink=[23,33,43];
  const rows=gtRows(S,st).rows; const measured=rows.filter(r=>r.meas!=null&&r.meas!=='').length;
  if(!measured) toast('No measured values yet. Enter FAT results in the Guarantees and tests tab; the certificate is made with blank results.');
  pdfBrand(d,120,10,80,14); d.setTextColor(...ink); d.setFont('helvetica','bold'); d.setFontSize(14); d.text('Routine test certificate',10,17);
  d.setFont('helvetica','normal'); d.setFontSize(8.5);
  const info=[['Customer',m.party||''],['Work order',m.wo||''],['Serial no.',''],['Date of test',''],['Rating',g.kVA+' kVA, '+g.w2.V+' / '+g.w1.V+' V, '+g.vg],['Type',g.type],['Standard',g.std],['Design revision',(m.rev||'R0')+'  (tool '+APP_VERSION+')']];
  d.autoTable({theme:'plain',startY:24,margin:{left:10,right:10},styles:{fontSize:8.5,cellPadding:0.9,textColor:ink},columnStyles:{0:{fontStyle:'bold',cellWidth:32}},body:info.map(r=>r.map(pdfText))});
  const res=k=>{ const r=rows.find(x=>x.k===k); return r&&r.result?r.result:''; };
  const tests=[['1','Insulation resistance before and after dielectric tests','> 100 MΩ @ 500 V DC',''],['2','Winding resistance ('+g.w1.name+' and '+g.w2.name+')','Deviation from design ≤ 5 %',res('R1')&&res('R2')?(res('R1')==='Pass'&&res('R2')==='Pass'?'Pass':'Fail'):''],
    ['3','Voltage ratio and vector group check',g.vg+', ratio within IEC tolerance',res('ratio')],['4','No-load loss and current at rated voltage','Guarantee + tolerance',res('NLL')&&res('I0')?(res('NLL')==='Pass'&&res('I0')==='Pass'?'Pass':'Fail'):''],
    ['5','Load loss and impedance at rated current',g.T+' °C, guarantee + tolerance',res('LL')&&res('Z')?(res('LL')==='Pass'&&res('Z')==='Pass'?'Pass':'Fail'):''],
    ['6','Separate-source AC withstand (applied voltage)',g.testV.split('/')[0].trim()+', 60 s',''],['7','Induced AC withstand','2 × rated voltage, 120 × rated frequency / f s',''],
    ...(A.pdRequired()?[['8','Partial discharge measurement','≤ 10 pC (IEC 60076-11)','']]:[])];
  d.setFont('helvetica','bold'); d.setFontSize(10); d.text('Routine tests',10,d.lastAutoTable.finalY+7);
  d.autoTable({theme:'grid',startY:d.lastAutoTable.finalY+9,margin:{left:10,right:10},styles:{fontSize:8,cellPadding:1.1,lineColor:[150,160,170],lineWidth:0.15,textColor:ink},headStyles:{fillColor:[228,233,238],textColor:ink},
    head:[['#','Test','Requirement','Result']],body:tests.map(r=>r.map(pdfText)),columnStyles:{0:{cellWidth:8},3:{cellWidth:20,fontStyle:'bold'}},
    didParseCell:h=>{ if(h.section==='body'&&h.column.index===3) h.cell.styles.textColor=h.cell.raw==='Pass'?[46,125,79]:(h.cell.raw==='Fail'?[178,58,46]:ink); }});
  d.setFont('helvetica','bold'); d.setFontSize(10); d.text('Measured values against guarantees',10,d.lastAutoTable.finalY+7);
  d.autoTable({theme:'grid',startY:d.lastAutoTable.finalY+9,margin:{left:10,right:10},styles:{fontSize:7.8,cellPadding:1,lineColor:[150,160,170],lineWidth:0.15,textColor:ink},headStyles:{fillColor:[228,233,238],textColor:ink},
    head:[['Item','Guaranteed','Limit (IEC 60076-1)','Measured','Result']],body:rows.map(r=>[r.item,r.noG?'—':String(r.g),r.max,r.meas==null?'':String(r.meas),r.result]).map(r=>r.map(pdfText)),
    didParseCell:h=>{ if(h.section==='body'&&h.column.index===4) h.cell.styles.textColor=h.cell.raw==='Pass'?[46,125,79]:[178,58,46]; }});
  const y=Math.min(d.lastAutoTable.finalY+18,272); d.setFont('helvetica','normal'); d.setFontSize(8); d.setTextColor(90);
  ['Tested by','Checked by','Witnessed by (customer)'].forEach((t,i)=>{ const x=12+i*63; d.line(x,y,x+55,y); d.text(t,x,y+4); });
  d.setFontSize(6); d.text(pdfText('Results 6 and 7 are recorded by the test engineer. Generated '+new Date().toLocaleString('en-GB')),10,290);
  saveFile(A.fileName('pdf').replace(/\.pdf$/,'_TestCertificate.pdf'),d.output('blob')); }

// ---------- DXF export (AutoCAD R12 text format, millimetres, layers CORE / INNER / OUTER / DIM / TEXT) ----------
function svgToDxf(svg){ const doc=new DOMParser().parseFromString(svg,'image/svg+xml'); const root=doc.documentElement; const vb=root.getAttribute('viewBox').split(/\s+/).map(Number); const H=vb[3];
  const out=[]; const e=(...a)=>{ for(const x of a) out.push(String(x)); }; const Y=y=>(H-y);
  const layerOf=(el)=>{ const f=(el.getAttribute('fill')||'').toUpperCase(), s=(el.getAttribute('stroke')||'').toUpperCase();
    if(f==='#D4A23A'||s==='#8A6412') return 'INNER'; if(f==='#B06038'||s==='#6E3417') return 'OUTER'; if(f==='#A9B3BD'||s==='#56616C') return 'CORE'; return 'DIM'; };
  const line=(L,x1,y1,x2,y2)=>e(0,'LINE',8,L,10,x1.toFixed(3),20,Y(y1).toFixed(3),30,0,11,x2.toFixed(3),21,Y(y2).toFixed(3),31,0);
  const arc=(L,cx,cy,r,a0,a1)=>e(0,'ARC',8,L,10,cx.toFixed(3),20,Y(cy).toFixed(3),30,0,40,r.toFixed(3),50,a0,51,a1);
  for(const el of root.querySelectorAll('rect,line,circle,path,text')){ const t=el.tagName.toLowerCase(), L=layerOf(el), n=a=>parseFloat(el.getAttribute(a)||0);
    if(t==='rect'){ const x=n('x'),y=n('y'),w=n('width'),h=n('height'); let r=Math.min(n('rx'),w/2,h/2); if(w<=0||h<=0) continue;
      if(r>0.01){ line(L,x+r,y,x+w-r,y); line(L,x+w,y+r,x+w,y+h-r); line(L,x+w-r,y+h,x+r,y+h); line(L,x,y+h-r,x,y+r);
        arc(L,x+w-r,y+r,r,0,90); arc(L,x+r,y+r,r,90,180); arc(L,x+r,y+h-r,r,180,270); arc(L,x+w-r,y+h-r,r,270,360); }
      else { line(L,x,y,x+w,y); line(L,x+w,y,x+w,y+h); line(L,x+w,y+h,x,y+h); line(L,x,y+h,x,y); } }
    else if(t==='line') line(L,n('x1'),n('y1'),n('x2'),n('y2'));
    else if(t==='circle') e(0,'CIRCLE',8,L,10,n('cx').toFixed(3),20,Y(n('cy')).toFixed(3),30,0,40,n('r').toFixed(3));
    else if(t==='path'){ const tok=(el.getAttribute('d')||'').match(/[MLZ]|-?\d*\.?\d+(?:e-?\d+)?/gi)||[]; let cur=null,start=null,cmd='M';
      for(let i=0;i<tok.length;){ const k=tok[i]; if(/[MLZ]/i.test(k)){ cmd=k.toUpperCase(); i++; if(cmd==='Z'){ if(cur&&start) line(L,cur[0],cur[1],start[0],start[1]); cur=start; } continue; }
        const p=[parseFloat(tok[i]),parseFloat(tok[i+1])]; i+=2; if(cmd==='M'){ cur=p; start=p; cmd='L'; } else { line(L,cur[0],cur[1],p[0],p[1]); cur=p; } } }
    else if(t==='text'){ const x=n('x'),y=n('y'),fs=n('font-size')||10, anc=el.getAttribute('text-anchor')||'start'; const tr=el.getAttribute('transform')||''; const rot=/rotate\((-?[\d.]+)/.exec(tr); const ang=rot?-parseFloat(rot[1]):0;
      const s=(el.textContent||'').replace(/[^\x20-\x7E]/g,c=>({'Ø':'%%c','×':'x','°':'%%d','²':'2','–':'-','—':'-'}[c]||'')); if(!s.trim()) continue; const hj=anc==='middle'?1:(anc==='end'?2:0);
      e(0,'TEXT',8,'TEXT',10,x.toFixed(3),20,Y(y).toFixed(3),30,0,40,(fs*0.72).toFixed(3),1,s,50,ang); if(hj) e(72,hj,11,x.toFixed(3),21,Y(y).toFixed(3),31,0); } }
  const layers=[['CORE',8],['INNER',2],['OUTER',30],['DIM',7],['TEXT',7]];
  const head=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$INSUNITS','70','4','9','$EXTMIN','10','0','20','0','9','$EXTMAX','10',String(vb[2]),'20',String(H),'0','ENDSEC',
    '0','SECTION','2','TABLES','0','TABLE','2','LAYER','70',String(layers.length),...layers.flatMap(([n,c])=>['0','LAYER','2',n,'70','0','62',String(c),'6','CONTINUOUS']),'0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES'];
  return head.concat(out,['0','ENDSEC','0','EOF']).join('\r\n'); }
function dxfDownload(A){ const dxf=svgToDxf(A.drawing(true)); saveFile(A.fileName('dxf'),new Blob([dxf],{type:'application/dxf'})); toast('DXF saved: layers CORE, INNER, OUTER, DIM and TEXT, in millimetres.'); }
// Named dimensions for a CAD design table (SOLIDWORKS / FreeCAD)
function cadParamsDownload(A){ const rows=A.cadParams(); const ws=XLSX.utils.aoa_to_sheet([['Name','Value','Unit','Description'],...rows]); ws['!cols']=[{wch:26},{wch:12},{wch:6},{wch:48}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Parameters'); saveFile(A.fileName('xlsx').replace(/\.xlsx$/,'_CAD.xlsx'),new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})])); }

// ---------- Compare two saved designs (uses the key results stored when each design was saved) ----------
function compareRender(boxSel,names,getSnap){ const box=document.querySelector(boxSel); if(names.length<2){ box.innerHTML='<p class="hint">Save at least two designs to compare them.</p>'; return; }
  const e=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const opt=sel=>names.map(n=>'<option'+(n===sel?' selected':'')+'>'+e(n)+'</option>').join('');
  box.innerHTML='<div class="saverow two"><select data-cmp="a" aria-label="First design">'+opt(names[0])+'</select><select data-cmp="b" aria-label="Second design">'+opt(names[1])+'</select></div><div class="cmpout"></div>';
  const draw=()=>{ const a=getSnap(box.querySelector('[data-cmp="a"]').value), b=getSnap(box.querySelector('[data-cmp="b"]').value); const out=box.querySelector('.cmpout');
    if(!a||!b||!a.sum||!b.sum){ out.innerHTML='<p class="hint">One of these was saved before comparison existed. Load it and save it again to compare.</p>'; return; }
    const mb=new Map(b.sum.map(r=>[r[0],r])); const fmt=v=>typeof v==='number'?(Math.abs(v)>=100?Math.round(v).toLocaleString('en-IN'):(+v.toFixed(3)).toString()):String(v);
    out.innerHTML='<div class="tblwrap"><table class="cmp"><tr><th>Quantity</th><th>A</th><th>B</th><th>B − A</th></tr>'+a.sum.map(r=>{ const q=mb.get(r[0]); if(!q) return ''; const dv=(typeof r[1]==='number'&&typeof q[1]==='number')?q[1]-r[1]:null;
      const pct=dv!=null&&r[1]?dv/Math.abs(r[1])*100:null; const hi=pct!=null&&Math.abs(pct)>=1;
      return '<tr'+(hi?' class="diff"':'')+'><td>'+e(r[0])+(r[2]?' ('+e(r[2])+')':'')+'</td><td>'+fmt(r[1])+'</td><td>'+fmt(q[1])+'</td><td>'+(dv==null?(String(r[1])===String(q[1])?'':'differs'):(dv===0?'':(dv>0?'+':'')+fmt(dv)+(pct!=null?' ('+(pct>0?'+':'')+pct.toFixed(1)+' %)':'')))+'</td></tr>'; }).join('')+
      '</table></div><p class="hint">Highlighted rows differ by 1 % or more. Values are as saved; A saved '+new Date(a.at).toLocaleDateString('en-GB')+' ('+e(a.ver||'older tool')+'), B saved '+new Date(b.at).toLocaleDateString('en-GB')+' ('+e(b.ver||'older tool')+').</p>'; };
  box.querySelectorAll('[data-cmp]').forEach(s=>s.addEventListener('change',draw)); draw(); }

// ---------- Rating range: design a list of ratings with the current requirement ----------
async function runBatch(A,listText,boxSel){ const box=document.querySelector(boxSel);
  const list=[...new Set(String(listText).split(/[\s,;]+/).map(Number).filter(v=>v>0&&v<=100000))].sort((a,b)=>a-b);
  if(!list.length){ toast('Enter ratings in kVA, for example 25, 63, 100, 160, 250.'); return; } if(list.length>20){ toast('Please enter at most 20 ratings at a time.'); return; }
  const base=A.batchTemplate(); if(!base){ toast('Fix the highlighted inputs first.'); return; }
  const rows=[]; const head=A.batchHead(); const e=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const paint=(msg)=>{ box.innerHTML='<details open><summary>Rating range — '+e(msg)+'</summary><div class="tblwrap"><table><tr>'+head.map(h=>'<th>'+e(h)+'</th>').join('')+'</tr>'+rows.map(r=>'<tr>'+r.map((c,i)=>'<td class="'+(i===r.length-1&&/fail/.test(c)?'bad':'')+'">'+e(c)+'</td>').join('')+'</tr>').join('')+'</table></div>'+
    (rows.length===list.length?'<div class="saverow one"><button type="button" class="btn sm primary" data-batchx>Download this table (Excel)</button></div><p class="hint">Each rating was designed automatically with the current requirement (voltages, material, limits, prices). Rating-specific values such as a load-loss target are not applied. Open a rating by entering its kVA in the form.</p>':'')+'</details>';
    const bx=box.querySelector('[data-batchx]'); if(bx) bx.addEventListener('click',()=>{ const ws=XLSX.utils.aoa_to_sheet([head,...rows.map(r=>r.map(c=>{ const v=String(c).replace(/[,₹\s]/g,''); return /^-?\d+(\.\d+)?$/.test(v)?+v:c; }))]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Rating range');
      saveFile(A.fileName('xlsx').replace(/_\d+kVA_/,'_RANGE_'+list[0]+'-'+list[list.length-1]+'kVA_'),new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})])); }); };
  for(let i=0;i<list.length;i++){ paint('designing '+list[i]+' kVA ('+(i+1)+' of '+list.length+')…');
    try{ const o=await autoAsync(A.kind,{...base,kVA:list[i]}); rows.push(o?A.batchRow(o):[String(list[i]),'no design found']); }catch(err){ rows.push([String(list[i]),'error: '+err.message]); } }
  paint(list.length+' ratings designed'); }

// ---------- Typical starting values for a rating ----------
function typicalValues(A){ const n=A.applyTypical(); if(n) toast('Typical values filled in: '+n+'. Check them against the customer specification.'); }

function bindExtras(){ bindCompany(); bindMore();
  document.querySelectorAll('[data-batch]').forEach(b=>b.addEventListener('click',()=>{ const A=EXTRAS.mods[b.dataset.batch]; const inp=document.getElementById(b.dataset.input); runBatch(A,inp.value,b.dataset.out); }));
  document.querySelectorAll('[data-typical]').forEach(b=>b.addEventListener('click',()=>typicalValues(EXTRAS.mods[b.dataset.typical]))); }
