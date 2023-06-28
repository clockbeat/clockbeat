let root = document.querySelector(':root');
let main = document.getElementById("main");
let keyboard = document.getElementById("keyboard");
let reload = document.getElementById("reload");
let statsLink = document.getElementById("stats");
let boxes = document.getElementById("boxes");
let wakelock = document.getElementById("wakelock");
let wakelockSentinel;
let table;
let keyList = [];
let storageName = "wudge";
let statsStore = new CbStorage("stats");
let storage = new CbStorage(storageName);
let solutions = storage.getItem("solutions") ?? [];
let offsets = storage.getItem("offsets") ?? [];
let foundlings = storage.getItem("foundlings") ?? [];
let clicks = storage.getItem("clicks") ?? 0;
let rowCount = 8;
let cellCount = 5;
let gameOver = false;
let moveitMapping = new moveit(main, {
    start: e => {return true;},
    end: dragged
});
const page = {};

function startUp() {
    root.style.setProperty("--cells", cellCount);

    if (solutions.length != rowCount || clicks <= 0) {
        makeSolutions();
        calcOffsets();
        foundlings = [];
        gameOver = false;
        save();
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

    main.innerHTML = "";
    table = addET(main, "table");

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
            let tb = r == 0 ? "top" : "";
            tb = r == rowCount - 1 ? "bottom" : tb;

            td.className = cellClass + ` r${r} c${c} ${tb}`;
            //td.style.cssText = `--c:${c}; --r:${r};`;
            if (onclick) {
                td.onclick = e => {
                    onclick(r, c);
                }
            }
        }
    }

    const all = document.querySelectorAll("*[id]");
    all.forEach((val) => {
        page[val.id] = val;
    });

    fillBoard();
    console.log(solutions);

    if (!gameOver) {
        page.main.className = "";
    }

    save();
}

startUp();

//--------------------------------------------------------

reload.onclick = function (e) {
    storage.clear();
    if (wakelockSentinel) {
        storage.setItem("wakelock", "on");
    }
    offsets = [];
    solutions = [];
    //location.reload();
    startUp();
}

stats.onclick = function (e) {
    doStats();
}

wakelock.onclick = async e => {
    if (!wakelockSentinel) {
        try {
            wakelockSentinel = await navigator.wakeLock.request('screen');
            wakelock.className = "wakeon";
            storage.setItem("wakelock", "on");
            save();
        } catch (err) {
            // the wake lock request fails - usually system related, such being low on battery
            console.log(`${err.name}, ${err.message}`);
        }
    } else {
        wakelockSentinel.release();
        wakelock.className = "wakeoff";
        wakelockSentinel = null;
        storage.setItem("wakelock", "off");
        save();
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
    //console.log(button, col, offsets);
    if (button == "u") {
        offsets[col]++;
    }
    if (button == "d") {
        offsets[col]--;
    }
    offsets[col] = (offsets[col] + rowCount) % rowCount;
    //page.main.style.transition = "top 2s";
    amendCellClass(col, "but" + button, true);
    page.score.className = "";
    setTimeout(() => {
        amendCellClass(col, "but" + button, false);
        fillBoard();
    }, 500);
    clicks--;
    if (clicks <= 0) {
        clicks = 0;
        offsets = new Array(cellCount).fill(0);
        fillBoard("bad");
        gameOver = true;
    }
    save();
}

function amendCellClass(col, name, add) {
    for (let r = 0; r < rowCount; r++) {
        if (add) {
            page["r" + r + "c" + col].classList.add(name);
        } else {
            page["r" + r + "c" + col].classList.remove(name);
        }
    }
}

function calcOffsets() {
    let off = Math.floor(Math.random() * rowCount);
    offsets.length = 0;
    for (let c = 0; c < cellCount; c++) {
        while (offsets.includes(off)) {
            off = Math.floor(Math.random() * rowCount);
        }
        offsets.push(off);
    }
    save();
}

function fillBoard(disp) {
    if (gameOver) {
        main.className = "gameover";
        return;
    }
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
            page["r" + r].className = disp ?? "found";
        } else if (validWords.includes(board[r]) || solutionWords.includes(board[r])) {
            page["r" + r].className = "foundagain";
            if (!foundlings.includes(board[r])) {
                foundlings.push(board[r]);
                clicks += 3;
                page["r" + r].className = "misplaced";
                page.score.className = "blowup";
                save();
            }

        }
    }
    page.score.innerHTML = clicks;
    //console.log(board);
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
    storage.setItem("solutions", solutions);
    storage.setItem("offsets", offsets);
    storage.setItem("foundlings", foundlings);
    storage.setItem("clicks", clicks);
    storage.save();
}

function makeSolutions() {
    solutions = [];
    for (let p = 0; p < rowCount; p++) {
        let pos = Math.floor(solutionWords.length * Math.random());
        solutions.push(solutionWords[pos]);
    }
    clicks = Math.ceil(rowCount * cellCount * 0.5);
    save();
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
