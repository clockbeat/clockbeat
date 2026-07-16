"use strict"

function CbMakeMenu(menuFunc, secretFunc, profile) {

    //  mainMenuFunc supplies an array of menu objects
    // title - the title 
    //     url - a simple url
    // or: func - a function to execute
    // or: submenu - a function which will supply an array of menu objects

    if (document.getElementById("cbMenuDiv")) {
        console.log("Menu updated");
        mainMenu = {func: menuFunc};  //untested
        return;
    }

    if (!profile) {
        profile = {};
    }

    let menuDiv;
    let mainMenu = {func: menuFunc}; //sub menus also have parentMenu:
    let secretCount = 0;
    let menuDivStyle = `
        position: fixed;
        top: 0px;
        left: 3em;
        min-width: 40vw;
        max-height: 70vh;
        text-align: left;
        box-shadow: grey 10px 5px 5px;
        border-style: solid;
        border-width: 1px;
        padding: 0.5em;
        background-color: white;
        user-select: none;
        columns: auto 20vw;
        padding-top: 1em;
        `
    let img = document.createElement("img");
    img.style.position = profile.position ?? "absolute";
    img.style.top = 0;
    img.style.left = 0;
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cpath d='M15.727 25.714h128.546m-128.546 30h128.546m-128.546 30h128.546' style='fill:none;stroke:%23000;stroke-width:19.127;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3E%3C/svg%3E";
    img.style.width = "2em";
    img.style.padding = "1em";
    img.style.cursor = "pointer";
    img.onclick = e => {
        if (menuDiv.style.display != "none") {
            secretCount++;
            console.log("Secret count", secretCount);
            if (secretCount >= 5 && secretFunc) {
                secretFunc();
            }
            e.stopPropagation();
            return;
        }
        menuDiv.style.display = "block";
        window.commonMenuOpen = true;
        resetMenu();
        e.stopPropagation();
        secretCount = 0;
    }
    document.documentElement.addEventListener("click", e => {
        closeMenu();
    });
    document.body.appendChild(img);

    menuDiv = document.createElement("div");
    menuDiv.id = "cbMenuDiv";
    menuDiv.style.cssText = menuDivStyle;
    menuDiv.style.display = "none";

    menuDiv.onclick = e => {
        //menuDiv.style.display = "block";
        e.stopPropagation();
    }
    document.body.appendChild(menuDiv);


    function closeMenu() {
        resetMenu();
        menuDiv.style.display = "none";
        window.commonMenuOpen = false;
    }

    function resetMenu() {
        updateMenu(mainMenu);
    }

    function updateMenu(menu) {
        menuDiv.style.cssText = menuDivStyle;
        if (!menu) {
            menu = mainMenu;
        }
        let controls = {style: {}};
        let items = menu.func(controls);

        items.unshift({
            title: "&#x21a9;", css: "font-size: 200%", func: e => {
                if (menu.parentMenu) {
                    updateMenu(menu.parentMenu);
                } else {
                    closeMenu();
                }
            }
        });

        if (controls.style) {
            for (let key in controls.style) {
                menuDiv.style[key] = controls.style[key];    
            }
        } 

        menuDiv.innerHTML = "";

        items.forEach(item => {
            if (window.location.pathname.endsWith(item.url)) {
                //Don't show current page
                return;
            }
            if (item.omit) {
                return;
            }
            let menuItem;
            if (item.url) {
                menuItem = document.createElement("a");
                menuItem.href = item.url;
            } else if (item.func) {
                menuItem = document.createElement("a");
                menuItem.href = "javascript:void(0)";
                menuItem.onclick = e => {
                    if (item.func(item)) {
                        closeMenu();
                    }
                }
            } else if (item.submenu) {
                menuItem = document.createElement("a");
                menuItem.href = "javascript:void(0)";
                menuItem.onclick = e => {
                    updateMenu({func: item.submenu, parentMenu: menu});
                }
            } else {
                console.log("Invalid menu item", item);
                return;
            }
            menuItem.innerHTML = item.title + "\n\n";
            menuItem.style.cssText = `
                text-decoration: none;
                display: block;
                white-space: pre-wrap;
            `
            //menuItemDiv.appendChild(menuItem);
            menuDiv.appendChild(menuItem);
            //menuDiv.appendChild(document.createElement("br"));
            // menuDiv.onclick = e => {
            //     window.commonMenuOpen = false;
            // };
        });
    }
}

function CbModal(func, profile) {

    //TODO profile only with xxx-event functions

    let promptDiv = document.getElementById("cbModalDiv");
    let capture = [];
    if (profile.capture) {
        if (typeof profile.capture == "string") {
            capture.push(profile.capture);
        } else {
            capture = profile.capture;
        }
    }

    if (promptDiv) {
        promptDiv.close();
        promptDiv.remove();
    }
    promptDiv = document.createElement("dialog");
    promptDiv.id = "cbModalDiv";

    promptDiv.style.cssText = `
        position: fixed;
        min-width: 50vw;
        text-align: center;
        box-shadow: grey 10px 5px 5px;
        border-style: solid;
        border-width: 1px;
        border-radius: 0.5em;
        padding: 0.5em;
        background-color: lightgrey;
        user-select: none;
        margin-top: 2px;
    `;

    if (profile.title) {
        let title = document.createElement("div");
        title.innerText = profile.title;
        promptDiv.appendChild(title);
    }

    if (profile.input == "text") {
        let inp = document.createElement("input");
        inp.style.cssText = "font-size: 16pt";
        inp.type = "text";
        inp.onclick = e => {
            func(e, profile);
            e.stopPropagation();
        }
        inp.oninput = e => {
            func(e, profile);
            e.stopPropagation();
        }
        inp.onkeydown = e => {
            if (e.key == "Enter") {
                func(new CustomEvent("Enter", {detail: {value: inp.value}}), profile);
                promptDiv.close();
            } else {
                func(e, profile);
            }
        }
        if (profile.initialValue) {
            inp.value = profile.initialValue;
            inp.click();
        }

        promptDiv.appendChild(inp);
        inp.focus();
    }

    if (profile.input == "OK") {
        let inp = document.createElement("input");
        inp.style.cssText = "font-size: 16pt";
        inp.type = "button";
        inp.value = "OK";
        inp.onclick = e => {
            func(e);
        }
        promptDiv.appendChild(inp);
    }

    promptDiv.onclick = e => {
        promptDiv.close();
        func(e, profile);
        e.stopPropagation();
    }

    promptDiv.onclose = e => {
        func(e, profile);
    }

    document.body.appendChild(promptDiv);
    promptDiv.showModal();
}

//func is called on enter, events for every event
function CbPrompt(title, initialValue, func, events) {
    //Initial value gets a click event for events
    CbModal((e, profile) => {
        if (e.type == "Enter" && e.detail.value) {
            func(e.detail.value.trim());
        }
        if (events) {
            events(e);
        }
    }, {title: title, input: "text", initialValue});
}

//events called for every event
function CbAlert(message, events) {
    CbModal((e, profile) => {
        if (events) {
            events(e);
        }
    }, {title: message});
}

//func is called on OK click, events for every event
function CbConfirm(message, func, events) {
    CbModal((e, profile) => {
        if (e.type == "click" && e.target.type == "button") {
            func();
        }
        if (events) {
            events(e);
        }
    }, {title: message, input: "OK"});
}