const $=s=>document.querySelector(s),CW=110,CH=150,BASE=105,PW=1240;
const K=Math.min(3,Math.max(2,Math.ceil(window.devicePixelRatio||1))),Q=2; // K: Schärfe der Eingabe, Q: Schärfe der fertigen Seite
const CHARS=`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüÄÖÜß0123456789.,!?:;-()"'`;
const CAND=`Hallo Wasser Schule Zeitung Frühling Sommer Herbst Winter Straße Brücke Küche Mädchen Öffnung Übung Ärger Österreich Ägypten Übermut Fußball Gruß Maß Spaß Quelle Quark Qualität Xylophon Yacht Zebra Jacke Fuchs Vogel Katze Hund Pferd Bäcker Löwe Zähne Möbel Käse Wörter Tüte Größe Füße Süßigkeit Blume Garten Zimmer Tisch Stuhl Fenster Lampe Buch Heft Stift Papier Computer Telefon Wetter Regen Schnee Sonne Wolke Himmel Berlin Hamburg München Köln Frankfurt Stuttgart Dresden Leipzig Nürnberg Bremen Düsseldorf Jahr Monat Woche Montag Dienstag Mittwoch Donnerstag Freitag Samstag Sonntag Januar Februar März April Mai Juni Juli August September Oktober November Dezember Freund Familie Mutter Vater Bruder Schwester Kinder Liebe Glück Zukunft Vergangenheit Wirklichkeit Jugend Erfahrung Wissenschaft Experiment Physik Chemie Zitrone Orange Banane Kartoffel Tomate Gurke Zwiebel Pilze Brot Butter Marmelade Kaffee Milch Zucker Wunsch bequem Frequenz Aquarium Hexe Examen Taxi Text extra Mixer Typ Gymnasium Handy System Dank! Bitte, wie?  Name: gut; so-so (Test) "Ja" ist's 2024 10:30 3,50 0123456789 (987) 8.7.6. Hallo! Wirklich? Gesundheit, Prost! `;
function makeWords(){const need={};for(const c of CHARS)need[c]=3;
const cand=CAND.split(/\s+/).filter(w=>w&&[...w].length<=9&&[...w].every(c=>CHARS.includes(c)));const out=[];
for(;;){let b=null,bs=0;for(const w of cand){if(out.includes(w))continue;const t={};let sc=0;for(const c of w){t[c]=(t[c]||0)+1;if(t[c]<=need[c])sc++}if(sc>bs){bs=sc;b=w}}
if(!b)break;out.push(b);for(const c of b)need[c]--}
let rest='';for(const c of CHARS)for(let k=0;k<need[c];k++)rest+=c;
for(let i=0;i<rest.length;i+=6)out.push(rest.slice(i,i+6));return out}

let S={fonts:[],bgs:[]},dir=null,tm;
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('hwconv',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function dbGet(k){const d=await idb();return new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}
async function dbSet(k,v){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
const save=()=>{clearTimeout(tm);tm=setTimeout(async()=>{try{await dbSet('state',S);$('#sv').textContent='';folderSave()}catch(e){$('#sv').textContent='Speichern fehlgeschlagen – bitte Sicherung erstellen.'}},250)};
async function loadDB(){try{let d=await dbGet('state');if(!d){try{d=JSON.parse(localStorage.getItem('hw')||'null')}catch(e){}}if(d){S.fonts=d.fonts||[];S.bgs=d.bgs||[]}dir=await dbGet('dir')||null}catch(e){}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
async function wf(d,n,data){const h=await d.getFileHandle(n,{create:true}),w=await h.createWritable();await w.write(data);await w.close()}
async function folderSave(){if(!dir)return;try{if(await dir.queryPermission({mode:'readwrite'})!='granted')return;
await wf(dir,'handschrift-converter-daten.json',JSON.stringify(S));
const bd=await dir.getDirectoryHandle('Hintergruende',{create:true});
for(const b of S.bgs)await wf(bd,b.name.replace(/[^\w\- äöüÄÖÜß]/g,'_')+'.jpg',await(await fetch(b.d)).blob());
$('#dm').textContent='Im Ordner „'+dir.name+'“ gespeichert.'}catch(e){$('#dm').textContent='Ordner nicht beschreibbar – bitte neu verbinden.'}}
$('#dp').onclick=async()=>{if(!window.showDirectoryPicker){$('#dm').textContent='Nur in Chrome oder Edge am PC möglich.';return}
try{if(dir)await dir.requestPermission({mode:'readwrite'});if(!dir||await dir.queryPermission({mode:'readwrite'})!='granted'){dir=await showDirectoryPicker({mode:'readwrite'});await dbSet('dir',dir)}await folderSave()}catch(e){$('#dm').textContent='Abgebrochen.'}};
$('#dl').onclick=async()=>{try{const f=await(await dir.getFileHandle('handschrift-converter-daten.json')).getFile();imp(await f.text())}catch(e){$('#dm').textContent='Keine Datei im verbundenen Ordner gefunden.'}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
const rnd=(a,b)=>a+Math.random()*(b-a);
// Alle Schieberegler erhalten ein synchronisiertes Zahlenfeld.
function setupRangeNumbers(){
 document.querySelectorAll('input[type="range"]').forEach(range=>{
  const num=document.createElement('input');num.type='number';num.className='range-number';
  for(const attr of ['min','max','step'])if(range.hasAttribute(attr))num.setAttribute(attr,range.getAttribute(attr));
  num.value=range.value;num.setAttribute('aria-label',(range.closest('label')?.textContent||range.id).trim()+' als Zahl');
  const wrap=document.createElement('span');wrap.className='range-pair';range.parentNode.insertBefore(wrap,range);wrap.append(range,num);
  range.addEventListener('input',()=>{num.value=range.value});
  num.addEventListener('change',()=>{
   let v=Number(num.value);if(!Number.isFinite(v))v=Number(range.value);
   const min=Number(range.min||0),max=Number(range.max||100),step=Number(range.step||1);
   v=Math.max(min,Math.min(max,v));if(step>0)v=min+Math.round((v-min)/step)*step;
   range.value=String(Math.max(min,Math.min(max,v)));num.value=range.value;
   range.dispatchEvent(new Event('input',{bubbles:true}));range.dispatchEvent(new Event('change',{bubbles:true}));
  });
 });
}
setupRangeNumbers();
// Einstellungen der Schreiben-Seite werden pro Gerät gemerkt.
const SET_IDS=['txt','fsel','bsel','size','lh','ws','rnd','col','mt','ml','mr','mb','boff','exportformat','autofrac'];
let want={},setTm;
try{want=JSON.parse(localStorage.getItem('hc-settings')||'{}')||{}}catch(e){}
for(const id of SET_IDS){const el=$('#'+id);if(!el||el.tagName==='SELECT'||want[id]===undefined)continue;if(el.type==='checkbox')el.checked=!!want[id];else el.value=want[id];if(el.type==='range')el.dispatchEvent(new Event('input'))}
function saveSettings(){clearTimeout(setTm);setTm=setTimeout(()=>{for(const id of SET_IDS){const el=$('#'+id);if(el&&!(el.tagName==='SELECT'&&!el.value))want[id]=el.type==='checkbox'?el.checked:el.value}try{localStorage.setItem('hc-settings',JSON.stringify(want))}catch(e){}},300)}
for(const id of SET_IDS){const el=$('#'+id);if(el){el.addEventListener('input',saveSettings);el.addEventListener('change',saveSettings)}}
// Stabilisierung wird pro Gerät gespeichert, ohne die Handschrift-Daten zu verändern.
try{const settings=JSON.parse(localStorage.getItem('hc-stabilizer')||'{}');
 if(typeof settings.enabled==='boolean')$('#stabilize').checked=settings.enabled;
 if(Number.isFinite(settings.strength)){$('#stability').value=Math.max(0,Math.min(100,settings.strength));$('#stability').dispatchEvent(new Event('input'));}
}catch(e){}
function saveStabilizer(){try{localStorage.setItem('hc-stabilizer',JSON.stringify({enabled:$('#stabilize').checked,strength:+$('#stability').value}))}catch(e){}}
$('#stabilize').addEventListener('change',saveStabilizer);
$('#stability').addEventListener('input',saveStabilizer);


document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x==b));['write','fonts','bgs'].forEach(t=>$('#'+t).classList.toggle('hide',t!=b.dataset.t))});

const switchTab=t=>document.querySelector(`.tabs button[data-t="${t}"]`)?.click();
const done=f=>Object.values(f.slots).reduce((a,s)=>a+s.filter(Boolean).length,0),total=f=>f.words.reduce((a,w)=>a+[...w].length,0);
function lists(){
const fs=$('#fsel'),bs=$('#bsel'),pf=fs.value,pb=bs.value,hasOpt=(sel,v)=>!!v&&[...sel.options].some(o=>o.value===v);
fs.innerHTML=[...BI,...S.fonts].map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')||'<option value="">– keine –</option>';
bs.innerHTML=[['dotted','Gepunktet'],['plain','Weiß'],['lined','Liniert'],['grid','Kariert'],...S.bgs.map(b=>[b.id,b.name])].map(([v,n])=>`<option value="${v}">${esc(n)}</option>`).join('');
if(hasOpt(fs,want.fsel))fs.value=want.fsel;else if(hasOpt(fs,pf))fs.value=pf;
if(hasOpt(bs,want.bsel))bs.value=want.bsel;else if(hasOpt(bs,pb))bs.value=pb;else bs.value='dotted';
$('#flist').innerHTML=S.fonts.map(f=>`<div class="row"><b>${esc(f.name)}</b><small>${done(f)} von ${total(f)} Zeichen geschrieben</small><button data-a="edit" data-id="${f.id}">Weiterschreiben</button><button data-a="rename" data-id="${f.id}">Umbenennen</button><button data-a="del" data-id="${f.id}">Löschen</button></div>`).join('')||'<small>Noch keine Handschrift angelegt.</small>';
$('#blist').innerHTML=S.bgs.map(b=>`<div><img class="th" src="${b.d}"><br><small>${esc(b.name)}</small><br><button data-ba="rename" data-bid="${b.id}">Umbenennen</button><button data-ba="del" data-bid="${b.id}">Löschen</button></div>`).join('')}
$('#flist').onclick=e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.a=='edit')edit(b.dataset.id);
else if(b.dataset.a=='rename'){
const f=S.fonts.find(x=>x.id==b.dataset.id);if(!f)return;
const name=prompt('Neuer Name der Handschrift:',f.name);
if(name===null)return;
if(!name.trim()){alert('Bitte einen Namen eingeben.');return}
f.name=name.trim();save();lists();
}
else if(b.dataset.arm){S.fonts=S.fonts.filter(f=>f.id!=b.dataset.id);if(ed&&ed.f.id==b.dataset.id){ed=null;$('#ed').classList.add('hide')}save();lists()}
else{b.dataset.arm=1;b.textContent='Wirklich löschen?';setTimeout(()=>{delete b.dataset.arm;b.textContent='Löschen'},4000)}};
$('#blist').onclick=e=>{const b=e.target.closest('button');if(!b)return;
const bg=S.bgs.find(x=>x.id==b.dataset.bid);if(!bg)return;
if(b.dataset.ba=='rename'){
const name=prompt('Neuer Name des Papiers:',bg.name);
if(name===null)return;
if(!name.trim()){alert('Bitte einen Namen eingeben.');return}
bg.name=name.trim();
}else if(b.dataset.ba=='del')S.bgs=S.bgs.filter(x=>x.id!=b.dataset.bid);
save();lists()};
$('#bf').onchange=async e=>{for(const f of e.target.files){const im=await loadImg(URL.createObjectURL(f));if(!im)continue;const sc=Math.min(1,1600/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);S.bgs.push({id:'b'+Date.now()+(Math.random()*1e6|0),name:f.name.replace(/\.\w+$/,''),d:c.toDataURL('image/jpeg',.82)})}save();lists();e.target.value=''};
$('#nf').onclick=()=>{const f={id:'f'+Date.now(),name:$('#fname').value.trim()||'Meine Schrift',words:makeWords(),slots:{}};S.fonts.push(f);$('#fname').value='';save();lists();edit(f.id)};

/* Editor */
let ed=null,cur=null,missingSession=null;const ink=$('#ink'),gd=$('#gd');
const XS='aceimnorsuvwxzäöü',DS='gjpqy',TS='bdfhklABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß0123456789!?',DL='ijäöüÄÖÜ',DOT={i:1,j:1,ä:2,ö:2,ü:2,Ä:2,Ö:2,Ü:2,':':1,';':1,'!':1,'?':1,'"':1},TX=48,TA=84;

function edit(id,startingIndex=null){const f=S.fonts.find(x=>x.id==id);if(!f)return;const i=f.words.findIndex((w,k)=>!f.slots[k]);ed={f,i:startingIndex===null?(i<0?0:i):startingIndex,st:[]};$('#ed').classList.remove('hide');show();$('#ed').scrollIntoView()}
// Sonderzeichen erhalten genauso wie Buchstaben drei unabhängig gespeicherte Schreibproben.
const isSpecial=ch=>/[\p{P}\p{S}]/u.test(ch);
function addMissingToFont(f,chars){
 const entries=[];
 for(const ch of new Set(chars)){
  if(/\s/u.test(ch))continue;
  let have=counts(f)[ch]||0;
  // Vorhandene unbeschriebene Ein-Zeichen-Felder zuerst verwenden.
  for(let k=0;k<f.words.length&&have<3;k++){
   if(f.words[k]!==ch||f.slots[k]?.[0])continue;
   entries.push({ch,idx:k});have++;
  }
  while(have<3){const idx=f.words.length;f.words.push(ch);entries.push({ch,idx});have++}
 }
 return entries;
}
function missingForText(f,txt){const c=counts(f);return [...new Set([...txt].filter(ch=>
 !(/\s/u.test(ch)) && (isSpecial(ch)?(c[ch]||0)<3:!c[ch]&&!c[ch.toLowerCase()]&&!c[ch.toUpperCase()])
))]}
function nextMissingTask(f,chars){return f.words.findIndex((w,k)=>chars.includes(w)&&!(f.slots[k]||[])[0]);}
function beginMissing(){const f=S.fonts.find(x=>x.id==$('#fsel').value);if(!f)return;
 const missing=missingForText(f,dtext());if(!missing.length){render();return}
 const entries=addMissingToFont(f,missing);if(!entries.length)return;
 missingSession={id:f.id,chars:missing};save();lists();switchTab('fonts');edit(f.id,entries[0].idx);
 $('#msg').textContent='';
}
$('#addmissing').onclick=beginMissing;
$('#backtowrite').onclick=()=>{commit();ed=null;$('#ed').classList.add('hide');missingSession=null;lists();switchTab('write');render()};
function guides(){const{f,i}=ed,w=[...f.words[i]],g=gd.getContext('2d'),sc=ed.sc||1,lw=1/sc,fs=Math.round(Math.min(34,Math.max(14,13/sc)));
g.setTransform(K,0,0,K,0,0);g.clearRect(0,0,gd.width,gd.height);g.strokeStyle='#8886';g.fillStyle='#888';g.font=fs+'px sans-serif';g.setLineDash([]);g.lineWidth=lw;
w.forEach((c,k)=>{g.strokeRect(k*CW+lw/2,lw/2,CW-lw,CH-lw);g.beginPath();g.moveTo(k*CW,BASE);g.lineTo(k*CW+CW,BASE);g.stroke();g.fillText(c,k*CW+6,fs+2)});
g.setLineDash([3/sc,4/sc]);g.beginPath();for(let k=0;k<w.length;k++){g.moveTo(k*CW,BASE-TX);g.lineTo(k*CW+CW,BASE-TX)}g.stroke();g.setLineDash([])}
// Bereits gespeicherte Zeichen blass als Vorschau anzeigen (nur Anzeige, nicht Teil der neuen Eingabe).
let dsTok=0;
async function drawSaved(){if(!ed)return;const tok=++dsTok,{f,i}=ed,s=f.slots[i];if(!s)return;const imgs=[];
 for(const q of s){if(!q){imgs.push(null);continue}IC[q.d]=IC[q.d]||await loadImg(q.d);imgs.push(IC[q.d])}
 if(tok!==dsTok||!ed||ed.f!==f||ed.i!==i)return;const g=gd.getContext('2d');g.save();g.setTransform(K,0,0,K,0,0);g.globalAlpha=.28;
 imgs.forEach((im,j)=>{const q=s[j];if(im&&q)g.drawImage(im,j*CW+(CW-q.w)/2,BASE+q.dy+(q.pb??2)-q.h,q.w,q.h)});g.restore()}
function mark(st){guides();const g=gd.getContext('2d');g.setTransform(1,0,0,1,0,0);g.strokeStyle='#e11';g.lineWidth=2*K;for(const s of st)for(const b of s.b)g.strokeRect(s.i*CW*K+b[0]-5,b[1]-5,b[2]-b[0]+10,b[3]-b[1]+10)}
// Die Schreibfläche wird so skaliert, dass das längste Wort der Handschrift ohne Scrollen auf die Breite passt.
function layout(){if(!ed)return;const n=[...ed.f.words[ed.i]].length,avail=$('#writing-scroll').clientWidth||320,mx=Math.max(1,...ed.f.words.map(x=>[...x].length)),sc=Math.min(1,avail/(mx*CW));ed.sc=sc;ed.avail=avail;
 const cv=$('#cv'),bar=$('#cellbar');cv.style.width=n*CW*sc+'px';cv.style.height=CH*sc+'px';bar.style.width=n*CW*sc+'px';bar.querySelectorAll('button').forEach(b=>b.style.width=CW*sc+'px')}
function relayout(){if(!ed||$('#ed').classList.contains('hide'))return;const w=$('#writing-scroll').clientWidth;if(w===ed.avail)return;layout();guides();drawSaved()}
window.addEventListener('resize',relayout);if(window.ResizeObserver)new ResizeObserver(relayout).observe($('#writing-scroll'));
function head(){const{f,i}=ed,ch=f.words[i],special=isSpecial(ch)&&[...ch].length===1;const variant=special?f.words.slice(0,i+1).filter(w=>w===ch).length:0;
$('#wt').textContent=`${special?'Sonderzeichen '+ch+' – Variante '+variant+' von '+Math.max(3,f.words.filter(w=>w===ch).length):'Wort '+(i+1)+' von '+f.words.length+': '+ch}${f.slots[i]?'  (✓ gespeichert – nur neu geschriebene Zeichen ersetzen die alten)':''}`;
$('#wj').innerHTML=f.words.map((x,k)=>`<option value="${k}">${f.slots[k]?'✓ ':''}${k+1}. ${esc(x)}</option>`).join('');$('#wj').value=i}
function show(){const{f,i}=ed,n=[...f.words[i]].length;ed.st=[];
ink.width=gd.width=n*CW*K;ink.height=gd.height=CH*K;
$('#cellbar').innerHTML=[...f.words[i]].map((c,j)=>`<button type="button" data-j="${j}" title="Zeichen „${esc(c)}“ löschen" aria-label="Zeichen ${esc(c)} löschen">✕</button>`).join('');
layout();$('#writing-scroll').scrollLeft=0;guides();drawSaved();head();cover()}
// Einzelnes Zeichen im aktuellen Wort löschen (gespeichert und frisch geschrieben), ohne das Wort neu zu schreiben.
const cellOf=(st,n)=>{const xs=st.points.map(p=>p[0]);return Math.min(n-1,Math.max(0,Math.floor((Math.min(...xs)+Math.max(...xs))/2/(CW*K))))};
function clearCell(j){if(!ed)return;const f=ed.f,i=ed.i,n=[...f.words[i]].length,s=f.slots[i];let had=false;
 ed.st=ed.st.filter(st=>{if(cellOf(st,n)===j){had=true;return false}return true});
 if(s&&s[j]){s[j]=null;had=true;if(!s.some(Boolean))delete f.slots[i];save();lists()}
 redraw();guides();drawSaved();head();cover();$('#msg').textContent=had?'Zeichen „'+[...f.words[i]][j]+'“ gelöscht.':'Hier ist nichts zu löschen.'}
$('#cellbar').onclick=e=>{const b=e.target.closest('button');if(b)clearCell(+b.dataset.j)};
// Alle Schreibproben eines Zeichens löschen; hinzugefügte Sonderzeichen werden ganz aus der Handschrift entfernt.
function removeChar(ch){commit();const f=ed.f,keep=[],slots={};let ni=null;
 f.words.forEach((w,k)=>{const cs=[...w],sl=f.slots[k]?f.slots[k].slice():null;if(sl)cs.forEach((c,j)=>{if(c===ch)sl[j]=null});
  if(k===ed.i)ni=keep.length;
  if(cs.length===1&&cs[0]===ch&&!CHARS.includes(ch))return;
  const idx=keep.length;keep.push(w);if(sl&&sl.some(Boolean))slots[idx]=sl});
 f.words=keep;f.slots=slots;ed.i=Math.max(0,Math.min(keep.length-1,ni??0));save();lists();show()}
function counts(f){const c={};f.words.forEach((w,k)=>{const s=f.slots[k];[...w].forEach((ch,j)=>{if(s&&s[j])c[ch]=(c[ch]||0)+1})});return c}
function cover(){const c=counts(ed.f);$('#cov').innerHTML=[...new Set([...CHARS,...ed.f.words.flatMap(w=>[...w])])].map(ch=>`<span class="chip ${(c[ch]||0)>=3?'ok':''}" data-ch="${esc(ch)}" title="Antippen: Zeichen löschen">${esc(ch)} ${c[ch]||0}</span>`).join('')}
$('#cov').onclick=e=>{const c=e.target.closest('.chip');if(!c||!ed)return;const ch=c.dataset.ch,n=counts(ed.f)[ch]||0,extra=!CHARS.includes(ch);if(!n&&!extra)return;
 if(!confirm(n?`Alle ${n} gespeicherten Schreibproben von „${ch}“ löschen?`+(extra?' Das Zeichen wird aus dieser Handschrift entfernt.':''):`Zeichen „${ch}“ aus dieser Handschrift entfernen?`))return;removeChar(ch)};
const pt=e=>{const r=ink.getBoundingClientRect();return[(e.clientX-r.left)*ink.width/r.width,(e.clientY-r.top)*ink.height/r.height]};
// Glättung als adaptiver Tiefpass: geringere Verzögerung bei schnellen Bewegungen.
// Rohpunkte bleiben erhalten; geglättet wird nur der gezeichnete Strich.
function smoothStroke(points,strength){
 if(strength<=0||points.length<3)return points;
 const smoothing=strength/100,slowAlpha=1-.88*smoothing;
 const result=[points[0].slice()];
 for(let i=1;i<points.length;i++){
  const prev=result[result.length-1],raw=points[i];
  const distance=Math.hypot(raw[0]-prev[0],raw[1]-prev[1])/K;
  const alpha=Math.min(1,slowAlpha+Math.min(.65,distance*.023)*(1-slowAlpha));
  result.push([prev[0]+alpha*(raw[0]-prev[0]),prev[1]+alpha*(raw[1]-prev[1])]);
 }
 // Am Strichende den Zielpunkt erreichen, ohne einen geraden Verbindungssprung zu erzeugen.
 const tail=Math.min(8,result.length-1),last=points[points.length-1],r=result[result.length-1];
 const dx=last[0]-r[0],dy=last[1]-r[1];
 for(let j=1;j<=tail;j++){const idx=result.length-tail-1+j,t=j/tail;
  result[idx][0]+=dx*t*t;result[idx][1]+=dy*t*t;}
 return result;
}
let activePointer=null,penSeen=false;
ink.onpointerdown=e=>{if(e.pointerType==='pen')penSeen=true;if(!ed||activePointer!==null||(penSeen&&e.pointerType==='touch'))return;e.preventDefault();activePointer=e.pointerId;ink.setPointerCapture(e.pointerId);cur=[pt(e)];ed.st.push({points:cur,stability:$('#stabilize').checked?+$('#stability').value:0});redraw()};
ink.onpointermove=e=>{if(!cur||e.pointerId!==activePointer)return;e.preventDefault();
 (e.getCoalescedEvents?e.getCoalescedEvents():[e]).forEach(v=>cur.push(pt(v)));redraw()};
function finishStroke(e){if(e.pointerId!==activePointer)return;cur=null;activePointer=null;redraw()}
ink.onpointerup=finishStroke;ink.onpointercancel=finishStroke;
function redraw(){const g=ink.getContext('2d');g.clearRect(0,0,ink.width,ink.height);g.lineCap=g.lineJoin='round';g.strokeStyle=g.fillStyle='#111';g.lineWidth=+$('#pen').value*K;
for(const stroke of ed.st){const s=smoothStroke(stroke.points,stroke.stability);
if(s.length<2){g.beginPath();g.arc(s[0][0],s[0][1],g.lineWidth/2,0,7);g.fill();continue}
g.beginPath();g.moveTo(...s[0]);for(let k=1;k<s.length-1;k++){g.quadraticCurveTo(s[k][0],s[k][1],(s[k][0]+s[k+1][0])/2,(s[k][1]+s[k+1][1])/2)}g.lineTo(...s[s.length-1]);g.stroke()}}
$('#pen').oninput=()=>ed&&redraw();
$('#un').onclick=()=>{if(ed){ed.st.pop();redraw()}};
$('#cl').onclick=()=>{if(ed){ed.st=[];redraw()}};

/* Zusammenhängende Striche finden (8er-Nachbarschaft) */
function comps(d,w,h){const lab=new Int32Array(w*h),out=[];let n=0;
for(let s=0;s<w*h;s++){if(lab[s]||d[s*4+3]<=20)continue;n++;const st=[s],px=[];let x0=w,y0=h,x1=-1,y1=-1;lab[s]=n;
while(st.length){const p=st.pop();px.push(p);const x=p%w,y=(p/w)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const q=ny*w+nx;if(!lab[q]&&d[q*4+3]>20){lab[q]=n;st.push(q)}}}
out.push({px,x0,y0,x1,y1})}
return out}
/* Ein Zeichen verarbeiten: fremde Punkte finden/entfernen, Originalgröße bewahren und auf die Grundlinie setzen.
   cv = Zellen-Canvas (CW*kk x CH*kk, Grundlinie bei BASE*kk) */
// Aus der Buchstabenform und den Hilfslinien die passende Grundlinie erkennen.
// Die Ausrichtung nutzt die Form statt die absolute Lage des gezeichneten Buchstabens:
// so werden versehentlich höher/tiefer geschriebene Zeichen korrigiert.
function detectBaselineOffset(data,W,H,components,ch,kk){
 const bottom=Math.max(...components.map(c=>c.y1))/kk;
 const height=(Math.max(...components.map(c=>c.y1))-Math.min(...components.map(c=>c.y0))+1)/kk;
 // Satzzeichen haben ihre eigene vertikale Lage relativ zur Grundlinie.
 if('.,'.includes(ch))return ch===','?Math.min(11,height*.55):0;
 if(ch===';'||ch===':')return ch===';'?Math.min(10,height*.3):0;
 if(ch==='_' )return Math.min(10,height*.4);
 if('-–—=+~<>×÷'.includes(ch))return Math.max(-TX-8,Math.min(8,bottom-BASE));
 if('*^°'.includes(ch))return Math.max(-BASE+10,Math.min(-TX*.5,bottom-BASE));
 if(ch==="'"||ch==='’'||ch==='`'||ch==='"'||ch==='“'||ch==='”'||ch==='^'||ch==='°')return -Math.max(30,Math.min(55,BASE*.35));
 // Unterlängen: Erkenne den Übergang vom Buchstabenkörper zum Abstrich anhand
 // der Breite der Tinte je Zeile. Bei schmalen Abstrichen ist die Grundlinie
 // dort, wo der breite Körper endet, und nicht am untersten Tintenpixel.
 if('gjpqy'.includes(ch)){
  const rows=new Int32Array(H);
  let minY=H,maxY=0;
  for(const c of components){minY=Math.min(minY,c.y0);maxY=Math.max(maxY,c.y1);for(const pix of c.px)rows[(pix/W)|0]++}
  const total=maxY-minY+1;
  const from=Math.round(minY+total*.42),to=Math.round(minY+total*.86);
  let best=-1,score=-Infinity;
  for(let y=from;y<=to;y++){
   const upper=rows[Math.max(0,y-Math.round(5*kk))],lower=rows[Math.min(H-1,y+Math.round(5*kk))];
   const scoreNow=(upper-lower)*1.5 + rows[y]*.3 - Math.abs(y-(minY+total*.67))*.1;
   if(scoreNow>score){score=scoreNow;best=y}
  }
  // Fehlt ein erkennbarer Übergang, wird eine typische Unterlänge verwendet.
  const candidate=best>=0?best/kk:bottom-height*.23;
  const extension=bottom-candidate;
  return extension>3&&extension<height*.65?extension:Math.min(height*.28,28);
 }
 // Bei allen normalen Zeichen ruht die Unterkante auf derselben Grundlinie.
 return 0;
}
function process(cv,ch,kk,rm,norm){
const W=cv.width,H=cv.height,g=cv.getContext('2d'),im=g.getImageData(0,0,W,H),d=im.data,cs=comps(d,W,H);
if(!cs.length)return{g:null,strays:[]};
cs.sort((a,b)=>b.px.length-a.px.length);
const lim=12*kk,ex=cs.slice(1).filter(c=>Math.max(c.x1-c.x0,c.y1-c.y0)+1<=lim),al=DOT[ch]??(isSpecial(ch)&&!'.,'.includes(ch)?3:0),strays=ex.slice(al);
let keep=cs;
if(rm&&strays.length){for(const c of strays)for(const p of c.px)d[p*4+3]=0;g.putImageData(im,0,0);keep=cs.filter(c=>!strays.includes(c))}
const dots=DL.includes(ch)?ex.slice(0,al):[],body=keep.filter(c=>!dots.includes(c));
const box=a=>a.reduce((r,c)=>[Math.min(r[0],c.x0),Math.min(r[1],c.y0),Math.max(r[2],c.x1),Math.max(r[3],c.y1)],[W,H,-1,-1]);
const F=box(keep),B=box(body.length?body:keep),pad=2*kk;
const x0=Math.max(0,F[0]-pad),y0=Math.max(0,F[1]-pad),x1=Math.min(W-1,F[2]+pad),y1=Math.min(H-1,F[3]+pad),w=x1-x0+1,h=y1-y0+1;
// Originale Zeichenabmessungen pixelgenau erhalten. Beim Speichern wird
// ausschließlich die Grundlinienlage (dy) berechnet, niemals die Form skaliert.
const dy=detectBaselineOffset(d,W,H,keep,ch,kk);
const o=document.createElement('canvas');o.width=w;o.height=h;
o.getContext('2d').drawImage(cv,x0,y0,w,h,0,0,w,h);
return{g:{d:o.toDataURL(),w:w/kk,h:h/kk,dy,pb:(y1-F[3])/kk},strays}}
function grab(){const rm=true,nm=true,arr=[],st=[];
[...ed.f.words[ed.i]].forEach((ch,i)=>{const t=document.createElement('canvas');t.width=CW*K;t.height=CH*K;t.getContext('2d').drawImage(ink,i*CW*K,0,CW*K,CH*K,0,0,CW*K,CH*K);
const r=process(t,ch,K,rm,nm);arr.push(r.g);if(r.strays.length)st.push({i,ch,n:r.strays.length,b:r.strays.map(c=>[c.x0,c.y0,c.x1,c.y1])})});
return{arr,st}}
function commit(){if(!ed||!ed.st.length)return 0;const r=grab(),old=ed.f.slots[ed.i]||[];
ed.f.slots[ed.i]=r.arr.map((g,j)=>g||old[j]||null);save();lists();return r.st.reduce((a,s)=>a+s.n,0)}
function go(k){if(!ed)return;let n=commit();
if(missingSession?.id===ed.f.id&&k>ed.i){const idx=nextMissingTask(ed.f,missingSession.chars);if(idx>=0)k=idx}
ed.i=Math.max(0,Math.min(ed.f.words.length-1,k));show();$('#msg').textContent=n?n+' fremde(r) Punkt(e) automatisch entfernt.':''}
$('#nx').onclick=()=>go(ed.i+1);$('#pv').onclick=()=>go(ed.i-1);$('#wj').onchange=e=>go(+e.target.value);
$('#dn').onclick=()=>{if(!ed)return;commit();ed=null;$('#ed').classList.add('hide');lists();if(missingSession){missingSession=null;switchTab('write');render()}};

/* Erfasste Tintenpixel pro Ausgabeseite, getrennt vom Papier.
   Die Bildabtastung erzeugt radierbare kurze Stiftobjekte statt einer Textur. */
let GN_PAGES=[];
function gnVectorize(canvas,H){
 // Nur Mittellinien nachzeichnen, keine waagerechten Bildstreifen als Stiftobjekte.
 const w=620,h=Math.max(2,Math.round(H*w/PW));
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true});
 g.drawImage(canvas,0,0,w,h);
 const rgba=g.getImageData(0,0,w,h).data,ink=new Uint8Array(w*h);
 let left=w,top=h,right=0,bottom=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const k=y*w+x;if(rgba[k*4+3]>=58){ink[k]=1;
   if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
  }
 }
 if(right<=left||bottom<=top)return [];
 const offsets=[-w,-w+1,1,w+1,w,w-1,-1,-w-1];
 let del=[];
 for(let round=0;round<30;round++){
  let changed=false;
  for(let phase=0;phase<2;phase++){
   del=[];
   for(let y=Math.max(1,top);y<=Math.min(h-2,bottom);y++)for(let x=Math.max(1,left);x<=Math.min(w-2,right);x++){
    const k=y*w+x;if(!ink[k])continue;
    const n=offsets.map(d=>ink[k+d]);
    const sum=n.reduce((a,v)=>a+v,0);
    if(sum<2||sum>6)continue;
    let changes=0;for(let j=0;j<8;j++)if(n[j]===0&&n[(j+1)%8]===1)changes++;
    if(changes!==1)continue;
    if(phase===0){if(n[0]&&n[2]&&n[4]||n[2]&&n[4]&&n[6])continue;}
    else if(n[0]&&n[2]&&n[6]||n[0]&&n[4]&&n[6])continue;
    del.push(k);
   }
   if(del.length){changed=true;for(const k of del)ink[k]=0;}
  }
  if(!changed)break;
 }
 const degree=new Uint8Array(w*h),nodes=[];
 for(let y=Math.max(1,top);y<=Math.min(h-2,bottom);y++)for(let x=Math.max(1,left);x<=Math.min(w-2,right);x++){
  const k=y*w+x;if(!ink[k])continue;
  let v=0;for(const d of offsets)if(ink[k+d])v++;
  degree[k]=v;nodes.push(k);
 }
 const used=new Set(),paths=[];
 const edge=(a,b)=>String(Math.min(a,b))+','+String(Math.max(a,b));
 function walk(start,next){
  let prev=start,cur=next,seq=[start,next];used.add(edge(start,next));
  while(degree[cur]===2&&seq.length<3500){
   const opts=offsets.map(d=>cur+d).filter(k=>ink[k]&&k!==prev);
   if(!opts.length)break;
   const n=opts[0],key=edge(cur,n);if(used.has(key))break;
   used.add(key);seq.push(n);prev=cur;cur=n;
  }
  if(seq.length<4)return;
  const result=[],scaleX=PW/w,scaleY=H/h;
  for(const k of seq){
   const px=(k%w+.5)*scaleX,py=(Math.floor(k/w)+.5)*scaleY;
   if(!result.length||Math.hypot(px-result[result.length-1][0],py-result[result.length-1][1])>=1.25)
    result.push([px,py]);
  }
  if(result.length>=2)paths.push(result);
 }
 for(const k of nodes)if(degree[k]!==2){
  for(const d of offsets){const n=k+d;if(!ink[n]||used.has(edge(k,n)))continue;walk(k,n);}
 }
 for(const k of nodes)for(const d of offsets){const n=k+d;
  if(ink[n]&&!used.has(edge(k,n)))walk(k,n);
 }
 return paths.sort((a,b)=>a[0][1]-b[0][1]||a[0][0]-b[0][0]);
}
function gnLetterPage(bg,H){const c=document.createElement('canvas');c.width=1224;c.height=1584;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
 const s=Math.min(c.width/bg.width,c.height/bg.height);g.drawImage(bg,(c.width-bg.width*s)/2,(c.height-bg.height*s)/2,bg.width*s,bg.height*s);
 return c.toDataURL('image/jpeg',.87);
}
function gnThumbnail(page){const c=document.createElement('canvas');c.width=320;c.height=450;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
 const s=Math.min(c.width/page.width,c.height/page.height);g.drawImage(page,(c.width-page.width*s)/2,(c.height-page.height*s)/2,page.width*s,page.height*s);
 return c.toDataURL('image/jpeg',.82);
}

/* Mathe-Satz: \frac{a}{b}, 1/2, \sqrt{x}, \sqrt[3]{x}, x^2, x_1, Symbole */
const MSYM={cdot:'·',times:'×',div:'÷',pm:'±',mp:'∓',neq:'≠',ne:'≠',leq:'≤',le:'≤',geq:'≥',ge:'≥',approx:'≈',infty:'∞',pi:'π',alpha:'α',beta:'β',gamma:'γ',delta:'δ',Delta:'Δ',theta:'θ',lambda:'λ',mu:'μ',sigma:'σ',omega:'ω',Omega:'Ω',phi:'φ',sum:'∑',prod:'∏',int:'∫',to:'→',rightarrow:'→',leftarrow:'←',Rightarrow:'⇒',Leftrightarrow:'⇔',degree:'°',ldots:'…',cdots:'…'};
const SUPD={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'},VULG={'½':[1,2],'¼':[1,4],'¾':[3,4],'⅓':[1,3],'⅔':[2,3]};
const chs=t=>[...t].map(c=>({t:'ch',c}));
const mk=c=>c==='·'||c==='•'?{t:'ch',c:'.',mid:1}:c==='−'?{t:'ch',c:'-'}:{t:'ch',c};
const CEN='-–—=+×÷±≈<>≤≥≠';
function mparse(src,auto){let i=0;const isAl=c=>/[\p{L}\p{N}]/u.test(c||'');
 const closeAt=o=>{let d=0;for(let j=o;j<src.length;j++){if(src[j]==='(')d++;else if(src[j]===')'&&--d===0)return j}return -1};
 function seq(stop){const o=[];while(i<src.length&&src[i]!==stop)o.push(atom());return o}
 function arg(){while(src[i]===' ')i++;if(src[i]==='{'){i++;const n=seq('}');if(src[i]==='}')i++;return n}
  if(i>=src.length)return[];const o=[];if((src[i]==='-'||src[i]==='+')&&isAl(src[i+1])){o.push({t:'ch',c:src[i]});i++}o.push(base());return o}
 function base(){const c=src[i];
  if(/\s/.test(c)){i++;return{t:'sp'}}
  if(c==='\\'){let j=i+1;if(/[a-zA-Z]/.test(src[j]||''))while(/[a-zA-Z]/.test(src[j]||''))j++;else j++;const name=src.slice(i+1,j);i=j;
   if(/^[dt]?frac$/.test(name)){const n=arg(),d=arg();return{t:'frac',n,d}}
   if(name==='sqrt'){let idx=null;if(src[i]==='['){const e=src.indexOf(']',i);if(e>0){idx=mparse(src.slice(i+1,e),false);i=e+1}}return{t:'sqrt',b:arg(),idx}}
   if(name==='text'||name==='mathrm')return{t:'grp',n:arg()};
   if(name==='left'||name==='right')return{t:'nop'};
   if(/^(quad|qquad|space|[,;:! ])$/.test(name))return{t:'gap'};
   if(MSYM[name])return mk(MSYM[name]);
   return name.length===1?{t:'ch',c:name}:{t:'grp',n:chs(name)}}
  if(c==='{'){i++;const n=seq('}');if(src[i]==='}')i++;return{t:'grp',n}}
  if(c==='√'){i++;if(src[i]==='('){const e=closeAt(i);if(e>0){const n=mparse(src.slice(i+1,e),auto);i=e+1;return{t:'sqrt',b:n,idx:null}}}
   const m=/^\d+(?:[.,]\d+)?|^\p{L}/u.exec(src.slice(i));if(m){i+=m[0].length;return{t:'sqrt',b:chs(m[0]),idx:null}}return{t:'ch',c:'√'}}
  if(VULG[c]){i++;return{t:'frac',n:chs(''+VULG[c][0]),d:chs(''+VULG[c][1])}}
  if(auto&&/\d/.test(c)&&!/[\p{L}\p{N}.,\/]/u.test(src[i-1]||'')){const m=/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)(?![\p{L}\p{N}\/])/u.exec(src.slice(i));if(m){i+=m[0].length;return{t:'frac',n:chs(m[1]),d:chs(m[2])}}}
  const cp=String.fromCodePoint(src.codePointAt(i));i+=cp.length;return mk(cp)}
 function atom(){const n=base();if(n.t==='sp')return n;
  for(;;){const c=src[i],nx=src[i+1];
   if((c==='^'&&nx!==undefined&&(isAl(nx)||'{-+\\'.includes(nx)))||(c==='_'&&nx!==undefined&&(isAl(nx)||'{\\'.includes(nx)))){i++;const a=arg();if(c==='^')n.sup=(n.sup||[]).concat(a);else n.sub=(n.sub||[]).concat(a);continue}
   if(c&&SUPD[c]){i++;n.sup=(n.sup||[]).concat([{t:'ch',c:SUPD[c]}]);continue}
   break}
  return n}
 return seq(null)}
function mchars(txt,auto){let out='';const w=ns=>{for(const n of ns||[]){if(n.t==='ch')out+=n.c;for(const k of['n','d','b','idx','sup','sub'])if(n[k])w(n[k])}};for(const p of txt.split('\n'))w(mparse(p,auto));return out}
const dtext=()=>mchars($('#txt').value,$('#autofrac').checked);
$('#mathbar').onmousedown=e=>e.preventDefault();
$('#mathbar').onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=$('#txt'),ins=b.dataset.i,st=t.selectionStart,en=t.selectionEnd,sel=t.value.slice(st,en),k=ins.indexOf('▮'),text=ins.replace('▮',k>=0?sel:''),pos=st+(k>=0?k+sel.length:text.length);
 t.setRangeText(text,st,en,'end');t.focus();t.setSelectionRange(pos,pos);t.dispatchEvent(new Event('input',{bubbles:true}))};
/* Rendern */
const IC={};
async function variants(f){const V={};for(const[k,w]of f.words.entries()){const s=f.slots[k];if(!s)continue;for(const[j,ch]of[...w].entries()){const g=s[j];if(!g)continue;IC[g.d]=IC[g.d]||await loadImg(g.d);if(IC[g.d])(V[ch]=V[ch]||[]).push({...g,img:IC[g.d]})}}return V}
function paper(c,type,H,lh,m,bg){const g=c.getContext('2d');g.scale(Q,Q);g.fillStyle='#ffffff';g.fillRect(0,0,PW,H);if(bg){g.drawImage(bg,0,0,PW,H);return}
// Schreibgrundlinien liegen bei m.t + n*lh (n=1,2,...). Linien und Punktreihen liegen genau darauf.
if(type=='lined'){g.strokeStyle='#a9c1da';g.lineWidth=1.5;g.beginPath();for(let y=m.t+lh;y<=H-m.b+1;y+=lh){g.moveTo(m.l-20,y+.75);g.lineTo(PW-m.r+20,y+.75)}g.stroke()}
if(type=='grid'){g.strokeStyle='#a9c1da';g.lineWidth=1.5;g.beginPath();const st=lh/2;for(let y=m.t;y<H;y+=st){g.moveTo(0,y);g.lineTo(PW,y)}for(let x=0;x<PW;x+=st){g.moveTo(x,0);g.lineTo(x,H)}g.stroke()}
if(type=='dotted'){
 // Quadratisches Punktraster: Abstand waagerecht = senkrecht = Zeilenhöhe.
 // Wächst die Zeilenhöhe, wachsen auch die Spalten. Jede Schreibzeile steht auf einer Punktreihe.
 const st=lh,r=Math.max(1.2,Math.min(2,st/24));g.fillStyle='#aeb2b8';
 for(let y=m.t;y<=H-m.b+1;y+=st)for(let x=m.l;x<=PW-m.r+1;x+=st){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
}}
function showMissing(f,chars){
 const panel=$('#missingpanel'),list=$('#missingchars');
 if(!chars.length){panel.classList.add('hide');return}
 const cc=counts(f);list.textContent=chars.map(c=>isSpecial(c)?`${c} (${cc[c]||0}/3 Varianten)`:c===' '?'[Leerzeichen]':c).join('  ');
 $('#addmissing').disabled=!!f.builtin;
 $('#addmissing').textContent=f.builtin?'Eigene Handschrift wählen':'Fehlende Zeichen jetzt schreiben';
 $('#missinghint').textContent=f.builtin?'Eingebaute Handschriften können nicht bearbeitet werden. Lege unter „Handschriften“ eine eigene an.':'Fehlende Zeichen kannst du ergänzen. Für jedes Sonderzeichen stehen drei unabhängig gespeicherte Varianten zur Verfügung; bereits geschriebene bleiben erhalten.';
 panel.classList.remove('hide');
}
async function render(){
GN_PAGES=[];const btn=$('#go'),out=$('#pages');$('#exportbar').classList.add('hide');$('#missingpanel').classList.add('hide');btn.disabled=true;btn.textContent='Schreibe …';out.innerHTML='';
try{
await ready;const f=[...BI,...S.fonts].find(x=>x.id==$('#fsel').value);
if(!f){out.textContent='Bitte zuerst unter „Handschriften“ eine Handschrift anlegen.';return}
const V=await variants(f);if(!Object.keys(V).length){out.textContent='Diese Handschrift enthält noch keine Zeichen.';if(!f.builtin)showMissing(f,missingForText(f,dtext()));return}
const bsel=$('#bsel').value,bgd=S.bgs.find(b=>b.id==bsel),bgImg=bgd?await loadImg(bgd.d):null;
const PH=bgImg?Math.round(PW*bgImg.height/bgImg.width):1754;
const s=+$('#size').value/100,lh=CH*s*$('#lh').value/100,R=+$('#rnd').value/100,wsb=+$('#ws').value/100;
const m={t:+$('#mt').value,l:+$('#ml').value,r:+$('#mr').value,b:+$('#mb').value},RM=PW-m.r;
const BO=+$('#boff').value||0,ruled=!bgd&&['dotted','lined','grid'].includes(bsel);
const pages=[],last={},miss=new Set();let ctx,y;
const newPage=()=>{const c=document.createElement('canvas');c.width=PW*Q;c.height=PH*Q;pages.push(c);ctx=c.getContext('2d');ctx.scale(Q,Q);ctx.imageSmoothingQuality='high';y=m.t+lh};
const pick=ch=>{const a=V[ch]||V[ch.toLowerCase()]||V[ch.toUpperCase()];if(!a){miss.add(ch);return null}let i=0;if(a.length>1){do i=Math.random()*a.length|0;while(i===last[ch])}last[ch]=i;return a[i]};
// Boxen: Maße relativ zur Grundlinie (y positiv = nach unten). Zeichen behalten immer ihre Größe (nur Unter-/Hochzahlen sind kleiner).
const vjb=(ruled?.07:.12)*lh;
// Strichbreite der eigenen Handschrift schätzen (Fläche / halber Umfang), damit Bruchstrich und Wurzel gleich dick wirken.
const PEN=(()=>{const ws=[];for(const ch of 'lIitHT1'){const a=V[ch];if(!a)continue;const g=a[0],W=g.img.naturalWidth,H=g.img.naturalHeight;if(!W||!H)continue;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(g.img,0,0);const d=x.getImageData(0,0,W,H).data,on=(xx,yy)=>xx>=0&&yy>=0&&xx<W&&yy<H&&d[(yy*W+xx)*4+3]>=128;let A=0,P=0;
 for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){if(!on(xx,yy))continue;A++;if(!on(xx-1,yy)||!on(xx+1,yy)||!on(xx,yy-1)||!on(xx,yy+1))P++}if(P)ws.push(2*A/P*g.w/W)}
 ws.sort((a,b)=>a-b);return ws.length?ws[ws.length>>1]:5})();
// Handgezeichneter Strich: Zwischenpunkte mit leichter Biegung, Zittern und wechselnder Strichstärke.
const hand=(pts,lw,S)=>{const out=[],ws=[],ph=rnd(0,6);
 for(let k=0;k<pts.length-1;k++){const[x1,y1]=pts[k],[x2,y2]=pts[k+1],dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,n=Math.max(2,Math.round(len/(5*S))),bow=rnd(-1,1)*len*.022;
  for(let j=k?1:0;j<=n;j++){const t=j/n,e=(j===0||j===n)?.3:1,o=bow*Math.sin(Math.PI*t)+rnd(-1,1)*(1.1+1.4*R)*S*e;out.push([x1+dx*t+nx*o,y1+dy*t+ny*o]);ws.push(lw*(.9+.2*Math.sin(ph+out.length*.8)))}}
 return{k:'l',pts:out,ws,lw}};
const mv=(b,dx,dy)=>b.items.map(p=>p.k==='g'?{...p,x:p.x+dx,y:p.y+dy}:{...p,pts:p.pts.map(q=>[q[0]+dx,q[1]+dy])});
const mbox=(nodes,sc)=>{let x=0,asc=0,desc=0,math=false;const items=[],S=s*sc,lw=Math.max(1.2,PEN*s*Math.max(sc,.8));
 const put=(b,dx,dy)=>{items.push(...mv(b,dx,dy));asc=Math.max(asc,b.asc-dy);desc=Math.max(desc,b.desc+dy);if(b.math)math=true};
 for(const n of nodes){
  if(n.t==='sp'){x+=60*S*wsb;continue}
  if(n.t==='gap'){x+=18*S;continue}
  if(n.t==='nop')continue;
  let nb,gp=0;
  if(n.t==='ch'){const g=pick(n.c);gp=(3+rnd(-10,16)*R)*S;
   if(g){const pb=g.pb??2,hh=g.h*S,ax=.5*TX*S,mid=n.mid||CEN.includes(n.c),a=rnd(-9,9)*R*Math.PI/180,v=rnd(-vjb,vjb)*sc*R;
    // Minus, Mal-Punkt und Rechenzeichen stehen mittig auf Höhe der Kleinbuchstaben, nicht auf der Grundlinie.
    nb=mid?{w:g.w*S,asc:ax+hh/2,desc:Math.max(0,hh/2-ax),items:[{k:'g',g,x:0,y:-ax+hh/2-(g.dy+pb)*S,S,a,v}]}
          :{w:g.w*S,asc:Math.max(0,(g.h-g.dy-pb)*S),desc:Math.max(0,(g.dy+pb)*S),items:[{k:'g',g,x:0,y:0,S,a,v}]}}
   else nb={w:20*S,asc:0,desc:0,items:[]}}
  else if(n.t==='grp')nb=mbox(n.n,sc);
  else if(n.t==='frac'){const f=sc*.85,a=mbox(n.n,f),d=mbox(n.d,f),ax=.5*TX*S,gap=6*S,pad=4*S,w=Math.max(a.w,d.w)+2*pad,wob=0;
   nb={w,asc:ax+gap+a.desc+a.asc,desc:Math.max(0,d.asc+d.desc+gap-ax),math:true,items:[hand([[rnd(0,1.5)*S,-ax+rnd(-1.8,1.8)*S*(1+R)],[w-rnd(0,1.5)*S,-ax+rnd(-1.8,1.8)*S*(1+R)]],lw,S)]};
   nb.items.push(...mv(a,(w-a.w)/2,-(ax+gap+a.desc)),...mv(d,(w-d.w)/2,-ax+gap+d.asc))}
  else if(n.t==='sqrt'){const b=mbox(n.b,sc),yt=-(b.asc+4*S),yb=b.desc+2*S,h=yb-yt,sw=Math.min(28*S,Math.max(10*S,.45*h));let ib=null,sx=0;
   if(n.idx){ib=mbox(n.idx,sc*.5);sx=Math.max(0,ib.w-.3*sw)}
   const E=sx+sw+b.w+5*S;
   nb={w:E,asc:-yt,desc:yb,math:true,items:[hand([[sx,yt+.62*h],[sx+.1*sw,yt+.55*h],[sx+.32*sw,yb],[sx+sw+rnd(-.5,.5)*S,yt+rnd(-.5,.5)*S],[E+rnd(0,2)*S,yt+rnd(-1.5,.5)*S]],lw,S)]};
   nb.items.push(...mv(b,sx+sw+2*S,0));if(ib)nb.items.push(...mv(ib,0,yt+.5*h))}
  else continue;
  put(nb,x,0);let adv=nb.w;
  if(n.sup||n.sub){math=true;const S2=sc*.65,sb=n.sup&&mbox(n.sup,S2),bb=n.sub&&mbox(n.sub,S2),sx=x+nb.w+S;
   if(sb)put(sb,sx,-Math.max(.5*TA*S,nb.asc*.6));
   if(bb)put(bb,sx,Math.max(.22*TA*S,nb.desc*.5+.1*TA*S));
   adv=nb.w+S+Math.max(sb?sb.w:0,bb?bb.w:0)}
  x+=adv+gp}
 return{w:x,asc,desc,items,math}};
// Phase 1: Wörter (und Formeln) in Zeilen umbrechen
const lines=[];let cl,x,x0;
const newLine=()=>{cl={words:[],sl:ruled?0:rnd(-1,1)*.006*R,by:ruled?0:rnd(-2,2)*R,lhf:ruled?1:1+rnd(-.04,.04)*R,asc:0,desc:0,math:false};x0=m.l+rnd(0,.5)*lh*R;x=x0};
const fin=()=>{lines.push(cl);newLine()};
newLine();
const auto=$('#autofrac').checked;
for(const para of $('#txt').value.split('\n')){
 const words=[[]];for(const n of mparse(para,auto)){if(n.t==='sp')words.push([]);else words[words.length-1].push(n)}
 for(const nodes of words){if(!nodes.length)continue;if(nodes.length===1&&nodes[0].t==='ch'&&nodes[0].c==='.')nodes[0].mid=1;
  const wy=rnd(-1,1)*(ruled?.05:.09)*lh*R,box=mbox(nodes,1);
  if(x+box.w>RM&&x>x0+1)fin();
  cl.words.push({box,x,wy});if(box.math){cl.math=true;cl.asc=Math.max(cl.asc,box.asc);cl.desc=Math.max(cl.desc,box.desc)}
  x+=box.w+60*s*wsb*(1+rnd(-.45,.8)*R*1.3)}
 fin()}
// Phase 2: Zeilen auf die Seiten setzen. Formelzeilen bekommen bei Bedarf mehr Platz (auf Linienpapier ganze Zeilen).
newPage();let prev=null;
const drawBox=(b,ox,by,sl,wy)=>{for(const p of b.items){
 if(p.k==='g'){const g=p.g,S=p.S,w=g.w*S,h=g.h*S,X=ox+p.x,gy=by+p.y+wy+sl*(X-m.l)+(g.dy+(g.pb??2))*S-h+BO+p.v;
  ctx.save();if(R){ctx.translate(X+w/2,gy+h);ctx.rotate(p.a);ctx.drawImage(g.img,-w/2,-h,w,h)}else ctx.drawImage(g.img,X,gy,w,h);ctx.restore()}
 else{ctx.save();ctx.strokeStyle='#111';ctx.lineCap=ctx.lineJoin='round';
  const q=p.pts.map(([px,py])=>{const X=ox+px;return[X,by+py+wy+sl*(X-m.l)+BO]});
  for(let j=1;j<q.length;j++){ctx.lineWidth=p.ws?p.ws[j]:p.lw;ctx.beginPath();ctx.moveTo(q[j-1][0],q[j-1][1]);ctx.lineTo(q[j][0],q[j][1]);ctx.stroke()}ctx.restore()}
 ctx.canvas.dirty=1}};
for(const L of lines){
 if(prev){let adv=lh*L.lhf;
  if(L.math||prev.math){const need=prev.desc+Math.max(L.asc,TA*s)+.1*lh;adv=ruled?lh*Math.max(1,Math.ceil(need/lh-.3)):Math.max(adv,need)}
  y+=adv;if(y>PH-m.b)newPage()}
 for(const w of L.words)drawBox(w.box,w.x,y+L.by,L.sl,w.wy);
 prev=L}
const col=$('#col').value;
for(const ic of pages.filter(p=>p.dirty)){
const ig=ic.getContext('2d');ig.globalCompositeOperation='source-in';ig.fillStyle=col;ig.fillRect(0,0,PW,PH);
const pc=document.createElement('canvas');pc.width=PW*Q;pc.height=PH*Q;paper(pc,bsel,PH,lh,m,bgImg);
const gnPaper=gnLetterPage(pc,PH),gnPaths=gnVectorize(ic,PH);
const g=pc.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='multiply';g.globalAlpha=.94;g.drawImage(ic,0,0);ic.width=ic.height=1;
GN_PAGES.push({height:PH,paths:gnPaths,paper:gnPaper,paperThumb:gnThumbnail(pc)});
const im=new Image();im.className='pg';im.src=pc.toDataURL('image/jpeg',.93);out.append(im)}
showMissing(f,[...miss]);$('#exportbar').classList.remove('hide');$('#exportmessage').textContent='';
}finally{btn.disabled=false;btn.textContent='In Handschrift umwandeln'}}
$('#go').onclick=render;
$('#ex').onclick=()=>{const j=JSON.stringify({fonts:S.fonts,bgs:S.bgs});$('#bk').value=j;try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download='handschriften.json';a.click()}catch(e){}$('#bm').textContent='Sicherung erstellt ('+Math.round(j.length/1024)+' KB). Kopiere den Text und bewahre ihn in einer Datei auf, oder nutze die heruntergeladene Datei.'};
$('#cp').onclick=async()=>{const t=$('#bk');t.select();try{await navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}$('#bm').textContent='Kopiert.'};
function imp(txt){try{const d=JSON.parse(txt);let n=0;for(const f of d.fonts||[])if(f&&f.words&&f.slots&&!S.fonts.some(x=>x.id==f.id)){S.fonts.push(f);n++}for(const b of d.bgs||[])if(b&&b.d&&!S.bgs.some(x=>x.id==b.id)){S.bgs.push(b);n++}save();lists();$('#bm').textContent=n+' Einträge eingelesen.'}catch(e){$('#bm').textContent='Das war keine gültige Sicherung.'}}
$('#im').onclick=()=>imp($('#bk').value);
$('#imf').onchange=async e=>{const f=e.target.files[0];if(f)imp(await f.text());e.target.value=''};
/* Eingebaute junge Handschriften: Glyphen aus Schreibschrift-Fonts mit leichter Zufallsvariation */
const BI=[],EXTRA='+=*/%<>#×÷±≠≤≥≈·∞π°→',ALLB=CHARS+EXTRA;
const FONTS=[['bi-indie','Jung – rund (eingebaut)','Indie Flower',112],['bi-caveat','Jung – flott (eingebaut)','Caveat',130,1],['bi-messy','Unordentlich (eingebaut)','Reenie Beanie',150,2.6]];
function mkGlyph(ch,fam,px,j=1){const W=260,H=300,B=190,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
g.translate(50,B+rnd(-5,5)*(j-1));g.rotate(rnd(-.05,.05)*j);g.transform(1,0,rnd(-.12,.04)*j,1,0,0);const k=1+rnd(-.05,.05)*j;g.scale(k,k*(1+rnd(-.04,.04)*j));
g.font=`${px}px "${fam}",cursive`;g.fillStyle=g.strokeStyle='#000';g.lineJoin='round';g.lineWidth=rnd(0,1.6)*j;g.fillText(ch,0,0);if(g.lineWidth>.4)g.strokeText(ch,0,0);
const d=g.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0)return null;x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(W-1,x1+2);y1=Math.min(H-1,y1+2);
const w=x1-x0+1,h=y1-y0+1,o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);
return{d:o.toDataURL(),w,h,dy:y0+h-B,pb:0}}
const ready=(async()=>{
try{await Promise.race([Promise.all(FONTS.map(f=>document.fonts.load(`${f[3]}px "${f[2]}"`,CHARS))),new Promise(r=>setTimeout(r,5000))])}catch(e){}
for(const[id,name,fam,px,j]of FONTS){const words=[],slots={};for(let v=0;v<5;v++){words.push(ALLB);slots[v]=[...ALLB].map(ch=>mkGlyph(ch,fam,px,j))}BI.push({id,name,builtin:1,words,slots})}
lists()})();
loadDB().then(lists);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

/* Export: PDF, PNG und experimenteller nativer Goodnotes-Stiftmodus. */
function downloadBytes(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function pdfFromPageImages(images){
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const put=b=>{parts.push(b);length+=b.length};const str=t=>put(enc.encode(t));
 str('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 const objs=[];let k=3;
 for(const im of images){objs.push({page:k++,content:k++,image:k++,im})}
 const objects=new Map();objects.set(1,'<< /Type /Catalog /Pages 2 0 R >>');
 objects.set(2,`<< /Type /Pages /Kids [${objs.map(o=>o.page+' 0 R').join(' ')}] /Count ${objs.length} >>`);
 for(const o of objs){
  const w=o.im.naturalWidth,h=o.im.naturalHeight;
  objects.set(o.page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w/2} ${h/2}] /Resources << /XObject << /Im${o.image} ${o.image} 0 R >> >> /Contents ${o.content} 0 R >>`);
  const stream=`q\n${w/2} 0 0 ${h/2} 0 0 cm\n/Im${o.image} Do\nQ\n`;
  objects.set(o.content,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);
  const raw=atob(o.im.src.split(',')[1]),binary=new Uint8Array(raw.length);for(let j=0;j<raw.length;j++)binary[j]=raw.charCodeAt(j);
  objects.set(o.image,{head:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${binary.length} >>\nstream\n`,binary});
 }
 for(let i=1;i<k;i++){offsets[i]=length;str(`${i} 0 obj\n`);const o=objects.get(i);if(typeof o==='string')str(o);else{str(o.head);put(o.binary);str('\nendstream')}str('\nendobj\n')}
 const xref=length;str(`xref\n0 ${k}\n0000000000 65535 f \n`);
 for(let i=1;i<k;i++)str(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 str(`trailer\n<< /Size ${k} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'});
}
$('#exportbutton').onclick=async()=>{
 const kind=$('#exportformat').value,msg=$('#exportmessage'),images=[...document.querySelectorAll('#pages img.pg')];
 if(!images.length){msg.textContent='Bitte zuerst Text umwandeln.';return}
 try{
  if(kind==='goodnotes'){
   if(!GN_PAGES.length)throw Error('Keine Handschriftseiten vorhanden.');
   msg.textContent='Goodnotes-Datei mit normalen Stiftstrichen wird erstellt …';
   for(let i=0;i<GN_PAGES.length;i++){
    const doc=await gnCreate(GN_PAGES[i],$('#col').value);
    downloadBytes(doc,'handschrift-seite-'+String(i+1).padStart(2,'0')+'.goodnotes','application/octet-stream');
    msg.textContent=(i+1)+' von '+GN_PAGES.length+' Goodnotes-Seiten erstellt.';
    await new Promise(resolve=>setTimeout(resolve,30));
   }
   msg.textContent+=' Bitte prüfen, ob die Stiftstriche angezeigt werden und radierbar sind (Goodnotes-Importtest steht noch aus).';
  }
  else if(kind==='pdf'){downloadBytes(pdfFromPageImages(images),'handschrift.pdf','application/pdf');msg.textContent='PDF erstellt.'}
  else{for(let i=0;i<images.length;i++){
   const canvas=document.createElement('canvas');canvas.width=images[i].naturalWidth;canvas.height=images[i].naturalHeight;canvas.getContext('2d').drawImage(images[i],0,0);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   downloadBytes(blob,`handschrift-seite-${String(i+1).padStart(2,'0')}.png`,'image/png');
  }msg.textContent=images.length===1?'PNG erstellt.':`${images.length} PNG-Dateien erstellt. Der Browser kann mehrere Downloads bestätigen lassen.`}
 }catch(e){console.error(e);msg.textContent='Export fehlgeschlagen: '+e.message}
};
