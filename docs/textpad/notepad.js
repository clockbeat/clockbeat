"use strict"

function runit() {
    console.clear();
    const page = {};
    const all = document.querySelectorAll("*[id]");
    all.forEach((val) => {
        page[val.id] = val;
    });

    let modified = e => {
        page.content.style.height = "";
        page.content.style.height = page.content.scrollHeight + "px";
    };

    page.content.addEventListener("input", e => {
        modified(e);
    });

    let format = (controls) => {
        let clist = [
            {
                title: "JSON", func: e => {
                    let text = page.content.value;
                    try {
                        text = JSON.stringify(JSON.parse(text), null, "    ")
                        page.content.value = text;
                    } catch {
                        //Not JSON
                    }
                    setTimeout(e => {modified(e);}, 1);
                    return true; //to close menu
                }
            }
            // , {
            //     title: "HTML", func: async e => {
            //         let html = page.content.value;
            //         let tab = '\t';
            //         let result = '';
            //         let indent = '';

            //         html.split(/>\s*</).forEach(function (element) {
            //             console.log(element);
            //             if (element.match(/^\/\w/)) {
            //                 indent = indent.substring(tab.length);
            //             }
            //             result += indent + '<' + element + '>\r\n';
            //             if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input")) {
            //                 indent += tab;
            //             }
            //         });
            //         page.content.value = result;
            //         return true; //to close menu
            //     }
            // }, {
            //     title: "XML", func: async e => {
            //         let xml = page.content.value;
            //         const reg = /(>)(<)(\/*)/g;
            //         let pad = 0;
            //         let tab = "\t";

            //         xml = xml.replace(reg, '$1\r\n$2$3');

            //         let parts = xml.split('\n').map((node) => {
            //             let indent = 0;
            //             if (node.match(/. +<\/\w[^>]*>$/)) {
            //                 indent = 0;
            //             } else if (node.match(/^<\/\w/) && pad > 0) {
            //                 pad -= 1;
            //             } else if (node.match(/^<\w[^>]*[^\/]>. *$/)) {
            //                 indent = 1;
            //             } else {
            //                 indent = 0;
            //             }
            //             const result = tab.repeat(pad) + node;
            //             pad += indent;
            //             return result;
            //         });
            //         page.content.value = parts.join('\r\n');
            //         return true; //to close menu
            //     }
            // }
        ];
        return clist;
    }

    let extra = (controls) => {
        let clist = [
            {
                title: "Local storage", func: e => {
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
                        content += "\"" + key + "\": " + text;
                        if (n < localStorage.length - 1) {
                            content += ",\n";
                        }
                    }
                    page.content.value = "{\n" + content + "\n}";
                    return true; //to close menu
                }
            }, {
                title: "Paste HTML", func: async e => {
                    let items = await navigator.clipboard.read();
                    let types = items[0].types;
                    if (types.includes("text/html")) {
                        console.log(items[0].types);
                        const blob = await items[0].getType("text/html");
                        const text = await blob.text();
                        page.content.value = text;
                        setTimeout(e => {modified(e);}, 1);
                    }
                    return true; //to close menu
                }
            }
        ];
        return clist;
    }

    let file = (controls) => {
        let clist = [
            {
                title: "Load", func: async function () {
                    try {
                        const [fileHandle] = await window.showOpenFilePicker();
                        const file = await fileHandle.getFile();
                        const text = await file.text();
                        page.content.innerHTML = text;
                    } catch {
                        //User abandoned?
                    }
                    return true;
                }
            },
            {
                title: "Save", func: async e => {
                    let text = page.content.innerHTML;
                    let filename = `*.json`;
                    try {
                        const fileHandle = await window.showSaveFilePicker({
                            suggestedName: filename
                        });
                        const writable = await fileHandle.createWritable();
                        await writable.write(text);
                        await writable.close();
                    } catch {
                        //User abandoned?
                    }
                    return true; //to close menu
                }
            }
        ];
        return clist;
    }

    let menu = () => {
        let menuItems = [
            {title: "File", submenu: file},
            {title: "Format", submenu: format},
            {title: "Extra", submenu: extra}
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

    CbMakeMenu(menu, resetMe, {position: "fixed"});
}