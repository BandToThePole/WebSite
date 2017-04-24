// Returns a canvas
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

function createBarChart(container, title, labels, values) {
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
    var dates = [], values = [];
    for (var i = 0; i < data["calories"].length; i++) {
        var datum = data["calories"][i];
        dates.push(new Date(datum.time));
        values.push(datum.kcalcount);
    }
    var dateValues = totalPerDay(dates, values);
    var labels = [], values = [];
    for (var i = 0; i < dateValues.length; i++) {
        labels.push(shortDate(dateValues[i].date));
        values.push(dateValues[i].value);
    }
    createBarChart(container, "Calories", labels, values);
}

function addDistanceData(container, data) {
    var dates = data["distances"].map(function(datum) { return new Date(datum.time) });
    var values = data["distances"].map(function(datum) { return datum.distance });
    var dateValues = totalPerDay(dates, values);
    var labels = dateValues.map(function(datum) { return shortDate(datum.date) });
    values = dateValues.map(function(datum) { return datum.value });
    createBarChart(container, "Distances", labels, values);
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
