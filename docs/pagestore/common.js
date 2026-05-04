
let menuStorage;

if (typeof menu !== "undefined") {
    menu = [
        {title: "Home", url: "index.html#here"},
        {title: "Manage pages", url: "pagestore.html"},
        {
            title: "Backup", func: async function () {
                if (menuStorage == undefined) {
                    throw "Can't backup without data";
                }
                let text = menuStorage.toString();
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
                let imported = JSON.parse(text);
                console.log(imported);
                storage.setStorage(imported);
                location.reload();
            }
        },
        {
            title: "Copy settings", func: async function () {
                if (menuStorage == undefined) {
                    throw "Can't backup without data";
                }
                let text = menuStorage.toString();
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
                try {
                    let imported = JSON.parse(text);
                    console.log(imported);
                    storage.setStorage(imported);
                    location.reload();
                } catch (e) {
                    window.alert("Invalid settings");
                }
            }
        }
    ];
}