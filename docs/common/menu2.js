function CbMakeMenu(menuFunc) {

    //  mainMenuFunc supplies an array of menu objects
    // title - the title
    //     url - a simple url
    // or: func - a function to execute
    // or: submenu - a function which will supply an array of menu objects

    let menuDiv;
    let mainMenu = {func: menuFunc}; //sub menus also have parentMenu:

    let img = document.createElement("img");
    img.style.position = "absolute";
    img.style.top = 0;
    img.style.left = 0;
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cpath d='M15.727 25.714h128.546m-128.546 30h128.546m-128.546 30h128.546' style='fill:none;stroke:%23000;stroke-width:19.127;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3E%3C/svg%3E";
    img.style.width = "2em";
    img.style.padding = "1em";
    img.style.cursor = "pointer";
    img.onclick = e => {
        menuDiv.style.display = "block";
        window.commonMenuOpen = true;
        resetMenu();
        e.stopPropagation();
    }
    document.documentElement.addEventListener("click", e => {
        closeMenu();
    });
    document.body.appendChild(img);

    menuDiv = document.createElement("div");
    menuDiv.id = "menuDiv";
    menuDiv.style.position = "fixed";
    menuDiv.style.top = 0;
    menuDiv.style.left = "3em";
    menuDiv.style.minWidth = "20vw";
    menuDiv.style.display = "none";
    menuDiv.style.textAlign = "left";
    menuDiv.style.boxShadow = "10px 5px 5px grey";
    menuDiv.style.padding = "1em";
    menuDiv.style.backgroundColor = "white";
    menuDiv.onclick = e => {
        //menuDiv.style.display = "block";
        e.stopPropagation();
    }
    document.body.appendChild(menuDiv);


    function closeMenu() {
        menuDiv.style.display = "none";
        resetMenu();
        window.commonMenuOpen = false;
    }

    function resetMenu() {
        updateMenu(mainMenu);
    }

    function updateMenu(menu) {
        if (!menu) {
            menu = mainMenu;
        }
        let items = menu.func();
        if (menu.parentMenu) {
            items.unshift({
                title: "&#x21a9;", css: "font-size: 200%", func: e => {
                    updateMenu(menu.parentMenu);
                }
            });
        }

        menuDiv.innerHTML = "";
        items.forEach(item => {
            if (window.location.href.endsWith(item.url)) {
                //Don't show current page
                return;
            }
            let menuItemDiv = document.createElement("div");
            if (item.css) {
                menuItemDiv.style.cssText = item.css ?? "";
            } else {
                menuItemDiv.style.marginTop = "1em";
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
            menuItem.innerHTML = item.title;
            menuItem.style.textDecoration = "none";
            menuItem.className = "menu-item";
            menuItemDiv.appendChild(menuItem);
            menuDiv.appendChild(menuItemDiv);
            menuItemDiv.onclick = e => {
                window.commonMenuOpen = false;
            };
        });
    }
}

