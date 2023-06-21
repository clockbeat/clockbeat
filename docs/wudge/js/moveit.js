"use strict";

function moveit(element, mapping) {

    mapping.state = "up";

    function getPosition(e) {
        let pos = element.getBoundingClientRect();
        mapping.x = (e.clientX ?? e.targetTouches[0].clientX) - pos.left;
        mapping.y = (e.clientY ?? e.targetTouches[0].clientY) - pos.top;
    }

    function down(e) {
        mapping.state = "down";
        getPosition(e);
        mapping.downpos = {x: mapping.x, y: mapping.y};
        mapping.lastpos = {x: mapping.x, y: mapping.y};
        if (mapping.down) {
            mapping.down(e);
            e.stopPropagation();
        }
    }

    function move(e) {
        if (mapping.state == "down") {
            if (mapping.start) {
                getPosition(e);
                if (mapping.start(e) !== false) {
                    mapping.state = "move";
                }
                e.stopPropagation();
            }
        }
        if (mapping.state == "move") {
            getPosition(e);
            if (mapping.move) {
                mapping.move(e);
            }
            mapping.lastpos = {x: mapping.x, y: mapping.y};
            e.stopPropagation();
        }
    }

    function up(e) {
        if (mapping.state == "down") {
            if (mapping.tap) {
                mapping.tap(e);
                e.stopPropagation();
            }
        }
        if (mapping.state == "move") {
            if (mapping.end) {
                mapping.end(e);
                e.stopPropagation();
            }
        }
        mapping.state = "up";
        if (mapping.up) {
            mapping.up(e);
            e.stopPropagation();
        }
    }

    element.addEventListener("mousedown", down);
    element.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);

    element.addEventListener("touchstart", down);
    element.addEventListener("touchmove", move);
    document.addEventListener("touchend", up);

    return mapping;
}