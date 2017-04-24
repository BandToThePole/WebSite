function prettyName(s) {
    if (s == "kcalcount") {
        return "kCal";
    }
    s = s.replace(/(_|-)/, ' ');
    s = s[0].toUpperCase() + s.slice(1);
    return s;
}

function refresh() {
    get("/api/data", function(data) {
        var rawDataContainer = document.getElementById("raw-data-container");
        rawDataContainer.textContent = JSON.stringify(data, null, 2);

        var container = document.getElementById("data-container");
        empty(container);

        for (var prop in data) {
            console.log(prop);
            var header = document.createElement('h2');
            header.textContent = prettyName(prop);
            container.appendChild(header);

            var columnNames = new Set();
            for (var i = 0; i < data[prop].length; i++) {
                for (var colName in data[prop][i]) {
                    columnNames.add(colName);
                }
            }

            var sortedColumnNames = Array.from(columnNames.values());
            sortedColumnNames.sort();

            var table = document.createElement('table');
            table.classList.add('table'); // For Bootstrap
            container.appendChild(table);

            var thead = document.createElement('thead');
            table.appendChild(thead);
            var theadrow = document.createElement('tr');
            thead.appendChild(theadrow);

            for (var c = 0; c < sortedColumnNames.length; c++) {
                var th = document.createElement('th');
                th.textContent = prettyName(sortedColumnNames[c]);
                theadrow.appendChild(th);
            }

            var tbody = document.createElement('tbody');
            table.appendChild(tbody);

            for (var r = 0; r < data[prop].length; r++) {
                var tr = document.createElement('tr');
                tbody.appendChild(tr);
                for (var c = 0; c < sortedColumnNames.length; c++) {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                    if (sortedColumnNames[c] in data[prop][r]) {
                        td.textContent = data[prop][r][sortedColumnNames[c]];
                    }
                }
            }

        }
    });
}

onready(function() {
    linkClick("refresh-link", refresh);
    refresh();
});
