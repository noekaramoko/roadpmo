const CACHE_NAME = 'pmo-roadmap-v49';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  // Only cache same-origin requests, skip API calls
  if(e.request.url.indexOf('api.anthropic.com') >= 0){ return; }
  if(e.request.url.indexOf('fonts.googleapis.com') >= 0){ return; }
  
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached){ return cached; }
      return fetch(e.request).then(function(response){
        if(!response || response.status !== 200 || response.type !== 'basic'){ return response; }
        var toCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, toCache); });
        return response;
      }).catch(function(){
        // Offline fallback
        if(e.request.destination === 'document'){
          return caches.match('./index.html');
        }
      });
    })
  );
});
