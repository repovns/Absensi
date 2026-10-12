var CACHE_NAME='absenku-cache-v1';
var APP_SHELL=['./','./index.html','./manifest.json','./offline.html','https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){return cache.addAll(APP_SHELL);}).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url=new URL(req.url);
  if(url.origin===location.origin&&req.headers.get('x-api')==='true'){e.respondWith(fetch(req));return;}
  e.respondWith(caches.match(req).then(function(cached){
    if(cached) return cached;
    return fetch(req).then(function(res){
      if(res&&res.status===200&&res.type==='basic'){var clone=res.clone();caches.open(CACHE_NAME).then(function(c){c.put(req,clone);});}
      return res;
    }).catch(function(){
      if(req.mode==='navigate') return caches.match('./offline.html');
      return new Response('',{status:408,statusText:'Offline'});
    });
  }));
});

self.addEventListener('sync',function(e){
  if(e.tag==='absenku-sync'){
    e.waitUntil(self.clients.matchAll().then(function(clients){clients.forEach(function(c){c.postMessage({type:'FLUSH_SYNC'});});}));
  }
});

self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting();
});