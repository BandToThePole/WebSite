// Returns a canvas

// Returns a map with the location coordinates. Things 5% close to the poles disapear. Center of the map is the average of the coordinates.
var pinInfobox;

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

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    empty(container);
    addHeartRateData(container, data);
    addCalorieData(container, data);
    addDistanceData(container, data);
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});
