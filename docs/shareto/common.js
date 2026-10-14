function buildMenu(storage) {

    let admin = (controls) => {
        let clist = [
            {
                title: "Download user data", func: async e => {
                    let text = storage.toString();
                    let filename = `sharetodata.json`;
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(text);
                    await writable.close();

                    return true; //to close menu
                }
            },
            {
                title: "Restore from file", func: async function () {
                    const [fileHandle] = await window.showOpenFilePicker();
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    storage.setStorage(JSON.parse(text));
                }
            },
            {
                title: "Copy data to clipboard", func: async function () {
                    let text = storage.toString();
                    let len = CbBytes(text.length);
                    if (text.length >= 20000) {
                        navigator.clipboard.writeText("*** Failed - too long ***");
                        CbWarning(`Failed - too long ${len}`);
                        return;
                    }
                    navigator.clipboard.writeText(text);
                    CbAlert(`Copied to clipboard ${len}`);
                }
            },
            {
                title: "Paste settings", func: async function () {
                    let text = await navigator.clipboard.readText();
                    CbConfirm("Paste settings?", () => {
                        storage.setStorage(JSON.parse(text));
                    });
                }
            }
        ];
        return clist;
    }

    let menu = () => {
        let menuItems = [
            //{title: "Home", url: "index.html"},
            {title: "Share to", url: "shareto.html"},
            {title: "Queue", url: "history.html"},
            {title: "Edits", url: "edits.html"},
            {title: "Destinations", url: "destinations.html"},
            {title: "Admin", submenu: admin}
        ]
        return menuItems;
    };

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

    CbMakeMenu(menu, resetMe);
}

