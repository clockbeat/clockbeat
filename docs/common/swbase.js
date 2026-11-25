"use strict"

let swExtras = {
    fetchIfPossible: ["version.js", "sw.js"],
    cacheAsNoCache: {common: "common"},
    beforeGet: async url => { },
    message: e => { }
};

importScripts("version.js");

const contentToCache = projectFiles; //projectFiles from version.js

const pathname = self.location.pathname.split("/")[1];
let localCacheName = pathname + "/" + cacheName;  //cacheName from version.js
console.log("local cache",localCacheName);
let cacheIndex = {};

self.addEventListener("activate", (e) => {
    // Remove unwanted cached assets
    console.log("activate", localCacheName);
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== localCacheName) {
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
            const cache = await caches.open(localCacheName);
            console.log("Caching all content");
            await cache.addAll(contentToCache);
            self.skipWaiting();
        })()
    );
});

async function fetchAndCache(request) {

    let cacheToUse = localCacheName;
    const url = request.url;
    if (request.method != "GET") {
        const formData = await request.formData();
        console.log(url + " " + request.method, formData);
        let str = new URLSearchParams(formData).toString();
        if (str.length > 0) {
            return Response.redirect(url + "#" + str, 302);
        }
        return await fetch(request);
    }

    let extraResponse = await swExtras.beforeGet(url);
    if (extraResponse) {
        return extraResponse;
    }

    //--- request.cache ----
    //if cb-no-store, skip fetching from cache, will fetch but won't cache
    //if cb-reload, skip fetching from cache, will fetch and cache
    //if cb-no-cache, fetch from cache only if offline, or will fetch and cache

    let cacheType = request.headers["cb-cache"];
    //cacheType is only used locally

    let baseDirectory = new URL(request.url).pathname.split("/")[1];

    if (baseDirectory != pathname) {
        if (swExtras.cacheAsNoCache[baseDirectory]) {
            cacheToUse = swExtras.cacheAsNoCache[baseDirectory];
            cacheType = "cb-no-cache"; //fetch and cache
            console.log("cb-no-cache to ", cacheToUse , request.url);
        } else {
            cacheType = "cb-no-store"; //fetch, don't cache
            console.log("cb-no-store to ", cacheToUse , request.url);
        }
    }

    swExtras.fetchIfPossible.forEach(url => {
        if (request.url.includes(url)) {
            cacheType = "cb-no-cache";
        }
    });
    if (cacheType != "cb-no-store" || cacheType != "cb-reload") {
        if (cacheType != "cb-no-cache" || !navigator.online) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log(request + " from cache");
                return cachedResponse;
            }
        }
    } else {
        console.log("Cache skipped " + request.url);
    }
    try {
        const response = await fetch(request);
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }
        if (cacheType != "cb-no-store") {
            const cache = await caches.open(cacheToUse);
            await cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        console.error(e, request);
        return new Response();
    }
}

self.addEventListener("fetch", (e) => {
    console.log("fetch listener: ", e.request.url)
    e.respondWith((async () => {
        return await fetchAndCache(e.request);
    })());
});

self.addEventListener('message', (event) => {
    swExtras.message(event);
});

