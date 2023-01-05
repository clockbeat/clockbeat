
let main = document.getElementById("main");
let keyboard = document.getElementById("keyboard");
let reload = document.getElementById("reload");
let boxes = document.getElementById("boxes");
let pageselect = document.getElementById("pageselect");
let left = document.getElementById("left");
let right = document.getElementById("right");
let wakelock = document.getElementById("wakelock");
let wakelockSentinel;
let table = addET(main, "table");
let keyList = [];
let black = "&#9632;";
let white = "&#9633;";
let tick = "&#10004;";
let guessesLs = localStorage.getItem("guesses") ?? "[]";
let guesses = JSON.parse(guessesLs);
let pageNumber = localStorage.getItem("currentKey") ?? "0";
let goodInput = "";
let pageCount = 8;
let solutionsLs = localStorage.getItem("solutions") ?? "[]";
let solutions = JSON.parse(solutionsLs);
let rowCount = 12;
let cellCount = 5;
let gameOver = false;

console.clear();

if (solutions.length == 0) {
    makeSolutions();
}

if (localStorage.getItem("wakelock") == "on") {
    (async () => {
        wakelockSentinel = await navigator.wakeLock.request('screen');
        wakelock.className = "wakeon";
    })();
}

if (pageNumber == 0) {
    left.style.visibility = "hidden";
} else {
    left.onclick = e => {
        save();
        if (pageNumber > 0) {
            pageNumber--;
            localStorage.setItem("currentKey", pageNumber);
            location.reload();
        }
    }
}

if (pageNumber == pageCount - 1) {
    right.style.visibility = "hidden";
} else {
    right.onclick = e => {
        save();
        if (pageNumber < pageCount - 1) {
            pageNumber++;
            localStorage.setItem("currentKey", pageNumber);
            location.reload();
        }
        location.reload();
    }
}

for (let r = 0; r < rowCount; r++) {
    let tr = addET(table, "tr");
    tr.className = "";
    tr.id = "r" + r;
    for (let c = 0; c < cellCount; c++) {
        let td = addET(tr, "td");
        td.id = "r" + r + "c" + c;
        td.innerHTML = "";
    }
}

boxes.innerHTML = "";

//makeOverview();

save();
if (!gameOver) {
    refreshPage();
}

//--------------------------------------------------------

reload.onclick = function (e) {
    localStorage.clear();
    if (wakelockSentinel) {
        localStorage.setItem("wakelock", "on");
    }
    localStorage.setItem("solutions", "[]");
    location.reload();
}

wakelock.onclick = async e => {
    if (!wakelockSentinel) {
        try {
            wakelockSentinel = await navigator.wakeLock.request('screen');
            wakelock.className = "wakeon";
            localStorage.setItem("wakelock", "on");
        } catch (err) {
            // the wake lock request fails - usually system related, such being low on battery
            console.log(`${err.name}, ${err.message}`);
        }
    } else {
        wakelockSentinel.release();
        wakelock.className = "wakeoff";
        wakelockSentinel = null;
        localStorage.setItem("wakelock", "off");
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
    boxes.innerHTML = "";
    for (let p = 0; p < pageCount; p++) {
        let letterScore = pageResults[p].letterScore / (cellCount * 2); //0 to 1
        let sp = document.createElement("div");
        sp.innerHTML = "&nbsp;";
        if (pageNumber == p) {
            sp.style.borderStyle = "solid";
            sp.style.borderWidth = "3px";
            sp.style.borderColor = "black";
        }
        if (letterScore == 1) {
            sp.innerHTML = tick;
        }
        sp.onclick = e => {
            localStorage.setItem("currentKey", p);
            location.reload();
        };
        sp.style.margin = "auto";
        sp.className = "box";
        let g = letterScore;
        let color = `hsl(${54 + (g * 60)} 100% ${75 - (g * 50)}%)`; //green = 114
        if (letterScore == 0) {
            color = "#ffffff";
        }
        sp.style.backgroundColor = color;
        boxes.appendChild(sp);
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

function addET(target, type) {
    const el = document.createElement(type);
    target.appendChild(el);
    return el;
}

function save() {
    localStorage.setItem("guesses", JSON.stringify(guesses));
    localStorage.setItem("currentKey", pageNumber);
    if (guesses.length == rowCount) {
        gameOver = true;
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
        }
        for (let p = pageCount; p < rowCount; p++) {
            for (let c = 0; c < cellCount; c++) {
                let cell = document.getElementById("r" + p + "c" + c);
                cell.innerHTML = "";
                cell.className = "";
            }
        }
    }
}

function calculatePage(pagenum) {
    let found = 0;
    let pageDone = false;
    let rowResults = []; // 0=no match 1=misplaced 2=found
    let letterResults = {};
    let letterScores = {};
    guesses.forEach((guess, ix) => {
        let rowResult = [];
        rowResults.push(rowResult);
        if (!pageDone) {
            let sol = solutions[pagenum].toUpperCase().split("");
            found = 0;
            for (let c = 0; c < cellCount; c++) {
                rowResult[c] = 0;
                if (guess[c] == sol[c]) {
                    rowResult[c] = 2;
                    found++;
                    letterResults[guess[c]] = 2;
                    sol[c] = "*";
                }
            }
            if (found == cellCount) {
                pageDone = true;
            }
            for (let c = 0; c < cellCount; c++) {
                const hit = sol.indexOf(guess[c]);
                if (hit >= 0) {
                    if (rowResult[c] == 0) {
                        rowResult[c] = 1;
                    }
                    if (!letterResults[guess[c]]) {
                        letterResults[guess[c]] = 1;
                    }
                    sol[hit] = "*";
                } else {
                    if (letterResults[guess[c]] === undefined) {
                        letterResults[guess[c]] = 0;
                    }
                }
            }
        }
        let score = {};
        rowResult.forEach((c, ix) => {
            if (c > 0) {
                let letter = guess[ix];
                score[letter] = (score[letter] ?? 0) + c;
            }
        });
        Object.keys(score).forEach(letter => {
            if ((letterScores[letter] ?? 0) < score[letter]) {
                letterScores[letter] = score[letter];
            }
        });
    });
    //console.log(letterScores);
    let letterScore = 0;
    Object.keys(letterScores).forEach(letter => {
        letterScore += letterScores[letter];
    });
    //letterScore = 0 to 2*cellCount  
    return {rowResults, letterResults, letterScore, pageDone};
}

function refreshPage() {
    let pageResults = [];
    for (let p = 0; p < pageCount; p++) {
        pageResults.push(calculatePage(p));
    }

    let {rowResults, letterResults, letterScore, pageDone} = pageResults[pageNumber];
    let r = guesses.length;
    rowResults.forEach((result, ix) => {
        for (let c = 0; c < cellCount; c++) {
            let cell = document.getElementById("r" + ix + "c" + c);
            cell.innerHTML = guesses[ix][c] ?? "";
            if (result[c] == 2) {
                cell.className = "found";
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
    localStorage.setItem("solutions", JSON.stringify(solutions));
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