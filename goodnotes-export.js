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
// Entpackt die von Goodnotes verwendeten Apple-LZ4-Blöcke, damit sich
// die ORIGINALEN Strichgeometrien ändern lassen (statt fremde Geometrie
// in ein nicht zugehöriges Zeichenobjekt zu kopieren).
function gnDecodeLZ4(frame){
 const v=new DataView(frame.buffer,frame.byteOffset,frame.byteLength);
 if(String.fromCharCode(...frame.slice(0,4))!=='bv41')throw Error('Unbekannte Goodnotes-Geometrie');
 const total=v.getUint32(4,true),compressed=v.getUint32(8,true);
 if(total>20_000_000||compressed+16>frame.length)throw Error('Ungültiger Goodnotes-LZ4-Block');
 const out=new Uint8Array(total);let p=12,o=0,end=p+compressed;
 while(p<end){
  const token=frame[p++];let literals=token>>>4;
  if(literals===15){let a;do{if(p>=end)throw Error('LZ4-Daten unvollständig');a=frame[p++];literals+=a}while(a===255)}
  if(p+literals>end||o+literals>total)throw Error('LZ4-Literale außerhalb des Puffers');
  out.set(frame.subarray(p,p+literals),o);p+=literals;o+=literals;
  if(p===end)break;
  if(p+2>end)throw Error('LZ4-Abstand fehlt');
  const dist=frame[p]|(frame[p+1]<<8);p+=2;if(!dist||dist>o)throw Error('LZ4-Abstand ungültig');
  let count=(token&15)+4;
  if((token&15)===15){let a;do{if(p>=end)throw Error('LZ4-Wiederholung fehlt');a=frame[p++];count+=a}while(a===255)}
  if(o+count>total)throw Error('LZ4-Überlauf');
  for(let j=0;j<count;j++)out[o+j]=out[o+j-dist];o+=count;
 }
 if(o!==total)throw Error('LZ4-Länge passt nicht zur Geometrie');
 return out;
}
// Nur tatsächliche Punktkoordinaten ändern. Druck, Stiftart und übrige
// Kalibrierdaten des ORIGINALEN normalen Stiftobjekts bleiben unverändert.
function gnInkPositions(raw){
 const v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
 if(raw.length<100||v.getUint32(0,true)!==0x006c7074)throw Error('Ungültige TPL-Geometrie');
 const n=v.getUint32(52,true),start=60+2*n,positions=[];
 if(n<1||n>300||start>=raw.length)throw Error('Ungültige Stiftkopf-Daten');
 for(let o=start;o+12<=raw.length;o+=4){
  const x=v.getFloat32(o,true),y=v.getFloat32(o+4,true),w=v.getFloat32(o+8,true);
  if(x>15&&x<615&&y>20&&y<790&&w>=.15&&w<=10)
   positions.push({o,x,y,w});
 }
 let first=[];
 for(const point of positions){
  if(first.length&&point.o-first[first.length-1].o>150)break;
  first.push(point);
 }
 return {first,positions};
}
function gnWarpOwn(raw,path){
 if(path.length<2)throw Error('Leerer Stiftstrich');
 const out=raw.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength);
 const {first,positions}=gnInkPositions(raw);
 if(first.length<8)throw Error('Stiftvorlage hat zu wenige echte Punkte');
 function interp(t){
  const u=Math.max(0,Math.min(1,t))*(path.length-1),j=Math.min(path.length-2,Math.floor(u)),r=u-j;
  return [path[j][0]*(1-r)+path[j+1][0]*r,path[j][1]*(1-r)+path[j+1][1]*r];
 }
 for(const pt of positions){
  let best=0,bestDist=Infinity;
  for(let j=0;j<first.length;j++){
   const dx=pt.x-first[j].x,dy=pt.y-first[j].y,dist=dx*dx+dy*dy;
   if(dist<bestDist){bestDist=dist;best=j}
  }
  const [x,y]=interp(best/(first.length-1));
  v.setFloat32(pt.o,x,true);v.setFloat32(pt.o+4,y,true);
 }
 return out;
}
// Die Strich-Vorlagen stammen aus derselben Goodnotes-Datei wie der Seitenindex.
// Bei existierenden Vorlagen bleiben alle Kennungen, Revisionsmetadaten und
// Unterfelder erhalten. Nur die tatsächliche Tinte und ihre Farbe werden geändert.
function gnReadRecords(bytes){
 const records=[];let p=0;
 while(p<bytes.length){
  const hlen=gnReadVar(bytes,p);p=hlen.i;if(p+hlen.n>bytes.length)throw Error('Beschädigter Goodnotes-Datensatz');
  const header=bytes.slice(p,p+hlen.n);p+=hlen.n;
  const clen=gnReadVar(bytes,p);p=clen.i;if(p+clen.n>bytes.length)throw Error('Unvollständiges Goodnotes-Objekt');
  const content=bytes.slice(p,p+clen.n);p+=clen.n;
  const hf=gnFieldList(header);
  if(hf.some(f=>f.id===3))continue; // Gelöschte Objekte nicht wiederverwenden
  const inner=gnFieldList(content).find(f=>f.id===7 && f.kind===2);
  if(inner && gnFieldList(inner.value).some(f=>f.id===2))records.push({header,content});
 }
 return records;
}
function gnStrokeFromRecord(path,color,record,k,cloned){
 if(path.length<2||!path.every(p=>p.length>=2&&p.every(Number.isFinite)))throw Error('Ungültige Stiftkoordinaten');
 let header=record.header,content=record.content;
 const outer=gnFieldList(content),stroke=outer.find(f=>f.id===7&&f.kind===2);
 if(!stroke)throw Error('Ungültiges Zeichenobjekt in Goodnotes-Vorlage');
 const inner=gnFieldList(stroke.value);
 const ink=inner.find(f=>f.id===2&&f.kind===2);
 const colorField=inner.find(f=>f.id===4&&f.kind===2);
 if(!ink||!colorField)throw Error('Unvollständige Stiftvorlage');
 // Die Geometrie wird vollständig ersetzt; die übrigen individuellen Felder
 // dieser Goodnotes-Strichkennung bleiben unverändert.
 ink.value=gnLZ4(gnWarpOwn(gnDecodeLZ4(ink.value),path));
 colorField.value=gnColor(color);
 if(cloned){
  // Erst nach vollständiger Belegung vorhandener Strichplätze nötig.
  const uuid=GN_U8.encode(gnUUID());
  header=gnPatch(header,1,()=>uuid);
  const fid=inner.find(f=>f.id===1&&f.kind===2);if(fid)fid.value=uuid;
  const token=gnFieldList(header).find(f=>f.id===2&&f.kind===2);
  if(token){
   const fresh=gnPatch(token.value,2,()=>BigInt(230000000+Math.floor(Math.random()*500000000)));
   header=gnPatch(header,2,()=>fresh);
   const f=inner.find(f=>f.id===15&&f.kind===2);if(f)f.value=fresh;
  }
  header=gnPatch(header,9,()=>1695000+k);
  // Ein intern verwendetes Objektattribut muss pro kopiertem Strich
  // erhalten bleiben, wenn dessen genaue Kodierung unbekannt ist.
 }
 stroke.value=gnProto(inner);content=gnProto(outer);
 return gnCat(gnVar(header.length),header,gnVar(content.length),content);
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
async function gnCreate(page,color){
 const files=Object.entries(GN_TEMPLATE.assets).map(([name,value])=>[name,gnB64(value)]);
 const pageId=GN_TEMPLATE.originalPageId,attachmentId=GN_TEMPLATE.originalAttachmentId;
 // Ein normales Stiftobjekt wird aus den originalen Goodnotes-Daten übernommen.
 // Weder Werkzeugart noch Revisions-ID noch Dokument-ID werden neu erfunden.
 const records=gnReadRecords(gnB64(GN_TEMPLATE.originalNotes)).filter(record=>{
  try{
   const outer=gnFieldList(record.content),ink=gnFieldList(outer.find(f=>f.id===7).value).find(f=>f.id===2).value;
   return gnInkPositions(gnDecodeLZ4(ink)).first.length>=8;
  }catch(e){return false}
 });
 if(!page.paths?.length)throw Error('Keine Stiftstriche ermittelt.');
 if(page.paths.length>records.length)
  throw Error('Für diese Seite wurden '+page.paths.length+' Stiftzüge gefunden. Der sichere Goodnotes-Modus kann aktuell höchstens '+records.length+' Stiftzüge pro Seite speichern. Bitte den Text aufteilen oder PDF/PNG verwenden.');
 const w=612,h=792,scale=Math.min(w/1240,h/page.height);
 const offx=(w-1240*scale)/2,offy=(h-page.height*scale)/2;
 const strokes=page.paths.map((path,j)=>{
  const pts=path.map(([x,y])=>[offx+x*scale,offy+y*scale]);
  return gnStrokeFromRecord(pts,color,records[j],j,false);
 });
 const notes=gnCat(...strokes);
 const paperImg=new Image();paperImg.src=page.paper;await paperImg.decode();
 const pdf=new Uint8Array(await pdfFromPageImages([paperImg]).arrayBuffer());
 // Vorschau bleibt papierfarben, ohne gerasterte Handschrift.
 const thumbImg=new Image();thumbImg.src=page.paperThumb;await thumbImg.decode();
 const thumbnail=gnB64(page.paperThumb.split(',')[1]);
 for(const entry of files){
  if(entry[0]==='attachments/'+attachmentId)entry[1]=pdf;
  if(entry[0]==='thumbnail.jpg')entry[1]=thumbnail;
  if(entry[0]==='index.events.pb'){
   const events=[],b=entry[1];let p=0;
   while(p<b.length){
    const r=gnReadVar(b,p),item=b.slice(r.i,r.i+r.n);p=r.i+r.n;
    const fs=gnFieldList(item);
    for(const f of fs)if(f.id===6&&f.kind===2)f.value=gnPatch(f.value,5,()=>pdf.length);
    const enc=gnProto(fs);events.push(gnVar(enc.length),enc);
   }
   entry[1]=gnCat(...events);
  }
 }
 files.push(['notes/'+pageId,notes]);
 return gnZip(files);
}
