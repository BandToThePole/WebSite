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
