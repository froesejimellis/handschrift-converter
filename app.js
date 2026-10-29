const $=s=>document.querySelector(s),CW=110,CH=150,BASE=105,PW=1240;
const CHARS=`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüÄÖÜß0123456789.,!?:;-()"'`;
const CAND=`Hallo Wasser Schule Zeitung Frühling Sommer Herbst Winter Straße Brücke Küche Mädchen Öffnung Übung Ärger Österreich Ägypten Übermut Fußball Gruß Maß Spaß Quelle Quark Qualität Xylophon Yacht Zebra Jacke Fuchs Vogel Katze Hund Pferd Bäcker Löwe Zähne Möbel Käse Wörter Tüte Größe Füße Süßigkeit Blume Garten Zimmer Tisch Stuhl Fenster Lampe Buch Heft Stift Papier Computer Telefon Wetter Regen Schnee Sonne Wolke Himmel Berlin Hamburg München Köln Frankfurt Stuttgart Dresden Leipzig Nürnberg Bremen Düsseldorf Jahr Monat Woche Montag Dienstag Mittwoch Donnerstag Freitag Samstag Sonntag Januar Februar März April Mai Juni Juli August September Oktober November Dezember Freund Familie Mutter Vater Bruder Schwester Kinder Liebe Glück Zukunft Vergangenheit Wirklichkeit Jugend Erfahrung Wissenschaft Experiment Physik Chemie Zitrone Orange Banane Kartoffel Tomate Gurke Zwiebel Pilze Brot Butter Marmelade Kaffee Milch Zucker Wunsch bequem Frequenz Aquarium Hexe Examen Taxi Text extra Mixer Typ Gymnasium Handy System Dank! Bitte, wie?  Name: gut; so-so (Test) "Ja" ist's 2024 10:30 3,50 0123456789 (987) 8.7.6. Hallo! Wirklich? Gesundheit, Prost! `;
function makeWords(){const need={};for(const c of CHARS)need[c]=3;
const cand=CAND.split(/\s+/).filter(w=>w&&[...w].every(c=>CHARS.includes(c)));const out=[];
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

document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x==b));['write','fonts','bgs'].forEach(t=>$('#'+t).classList.toggle('hide',t!=b.dataset.t))});

const done=f=>Object.values(f.slots).reduce((a,s)=>a+s.filter(Boolean).length,0),total=f=>f.words.reduce((a,w)=>a+[...w].length,0);
function lists(){
const fs=$('#fsel'),bs=$('#bsel'),pf=fs.value,pb=bs.value;
fs.innerHTML=[...BI,...S.fonts].map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')||'<option value="">– keine –</option>';
bs.innerHTML=[['plain','Weiß'],['lined','Liniert'],['grid','Kariert'],...S.bgs.map(b=>[b.id,b.name])].map(([v,n])=>`<option value="${v}">${esc(n)}</option>`).join('');
if(pf)fs.value=pf;if(pb)bs.value=pb;
$('#flist').innerHTML=S.fonts.map(f=>`<div class="row"><b>${esc(f.name)}</b><small>${done(f)} von ${total(f)} Zeichen geschrieben</small><button data-a="edit" data-id="${f.id}">Weiterschreiben</button><button data-a="del" data-id="${f.id}">Löschen</button></div>`).join('')||'<small>Noch keine Handschrift angelegt.</small>';
$('#blist').innerHTML=S.bgs.map(b=>`<div><img class="th" src="${b.d}"><br><small>${esc(b.name)}</small><br><button data-bd="${b.id}">Löschen</button></div>`).join('')}
$('#flist').onclick=e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.a=='edit')edit(b.dataset.id);
else if(b.dataset.arm){S.fonts=S.fonts.filter(f=>f.id!=b.dataset.id);if(ed&&ed.f.id==b.dataset.id){ed=null;$('#ed').classList.add('hide')}save();lists()}
else{b.dataset.arm=1;b.textContent='Wirklich löschen?'}};
$('#blist').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.bgs=S.bgs.filter(x=>x.id!=b.dataset.bd);save();lists()};
$('#bf').onchange=async e=>{for(const f of e.target.files){const im=await loadImg(URL.createObjectURL(f));if(!im)continue;const sc=Math.min(1,1600/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);S.bgs.push({id:'b'+Date.now()+(Math.random()*1e6|0),name:f.name.replace(/\.\w+$/,''),d:c.toDataURL('image/jpeg',.82)})}save();lists();e.target.value=''};
$('#nf').onclick=()=>{const f={id:'f'+Date.now(),name:$('#fname').value.trim()||'Meine Schrift',words:makeWords(),slots:{}};S.fonts.push(f);$('#fname').value='';save();lists();edit(f.id)};

/* Editor */
let ed=null,cur=null;const ink=$('#ink'),gd=$('#gd');
function edit(id){const f=S.fonts.find(x=>x.id==id);if(!f)return;const i=f.words.findIndex((w,k)=>!f.slots[k]);ed={f,i:i<0?0:i,st:[]};$('#ed').classList.remove('hide');show();$('#ed').scrollIntoView()}
function show(){const{f,i}=ed,w=[...f.words[i]],n=w.length;ed.st=[];
ink.width=gd.width=n*CW;ink.height=gd.height=CH;
const cv=$('#cv');cv.style.width=n*CW+'px';cv.style.aspectRatio=`${n*CW}/${CH}`;
const g=gd.getContext('2d');g.clearRect(0,0,gd.width,CH);g.strokeStyle='#8886';g.fillStyle='#888';g.font='14px sans-serif';
w.forEach((c,k)=>{g.strokeRect(k*CW+.5,.5,CW-1,CH-1);g.beginPath();g.moveTo(k*CW,BASE);g.lineTo(k*CW+CW,BASE);g.stroke();g.fillText(c,k*CW+6,18)});
const have=(f.slots[i]||[]).filter(Boolean).length;$('#wt').textContent=`Wort ${i+1} von ${f.words.length}: ${f.words[i]}${have?`  (${have}/${n} vorhanden – graue bleiben erhalten, neu geschriebene ersetzen)`:''}`;ghost(f,i);
$('#wj').innerHTML=f.words.map((x,k)=>`<option value="${k}">${wst(f,k)}${k+1}. ${esc(x)}</option>`).join('');$('#wj').value=i;cover()}
function counts(f){const c={};f.words.forEach((w,k)=>{const s=f.slots[k];[...w].forEach((ch,j)=>{if(s&&s[j])c[ch]=(c[ch]||0)+1})});return c}
function cover(){const c=counts(ed.f),all=[...new Set([...CHARS,...ed.f.words.join('')])];$('#cov').innerHTML=all.map(ch=>`<span class="chip ${(c[ch]||0)>=3?'ok':''}" data-c="${esc(ch)}">${esc(ch)} ${c[ch]||0}</span>`).join('')}
const wst=(f,k)=>{const s=f.slots[k],n=[...f.words[k]].length,h=s?s.filter(Boolean).length:0;return h?(h>=n?'✓ ':'◐ '):''};
async function ghost(f,i){const s=f.slots[i];if(!s)return;const g=gd.getContext('2d');for(const[j,o]of s.entries()){if(!o)continue;const im=await loadImg(o.d);if(!im||!ed||ed.i!=i||ed.f!=f)return;g.save();g.globalAlpha=.3;g.drawImage(im,j*CW+(CW-o.w)/2,BASE+o.dy-o.h);g.restore()}}
function commit(){if(ed&&ed.st.length){ed.f.slots[ed.i]=grab();ed.st=[];save();lists()}}
const unf=(f,k,ch)=>[...f.words[k]].some((c,j)=>(!ch||c==ch)&&!(f.slots[k]&&f.slots[k][j]));
function toChar(ch){commit();const f=ed.f;let k=f.words.findIndex((w,i)=>unf(f,i,ch));
if(k<0){if((counts(f)[ch]||0)<3){f.words.push(ch.repeat(3));save()}k=f.words.findIndex(w=>[...w].includes(ch))}
go(k)}
function addChars(str){commit();const f=ed.f,have={};f.words.forEach(w=>[...w].forEach(c=>have[c]=(have[c]||0)+1));
const cs=[...new Set([...str].filter(c=>c.trim()))];let rest=[];for(const c of cs)for(let n=have[c]||0;n<3;n++)rest.push(c);
const first=f.words.length;for(let i=0;i<rest.length;i+=6)f.words.push(rest.slice(i,i+6).join(''));
if(rest.length){save();lists();go(first)}else if(cs.length)toChar(cs[0]);$('#xc').value=''}
function gap(){commit();const f=ed.f,n=f.words.length;for(let d=1;d<=n;d++){const k=(ed.i+d)%n;if(unf(f,k))return go(k)}$('#wt').textContent='Keine Lücken mehr – alle Kästchen sind beschrieben. 🎉'}
$('#cov').onclick=e=>{const c=e.target.closest('.chip');if(c&&ed)toChar(c.dataset.c)};
$('#xa').onclick=()=>ed&&addChars($('#xc').value);$('#gap').onclick=()=>ed&&gap();
const pt=e=>{const r=ink.getBoundingClientRect();return[(e.clientX-r.left)*ink.width/r.width,(e.clientY-r.top)*ink.height/r.height]};
ink.onpointerdown=e=>{if(!ed)return;e.preventDefault();ink.setPointerCapture(e.pointerId);cur=[pt(e)];ed.st.push(cur);redraw()};
ink.onpointermove=e=>{if(cur){cur.push(pt(e));redraw()}};
ink.onpointerup=ink.onpointercancel=()=>{cur=null};
function redraw(){const g=ink.getContext('2d');g.clearRect(0,0,ink.width,CH);g.lineCap=g.lineJoin='round';g.strokeStyle=g.fillStyle='#111';g.lineWidth=+$('#pen').value;
for(const s of ed.st){if(s.length<2){g.beginPath();g.arc(s[0][0],s[0][1],g.lineWidth/2,0,7);g.fill();continue}
g.beginPath();g.moveTo(...s[0]);for(let k=1;k<s.length-1;k++){g.quadraticCurveTo(s[k][0],s[k][1],(s[k][0]+s[k+1][0])/2,(s[k][1]+s[k+1][1])/2)}g.lineTo(...s[s.length-1]);g.stroke()}}
$('#pen').oninput=()=>ed&&redraw();
$('#un').onclick=()=>{if(ed){ed.st.pop();redraw()}};
$('#cl').onclick=()=>{if(ed){ed.st=[];redraw()}};
function grab(){const g=ink.getContext('2d'),n=[...ed.f.words[ed.i]].length,arr=[];
for(let i=0;i<n;i++){const d=g.getImageData(i*CW,0,CW,CH).data;let x0=CW,y0=CH,x1=-1,y1=-1;
for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(d[(y*CW+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0){arr.push((ed.f.slots[ed.i]||[])[i]||null);continue}
x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(CW-1,x1+2);y1=Math.min(CH-1,y1+2);
const w=x1-x0+1,h=y1-y0+1,c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(ink,i*CW+x0,y0,w,h,0,0,w,h);
arr.push({d:c.toDataURL(),w,h,dy:y0+h-BASE})}return arr}
function go(k){if(!ed)return;if(ed.st.length){ed.f.slots[ed.i]=grab();save();lists()}ed.i=Math.max(0,Math.min(ed.f.words.length-1,k));show()}
$('#nx').onclick=()=>go(ed.i+1);$('#pv').onclick=()=>go(ed.i-1);$('#wj').onchange=e=>go(+e.target.value);
$('#dn').onclick=()=>{if(ed&&ed.st.length){ed.f.slots[ed.i]=grab();save()}ed=null;$('#ed').classList.add('hide');lists()};

/* Rendern */
const IC={};
async function variants(f){const V={};for(const[k,w]of f.words.entries()){const s=f.slots[k];if(!s)continue;for(const[j,ch]of[...w].entries()){const g=s[j];if(!g)continue;IC[g.d]=IC[g.d]||await loadImg(g.d);if(IC[g.d])(V[ch]=V[ch]||[]).push({...g,img:IC[g.d]})}}return V}
function paper(c,type,H,lh,m,bg){const g=c.getContext('2d');g.fillStyle='#fdfcf8';g.fillRect(0,0,PW,H);if(bg){g.drawImage(bg,0,0,PW,H);return}
g.strokeStyle='#a9c1da';g.lineWidth=1.5;g.beginPath();
if(type=='lined')for(let y=m.t+lh+6;y<H-m.b+10;y+=lh){g.moveTo(m.l-20,y);g.lineTo(PW-m.r+20,y)}
if(type=='grid'){const st=lh/2;for(let y=m.t;y<H;y+=st){g.moveTo(0,y);g.lineTo(PW,y)}for(let x=0;x<PW;x+=st){g.moveTo(x,0);g.lineTo(x,H)}}
g.stroke()}
async function render(){
const btn=$('#go'),out=$('#pages');btn.disabled=true;btn.textContent='Schreibe …';out.innerHTML='';
try{
await ready;const f=[...BI,...S.fonts].find(x=>x.id==$('#fsel').value);
if(!f){out.textContent='Bitte zuerst unter „Handschriften“ eine Handschrift anlegen.';return}
const V=await variants(f);if(!Object.keys(V).length){out.textContent='Diese Handschrift enthält noch keine Zeichen.';return}
const bsel=$('#bsel').value,bgd=S.bgs.find(b=>b.id==bsel),bgImg=bgd?await loadImg(bgd.d):null;
const PH=bgImg?Math.round(PW*bgImg.height/bgImg.width):1754;
const s=+$('#size').value/100,lh=CH*s*$('#lh').value/100,R=+$('#rnd').value/100,wsb=+$('#ws').value/100;
const m={t:+$('#mt').value,l:+$('#ml').value,r:+$('#mr').value,b:+$('#mb').value},RM=PW-m.r;
const pages=[],last={},miss=new Set();let ctx,y,x,x0,sl,by;
const line=()=>{sl=rnd(-1,1)*.006*R;x0=m.l+rnd(0,12)*R;x=x0;by=rnd(-2,2)*R};
const newPage=()=>{const c=document.createElement('canvas');c.width=PW;c.height=PH;pages.push(c);ctx=c.getContext('2d');y=m.t+lh;line()};
const nl=()=>{y+=lh*(1+rnd(-.04,.04)*R);if(y>PH-m.b)newPage();else line()};
const pick=ch=>{const a=V[ch]||V[ch.toLowerCase()]||V[ch.toUpperCase()];if(!a){miss.add(ch);return null}let i=0;if(a.length>1){do i=Math.random()*a.length|0;while(i===last[ch])}last[ch]=i;return a[i]};
newPage();
for(const para of $('#txt').value.split('\n')){
for(const word of para.split(/\s+/).filter(Boolean)){
const items=[...word].map(c=>({g:pick(c),gp:(3+rnd(-1.5,2.5)*R)*s}));
const adv=o=>(o.g?o.g.w*s:20*s)+o.gp,wd=items.reduce((a,o)=>a+adv(o),0);
if(x+wd>RM&&x>x0+1)nl();
for(const o of items){if(o.g){const w=o.g.w*s,h=o.g.h*s,sv=1+rnd(-.05,.05)*R,a=rnd(-3,3)*R*Math.PI/180;
const gy=y+by+sl*(x-m.l)+o.g.dy*s-h+rnd(-3,3)*R*s;
ctx.save();ctx.translate(x+w/2,gy+h/2);ctx.rotate(a);ctx.scale(sv,sv);ctx.drawImage(o.g.img,-w/2,-h/2,w,h);ctx.restore();ctx.canvas.dirty=1}
x+=adv(o)}
x+=60*s*wsb*(1+rnd(-.45,.8)*R*1.3)}
nl()}
const col=$('#col').value;
for(const ic of pages.filter(p=>p.dirty)){
const ig=ic.getContext('2d');ig.globalCompositeOperation='source-in';ig.fillStyle=col;ig.fillRect(0,0,PW,PH);
const pc=document.createElement('canvas');pc.width=PW;pc.height=PH;paper(pc,bsel,PH,lh,m,bgImg);
const g=pc.getContext('2d');g.globalCompositeOperation='multiply';g.globalAlpha=.94;g.drawImage(ic,0,0);
const im=new Image();im.className='pg';im.src=pc.toDataURL('image/jpeg',.92);out.append(im)}
if(miss.size){const p=document.createElement('p');p.innerHTML='<small>Nicht in dieser Handschrift enthalten und übersprungen: '+esc([...miss].join(' '))+'</small>';out.prepend(p)}
}finally{btn.disabled=false;btn.textContent='In Handschrift umwandeln'}}
$('#go').onclick=render;
$('#ex').onclick=()=>{const j=JSON.stringify({fonts:S.fonts,bgs:S.bgs});$('#bk').value=j;try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download='handschriften.json';a.click()}catch(e){}$('#bm').textContent='Sicherung erstellt ('+Math.round(j.length/1024)+' KB). Kopiere den Text und bewahre ihn in einer Datei auf, oder nutze die heruntergeladene Datei.'};
$('#cp').onclick=async()=>{const t=$('#bk');t.select();try{await navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}$('#bm').textContent='Kopiert.'};
function imp(txt){try{const d=JSON.parse(txt);let n=0;for(const f of d.fonts||[])if(f&&f.words&&f.slots&&!S.fonts.some(x=>x.id==f.id)){S.fonts.push(f);n++}for(const b of d.bgs||[])if(b&&b.d&&!S.bgs.some(x=>x.id==b.id)){S.bgs.push(b);n++}save();lists();$('#bm').textContent=n+' Einträge eingelesen.'}catch(e){$('#bm').textContent='Das war keine gültige Sicherung.'}}
$('#im').onclick=()=>imp($('#bk').value);
$('#imf').onchange=async e=>{const f=e.target.files[0];if(f)imp(await f.text());e.target.value=''};
/* Eingebaute junge Handschriften: Glyphen aus Schreibschrift-Fonts mit leichter Zufallsvariation */
const BI=[];
const FONTS=[['bi-indie','Jung – rund (eingebaut)','Indie Flower',112],['bi-caveat','Jung – flott (eingebaut)','Caveat',130,1],['bi-messy','Unordentlich (eingebaut)','Reenie Beanie',150,2.6]];
function mkGlyph(ch,fam,px,j=1){const W=260,H=300,B=190,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
g.translate(50,B+rnd(-5,5)*(j-1));g.rotate(rnd(-.05,.05)*j);g.transform(1,0,rnd(-.12,.04)*j,1,0,0);const k=1+rnd(-.05,.05)*j;g.scale(k,k*(1+rnd(-.04,.04)*j));
g.font=`${px}px "${fam}",cursive`;g.fillStyle=g.strokeStyle='#000';g.lineJoin='round';g.lineWidth=rnd(0,1.6)*j;g.fillText(ch,0,0);if(g.lineWidth>.4)g.strokeText(ch,0,0);
const d=g.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0)return null;x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(W-1,x1+2);y1=Math.min(H-1,y1+2);
const w=x1-x0+1,h=y1-y0+1,o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);
return{d:o.toDataURL(),w,h,dy:y0+h-B}}
const ready=(async()=>{
try{await Promise.race([Promise.all(FONTS.map(f=>document.fonts.load(`${f[3]}px "${f[2]}"`,CHARS))),new Promise(r=>setTimeout(r,5000))])}catch(e){}
for(const[id,name,fam,px,j]of FONTS){const words=[],slots={};for(let v=0;v<5;v++){words.push(CHARS);slots[v]=[...CHARS].map(ch=>mkGlyph(ch,fam,px,j))}BI.push({id,name,builtin:1,words,slots})}
lists()})();
loadDB().then(lists);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
