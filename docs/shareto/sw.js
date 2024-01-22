let cacheName = /*time!*/ "65aea8a6";

const contentToCache = ["destinations.html", "index.html", "queue.html", "shareto.html", "submit.svg", "edits.html", "manifest.json", "resources", "storage.js"];

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
    // e.waitUntil(
    //     (async () => {
    //         if ("navigationPreload" in self.registration) {
    //             await self.registration.navigationPreload.enable();
    //         }
    //     })()
    // );
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
    //console.log(url);
    //https://developer.mozilla.org/en-US/docs/Web/Manifest/launch_handler
    //https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue/setConsumer
    //https://stackoverflow.com/questions/65087262/avoiding-pwa-to-reload-when-using-web-share-target-api
    // https://developer.mozilla.org/en-US/docs/Web/API/Request/formData
    // // request.formData().then((data) => {
    //     // do something with the formdata sent in the request
    //   });

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

    // try {
    //     const preloadResponse = await e.preloadResponse;
    //     if (preloadResponse) {
    //         return preloadResponse;
    //     }
    // } catch { }

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
    console.log("to sw", event.data);
    const msg = event.data;
    if (msg.type == "name") {
        msg.reply = cacheName;
        event.source.postMessage(msg);
    }
});