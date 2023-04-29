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

    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    let width = 1;
    let height = 1;
    let reportDiv = document.getElementById("report");
    let brightness = 127;

    navigator.getUserMedia({
        video: {
            width: {min: 8, ideal: 8},
            height: {min: 8, ideal: 8}
        }
    }, function (localMediaStream) {
        var video = document.querySelector('video');
        video.onloadedmetadata = function (e) {
            let settings = localMediaStream.getTracks()[0].getSettings();
            console.log(e, settings);
            width = canvas.width = settings.width;
            height = canvas.height = settings.height;
        };
        video.srcObject = localMediaStream;

        function step() {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            let data = ctx.getImageData(0,0,width, height);
            for (let p = 0; p<data.data.length; p+=4) {
                let r = data.data[p + 0];
                let g = data.data[p + 1];
                let b = data.data[p + 2];
                brightness = (brightness * 0.9999) + (((0.2126*r) + (0.7152*g) + (0.0722*b)) * 0.0001); 
                //https://en.wikipedia.org/wiki/Relative_luminance
                reportDiv.innerText = Math.floor(brightness);
            }
            requestAnimationFrame(step);
          }
          requestAnimationFrame(step);

    }, errorCallback);




}

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
