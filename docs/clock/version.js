"use strict"

let version = /*time!*/ "6afec30e";

let projectFiles = /*files!*/ ["device.html", "index.html", "manifest.json", "sw.js", "version.js", "js/clockextras.js", "js/clock.js", "js/suntimes.js", "media/bong.mp3", "media/clock.svg", "media/tick.mp3", "css/clock.css"]

let cacheName = version;

let noCache = ["sw.js", "version.js"]; //allow cache, but try to load if online