//display the 20 most recent entries
function addHeartRateData(container, data) {
    var heartRateValues = [], heartRateTimes = [];
    var start = Math.max(data["heart_rates"].length - 30, 0);
    for (var i = start; i < data["heart_rates"].length; i++) {
        var datum = data["heart_rates"][i];
        heartRateValues.push(datum.bpm);
        heartRateTimes.push(new Date(datum.time).getTime());
    }
    createScatterChart(container, "Heart Rate", heartRateTimes, heartRateValues);
}
//5 most recent entries
function addCalorieData(container, data) {
    var start = Math.max(data["daily_calories"].length - 5, 0);
    var labels = data["daily_calories"].slice(start).map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_calories"].slice(start).map(function(datum) { return datum.kcalcount });
    createBarChart(container, "Calories", labels, values, 'Calories (kcal)');
}
//5 most recent entries
function addDistanceData(container, data) {
    var start = Math.max(data["daily_distances"].length - 5, 0);
    var labels = data["daily_distances"].slice(start).map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_distances"].slice(start).map(function(datum) { return datum.distance/100 /*Convert from centimeters to meters*/ });
    createBarChart(container, "Distances", labels, values, 'Distance Traveled (m)' );
}
//5 most recent entries
function addDistCalorieData(container, data) {
    var distanceValues = [], calorieValues = [];
    var start = Math.max(data["daily_distances"].length - 5, 0);
    for (var i = start; i < data["daily_calories"].length; i++) {
        calorieValues.push(data["daily_calories"][i].kcalcount);
    }
    for (var i = start; i < data["daily_distances"].length; i++) {
        distanceValues.push(data["daily_distances"][i].distance/100);
    }
    createScatterDCChart(container, "Calories against Distance", distanceValues, calorieValues);
}

function addReducedMap(container,data) {
    var x = 350;
    var y = 350;
    if(data.locations.length != 0) {
	var lat = data.locations[data.locations.length-1].lat;
	var lon = data.locations[data.locations.length-1].long;
    
	distance = Math.sin((90 + lat)/180 * Math.PI) * 1114.10909837;
	x = Math.round(500 + Math.sin(lon /180 * Math.PI) * distance) - 150;
	y = Math.round(500 - Math.cos(lon /180 * Math.PI) * distance) - 150;
	x = Math.max(Math.min(x,700),0);
	y = Math.max(Math.min(y,700),0);
    }
    var canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    container.appendChild(canvas);
    var img = new Image;
    var ctx = canvas.getContext('2d');
    img.onload = function(){
	ctx.drawImage(img,x,y,300,300,0,0,300,300);
    };
    img.src = "images/south_pole_points.png";
}

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    empty(container);
    addHeartRateData(container, data);
    //addCalorieData(container, data);
    //addDistanceData(container, data);
    //addDistCalorieData(container, data);
    get("/api/data?user=AntarcticDemo", showMap);
}

function showMap(data) {
    var mapContainer = document.getElementById("map-container");
    empty(mapContainer)
    addReducedMap(mapContainer,data);
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});

