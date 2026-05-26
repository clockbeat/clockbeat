importScripts("version.js");

const contentToCache = projectFiles

const pathname = self.location.pathname.split("/")[1];
cacheName = pathname + "/" + cacheName;
console.log(cacheName);

self.addEventListener("activate", (e) => {
    // Remove unwanted cached assets
    console.log("activate", cacheName);
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== cacheName) {
                        if (name.startsWith(pathname)) {
                            return caches.delete(name);
                        }
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            console.log("Caching all content");
            await cache.addAll(contentToCache);
        })()
    );
});

async function updateCache(request) {

    const url = request.url;
    if (request.method == "POST") {
        console.log(url + " redirect");
        const formData = await request.formData();
        let str = new URLSearchParams(formData).toString()
        return Response.redirect(url + "#" + str, 302);
    }

    const cachedResponse = await caches.match(url);
    if (cachedResponse) {
        console.log(url + " from cache");
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
        let request = e.request;
        let response = await updateCache(request);
        return response;
    })());
});

self.addEventListener('message', (event) => {
});