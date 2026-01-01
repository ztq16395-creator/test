const CACHE_NAME = "mie-mie-bounty-pwa-v1";
const ASSETS = ["./","./index.html","./style.css","./script.js","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",(e)=>{
  const req=e.request; const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached) return cached;
    try{
      const fresh=await fetch(req);
      if(req.method==="GET" && fresh.ok) cache.put(req,fresh.clone());
      return fresh;
    }catch(err){
      if(req.mode==="navigate") return cache.match("./index.html");
      throw err;
    }
  })());
});
