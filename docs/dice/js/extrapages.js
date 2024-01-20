
function applyExtraPage(icon, heading, useElement, bgcolor, callback) {

    let extraDiv = document.createElement("div");

    extraDiv.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999;
    background-color: white;
    text-align: center;
    font-family: "sans-serif";
    background-color: ${bgcolor}
`;

    let headingDiv = document.createElement("h1");
    headingDiv.innerText = heading;  
    extraDiv.appendChild(headingDiv);
    let goicon = document.getElementById(icon);
    goicon.style.cursor = "pointer";
    extraDiv.appendChild(goicon);

    goicon.onclick = e => {
        extraDiv.style.display = "none";
        callback();
    }
    extraDiv.appendChild(useElement);

    document.body.appendChild(extraDiv);
}