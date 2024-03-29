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
let black = "&#9632;";
let white = "&#9633;";
let tick = "&#10003;";
let storageName = "wordgame-oct";
let statsStore = new CbStorage("stats");
let storage = new CbStorage(storageName);
let guesses = storage.getItem("guesses") ?? [];
let pageNumber = storage.getItem("currentKey") ?? "0";
let goodInput = "";
let pageCount = 8;
let solutions = storage.getItem("solutions") ?? [];
let rowCount = 12;
let cellCount = 5;
let gameOver = false;

root.style.setProperty("--cells", cellCount);

if (solutions.length == 0) {
    makeSolutions();
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

for (let r = 0; r < rowCount; r++) {
    let tr = addET(table, "tr");
    tr.id = "r" + r;
    for (let c = 0; c < cellCount; c++) {
        let td = addET(tr, "td");
        td.id = "r" + r + "c" + c;
        td.innerHTML = "";
        td.style.transitionDelay = (c * 2) / (cellCount + 1) + "s";
    }
}

boxes.innerHTML = "";

save();

if (!gameOver) {
    refreshPage();
}

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
    location.href = "stats.html?type=" + storageName;
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

document.onkeydown = function (e) {
    if (e.key === "Enter") {
        applyWord();
        refreshPage();
        save();
    } else if (e.key === "Backspace") {
        goodInput = goodInput.substring(0, goodInput.length - 1);
        applyWord();
        refreshPage();
        save();
    } else if (e.key.toLowerCase() == e.key.toUpperCase() || e.key.length != 1) {
        e.stopPropagation();
        e.preventDefault();
    } else {
        goodInput += e.key.toUpperCase();
        goodInput = goodInput.substring(0, cellCount);
        refreshPage();
        save();
    }
}

//-------------------------------------------------------------------

function makeOverview(pageResults) {
    let foundCount = 0;
    boxes.innerHTML = "";
    let barMult = 100 / cellCount;
    for (let p = 0; p < pageCount; p++) {
        let letterHints = pageResults[p].letterHints.total;
        let sp = addET(boxes, "div", "box");
        sp.onclick = e => {
            storage.setItem("currentKey", p);
            location.reload();
        };
        if (pageNumber == p) {
            sp.style.borderColor = "#bb00bb";
        }
        let matchedbar = addET(sp, "div", "boxbar");
        matchedbar.style.height = (letterHints.matchedOnly * barMult) +  "%";
        matchedbar.className = "matchedbar";

        let foundbar = addET(sp, "div", "boxbar");
        foundbar.style.height = (letterHints.found * barMult) +  "%";
        foundbar.className = "foundbar";

        if (letterHints.found == cellCount) {
            foundbar.innerHTML = tick;
            foundCount++;
        }

        //boxes.appendChild(sp);
    }
    if (foundCount >= pageCount) {
        gameOver = true;
        save();
    }
}

function keyboardPress(e) {
    goodInput += e.target.innerHTML.toUpperCase();
    goodInput = goodInput.substring(0, cellCount);
    refreshPage();
    save();
}

function specialPress(type) {
    if (type == 2 && goodInput.length > 0) {
        goodInput = goodInput.substring(0, goodInput.length - 1);
        applyWord();
    }
    if (type == 3) {
        applyWord();
    }
    refreshPage();
    save();
}

function applyWord() {
    let row = document.getElementById("r" + guesses.length);
    row.className = "";
    if (goodInput.length != cellCount || guesses.length >= rowCount) {
        return;
    }
    if (goodInput.toLowerCase() === "swswz") {
        if (swk) {
            swk.postMessage({type:"name"});
        }
    }
    if (validWords.includes(goodInput.toLowerCase())) {
        guesses.push(goodInput);
        goodInput = "";
        return;
    }
    row.className = "bad";
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
    storage.setItem("guesses", guesses);
    storage.setItem("currentKey", pageNumber);
    if (guesses.length == rowCount) {
        gameOver = true;
    }
    if (gameOver) {
        let sols = solutions.join("");
        let balance = rowCount - guesses.length;
        pageselect.className = "gameover";
        keyboard.className = "gameover";
        for (let p = 0; p < pageCount; p++) {
            let {pageDone} = calculatePage(p);
            let sol = solutions[p];
            for (let c = 0; c < cellCount; c++) {
                let cell = document.getElementById("r" + p + "c" + c);
                cell.innerHTML = sol[c];
                if (pageDone) {
                    cell.className = "found";
                } else {
                    cell.className = "";
                }
            }
            if (pageDone) {
                balance += 1;
            }
        }
        for (let p = pageCount; p < rowCount; p++) {
            for (let c = 0; c < cellCount; c++) {
                let cell = document.getElementById("r" + p + "c" + c);
                cell.innerHTML = "";
                cell.className = "";
            }
        }
        let stats = statsStore.getItem(storageName) ?? {scores: Array(rowCount + 1).fill(0), pageCount};
        if (stats["last"] !== sols) {
            stats["last"] = sols;
            stats.scores[balance]++;
            statsStore.setItem(storageName, stats);
        }
    }
}

function calculatePage(pagenum) {
    let foundCount = 0;
    let pageDone = false;
    let rowResults = []; // 0=no match 1=misplaced 2=found
    let letterResults = {};
    let letterHints = {};
    let solution = solutions[pagenum].toUpperCase().split("");
    guesses.forEach((guess, ix) => {
        let matchedLetters = {};
        let rowResult = [];
        let workGuess = [...guess];
        rowResults.push(rowResult);
        if (!pageDone) {
            let sol = [...solution];
            foundCount = 0;
            for (let c = 0; c < cellCount; c++) {
                rowResult[c] = 0;
                if (workGuess[c] == sol[c]) {
                    rowResult[c] = 2;
                    foundCount++;
                    letterResults[workGuess[c]] = 2;
                    sol[c] = "*";
                    matchedLetters[workGuess[c]] = (matchedLetters[workGuess[c]] ?? 0) + 1;
                    workGuess[c] = "?";
                }
            }
            let foundLetters = Object.assign({}, matchedLetters);
            if (foundCount == cellCount) {
                pageDone = true;
            }
            for (let c = 0; c < cellCount; c++) {
                const char = workGuess[c];
                const hit = sol.indexOf(char);
                if (hit >= 0) {
                    if (rowResult[c] == 0) {
                        rowResult[c] = 1;
                    }
                    if (!letterResults[char]) {
                        letterResults[char] = 1;
                    }
                    sol[hit] = "*";
                    matchedLetters[char] = (matchedLetters[char] ?? 0) + 1;
                } else {
                    if (letterResults[char] === undefined) {
                        letterResults[char] = 0;
                    }
                }
            }
            Object.keys(matchedLetters).forEach(char => {
                if (!letterHints[char]) {
                    letterHints[char] = {matched: 0, found: 0};
                }
                if (letterHints[char].matched < matchedLetters[char]) {
                    letterHints[char].matched = matchedLetters[char]
                }
                if (letterHints[char].found < foundLetters[char]) {
                    letterHints[char].found = foundLetters[char]
                }
            });
        }
    });
    let keys = Object.keys(letterHints);
    letterHints.total = {matched: 0, found: 0};
    keys.forEach(key => {
        letterHints.total.matched += letterHints[key].matched;
        letterHints.total.found += letterHints[key].found;
    });
    letterHints.total.matchedOnly = letterHints.total.matched - letterHints.total.found;
    //console.log(pagenum, letterHints);
    return {rowResults, letterResults, letterHints, pageDone};
}

function refreshPage() {
    let pageResults = [];
    for (let p = 0; p < pageCount; p++) {
        pageResults.push(calculatePage(p));
    }

    let {rowResults, letterResults, pageDone} = pageResults[pageNumber];
    let r = guesses.length;
    let foundCount = 0;
    rowResults.forEach((result, ix) => {
        if (foundCount >= cellCount) return;
        foundCount = 0;
        for (let c = 0; c < cellCount; c++) {
            let cell = document.getElementById("r" + ix + "c" + c);
            cell.innerHTML = guesses[ix][c] ?? "";
            if (result[c] == 2) {
                cell.className = "found";
                foundCount++;
            } else if (result[c] == 1) {
                cell.className = "misplaced";
            } else {
                cell.className = "wrong";
            }
        }
    });
    if (!pageDone && guesses.length < rowCount) {
        for (let c = 0; c < cellCount; c++) {
            let row = document.getElementById("r" + r + "c" + c);
            row.innerHTML = goodInput[c] ?? "";
        }
    }
    makeKeyboard(letterResults);
    makeOverview(pageResults);
}

function makeSolutions() {
    solutions = [];
    let rand = Math.random();
    for (let p = 0; p < pageCount; p++) {
        let pos = Math.round(solutionWords.length * rand);
        solutions.push(solutionWords[pos]);
        rand = Math.random();
    }
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
