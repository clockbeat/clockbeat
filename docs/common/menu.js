
let menu = [];

let menuDiv;

document.addEventListener("DOMContentLoaded", () => {
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
        e.stopPropagation();
    }
    document.documentElement.addEventListener("click", e => {
        menuDiv.style.display = "none";
        window.commonMenuOpen = false;
    });
    document.body.appendChild(img);

    menuDiv = document.createElement("div");
    menuDiv.id = "menuDiv";
    menuDiv.style.position = "fixed";
    menuDiv.style.top = 0;
    menuDiv.style.left = "3em";
    menuDiv.style.display = "none";
    menuDiv.style.textAlign = "left";
    menuDiv.style.boxShadow = "10px 5px 5px grey";
    menuDiv.style.padding = "1em";
    menuDiv.style.backgroundColor = "white";
    menuDiv.onclick = e => {
        menuDiv.style.display = "block";
        e.stopPropagation();
    }
    document.body.appendChild(menuDiv);
    updateMenu();
});

function updateMenu() {
    menu.forEach(item => {
        if (window.location.href.endsWith(item.url)) {
            //Don't show current page
            return;
        }
        menuItemDiv = document.createElement("div");
        menuItemDiv.style.marginTop = "1em";
        if (item.url) {
            menuItem = document.createElement("a");
            menuItem.href = item.url;
        } else if (item.func) {
            menuItem = document.createElement("a");
            menuItem.href = "javascript:void(0)";
            menuItem.onclick = item.func;
        } else {
            console.log("Invalid menu item", item);
            return;
        }
        menuItem.textContent = item.title;
        menuItem.style.textDecoration = "none";
        menuItem.className = "menu-item";
        menuItemDiv.appendChild(menuItem);
        menuDiv.appendChild(menuItemDiv);
        menuItemDiv.onclick = e => {
            window.commonMenuOpen = false;
        };
    });
}

