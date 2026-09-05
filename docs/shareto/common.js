function buildMenu(extraMenu) {

    let menu = () => {
        let menuItems = [
            {title: "Home", url: "index.html"},
            {title: "Share to", url: "shareto.html"},
            {title: "Queue", url: "history.html?label=Queue"},
            {title: "History", url: "history.html"},
            {title: "Edits", url: "edits.html"},
            {title: "Destinations", url: "destinations.html"},
        ]
        if (extraMenu) {
            menuItems.push(extraMenu);
        }
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

