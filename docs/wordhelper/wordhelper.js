
let main = document.getElementById("main");
let input = document.getElementById("input");
let reload = document.getElementById("reload");

let table = addET(main, "table");
let selected;

let html = localStorage.getItem("html");

if (html) {
    table.innerHTML = html;
    let tds = Array.from(document.getElementsByTagName("td"));
    tds.forEach(td => {
        if (td.id[0] == "r") {
            let col = td.id[3];
            let row = td.id[1];
            applyTdOnClick(col, td, td.parentElement, row);
            console.log(col);
        }
    });
} else {
    for (let r = 0; r < 12; r++) {
        let tr = addET(table, "tr");
        tr.className = "";
        tr.id = "r" + r;
        for (let c = 0; c < 6; c++) {
            let td = addET(tr, "td");
            td.id = "r" + r + "c" + c;
            td.innerHTML = "";
            applyTdOnClick(c, td, tr, r);
        }
    }
}

reload.onclick = function(e) {
    localStorage.removeItem("html");
    location.reload();
}

input.oninput = function (e) {
    const chr = input.value;
    input.value = "";
    if (selected.className == "") {
        let chars = document.querySelectorAll("tr.a td");
        let ok = true;
        chars.forEach(ch => {
            if (ch.innerHTML == chr) {
                ok = false;
            }
        });
        if (!ok) {
            return;
        }
        const tdid = selected.id.substring(0, 2);
        let tr = document.getElementById(tdid);
        let tx = document.getElementById(tdid + "c5");
        tx.innerHTML = "&#10006;";
        tr.className = "a";
        for (let n = 0; n < 5; n++) {
            let td = document.getElementById(tdid + "c" + n);
            td.innerHTML = chr;
        }
    } else {
        selected.innerHTML = chr;
    }
    input.blur();
    save();
}

function applyTdOnClick(c, td, tr, r) {
    if (c == 5) {
        td.className = "del";
        td.innerHTML = "&#9776;";
        td.onclick = e => {
            if (tr.className == "a") {
                console.log(r, "del");
                for (let cx = 0; cx < 5; cx++) {
                    let tx = document.getElementById("r" + r + "c" + cx);
                    tx.innerHTML = "";
                    tx.className = "";
                }
                td.innerHTML = "&#9776;";
                tr.className = "";
            } else {
                tr.className = "b";
            }
            save();
        };
    } else {
        td.onclick = e => {
            console.log(r, c);
            input.value = "";
            selected = td;
            if (tr.className == "") {
                input.focus();
            } else if (tr.className == "a") {
                let cn = selected.className;
                let type;
                if (cn) {
                    type = parseInt(cn.substring(1, 2));
                } else {
                    type = 0;
                }
                type = (type + 1) % 2;
                selected.className = "S" + type;
            } else if (tr.className == "b") {
                if (selected.className == "") {
                    selected.className = "S" + 2;
                    input.focus();
                } else {
                    selected.className = "";
                    selected.innerHTML = "";
                }
            }
            save();
        };
    }
}

function addET(target, type) {
    const el = document.createElement(type);
    target.appendChild(el);
    return el;
}

function save() {
    localStorage.setItem("html", table.innerHTML);
}