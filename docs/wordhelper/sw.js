const cacheName = "v2";

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
});

["index.html", "wordhelper.js", "wordhelper.css"].forEach(url => {
    updateCache(url);
});

async function updateCache(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(request);

    if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
    }

    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone());
    return response;
}

self.addEventListener("fetch", (e) => {
    e.respondWith((async () => {
        let request = e.request;
        let response = await updateCache(request);
        return response;
    })());
});