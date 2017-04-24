function refresh() {
    get("/api/log", function(data) {
        var tbody = document.getElementById("logs");
        empty(tbody);

        for (var i = 0; i < data.length; i++) {
            var row = document.createElement('tr');
            var numCell = document.createElement('td');
            numCell.textContent = (i + 1).toString();
            row.appendChild(numCell);
            var dataCell = document.createElement('td');
            dataCell.textContent = data[i];
            row.appendChild(dataCell);
            tbody.appendChild(row);
        }
    });
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});
