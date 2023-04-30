"use strict";

let ls = localStorage.getItem("clock");
if (ls) {
    ls = JSON.parse(ls);
}

let {colors, currentColor, alarmOn, alarmTime} = ls ?? {
    colors: [
        {
            from: "00:00",
            color: "white",
            bg: "black"
        },
        {
            from: "00:00",
            color: "white",
            bg: "black"
        }
    ], currentColor: 0, alarmOn: false, alarmTime: ""
};

let alarmPlay = false;
let audio = new Audio("bong.mp3");
let page = {};
let userInteract = false;

document.onpointerdown = e => {
    userInteract = true;
};


function runIt() {
    console.clear();

    document.querySelectorAll("*[id]").forEach((val) => {
        page[val.id] = val;
    });

    for (let col = 0; col < 2; col++) {
        page["from" + col].value = colors[col].from;
        page["color" + col].value = colors[col].color;
        page["bg" + col].value = colors[col].bg;
    }
    page.alarm.checked = alarmOn;
    page.alarmtime.value = page.alarmtimetext.innerHTML = alarmTime;


    let oldTime = "";
    let flash = 0;

    function currentTime() {
        let date = new Date();
        let hh = date.getHours();
        let mm = date.getMinutes();
        let session = "AM";
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        let hhx = (hh < 10) ? "0" + hh : hh;

        if (hh == 0) {
            hh = 12;
        }

        if (hh > 12) {
            hh = hh - 12;
            session = "PM";
        }

        mm = (mm < 10) ? "0" + mm : mm;

        let time = hh + ":" + mm;
        let timeForAlarm = hhx + ":" + mm;

        if (oldTime !== time) {
            page.clock.innerText = time;
            page.clockhead.innerText = days[date.getDay()] + "   " + session;
            oldTime = time;
            if (alarmOn && alarmTime == timeForAlarm) {
                console.log("Alarm");
                alarmPlay = true;
            }
            for (let n = 0; n < colors.length; n++) {
                if (colors[n].from == timeForAlarm) {
                    currentColor = n;
                }
            }
        }

        let r = 0, g = 0, b = 0, c = 0;

        r += 96; b += 96; g += 96;
        //reportDiv.innerText = `rgb(${r}, ${g}, ${b})`;
        document.body.style.color = colors[currentColor].color;
        document.body.style.backgroundColor = colors[currentColor].bg;

        if (userInteract || !alarmOn) {
            if (alarmPlay) {
                audio.play();
            }
        } else {
            document.body.style.color = flash ? "black" : "white";
            flash = (flash + 1) % 2;
            document.body.style.backgroundColor = flash ? "black" : "white";
        }

        setTimeout(function () {currentTime()}, 1000);
    }
    currentTime();
}

function store() {
    localStorage.setItem("clock", JSON.stringify({colors, currentColor, alarmOn, alarmTime}));
}

function setColor(val, ix) {
    colors[ix].color = val;
    currentColor = ix;
    store();
}

function setBg(val, ix) {
    colors[ix].bg = val;
    currentColor = ix;
    store();
}

function setColorTime(val, ix) {
    colors[ix].from = val;
    currentColor = ix;
    store();
}

function goToWork(e) {
    document.documentElement.requestFullscreen();
}

function setAlarm(checked) {
    alarmOn = !!checked
    page.alarmtimetext.innerText = alarmTime;
    if (!alarmOn) {
        alarmPlay = false;
    }
    store();
}

function setAlarmTime(val) {
    alarmTime = val;
    page.alarmtimetext.innerText = alarmTime;
}
