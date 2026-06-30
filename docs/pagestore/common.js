"use strict"

function preProcessExportSettings() {
    let menuStorage = new CbStorage("pagestore");
    if (menuStorage == undefined) {
        throw "Can't backup without data";
    }
    let groups = menuStorage.getItem("groups");
    let orphaned = groups["-orphaned-"];
    delete groups["-orphaned-"];
    let text = menuStorage.toString();
    if (orphaned) {
        groups["-orphaned-"] = orphaned;
    }
    return text;
}

function processImportedSettings(importedText) {
    let menuStorage = new CbStorage("pagestore");
    try {
        let imported = JSON.parse(importedText);
        if (!imported.groups) {
            throw "Invalid settings";
        }
        console.log(imported);
        let urls = {};
        let groups = menuStorage.getItem("groups");
        for (let group in groups) {
            if (group != "-orphaned-") {
                for (let page of groups[group]) {
                    urls[page.url] = urls[page.url] ?? [];
                    urls[page.url].push({...page, group: group});
                }
            }
        }
        for (let group in imported.groups) {
            for (let page of imported.groups[group]) {
                delete urls[page.url]
            }
        }
        let orphaned = groups["-orphaned-"] ?? [];
        if (Object.keys(urls).length > 0) {
            for (let url in urls) {
                const delurl = urls[url];
                let title = delurl[0].title;
                // delurl.forEach(u => {
                //     title = u.group + ": " + title;
                // });
                orphaned.push({url, title});
            }
        }
        if (orphaned.length > 0) {
            imported.groups["-orphaned-"] = orphaned;
            CbAlert("Some orphans");

        }
        menuStorage.setStorage(imported);
        location.reload();
    } catch (e) {
        CbAlert("Invalid settings ");
    }
}


function buildMenu(noedit) {

    let menu = () => {

        let hash = location.hash;
        if (hash) {
            hash = hash.replace("group=", "");
        }

        let m = [
            {title: "Home", url: "index.html"},
            {title: "Manage pages", url: "pagestore.html", omit: noedit},
            {
                title: "Backup to file", func: async function () {
                    let text = preProcessExportSettings();
                    let filename = `pagestore.json`;
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(text);
                    await writable.close();
                }, omit: noedit
            },
            {
                title: "Restore from file", func: async function () {
                    const [fileHandle] = await window.showOpenFilePicker();
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    processImportedSettings(text);
                }
            },
            {
                title: "Copy settings", func: async function () {
                    let text = preProcessExportSettings();
                    navigator.clipboard.writeText(text);
                    CbAlert("Settings copied to clipboard");
                }, omit: noedit
            },
            {
                title: "Paste settings", func: async function () {
                    let text = await navigator.clipboard.readText();
                    CbConfirm("Paste settings?", () => {
                        processImportedSettings(text); 
                    });
                }
            },
            {title: "Preview", url: "../pagelist/pagelist.html" + hash},
        ];
        return m;
    };

    function resetMe() {
        swr.unregister();
        const pathname = location.pathname.split("/")[1];
        caches.delete(pathname + "/" + cacheName);
        document.body.innerHTML = "Resetting " + pathname + "/" + cacheName;
    }


    CbMakeMenu(menu, resetMe);
}


