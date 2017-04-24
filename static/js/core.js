// TODO: Support params
function get(path, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            var data = JSON.parse(req.responseText);
            callback(data);
        }
    };
    req.open('GET', path);
    req.send();
}

function linkClick(id, callback) {
    var button = document.getElementById(id);
    button.addEventListener('click', function(e) {
        e.preventDefault();
        callback(e);
    });
}

function onready(callback) {
    document.addEventListener("DOMContentLoaded", callback);
}

function empty(e) {
    while (e.hasChildNodes()) {
        e.removeChild(e.lastChild);
    }
}

function sortedSetValues(set) {
    var values = Array.from(set.values());
    values.sort();
    return values;
}

function shortDate(d) {
    var opts = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return d.toLocaleDateString('en-GB', opts);
}

// The largest value for each day (uses UTC) is used. The first data point has
// to be excluded so that we have a baseline. The function returns an array of {
// date, value } objects
function totalPerDay(dates, values) {
    function day(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }
    var uniqueDates = new Set();
    for (var i = 0; i < dates.length; i++) {
        uniqueDates.add(day(dates[i]));
    }
    var uniqueDatesSorted = sortedSetValues(uniqueDates);
    var uniqueDateValues = {};

    for (var i = 0; i < values.length; i++) {
        var d = day(dates[i]);
        if (!(d in uniqueDateValues) || values[i] > uniqueDateValues[d]) {
            uniqueDateValues[d] = values[i];
        }
    }

    var dataPoints = [];
    for (var i = 1; i < uniqueDatesSorted.length; i++) {
        var pd = uniqueDatesSorted[i - 1];
        var d = uniqueDatesSorted[i];
        dataPoints.push({ date: new Date(d), value: (uniqueDateValues[d] - uniqueDateValues[pd]) });
    }
    return dataPoints;
}
