
let menu = [
    {title: "Home", url: "index.html"},
    {title: "Share to", url: "shareto.html"},
    {title: "Queue", url: "history.html?label=Queue"},
    {title: "History", url: "history.html"},
    {title: "Edits", url: "edits.html"},
    {title: "Destinations", url: "destinations.html"},
]

document.addEventListener("DOMContentLoaded", () => {
    img = document.createElement("img");
    img.style.position = "absolute";
    img.style.top = 0;
    img.style.left = 0;
    img.src = "hamburger.svg";
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

    menu.forEach(item => {
        if (window.location.href.endsWith(item.url)) {
            return;
        }
        menuItemDiv = document.createElement("div");
        menuItemDiv.style.marginTop = "1em"
        menuItem = document.createElement("a");
        menuItem.href = item.url;
        menuItem.textContent = item.title;
        menuItem.style.textDecoration = "none";
        menuItem.className = "menu-item";
        menuItemDiv.appendChild(menuItem);
        menuDiv.appendChild(menuItemDiv);
        menuItemDiv.onclick = e => {
            window.commonMenuOpen = false;
        };
    });
    document.body.appendChild(menuDiv);
});
