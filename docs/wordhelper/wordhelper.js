
let main = document.getElementById("main");
let input = document.getElementById("input");
let reload = document.getElementById("reload");
let boxes = document.getElementById("boxes");
let left = document.getElementById("left");
let right = document.getElementById("right");
let wakelock = document.getElementById("wakelock");
let wakelockSentinel;
let table = addET(main, "table");
let selected;
let nextKey = 0;
let keyList = [];
let solved = [0, 0, 0, 0, 0];
let black = "&#9632;";
let white = "&#9633;";
let storageName = "wordhelper";
let storage = new CbStorage(storageName);
let currentKey = storage.getItem("currentKey") ?? "html1";
let html = storage.getItem(currentKey);

if (storage.getItem("wakelock") == "on") {
    (async () => {
        wakelockSentinel = await navigator.wakeLock.request('screen');
        wakelock.className = "wakeon";
    })();
}

let lsKeys = storage.keys();
if (lsKeys.length > 0) {
    lsKeys.forEach(key => {
        if (key.startsWith("html")) {
            keyList.push(key);
            let num = parseInt(key.substring(4, 99));
            nextKey = (num < nextKey) ? nextKey : num;
        }
    });
}
if (!keyList.includes(currentKey)) {
    keyList.push(currentKey);
    let num = parseInt(currentKey.substring(4, 99));
    nextKey = (num < nextKey) ? nextKey : num;
}
keyList.sort((a, b) => {
    let an = parseInt(a.substring(4, 99));
    let bn = parseInt(b.substring(4, 99));
    return an - bn;
});

nextKey++;

if (keyList.length < 2 || currentKey === keyList[0]) {
    left.style.visibility = "hidden";
} else {
    left.onclick = e => {
        save();
        let ix = keyList.indexOf(currentKey);
        storage.setItem("currentKey", keyList[ix - 1]);
        location.reload();
    }
}

right.onclick = e => {
    save();
    let ix = keyList.indexOf(currentKey);
    if (ix == keyList.length - 1) {
        storage.setItem("currentKey", "html" + nextKey);
    } else {
        storage.setItem("currentKey", keyList[ix + 1]);
    }
    location.reload();
}

wakelock.onclick = async e => {
    if (!wakelockSentinel) {
        try {
            wakelockSentinel = await navigator.wakeLock.request('screen');
            wakelock.className = "wakeon";
            storage.setItem("wakelock", "on");
        } catch (err) {
            // the wake lock request fails - usually system related, such being low on battery
            console.log(`${err.name}, ${err.message}`);
        }
    } else {
        wakelockSentinel.release();
        wakelock.className = "wakeoff";
        wakelockSentinel = null;
        storage.setItem("wakelock", "off");
    }
}


if (html) {
    table.innerHTML = html;
    let tds = Array.from(document.getElementsByTagName("td"));
    tds.forEach(td => {
        if (td.id[0] == "r") {
            applyTdOnClick(td);
        }
    });
} else {
    for (let r = 0; r < 12; r++) {
        let tr = addET(table, "tr");
        tr.className = "";
        tr.id = "r" + r;
        for (let c = 0; c < 6; c++) {
            let td = addET(tr, "td");
            td.id = "r" + r + "c" + c;
            td.innerHTML = "";
            applyTdOnClick(td);
            if (c == 5) {
                td.className = "del";
                td.innerHTML = "&#9776;";
                if (r == 0) {
                    tr.className = "b";
                    td.innerHTML = "&#10006;"
                }
            }
        }
    }
    save();
}

boxes.innerHTML = "";
keyList.forEach(key => {
    let sp = document.createElement("span");
    let thekey = key;
    sp.innerHTML = (currentKey === key) ? black : white;
    sp.onclick = e => {
        storage.setItem("currentKey", thekey);
        location.reload();
    };
    sp.style.margin = "auto";
    boxes.appendChild(sp);
});

reload.onclick = function (e) {
    storage.removeItem(currentKey);
    const ix = keyList.indexOf(currentKey);
    keyList.splice(ix, 1);
    if (keyList.length > 0) {
        storage.setItem("currentKey", keyList[Math.max(0, ix - 1)]);
    } else {
        storage.clear();
        if (wakelockSentinel) {
            storage.setItem("wakelock", "on");
        }
    }
    location.reload();
}

input.oninput = function (e) {
    const chr = input.value.toUpperCase();
    input.blur();
    if (chr == chr.toLowerCase()) {
        return;
    }
    input.value = "";
    let match;
    if (selected.className == "" || selected.className == "selected") {
        if (match = Array.from(document.querySelectorAll("tr.a td")).find(tc => {
            return (tc.innerHTML === chr);
        })) {
            let equiv = document.getElementById(match.parentElement.id + "c" + selected.id.split("c")[1]);
            equiv.className = "absent";
            if (selected && selected.className == "selected") {
                selected.className = "";
            }
            return;
        }
        let tr = selected.parentElement;
        document.getElementById(tr.id + "c5").innerHTML = "&#10006;";
        tr.className = "a";
        for (let n = 0; n < 5; n++) {
            let td = document.getElementById(tr.id + "c" + n);
            td.innerHTML = chr;
        }
        if (selected.className == "selected") {
            selected.className = "absent";
        }
    } else {
        selected.innerHTML = chr;
    }
    selected = null;
    save();
}

function applyTdOnClick(td) {
    let {r, c} = splitTdId(td.id);
    let tr = td.parentElement;
    if (c == 5) {
        td.onclick = e => {
            if (tr.className == "") {
                tr.className = "b";
                td.innerHTML = "&#10006;"
            } else {
                console.log(r, "del");
                for (let cx = 0; cx < 5; cx++) {
                    let tx = document.getElementById("r" + r + "c" + cx);
                    tx.innerHTML = "";
                    tx.className = "";
                }
                if (tr.className == "a") {
                    tr.remove();
                    table.appendChild(tr);
                }
                td.innerHTML = "&#9776;";
                tr.className = "";
            }
            save();
        };
    } else {
        td.onclick = e => {
            console.log(r, c);
            input.value = "";
            if (selected && (selected.className == "selected" || selected.className == "found")) {
                selected.className = "";
            }
            selected = td;
            if (tr.className == "") {
                selected.className = "selected";
                input.focus();
            } else if (tr.className == "a") {
                if (selected.className) {
                    selected.className = "";
                } else {
                    selected.className = "absent";
                }
            } else if (tr.className == "b") {
                if (selected.className) {
                    selected.className = "";
                    selected.innerHTML = "";
                } else {
                    selected.className = "found";
                    input.focus();
                }
            }
            save();
        };
    }
}

function splitTdId(id) {
    let arr = id.split(/r|c/);
    return {r: parseInt(arr[1]), c: parseInt(arr[2])};
}

function addET(target, type) {
    const el = document.createElement(type);
    target.appendChild(el);
    return el;
}

function save() {
    processSolved();
    if (!currentKey) {
        currentKey = "html" + nextKey;
    }
    storage.setItem(currentKey, table.innerHTML);
    storage.setItem("currentKey", currentKey);
}

function processSolved() {
    solved = [0, 0, 0, 0, 0];
    for (let r = 0; r < 12; r++) {
        let row = table.querySelectorAll("tr").item(r);
        for (let c = 0; c < 5; c++) {
            let td = row.querySelectorAll("td").item(c);
            if (row.className == "b") {
                if (td.className == "found") {
                    solved[c] = Math.max(solved[c], 1);
                } else {
                    solved[c] = 2;
                }
            } else if (row.className == "a") {
                if (solved[c] == 1 && td.className != "absent") {
                    td.className = "unusable";
                } else if (td.className == "unusable") {
                    td.className = "";
                }
            }
        }
    }
}