function createChart(container, title) {
    var div = document.createElement('div');
    div.classList.add('graph-container');
    var header = document.createElement('h2');
    header.textContent = title;
    header.className = "graphHeader";
    div.appendChild(header);
    container.appendChild(div);

    var canvas = document.createElement('canvas');
    canvas.className = "graphCanvas";
    canvas.width = 450;
    canvas.height = 300;
    div.appendChild(canvas);

    return canvas;
}

function createScatterChart(container, title, xAxis, yAxis) {
    var canvas = createChart(container, title);

    var xyData = [];
    for (var i = 0; i < Math.min(xAxis.length, yAxis.length); i++) {
        xyData.push({ x: xAxis[i], y: yAxis[i] });
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
                    title: function (tooltip, data) {
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
                        callback: function (value) {
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
        xyData.push({ x: xAxis[i], y: yAxis[i] });
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
                    title: function (tooltip, data, labels) {
                        var str = "Distance: " + tooltip[0].xLabel.toString() + "m";
                        return str;
                    }
                }
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Distance traveled (m)",
                        fontSize: 20
                    },
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Calories (kcal)",
                        fontSize: 20
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function createBarChart(container, title, labels, values, yaxislabel) {
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
                    scaleLabel: {
                        display: true,
                        labelString: yaxislabel,
                        fontSize: 20
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

