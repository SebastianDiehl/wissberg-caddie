(()=>{
"use strict";
const $=id=>document.getElementById(id);
// ---------- Platz ----------
const COURSES=Object.assign({rheinhessen:window.COURSE_DATA},window.COURSES||{});
const COURSE_ID=(()=>{try{const c=JSON.parse(localStorage.getItem("wb_ui_v1")||"{}").course;return COURSES[c]?c:"rheinhessen"}catch(e){return"rheinhessen"}})();
const COURSE=COURSES[COURSE_ID];
const COURSE_GUESS=COURSE.center;
// Alle wählbaren Schläger; H = Holz. Ältere Kürzel bleiben für die Statistik bekannt.
const CLUB_GROUPS=[["Hölzer",["Dr","H3","H5","H7","H9"]],["Hybride",["Hy4","Hy5"]],["Eisen",["3i","4i","5i","6i","7i","8i","9i","PW"]],["Wedges",["46°","48°","50°","52°","54°","56°","58°","60°","62°","64°"]]];
const ALL_CLUBS=CLUB_GROUPS.flatMap(g=>g[1]).concat(["3H","5H","Hy","GW","SW","LW"]);
const DEFAULT_BAG=["Dr","H3","H5","5i","6i","7i","8i","9i","PW","52°","56°","60°"];
function bag(){const b=(typeof ui!=="undefined"&&ui&&Array.isArray(ui.bag)&&ui.bag.length)?ui.bag:DEFAULT_BAG;return ALL_CLUBS.filter(c=>b.includes(c))}
let CLUBS=DEFAULT_BAG;
// Course data comes from data/<course>.js
const SCORECARD=COURSE.holes;
const RATINGS=COURSE.ratings;
const COURSE_PAR=COURSE.par;
const TEE_LABELS=COURSE.tees||Object.fromEntries(Object.keys(RATINGS).map(k=>[k,k.toUpperCase()]));
// Tee per course (ui.tees[courseId]); older versions stored one ui.tee for Rheinhessen
function teeKey(){const u=(typeof ui!=="undefined"&&ui)||{},t=(u.tees&&u.tees[COURSE_ID])||(COURSE_ID==="rheinhessen"?u.tee:null)||COURSE.defaultTee||Object.keys(RATINGS)[0];
  return RATINGS[t]?t:(COURSE_ID==="rheinhessen"&&{w:"a",y:"b",r:"d",g:"e"}[t])||COURSE.defaultTee||Object.keys(RATINGS)[0]}
function setTee(t){ui.tees=ui.tees||{};ui.tees[COURSE_ID]=t;if(COURSE_ID==="rheinhessen")ui.tee=t}
function applyCard(){for(const[n,v]of Object.entries(SCORECARD)){const h=course.holes[n]=course.holes[n]||{};if(!h.parSet)h.par=v.par;h.hcp=v.hcp;if(v.depth)h.depth=v.depth;delete h.len}}
// Rheinhessen keeps the original keys so existing data stays where it is
const SFX=COURSE_ID==="rheinhessen"?"":"_"+COURSE_ID;
const K={course:"wb_course_v1"+SFX,round:"wb_round_v1"+SFX,hist:"wb_hist_v1",ui:"wb_ui_v1"};

// ---------- Storage ----------
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){toast("Speichern fehlgeschlagen")}};
let course=load(K.course,{holes:{},hazards:[],bbox:null,src:null});
let ui=load(K.ui,{hole:1});
let round=load(K.round,null)||newRoundObj();
let hist=load(K.hist,[]);
if(COURSE_ID==="rheinhessen"&&ui.tee&&!RATINGS[ui.tee])ui.tee=teeKey();
applyCard();
function newRoundObj(mode){const u=ui||{};return{start:Date.now(),holes:{},mode:mode||"18",tee:teeKey(),hcpi:u.hcpi,sex:u.sex}}
const MODES={"18":[1,18,"18 Löcher"],"f9":[1,9,"Löcher 1–9"],"b9":[10,18,"Löcher 10–18"]};
let viewRound=null; // vergangene Runde im Ansichtsmodus
function cur(){return viewRound||round}
function range(){return MODES[cur().mode||"18"]}
function H(n){course.holes[n]=course.holes[n]||{};return course.holes[n]}
// ---------- Stableford (WHS) ----------
// Spieleinstellungen einer Runde: beim Start eingefroren, sonst aktuelle Einstellungen
function playSet(r){r=r||cur();const t=(r.tee&&RATINGS[r.tee])?r.tee:teeKey(),hc=(r.hcpi!=null?r.hcpi:ui.hcpi),sx=r.sex||ui.sex||"m";return{tee:t,hcpi:(hc===""||hc==null||isNaN(hc))?null:+hc,sex:sx}}
function courseHcp(r){const p=playSet(r);if(p.hcpi==null)return null;const rt=RATINGS[p.tee][p.sex];if(!rt)return null;const[cr,sr]=rt,nine=MODES[(r||cur()).mode||"18"][1]-MODES[(r||cur()).mode||"18"][0]<9;
  return nine?Math.round(p.hcpi/2*sr/113+cr/2-COURSE_PAR/2):Math.round(p.hcpi*sr/113+cr-COURSE_PAR)}
function strokesRecv(n,r){r=r||cur();const ch=courseHcp(r);if(ch==null)return null;const[a,b]=MODES[r.mode||"18"],k=b-a+1;
  const idx=[];for(let i=a;i<=b;i++)idx.push([i,(SCORECARD[i]||{}).hcp||i]);idx.sort((x,y)=>x[1]-y[1]);const rank=idx.findIndex(x=>x[0]==n)+1;if(!rank)return 0;
  return Math.floor(ch/k)+(rank<=((ch%k)+k)%k?1:0)}
function sfPoints(n,r){r=r||cur();const h=r.holes[n],par=(course.holes[n]||{}).par||(SCORECARD[n]||{}).par,s=strokesRecv(n,r);if(!h||!h.strokes||s==null||!par)return null;return Math.max(0,par+s-h.strokes+2)}
function sfTotal(r){r=r||cur();const[a,b]=MODES[r.mode||"18"];let t=0,any=false;for(let i=a;i<=b;i++){const p=sfPoints(i,r);if(p!=null){t+=p;any=true}}return any?t:null}
function dots(k){return k>0?"•".repeat(Math.min(k,3)):k<0?"−":""}
function RH(n){round.holes[n]=round.holes[n]||{shots:[],strokes:null,putts:0};return round.holes[n]}

// ---------- Geometrie ----------
const R=6371008.8,rad=Math.PI/180;
function dist(a,b){const dLa=(b[0]-a[0])*rad,dLo=(b[1]-a[1])*rad;const s=Math.sin(dLa/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(s))}
function proj(o){const c=Math.cos(o[0]*rad);return p=>[(p[1]-o[1])*rad*R*c,(p[0]-o[0])*rad*R]}
function nearestOnPoly(p,poly){const P=proj(p),pts=poly.map(P);let best=Infinity;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const dx=b[0]-a[0],dy=b[1]-a[1];const L=dx*dx+dy*dy;let t=L?((-a[0])*dx+(-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));const x=a[0]+t*dx,y=a[1]+t*dy;best=Math.min(best,Math.hypot(x,y))}return inside([0,0],pts)?0:best}
function farOnPoly(p,poly){return Math.max(...poly.map(q=>dist(p,q)))}
function inside(pt,vs){let x=pt[0],y=pt[1],ins=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const xi=vs[i][0],yi=vs[i][1],xj=vs[j][0],yj=vs[j][1];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins}return ins}
function centroid(poly){const o=poly[0],P=proj(o),pts=poly.map(P);let a=0,cx=0,cy=0;for(let i=0;i<pts.length;i++){const[x0,y0]=pts[i],[x1,y1]=pts[(i+1)%pts.length];const f=x0*y1-x1*y0;a+=f;cx+=(x0+x1)*f;cy+=(y0+y1)*f}if(Math.abs(a)<1e-6){const m=poly.reduce((s,q)=>[s[0]+q[0],s[1]+q[1]],[0,0]);return[m[0]/poly.length,m[1]/poly.length]}cx/=3*a;cy/=3*a;const c=Math.cos(o[0]*rad);return[o[0]+cy/R/rad,o[1]+cx/(R*c)/rad]}
function distToLine(p,line){const P=proj(p),pts=line.map(P);let best=Infinity;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const dx=b[0]-a[0],dy=b[1]-a[1];const L=dx*dx+dy*dy;let t=L?((-a[0])*dx+(-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));best=Math.min(best,Math.hypot(a[0]+t*dx,a[1]+t*dy))}return best}
const m=v=>v==null||!isFinite(v)?"–":Math.round(v);

// ---------- Karte ----------
const map=L.map("map",{zoomControl:false,attributionControl:true,tap:true}).setView(COURSE_GUESS,15);
// Satellite tiles: with an Esri API key (config.js) the keyed basemap endpoint is used
const ESRI_KEY=((window.APP_CONFIG||{}).esriKey||"").trim();
const satTiles=L.tileLayer(ESRI_KEY?"https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token="+encodeURIComponent(ESRI_KEY):"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:20,maxNativeZoom:19,attribution:"Esri, Maxar, Earthstar Geographics · Daten © OpenStreetMap"});
const layers={course:L.layerGroup().addTo(map),hole:L.layerGroup().addTo(map),shots:L.layerGroup().addTo(map),meas:L.layerGroup().addTo(map)};
const icon=c=>L.divIcon({className:"",html:`<div class="${c}"></div>`,iconSize:[22,22],iconAnchor:[11,11]});
let meMarker=null,accCircle=null,me=null,meAcc=null,manualPos=false,target=null,tool="";

function drawCourse(){
  layers.course.clearLayers();
  for(const hz of course.hazards){
    const col=hz.type==="water"?"#3d9be9":"#f2d58a";
    if(hz.poly)L.polygon(hz.poly,{color:col,weight:1,fillOpacity:.25,interactive:false}).addTo(layers.course);
    else L.circleMarker(hz.pt,{radius:7,color:col,weight:2,fillOpacity:.5,interactive:false}).addTo(layers.course);
  }
  for(const[n,h]of Object.entries(course.holes)){
    if(h.greenPoly)L.polygon(h.greenPoly,{color:"#9cff9c",weight:1,fillOpacity:.15,interactive:false}).addTo(layers.course);
  }
}
function greenOf(n){const h=course.holes[n];if(!h)return null;
  const c=h.greenC||(h.greenPoly?centroid(h.greenPoly):null);if(!c)return null;
  return{c,poly:h.greenPoly||null,f:h.greenF||null,b:h.greenB||null}}
// Hole layout traced from the tee sign (data file), in metres: tee [0,0], +y towards the green, +x right
function sign(n){return (SCORECARD[n]||{}).map||null}
function teeOf(n){const h=course.holes[n]||{};return h.line&&h.line.length>1?h.line[0]:(h.tee||null)}
// Places the sign layout on the real hole once tee and green are known (scaled to the real length)
function signGeo(n){const tm=sign(n),t=teeOf(n),g=greenOf(n);if(!tm||!t||!g)return null;const F=makeFrame(t,g.c),k=F.L/tm.len;return{F,k,B:p=>F.back(p[0]*k,-p[1]*k)}}
function holeLine(n){const h=course.holes[n]||{};if(h.line&&h.line.length>1)return h.line;const g=greenOf(n);
  if(h.tee&&g){if(h.dog)return[h.tee,h.dog,g.c];const tm=sign(n),sg=tm&&tm.path.length>2?signGeo(n):null;
    return sg?[h.tee,...tm.path.slice(1,-1).map(sg.B),g.c]:[h.tee,g.c]}
  return null}
function ownHazards(n){
  const line=holeLine(n);
  return course.hazards.filter(z=>{if(z.hole!=null)return z.hole==n;if(!line)return false;const c=z.poly?centroid(z.poly):z.pt;return distToLine(c,line)<55});
}
function signHazards(n,B){const tm=sign(n);if(!tm)return[];
  return tm.bunkers.map(p=>({type:"bunker",poly:p.map(B),sign:true})).concat(tm.water.map(p=>({type:"water",poly:p.map(B),sign:true})))}
// Own markings and OpenStreetMap data win; otherwise use the sign layout (approximate)
function hazardsOf(n){const own=ownHazards(n);if(own.length)return own;const sg=signGeo(n);return sg?signHazards(n,sg.B):[]}
function drawHole(){
  layers.hole.clearLayers();const n=ui.hole,g=greenOf(n),h=course.holes[n]||{};
  const line=holeLine(n);
  if(line)L.polyline(line,{color:"#fff",weight:2,dashArray:"4 6",opacity:.7,interactive:false}).addTo(layers.hole);
  if(h.tee)L.circleMarker(h.tee,{radius:6,color:"#fff",weight:2,fillColor:"#1f7a3f",fillOpacity:1,interactive:false}).addTo(layers.hole);
  if(g){L.marker(g.c,{icon:icon("flag"),interactive:false}).addTo(layers.hole);
    if(g.f)L.circleMarker(g.f,{radius:4,color:"#fff",fillOpacity:1,interactive:false}).addTo(layers.hole);
    if(g.b)L.circleMarker(g.b,{radius:4,color:"#fff",fillOpacity:1,interactive:false}).addTo(layers.hole);}
  for(const z of hazardsOf(n)){const c=z.poly?z.poly:null;
    if(c)L.polygon(c,{color:z.type==="water"?"#7cc4ff":"#ffe08a",weight:2.5,fill:false,interactive:false}).addTo(layers.hole);}
  drawShots();
}
function focusHole(){
  const n=ui.hole,pts=[];const line=holeLine(n);if(line)pts.push(...line);const g=greenOf(n);if(g){pts.push(g.c);if(g.poly)pts.push(...g.poly)}
  if(me&&g&&dist(me,g.c)<700)pts.push(me);
  if(pts.length>1)map.fitBounds(L.latLngBounds(pts),{padding:[60,60],maxZoom:18});
  else if(pts.length===1)map.setView(pts[0],17);
  else if(me)map.setView(me,17);
  else if(course.bbox)map.fitBounds(course.bbox);
}

// ---------- Bahnansicht (Stil der Abschlagtafeln) ----------
const HV={rough:"#7ccf4f",outline:"#3e4f2c",fairway:"#4fa83f",stripe:"#5cb84a",green:"#9be36a",greenLine:"#3f8f34",sand:"#f2d27c",sandLine:"#c9a24a",water:"#3a86d6",waterLine:"#1f5fa8",tree:"#2f6b2a",treeLine:"#1d4719",line:"#1b2a17"};
const SVGNS="http://www.w3.org/2000/svg";
let hvFrame=null,hvSynth=false;
function hvEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function makeFrame(tee,green){
  const P=proj(tee),v=P(green),L=Math.hypot(v[0],v[1]),th=Math.atan2(v[0],v[1]),c=Math.cos(th),sn=Math.sin(th);
  const to=p=>{const q=P(p);return[q[0]*c-q[1]*sn,-(q[0]*sn+q[1]*c)]};
  const back=(X,Y)=>{const xp=X,yp=-Y,x=xp*c+yp*sn,y=-xp*sn+yp*c,cl=Math.cos(tee[0]*rad);return[tee[0]+y/R/rad,tee[1]+x/(R*cl)/rad]};
  return{to,back,L}}
function rnd(seed){let x=Math.sin(seed)*10000;return x-Math.floor(x)}
function along(pts,d){let acc=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(acc+l>=d){const t=(d-acc)/l;return{p:[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],dir:[(b[0]-a[0])/l,(b[1]-a[1])/l]}}acc+=l}const a=pts[pts.length-2],b=pts[pts.length-1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return{p:b,dir:[(b[0]-a[0])/l,(b[1]-a[1])/l]}}
function plen(pts){let s=0;for(let i=0;i<pts.length-1;i++)s+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);return s}
function subLine(pts,d0,d1){const out=[along(pts,d0).p];let acc=0;for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);acc+=l;if(acc>d0&&acc<d1)out.push(pts[i+1])}out.push(along(pts,d1).p);return out}
const ptsAttr=a=>a.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
function renderHoleView(){
  const svg=$("hvSvg"),msg=$("hvMsg"),n=ui.hole,h=course.holes[n]||{},tm=sign(n);let g=greenOf(n);
  svg.innerHTML="";
  let lineLL=holeLine(n);
  // Without tee/green positions: draw the sign layout on a stand-in position (no live distances)
  hvSynth=(!g||!lineLL)&&!!tm;
  if(hvSynth){const t0=COURSE_GUESS,gS=[t0[0]+tm.len/R/rad,t0[1]],Fs=makeFrame(t0,gS);g={c:gS,poly:null,f:null,b:null};lineLL=[t0,...tm.path.slice(1,-1).map(p=>Fs.back(p[0],-p[1])),gS]}
  if(!g||!lineLL){msg.hidden=false;msg.innerHTML=`Für Loch ${n} fehlen noch Abschlag und Grün.<br>Setze beides einmal in der Satellitenansicht (Tab „Platz“ → „Abschlag“ und „Grün Mitte“).<button class="btn primary" id="hvToSat">Zur Satellitenansicht</button>`;$("hvToSat").onclick=()=>setView("sat");return}
  msg.hidden=true;
  const tee=lineLL[0],F=makeFrame(tee,g.c);hvFrame=F;
  const line=lineLL.map(F.to);line[line.length-1]=F.to(g.c);
  const L=plen(line),gc=F.to(g.c),depth=h.depth||30,par=h.par||(L>430?5:L>220?4:3);
  const k=tm?F.L/tm.len:1,S=p=>[p[0]*k,-p[1]*k],Bk=p=>F.back(p[0]*k,-p[1]*k);
  const hz=hvSynth?signHazards(n,Bk):hazardsOf(n);
  // Spieler nur zeigen, wenn er auf/nahe dieser Bahn ist
  const meXY=me?F.to(me):null,onHole=!viewRound&&!hvSynth&&me&&distToLine(me,lineLL)<120;
  // Ausschnitt bestimmen
  // ganze Bahn inkl. Rand (Radius 52 m) und aller Hindernisse
  let xs=[],ys=[];line.forEach(p=>{xs.push(p[0]-56,p[0]+56);ys.push(p[1]-56,p[1]+56)});
  for(const z of hz){(z.poly||[z.pt]).forEach(q=>{const a=F.to(q),r=z.poly?2:(z.type==="water"?22:10);xs.push(a[0]-r,a[0]+r);ys.push(a[1]-r,a[1]+r)})}
  if(tm)tm.outline.forEach(p=>{const a=S(p);xs.push(a[0]);ys.push(a[1])});
  if(onHole){xs.push(meXY[0]-20,meXY[0]+20);ys.push(meXY[1]-20,meXY[1]+20)}
  const box=svg.getBoundingClientRect(),W=box.width||360,Hh=box.height||500;
  const padTop=86,padBot=16,padX=16;
  let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const sc0=Math.min((W-2*padX)/(x1-x0),(Hh-padTop-padBot)/(y1-y0));
  // Grundausschnitt: Mitte der Bahn im freien Bereich unter der Kopfzeile
  const bcx=(x0+x1)/2,bcy=(y0+y1)/2-(padTop-padBot)/2/sc0;
  hvBase={cx:bcx,cy:bcy,sc:sc0,W,H:Hh,x0,x1,y0,y1};
  const sc=sc0*hvZoom.k;
  applyVB();
  const px=v=>v/sc; // Bildschirmpixel -> Meter (bleibt beim Zoomen gleich groß)
  const defs=hvEl("defs",{},svg);
  const pat=hvEl("pattern",{id:"stripes",patternUnits:"userSpaceOnUse",width:16,height:16,patternTransform:"rotate(35)"},defs);
  hvEl("rect",{width:8,height:16,fill:HV.stripe},pat);
  const gpat=hvEl("pattern",{id:"gstripes",patternUnits:"userSpaceOnUse",width:4,height:4,patternTransform:"rotate(-30)"},defs);
  hvEl("rect",{width:4,height:4,fill:HV.green},gpat);hvEl("rect",{width:2,height:4,fill:"#aeea80"},gpat);
  const layer=hvEl("g",{},svg);
  const pl=(pts,stroke,w,extra)=>hvEl("polyline",Object.assign({points:ptsAttr(pts),fill:"none",stroke,"stroke-width":w,"stroke-linecap":"round","stroke-linejoin":"round"},extra||{}),layer);
  // Spielbahn: Rand, Rough
  const corridor=line.slice();corridor[corridor.length-1]=[gc[0],gc[1]-depth*.35];
  if(tm){hvEl("polygon",{points:ptsAttr(tm.outline.map(S)),fill:HV.rough,stroke:HV.outline,"stroke-width":5,"stroke-linejoin":"round"},layer);
    tm.trees.forEach(([x,y,r])=>{const p=S([x,y]);hvEl("circle",{cx:p[0],cy:p[1],r:r*k,fill:HV.tree,stroke:HV.treeLine,"stroke-width":1.2},layer)})}
  else{pl(corridor,HV.outline,104);pl(corridor,HV.rough,94);}
  // Bäume am Rand (geschätzt, wenn keine Tafel-Daten)
  if(!tm)for(let d=10;d<L+10;d+=19){for(const side of[-1,1]){const r=rnd(n*131+d*7+side);if(r<.35)continue;const a=along(corridor,Math.min(d,plen(corridor))),nx=-a.dir[1]*side,ny=a.dir[0]*side,off=46+r*5;
    const p=[a.p[0]+nx*off,a.p[1]+ny*off];hvEl("circle",{cx:p[0],cy:p[1],r:3.6+r*2.4,fill:HV.tree,stroke:HV.treeLine,"stroke-width":1.2},layer)}}
  // Fairway: aus OSM oder geschätzt
  const fws=(h.fairways||[]);
  if(fws.length)fws.forEach(fw=>hvEl("polygon",{points:ptsAttr(fw.map(F.to)),fill:"url(#stripes)",stroke:HV.fairway,"stroke-width":2},layer));
  else if(par>=4){const d0=Math.min(L*.32,par===5?150:120),d1=Math.max(d0+30,L-depth*.5-14);const fl=subLine(line,d0,d1);
    pl(fl,HV.fairway,36);pl(fl,"url(#stripes)",34)}
  else{pl(subLine(line,Math.max(0,L-depth-25),L-depth*.4),HV.fairway,30)}
  // Abschläge
  const teeCols=[["#ffffff",-7],["#f4d23c",0],["#222",9],["#d8322b",16]];
  const ta=along(line,0);
  teeCols.forEach(([col,o])=>{const p=[ta.p[0]+ta.dir[0]*o,ta.p[1]+ta.dir[1]*o];hvEl("rect",{x:p[0]-4,y:p[1]-2.6,width:8,height:5.2,rx:1.4,fill:col,stroke:"#333","stroke-width":.6},layer)});
  // Wasser und Bunker
  for(const z of hz){const isW=z.type==="water";
    if(z.poly)hvEl("polygon",{points:ptsAttr(z.poly.map(F.to)),fill:isW?HV.water:HV.sand,stroke:isW?HV.waterLine:HV.sandLine,"stroke-width":1.4,"stroke-linejoin":"round"},layer);
    else{const p=F.to(z.pt),r=isW?16:7;hvEl("ellipse",{cx:p[0],cy:p[1],rx:r*1.25,ry:r*.85,fill:isW?HV.water:HV.sand,stroke:isW?HV.waterLine:HV.sandLine,"stroke-width":1.4},layer)}}
  // Grün
  if(g.poly)hvEl("polygon",{points:ptsAttr(g.poly.map(F.to)),fill:"url(#gstripes)",stroke:HV.greenLine,"stroke-width":1.4},layer);
  else hvEl("ellipse",{cx:gc[0],cy:gc[1],rx:depth*.42,ry:depth*.5,fill:"url(#gstripes)",stroke:HV.greenLine,"stroke-width":1.4},layer);
  // Mittellinie
  pl(line,HV.line,px(1.3),{"stroke-dasharray":`${px(5)} ${px(5)}`,opacity:.55});
  // Distanzmarken zur Grünmitte
  for(const md of[50,100,150,200]){if(md>L-25)continue;const a=along(line,L-md),nx=-a.dir[1],ny=a.dir[0];
    hvEl("line",{x1:a.p[0]-nx*12,y1:a.p[1]-ny*12,x2:a.p[0]+nx*12,y2:a.p[1]+ny*12,stroke:"#fff","stroke-width":px(2),opacity:.8},layer);
    const t=hvEl("text",{x:a.p[0]+nx*16,y:a.p[1]+ny*16+px(5),"font-size":px(13),"font-family":"Saira Condensed,sans-serif","font-weight":700,fill:"#fff",stroke:HV.outline,"stroke-width":px(3),"paint-order":"stroke"},layer);t.textContent=md}
  // Fahne
  const fl=hvEl("g",{},layer);hvEl("line",{x1:gc[0],y1:gc[1],x2:gc[0],y2:gc[1]-px(26),stroke:"#222","stroke-width":px(2)},fl);
  hvEl("polygon",{points:ptsAttr([[gc[0],gc[1]-px(26)],[gc[0]+px(14),gc[1]-px(21)],[gc[0],gc[1]-px(16)]]),fill:"#e0302a"},fl);
  hvEl("ellipse",{cx:gc[0],cy:gc[1],rx:px(4),ry:px(2),fill:"#111"},fl);
  // Schläge dieser Runde
  const rh=cur().holes[n];
  if(rh)rh.shots.forEach(sh=>{const a=F.to([sh.lat,sh.lon]);
    const sc=sh.prov?"#ffb347":"#fff";
    if(sh.end&&!sh.lost){const b=F.to(sh.end);hvEl("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:sc,"stroke-width":px(2.5),opacity:.95},layer);
      const t=hvEl("text",{x:(a[0]+b[0])/2+px(8),y:(a[1]+b[1])/2,"font-size":px(13),"font-family":"Saira Condensed,sans-serif","font-weight":700,fill:"#fff",stroke:"#14231a","stroke-width":px(3),"paint-order":"stroke"},layer);t.textContent=`${sh.club} ${m(dist([sh.lat,sh.lon],sh.end))}`}
    hvEl("circle",{cx:a[0],cy:a[1],r:px(5),fill:sh.lost?"#e0302a":sc,stroke:"#14231a","stroke-width":px(2)},layer)});
  // Messziel
  if(target){const t=F.to(target);
    if(onHole)hvEl("line",{x1:meXY[0],y1:meXY[1],x2:t[0],y2:t[1],stroke:"#ffd23f","stroke-width":px(3)},layer);
    hvEl("line",{x1:t[0],y1:t[1],x2:gc[0],y2:gc[1],stroke:"#ffd23f","stroke-width":px(2),"stroke-dasharray":`${px(6)} ${px(5)}`},layer);
    hvEl("circle",{cx:t[0],cy:t[1],r:px(10),fill:"rgba(255,210,63,.3)",stroke:"#ffd23f","stroke-width":px(3)},layer);
    const lab=(p,txt)=>{const e=hvEl("text",{x:p[0]+px(10),y:p[1],"font-size":px(15),"font-family":"Saira Condensed,sans-serif","font-weight":800,fill:"#fff",stroke:"#14231a","stroke-width":px(3.5),"paint-order":"stroke"},layer);e.textContent=txt};
    if(onHole)lab([(meXY[0]+t[0])/2,(meXY[1]+t[1])/2],m(dist(me,target))+" m");
    lab([(t[0]+gc[0])/2,(t[1]+gc[1])/2],m(dist(target,g.c))+" m")}
  if(!viewRound){
  // Distanzbeschriftung: vom Spieler, sonst vom Abschlag
  const ref=onHole?me:tee,refXY=F.to(ref);
  const tag=(p,txt,side,col)=>{const anchor=side<0?"end":"start",dx=side<0?-px(7):px(7);
    hvEl("circle",{cx:p[0],cy:p[1],r:px(2.6),fill:"#fff",stroke:"#14231a","stroke-width":px(1.2)},layer);
    const t=hvEl("text",{x:p[0]+dx,y:p[1]+px(5),"text-anchor":anchor,"font-size":px(15),"font-family":"Saira Condensed,sans-serif","font-weight":800,fill:col||"#fff",stroke:"#14231a","stroke-width":px(3.5),"paint-order":"stroke"},layer);t.textContent=txt};
  // Grün: Vorderkante unten, Hinterkante oben
  {const gd=along(line,L).dir,hd=depth/2;
    let fP=g.f?F.to(g.f):[gc[0]-gd[0]*hd,gc[1]-gd[1]*hd],bP=g.b?F.to(g.b):[gc[0]+gd[0]*hd,gc[1]+gd[1]*hd];
    let fD=g.f?dist(ref,g.f):g.poly?nearestOnPoly(ref,g.poly):dist(ref,g.c)-hd,bD=g.b?dist(ref,g.b):g.poly?farOnPoly(ref,g.poly):dist(ref,g.c)+hd;
    if(g.poly&&!g.f){let bi=0,bd=1e9,fi=0,fd=0;g.poly.forEach((q,i)=>{const d=dist(ref,q);if(d<bd){bd=d;bi=i}if(d>fd){fd=d;fi=i}});fP=F.to(g.poly[bi]);if(!g.b)bP=F.to(g.poly[fi])}
    const tagC=(p,txt,below)=>{hvEl("circle",{cx:p[0],cy:p[1],r:px(2.6),fill:"#fff",stroke:"#14231a","stroke-width":px(1.2)},layer);
      const t=hvEl("text",{x:p[0],y:p[1]+(below?px(19):-px(7)),"text-anchor":"middle","font-size":px(16),"font-family":"Saira Condensed,sans-serif","font-weight":800,fill:"#fff",stroke:"#14231a","stroke-width":px(3.5),"paint-order":"stroke"},layer);t.textContent=txt};
    tagC(fP,m(fD),true);tagC(bP,m(bD),false);}
  // Hindernisse: Distanz an die Vorderkante
  const cD=dist(ref,g.c);
  for(const z of hz){let fp,near;
    if(z.poly){let bi=0,bd=1e9;z.poly.forEach((q,i)=>{const d=dist(ref,q);if(d<bd){bd=d;bi=i}});near=nearestOnPoly(ref,z.poly);fp=F.to(z.poly[bi])}
    else{const c=F.to(z.pt),r=z.type==="water"?16:7,v=[refXY[0]-c[0],refXY[1]-c[1]],l=Math.hypot(v[0],v[1])||1;fp=[c[0]+v[0]/l*r*.85,c[1]+v[1]/l*r*.85];near=Math.max(0,dist(ref,z.pt)-r)}
    if(near>cD+15)continue;
    const cl=along(line,Math.max(0,Math.min(L,L-dist(z.pt||centroid(z.poly),g.c)))).p;
    tag(fp,m(near),fp[0]<cl[0]?-1:1,z.type==="water"?"#cfe6ff":"#fff3c4")}
  }
  // Spieler
  if(onHole){hvEl("circle",{cx:meXY[0],cy:meXY[1],r:px(16),fill:"rgba(45,140,255,.25)"},layer);
    // Blickrichtung als Lichtkegel (wie bei Google Maps); Winkel setzt updateHeading()
    const R1=px(72),hw=30*Math.PI/180,cg=hvEl("g",{id:"hvCone",transform:`translate(${meXY[0]} ${meXY[1]})`,visibility:"hidden"},layer);
    const gd=hvEl("radialGradient",{id:"coneGrad",cx:"0",cy:"0",r:String(R1),gradientUnits:"userSpaceOnUse"},defs);
    hvEl("stop",{offset:"0","stop-color":"#4aa3ff","stop-opacity":".9"},gd);hvEl("stop",{offset:".65","stop-color":"#4aa3ff","stop-opacity":".5"},gd);hvEl("stop",{offset:"1","stop-color":"#4aa3ff","stop-opacity":"0"},gd);
    hvEl("path",{id:"hvConeShape",d:`M0 0 L${(-Math.sin(hw)*R1).toFixed(2)} ${(-Math.cos(hw)*R1).toFixed(2)} A${R1} ${R1} 0 0 1 ${(Math.sin(hw)*R1).toFixed(2)} ${(-Math.cos(hw)*R1).toFixed(2)} Z`,fill:"url(#coneGrad)"},cg);
    hvEl("circle",{cx:meXY[0],cy:meXY[1],r:px(8),fill:"#2d8cff",stroke:"#fff","stroke-width":px(3)},layer);updateHeading()}
  $("hvNote").textContent=hvSynth?"Grafik nach Abschlagtafel · Distanzen ab Abschlag":"Du bist gerade nicht auf dieser Bahn";
  $("hvNote").hidden=hvSynth?false:(!(me&&!onHole)||!!viewRound);
}
// ---------- Verschieben und Zoomen ----------
let hvBase=null,hvZoom={k:1,ox:0,oy:0},hvMoved=false;
const ZMAX=6;
function clampZoom(){const b=hvBase;if(!b)return;hvZoom.k=Math.max(1,Math.min(ZMAX,hvZoom.k));
  const hw=(b.x1-b.x0)/2,hh=(b.y1-b.y0)/2;hvZoom.ox=Math.max(-hw,Math.min(hw,hvZoom.ox));hvZoom.oy=Math.max(-hh,Math.min(hh,hvZoom.oy));
  if(hvZoom.k===1&&Math.abs(hvZoom.ox)<1&&Math.abs(hvZoom.oy)<1){hvZoom.ox=0;hvZoom.oy=0}
  $("hvReset").hidden=hvZoom.k<=1.02&&!hvZoom.ox&&!hvZoom.oy}
function applyVB(){const b=hvBase;if(!b)return;const sc=b.sc*hvZoom.k,w=b.W/sc,h=b.H/sc;
  $("hvSvg").setAttribute("viewBox",`${b.cx+hvZoom.ox-w/2} ${b.cy+hvZoom.oy-h/2} ${w} ${h}`)}
function resetZoom(){hvZoom={k:1,ox:0,oy:0};clampZoom();renderHoleView()}
// Zoom um einen Bildschirmpunkt (clientX/Y), sodass dieser Punkt fest bleibt
function zoomAt(f,clientX,clientY){const b=hvBase;if(!b)return;const r=$("hvSvg").getBoundingClientRect();
  const sx=clientX-r.left-r.width/2,sy=clientY-r.top-r.height/2,k0=hvZoom.k,k1=Math.max(1,Math.min(ZMAX,k0*f));
  hvZoom.ox+=sx/(b.sc*k0)-sx/(b.sc*k1);hvZoom.oy+=sy/(b.sc*k0)-sy/(b.sc*k1);hvZoom.k=k1;clampZoom();applyVB()}
{const svg=$("hvSvg"),pts=new Map();let start=null,pinch=null,rerender=null;
  const schedule=()=>{clearTimeout(rerender);rerender=setTimeout(()=>renderHoleView(),120)};
  svg.addEventListener("pointerdown",e=>{svg.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){start={x:e.clientX,y:e.clientY,ox:hvZoom.ox,oy:hvZoom.oy};hvMoved=false}
    if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),k:hvZoom.k};hvMoved=true}});
  svg.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId)||!hvBase)return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size>=2&&pinch){const[a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>10){zoomAt(pinch.k*d/pinch.d/hvZoom.k,(a.x+b.x)/2,(a.y+b.y)/2)}}
    else if(pts.size===1&&start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>8)hvMoved=true;
      if(hvMoved){const sc=hvBase.sc*hvZoom.k;hvZoom.ox=start.ox-dx/sc;hvZoom.oy=start.oy-dy/sc;clampZoom();applyVB()}}});
  const end=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;
    if(pts.size===1){const p=[...pts.values()][0];start={x:p.x,y:p.y,ox:hvZoom.ox,oy:hvZoom.oy}}
    if(pts.size===0){start=null;if(hvMoved)schedule();setTimeout(()=>hvMoved=false,50)}};
  svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
  svg.addEventListener("wheel",e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*.002),e.clientX,e.clientY);schedule()},{passive:false});
  let lastTap=0;svg.addEventListener("pointerup",e=>{const t=Date.now();if(!hvMoved&&t-lastTap<300){resetZoom();hvMoved=true;setTimeout(()=>hvMoved=false,50)}lastTap=t});
  $("hvReset").onclick=resetZoom;}
$("hvSvg").addEventListener("click",e=>{if(!hvFrame||hvMoved)return;if(hvSynth){toast("Für Layup-Messungen Abschlag und Grün im Tab „Platz“ setzen");return}const svg=$("hvSvg"),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  const q=pt.matrixTransform(svg.getScreenCTM().inverse()),ll=hvFrame.back(q.x,q.y);
  target=target&&dist(target,ll)<px2m(30)?null:ll;update()});
function px2m(p){const svg=$("hvSvg"),vb=svg.viewBox.baseVal,b=svg.getBoundingClientRect();return vb&&b.width?p*vb.width/b.width:20}
function setView(v){ui.view=v;save(K.ui,ui);const hole=v==="hole";
  $("holeView").hidden=!hole;$("map").style.visibility=hole?"hidden":"visible";
  if(hole){if(map.hasLayer(satTiles))map.removeLayer(satTiles)}else if(!map.hasLayer(satTiles))satTiles.addTo(map);$("viewLbl").textContent=hole?"Satellit":"Bahn";
  if(hole)renderHoleView();else{map.invalidateSize();focusHole()}}
window.addEventListener("resize",()=>{if(ui.view!=="sat")renderHoleView()});

// ---------- Blickrichtung (Kompass) ----------
let compassHeading=null,gpsHeading=null,headRaf=0,compassAsked=false;
function screenAngle(){return (screen.orientation&&screen.orientation.angle)||window.orientation||0}
function curHeading(){return compassHeading!=null?compassHeading:gpsHeading}
function scheduleHeading(){if(!headRaf)headRaf=requestAnimationFrame(()=>{headRaf=0;updateHeading()})}
function onOrient(e){let h=null;
  if(e.webkitCompassHeading!=null&&!isNaN(e.webkitCompassHeading))h=e.webkitCompassHeading;       // iOS: 0 = Norden
  else if(e.absolute&&e.alpha!=null)h=360-e.alpha;                                                  // Android
  if(h==null)return;h=(h+screenAngle()+360)%360;
  // leicht glätten, damit der Kegel nicht zittert
  if(compassHeading==null)compassHeading=h;else{let d=((h-compassHeading+540)%360)-180;compassHeading=(compassHeading+d*0.35+360)%360}
  scheduleHeading()}
function startCompass(){
  if("ondeviceorientationabsolute" in window)addEventListener("deviceorientationabsolute",onOrient);
  else addEventListener("deviceorientation",onOrient)}
// iOS erlaubt den Kompass nur nach einer Nutzeraktion: beim ersten Tippen nachfragen
function askCompass(){if(compassAsked)return;compassAsked=true;
  const D=window.DeviceOrientationEvent;
  if(D&&typeof D.requestPermission==="function")D.requestPermission().then(r=>{if(r==="granted")startCompass()}).catch(()=>{});
  else startCompass()}
if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission!=="function")askCompass();
else document.addEventListener("click",askCompass,{once:true,capture:true});
function updateHeading(){const h=curHeading();
  // Satellitenkarte: Norden oben, Kegel direkt drehen
  const mc=meMarker&&meMarker.getElement()&&meMarker.getElement().querySelector(".mecone");
  if(mc){mc.hidden=h==null;if(h!=null)mc.style.transform=`rotate(${h}deg)`}
  // Bahngrafik: Grün oben, Richtung in das Bahn-Koordinatensystem umrechnen
  const cg=document.getElementById("hvCone");if(!cg)return;
  if(h==null||!me||!hvFrame){cg.setAttribute("visibility","hidden");return}
  const a=h*rad,q=[me[0]+Math.cos(a)*20/R/rad,me[1]+Math.sin(a)*20/(R*Math.cos(me[0]*rad))/rad];
  const p0=hvFrame.to(me),p1=hvFrame.to(q),ang=Math.atan2(p1[0]-p0[0],-(p1[1]-p0[1]))*180/Math.PI;
  cg.setAttribute("transform",`translate(${p0[0]} ${p0[1]}) rotate(${ang.toFixed(1)})`);cg.setAttribute("visibility","visible")}

// ---------- GPS ----------
const st=document.getElementById("status");
function setStatus(t,err){st.textContent=t;st.classList.toggle("err",!!err)}
function setMe(p,acc){
  me=p;meAcc=acc;
  if(!meMarker){meMarker=L.marker(p,{icon:L.divIcon({className:"",html:'<div class="mewrap"><div class="mecone" hidden></div><div class="me"></div></div>',iconSize:[22,22],iconAnchor:[11,11]}),interactive:false,zIndexOffset:1000}).addTo(map);updateHeading()}else meMarker.setLatLng(p);
  if(acc){if(!accCircle)accCircle=L.circle(p,{radius:acc,color:"#2d8cff",weight:1,fillOpacity:.08,interactive:false}).addTo(map);else accCircle.setLatLng(p).setRadius(acc)}
  update();
}
if("geolocation" in navigator){
  navigator.geolocation.watchPosition(pos=>{if(manualPos)return;
    // Fallback ohne Kompass: Bewegungsrichtung aus GPS, nur beim Gehen verlässlich
    const c=pos.coords;if(c.heading!=null&&!isNaN(c.heading)&&(c.speed||0)>0.7){gpsHeading=c.heading;if(compassHeading==null)scheduleHeading()}const a=Math.round(pos.coords.accuracy);setStatus(`GPS ±${a} m`+(a>15?" · ungenau":""),a>25);setMe([pos.coords.latitude,pos.coords.longitude],pos.coords.accuracy)},
    err=>{setStatus(err.code===1?"GPS nicht erlaubt – Standortzugriff in den Browser-Einstellungen freigeben":"Kein GPS-Signal",true)},
    {enableHighAccuracy:true,maximumAge:2000,timeout:20000});
}else setStatus("Dieses Gerät bietet kein GPS",true);
// Display wach halten
let wl=null;async function wake(){try{if("wakeLock"in navigator&&document.visibilityState==="visible")wl=await navigator.wakeLock.request("screen")}catch(e){}}
document.addEventListener("visibilitychange",wake);wake();

// ---------- Anzeige ----------
function update(){
  const n=ui.hole,g=greenOf(n),h=course.holes[n]||{};
  $("holeinfo").innerHTML=`<div class="n">Loch ${n}${ui.tourney&&!viewRound?'<span class="tbadge">Turnier</span>':""}${cur().mode&&cur().mode!=="18"?'<small style="font-size:13px;color:var(--muted);font-family:var(--body);font-weight:600"> · 9er</small>':""}</div><div class="p">Par ${h.par||"–"}${h.hcp?" · Hcp "+h.hcp:""}${(()=>{const k=strokesRecv(n);return k?` · <span title="Vorgabeschläge">${dots(k)}</span>`:""})()}${scoreTxt(n)}</div>`;
  if(me&&g){
    const c=dist(me,g.c);
    let f=g.f?dist(me,g.f):g.poly?nearestOnPoly(me,g.poly):null;
    let b=g.b?dist(me,g.b):g.poly?farOnPoly(me,g.poly):null;
    if(f==null&&h.depth)f=Math.max(0,c-h.depth/2);if(b==null&&h.depth)b=c+h.depth/2;
    $("dC").innerHTML=`${m(c)}<small>m</small>`;$("dF").textContent=m(f);$("dB").textContent=m(b);
    const sg=ui.tourney?null:suggest(c);$("sugg").innerHTML=sg?`Dein Schläger für ${m(c)} m: <b>${sg.c}</b> (Ø ${m(sg.avg)} m)`:"";
  }else{$("dC").innerHTML=g?"–":'<span style="font-size:22px">kein Grün</span>';$("dF").textContent="–";$("dB").textContent="–"}
  // Hindernisse
  const hz=$("hazards");hz.innerHTML="";
  const list=hazardsOf(n).map(z=>{
    if(!me)return{z,near:null,far:null};
    const r=z.type==="water"?16:7;
    const near=z.poly?nearestOnPoly(me,z.poly):Math.max(0,dist(me,z.pt)-r);
    const far=z.poly?farOnPoly(me,z.poly):dist(me,z.pt)+r;return{z,near,far}})
    .filter(o=>!me||!g||o.near<=dist(me,g.c)+15).sort((a,b)=>(a.near??0)-(b.near??0));
  if(!list.length){hz.innerHTML=`<span class="chip none">${course.src?"Keine Hindernisse vor dir":"Keine Platzdaten – Tab „Platz“"}</span>`}
  for(const o of list){const col=o.z.type==="water"?"var(--water)":"var(--bunker)";
    const name=o.z.type==="water"?"Wasser":"Bunker";
    hz.insertAdjacentHTML("beforeend",`<span class="chip"><i style="background:${col}"></i>${name} <b>${m(o.near)}</b>${o.far!=null?` · über <b>${m(o.far)}</b>`:""}</span>`)}
  // Messziel
  layers.meas.clearLayers();
  if(target){
    L.marker(target,{icon:icon("tgt"),interactive:false}).addTo(layers.meas);
    const parts=[];
    if(me){const a=dist(me,target);L.polyline([me,target],{color:"#ffd23f",weight:3,interactive:false}).addTo(layers.meas);parts.push(`Bis Ziel <b>${m(a)}</b> m`);
      L.tooltip({permanent:true,direction:"center",className:"lbl"}).setLatLng(mid(me,target)).setContent(m(a)+" m").addTo(layers.meas)}
    if(g){const r=dist(target,g.c);L.polyline([target,g.c],{color:"#ffd23f",weight:2,dashArray:"5 6",interactive:false}).addTo(layers.meas);parts.push(`Rest zur Fahne <b>${m(r)}</b> m`);
      L.tooltip({permanent:true,direction:"center",className:"lbl"}).setLatLng(mid(target,g.c)).setContent(m(r)+" m").addTo(layers.meas)}
    $("target").innerHTML=parts.join(" · ")||"Ziel gesetzt";
  }else $("target").textContent=tool?toolHint():"Tippe auf die Karte, um eine Layup-Distanz zu messen";
  // letzter Schlag
  const rh=cur().holes[n];const shots=rh?rh.shots:[];
  $("provBar").hidden=!(rh&&rh.prov)||!!viewRound;
  {const l=shots[shots.length-1];$("btnProv").hidden=!!viewRound||!l||!!l.end||!!l.lost||!!(rh&&rh.prov)}
  if(ui.view!=="sat")renderHoleView();
  renderReplay();
  if(shots.length){const last=shots[shots.length-1];const prev=shots.length>1?shots[shots.length-2]:null;
    let t=`${shots.length} Schl. getrackt`;
    if(last.end)t+=` · letzter (${last.club}) <b>${m(dist([last.lat,last.lon],last.end))} m</b>`;
    else if(me&&!last.lost)t+=` · seit ${last.club}${last.prov?" (prov.)":""}: <b>${m(dist([last.lat,last.lon],me))} m</b> gelaufen`;
    if(rh.pen)t+=` · ${rh.pen} Strafschl.`;
    else if(prev&&prev.end)t+=` · ${prev.club} <b>${m(dist([prev.lat,prev.lon],prev.end))} m</b>`;
    $("lastshot").innerHTML=t}else $("lastshot").textContent="";
}
const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
function scoreTxt(n){const r=cur().holes[n],p=(course.holes[n]||{}).par;if(!r||!r.strokes)return"";const d=p?r.strokes-p:null,pt=sfPoints(n);return ` · ${r.strokes}`+(d!=null?` (${d>0?"+":""}${d})`:"")+(pt!=null?` · ${pt} Pkt`:"")}
function drawShots(){
  layers.shots.clearLayers();const rh=cur().holes[ui.hole];if(!rh)return;
  rh.shots.forEach((s,i)=>{const p=[s.lat,s.lon];L.marker(p,{icon:icon("shotdot"),interactive:false}).addTo(layers.shots);
    const e=s.end;if(e&&!s.lost){L.polyline([p,e],{color:s.prov?"#ffb347":"#fff",weight:2,opacity:.9,interactive:false}).addTo(layers.shots);
      L.tooltip({permanent:true,direction:"center",className:"lbl"}).setLatLng(mid(p,e)).setContent(`${s.club} ${m(dist(p,e))}`).addTo(layers.shots)}});
}

// ---------- Interaktion Karte ----------
function toolHint(){return{green:"Tippe auf die Grünmitte",greenF:"Tippe auf den Grünanfang",greenB:"Tippe auf das Grünende",tee:"Tippe auf den Abschlag",dog:"Tippe auf den Knickpunkt der Bahn",bunker:"Tippe auf einen Bunker",water:"Tippe auf Wasser",erase:"Tippe auf ein Hindernis zum Löschen",pos:"Tippe auf deine Position"}[tool]||""}
map.on("click",e=>{
  const p=[e.latlng.lat,e.latlng.lng],n=ui.hole;
  if(tool){
    const h=H(n);
    if(tool==="green")h.greenC=p;else if(tool==="greenF")h.greenF=p;else if(tool==="greenB")h.greenB=p;else if(tool==="tee")h.tee=p;else if(tool==="dog")h.dog=p;
    else if(tool==="bunker"||tool==="water")course.hazards.push({type:tool,pt:p,hole:n});
    else if(tool==="erase"){let bi=-1,bd=30;course.hazards.forEach((z,i)=>{const d=z.poly?nearestOnPoly(p,z.poly):dist(p,z.pt);if(d<bd){bd=d;bi=i}});if(bi>=0){course.hazards.splice(bi,1);toast("Hindernis gelöscht")}else toast("Kein Hindernis in der Nähe")}
    else if(tool==="pos"){manualPos=true;setStatus("Position manuell gesetzt");setMe(p,null);return}
    if(!course.src)course.src="manuell";save(K.course,course);drawCourse();drawHole();update();
    if(tool!=="bunker"&&tool!=="water"&&tool!=="erase")toast("Gespeichert für Loch "+n);
    return;
  }
  target=target&&map.latLngToContainerPoint(target).distanceTo(e.containerPoint)<30?null:p;update();
});

// ---------- Löcher wechseln ----------
function goHole(n){const[a,b]=range(),len=b-a+1;ui.hole=a+(((n-a)%len)+len)%len;save(K.ui,ui);target=null;hvZoom={k:1,ox:0,oy:0};$("hvReset").hidden=true;drawHole();update();focusHole()}
$("prev").onclick=()=>goHole(ui.hole-1);$("next").onclick=()=>goHole(ui.hole+1);
$("recenter").onclick=()=>setView(ui.view==="sat"?"hole":"sat");

// ---------- Schläge ----------
let pendingClub=null;
function openOv(id){document.querySelectorAll(".overlay").forEach(o=>o.hidden=o.id!==id)}
function closeOv(){document.querySelectorAll(".overlay").forEach(o=>o.hidden=true);setTab("map")}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeOv);
const grid=$("clubGrid");
function buildClubGrid(){grid.innerHTML="";CLUBS=bag();CLUBS.forEach(c=>{const b=document.createElement("button");b.dataset.club=c;b.onclick=()=>recordShot(c);grid.appendChild(b)})}
buildClubGrid();
function clubAvgs(){const by={};allShots().forEach(s=>(by[s.club]=by[s.club]||[]).push(s.d));const o={};for(const[c,a]of Object.entries(by))o[c]={avg:a.reduce((x,y)=>x+y,0)/a.length,n:a.length};return o}
function suggest(d){const av=clubAvgs();let best=null;for(const[c,v]of Object.entries(av)){if(v.n<2||!CLUBS.includes(c))continue;const diff=Math.abs(v.avg-d);if(!best||diff<best.diff)best={c,avg:v.avg,diff}}return best&&best.diff<25?best:null}
$("btnShot").onclick=()=>{if(viewRound)return;if(!me){toast("Noch keine Position");return}
  shotMode="";document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));
  if(meAcc>25)$("clubSub").textContent=`GPS gerade ±${Math.round(meAcc)} m ungenau – Weite kann abweichen.`;
  else $("clubSub").textContent="Position wird gespeichert. Die Weite ergibt sich beim nächsten Schlag oder mit „Auf dem Grün“.";
  const av=clubAvgs(),g=greenOf(ui.hole),sg=g&&!ui.tourney?suggest(dist(me,g.c)):null,last=ui.lastClub;
  grid.querySelectorAll("button").forEach(b=>{const c=b.dataset.club,v=av[c];
    b.innerHTML=`${c}<small>${v?"Ø "+m(v.avg)+" m":"–"}</small>`;
    b.classList.toggle("sel",sg?sg.c===c:c===last)});
  openOv("ovClub")};
let shotMode="";
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{const md=b.dataset.mode,rh=RH(ui.hole);
  if(!rh.shots.length){toast("Erst einen normalen Schlag markieren");return}
  shotMode=shotMode===md?"":md;
  document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("sel",x.dataset.mode===shotMode));
  $("clubSub").textContent=shotMode==="rehit"?"Neu schlagen: +1 Strafschlag. Welcher Schläger?":shotMode==="drop"?"Drop: +1 Strafschlag. Welcher Schläger von der Drop-Stelle?":"Position wird gespeichert.";});
function addPen(rh,reason){rh.pen=(rh.pen||0)+1;(rh.penLog=rh.penLog||[]).push(reason)}
function removePen(rh,reason){const i=(rh.penLog||[]).lastIndexOf(reason);if(i>=0){rh.penLog.splice(i,1);rh.pen=Math.max(0,(rh.pen||0)-1)}}
const PROV="Provisorischer Ball";
function refreshStrokes(rh){if(!rh.manual&&rh.strokes!=null)rh.strokes=calcStrokes(rh)||null}
function recordShot(club){
  const rh=RH(ui.hole);const last=rh.shots[rh.shots.length-1];let msg="";
  const shot={lat:me[0],lon:me[1],club,t:Date.now()};
  if(shotMode==="prov"){
    // Provisorischer Ball vom selben Ort: Ursprung bleibt offen, Strafschlag sofort
    shot.prov=true;rh.prov={orig:rh.shots.length-1};addPen(rh,PROV);msg=`Provisorischer Ball (${club}) · +1 Strafschlag eingerechnet`;
  }else if(shotMode==="rehit"){
    if(last){last.lost=true;delete last.end}addPen(rh,"Aus/verloren");msg=`+1 Strafschlag · ${club} neu von hier`;
  }else{
    // Bei offenem provisorischem Ball wird dieser weiter getrackt
    if(last&&!last.end&&!last.lost&&!(rh.prov&&rh.shots.indexOf(last)===rh.prov.orig))last.end=[me[0],me[1]];
    if(rh.prov)shot.prov=true;
    if(shotMode==="drop")addPen(rh,"Wasser/unspielbar");
    msg=last&&last.end?`${last.club}${last.prov?" (prov.)":""}: ${m(dist([last.lat,last.lon],last.end))} m`:`${club} gespeichert`;
    if(shotMode==="drop")msg+=" · +1 Strafschlag";
  }
  rh.shots.push(shot);refreshStrokes(rh);ui.lastClub=club;save(K.ui,ui);shotMode="";
  document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("sel"));
  save(K.round,round);closeOv();drawShots();update();toast(msg);
}
function provFound(silent){const rh=RH(ui.hole);if(!rh.prov)return;
  const o=rh.shots[rh.prov.orig];if(o&&me&&!o.lost)o.end=[me[0],me[1]];
  rh.shots=rh.shots.filter(s=>!s.prov);delete rh.prov;removePen(rh,PROV);refreshStrokes(rh);save(K.round,round);drawShots();update();
  if(!silent)toast("Provisorischer Ball und Strafschlag gestrichen. Weiter mit dem ursprünglichen Ball.")}
function provKeep(silent){const rh=RH(ui.hole);if(!rh.prov)return;
  const o=rh.shots[rh.prov.orig];if(o){o.lost=true;delete o.end}
  rh.shots.forEach(s=>{if(s.prov){delete s.prov;s.wasProv=true}});delete rh.prov;
  const pl=(rh.penLog||[]).lastIndexOf(PROV);if(pl>=0)rh.penLog[pl]="Ball verloren (provisorisch weitergespielt)";
  refreshStrokes(rh);save(K.round,round);drawShots();update();if(!silent)toast("Ursprünglicher Ball verloren. Der provisorische zählt.")}
$("provFound").onclick=()=>provFound();
$("provKeep").onclick=()=>provKeep();
$("btnProv").onclick=()=>{if(viewRound)return;if(!me){toast("Noch keine Position");return}
  $("btnShot").onclick();shotMode="prov";$("clubSub").textContent="Provisorischer Ball: Welchen Schläger nimmst du? Der Strafschlag wird sofort eingerechnet."}
function tracked(rh){return rh.shots.length}
function calcStrokes(rh){return tracked(rh)+(rh.pen||0)+(rh.putts||0)}
$("btnBall").onclick=()=>{const rh=RH(ui.hole),last=rh.shots[rh.shots.length-1];
  if(rh.prov){provKeep(true);toast("Provisorischer Ball gewertet")}
  let sub=`${tracked(rh)} Schläge bis aufs Grün`;
  if(last&&me)sub+=` · letzter (${last.club}) ${m(dist([last.lat,last.lon],me))} m`;
  if(rh.pen)sub+=` · +${rh.pen} weitere`;
  $("puttTitle").textContent="Loch "+ui.hole+": Putten";$("puttSub").textContent=sub;openOv("ovPutt")};
document.querySelectorAll("[data-putts]").forEach(b=>b.onclick=()=>{
  const n=ui.hole,rh=RH(n),last=rh.shots[rh.shots.length-1];
  if(last&&me&&!last.lost)last.end=[me[0],me[1]];
  rh.putts=+b.dataset.putts;rh.manual=false;rh.strokes=calcStrokes(rh);save(K.round,round);
  const p=(course.holes[n]||{}).par,d=p?rh.strokes-p:null;
  const names={"-3":"Albatros","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Doppel-Bogey"};
  const pt=sfPoints(n);closeOv();toast(`Loch ${n}: ${rh.strokes} Schläge`+(d!=null?` · ${names[d]||(d>0?"+"+d:d)}`:"")+(pt!=null?` · ${pt} Punkt${pt===1?"":"e"}`:""));
  if(n<range()[1])goHole(n+1);else{drawShots();update();setTimeout(()=>{renderRound();openOv("ovRound");setTab("round")},900)}});

// ---------- Score ----------
let sv={pen:0,putts:0,par:4};
$("btnScore").onclick=()=>{const rh=RH(ui.hole),h=H(ui.hole);
  sv={pen:rh.pen||0,putts:rh.putts||0,par:h.par||4};
  $("scoreTitle").textContent="Loch "+ui.hole;renderSv();openOv("ovScore")};
function renderShotList(){
  const rh=RH(ui.hole),el=$("shotList");
  const pen=rh.penLog&&rh.penLog.length?`<p class="note"><b>Strafschläge:</b> ${rh.penLog.join(", ")}</p>`:"";
  if(!rh.shots.length){el.innerHTML='<p class="note">Noch keine Schläge markiert.</p>'+pen;return}
  el.innerHTML=rh.shots.map((s,i)=>{const d=s.lost?"weg":s.end?m(dist([s.lat,s.lon],s.end))+" m":"offen";
    const tag=s.prov?'<span class="tag" style="color:var(--warn)">prov.</span>':s.wasProv?'<span class="tag">prov.</span>':"";
    return`<div class="shotrow${s.ex||s.lost?" ex":""}"><span class="i">${i+1}.${tag}</span><select data-i="${i}" aria-label="Schläger für Schlag ${i+1}">${(CLUBS.includes(s.club)?CLUBS:CLUBS.concat([s.club])).map(c=>`<option${c===s.club?" selected":""}>${c}</option>`).join("")}</select><span class="d">${d}</span><button class="tog" data-x="${i}">${s.ex?"Zählt nicht":"Zählt"}</button></div>`}).join("")+pen+
    '<p class="note">„Zählt nicht“ für Topper oder Shanks: Der Schlag bleibt im Score, fließt aber nicht in deine Schlägerweiten ein. Verlorene Bälle zählen automatisch nicht.</p>';
  el.querySelectorAll("select").forEach(x=>x.onchange=()=>{rh.shots[+x.dataset.i].club=x.value;save(K.round,round);drawShots();update()});
  el.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{const x=rh.shots[+b.dataset.x];x.ex=!x.ex;save(K.round,round);renderShotList()});
}
function renderSv(){renderShotList();const rh=RH(ui.hole);$("oTracked").textContent=tracked(rh);$("oPen").textContent=sv.pen;$("oPutts").textContent=sv.putts;$("oPar").textContent=sv.par;$("oStrokes").textContent=tracked(rh)+sv.pen+sv.putts}
document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const k=b.dataset.step;sv[k]=Math.max(k==="par"?3:0,Math.min(k==="par"?6:12,sv[k]+(+b.dataset.d)));renderSv();commitSv()});
function commitSv(){const rh=RH(ui.hole);rh.pen=sv.pen;rh.putts=sv.putts;const t=calcStrokes(rh);rh.manual=false;rh.strokes=t||null;const hh=H(ui.hole);if(hh.par!==sv.par)hh.parSet=true;hh.par=sv.par;save(K.round,round);save(K.course,course);update()}
$("scoreNext").onclick=()=>{commitSv();closeOv();goHole(ui.hole+1)};
$("undoShot").onclick=()=>{const rh=RH(ui.hole);if(!rh.shots.length){toast("Keine Schläge auf diesem Loch");return}
  const p=rh.shots.pop();if(rh.prov&&!rh.shots.some(x=>x.prov)){delete rh.prov;removePen(rh,PROV)}
  const l=rh.shots[rh.shots.length-1];if(l&&!l.lost)delete l.end;refreshStrokes(rh);save(K.round,round);drawShots();update();toast("Letzter Schlag gelöscht")};

// ---------- Tabs ----------
function setTab(t){document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t))}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{const t=b.dataset.tab;setTab(t);
  if(t==="map")closeOv();else if(t==="round"){renderRound();openOv("ovRound")}else if(t==="clubs"){renderClubs();openOv("ovClubs")}else if(t==="player"){renderPlayer();openOv("ovPlayer")}else{renderSetup();openOv("ovSetup")}});

document.querySelectorAll("[data-rmode]").forEach(b=>b.onclick=()=>{round.mode=b.dataset.rmode;save(K.round,round);
  const[a,z]=range();if(ui.hole<a||ui.hole>z)goHole(a);update();renderRound();toast(MODES[round.mode][2]+" ausgewählt")});
function cardHTML(r){const[ra,rb]=range0(r);const hasSF=courseHcp(r)!=null;
  let rows=`<tr><th>Loch</th><th>Par</th><th>Sch.</th><th>+/−</th><th>Putts</th>${hasSF?"<th>Pkt</th>":""}<th class='l'>Getrackt</th></tr>`,tp=0,ts=0,tpu=0,played=0,out=0;
  for(let i=ra;i<=rb;i++){const h=r.holes[i],p=(course.holes[i]||{}).par||(SCORECARD[i]||{}).par,s=h&&h.strokes,k=strokesRecv(i,r),pt=sfPoints(i,r);
    if(s){ts+=s;tpu+=h.putts||0;if(p)tp+=p;played++;if(i<=9)out+=s}
    const diff=s&&p?s-p:null;
    rows+=`<tr class="erow" data-edit="${i}" tabindex="0"><td>${i}</td><td>${p||"–"}<span class="dots">${k?dots(k):""}</span></td><td>${s||"–"}${h&&h.manual?'<span class="tag">korr.</span>':""}</td><td class="${diff<0?"score-under":diff>0?"score-over":""}">${diff==null?"–":diff>0?"+"+diff:diff}</td><td>${s?h.putts||0:"–"}</td>${hasSF?`<td>${pt==null?"–":pt}</td>`:""}<td class="l">${h&&h.shots&&h.shots.length?h.shots.filter(x=>!x.lost).map(x=>x.club).join(" "):""}</td></tr>`;
    if(i===9&&rb===18)rows+=`<tr><th>Out</th><th></th><th>${out||"–"}</th><th></th><th></th>${hasSF?"<th></th>":""}<th></th></tr>`}
  const sf=sfTotal(r);
  rows+=`<tr><th>Ges.</th><th>${tp||"–"}</th><th>${ts||"–"}</th><th>${played&&tp?(ts-tp>0?"+":"")+(ts-tp):"–"}</th><th>${played?tpu:"–"}</th>${hasSF?`<th>${sf==null?"–":sf}</th>`:""}<th class="l">${played} von ${rb-ra+1}</th></tr>`;
  return rows}
function range0(r){return MODES[(r&&r.mode)||"18"]}
function setInfo(r){const p=playSet(r),ch=courseHcp(r);return `Abschlag ${p.tee.toUpperCase()} · ${p.sex==="w"?"Damen":"Herren"}`+(ch!=null?` · HCPI ${String(p.hcpi).replace(".",",")} · Spielvorgabe ${ch}`:" · ohne HCPI")}
function recalcHist(h){let s=0,p=0,pu=0,pl=0;for(const[i,r]of Object.entries(h.holes)){if(r.strokes){s+=r.strokes;pu+=r.putts||0;p+=(course.holes[i]||{}).par||0;pl++}}h.played=pl;h.strokes=s;h.vsPar=s-p;h.putts=pu;h.sf=sfTotal(h)}
function renderRound(){
  document.querySelectorAll("[data-rmode]").forEach(b=>{const on=b.dataset.rmode===(round.mode||"18");b.classList.toggle("sel",on);b.setAttribute("aria-checked",on)});
  const d=new Date(round.start);$("roundSub").textContent="Gestartet "+d.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})+", "+d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})+" · "+setInfo(round);
  $("roundTable").innerHTML=cardHTML(round);
  const mine=hist.map((h,i)=>[h,i]).filter(([h])=>(h.course||"rheinhessen")===COURSE_ID),other=hist.length-mine.length;
  const anySF=mine.some(([h])=>courseHcp(h)!=null);
  $("historyTable").innerHTML=(mine.length?`<tr><th class='l'>Datum</th><th>Löcher</th><th>Schläge</th><th>+/−</th>${anySF?"<th>Pkt</th>":""}<th>Putts</th></tr>`+mine.reverse().map(([h,i])=>{const sf=sfTotal(h);return`<tr class="hrow" data-hist="${i}" tabindex="0"><td class="l">${new Date(h.start).toLocaleDateString("de-DE")} <span class="go">Öffnen ›</span></td><td>${h.mode&&h.mode!=="18"?MODES[h.mode][2]:h.played}</td><td>${h.strokes}</td><td>${h.vsPar>0?"+":""}${h.vsPar}</td>${anySF?`<td>${sf==null?"–":sf}</td>`:""}<td>${h.putts}</td></tr>`}).join(""):"<tr><td class='l' style='color:var(--muted)'>Noch keine abgeschlossene Runde auf diesem Platz</td></tr>")+(other?`<tr><td class='l' colspan='6' style='color:var(--muted)'>${other} weitere Runde${other===1?"":"n"} auf anderen Plätzen</td></tr>`:"");
  renderBackupHint();
}
// ---------- Rundendetail ----------
let histIdx=-1,histDelArm=0;
function openHist(i){histIdx=i;histDelArm=0;$("histDel").textContent="Runde löschen";renderHist();openOv("ovHist")}
function renderHist(){const h=hist[histIdx];if(!h)return;
  $("histTitle").textContent="Runde vom "+new Date(h.start).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"});
  const sf=sfTotal(h);$("histSub").textContent=setInfo(h)+` · ${h.strokes} Schläge`+(sf!=null?` · ${sf} Stableford-Punkte`:"");
  $("histTable").innerHTML=cardHTML(h)}
$("histView").onclick=()=>openReplay(histIdx);
$("histBack").onclick=()=>{renderRound();openOv("ovRound");setTab("round")};
$("histDel").onclick=()=>{if(Date.now()-histDelArm>4000){histDelArm=Date.now();$("histDel").textContent="Nochmal tippen zum Löschen";return}
  hist.splice(histIdx,1);save(K.hist,hist);if(viewRound&&!hist.includes(viewRound))viewRound=null;renderRound();openOv("ovRound");setTab("round");toast("Runde gelöscht")};
// ---------- Loch bearbeiten ----------
let ed=null;
function openEdit(r,n,back){const h=r.holes[n]||{shots:[],putts:0,strokes:null};
  ed={r,n,back,strokes:h.strokes||(r.holes[n]?calcStrokes(h):0)||((course.holes[n]||{}).par||4),putts:h.putts||0};
  $("editTitle").textContent="Loch "+n+(r===round?"":" · "+new Date(r.start).toLocaleDateString("de-DE"));renderEdit();openOv("ovEdit")}
function renderEdit(){const h=ed.r.holes[ed.n]||{shots:[]},p=(course.holes[ed.n]||{}).par,k=strokesRecv(ed.n,ed.r);
  $("editSub").textContent=`Par ${p||"–"}`+(k?` · ${k} Vorgabeschl${k===1?"ag":"äge"}`:"")+(h.manual?" · korrigiert":"");
  $("eStrokes").textContent=ed.strokes;$("ePutts").textContent=ed.putts;
  const t=(h.shots||[]).length,pen=h.pen||0,calc=t+pen+(h.putts||0);
  const r2={...ed.r,holes:{...ed.r.holes,[ed.n]:{...h,strokes:ed.strokes}}},pt=sfPoints(ed.n,r2);
  $("eTrack").innerHTML=(t?`Getrackt: ${t} Schläge${pen?` + ${pen} Strafe`:""} + ${h.putts||0} Putts = <b>${calc}</b>`:"Auf diesem Loch nichts getrackt.")+(pt!=null?`<br>Mit Score ${ed.strokes}: <b>${pt} Stableford-Punkt${pt===1?"":"e"}</b>`:"");
  $("eReset").hidden=!t}
document.querySelectorAll("[data-es]").forEach(b=>b.onclick=()=>{const k=b.dataset.es,d=+b.dataset.d;
  if(k==="strokes"){ed.strokes=Math.max(1,Math.min(15,ed.strokes+d));if(ed.putts>ed.strokes)ed.putts=ed.strokes}
  else ed.putts=Math.max(0,Math.min(ed.strokes,ed.putts+d));renderEdit()});
function afterEdit(){if(ed.r!==round){recalcHist(ed.r);save(K.hist,hist)}else save(K.round,round);update();
  if(ed.back==="hist"){renderHist();openOv("ovHist")}else if(ed.back==="round"){renderRound();openOv("ovRound");setTab("round")}else closeOv()}
$("eSave").onclick=()=>{const r=ed.r;r.holes[ed.n]=r.holes[ed.n]||{shots:[],putts:0,strokes:null};const h=r.holes[ed.n];
  const calc=(h.shots.length?calcStrokes({...h,putts:ed.putts}):null);
  h.putts=ed.putts;h.strokes=ed.strokes;h.manual=calc==null||calc!==ed.strokes;afterEdit();toast("Loch "+ed.n+" gespeichert")};
$("eReset").onclick=()=>{const h=ed.r.holes[ed.n];if(!h)return;h.manual=false;h.strokes=calcStrokes(h)||null;afterEdit();toast("Aus Tracking berechnet")};
$("eClear").onclick=()=>{const h=ed.r.holes[ed.n];if(h){h.strokes=null;h.putts=0;h.manual=false}afterEdit();toast("Score für Loch "+ed.n+" entfernt")};
$("eCancel").onclick=()=>{if(ed.back==="hist"){openOv("ovHist")}else if(ed.back==="round"){openOv("ovRound");setTab("round")}else closeOv()};
document.addEventListener("click",e=>{const r=e.target.closest&&e.target.closest("[data-edit]");if(!r)return;const n=+r.dataset.edit;
  if(r.closest("#histTable"))openEdit(hist[histIdx],n,"hist");else if(r.closest("#roundTable"))openEdit(round,n,"round")});
function openReplay(i){const h=hist[i];if(!h)return;viewRound=h;target=null;closeOv();
  const[a,b]=range();let first=a;for(let n=a;n<=b;n++){const r=h.holes[n];if(r&&(r.shots&&r.shots.length||r.strokes)){first=n;break}}
  goHole(first);if(ui.view==="sat")focusHole()}
function closeReplay(){viewRound=null;target=null;const[a,b]=range();goHole(ui.hole<a||ui.hole>b?a:ui.hole);toast("Zurück zur laufenden Runde")}
$("replayClose").onclick=closeReplay;
$("replayEdit").onclick=()=>{if(viewRound)openEdit(viewRound,ui.hole,"map")};
document.addEventListener("click",e=>{const r=e.target.closest&&e.target.closest("[data-hist]");if(r)openHist(+r.dataset.hist)});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"||!e.target.dataset)return;if(e.target.dataset.hist!=null)openHist(+e.target.dataset.hist);else if(e.target.dataset.edit!=null)e.target.click()});
function renderReplay(){const on=!!viewRound;if(meMarker)meMarker.setOpacity(on?0:1);if(accCircle)accCircle.setStyle({opacity:on?0:1,fillOpacity:on?0:.08});$("replayBar").hidden=!on;$("liveActions").hidden=on;
  ["sugg","lastshot","hazards","target"].forEach(id=>$(id).hidden=on);document.querySelector(".dist").hidden=on;$("provBar").hidden=on||$("provBar").hidden;if(on)$("btnProv").hidden=true;
  if(!on)return;const h=viewRound,n=ui.hole,r=h.holes[n],p=(course.holes[n]||{}).par;
  $("replayTitle").textContent="Runde vom "+new Date(h.start).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"});
  const sfT=sfTotal(h);const tot=h.strokes?` · Gesamt ${h.strokes} (${h.vsPar>0?"+":""}${h.vsPar})`+(sfT!=null?` · ${sfT} Pkt`:""):"";
  $("replaySub").textContent=tot;
  if(!r||(!r.shots.length&&!r.strokes)){$("replayShots").innerHTML='<span class="none">Auf diesem Loch nichts getrackt</span>';return}
  const d=r.strokes&&p?r.strokes-p:null,ptR=sfPoints(n,h);
  const chips=r.shots.map(s=>{const w=s.lost?"weg":s.end?m(dist([s.lat,s.lon],s.end))+" m":"–";return`<span class="rchip${s.lost||s.ex?" x":""}"><b>${s.club}</b> ${w}</span>`});
  if(r.putts)chips.push(`<span class="rchip"><b>${r.putts}</b> Putt${r.putts>1?"s":""}</span>`);
  if(r.pen)chips.push(`<span class="rchip pen">+${r.pen} Strafe</span>`);
  $("replayShots").innerHTML=`<span class="rscore">${r.strokes||"–"}${d!=null?` <small>${d>0?"+"+d:d===0?"Par":d}${ptR!=null?` · ${ptR} Pkt`:""}${r.manual?" · korr.":""}</small>`:""}</span>`+chips.join('<span class="arr">›</span>')}
function sumR(a,b){let s=0;for(let i=a;i<=b;i++){const r=round.holes[i];if(r&&r.strokes)s+=r.strokes}return s}
let confirmNew=0;
$("newRound").onclick=()=>{if(viewRound)viewRound=null;if(Date.now()-confirmNew>4000){confirmNew=Date.now();$("newRound").textContent="Nochmal tippen zum Bestätigen";return}
  let s=0,p=0,pu=0,pl=0;for(const[i,r]of Object.entries(round.holes)){if(r.strokes){s+=r.strokes;pu+=r.putts||0;p+=(course.holes[i]||{}).par||0;pl++}}
  const hasShots=Object.values(round.holes).some(r=>r.shots.length);
  if(pl||hasShots){const ps=playSet(round);const e={start:round.start,course:COURSE_ID,mode:round.mode||"18",tee:ps.tee,hcpi:ps.hcpi,sex:ps.sex,played:pl,strokes:s,vsPar:s-p,putts:pu,holes:round.holes};e.sf=sfTotal(e);hist.push(e)}
  save(K.hist,hist);round=newRoundObj(round.mode);save(K.round,round);$("newRound").textContent="Runde abschließen & neue starten";
  goHole(range()[0]);renderRound();
  if(hist.length){$("bkSub").textContent=bkText()+" Deine Daten liegen nur auf diesem Handy. Sichere sie jetzt als Datei, dann sind sie auch nach einem Handywechsel oder gelöschten Browserdaten noch da.";openOv("ovBackup")}else toast("Neue Runde gestartet")};

function allShots(){const out=[];const add=hs=>{for(const r of Object.values(hs||{}))for(const s of r.shots||[])if(s.end&&s.club!=="Pt"&&!s.ex&&!s.lost&&!s.prov){const d=dist([s.lat,s.lon],s.end);if(d>=15)out.push({club:s.club,d})}};
  hist.forEach(h=>add(h.holes));add(round.holes);return out}
function renderBag(){const b=bag(),el=$("bagEdit");
  el.innerHTML=CLUB_GROUPS.map(([name,cl])=>`<div class="baggrp"><span>${name}</span><div class="bagchips">${cl.map(c=>`<button data-bag="${c}" aria-pressed="${b.includes(c)}" class="${b.includes(c)?"on":""}">${c}</button>`).join("")}</div></div>`).join("");
  const n=b.length+1;$("bagCount").innerHTML=`Dein Bag · <span style="color:${n>14?"var(--warn)":"inherit"}">${n} von 14</span> inkl. Putter`;
  el.querySelectorAll("[data-bag]").forEach(x=>x.onclick=()=>{const c=x.dataset.bag;let nb=bag();
    if(nb.includes(c)){if(nb.length<=1){toast("Mindestens ein Schläger muss im Bag sein");return}nb=nb.filter(y=>y!==c)}else nb=nb.concat([c]);
    ui.bag=ALL_CLUBS.filter(y=>nb.includes(y));save(K.ui,ui);buildClubGrid();renderBag();
    if(ui.bag.length+1>14)toast("Mehr als 14 Schläger: im Turnier nicht erlaubt")})}
function renderClubs(){
  const sh=allShots(),by={};sh.forEach(s=>(by[s.club]=by[s.club]||[]).push(s.d));
  const used=ALL_CLUBS.filter(c=>by[c]);
  if(!used.length){$("clubStats").innerHTML='<p class="note">Noch keine gemessenen Schläge. Auf dem Platz: vor jedem Schlag „Schlag von hier“, auf dem Grün „Auf dem Grün“ tippen oder direkt den nächsten Schlag markieren.</p>';return}
  const max=Math.max(...sh.map(s=>s.d))*1.05;
  const q=(a,p)=>{const s=a.slice().sort((x,y)=>x-y),i=(s.length-1)*p,lo=Math.floor(i);return s[lo]+(s[Math.ceil(i)]-s[lo])*(i-lo)};
  $("clubStats").innerHTML=used.map(c=>{const a=by[c],avg=a.reduce((x,y)=>x+y,0)/a.length,mx=Math.max(...a);
    const span=a.length>=4?`typisch ${m(q(a,.25))}–${m(q(a,.75))} m`:`${a.length} von 4 Schlägen für Spanne`;
    return`<div class="clubrow"><div class="c">${c}</div><div><div class="bar"><span style="width:${avg/max*100}%"></span><em style="left:${mx/max*100}%"></em></div><div class="span">${span}</div></div><div class="n"><b>${m(avg)} m</b>max ${m(mx)} · ${a.length}×</div></div>`}).join("");
}
// ---------- Spieler ----------
function syncRoundSettings(){if(viewRound)return;round.tee=teeKey();round.hcpi=ui.hcpi;round.sex=ui.sex||"m";save(K.round,round)}
function renderPlayer(){
  const inp=$("hcpiIn");if(document.activeElement!==inp)inp.value=ui.hcpi!=null?String(ui.hcpi).replace(".",","):"";
  document.querySelectorAll("[data-sex]").forEach(b=>{const on=b.dataset.sex===(ui.sex||"m");b.classList.toggle("sel",on);b.setAttribute("aria-checked",on)});
  $("teeSel").style.gridTemplateColumns=`repeat(${Math.min(6,Object.keys(RATINGS).length)},1fr)`;
  if(!$("teeSel").children.length){$("teeSel").innerHTML=Object.keys(RATINGS).map(k=>`<button data-tee="${k}">${TEE_LABELS[k]||k.toUpperCase()}</button>`).join("");
    $("teeSel").querySelectorAll("[data-tee]").forEach(b=>b.onclick=()=>{setTee(b.dataset.tee);save(K.ui,ui);syncRoundSettings();renderPlayer();update()})}
  document.querySelectorAll("[data-tee]").forEach(b=>b.classList.toggle("sel",b.dataset.tee===teeKey()));
  const t=teeKey(),R0=RATINGS[t],sx=ui.sex||"m",rt=R0[sx];
  $("teeNote").textContent=(COURSE_ID==="rheinhessen"?"A ist der hinterste, F der vorderste Abschlag. ":"")+"Course Rating und Slope bestimmen deine Spielvorgabe. Alle Distanzen misst die App ab deinem Standort.";
  $("teeInfo").innerHTML=`<span><b>${TEE_LABELS[t]||t.toUpperCase()}</b></span>`+(rt?`<span>CR <b>${rt[0].toFixed(1).replace(".",",")}</b></span><span>Slope <b>${rt[1]}</b></span>`:`<span>Kein ${sx==="w"?"Damen":"Herren"}-Rating für diesen Abschlag</span>`)+`<span>Par <b>${COURSE_PAR}</b></span><span>ca. <b>${R0.len.toLocaleString("de-DE")}</b> m</span>`;
  const r18={mode:"18",tee:t,hcpi:ui.hcpi,sex:sx,holes:{}},r9={mode:"f9",tee:t,hcpi:ui.hcpi,sex:sx,holes:{}};
  const c18=courseHcp(r18),c9=courseHcp(r9);
  $("phcp").innerHTML=c18==null?(ui.hcpi!=null&&!rt?'<span class="muted">Für diesen Abschlag gibt es kein Rating in deiner Wertung, daher keine Spielvorgabe und keine Stableford-Punkte.</span>':'<span class="muted">HCPI eintragen, dann rechnet die App Spielvorgabe und Stableford-Punkte.</span>'):`<div><span>Spielvorgabe 18 Löcher</span><b>${c18}</b></div><div><span>Spielvorgabe 9 Löcher</span><b>${c9}</b></div>`;
  $("tourneyIn").checked=!!ui.tourney;
  renderBag()}
$("tourneyIn").addEventListener("change",()=>{ui.tourney=$("tourneyIn").checked;save(K.ui,ui);update();toast(ui.tourney?"Turniermodus an: keine Schlägerempfehlung":"Turniermodus aus")});
$("hcpiIn").addEventListener("input",()=>{const v=$("hcpiIn").value.trim().replace(",",".");
  if(v===""){ui.hcpi=null}else{const x=parseFloat(v);if(isNaN(x)||x<-10||x>54){$("hcpiIn").classList.add("bad");return}ui.hcpi=Math.round(x*10)/10}
  $("hcpiIn").classList.remove("bad");save(K.ui,ui);syncRoundSettings();renderPlayer();update()});
document.querySelectorAll("[data-sex]").forEach(b=>b.onclick=()=>{ui.sex=b.dataset.sex;save(K.ui,ui);syncRoundSettings();renderPlayer();update()});
function renderCourses(){$("courseSel").innerHTML=Object.values(COURSES).map(c=>`<button data-course="${c.id}" role="radio" aria-checked="${c.id===COURSE_ID}" class="${c.id===COURSE_ID?"sel":""}"><b>${c.name}</b><span>${c.place||""} · ${Object.keys(c.holes).length} Löcher · Par ${c.par}</span></button>`).join("");
  $("courseSel").querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>{const id=b.dataset.course;if(id===COURSE_ID)return;
    ui.course=id;save(K.ui,ui);toast(COURSES[id].name+" wird geladen …");setTimeout(()=>location.reload(),300)})}
function renderSetup(){renderCourses();$("osmCourse").textContent=COURSE.name+(COURSE.place?` (${COURSE.place})`:"");$("bkInfo").textContent=bkText();
  const nh=Object.values(course.holes).filter(h=>h.greenC||h.greenPoly).length;
  $("setupSub").textContent=course.src?`Quelle: ${course.src} · ${nh} von 18 Grüns · ${course.hazards.length} Hindernisse`:"Noch keine Platzdaten geladen.";
  document.querySelectorAll("#tools button").forEach(b=>b.classList.toggle("sel",b.dataset.tool===tool&&tool!==""));
}
document.querySelectorAll("#tools button").forEach(b=>b.onclick=()=>{tool=b.dataset.tool;$("editbadge").hidden=!tool;$("editbadge").textContent=tool?b.textContent:"";
  if(tool!=="pos"&&tool==="")manualPos=false;renderSetup();if(tool){closeOv();if(ui.view!=="sat")setView("sat");update()}});
$("editbadge").onclick=()=>{tool="";$("editbadge").hidden=true;update()};

// ---------- OpenStreetMap-Import ----------
const OVERPASS=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
const sandboxed=(()=>{try{return window.top!==window.self||/claude\.ai|claudeusercontent|anthropic/.test(location.host)}catch(e){return true}})();
const [GLA,GLO]=COURSE_GUESS;
// Eine einzige Abfrage: Golfplätze im Umkreis + alle Golf-Objekte innerhalb dieser Plätze
const QUERY=`[out:json][timeout:40];(way[leisure=golf_course](around:7000,${GLA},${GLO});relation[leisure=golf_course](around:7000,${GLA},${GLO}););out geom;map_to_area->.a;(way[golf](area.a);relation[golf](area.a);node[golf=pin](area.a);way[natural=water](area.a);way[natural=sand](area.a););out geom;`;
const queryUrl=u=>u+"?data="+encodeURIComponent(QUERY);
let osmBBox=[GLA-.015,GLO-.02,GLA+.015,GLO+.02]; // [S,W,N,E], wird per Nominatim verfeinert
const mapUrl=b=>`https://api.openstreetmap.org/api/0.6/map?bbox=${b[1].toFixed(5)},${b[0].toFixed(5)},${b[3].toFixed(5)},${b[2].toFixed(5)}`;
async function timedFetch(url,opt,ms){const ac=new AbortController(),to=setTimeout(()=>ac.abort(),ms);try{return await fetch(url,{...opt,signal:ac.signal})}finally{clearTimeout(to)}}
async function findCourse(log){
  for(const q of COURSE.search||[COURSE.name]){
    try{const r=await timedFetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=de&q="+encodeURIComponent(q),{},15000);
      if(!r.ok){log(`Suche: HTTP ${r.status}`);continue}
      const res=await r.json();const hit=res.find(x=>x.type==="golf_course")||res.find(x=>x.category==="leisure");
      if(hit){const b=hit.boundingbox.map(Number);osmBBox=[b[0]-.002,b[2]-.003,b[1]+.002,b[3]+.003];log(`Platz gefunden: ${hit.name||hit.display_name.split(",")[0]}`);return true}}
    catch(e){log("Suche: keine Antwort")}}
  log(`Platz nicht per Suche gefunden, nutze Umgebung ${COURSE.place||COURSE.name}`);return false}
function xmlToElements(txt){
  const doc=new DOMParser().parseFromString(txt,"text/xml");if(doc.querySelector("parsererror"))throw new Error("Kein gültiges OSM-XML");
  const nodes={},ways={},out=[];const tags=el=>{const t={};el.querySelectorAll(":scope>tag").forEach(x=>t[x.getAttribute("k")]=x.getAttribute("v"));return t};
  doc.querySelectorAll("osm>node").forEach(n=>{const id=n.getAttribute("id"),p={lat:+n.getAttribute("lat"),lon:+n.getAttribute("lon")};nodes[id]=p;const t=tags(n);if(t.golf)out.push({type:"node",lat:p.lat,lon:p.lon,tags:t})});
  doc.querySelectorAll("osm>way").forEach(w=>{const g=[...w.querySelectorAll(":scope>nd")].map(nd=>nodes[nd.getAttribute("ref")]).filter(Boolean);const t=tags(w);ways[w.getAttribute("id")]=g;if(Object.keys(t).length)out.push({type:"way",tags:t,geometry:g})});
  doc.querySelectorAll("osm>relation").forEach(r=>{const t=tags(r);if(!t.golf&&!t.leisure&&!t.natural)return;
    const members=[...r.querySelectorAll(":scope>member")].filter(mm=>mm.getAttribute("type")==="way"&&ways[mm.getAttribute("ref")]).map(mm=>({type:"way",role:mm.getAttribute("role"),geometry:ways[mm.getAttribute("ref")]}));
    if(members.length)out.push({type:"relation",tags:t,members})});
  return{elements:out}}
async function loadViaOsmApi(log){
  await findCourse(log);$("osmLink").href=mapUrl(osmBBox);
  try{log("OpenStreetMap: lade Kartendaten …");const r=await timedFetch(mapUrl(osmBBox),{},60000);
    if(!r.ok){log(`OpenStreetMap: HTTP ${r.status}${r.status===400?" (Gebiet zu groß)":r.status===509?" (Limit erreicht)":""}`);return null}
    const d=xmlToElements(await r.text());log(`OpenStreetMap: OK, ${d.elements.length} Objekte`);return d}
  catch(e){log("OpenStreetMap: "+(e.name==="AbortError"?"Zeitüberschreitung":"keine Antwort ("+e.message+")"));return null}}
async function overpass(log){
  const d=await loadViaOsmApi(log);if(d&&d.elements.some(e=>e.tags&&e.tags.leisure==="golf_course"))return d;
  for(const u of OVERPASS){const host=new URL(u).host;
    try{log(`${host}: frage an …`);const r=await timedFetch(u,{method:"POST",body:"data="+encodeURIComponent(QUERY),headers:{"Content-Type":"application/x-www-form-urlencoded"}},45000);
      if(r.ok){const j=await r.json();log(`${host}: OK, ${j.elements.length} Objekte`);return j}
      log(`${host}: HTTP ${r.status}`)}
    catch(e){log(`${host}: ${e.name==="AbortError"?"Zeitüberschreitung":"keine Antwort ("+e.message+")"}`)}}
  if(d)return d;
  throw new Error(sandboxed?"In Claude blockiert: Öffne die App über deinen eigenen Link.":"Kein OSM-Server erreichbar. Details stehen im Tab „Platz“.")}
const geom=el=>el.geometry?el.geometry.map(g=>[g.lat,g.lon]):el.members?el.members.filter(m=>m.role!=="inner"&&m.geometry).flatMap(m=>m.geometry.map(g=>[g.lat,g.lon])):null;
function applyOsm(d){
  const els=d.elements||[];
  const courses=els.filter(e=>e.tags&&e.tags.leisure==="golf_course").map(e=>({e,g:geom(e)})).filter(o=>o.g&&o.g.length>2);
  if(!courses.length)throw new Error("Kein Golfplatz in den OSM-Daten gefunden");
  const pick=courses.find(o=>new RegExp(COURSE.match||COURSE.name,"i").test(o.e.tags.name||""))||courses.sort((a,b)=>dist(COURSE_GUESS,centroid(a.g))-dist(COURSE_GUESS,centroid(b.g)))[0];
  const lats=pick.g.map(p=>p[0]),lons=pick.g.map(p=>p[1]);
  const bb=[Math.min(...lats)-.002,Math.min(...lons)-.003,Math.max(...lats)+.002,Math.max(...lons)+.003];
  const inBB=p=>p[0]>=bb[0]&&p[0]<=bb[2]&&p[1]>=bb[1]&&p[1]<=bb[3];
  const holes={},greens=[],hazards=[],fairways=[];
  for(const el of els){const t=el.tags||{};if(t.leisure==="golf_course")continue;const g=el.type==="node"?[[el.lat,el.lon]]:geom(el);if(!g||!g.length||!inBB(g[0]))continue;
    if(t.golf==="hole"){const ref=parseInt(t.ref);if(ref>=1&&ref<=18)holes[ref]={line:g,par:+t.par||null,hcp:+t.handicap||null}}
    else if(t.golf==="green")greens.push(g);
    else if(t.golf==="fairway")fairways.push(g);
    else if(t.golf==="bunker"||t.natural==="sand")hazards.push({type:"bunker",poly:g});
    else if(/water_hazard/.test(t.golf||"")||t.natural==="water")hazards.push({type:"water",poly:g});}
  const used=new Set();
  for(const h of Object.values(holes)){const end=h.line[h.line.length-1];let bi=-1,bd=80;
    greens.forEach((g,i)=>{if(used.has(i))return;const dd=nearestOnPoly(end,g);if(dd<bd){bd=dd;bi=i}});
    if(bi>=0){used.add(bi);h.greenPoly=greens[bi]}h.tee=h.line[0];
    h.fairways=fairways.filter(f=>distToLine(centroid(f),h.line)<40)}
  for(const[n,old]of Object.entries(course.holes)){holes[n]=holes[n]||{};for(const k of["greenC","greenF","greenB"])if(old[k])holes[n][k]=old[k];if(old.par&&!holes[n].par)holes[n].par=old.par;if(!holes[n].tee&&old.tee)holes[n].tee=old.tee}
  const nH=Object.keys(holes).filter(k=>holes[k].line).length;
  course={holes,hazards:hazards.concat(course.hazards.filter(z=>z.pt)),bbox:[[bb[0],bb[1]],[bb[2],bb[3]]],src:`OpenStreetMap (${pick.e.tags.name||"Golfplatz"})`};
  applyCard();save(K.course,course);drawCourse();drawHole();update();renderSetup();
  toast(nH?`${nH} Löcher, ${greens.length} Grüns, ${hazards.length} Hindernisse geladen`:`Platzumriss gefunden, aber keine Löcher in OSM – bitte Grüns selbst setzen`);
  if(!nH)map.fitBounds(course.bbox);else focusHole();
}
$("osmLink").href=mapUrl(osmBBox);
$("loadOsm").onclick=async()=>{
  const btn=$("loadOsm"),lg=$("osmLog");btn.textContent="Lade …";btn.disabled=true;lg.hidden=false;lg.textContent="";
  const log=t=>{lg.textContent+=(lg.textContent?"\n":"")+t};
  try{applyOsm(await overpass(log))}catch(e){toast(e.message||"Laden fehlgeschlagen")}
  btn.textContent="Platzdaten neu laden";btn.disabled=false;
};

// ---------- Export/Import ----------
// Backup holds every course: hole data and the running round per course, plus shared history and settings
function exportObj(){const courses={};for(const id of Object.keys(COURSES)){const sx=id==="rheinhessen"?"":"_"+id;
    courses[id]=id===COURSE_ID?{course,round}:{course:load("wb_course_v1"+sx,null),round:load("wb_round_v1"+sx,null)}}
  return{app:"wissberg-caddie",version:3,saved:new Date().toISOString(),course,round,courseId:COURSE_ID,courses,hist,ui}}
function daysAgo(t){return Math.floor((Date.now()-t)/864e5)}
function bkText(){if(!ui.lastBackup)return hist.length?"Noch nie gesichert.":"Noch keine Sicherung.";const d=daysAgo(ui.lastBackup);return "Letzte Sicherung "+(d===0?"heute":d===1?"gestern":`vor ${d} Tagen`)+"."}
function needsBackup(){const newest=Math.max(0,...hist.map(h=>h.start||0),round.start||0);return hist.length>0&&(!ui.lastBackup||ui.lastBackup<newest&&daysAgo(ui.lastBackup)>=0)}
function renderBackupHint(){const show=needsBackup();$("bkHint").hidden=!show;if(show)$("bkHintTxt").textContent=bkText()+" Neue Runden sind noch nicht gesichert."}
async function saveFile(){const txt=JSON.stringify(exportObj()),name=`wissberg-caddie-${new Date().toISOString().slice(0,10)}.json`;
  const done=()=>{ui.lastBackup=Date.now();save(K.ui,ui);renderBackupHint();if(!$("ovSetup").hidden)renderSetup()};
  try{const file=new File([txt],name,{type:"application/json"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Wißberg Caddie Sicherung"});done();toast("Sicherung erstellt");return true}}
  catch(e){if(e&&e.name==="AbortError"){toast("Sicherung abgebrochen");return false}}
  try{const url=URL.createObjectURL(new Blob([txt],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);done();toast("Datei "+name+" gespeichert");return true}
  catch(e){toast("Speichern als Datei klappt hier nicht. Nutze „Daten kopieren“.");return false}}
function importData(o){if(o.elements){applyOsm(o);return}
  if(!o.course&&!o.round&&!o.hist&&!o.courses)throw new Error("leer");
  if(o.courses){for(const[id,v]of Object.entries(o.courses)){if(!COURSES[id]||id===COURSE_ID||!v)continue;const sx=id==="rheinhessen"?"":"_"+id;if(v.course)save("wb_course_v1"+sx,v.course);if(v.round)save("wb_round_v1"+sx,v.round)}
    const mine=o.courses[COURSE_ID];if(mine){if(mine.course)course=mine.course;if(mine.round)round=mine.round}}
  else{if(o.course)course=o.course;if(o.round)round=o.round}if(o.hist)hist=o.hist;if(o.ui){const keep={hole:ui.hole,view:ui.view,seenHelp:true,course:COURSE_ID};ui=Object.assign({},o.ui,keep)}
  viewRound=null;applyCard();save(K.course,course);save(K.round,round);save(K.hist,hist);save(K.ui,ui);buildClubGrid();drawCourse();drawHole();update();renderSetup();toast("Daten übernommen: "+hist.length+" Runden")}
$("fileSave").onclick=saveFile;
$("bkNow").onclick=async()=>{if(await saveFile())closeOv()};
$("bkLater").onclick=()=>{renderRound();openOv("ovRound");setTab("round")};
$("bkHintBtn").onclick=saveFile;
$("fileLoadBtn").onclick=()=>$("fileLoad").click();
$("fileLoad").onchange=()=>{const f=$("fileLoad").files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{try{const raw=String(rd.result).trim();if(raw.startsWith("<"))applyOsm(xmlToElements(raw));else importData(JSON.parse(raw))}catch(e){toast("Die Datei ist keine gültige Sicherung")}$("fileLoad").value=""};rd.readAsText(f)};
$("exportBtn").onclick=async()=>{const t=JSON.stringify(exportObj());ui.lastBackup=Date.now();save(K.ui,ui);$("ioText").value=t;try{await navigator.clipboard.writeText(t);toast("In die Zwischenablage kopiert")}catch(e){$("ioText").select();toast("Text markiert – bitte kopieren")}};
$("importBtn").onclick=()=>{try{const raw=$("ioText").value.trim();if(raw.startsWith("<")){applyOsm(xmlToElements(raw));return}const o=JSON.parse(raw);importData(o)}catch(e){toast("Kein gültiger Export im Textfeld")}};

// ---------- Toast ----------
let tt;function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,Math.max(2600,t.length*70))}

// ---------- Start ----------
drawCourse();drawHole();setView(ui.view||"hole");update();
$("openHelp").onclick=()=>openOv("ovHelp");
if(!ui.seenHelp){ui.seenHelp=true;save(K.ui,ui);openOv("ovHelp")}
else if(!course.src)setTimeout(()=>toast("Erst einmal im Tab „Platz“ die Platzdaten laden"),1200);
})();
