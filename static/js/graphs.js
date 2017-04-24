function createGraph(container, title, xAxis, yAxis) {
    var div = document.createElement('div');
    div.classList.add('graph-container');
    var header = document.createElement('h2');
    header.textContent = title;
    header.style.textAlign = 'center';
    div.appendChild(header);
    container.appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    div.appendChild(canvas);

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

function addHeartRateData(container, data) {
    var heartRateValues = [], heartRateTimes = [];
    for (var i = 0; i < data["heart_rates"].length; i++) {
        var datum = data["heart_rates"][i];
        heartRateValues.push(datum.bpm);
        heartRateTimes.push(new Date(datum.time).getTime());
    }
    createGraph(container, "Heart Rate", heartRateTimes, heartRateValues);
}

function showGraphs(data) {
    var container = document.getElementById("graphs-container");
    empty(container);
    addHeartRateData(container, data);
}

function refresh() {
    get("/api/data", showGraphs);
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});
