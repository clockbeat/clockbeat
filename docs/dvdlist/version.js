"use strict"

let cacheName = /*time!*/ "6a44d167";

let projectFiles = /*files!*/ ["dvdlist.html", "dvdlist.svg", "manifest.json", "sw.js", "version.js"];

projectFiles.push("/common/menu2.js");
projectFiles.push("/common/storage.js");

function stringToColour(string) {
    let hash = 0;
    string.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
    })
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = ((hash >> (i * 8)) & 0xff) | 0x80;
        colour += value.toString(16).padStart(2, '0');
    }
    return colour
}

let stringForColour = "/pagelist/pagelist.html"