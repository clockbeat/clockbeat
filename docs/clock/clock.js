"use strict";

let ls = localStorage.getItem("clock");
if (ls) {
    ls = JSON.parse(ls);
}

let {colors, currentColor, alarmOn, alarmTime, weatherKey, latitude, longitude} = ls ?? {
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
let alternateDisplay = false;

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
    setAlarm(alarmOn);

    let oldTime = "";
    let flash = 0;

    let altTimer = 0;

    calcCurrentColor();

    getWeather();

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

            getWeather();

            altTimer = 0;
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

        if (alternateDisplay) {
            showAlt(altTimer);
            altTimer++;
        }

        setTimeout(function () {currentTime()}, 1000);
    }
    currentTime();
}

function showAlt(timer) {
    if (timer % 60 == 30 - 3) {
        page.clock.style.opacity = 0;
        page.weather.style.opacity = 1;
    }
    if (timer % 60 == 30 + 3) {
        page.clock.style.opacity = 1;
        page.weather.style.opacity = 0;
    }
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
                    //console.log(timeCalc, currentColor);
                }
            }
        }
        mmnow = 0;
    }
    //console.log("Recalculated current = " + currentColor);
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
    localStorage.setItem("clock", JSON.stringify({colors, currentColor, alarmOn, alarmTime, weatherKey, latitude, longitude}));
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
    page.alarmlabel.innerText = "Alarm " + alarmTime + (alarmOn ? " On" : " Off");
    if (!alarmOn) {
        alarmPlay = false;
    }
    store(false);
}

function setAlarmTime(val) {
    alarmTime = val;
    page.alarm.checked = true;
    setAlarm(true);
    store();
}

function setWeatherKey(val) {
    weatherKey = val;
    if (val && val.length > 20) {
        getLocation();
    }
    store();
}

function getLocation() {
    navigator.geolocation.getCurrentPosition(position => {
        //console.log(position);
        latitude = position.coords.latitude + (Math.random() / 100);
        longitude = position.coords.longitude + (Math.random() / 100);;
        store();
    });
}

function clearLocation() {
        latitude = "";
        longitude = "";
        store();
}

function resetWeatherKey(msg) {
    page.weatherkey.value = msg ?? "";
    weatherKey = "";
    alternateDisplay = false;
    store();
}

function getWeather() {
    if (weatherKey && latitude && longitude) {
        alternateDisplay = true;
        let current = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${weatherKey}`;
        fetch(current).then(response => {
            response.json().then(data => {
                if (data.cod == 401) {
                    resetWeatherKey("bad key");
                    return;
                }
                let weather = Math.round(data.main.temp) + "&deg;";
                page.temp.innerHTML = weather;
                page.curImg.src = getIcon(data);
            });
        });
        let forecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${weatherKey}`;
        fetch(forecast).then(response => {
            response.json().then(data => {
                if (data.cod == 401) {
                    resetWeatherKey("bad key");
                    return;
                }
                page.fc.innerHTML = "";
                for (let n = 0; n < 3; n++) {
                    let div = document.createElement("div");
                    div.style.display = "inline-block";
                    div.style.whiteSpace = "nowrap";
                    let img = document.createElement("img");
                    img.style.width = "10vw";
                    img.src = getIcon(data.list[n + 1]);
                    let dt = new Date(data.list[n + 1].dt * 1000);
                    let {time} = formatTime(dt.getHours(), dt.getMinutes());
                    let tm = document.createElement("span");
                    tm.innerHTML = time;
                    tm.style.fontSize = "3vw";
                    tm.style.verticalAlign = "top";
                    div.appendChild(img);
                    div.appendChild(tm);
                    page.fc.appendChild(div);
                }
            });
        });
    }

    function getIcon(data) {
        let iconName = "w" + data.weather[0].icon;
        if (!weatherIcons[iconName]) {
            iconName = iconName.replace("n", "d"); //use day eqiv to night
        }
        let icon = weatherIcons[iconName];
        if (!icon)
            debugger;
        return "data:image/svg+xml;utf8," + weatherIcons[iconName];
    }
}


