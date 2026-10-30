/* Goodnotes (native Stiftobjekte) – erzeugt aus einer bereinigten Vorlage.
   Stiftstriche werden als freie Zeichenobjekte gespeichert, nicht ins PDF gerastert.
   Reverse-Engineered-Format, Import in iOS-Goodnotes muss auf dem Zielgerät geprüft werden. */
const GN_U8=new TextEncoder();
function gnB64(s){const b=atob(s);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function gnCat(...arr){let n=0;for(const a of arr)n+=a.length;const b=new Uint8Array(n);let p=0;for(const a of arr){b.set(a,p);p+=a.length}return b}
function gnVar(n){n=BigInt(n);const out=[];while(n>127n){out.push(Number(n&127n)|128);n>>=7n}out.push(Number(n));return new Uint8Array(out)}
function gnReadVar(b,i){let v=0n,k=0n;while(i<b.length){const x=b[i++];v|=BigInt(x&127)<<k;if(x<128)return{n:Number(v),big:v,i};k+=7n;if(k>70n)throw Error('Ungültige Proto-Daten')}throw Error('Unvollständige Proto-Daten')}
function gnFieldList(b){const f=[];let i=0;while(i<b.length){const p=gnReadVar(b,i);i=p.i;const kind=p.n&7,id=p.n>>3;let v;if(kind===0){const k=gnReadVar(b,i);i=k.i;v=k.big}else if(kind===2){const k=gnReadVar(b,i);i=k.i;v=b.slice(i,i+k.n);i+=k.n}else if(kind===1||kind===5){const k=kind===1?8:4;v=b.slice(i,i+k);i+=k}else{throw Error('Unbekanntes Proto-Feld '+kind)}f.push({id,kind,value:v})}return f}
function gnProto(f){let b=[];for(const {id,kind,value}of f){b.push(gnVar(id*8+kind));if(kind===2)b.push(gnVar(value.length),value);else if(kind===0)b.push(gnVar(value));else b.push(value)}return gnCat(...b)}
function gnPatch(b,id,func){const fields=gnFieldList(b);for(const f of fields)if(f.id===id)f.value=func(f.value);return gnProto(fields)}
function gn32(x){const a=new Uint8Array(4);new DataView(a.buffer).setFloat32(0,x,true);return a}
function gnColor(s){const c=s.match(/^#([\da-f]{6})$/i)?.[1]||'000000';const f=[1,2,3,4].map((a,i)=>({id:a,kind:5,value:gn32(i===3?1:parseInt(c.slice(i*2,i*2+2),16)/255)}));return gnProto(f)}
function gnUUID(){return (globalThis.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})).toUpperCase()}
function gnWarp(raw,poly){const d=raw.slice(),v=new DataView(d.buffer,d.byteOffset,d.byteLength);const n=v.getUint32(52,true),start=60+2*n;
 let changed=0;const x0=poly[0][0],y0=poly[0][1];
 for(let o=start;o+8<=d.length;o+=4){const x=v.getFloat32(o,true),y=v.getFloat32(o+4,true);
  // Die Vorlage enthält ein fast senkrechtes Kalibrierungssegment.
  // Nur deren Koordinaten werden verändert; Druck- und Stilwerte bleiben gleich.
  if(x>190&&x<216&&y>52&&y<96){const t=Math.max(0,Math.min(1,(y-60.4)/(87.25-60.4)))*(poly.length-1),j=Math.min(poly.length-2,Math.floor(t)),r=t-j;
   v.setFloat32(o,poly[j][0]*(1-r)+poly[j+1][0]*r,true);v.setFloat32(o+4,poly[j][1]*(1-r)+poly[j+1][1]*r,true);changed++;o+=4;
  }
 }
 if(changed<170)throw Error('Stiftgeometrie konnte nicht vollständig umgewandelt werden ('+changed+')');
 return d;
}
// LZ4 mit einer reinen Literal-Sequenz: gültiger LZ4-Rohblock ohne externes Paket.
function gnLZ4(data){const head=[0xf0];let n=data.length-15;while(n>=255){head.push(255);n-=255}head.push(n);const block=gnCat(new Uint8Array(head),data),x=new Uint8Array(8),v=new DataView(x.buffer);v.setUint32(0,data.length,true);v.setUint32(4,block.length,true);return gnCat(GN_U8.encode('bv41'),x,block,GN_U8.encode('bv4$'))}
function gnStroke(path,color,protoHeader,protoContent,protoRaw,k){
 const uid=GN_U8.encode(gnUUID());
 let header=gnPatch(protoHeader,1,()=>uid);
 // Eindeutige interne Stroke-ID je Objekt, damit der Radierer jedes Segment einzeln trifft.
 header=gnPatch(header,2,b=>gnPatch(b,2,()=>Math.floor(Math.random()*0x7fffffff)+1));
 let inner=gnFieldList(gnFieldList(protoContent)[0].value);
 for(const f of inner){
  if(f.id===1)f.value=uid;
  if(f.id===2)f.value=gnLZ4(gnWarp(protoRaw,path));
  if(f.id===4)f.value=gnColor(color);
  if((f.id===7||f.id===15)&&f.kind===2)f.value=gnPatch(f.value,2,()=>Math.floor(Math.random()*0x7fffffff)+1);
 }
 const stroke=gnProto([{id:7,kind:2,value:gnProto(inner)}]);return gnCat(gnVar(header.length),header,gnVar(stroke.length),stroke)
}
function gnCRC(b){if(!gnCRC.table){gnCRC.table=Array.from({length:256},(_,k)=>{for(let t=0;t<8;t++)k=k&1?0xedb88320^(k>>>1):k>>>1;return k>>>0})}let c=0xffffffff;for(const x of b)c=gnCRC.table[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function gnZip(files){const chunks=[],central=[];let ofs=0;const dosTime=0,dosDate=(46<<9)|(10<<5)|30;
 for(const [name,value]of files){const fname=GN_U8.encode(name),data=value instanceof Uint8Array?value:new Uint8Array(value),len=data.length,crc=gnCRC(data),local=new Uint8Array(30),h=new DataView(local.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(8,0,true);h.setUint16(10,dosTime,true);h.setUint16(12,dosDate,true);h.setUint32(14,crc,true);h.setUint32(18,len,true);h.setUint32(22,len,true);h.setUint16(26,fname.length,true);
  chunks.push(local,fname,data);const cen=new Uint8Array(46),c=new DataView(cen.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(10,0,true);c.setUint16(12,dosTime,true);c.setUint16(14,dosDate,true);c.setUint32(16,crc,true);c.setUint32(20,len,true);c.setUint32(24,len,true);c.setUint16(28,fname.length,true);c.setUint32(42,ofs,true);central.push(cen,fname);ofs+=local.length+fname.length+len;
 }let centralLen=0;for(const b of central)centralLen+=b.length;const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralLen,true);e.setUint32(16,ofs,true);return new Blob([...chunks,...central,end],{type:'application/octet-stream'})}
function gnReplaceUUIDs(t){const ids=new Map();return t.replace(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/g,id=>{if(!ids.has(id))ids.set(id,gnUUID());return ids.get(id)})}
function gnReplaceAsset(path,bin,idmap){const replace=(s)=>s.replace(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/g,id=>{if(!idmap.has(id))idmap.set(id,gnUUID());return idmap.get(id)});
 const newPath=replace(path),b=GN_U8.encode(replace(new TextDecoder('latin1').decode(bin)));
 return [newPath,b];
}
function gnRewriteIdsBytes(a,map){ // UUIDs bestehen ausschließlich aus ASCII; andere Binärbytes unangetastet lassen.
 const b=a.slice(),chars=(s)=>GN_U8.encode(s);
 for(let i=0;i+36<=b.length;i++){
  if(!((b[i]>=48&&b[i]<=57)||(b[i]>=65&&b[i]<=70)))continue;
  if(b[i+8]!==45||b[i+13]!==45||b[i+18]!==45||b[i+23]!==45)continue;
  let id='';for(let j=0;j<36;j++)id+=String.fromCharCode(b[i+j]);
  if(!/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/.test(id))continue;
  if(!map.has(id))map.set(id,gnUUID());b.set(chars(map.get(id)),i);i+=35;
 }
 return b
}
async function gnCreate(page,color){const protoHeader=gnB64(GN_TEMPLATE.protoHeader),protoContent=gnB64(GN_TEMPLATE.protoContent),protoRaw=gnB64(GN_TEMPLATE.protoRaw);
 // Leeres Papier aus der aktuellen Auswahl, mit genau einer Bildschicht im PDF.
 const paperImg=new Image();paperImg.src=page.paper;await paperImg.decode();
 const pdf=new Uint8Array(await pdfFromPageImages([paperImg]).arrayBuffer());
 const thumbnail=gnB64(page.thumb.split(',')[1]);
 const assets=Object.entries(GN_TEMPLATE.assets).map(([name,data])=>[name,gnB64(data)]);
 const pageId=GN_TEMPLATE.originalPageId,attachmentId=GN_TEMPLATE.originalAttachmentId;
 for(const entry of assets){if(entry[0]==='attachments/'+attachmentId)entry[1]=pdf;else if(entry[0]==='thumbnail.jpg')entry[1]=thumbnail;else if(entry[0]==='index.events.pb'){
  // Die ursprüngliche Anhangs-Länge im Dokumentindex aktualisieren.
  const events=[];const b=entry[1];let p=0;
  while(p<b.length){const r=gnReadVar(b,p);const item=b.slice(r.i,r.i+r.n);p=r.i+r.n;const fs=gnFieldList(item);for(const f of fs)if(f.id===6&&f.kind===2)f.value=gnPatch(f.value,5,()=>pdf.length);const raw=gnProto(fs);events.push(gnVar(raw.length),raw)}
  entry[1]=gnCat(...events);
 }}
 const w=1122,h=1452,scale=Math.min(w/1240,h/page.height),offx=(w-1240*scale)/2,offy=(h-page.height*scale)/2;
 const maxStrokes=40000;
 if(page.lines.length>maxStrokes)throw Error('Zu viele Tintenabschnitte auf einer Seite ('+page.lines.length+'). Bitte den Text auf mehrere Seiten verteilen.');
 const parts=[];
 for(let j=0;j<page.lines.length;j++){
  const [x0,y,x1]=page.lines[j];const path=[[offx+x0*scale,offy+y*scale],[offx+x1*scale,offy+y*scale]];
  parts.push(gnStroke(path,color,protoHeader,protoContent,protoRaw,j));
 }
 let notes=gnCat(...parts);
 // Jede erzeugte Datei ist ein eigenständiges Notizbuch, mit neuen internen IDs.
 const map=new Map();notes=gnRewriteIdsBytes(notes,map);
 const out=assets.map(([name,data])=>[name,data]);out.push(['notes/'+pageId,notes]);
 const renamed=out.map(([name,data])=>[name.replace(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/g,id=>{if(!map.has(id))map.set(id,gnUUID());return map.get(id)}),gnRewriteIdsBytes(data,map)]);
 return gnZip(renamed)
}
