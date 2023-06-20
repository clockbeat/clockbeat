let pvid = "";
let plist = "";

function doIt() {
    console.clear();
    let audio = new Audio("bong.mp3");
    audio.loop = true;
    let page = {};
    let all = document.querySelectorAll("*[id]");
    all.forEach((val) => {
        page[val.id] = val;
    });

    let storage = new CbStorage("homealert");
    plist = storage.getItem("plist");
    pvid = storage.getItem("pvid");

    document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
            setWakelock();
        }
    });

    if (plist && pvid) {
        page.urls.style.display = "none";
    }

    page.urlform.onsubmit = e => {
        plist = page.plist.value;
        pvid = page.pvid.value;
        e.preventDefault();
        storage.applyObj({plist, pvid});
    }

    page.overlay.onclick = e => {
        if (pvid && plist) {
            document.documentElement.requestFullscreen();
            audio.pause();
            page.video.src = "";
            setWakelock();
        }
    };

    let headers = new Headers({
        "Content-Type": "text/plain"
    });

    let delay = 1000;
    let lastHash = "";

    function runMonitor() {
        setTimeout(() => {
            audio.pause();
            fetch(plist, {
                method: "GET",
                headers: headers
            }).then(response => {
                response.text().then(
                    processAlerts
                );
            }).catch(e => {
                console.log(new Date().toISOString(), e);
            });
        }, delay);
    }

    runMonitor();

    function processAlerts(alerts) {
        if (!lastHash) {
            lastHash = hash(alerts);
        } else {
            let newHash = hash(alerts);
            if (newHash !== lastHash) {
                page.video.src = pvid;
                lastHash = newHash;
                console.log("Alert");
                audio.play();
                delay = 60000;
                runMonitor();
                return;
            }
        }
        delay = 1000;
        runMonitor();
    }

    function hash(str) {
        var hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            let chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}

let setWakelock = async () => {
    if (!navigator.wakeLock) {
        console.log("wakeLock only in secure context");
        return;
    }
    try {
        //
        await navigator.wakeLock.request('screen');
        console.log("Wake Lock set");
    } catch (err) {
        console.log(`${err.name}, ${err.message}`);
    }
}
