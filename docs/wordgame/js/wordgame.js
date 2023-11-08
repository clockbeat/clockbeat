function runIt() {

    let root = document.querySelector(':root');
    let main = document.getElementById("main");
    let keyboard = document.getElementById("keyboard");
    let reload = document.getElementById("reload");
    let stats = document.getElementById("stats");
    let boxes = document.getElementById("boxes");
    let pageselect = document.getElementById("pageselect");
    let wakelock = document.getElementById("wakelock");
    let share = document.getElementById("share");
    let favwords = document.getElementById("favwords");
    let wordlistDiv = document.getElementById("wordlist");
    let wakelockSentinel;
    let table = addET(main, "table");
    let tick = "&#10003;";
    let goodInput = "";
    let gameOver = false;
    let needsReload = false;
    let randomKey;
    let guesses;

    let hash = location.hash.substring(1);
    let params = hash ? hash.split("&").reduce((res, item) => {
        var parts = item.split('=');
        res[parts[0]] = parts[1];
        return res;
    }, {}) : {}; //If no hash params is empty

    if (!params.type || !gametypes[params.type]) {
        params.type = "wordgame-wle";
        needsReload = true;
    }

    let storageName = params.type;
    let statsStore = new CbStorage("stats");
    let storage = new CbStorage(storageName);
    let settings = new CbStorage("wordgame-settings");
    const typeDetails = gametypes[params.type];
    let {pageCount, rowCount, cellCount, background, prefill, combinePages, showProgress} = typeDetails;

    if (params.share) {
        storage.clear();
        if (params.randomKey) {
            randomKey = params.randomKey;
            storage.setItem("solutions", []);
            storage.setItem("randomKey", params.randomKey);
        }
        if (params.guesses != undefined) {
            const re = new RegExp(`.{1,${cellCount}}`, "g");
            guesses = params.guesses.match(re);
            storage.setItem("guesses", guesses);
        }
        if (params.pageNumber) {
            storage.setItem("pageNumber", params.pageNumber);
        }
        needsReload = true;
    }
    if (needsReload) {
        location = location.pathname + `#type=${params.type}`;
        location.reload();
        return;
    }

    let recentWords = settings.require("recentWords" + cellCount, {});
    let pageNumber = storage.getItem("pageNumber") ?? "0";
    let solutions = storage.getItem("solutions") ?? [];
    guesses = storage.getItem("guesses") ?? [];
    randomKey = storage.getItem("randomKey");

    let random = mulberry32WithKey(randomKey); //returns new key if blank
    storage.setItem("randomKey", random.key);
    randomKey = random.key;

    console.log(params, typeDetails, randomKey);

    if (pageNumber >= pageCount) {
        pageNumber = pageCount - 1;
    }

    root.style.setProperty("--cells", cellCount);
    root.style.backgroundColor = background;

    if (solutions.length == 0) {
        makeSolutions();
    }

    let leftOptions = document.getElementById("leftoptions");
    Object.keys(gametypes).forEach(key => {
        let div = document.createElement("div");
        div.className = "typelink";
        div.style.backgroundColor = gametypes[key].background;
        div.innerHTML = gametypes[key].iconChar;
        if (key == params.type) {
            div.style.borderColor = "white";
        }
        div.onclick = e => {
            location = location.pathname + "#type=" + key;
            location.reload();
        }
        leftOptions.appendChild(div);
        leftOptions.appendChild(document.createElement("div"));
    });


    let rightOptions = document.getElementById("rightoptions");
    ["--mygreen", "--myyellow", "--mygrey", "--mywhite"].forEach((col, ix) => {
        let div = document.createElement("div");
        div.id = "letter" + (2 - ix);
        div.className = "lettercount";
        div.innerHTML = "&nbsp;";
        div.style.backgroundColor = "var(" + col + ")"
        rightOptions.appendChild(div);
        rightOptions.appendChild(document.createElement("div"));
    });


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
            td.onclick = showFavWords;
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

    window.addEventListener('hashchange', function () {
        location.reload();
    });

    stats.onclick = function (e) {
        location.href = "stats.html#type=" + storageName;
    }

    // if (!navigator.share) {
    //     share.style.display = "none";    
    // }

    share.onclick = function (e) {
        const gs = guesses.join("");
        const url = location.href + `&share=1&randomKey=${randomKey}&guesses=${gs}&pageNumber=${pageNumber}`;
        const shareData = {
            title: "Steve's word game " + typeDetails.iconChar,
            text: "Please help me with this ",
            url
        };
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            open(url); //Just for testing
            console.log(url);
        }
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
        if (!gameOver) {
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
    }

    document.onclick = e => {
        favwords.close();
    }

    //-------------------------------------------------------------------

    function showFavWords(e) {
        let words = getRecentWords().slice(0, 10);
        wordlistDiv.innerHTML = "";
        words.forEach(w => {
            let wDiv = document.createElement("div");
            wDiv.innerHTML = w;
            wDiv.onclick = e => {
                goodInput = w;
                applyWord();
                refreshPage();
                favwords.close();
                e.stopPropagation();
            }
            wordlistDiv.appendChild(wDiv);
        });
        favwords.showModal();
        e.preventDefault();
        e.stopPropagation();
    };


    function makeOverview(pageResults) {
        let foundCount = 0;
        boxes.innerHTML = "";
        let barMult = 100 / cellCount;
        for (let p = 0; p < pageCount; p++) {
            let sp = addET(boxes, "div", "box");
            sp.style.borderColor = background;
            sp.style.position = "relative";
            let foundbar = addET(sp, "div", "boxbar");
            foundbar.className = "foundbar";

            if (!showProgress) {
                if (pageResults[p].pageDone) {
                    foundbar.style.height = "100%";
                    foundbar.innerHTML = tick;
                    foundCount++;
                }
                continue;
            }
            let letterHints = pageResults[p].letterHints.total;
            if (combinePages) {

            } else {
                sp.onclick = e => {
                    storage.setItem("pageNumber", p);
                    location.reload();
                };
                if (pageNumber == p) {
                    sp.style.borderColor = "#ffffff";
                }
                sp.style.cursor = "pointer";
            }

            foundbar.style.height = (letterHints.found * barMult) + "%";

            let matchedbar = addET(sp, "div", "boxbar");
            matchedbar.style.height = (letterHints.matchedOnly * barMult) + "%";
            matchedbar.className = "matchedbar";

            if (pageResults[p].pageDone) {
                foundbar.innerHTML = tick;
                foundCount++;
            }           
        }
        if (foundCount >= pageCount) {
            gameOver = true;
            save();
        }
    }

    function keyboardPress(e) {
        if (!gameOver) {
            goodInput += e.target.innerHTML.toUpperCase();
            goodInput = goodInput.substring(0, cellCount);
            refreshPage();
            save();
        }
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
                swk.postMessage({type: "name"});
            }
        }
        if (validWords.includes(goodInput.toLowerCase())) {
            guesses.push(goodInput);
            addRecentWord(goodInput);
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
        storage.setItem("pageNumber", pageNumber);
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
                let row = document.getElementById("r" + p);
                row.style.marginBottom = "initial";
                row.style.fontStyle = "initial";
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
            let stats = statsStore.require(storageName, {scores: Array(rowCount + 1).fill(0), pageCount});
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
        let pageFull = false;
        let rowResults = []; // 0=no match 1=misplaced 2=found
        let letterResults = {};
        let letterHints = {total: {matched: 0, found: 0}, help: {solved: new Array(cellCount).fill(""), missed: {}}};
        let hintsData = {};
        let partSolved = new Array(cellCount).fill("");
        let solution = solutions[pagenum].toUpperCase().split("");
        guesses.forEach((guess, ix) => {
            let matchedLetters = {};
            let rowResult = [];
            let workGuess = [...guess];
            if (!pageFull) {
                rowResults.push(rowResult);
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
                        partSolved[c] = solution[c];
                        letterHints.help.solved[c] = solution[c];
                    }
                }
                if (foundCount == cellCount) {
                    pageDone = true;
                    if (combinePages) {
                        letterResults = {};
                    } else {
                        pageFull = true;
                    }
                }
                for (let c = 0; c < cellCount; c++) {
                    const char = workGuess[c]; //already has full matches as "?"
                    const hit = sol.indexOf(char);
                    if (hit >= 0) {
                        if (rowResult[c] == 0) {
                            rowResult[c] = 1;
                        }
                        if (!letterResults[char]) {
                            letterResults[char] = 1;
                        }
                        if (!letterHints.help.missed[char]) {
                            letterHints.help.missed[char] = new Array(cellCount).fill(0);
                        }
                        letterHints.help.missed[char][c] = 1;
                        sol[hit] = "*"; //overwrite so duplicates match next occurence
                        matchedLetters[char] = (matchedLetters[char] ?? 0) + 1;
                    } else {
                        if (letterResults[char] === undefined) {
                            letterResults[char] = 0;
                        }
                    }
                }
                Object.keys(matchedLetters).forEach(char => {
                    if (!hintsData[char]) {
                        hintsData[char] = {matched: 0, found: 0};
                    }
                    if (hintsData[char].matched < matchedLetters[char]) {
                        hintsData[char].matched = matchedLetters[char]
                    }
                    hintsData[char].found = 0;
                });
            }
        });
        partSolved.forEach(char => {
            if (char) {
                hintsData[char].found += 1;
            }
        });
        Object.keys(hintsData).forEach(key => {
            if (hintsData[key].matched < hintsData[key].found) {
                hintsData[key].matched = hintsData[key].found;
                //fixed where dup letter found on different rows
            }
            if (hintsData[key].matched == hintsData[key].found) {
                delete letterHints.help.missed[key];
            }
            letterHints.total.matched += hintsData[key].matched;
            letterHints.total.found += hintsData[key].found;
        });
        letterHints.total.matchedOnly = letterHints.total.matched - letterHints.total.found;
        delete letterResults["?"];
        return {rowResults, letterResults, letterHints, pageDone};
    }

    function refreshPage() {
        let pageResults = [];
        let pnum = pageNumber;
        for (let p = 0; p < pageCount; p++) {
            pageResults.push(calculatePage(p));
        }
        if (combinePages) {
            //We add a row to pageResults beyond the pages and only use that here
            pnum = pageCount;
            pageResults.push(combinePageRows(pageResults));
        }

        let {rowResults, letterResults, pageDone, combinedPageLetters} = pageResults[pnum];
        let r = guesses.length;
        rowResults.forEach((result, ix) => {
            let foundCount = 0;
            for (let c = 0; c < cellCount; c++) {
                let cell = document.getElementById("r" + ix + "c" + c);
                const guessChar = guesses[ix][c];
                cell.innerHTML = guessChar ?? "";
                if (result[c] == 2) {
                    cell.className = "found";
                    foundCount++;
                } else if (result[c] == 1) {
                    cell.className = "misplaced";
                } else {
                    cell.className = "wrong";
                }
                if (combinePages && guessChar) {
                    let page = combinedPageLetters[guessChar];
                    if (page !== undefined && pageResults[page].pageDone) {
                        cell.className = "completed";
                    }
                }
            }
            let row = document.getElementById("r" + ix);
            if (foundCount == cellCount && !solutions.includes(guesses[ix].toLowerCase())) {
                row.style.fontStyle = "italic";
            }
            if (ix == prefill - 1) {
                row.style.marginBottom = "0.5em"
            }
        });
        if (!pageDone && guesses.length < rowCount) {
            for (let c = 0; c < cellCount; c++) {
                let cell = document.getElementById("r" + r + "c" + c);
                cell.innerHTML = goodInput[c] ?? "";
            }
        }

        let letterCount = new Array(4).fill(0);
        letterCount[0] = 26;
        Object.values(letterResults).forEach(value => {
            letterCount[value + 1]++;
            letterCount[0]--;
        });
        letterCount.forEach((val, ix) => {
            document.getElementById("letter" + (ix - 1)).innerHTML = val;
        });


        makeKeyboard(letterResults);
        makeOverview(pageResults);
    }

    function combinePageRows(pageResults) {
        let rowResults = [];
        for (let n = 0; n < guesses.length; n++) {
            rowResults.push(new Array(cellCount).fill(0));
        }
        let letterResults = {};
        let pageDone = true;
        let combinedPageLetters = {};
        for (let p = 0; p < pageCount; p++) {
            let cp = pageResults[p]; //calculatePage(p);
            cp.rowResults.forEach((rr, rix) => {
                rr.forEach((r, cix) => {
                    rowResults[rix][cix] = Math.max(rowResults[rix][cix], r);
                });
            });
            Object.keys(cp.letterResults).forEach(key => {
                letterResults[key] = Math.max(letterResults[key] ?? 0, cp.letterResults[key]);
            });

            solutions.forEach((sol, ix) => {
                sol.split("").forEach(let => {
                    combinedPageLetters[let.toUpperCase()] = ix;
                })
            });

            if (!cp.pageDone) {
                pageDone = false;
            }
        }
        return {rowResults, letterResults, pageDone, combinedPageLetters};
    }

    function makeSolutions() {
        let loopCount = 0;
        let hasGuesses = !!guesses.length;
        do {
            loopCount = 0;
            solutions = [];
            let wordsUsed = [];
            let lettersUsed = new Set();
            for (let p = 0; p < pageCount + prefill; p++) {
                let pos;
                let isOk;
                do {
                    isOk = true;
                    pos = Math.floor(solutionWords.length * random.calc());
                    if (combinePages && p < pageCount) {
                        isOk = solutionWords[pos].split("").every(letter => {
                            return !lettersUsed.has(letter);
                        });
                    }
                    loopCount++;
                } while ((wordsUsed.includes(solutionWords[pos]) || !isOk) && loopCount <= 1000);
                const word = solutionWords[pos];
                word.split("").forEach(letter => {
                    lettersUsed.add(letter);
                });
                if (p < pageCount) {
                    solutions.push(word);
                    wordsUsed.push(word);
                } else {
                    if (!hasGuesses) {
                        guesses.push(word.toUpperCase());
                    }
                    wordsUsed.push(word);
                }
            }
        } while (loopCount >= 1000);
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

    function mulberry32WithKey(code) {
        const letters = "BCDFGHJKMPRSTWXY";
        if (!code) {
            code = "";
            for (let n = 0; n < 6; n++) {
                code += letters[Math.floor(Math.random() * 16)];
            }
        }
        let a = code.split("").reduce((cum, char) => {
            return (cum << 4) + letters.indexOf(char);
        }, 0);
        return {
            key: code, calc: function () {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        };
    }

    function addRecentWord(word) {
        let least = 9999999;
        let leastWord;
        let count = 0;
        Object.keys(recentWords).forEach(w => {
            let low = recentWords[w] *= 0.9999;
            if (low < least) {
                leastWord = w;
                least = low;
            }
            count++;
        });
        
        if (!recentWords[word]) {
            if (count >= 20) {
                delete recentWords[leastWord];
            }
            recentWords[word] = 0;
        }
        recentWords[word]++;
        settings.setItem("recentWords"+cellCount,recentWords);
    }

    function getRecentWords() {
        let wordList = [];
        let sorted = [... Object.entries(recentWords)];
        sorted.sort((a, b) => {
            return b[1] - a[1];
        }).forEach(w => {
            wordList.push(w[0]);
        });
        return wordList;
    }
}
