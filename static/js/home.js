var mapMade = false

//display the 20 most recent entries
function addHeartRateData(container, data) {
    var heartRateValues = [], heartRateTimes = [];
    var start = Math.max(data["heart_rates"].length - 20, 0);
    for (var i = start; i < data["heart_rates"].length; i++) {
        var datum = data["heart_rates"][i];
        heartRateValues.push(datum.bpm);
        heartRateTimes.push(new Date(datum.time).getTime());
    }
    createScatterChart(container, "Heart Rate", heartRateTimes, heartRateValues);
}
//5 most recent entries
function addCalorieData(container, data) {
    var labels = data["daily_calories"].slice(-5).map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_calories"].slice(-5).map(function(datum) { return datum.kcalcount });
    createBarChart(container, "Calories", labels, values, 'Calories (kcal)');
}
//5 most recent entries
function addDistanceData(container, data) {
    var labels = data["daily_distances"].slice(-5).map(function(datum) { return shortDate(new Date(datum.date)) });
    var values = data["daily_distances"].slice(-5).map(function(datum) { return datum.distance/100 /*Convert from centimeters to meters*/ });
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

}

function startTimer() {
    var today = new Date();
    var h = today.getUTCHours();
    var m = today.getUTCMinutes();
    var s = today.getUTCSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('time').innerHTML =
        h + ":" + m + ":" + s;
    var t = setTimeout(startTimer, 500);
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

function fillDetails(data) {
    var caloriePrint = ""
    var distancePrint = ""
    var heartratePrint = ""
    if (data.daily_calories.length == 0) {caloriePrint = "No Calorie Data";}
    else {caloriePrint = data.daily_calories[data.daily_calories.length - 1].kcalcount + " kcal";}
    if (data.daily_distances.length == 0) {distancePrint = "No Distance Data";}
    else {distancePrint = data.daily_distances[data.daily_distances.length - 1].distance/100 + " m";}
    // average last 10 values
    if (data.heart_rates.length < 10){ heartratePrint = "Not enough data";}
    else {
        var sum = 0
        data.heart_rates.slice(-10).forEach((x) => {sum += x.bpm});
        heartratePrint = (sum / 10) + " bpm";
    }
    document.getElementById('calories').innerHTML = caloriePrint;
    document.getElementById('distance').innerHTML = distancePrint;
    document.getElementById('heartrate').innerHTML = heartratePrint;


}

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    empty(container);
    startTimer();
    fillDetails(data);
    addHeartRateData(container, data);
    //addCalorieData(container, data);
    //addDistanceData(container, data);
    //addDistCalorieData(container, data);
    get("/api/data?user=AntarcticDemo", setDistances);
}

function setDistances(data) {
    var toPrint = ""
    var x = 500;
    var y = 500;
    if(data.locations.length != 0) {
        var lat = data.locations[data.locations.length-1].lat;
        var lon = data.locations[data.locations.length-1].long;

        distance = Math.sin((90 + lat)/180 * Math.PI) * 1114.10909837;
        x = Math.round(500 + Math.sin(lon /180 * Math.PI) * distance);
        y = Math.round(500 - Math.cos(lon /180 * Math.PI) * distance);

        toPrint = Math.round((90 + lat)/180 * Math.PI * 6356.7523) + " Km"
    }
    else toPrint = "Expedition has not started";
    document.getElementById('distanceleft').innerHTML = toPrint;
    if(!mapMade){
        mapMade = true;
        createMap('map-container','refresh-link',x,y,1.3);
    }
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});

