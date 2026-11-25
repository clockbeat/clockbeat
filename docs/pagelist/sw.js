"use strict"

//Here because its location is critical to the scope of the service worker
importScripts("/common/swbase.js");

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

swExtras.beforeGet = async url => {

    if (url.includes(stringForColour)) { //defined in version.js
        let hash = new URL(url).hash.replace("#", "");
        let color = stringToColour(hash); //defined in version.js
        await makeCustomFavIcon(hash, color);
        const cache = await caches.open(localCacheName);
        await cache.put("/favicon.png", iconResponse.clone());
    }

    console.log(url, iconResponse);
    if (url.includes("favicon.png") && iconResponse) {
        console.log(url + " from iconResponse");
        return iconResponse.clone();
    }
}

swExtras.message = (event) => {
    console.log("message to sw", event.data);
    if (event.data.icon) {
        makeCustomFavIcon(event.data.title, event.data.color);
        event.source.postMessage({icon: true});
    }
};