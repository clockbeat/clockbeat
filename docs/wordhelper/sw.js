let cacheName = /*time!*/ "654d16d5";

const contentToCache = ["index.html", "wordhelper.js", "storage.js", "wordhelper.css"];

self.addEventListener("activate", (e) => {
    // Remove unwanted cached assets
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    e.waitUntil(
        (async () => {
            if ("navigationPreload" in self.registration) {
                await self.registration.navigationPreload.enable();
            }
        })()
    );
    self.clients.claim();
});

self.addEventListener("install", (e) => {
    e.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);
        console.log("Caching all content");
        await cache.addAll(contentToCache);
      })()
    );
  });

async function updateCache(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);

        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }

        const cache = await caches.open(cacheName)
        await cache.put(request, response.clone());
        return response;
    } catch (e) {
        return new Response();
    }
}

self.addEventListener("fetch", (e) => {
    e.respondWith((async () => {

        try {
            const preloadResponse = await e.preloadResponse;
            if (preloadResponse) {
                return preloadResponse;
            }
        } catch { }

        let request = e.request;
        let response = await updateCache(request);
        return response;
    })());
});

self.addEventListener('message', (event) => {
    console.log("to sw", event.data);
    const msg = event.data;
    if (msg.type == "name") {
        msg.reply = cacheName;
        event.source.postMessage(msg);
    }
});