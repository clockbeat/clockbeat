let root = document.querySelector(':root');
let main = document.getElementById("main");
let keyboard = document.getElementById("keyboard");
let reload = document.getElementById("reload");
let statsLink = document.getElementById("stats");
let boxes = document.getElementById("boxes");
let pageselect = document.getElementById("pageselect");
let wakelock = document.getElementById("wakelock");
let wakelockSentinel;
let table = addET(main, "table");
let keyList = [];
let storageName = "wudge";
let statsStore = new CbStorage("stats");
let storage = new CbStorage(storageName);
let solutions = storage.getItem("solutions") ?? [];
let offsets = storage.getItem("offsets") ?? [];
let rowCount = 5;
let cellCount = 5;
let gameOver = false;
let moveitMapping = new moveit(main, {
    start: e => {return true;},
    end: dragged
});

root.style.setProperty("--cells", cellCount);

//if (solutions.length == 0) {
makeSolutions();
//}

if (offsets.length == 0) {
    calcOffsets();
}

if (storage.getItem("wakelock") == "on") {
    (async () => {
        try {
            wakelockSentinel = await navigator.wakeLock.request('screen');
            wakelock.className = "wakeon";
        } catch (err) {
            console.log(`${err.name}, ${err.message}`);
        }
    })();
}

addRow("u", "upbut", updownclick);

for (let r = 0; r < rowCount; r++) {
    addRow(r, "cell");
}

addRow("d", "downbut", updownclick);

function addRow(r, cellClass, onclick) {
    let tr = addET(table, "tr");
    tr.id = "r" + r;
    for (let c = 0; c < cellCount; c++) {
        let td = addET(tr, "td");
        td.id = "r" + r + "c" + c;
        td.innerHTML = "";
        td.className = cellClass;
        if (onclick) {
            td.onclick = e => {
                onclick(r, c);
            }
        }
    }
}

const page = {};
const all = document.querySelectorAll("*[id]");
all.forEach((val) => {
    page[val.id] = val;
});

fillBoard();
console.log(solutions);

save();

//--------------------------------------------------------

reload.onclick = function (e) {
    storage.clear();
    if (wakelockSentinel) {
        storage.setItem("wakelock", "on");
    }
    storage.setItem("solutions", []);
    location.reload();
}

stats.onclick = function (e) {
    location.href = "stats.html#type=" + storageName;
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

document.addEventListener("visibilitychange", async () => {
    if (wakelockSentinel !== null && document.visibilityState === "visible") {
        wakelockSentinel = await navigator.wakeLock.request('screen');
    }
});

document.onkeydown = function (e) {
    if (e.key === "Enter") {
        applyWord();
        refreshPage();
        save();
    }
}

//-------------------------------------------------------------------

function updownclick(button, col) {
    console.log(button, col, offsets);
    if (button == "u") {
        offsets[col]++;
    }
    if (button == "d") {
        offsets[col]--;
    }
    offsets[col] = (offsets[col] + rowCount) % rowCount;
    fillBoard();
    save();
}

function calcOffsets() {
    offsets.length = 0;
    for (let c = 0; c < cellCount; c++) {
        offsets.push(Math.floor(Math.random() * rowCount));
    }
}


function fillBoard() {
    let board = new Array(rowCount).fill("");
    for (let c = 0; c < cellCount; c++) {
        for (let r = 0; r < rowCount; r++) {
            let ch = solutions[(r + offsets[c]) % rowCount][c];
            page["r" + r + "c" + c].innerHTML = ch;
            board[r] += ch;
        }
    }
    for (let r = 0; r < rowCount; r++) {
        page["r" + r].className = "";
        if (solutions.includes(board[r])) {
            page["r" + r].className = "found";
        } else if (validWords.includes(board[r]) || solutionWords.includes(board[r])) {
            page["r" + r].className = "misplaced";
        }
    }
    console.log(board);
}

function dragged(e) {
    //"this" is moveit
    //console.log(this);
    let xmove = (this.x - this.downpos.x);
    let xdist = Math.abs(xmove - (innerWidth * 0.02));
    let ydist = Math.abs(this.y - this.downpos.y - (innerWidth * 0.02));

}

function splitTdId(id) {
    let arr = id.split(/r|c/);
    return {r: parseInt(arr[1]), c: parseInt(arr[2])};
}

function addET(target, type, className) {
    const el = document.createElement(type);
    if (className) {
        el.className = className;
    }
    target.appendChild(el);
    return el;
}

function save() {
    storage.save();
}

function makeSolutions() {
    solutions = [];
    for (let p = 0; p < rowCount; p++) {
        let pos = Math.floor(solutionWords.length * Math.random());
        solutions.push(solutionWords[pos]);
    }
    //solutions = ["eerie", "tooth", "civic","eerie", "tooth", "civic", "eerie", "tooth"];
    storage.setItem("solutions", solutions);
}

function makeKeyboard(letterResults) {
    let keyboardLetters = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", 1, "A", "S", "D", "F", "G", "H", "J", "K", "L", 2, "Z", "X", "C", "V", "B", "N", "M", 3];
    let letterClasses = ["wrong", "misplaced", "found"];
    let specials = ["", "", "&#x232b;", "Enter"];
    let kb = document.getElementById("keyboard");
    kb.innerHTML = "";
    keyboardLetters.forEach(letter => {
        let key = document.createElement("div");
        if (isFinite(letter)) {
            key.className = "indent" + letter;
            key.innerHTML = specials[letter];
            key.onclick = e => {specialPress(letter)};
        } else {
            const letterClass = letterResults[letter.toUpperCase()];
            if (letterClass !== undefined) {
                key.className = "key " + letterClasses[letterClass];
            } else {
                key.className = "key";
            }
            key.onclick = keyboardPress;
            key.innerHTML = letter;
        }
        kb.appendChild(key);
    });
}
