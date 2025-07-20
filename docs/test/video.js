"use strict";

function runIt() {
    console.clear();

    var errorCallback = function (e) {
        console.log('Rejected!', e);
    };

    let canvas = new OffscreenCanvas(10, 10);
    const context = canvas.getContext("2d");

    //Display code only
    let canvas2 = document.getElementById("canvas2"); //new OffscreenCanvas(1, 1);// document.
    const context2 = canvas2.getContext("2d");
    let vals = document.getElementById("vals");

    let video = document.querySelector('video');

    let pass1 = new Uint8Array(400);
    let imMoves = new Uint8Array(400);
    let consecutive = 0;
    let interval = 200;
    let pixelMult = 20;
    let durationTrigger = 1000
    let fire = 2 * durationTrigger / interval;
    let captured = false;

    // document.body.onclick = e => {
    //     if (document.fullscreenElement) {
    //         document.exitFullscreen();
    //     } else {
    //         document.documentElement.requestFullscreen();
    //     }
    // }

    function doCapture() {

        if (video.paused) {
            setTimeout(doCapture, interval);
            return;
        }

        context.save();
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        context.restore();

        for (let c = 0; c < 3; c++) {
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    let p = ((y * 10 + x) * 4) + c;

                    pixelMult = 20 - (Math.abs(5 - x) + Math.abs(5 - y));

                    let pSmooth = imageData.data[p] * 0.2 + pass1[p] * 0.8;

                    imMoves[p] = Math.abs(pSmooth - pass1[p]) * pixelMult;

                    pass1[p] = pSmooth;
                }
            }
        }

        //Display code only
        context2.save();
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                let p = (y * 10 + x) * 4;
                context2.fillStyle = `rgb(${imMoves[p]}, ${imMoves[p + 1]}, ${imMoves[p + 2]})`;
                context2.fillRect(x * 20, y * 20, 20, 20);
            }
        }
        context2.restore();

        imMoves.sort((a, b) => a - b);
        const move = imMoves[300] / imMoves[200] > 2;
        if (move) {
            consecutive += 2;
        } else if (consecutive > 0) {
            consecutive--;
        }
        if (consecutive >= fire) {
            consecutive = fire;
        }

        if (consecutive == 0) {
            captured = false;
        }

        const reportMovement = move && consecutive == fire && !captured;

        //Display code only
        vals.style.backgroundColor = reportMovement ? "red" : (consecutive > 0 ? "yellow" : "green");
        vals.innerHTML = `${imMoves[200]}, ${imMoves[300]}, for, ${consecutive}`;
        if (reportMovement) {
            //video.pause();
            captured = true;
            takePhoto();
        }

        setTimeout(doCapture, interval);
    }
    //consecutive

    console.log(navigator.mediaDevices.getSupportedConstraints());

    if (false) {
        let sel = document.getElementById("filesel");
        sel.onchange = e => {
            video.src = URL.createObjectURL(sel.files[0]);
            console.log(sel.files[0], video.canPlayType(sel.files[0].type));
        }
        video.onloadedmetadata = function (e) {
            doCapture();
            //video.play();
        };
    } else {
        navigator.getUserMedia({
            video: {
                muted: true,
                playsinline: true,
                facingMode: "environment",
                width: 128,
                height: 72,
                framerate: 1
            }
        }, function (localMediaStream) {
            video.onloadedmetadata = function (e) {
                const track = localMediaStream.getTracks()[0];
                console.log("Capabilities", track.getCapabilities());
                let settings = track.getSettings();
                console.log(e, settings);
                doCapture();
            };
            video.srcObject = localMediaStream;

            // function step() {

            //     requestAnimationFrame(step);
            // }
            // requestAnimationFrame(step);

        }, errorCallback);
    }

    let oldTime = "";

    // brightness = (brightness * 0.9) + (((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) * 0.1);
    //https://en.wikipedia.org/wiki/Relative_luminance

    function takePhoto() {
        if (!video) {
            logEvent("Video not active");
            return;
        }
        let canvas = new OffscreenCanvas(200, 200);
        // canvas.width = 200;
        // canvas.height = 200;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "#fff";
        context.fillText(`${imMoves[200]}, ${imMoves[300]}, for, ${consecutive}`, 10, canvas.height - 20);

        canvas.convertToBlob().then(blob => {
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = e => {
                const image = document.createElement("img");
                image.src = e.target.result
                document.body.append(image);
            }
        });
    }

}


