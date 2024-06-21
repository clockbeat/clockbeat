
function doStats(storageName) {

    let statsHTML = `<div style="user-select: none;">
    <div id="main">
        <div id="exit"
        style="font-size: 2em; cursor: pointer; display: block; position: absolute; right: 5; color: rgb(209, 209, 209);" >
        &#10006;</div>
        <div id="statsDiv" style="font-size: 2em; margin-left: 20%;"></div>
    </div>
</div>`

    console.clear();
    let overlay = document.getElementById("overlay");
    overlay.innerHTML = statsHTML;
    overlay.style.display = "block";

    let exit = document.getElementById("exit");
    let statsStore = new CbStorage("stats");
    let stats = statsStore.getItem(storageName);
    if (!stats) {
        doExitStats();
        return;
    }
    let statsDiv = document.getElementById("statsDiv");
    const average = Math.round((stats.total / stats.tries) * 10) / 10;
    statsDiv.innerHTML = `
        <br>Average ${average}
        <br>Low ${stats.low}
        <br>High ${stats.high}
        <br>Last ${stats.last}
        <br><br><br><br><br><br><br><br><br><br><br><br><br>Version ${cacheName}
    `   

    exit.onclick = e => {
        doExitStats();
    }


    function doExitStats() {
        overlay.style.display = "none";
    }

    function addET(target, type) {
        const el = document.createElement(type);
        target.appendChild(el);
        return el;
    }
}