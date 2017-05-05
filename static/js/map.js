function createMap(mapContainerID, refreshButtonID,initialX,initialY, initialScale) {
    var mapContainer = document.getElementById(mapContainerID);
    var mapBox = document.createElement('div');
    mapBox.classList.add('map');
    var mapImage = document.createElement('img');
    mapBox.appendChild(mapImage);
    mapContainer.appendChild(mapBox);

    var currentScale = initialScale, currentX = initialX, currentY = initialY;
    var mouseIsDown = false, lastX, lastY;
    console.log(initialX,initialY,initialScale);
    function setTransform() {
        x=mapBox.offsetWidth/2 - currentX;
        y=mapBox.offsetHeight/2 - currentY;
        c = currentScale;

        var transform = "matrix("+c+",0,0,"+c+","+(x + (mapImage.offsetWidth/2-currentX)*(c-1)) +","+(y + (mapImage.offsetHeight/2-currentY)*(c-1))+")";

        mapImage.style.transform = transform;
    }

    mapImage.onload = function () {
        boundXY();
        setTransform();
        mouseIsDown = false;
    };

    mapBox.addEventListener('mousedown', function(e) {
        if (e.button == 0) { // Ensure left click
            mouseIsDown = true;
            lastX = e.pageX - mapBox.offsetLeft;
            lastY = e.pageY - mapBox.offsetTop;
        }
    });

    function boundXY() {
        currentX = bound(currentX,mapBox.offsetWidth/(2*currentScale),mapImage.offsetWidth -mapBox.offsetWidth/(2*currentScale));
        currentY = bound(currentY,mapBox.offsetHeight/(2*currentScale),mapImage.offsetHeight -mapBox.offsetHeight/(2*currentScale));
    }

    function mouseMoveOrUp(e) {
        if (mouseIsDown) {
            var x = e.pageX - mapBox.offsetLeft;
            var y = e.pageY - mapBox.offsetTop;
            var deltaX = x - lastX;
            var deltaY = y - lastY;
            // Represent the approximate bounds of Antarctica within the image
            currentX -= deltaX/currentScale;
            currentY -= deltaY/currentScale;
            boundXY();
            setTransform();
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
        currentScale = bound(currentScale * Math.pow(1.1, -e.wheelDelta / 100),0.5,2);
        boundXY();
        setTransform();
        e.preventDefault();
    }

    mapBox.addEventListener('DOMMouseScroll', scroll);
    mapBox.addEventListener('mousewheel', scroll);

    // Prevents being able to drag the image in some browsers (important)
    mapImage.ondragstart = function() { return false; };

    var currentTouchLocations = {};
    var meanTouch;
    var touchDistance;

    function averageXY() {
        var x = 0;
        var y = 0;
        var ids = Object.keys(currentTouchLocations);
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            x += currentTouchLocations[id].x;
            y += currentTouchLocations[id].y;
        }
        x /= ids.length;
        y /= ids.length;
        return { x: x, y: y};
    }

    function computeTouchDistance() {
        var ids = Object.keys(currentTouchLocations);
        if (ids.length >= 2) {
            var dx = currentTouchLocations[ids[0]].x - currentTouchLocations[ids[1]].x;
            var dy = currentTouchLocations[ids[0]].y - currentTouchLocations[ids[1]].y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        return 0;
    }

    // Touch handling is reasonably similar to mouse tracking
    mapBox.addEventListener('touchstart', function(e) {
        var touches = e.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            currentTouchLocations[touch.identifier] = { x: touch.pageX - mapBox.offsetLeft, y: touch.pageY - mapBox.offsetTop };
        }
        meanTouch = averageXY();
        touchDistance = computeTouchDistance();
    });

    var touchEndOrCancel = function(e) {
        var touches = e.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            delete currentTouchLocations[touches[i].identifier];
        }
        if (Object.keys(currentTouchLocations).length > 0) {
            meanTouch = averageXY();
            touchDistance = computeTouchDistance();
        }
    };
    mapBox.addEventListener('touchend', touchEndOrCancel);
    mapBox.addEventListener('touchcancel', touchEndOrCancel);
    mapBox.addEventListener('touchmove', function(e) {
        var touches = e.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            currentTouchLocations[touch.identifier] = { x: touch.pageX - mapBox.offsetLeft, y: touch.pageY - mapBox.offsetTop };
        }
        e.preventDefault();
        var xy = averageXY();
        var deltaX = xy.x - meanTouch.x;
        var deltaY = xy.y - meanTouch.y;
        // Represent the approximate bounds of Antarctica within the image
        currentX -= deltaX/currentScale;
        currentY -= deltaY/currentScale;
        meanTouch = xy;
        if (Object.keys(currentTouchLocations).length >= 2) {
            var newTouchDistance = computeTouchDistance();
            var sf = newTouchDistance / touchDistance;
            touchDistance = newTouchDistance;
            currentScale = Math.max(0.5, Math.min(2, currentScale * sf));
        }
        boundXY();
        setTransform();
    });


    function refreshMapImage() {
        // Prevents the browser caching the image
        mapImage.src = "/images/south_pole_points.png?date=" + (new Date()).getTime().toString();
    }
    refreshMapImage();

    if (refreshButtonID != undefined) {
        linkClick(refreshButtonID, refreshMapImage);
    }
}

function bound(x,low,high) {
    return Math.max(Math.min(x,high),low);
}


