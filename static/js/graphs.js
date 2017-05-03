

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
    var distanceValues = [], calorieValues = [];
    for (var i = 0; i < data["daily_calories"].length; i++) {
        calorieValues.push(data["daily_calories"][i].kcalcount);
    }
    for (var i = 0; i < data["daily_distances"].length; i++) {
        distanceValues.push(data["daily_distances"][i].distance/100);
    }
    createScatterDCChart(container, "Calories against Distance", distanceValues, calorieValues);
}

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    empty(container);
    addHeartRateData(container, data);
    addCalorieData(container, data);
    addDistanceData(container, data);
    addDistCalorieData(container, data);
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});
