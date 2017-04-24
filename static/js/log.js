function refresh() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            var logs = JSON.parse(req.responseText);
            var tbody = document.getElementById("logs");
            while (tbody.hasChildNodes()) {
                tbody.removeChild(tbody.lastChild);
            }

            for (var i = 0; i < logs.length; i++) {
                var row = document.createElement('tr');
                var numCell = document.createElement('td');
                numCell.textContent = (i + 1).toString();
                row.appendChild(numCell);
                var dataCell = document.createElement('td');
                dataCell.textContent = logs[i];
                row.appendChild(dataCell);
                tbody.appendChild(row);
            }
        }
    };
    req.open('GET', '/api/log');
    req.send();
}

document.addEventListener("DOMContentLoaded", function() {
    var refreshButton = document.getElementById("refresh-link");
    refreshButton.addEventListener('click', function(e) {
        e.preventDefault();
        refresh();
    });
    refresh();
});
