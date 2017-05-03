function createMap(mapContainerID, refreshButtonID) {
    var mapContainer = document.getElementById(mapContainerID);
    var mapBox = document.createElement('div');
    mapBox.classList.add('map');
    var mapImage = document.createElement('img');
    mapBox.appendChild(mapImage);
    mapContainer.appendChild(mapBox);

    var currentScale = 1, currentX = 0, currentY = 0;
    var mouseIsDown = false, lastX, lastY;

    function setTransform(scale, translateX, translateY) {
        var transform = "translate(" + translateX.toString() + "px, " + translateY.toString() + "px) " +
                        "scale(" + scale.toString() + ")";
        mapImage.style.transform = transform;
        currentScale = scale;
        currentX = translateX;
        currentY = translateY;
    }

    mapImage.onload = function () {
        setTransform(1, 0, 0);
        mouseIsDown = false;
    };

    mapBox.addEventListener('mousedown', function(e) {
        if (e.button == 0) { // Ensure left click
            mouseIsDown = true;
            lastX = e.pageX - mapBox.offsetLeft;
            lastY = e.pageY - mapBox.offsetTop;
        }
    });

    function mouseMoveOrUp(e) {
        if (mouseIsDown) {
            var x = e.pageX - mapBox.offsetLeft;
            var y = e.pageY - mapBox.offsetTop;
            var deltaX = x - lastX;
            var deltaY = y - lastY;
            // Represent the approximate bounds of Antarctica within the image
            var tx = Math.min(mapImage.offsetWidth * 0.4 * currentScale, Math.max(currentX + deltaX, -mapImage.offsetWidth * 0.5 * currentScale));
            var ty = Math.min(mapImage.offsetHeight * 0.3 * currentScale, Math.max(currentY + deltaY, -mapImage.offsetHeight * 0.45 * currentScale));
            setTransform(currentScale, tx, ty);
            lastX = x;
            lastY = y;
        }
    }

    mapBox.addEventListener('mousemove', mouseMoveOrUp);
    mapBox.addEventListener('mouseup', function(e) {
        mouseIsDown = false;
        mouseMoveOrUp(e);
    });
    mapBox.addEventListener('mouseleave', function() { mouseIsDown = false; });

    function scroll(e) {
        var newScale = Math.max(0.5, Math.min(2, currentScale * Math.pow(1.1, -e.wheelDelta / 40)));
        var cx = (mapImage.offsetWidth / 2 + currentX);
        var cy = (mapImage.offsetHeight / 2 + currentY);
        var x = ((e.pageX - mapBox.offsetLeft) - cx) / currentScale;
        var y = ((e.pageY - mapBox.offsetTop) - cy)  / currentScale;
        // Handles change of coordinate system to ensure map stays centered
        // around cursor
        setTransform(newScale, currentX + x * (currentScale - newScale), currentY + y * (currentScale - newScale));
        e.preventDefault();
    }

    mapBox.addEventListener('DOMMouseScroll', scroll);
    mapBox.addEventListener('mousewheel', scroll);

    // Prevents being able to drag the image in some browsers (important)
    mapImage.ondragstart = function() { return false; };

    function refreshMapImage() {
        // Prevents the browser caching the image
        mapImage.src = "/images/south_pole_points.png?date=" + (new Date()).getTime().toString();
    }
    refreshMapImage();

    if (refreshButtonID != undefined) {
        linkClick(refreshButtonID, refreshMapImage);
    }
}

onready(function() {
    createMap("map-container", "refresh-link");
});
