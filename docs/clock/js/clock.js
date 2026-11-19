"use strict";

const longDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let storage = new CbStorage("clock");

let vals = storage.getStorage();
if (Object.keys(vals).length == 0) {
    storage.setStorage({
        colors: [
            {
                from: "00:00",
                color: "#ffffff",
                bg: "#000000"
            }
        ], currentColor: 0, alarmOn: false, alarmTime: "", chimestart: "", chimeend: "", chime: 0, tick: 0, show: "ampm"
    });
}

let {colors, currentColor, alarmOn, alarmTime, latitude, longitude, hr24, chimestart, chimeend, chime, tick, show, disableAlarm} = storage.getStorage();

let bgColor = colors[0].bg;
let fgColor = colors[0].color;


let descriptions = {
    dawn: "Dawn",
    dusk: "Dusk"
}

show = show ? show : "ampm";

let alarmPlay = 0;
let alarmPlaying = false;
let alarmMissed = false;
let alarmQuiet = 0;
let chimeOn = false;
let bong = new Audio("media/bong.mp3");
let tickSound = new Audio("media/tick.mp3");
let page = {};
let userInteract = false;
let wakeLock;
let scrollTimeout;
let oldTime = "";
let dragFrom = null;
var randomColor = "000000";
let bgRand = [];
let colorRand = [];
let dayOfMonth = ";"
let logEvents = {};
let notScrolled = true;
let untouchTimer;
let timeAdjust = 0;

let runItStub = () => { };
let everySecondStub = () => { };
let moreDomLoaded = e => { };
let chimeEnded = () => { };

bong.preservesPitch = false;

bong.addEventListener("ended", (event) => {
    alarmPlay -= 1;
    alarmPlaying = true;
    if (alarmPlay > 0) {
        bong.volume = 1 / (alarmQuiet + 1);
        if (alarmQuiet > 0) {
            alarmQuiet--;
        }
        chimeEnded();
        bong.play();
    } else {
        chimeEnded = () => { };
        alarmPlay = 0;
        alarmPlaying = false;
        alarmQuiet = 0;
        bong.volume = 1;
    }
});

function setMinAlarmPlay(count) {
    if (alarmPlay <= count) {
        alarmPlay = count;
        return true;
    }
    return false;
}

function logEvent(str, jsonData) {
    if (!jsonData) {
        jsonData = {name: "system", text1: str};
        console.log(str);
    }
    let date = new Date().toLocaleString();
    let eventList = logEvents[jsonData.name];
    if (!eventList) {
        eventList = logEvents[jsonData.name] = [];
    }
    jsonData.date = date;
    eventList.push(jsonData);
    if (eventList.length > 40) {
        eventList.shift();
    }
    viewLog(jsonData.name);
}

function viewLog(name) {
    let eventList = logEvents[name] ?? [];
    let allLines = name + "\n\n";
    eventList.forEach(ev => {
        Object.values(ev).reverse().forEach(v => {
            if (v != name) {
                allLines += v + " ";
            }
        });
        allLines += "\n";
    });
    page.log.value = allLines;
    page.log.scrollTo(0, page.log.scrollHeight);
}

const beforeUnloadHandler = (event) => {
    event.preventDefault();
    event.returnValue = true;
};

document.addEventListener("pointerdown", e => {
    userInteract = true;
});

document.addEventListener("DOMContentLoaded", e => {
    getElementsAsPage();
    try {
        let x = version;
    } catch (e) {
        console.log("No version");
        let version = "?"
    }
    logEvent("Started - version " + version);
    setTimeout(() => {
        window.scroll(0, 0);
    }, 1000);

    document.addEventListener("pointerdown", doScroll);
    document.addEventListener("pointerup", doScroll);
    //document.addEventListener("pointermove", doScroll);
    document.addEventListener("scroll", (event) => {
        notScrolled = (window.scrollY == 0);
        page.main.style.display = notScrolled ? "block" : "none";
        page.overlay.style.display = notScrolled ? "block" : "none";
        if (!notScrolled) {
            clearTimeout(untouchTimer);
            page.overlay.className = ""; //so no animation
        }
    });

    window.addEventListener("beforeunload", beforeUnloadHandler);

    moreDomLoaded(e)
    getElementsAsPage();

    document.documentElement.style.setProperty("--bgColor", bgColor);
    document.documentElement.style.setProperty("--fgColor", fgColor);

    runIt();
});

function getElementsAsPage() {
    page = {};
    document.querySelectorAll("*[id]").forEach((val) => {
        page[val.id] = val;
    });
}

function runIt() {
    //console.clear();
    console.log(storage.getStorage());

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

    document.addEventListener("visibilitychange", async () => {
        if (wakeLock !== null && document.visibilityState === "visible") {
            setWakelock();
        }
    });

    setWakelock();

    setColorChoices();
    page.alarm.checked = alarmOn;
    setAlarm(alarmOn);
    checkForChime();

    calcCurrentColor();

    page.alarmtime.value = alarmTime;
    page.chimestart.value = chimestart;
    page.chimeend.value = chimeend;
    page.chimetype.value = chime;
    page.ticktype.value = tick;
    page.disablealarm.checked = disableAlarm;

    page.disablealarm.onchange = e => {
        disableAlarm = e.target.checked;
        store();
    }

    page.show.onchange = e => {
        show = e.target.value;
        store();
    }

    page.alarmlabel.onpointerdown = e => {
        e.stopPropagation();
    }

    page.hr24.checked = !!hr24;

    function currentTime() {
        let date = new Date(Date.now() + timeAdjust);
        let hh = date.getHours();
        let mm = date.getMinutes();
        let days = longDayNames;
        let months = shortMonthNames;
        //let suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
        let chimePlay = false;

        let {time, time24Hour, session} = formatTime(hh, mm);

        if (show == "date") {
            //let monthDay = date.getDate();
            let suffix = ""; //suffixes[monthDay % 10]
            // if (monthDay > 10 && monthDay < 14) {
            //     suffix = "th";
            // }
            session = date.getDate() + suffix + " " + months[date.getMonth()];
            days = shortDayNames;
        }

        if (oldTime !== time) {
            page.clock.innerText = time;
            page.clockhead.innerText = days[date.getDay()] + "   " + session;
            if (alarmOn && alarmTime == time24Hour) {
                //console.log("Alarm");
                setMinAlarmPlay(120); //bongs max
                bong.playbackRate = 2;
                alarmQuiet = 20;
                logEvent("alarm");
            }

            if (chimestart && chimeend) {
                if (chimestart == time24Hour) {
                    chimeOn = true;
                }
                if (chime && chimeOn) {
                    let mod = mm % chime;
                    if (mod == 0) {
                        bong.playbackRate = 1;
                        chimePlay = true;
                    }
                }
                if (chimeend == time24Hour) {
                    chimeOn = false;
                }
            }

            for (let n = 0; n < colors.length; n++) {
                if (colors[n].from == time24Hour) {
                    currentColor = n;
                }
            }

            if (show == "black") {
                page.main.style.transitionDuration = "0s";
                bgColor = page.main.style.backgroundColor = "black";
                fgColor = page.main.style.color = "black";
            } else {
                calculateDawnAndDusk();
                page.main.style.transitionDuration = "10s";
                fgColor = page.main.style.color = colors[currentColor].color;
                bgColor = page.main.style.backgroundColor = colors[currentColor].bg;
                page.overlay.style.transitionDuration = "10s";
                page.overlay.style.color = colors[currentColor].color;
                page.overlay.style.backgroundColor = colors[currentColor].bg;
                document.documentElement.style.setProperty("--bgColor", bgColor);
                document.documentElement.style.setProperty("--fgColor", fgColor);
            }
        }

        if (disableAlarm) {
            page.alarmlabel.style.display = "none";
            page.alarm.checked = false;
            alarmTime = "";
            page.alarmtime.value = "";
            if (alarmOn) {
                setAlarm(false);
            }
        } else {
            page.alarmlabel.style.display = "block";
        }

        if (userInteract) {
            if ((alarmPlay > 0 || chimePlay) && !alarmPlaying) {
                alarmPlaying = true;
                bong.volume = 1 / (alarmQuiet + 1);
                if (alarmQuiet > 0) {
                    alarmQuiet--;
                }
                bong.play();
                alarmMissed ||= alarmPlay > 0; //avoid clearing on chime
            } else if (chimeOn && (mm % tick) == 0 && oldTime != time) {
                tickSound.play();
            }
        }
        everySecondStub(oldTime, time, page.clockhead.innerText, time24Hour);
        oldTime = time;
        setTimeout(function () {currentTime()}, 1000);
    }
    currentTime();

    runItStub();
    //end of runIt
}

function formatTime(hh, mm) {
    let session = "AM";
    let hhx = (hh < 10) ? "0" + hh : hh;

    if (hr24) {
        session = "";
    } else {
        if (hh >= 12) {
            session = "PM";
        }
        hh = (hh % 12) || 12;
    }
    mm = (mm < 10) ? "0" + mm : mm;

    let time = hh + ":" + mm;
    let time24Hour = hhx + ":" + mm;

    return {time, time24Hour, session};
}

function calcCurrentColor() {
    //We need to go through 24 hours to get the color now
    let date = new Date();
    let hhnow = date.getHours();
    let mmnow = date.getMinutes();
    let timeNow = formatTime(hhnow, mmnow).time24Hour;
    mmnow++;
    let timeCalc = "";
    for (let hh = hhnow; timeNow != timeCalc; hh = (hh + 1) % 24) {
        for (let mm = mmnow; mm < 60 && timeNow != timeCalc; mm++) {
            timeCalc = formatTime(hh, mm).time24Hour;
            for (let n = 0; n < colors.length; n++) {
                if (colors[n].from == timeCalc) {
                    currentColor = n;
                    //console.log(timeCalc, currentColor);
                }
            }
        }
        mmnow = 0;
    }
    setPreviewColors();
    page.location.style.display = (latitude || longitude) ? "inherit" : "none";
}

function setColorChoices() {
    page.choices.innerHTML = "";
    let table = document.createElement("table");
    page.choices.appendChild(table);
    for (let col = 0; col < colors.length; col++) {
        let row = document.createElement("tr");
        table.appendChild(row);
        let from = colors[col].from;
        let color = colors[col].color;
        let bg = colors[col].bg;
        let timeInput = `<td id="spa${col}"> From <input id="from${col}" type="time" value="${from}" oninput="setColorTime(event.target.value, ${col})"></td> `;
        if (colors[col].type) {
            timeInput = "<td>" + descriptions[colors[col].type] + "</td>";
        }
        row.innerHTML += timeInput +
            `<td><input id="color${col}" type="color" value="${color}" oninput="setColor(event.target.value, ${col});"> <br><input id="bg${col}" type="color" value="${bg}" oninput="setBg(event.target.value, ${col});"></td>
        <td id="pre${col}" style="border: 1px solid black; font-size: 300%; font-weight: bold;">&nbsp;12:34&nbsp;</td>
        <td><input id="del${col}" type="button" value="x" onclick="deleteColor(${col});"></td>
    `;
    }
    page.choices.className = "len" + colors.length;
    document.querySelectorAll("*[id]").forEach((val) => {
        page[val.id] = val;
    });
}

function checkForChime() {
    let date = new Date();
    let hhnow = date.getHours();
    let mmnow = date.getMinutes();
    let timeNow = formatTime(hhnow, mmnow).time24Hour;
    let willChime = false;
    mmnow++;
    let time24Hour = "";
    for (let hh = hhnow; timeNow != time24Hour; hh = (hh + 1) % 24) {
        for (let mm = mmnow; mm < 60 && timeNow != time24Hour; mm++) {
            time24Hour = formatTime(hh, mm).time24Hour;
            if (chimestart == time24Hour) {
                willChime = true;
            }
            if (chimeend == time24Hour) {
                willChime = false;
            }
        }
        mmnow = 0;
    }
    chimeOn = willChime;
    console.log("chime ", chimeOn)
}

function store() {
    storage.assignStorage({colors, currentColor, alarmOn, alarmTime, latitude, longitude, hr24, chimestart, chimeend, chime, tick, show, disableAlarm});
    oldTime = "";
}

function doScroll(e) {
    clearTimeout(scrollTimeout);
    alarmMissed = false;
    alarmPlay = 0;
    alarmMissed = false;
    scrollTimeout = window.setTimeout(() => {
        document.activeElement.blur();
        page.runit.focus();
        page.runit.blur(); //all this dance to deal with time inputs
        window.scroll(0, 0);
        calcCurrentColor();
    }, 30000);
}

function setColor(val, ix) {
    colors[ix].color = val;
    setPreviewColors();
    store();
}

function setBg(val, ix) {
    colors[ix].bg = val;
    setPreviewColors();
    store();
}

function setPreviewColors() {
    colors.forEach((col, ix) => {
        if (page["pre" + ix]) {
            page["pre" + ix].style.color = col.color;
            page["pre" + ix].style.backgroundColor = col.bg;
        }
    });
}

function setColorTime(val, ix) {
    colors[ix].from = val;
    currentColor = ix;
    store();
}

function addColor(type) {
    const col = {
        type,
        from: "00:00",
        color: "#ffffff",
        bg: "#000000"
    };
    let ok = true;
    colors.forEach(c => {
        if (c.type && c.type == type) {
            ok = false;
        }
    });
    if (!ok) {
        return;
    }
    if (type && !latitude && !longitude) {
        getLocation(() => {colors.push(col);});
    } else {
        colors.push(col);
        setColorChoices();
        calcCurrentColor();
        store();
    }
}

function getLocation(func) {
    if (window.confirm("Requires your location, only stored locally. Continue?")) {
        navigator.geolocation.getCurrentPosition(position => {
            latitude = position.coords.latitude + (Math.random() / 100);
            longitude = position.coords.longitude + (Math.random() / 100);
            if (func) func();
            setColorChoices();
            calcCurrentColor();
            store();
        });
    }
}

function deleteColor(colIndex) {
    if (colors.length > 1) {
        colors.splice(colIndex, 1);
        setColorChoices();
        calcCurrentColor();
        store();
    }
}

function goToWork() {
    document.documentElement.requestFullscreen();
    page.runit.style.position = "static";
    page.runit.style.fontSize = "4vw";
    page.runit.style.float = "right";
    page.runit.value = "Full screen";
    page.overlay.style.pointerEvents = "initial";
    runIt();
    store();
}

function calculateDawnAndDusk() {
    if (!latitude || !longitude) {
        return;
    }
    let times = {};
    let types = ["dawn", "dusk"];
    let sunt = suntimes(latitude, longitude);
    sunt.forEach((st, ix) => {
        let hrs = Math.floor(st);
        let mins = Math.floor((st - hrs) * 60);
        times[types[ix]] = (hrs < 10 ? "0" + hrs : hrs.toString()) + ":" + (mins < 10 ? "0" + mins : mins.toString());
    });
    colors.forEach(col => {
        if (col.type) {
            col.from = times[col.type];
        }
    })
}

function setAlarm(checked) {
    if (!!checked && !alarmTime) {
        page.alarmtime.focus();
        page.alarm.checked = false;
        return;
    }
    alarmOn = !!checked
    if (alarmOn) {
        page.alarmlabel.innerText = alarmTime;
    } else {
        page.alarmlabel.innerText = "Alarm ";
    }
    if (!alarmOn) {
        alarmPlay = 0;
        alarmMissed = false;
    }
    store();
}

function setAlarmTime(val) {
    alarmTime = val;
    page.alarm.checked = true;
    setAlarm(true);
    store();
}

function setChimeTime(value, type) {
    switch (type) {
        case 0: chimestart = value; break;
        case 1: chimeend = value; break;
        case 2: chime = value * 1; break;
    }
    store();
    checkForChime();
}

function setTickType(type) {
    tick = type * 1;
    store();
}

function locationAction(action) {
    if (action == "clear") {
        colors = colors.filter(col => {
            if (col.type) {
                return false;
            }
            return true;
        });
        latitude = longitude = null;
        store();
    }
    if (action == "change") {
        getLocation();
    }
    setColorChoices();
    calcCurrentColor();
    store();
}

function change24hr(val) {
    hr24 = !!val;
    oldTime = "";
    store();
}

function startDrag(e) {
    console.log(e);
    if (e.target.type == "color") {
        dragFrom = e.target;
    }
}

function endDrag(e) {
    if (dragFrom == null) {
        return;
    }
    console.log(e);
    let part = e.target.id.match(/[a-z]+|\d+/ig);
    if (!part || part.length != 2) {
        dragFrom = null;
        return;
    }
    if (part[0] == "pre") {
        part[0] = dragFrom.id.match(/[a-z]+|\d+/ig)[0];
    }
    let target = document.getElementById(part[0] + part[1]);
    if (target && target.type == "color") {
        target.value = dragFrom.value;
        if (part[0] == "bg") {
            setBg(dragFrom.value, part[1]);
        } else {
            setColor(dragFrom.value, part[1]);
        }
    }
    dragFrom = null;
} 
