// ================= Engineering drawing helpers (both modules) =================
// All drawings are to scale in millimetres (1 SVG unit = 1 mm). print=true uses fixed colours for the PDF.
function drwPal(print){ return print
  ? {ink:'#17212B',sub:'#56616C',core:'#A9B3BD',coreEdge:'#56616C',lv:'#D4A23A',lvEdge:'#8A6412',hv:'#B06038',hvEdge:'#6E3417',bg:'#FFFFFF',duct:'#FFFFFF',font:'Arial, Helvetica, sans-serif'}
  : {ink:'currentColor',sub:'var(--ink2)',core:'#A9B3BD',coreEdge:'#56616C',lv:'#D4A23A',lvEdge:'#8A6412',hv:'#B06038',hvEdge:'#6E3417',bg:'var(--panel)',duct:'var(--panel)',font:'Barlow, Arial, sans-serif'}; }
const DRW={
  n:(x)=>Math.round(x*100)/100,
  f:(x)=>{ const r=Math.round(x*10)/10; return (Math.abs(r-Math.round(r))<0.05?Math.round(r):r).toString(); },
  rect:(x,y,w,h,fill,stroke,sw,extra)=>'<rect x="'+DRW.n(x)+'" y="'+DRW.n(y)+'" width="'+DRW.n(Math.max(0,w))+'" height="'+DRW.n(Math.max(0,h))+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'" stroke-width="'+sw+'"':'')+(extra||'')+'/>',
  line:(x1,y1,x2,y2,c,sw,extra)=>'<line x1="'+DRW.n(x1)+'" y1="'+DRW.n(y1)+'" x2="'+DRW.n(x2)+'" y2="'+DRW.n(y2)+'" stroke="'+c+'" stroke-width="'+sw+'"'+(extra||'')+'/>',
  text:(x,y,t,P,fs,opt)=>{ opt=opt||{}; return '<text x="'+DRW.n(x)+'" y="'+DRW.n(y)+'" font-size="'+DRW.n(fs)+'" fill="'+(opt.fill||P.ink)+'" text-anchor="'+(opt.anchor||'middle')+'"'+(opt.weight?' font-weight="'+opt.weight+'"':'')+(opt.rot?' transform="rotate('+opt.rot+' '+DRW.n(x)+' '+DRW.n(y)+')"':'')+'>'+String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text>'; },
  arrow:(x,y,dir,P,s)=>{ // dir: 'l','r','u','d' — the tip is at (x,y)
    const a=s, b=s*0.35; const pts={l:[[x,y],[x+a,y-b],[x+a,y+b]],r:[[x,y],[x-a,y-b],[x-a,y+b]],u:[[x,y],[x-b,y+a],[x+b,y+a]],d:[[x,y],[x-b,y-a],[x+b,y-a]]}[dir];
    return '<path d="M'+pts.map(p=>DRW.n(p[0])+' '+DRW.n(p[1])).join(' L')+' Z" fill="'+P.ink+'"/>'; },
  // Horizontal dimension between x1 and x2 at height y; extension lines drop to e1/e2 (y of the feature)
  dimH:(x1,x2,y,label,P,fs,e1,e2)=>{ const s=fs*0.55, sw=fs*0.06; let o='';
    if(e1!=null) o+=DRW.line(x1,e1,x1,y+(y>e1?s*0.6:-s*0.6),P.sub,sw*0.8); if(e2!=null) o+=DRW.line(x2,e2,x2,y+(y>e2?s*0.6:-s*0.6),P.sub,sw*0.8);
    const wide=Math.abs(x2-x1)>s*2.4;
    o+=DRW.line(x1,y,x2,y,P.ink,sw)+(wide?DRW.arrow(x1,y,'l',P,s)+DRW.arrow(x2,y,'r',P,s):DRW.arrow(x1,y,'r',P,s)+DRW.arrow(x2,y,'l',P,s));
    return o+DRW.text((x1+x2)/2,y-fs*0.3,label,P,fs); },
  dimV:(y1,y2,x,label,P,fs,e1,e2,side)=>{ const s=fs*0.55, sw=fs*0.06; let o='';
    if(e1!=null) o+=DRW.line(e1,y1,x+(x>e1?s*0.6:-s*0.6),y1,P.sub,sw*0.8); if(e2!=null) o+=DRW.line(e2,y2,x+(x>e2?s*0.6:-s*0.6),y2,P.sub,sw*0.8);
    const tall=Math.abs(y2-y1)>s*2.4;
    o+=DRW.line(x,y1,x,y2,P.ink,sw)+(tall?DRW.arrow(x,y1,'u',P,s)+DRW.arrow(x,y2,'d',P,s):DRW.arrow(x,y1,'d',P,s)+DRW.arrow(x,y2,'u',P,s));
    const tx=side==='right'?x+fs*0.95:x-fs*0.4; return o+DRW.text(tx,(y1+y2)/2,label,P,fs,{rot:-90}); },
  // Winding band split into layers with radial ducts (all radial positions measured from left edge x, width w)
  // Winding band divided into layers with radial ducts. Layers run across w (vertical=false) or across h (vertical=true).
  band:(x,y,w,h,layers,ducts,ductW,fill,edge,P,sw,vertical)=>{ let o=DRW.rect(x,y,w,h,fill,edge,sw);
    const span=vertical?h:w, start=vertical?y:x; const cond=Math.max(0,span-ducts*ductW); const perLayer=cond/Math.max(1,layers); const groups=ducts+1;
    let pos=start, li=0;
    for(let g=0;g<groups;g++){ const n=g===groups-1?layers-li:Math.min(Math.max(1,Math.round(layers/groups)),layers-li);
      for(let k=0;k<n;k++){ pos+=perLayer; li++; if(li<layers&&k<n-1) o+=vertical?DRW.line(x,pos,x+w,pos,edge,sw*0.45,' opacity=".8"'):DRW.line(pos,y,pos,y+h,edge,sw*0.45,' opacity=".8"'); }
      if(g<groups-1){ o+=vertical?DRW.rect(x,pos,w,ductW,P.duct,edge,sw*0.5,' stroke-dasharray="'+DRW.n(sw*3)+' '+DRW.n(sw*2)+'"'):DRW.rect(pos,y,ductW,h,P.duct,edge,sw*0.5,' stroke-dasharray="'+DRW.n(sw*3)+' '+DRW.n(sw*2)+'"'); pos+=ductW; } }
    return o; },
  svgOpen:(W,H,P,fs,label)=>'<svg viewBox="0 0 '+DRW.n(W)+' '+DRW.n(H)+'" width="'+DRW.n(W)+'" height="'+DRW.n(H)+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+label+'" font-family="'+P.font+'" style="color:'+(P.ink==='currentColor'?'var(--ink)':P.ink)+'">'
};
// SVG string → PNG data URL (for the PDF). Resolves null if the browser cannot rasterise it.
function svgToPng(svg,pxWidth){ return new Promise(res=>{ try{
  const m=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); const w=+m[1], h=+m[2]; const W=pxWidth||2400, H=Math.round(W*h/w);
  const img=new Image(); img.onload=()=>{ try{ const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.drawImage(img,0,0,W,H); res({url:c.toDataURL('image/png'),w,h}); }catch(e){ res(null); } };
  img.onerror=()=>res(null); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }catch(e){ res(null); } }); }
// Add a full-page drawing to the PDF (landscape A4); keeps aspect ratio inside the page frame
function pdfDrawingPage(d,png,title,notes){ d.addPage(); d.setTextColor(23,33,43); d.setFont('helvetica','bold'); d.setFontSize(11); d.text(title,8,12);
  const x0=8,y0=16,W=281,H=(notes&&notes.length?170:182); if(png){ const k=Math.min(W/png.w,H/png.h); const w=png.w*k, h=png.h*k; d.addImage(png.url,'PNG',x0+(W-w)/2,y0,w,h); }
  else { d.setFont('helvetica','normal'); d.setFontSize(9); d.text('The drawing could not be rendered in this browser.',x0,y0+10); }
  if(notes&&notes.length){ d.setFont('helvetica','normal'); d.setFontSize(7); d.setTextColor(86,97,108); notes.forEach((t,i)=>d.text(pdfText(t),x0,y0+H+5+i*3.6)); } }

// ISO 7200-style title block appended below a print drawing (used on the PDF drawing page and in the DXF).
// meta: {title, desc, dwg, rev, by, chk, appr, date, company, tool}
function addTitleBlock(svg,meta){ const m=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); if(!m) return svg; const W=+m[1], H=+m[2];
  const fs=Math.max(10,W/80), ink='#17212B', sub='#56616C', rowH=fs*2.1, bw=Math.min(W-fs*2,fs*56), x0=W-bw-fs*0.8, y0=H+fs*0.8, sw=fs*0.07;
  const cols=[0.42,0.2,0.2,0.18].map(f=>f*bw); const cx=[x0,x0+cols[0],x0+cols[0]+cols[1],x0+cols[0]+cols[1]+cols[2]];
  const esc=s=>String(s==null||s===''?'—':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const cell=(ci,span,row,label,val,big)=>{ const x=cx[ci], w=cols.slice(ci,ci+span).reduce((a,b)=>a+b,0), y=y0+row*rowH;
    return '<rect x="'+DRW.n(x)+'" y="'+DRW.n(y)+'" width="'+DRW.n(w)+'" height="'+DRW.n(rowH)+'" fill="none" stroke="'+ink+'" stroke-width="'+DRW.n(sw)+'"/>'+
      '<text x="'+DRW.n(x+fs*0.3)+'" y="'+DRW.n(y+fs*0.72)+'" font-size="'+DRW.n(fs*0.55)+'" fill="'+sub+'">'+esc(label)+'</text>'+
      '<text x="'+DRW.n(x+fs*0.3)+'" y="'+DRW.n(y+rowH-fs*0.45)+'" font-size="'+DRW.n(fs*(big?0.95:0.78))+'" fill="'+ink+'"'+(big?' font-weight="600"':'')+'>'+esc(val)+'</text>'; };
  let b='<rect x="'+DRW.n(x0)+'" y="'+DRW.n(y0)+'" width="'+DRW.n(bw)+'" height="'+DRW.n(rowH*4)+'" fill="none" stroke="'+ink+'" stroke-width="'+DRW.n(sw*2.2)+'"/>';
  b+=cell(0,2,0,'Title',meta.title,true)+cell(2,1,0,'Drawing no.',meta.dwg)+cell(3,1,0,'Revision',meta.rev||'R0');
  b+=cell(0,2,1,'Description',meta.desc)+cell(2,1,1,'Scale','Scaled to fit; DXF 1:1')+cell(3,1,1,'Units','mm');
  b+=cell(0,1,2,'Designed',meta.by)+cell(1,1,2,'Checked',meta.chk)+cell(2,1,2,'Approved',meta.appr)+cell(3,1,2,'Date',meta.date);
  b+=cell(0,2,3,'Company',meta.company)+cell(2,1,3,'Sheet','1 of 1')+cell(3,1,3,'Tool',meta.tool);
  const H2=y0+rowH*4+fs*0.8; return svg.replace(/viewBox="0 0 [\d.]+ [\d.]+"/,'viewBox="0 0 '+W+' '+DRW.n(H2)+'"').replace(/ height="[\d.]+"/,' height="'+DRW.n(H2)+'"').replace(/<\/svg>\s*$/,b+'</svg>'); }
function titleMeta(kind,m,desc){ const c=(typeof companyGet==='function')?companyGet():{}; return {title:'General arrangement, '+(kind==='rect'?'rectangular core':'round core'),desc,dwg:m.dwg,rev:m.rev,by:m.by,chk:m.chk,appr:m.appr,
  date:new Date().toLocaleDateString('en-GB'),company:c.name||'',tool:APP_VERSION.split(' ')[0]}; }
