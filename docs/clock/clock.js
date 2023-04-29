"use strict";

function runIt() {
    console.clear();

    // navigator.mediaDevices
    //     .enumerateDevices()
    //     .then((devices) => {
    //         devices.forEach((device) => {
    //             console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
    //         });
    //     })
    //     .catch((err) => {
    //         console.error(`${err.name}: ${err.message}`);
    //     });

    var errorCallback = function (e) {
        console.log('Rejected!', e);
    };

    let canvas = new OffscreenCanvas(1, 1);// document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    let width = 1;
    let height = 1;
    let reportDiv = document.getElementById("report");
    let brightness = 127;
    let clockDiv = document.getElementById("clock");
    let clockHead = document.getElementById("clockhead");
    let video = document.querySelector('video');

    navigator.getUserMedia({
        video: {
            width: {min: 8, ideal: 8},
            height: {min: 8, ideal: 8},
            facingMode: "user",
            framerate: 1,
        }
    }, function (localMediaStream) {
        video.onloadedmetadata = function (e) {
            let settings = localMediaStream.getTracks()[0].getSettings();
            console.log(e, settings);
            width = canvas.width = settings.width;
            height = canvas.height = settings.height;
        };
        video.srcObject = localMediaStream;

        // function step() {

        //     requestAnimationFrame(step);
        // }
        // requestAnimationFrame(step);

    }, errorCallback);

    let oldTime = "";

    function currentTime() {
        let date = new Date();
        let hh = date.getHours();
        let mm = date.getMinutes();
        let session = "AM";
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

        if (hh == 0) {
            hh = 12;
        }
        if (hh > 12) {
            hh = hh - 12;
            session = "PM";
        }

        //hh = (hh < 10) ? "0" + hh : hh;
        mm = (mm < 10) ? "0" + mm : mm;

        let time = hh + ":" + mm;

        if (oldTime !== time) {
            clockDiv.innerText = time;
            clockHead.innerText = days[date.getDay()] + "   " + session;
            oldTime = time;
        }

        let r = 0, g = 0, b = 0, c = 0;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let data = ctx.getImageData(0, 0, width, height);
        for (let p = 0; p < data.data.length; p += 4) {
            r += data.data[p + 0];
            g += data.data[p + 1];
            b += data.data[p + 2];
            c++;
        }
        c /= 0.625
        r /= c; g /= c; b /= c;

        r += 96; b += 96; g += 96;
        //reportDiv.innerText = `rgb(${r}, ${g}, ${b})`;
        clockDiv.style.color = `rgb(${r}, ${g}, ${b})`;

        setTimeout(function () {currentTime()}, 1000);
    }
    currentTime();


}

// brightness = (brightness * 0.9) + (((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) * 0.1);
//https://en.wikipedia.org/wiki/Relative_luminance

function Clock(div, width, height, options) {
    let canvas = document.createElement("canvas");
    let mouseClick = null;
    canvas.width = width;
    canvas.height = height;
    div.appendChild(canvas);

    let ctx = canvas.getContext("2d");

    function refresh() {
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        let canvasRect = getElementPosition(canvas);
        canvas.width = canvasRect.width;
        canvas.height = canvasRect.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

    }

    this.refresh = refresh;

    canvas.onmousedown = e => {
        mouseClick = {x: e.offsetX, y: e.offsetY};
        refresh();
        mouseClick = null;
        doMove(e);
    };

    canvas.addEventListener("mousemove", e => {
        doMove(e);
    });

    function doMove(e) {
        if (selectedPoint) {
            selectedPoint.getCanvasPos(e);
            selectedPoint.getValue(e);
            refresh();
        }
    }

    document.addEventListener("mouseup", e => {
        refresh();
    });

    function getElementPosition(element) {
        let rect = element.getBoundingClientRect();
        return {x: rect.left, y: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top};
    }

    new ResizeObserver(refresh).observe(canvas);
}
