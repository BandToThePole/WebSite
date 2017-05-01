

// Returns a map with the location coordinates. Things 5% close to the poles disapear. Center of the map is the average of the coordinates.
var pinInfobox;


function drawSouthPole(container, title) {

    var div = document.createElement('div');
    div.classList.add('SouthPoleMap');
    var header = document.createElement('h2');
    header.textContent = title;
    div.appendChild(header);
    container.appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.id = "SouthPoleCanvas";
    canvas.width = 1000;
    canvas.height = 1000;
    div.appendChild(canvas);

    var context = canvas.getContext("2d");

    var background = document.getElementById("back");
    var pin = document.getElementById("pin");
    context.drawImage(background, 0, 0);
    var pinlocations = new Array
    // pinlocations has the coordinates for now
    var distance = 0;
    pinlocations[0] = { 'x': -72.21, 'y': 103 };
    pinlocations[1] = { 'x': -60.44, 'y': 81.44 };
    pinlocations[2] = { 'x': -90, 'y': 0 };
    for (var i = 0; i < pinlocations.length; i++) {
        if (pinlocations[i].y < 0) { pinlocations[i].y = pinlocations + 360; }
        distance = Math.sqrt(pinlocations[i].x + 90) * 78.71;
        pinlocations[i].x = Math.round(500 + Math.sin(pinlocations[i].y+90) * distance);
        pinlocations[i].y = Math.round(500 - Math.cos(pinlocations[i].y+90) * distance);
    }
    var ctx = canvas.getContext("2d");
    for (var i = 0; i < pinlocations.length; i++) {
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(pinlocations[i - 1].x, pinlocations[i - 1].y);
            ctx.lineTo(pinlocations[i].x, pinlocations[i].y);
            ctx.strokeStyle = "red";
            ctx.stroke();
        }
        context.drawImage(pin, pinlocations[i].x -10, pinlocations[i].y - 20);
    }
}

function GetMap() {
    get("/api/data", function (data) {

        var pushpinInfos = [];

        for (var i = 0; i < data['locations'].length; i++) {
            pushpinInfos[i] = { 'lat': data['locations'][i].lat, 'lng': data['locations'][i].long, 'title': '', 'description': '' }
        }
        var infoboxLayer = new Microsoft.Maps.EntityCollection();
        var pinLayer = new Microsoft.Maps.EntityCollection();
        var apiKey = "nOSKRNG5pKYVZBxuqeB1~_fZaGaszA4sQfv_IVovH3g~AhVTVYm5o-dJ9d-xa_HWt81coXTx2_mBXsIpDFiDj6Ao_Tl7HxGIHMNjzBrLZmJA";

        var map = new Microsoft.Maps.Map(document.getElementById("map"), { credentials: apiKey });

        // Create the info box for the pushpin
        pinInfobox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(0, 0), { visible: false });
        infoboxLayer.push(pinInfobox);
        var lineVertices = new Array
        var locs = [];
        for (var i = 0; i < pushpinInfos.length; i++) {
            locs[i] = new Microsoft.Maps.Location(pushpinInfos[i].lat, pushpinInfos[i].lng);
            lineVertices.push(locs[i]);
            var pin = new Microsoft.Maps.Pushpin(locs[i]);
            pin.Title = pushpinInfos[i].title;
            pin.Description = pushpinInfos[i].description;
            pinLayer.push(pin);
            Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);
        }
        var line = new Microsoft.Maps.Polyline(lineVertices);
        map.entities.push(line);
        map.entities.push(pinLayer);
        map.entities.push(infoboxLayer);
        if (data['locations'].length > 0) {
            var bestview = Microsoft.Maps.LocationRect.fromLocations(locs);
            map.setView({ center: bestview.center, zoom: 10 });
        }
    })
}

function displayInfobox(e) {
    pinInfobox.setOptions({ title: e.target.Title, description: e.target.Description, visible: true, offset: new Microsoft.Maps.Point(0, 25) });
    pinInfobox.setLocation(e.target.getLocation());
}

function hideInfobox(e) {
    pinInfobox.setOptions({ visible: false });
}

function createChart(container, title) {
    var div = document.createElement('div');
    div.classList.add('graph-container');
    var header = document.createElement('h2');
    header.textContent = title;
    div.appendChild(header);
    container.appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    div.appendChild(canvas);

    return canvas;
}

function createScatterChart(container, title, xAxis, yAxis) {
    var canvas = createChart(container, title);

    var xyData = [];
    for (var i = 0; i < Math.min(xAxis.length, yAxis.length); i++) {
        xyData.push({x: xAxis[i], y: yAxis[i]});
    }

    var chart = new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                label: "Heart rate",
                data: xyData,
                borderColor: "#000000",
                backgroundColor: "#0C5DCF"
            }]
        },
        options: {
            showLines: false,
            legend: {
                display: false,
            },
            tooltips: {
                callbacks: {
                    title: function(tooltip, data) {
                        var d = new Date(tooltip[0].xLabel);
                        var opts = {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                        };
                        return d.toLocaleDateString('en-GB', opts);
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        beginAtZero: false,
                        callback: function(value) {
                            return (new Date(value)).toLocaleDateString();
                        }
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

//create the chart calories/distances
function createScatterDCChart(container, title, xAxis, yAxis) {
    var canvas = createChart(container, title);

    var xyData = [];
    for (var i = 0; i < Math.min(xAxis.length, yAxis.length); i++) {
        xyData.push({x: xAxis[i], y: yAxis[i]});
    }

    var chart = new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                label: "Calories",
                data: xyData,
                borderColor: "#000000",
                backgroundColor: "#0C5DCF"
            }]
        },
        options: {
            showLines: false,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    title: function(tooltip, data, labels) {
                        var str = "Distance: "+ tooltip[0].xLabel.toString() + "m";
                        return str;
                    }
                }
            },
            scales: {
                xAxes: [{
                    scaleLabel : {
                        display : true,
                        labelString : "Distance traveled (m)",
                        fontSize : 20
                    },
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    scaleLabel : {
                        display : true,
                        labelString : "Calories (kcal)",
                        fontSize : 20
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function createBarChart(container, title, labels, values,yaxislabel) {
    var canvas = createChart(container, title);
    var chart = new Chart(canvas, {
        type: "bar",
        data: {
            label: "Calories",
            labels: labels,
            datasets: [{
                data: values
            }]
        },
        options: {
            legend: {
                display: false,
            },
            scales: {
                yAxes: [{
		    scaleLabel : {
			display : true,
			labelString : yaxislabel,
			fontSize : 20
		    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function addHeartRateData(container, data) {
    var heartRateValues = [], heartRateTimes = [];
    for (var i = 0; i < data["heart_rates"].length; i++) {
        var datum = data["heart_rates"][i];
        heartRateValues.push(datum.bpm);
        heartRateTimes.push(new Date(datum.time).getTime());
    }
    createScatterChart(container, "Heart Rate", heartRateTimes, heartRateValues);
}

function addCalorieData(container, data) {
    var labels = data["daily_calories"].map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_calories"].map(function(datum) { return datum.kcalcount });
    createBarChart(container, "Calories", labels, values, 'Calories (kcal)');
}

function addDistanceData(container, data) {
    var labels = data["daily_distances"].map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_distances"].map(function(datum) { return datum.distance/100 /*Convert from centimeters to meters*/ });
    createBarChart(container, "Distances", labels, values, 'Distance Traveled (m)' );
}

function addDistCalorieData(container, data) {
    var distanceValues = [], calorieValues = [], dateTimes = [];
    for (var i = 0; i < data["daily_calories"].length; i++) {
        calorieValues.push(data["daily_calories"][i].kcalcount);
        dateTimes.push(new Date(data["daily_calories"][i].time).getTime());
    }
    for (var i = 0; i < data["daily_distances"].length; i++) {
        distanceValues.push(data["daily_distances"][i].distance/100);
    }
    createScatterDCChart(container, "Calories against Distance", distanceValues, calorieValues);
}

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    var mapcontainer = document.getElementById("SouthPoleMap");
    empty(container);
    empty(mapcontainer);
    drawSouthPole(mapcontainer, "Map");
    addHeartRateData(container, data);
    addCalorieData(container, data);
    addDistanceData(container, data);
    addDistCalorieData(container, data);
    loadartic();
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});






function loadartic() {

    var gkhead = new Image;
    var canvas = document.getElementById("SouthPoleCanvas");

    gkhead.id = "pic";
    gkhead.src = canvas.toDataURL('image/jpeg', 1.0);

    var ctx = canvas.getContext('2d');
    trackTransforms(ctx);

    function redraw() {

        // Clear the entire canvas
        var p1 = ctx.transformedPoint(0, 0);
        var p2 = ctx.transformedPoint(canvas.width, canvas.height);
        //ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.drawImage(gkhead, 0, 0);

    }
    var lastX = canvas.width / 2, lastY = canvas.height / 2;

    var dragStart, dragged;

    canvas.addEventListener('mousedown', function (evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX, lastY);
        dragged = false;
    }, false);

    canvas.addEventListener('mousemove', function (evt) {
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart) {
            var pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
            redraw();
        }
    }, false);

    canvas.addEventListener('mouseup', function (evt) {
        dragStart = null;
        if (!dragged) zoom(evt.shiftKey ? -1 : 1);
    }, false);

    var scaleFactor = 1.1;
    var actualscale = 1;

    var zoom = function (clicks) {
        var pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x, pt.y);
        var factor = Math.max(1/actualscale,Math.pow(scaleFactor, clicks));
        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);
        actualscale = actualscale * factor;
        redraw();
    }

    var handleScroll = function (evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
    };

    canvas.addEventListener('DOMMouseScroll', handleScroll, false);
    canvas.addEventListener('mousewheel', handleScroll, false);
};






// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function () { return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function () {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function () {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
        var m2 = svg.createSVGMatrix();
        m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
        xform = xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    };

    var setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
        pt.x = x; pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }
}
