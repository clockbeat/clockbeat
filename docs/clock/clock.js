"use strict";

let ls = localStorage.getItem("clock");
if (ls) {
    ls = JSON.parse(ls);
}

let {colors, currentColor, alarmOn, alarmTime} = ls ?? {
    colors: [
        {
            from: "00:00",
            color: "#ffffff",
            bg: "#000000"
        }
    ], currentColor: 0, alarmOn: false, alarmTime: ""
};

let alarmPlay = false;
let audio = new Audio("bong.mp3");
let page = {};
let userInteract = false;
let wakeLock;
let scrollTimeout;

document.onpointerdown = e => {
    userInteract = true;
};


function runIt() {
    console.clear();

    document.querySelectorAll("*[id]").forEach((val) => {
        page[val.id] = val;
    });

    document.addEventListener("visibilitychange", async () => {
        if (wakeLock !== null && document.visibilityState === "visible") {
            setWakelock();
        }
    });

    setWakelock();

    setColorChoices();
    page.alarm.checked = alarmOn;
    page.alarmtime.value = page.alarmtimetext.innerHTML = alarmTime;
    setAlarm(alarmOn);

    let oldTime = "";
    let flash = 0;

    calcCurrentColor();

    function currentTime() {
        let date = new Date();
        let hh = date.getHours();
        let mm = date.getMinutes();
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        let {time, timeForAlarm, session} = formatTime(hh, mm);

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

        page.main.style.color = colors[currentColor].color;
        page.main.style.backgroundColor = colors[currentColor].bg;

        if (page.disablealarm.checked) {
            page.alarmlabel.style.display = "none";
            page.alarm.checked = false;
            setAlarm(false);
        } else {
            page.alarmlabel.style.display = "block";
        }

        if (userInteract || !alarmOn) {
            if (alarmPlay) {
                audio.play();
            }
        } else {
            page.main.style.color = flash ? "black" : "white";
            flash = (flash + 1) % 2;
            page.main.style.backgroundColor = flash ? "black" : "white";
        }

        setTimeout(function () {currentTime()}, 1000);
    }
    currentTime();
}

function formatTime(hh, mm) {
    let session = "AM";
    let hhx = (hh < 10) ? "0" + hh : hh;

    if (hh >= 12) {
        session = "PM";
    }

    hh = (hh % 12) || 12;
    mm = (mm < 10) ? "0" + mm : mm;

    let time = hh + ":" + mm;
    let timeForAlarm = hhx + ":" + mm;
    return {time, timeForAlarm, session};
}

function calcCurrentColor() {
    //We need to go through 24 hours to get the color now
    let date = new Date();
    let hhnow = date.getHours();
    let mmnow = date.getMinutes();
    let timeNow = formatTime(hhnow, mmnow).timeForAlarm;
    mmnow++;
    let timeCalc = "";
    for (let hh = hhnow; timeNow != timeCalc; hh = (hh + 1) % 24) {
        for (let mm = mmnow; mm < 60 && timeNow != timeCalc; mm++) {
            timeCalc = formatTime(hh, mm).timeForAlarm;
            for (let n = 0; n < colors.length; n++) {
                if (colors[n].from == timeCalc) {
                    currentColor = n;
                    console.log(timeCalc, currentColor);
                }
            }
        }
        mmnow = 0;
    }
    console.log("Recalculated current = " + currentColor);
}

function setColorChoices() {
    page.choices.innerHTML = "";
    for (let col = 0; col < colors.length; col++) {
        let from = colors[col].from;
        let color = colors[col].color;
        let bg = colors[col].bg;
        page.choices.innerHTML += `
        <br><span id="spa${col}"> From <input id="from${col}" type="time" value="${from}" oninput="setColorTime(event.target.value, ${col})"></span>
        Text <input id="color${col}" type="color" value="${color}" oninput="setColor(event.target.value, ${col});">
        Background <input id="bg${col}" type="color" value="${bg}" oninput="setBg(event.target.value, ${col});">
        <input id="del${col}" type="button" value="x" onclick="deleteColor(${col});">
    `;
    page.choices.className = "len" + colors.length;
    }
}

function addColor() {
    colors.push({
        from: "00:00",
        color: "#ffffff",
        bg: "#000000"
    });
    setColorChoices();
    calcCurrentColor();
    store();
}

function deleteColor(col) {
    if (colors.length > 1) {
        colors.splice(col, 1);
        setColorChoices();
        calcCurrentColor();
        store();
    }
}


function colorChoices(col, from, text, bg) {
    return
}

let setWakelock = async () => {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log("Wake Lock set");
        wakeLock.addEventListener("release", () => {
            console.log("Wake Lock released");
        });
    } catch (err) {
        console.log(`${err.name}, ${err.message}`);
    }
}

function store(doScroll) {
    localStorage.setItem("clock", JSON.stringify({colors, currentColor, alarmOn, alarmTime}));
    if (doScroll !== false) {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
            window.scroll({top: 0, left: 0, behavior: "smooth"});
            calcCurrentColor();
        }, 5000);
    }
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
    store();
}

function setAlarm(checked) {
    if (!!checked && !alarmTime) {
        page.alarmtime.focus();
        page.alarm.checked = false;
        return;
    }
    alarmOn = !!checked
    page.alarmtimetext.innerText = alarmTime + (alarmOn ? " On" : " Off");
    if (!alarmOn) {
        alarmPlay = false;
    }
    store(false);
}

function setAlarmTime(val) {
    alarmTime = val;
    //page.alarmtimetext.innerText = alarmTime;
    page.alarm.checked = true;
    setAlarm(true);
    store();
}
