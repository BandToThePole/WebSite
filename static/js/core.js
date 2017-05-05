// TODO: Support params
function get(path, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            empty(document.getElementById("bad-response-container"));
            var data = JSON.parse(req.responseText);
            callback(data);
        }
        else if(path == "/api/data" && req.status == 0) {
            var container = document.getElementById("bad-response-container");
            empty(container);
            container.innerHTML = "Loading data...";
        }
        else if(path == "/api/data" && req.status == 500){
            var container = document.getElementById("bad-response-container");
            empty(container);
            container.innerHTML = "Error: Bad response from server";
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

