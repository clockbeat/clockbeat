"use strict"

const datakey = "_data_";
const pathname = self.location.pathname.split("/")[1];
const lastFile = "/" + pathname + "/lastFile";

async function runit() {
    let dataCache = await caches.open(datakey);
    thenRunIt(dataCache);
}

function thenRunIt(dataCache) {
    //console.clear();
    const page = {};
    const all = document.querySelectorAll("*[id]");
    let pacedCacheTimeout;
    let filename = "";
    let filetime = 0;
    let filehash = 0;
    let hashchanged = false;
    let cacheKeyList = []; //since this is async we need to calculate it in advance

    all.forEach((val) => {
        page[val.id] = val;
    });

    function modified() {
        setTimeout(x => {
            page.content.style.height = "";
            page.content.style.height = page.content.scrollHeight + "px";
        }, 1);
    }

    function timedUpdate() {
        clearTimeout(pacedCacheTimeout);
        pacedCacheTimeout = setTimeout(x => {
            //saveToCache(page.content.value);
            updateFileInfo();
            //console.log("timed update");
        }, 1000);
    };

    function updatePage(text, withUndo) {
        if (withUndo) {
            page.content.focus();
            document.execCommand("selectAll", true, null);
            document.execCommand("insertText", false, text);
        } else {
            page.content.value = text;
        }
        updateFileInfo();
        modified();
    }

    function updateFileInfo() {
        let currentHash = hash(page.content.value)
        hashchanged = (currentHash !== filehash);
        let short = shortDateTime(parseInt(filetime, 10));
        page.filename.innerHTML = filename ? filename : "&nbsp;";
        page.filetime.innerHTML = short ? short : "&nbsp;"
        page.filechange.innerHTML = hashchanged ? "Changed" : "&nbsp;"
    }

    window.addEventListener("beforeunload", e => {
        saveToCache(page.content.value);
    });

    function queryUnload(func) {
        if (!hashchanged) {
            func();
            return true;
        }
        CbConfirm("You have unsaved changes - continue?", e => {
            func();
            return true;
        });
        return true;
    }

    async function saveToCache(text, file = lastFile) {
        dataCache.put(file, new Response(text,
            {
                headers: {
                    "filename": filename,
                    "filetime": filetime,
                    "filehash": filehash,
                    "timecached": new Date().getTime(),
                }
            }
        ));
        console.log("Done save to data cache");
    }

    page.content.addEventListener("input", e => {
        modified();
        timedUpdate();
    });

    window.addEventListener('resize', e => {
        modified();
    });

    page.content.addEventListener("keydown", e => {
        if (e.key == "Tab") {
            e.preventDefault();
            let ta = page.content;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            ta.value = ta.value.substring(0, start) + '\t' + ta.value.substring(end);
            ta.selectionStart = ta.selectionEnd = start + 1;
        }
    });

    async function showLastFile() {
        const cachedResponse = await caches.match(lastFile);
        if (cachedResponse) {
            await showResponseText(cachedResponse);
        }
    }

    async function showResponseText(cachedResponse) {
        let text = await cachedResponse.text();
        filename = cachedResponse.headers.get("filename");
        filetime = cachedResponse.headers.get("filetime");
        filehash = parseInt(cachedResponse.headers.get("filehash"), 10); //original
        updatePage(text);
    }

    function clear() {
        filename = "";
        filehash = hash("");
        filetime = 0;
        updatePage("");
        return true;
    }

    function resetMe() {
        if (typeof swr == 'undefined') {
            alert("Not here");
            return;
        }
        swr.unregister();
        const pathname = location.pathname.split("/")[1];
        caches.delete(pathname + "/" + cacheName);
        document.body.innerHTML = "Resetting " + cacheName;
    }

    function hash(string) {
        let hash = 0;
        for (const char of string) {
            //transfer of text into textbox removes CR so ignore
            if (char == "\r") continue;
            hash = (hash << 5) - hash + char.charCodeAt(0);
            hash |= 0; // Constrain to 32bit integer
        }
        return hash;
    }

    function shortDateTime(timestamp) {
        if (timestamp == 0) {
            return "";
        }
        const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let dayLen = 1000 * 60 * 60 * 24;
        let today = new Date();
        let date = new Date(timestamp);
        let dayDiff = Math.floor(today / dayLen) - Math.floor(date / dayLen);
        let dd = date.getDate();
        let hh = date.getHours();
        let mm = date.getMinutes();
        let yy = date.getFullYear();
        let day = shortDayNames[date.getDay()];
        let month = shortMonthNames[date.getMonth()];

        let dayString = `${dd} ${month} `;
        if (dayDiff == 0) {
            dayString = "";
        } else if (dayDiff < 6) {
            dayString = day + "&nbsp;";
        } else if (dayDiff > 200) { //a while ago
            dayString += yy + "&nbsp;";
        }
        let mins = ("" + (1000 + mm)).slice(-2);
        return dayString + hh + ":" + mins;
    }

    // ******************** FILE MENU ***********************
    let file = (controls) => {
        let clist = [
            {
                title: "Load", func: () => queryUnload(loadFile)
            },
            {
                title: "Save", func: saveFile
            }
        ];
        return clist;
    }

    async function loadFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            const text = await file.text();
            filename = file.name;
            filetime = file.lastModified
            filehash = hash(text);
            updatePage(text)
            await saveToCache(text);
        } catch (e) {
            //User abandoned?
            console.error(e);
        }
        return true;
    }

    async function saveFile() {
        let text = page.content.value;
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename
            });
            const writable = await fileHandle.createWritable();
            await writable.write(text);
            await writable.close();
            filename = fileHandle.name;
            filehash = hash(text);
            filetime = new Date().getTime();
            updateFileInfo();
        } catch {
            //User abandoned?
        }
        return true; //to close menu
    }

    // ******************** LOCAL STORAGE MENU ***********************
    let localStorageMenu = (controls) => {
        let clist = [
            {
                title: "Local storage fetch", func: () => queryUnload(localStorageFetch)
            }, {
                title: "Local storage restore", submenu: localStorageRestore
            }
        ];
        return clist;
    }

    function localStorageFetch() {
        let content = "";
        for (let n = 0; n < localStorage.length; n++) {
            let key = localStorage.key(n);
            let text = localStorage.getItem(key);
            try {
                JSON.parse(text); //Its valid JSON
            } catch (e) {
                text = JSON.stringify([text]).slice(1, -1);
                //with quotes and escaped characters
            }
            content += "\n\"" + key + "\": " + text;
            if (n < localStorage.length - 1) {
                content += ",\n";
            }
        }
        content = "{\"localStorage\": {\n" + content + "\n\n}}";
        filename = "localStorage.json";
        filehash = hash(content);
        filetime = new Date().getTime();
        updatePage(content);
        return true; //to close menu
    }

    function localStorageRestore() {
        let allLs = {};

        let doRestore = keys => {
            keys.forEach(key => {
                console.log(key, ":=", allLs[key]);
                localStorage.setItem(key, allLs[key]);
            });
            CbAlert("Updated " + keys.join(", "));
            filehash = hash(page.content.value);
            filetime = new Date().getTime();
            updateFileInfo();
            return true;
        }
        let clist = [
            {
                title: "-All-", func: x => {
                    doRestore(Object.keys(allLs));
                    return true;
                }
            }
        ];
        let ls = {};
        try {
            ls = JSON.parse(page.content.value); //Its valid JSON
        } catch (e) {
            CbAlert("Not JSON");
            return [];
        }
        if (!ls.localStorage) {
            CbAlert("Not localStorage");
            return [];
        }
        Object.keys(ls.localStorage).forEach(key => {
            let value = ls.localStorage[key];
            if (typeof value !== "string") {
                try {
                    value = JSON.stringify(value);
                } catch (e) {
                    CbAlert("Bad value for " + key);
                    return [];
                }
            }
            allLs[key] = value;
            clist.push({
                title: key, func: x => {
                    console.log(value)
                    doRestore([key]);
                    return true;
                }
            });
            //console.log(value);
        });
        return clist;
    }

    // ******************** CACHE MENU ***********************
    let cacheMenu = (controls) => {
        listCachedData();
        let clist = [
            {
                title: "Cache Load", submenu: cacheLoad
            }, {
                title: "Cache Delete", submenu: cacheDelete
            }, {
                title: "Cache Save", func: cacheSave
            }
        ];
        return clist;
    }

    async function listCachedData() {
        cacheKeyList.length = 0;
        let datacache = await caches.open(datakey);
        let cacheRequests = await datacache.keys();
        cacheRequests.forEach(async cacheRequest => {
            let path = new URL(cacheRequest.url).pathname
            cacheKeyList.push(path);
        });
    }

    function cacheLoad(controls) {
        //console.log(cacheKeyList, appNameSet);
        controls.style = {
            width: "fit-content",
            height: "fit-content",
            columns: "1 80vw"
        };
        let clist = [];
        cacheKeyList.forEach(path => {
            clist.push(
                {
                    title: "Load " + path, func: () => queryUnload(
                        async () => {
                            let resp = await dataCache.match(path);
                            let text = await resp.text();
                            filename = path.slice(1);
                            filetime = resp.headers.get("timecached") ?? 0;
                            filehash = hash(text);
                            updatePage(text);
                        }
                    )
                }
            );
        });
        return clist;
    }

    function cacheDelete(controls) {
        //console.log(cacheKeyList, appNameSet);
        controls.style = {
            width: "fit-content",
            height: "fit-content",
            columns: "1 80vw"
        };
        let clist = [];
        cacheKeyList.forEach(path => {
            clist.push(
                {
                    title: "Delete " + path, func: async () => {
                        await dataCache.delete(path);
                        CbAlert(path + " deleted");
                    }
                }
            );
        });
        return clist;
    }

    function cacheSave() {
        let fname = filename;
        if (!fname.includes("/")) {
            fname = pathname + "/" + fname;
        }
        CbPrompt("Name", fname ?? "", (fname) => {
            console.log(fname);
            setTimeout(() => {
                CbConfirm("Save to " + fname, async () => {
                    let text = page.content.value;
                    if (fname.startsWith("/")) {
                        fname = fname.slice(1);
                    }
                    saveToCache(text, "/" + fname);
                    filename = fname;
                    filehash = hash(text);
                    filetime = new Date().getTime();
                    updateFileInfo();
                });
            }, 100);
        });
        return true;
    }

    // ******************** FORMAT MENU ***********************    

    let format = (controls) => {
        let clist = [
            {
                title: "JSON", func: e => {
                    let text = page.content.value;
                    try {
                        text = JSON.stringify(JSON.parse(text), null, "    ");
                        updatePage(text, true);
                    } catch (ex) {
                        console.log(ex);
                        //Not JSON
                    }
                    modified();
                    return true; //to close menu
                }
            }, {
                title: "HEX", func: e => {
                    let text = page.content.value;
                    text = "0: " + text.split('').map((char, ix) => {
                        let space = " ";
                        if (ix % 8 == 7) {
                            space = "\n" + (ix + 1) + ": ";
                        }
                        return char.charCodeAt(0).toString(16).padStart(2, '0') + space;
                    }).join('');
                    updatePage(text, true);
                    modified();
                    return true; //to close menu
                }
            }, {
                title: "To web page", func: async e => {
                    const tempCache = "/notepad/temp";
                    let dataCache = await caches.open(tempCache);
                    await dataCache.put("temp.html", new Response(page.content.value, {
                        headers: {
                            "Content-Type": "text/html"
                        }
                    }));
                    window.open("temp.html", "notepad/temp");
                    setTimeout(e => {
                        caches.delete(tempCache);
                    }, 1000);
                }
            }
        ];
        return clist;
    }

    // ******************** UNDO REDO MENU ******************

    let undoRedoMenu = (controls) => {
        controls.style = {
            columns: 3,
            fontSize: "100%",
            minWidth: "60vw"
        }
        let clist = [
            {
                title: "Undo", func: e => {
                    document.execCommand("undo", true, null);
                    return false; //to not close menu
                }
            }, {
                title: "Redo", func: e => {
                    document.execCommand("redo", true, null);
                    return false; //to not close menu
                }
            }
        ];
        return clist;
    }

    // ******************** MAIN MENU ***********************    

    let menu = () => {
        let menuItems = [
            {title: "Clear", func: () => queryUnload(clear)},
            {title: "File", submenu: file},
            {title: "Local storage", submenu: localStorageMenu},
            {title: "Cache", submenu: cacheMenu},
            {title: "Format", submenu: format},
            {title: "Undo Redo", submenu: undoRedoMenu},
        ]
        return menuItems;
    };

    //And finally ...
    let theme = {
        themecolor: [210, 200, 255] //a bit more blue then header
    };

    CbModal(null, {theme});

    CbMakeMenu(menu, resetMe, {position: "fixed", theme});

    showLastFile();
}