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
            canvas.width = settings.width;
            canvas.height = settings.height;
        };
        video.srcObject = localMediaStream;

        function step() {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(step);
          }
          requestAnimationFrame(step);

        // let frame_counter = 0;

        // const track = localMediaStream.getVideoTracks()[0];
        // const media_processor = new MediaStreamTrackProcessor(track);

        // const reader = media_processor.readable.getReader();
        // while (true) {
        //     reader.read().then(result => {
        //         debugger
        //         if (!result.done) {

        //             let frame = result.value;
        //             if (encoder.encodeQueueSize > 2) {
        //                 // Too many frames in flight, encoder is overwhelmed
        //                 // let's drop this frame.
        //                 frame.close();
        //             } else {
        //                 frame_counter++;
        //                 const insert_keyframe = frame_counter % 150 === 0;
        //                 encoder.encode(frame, {keyFrame: insert_keyframe});
        //                 frame.close();
        //             }
        //         }
        //     });
        // }

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
