
let menuStorage;

function preProcessExportSettings() {
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
            window.alert("Some orphans");

        }
        storage.setStorage(imported);
        location.reload();
    } catch (e) {
        window.alert("Invalid settings");
    }
}

if (typeof menu !== "undefined") {
    menu = [
        {title: "Home", url: "index.html#here"},
        {title: "Manage pages", url: "pagestore.html"},
        {
            title: "Backup", func: async function () {
                let text = preProcessExportSettings();
                let filename = `pagestore.json`;
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename
                });
                const writable = await fileHandle.createWritable();
                await writable.write(text);
                await writable.close();
            }
        },
        {
            title: "Restore", func: async function () {
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
                window.alert("Settings copied to clipboard");
            }
        },
        {
            title: "Paste settings", func: async function () {
                let text = await navigator.clipboard.readText();
                if (!window.confirm("Paste settings?")) {
                    return;
                }
                processImportedSettings(text);
            }
        }
    ];
}

