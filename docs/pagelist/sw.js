"use strict"

importScripts("version.js");

const contentToCache = projectFiles

const pathname = self.location.pathname.split("/")[1];
cacheName = pathname + "/" + cacheName;
console.log(cacheName);
let iconResponse;

async function makeCustomFavIcon(text, color) {
    text = text ?? ""
    let canvas = new OffscreenCanvas(192, 192);
    let context = canvas.getContext("2d");
    context.fillStyle = color;
    context.fillRect(0, 0, 192, 192);
    context.fillStyle = "black";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = "100px sans-serif";
    context.fillText(text.substring(0, 2), 4, 130);
    let blob = await canvas.convertToBlob({type: "image/png"}); //.then(blob => //{
    iconResponse = new Response(blob, {
        headers: {
            "content-type": "image/png",
        }
    });
    console.log("Icon created");
}

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

    let url = request.url;
    if (request.method == "POST") {
        console.log(url + " redirect");
        const formData = await request.formData();
        let str = new URLSearchParams(formData).toString()
        return Response.redirect(url + "#" + str, 302);
    }

    if (url.includes(stringForColour)) {
        let hash = new URL(url).hash.replace("#", "");
        let color = stringToColour(hash);
        await makeCustomFavIcon(hash, color);
        const cache = await caches.open(cacheName);
        await cache.put("/favicon.png", iconResponse.clone());
    }

    console.log(url, iconResponse);
    if (url.includes("favicon.png") && iconResponse) {
        console.log(url + " from iconResponse");
        return iconResponse.clone();
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
    console.log("message to sw", event.data);
    if (event.data.icon) {
        makeCustomFavIcon(event.data.title, event.data.color);
        event.source.postMessage({icon: true});
    }
});