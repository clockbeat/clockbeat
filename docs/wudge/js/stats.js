
function doStats() {

    let statsHTML = `<div style="user-select: none;">
    <div id="exit"
        style="font-size: 2em; cursor: pointer; display: block; position: absolute; right: 5; color: rgb(209, 209, 209);"
        onclick="location.href = 'index.html';">
        &#10006;</div>
    <div id="main">
        <table id="stats"></table>
    </div>
</div>`

    console.clear();
    let overlay = document.getElementById("overlay");
    overlay.innerHTML = statsHTML;
    overlay.style.display = "block";

    let exit = document.getElementById("exit");
    let statsStore = new CbStorage("stats");
    let hash = (new URL(document.location)).hash.substring(1);
    let params = hash.split("&").reduce((res, item) => {
        var parts = item.split('=');
        res[parts[0]] = parts[1];
        return res;
    }, {});
    let storageName = params['type'];
    let stats = statsStore.getItem(storageName);
    if (!stats) {
        doExitStats();
        return;
    }
    let statsTable = document.getElementById("stats");
    let largest = [...stats.scores].sort((a, b) => b - a)[0];
    let mult = 100 / largest;
    stats.scores.toReversed().forEach((stat, ix) => {
        let row = addET(statsTable, "tr");
        let rowd = addET(row, "td");
        rowd.className = "stats";
        let bar = addET(rowd, "div");
        bar.style.width = (stat * mult) + "%";
        bar.innerHTML = stat > 0 ? stat : "&nbsp;";
        bar.className = (stats.scores.length - ix <= stats.pageCount) ? "badstat" : "goodstat";
    });

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