const V='hc-v1',FILES=['./','index.html','style.css','app.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V&&x!='hc-fonts').map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);
if(u.hostname=='fonts.googleapis.com'||u.hostname=='fonts.gstatic.com'){e.respondWith(caches.open('hc-fonts').then(async c=>{const h=await c.match(r);if(h)return h;const n=await fetch(r);c.put(r,n.clone());return n}));return}
if(u.origin==location.origin)e.respondWith(fetch(r).then(n=>{const cl=n.clone();caches.open(V).then(c=>c.put(r,cl));return n}).catch(()=>caches.match(r,{ignoreSearch:true})))});
