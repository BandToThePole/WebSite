var express = require('express');
var app = express();


var Connection = require('tedious').Connection;
// Very important that the password never appears in git
var config = {
  userName: "oxfordCSteam11Y16",
  password: process.env.BTP_PASSWORD,
  server: "bandtothepoledb.database.windows.net",
  options: {
    encrypt: true,
    database: "bandtothepoledb"
  }
};

var log = [];

var connection = new Connection(config);
connection.on('connect', function(err) {
  log.push(`connect: ${JSON.stringify(err, null, "  ")}`);
});
connection.on('errorMessage', function(err) {
  log.push(`errorMessage: ${JSON.stringify(err, null, "  ")}`)
});
connection.on('error', function(err) {
  log.push(`error: ${JSON.stringify(err, null, "  ")}`);
});

var port = process.env.PORT || 1337;
app.get('/', function (req, res) {
  res.send(JSON.stringify(log));
});

var Request = require('tedious').Request;

app.get('/api.json', function (req, res) {
  var toReturn = [];
  request = new Request("select * from sessions", function(err, rowCount) {
    if (err) {
      console.log(err);
    }
    res.send(JSON.stringify(toReturn));
  });

  request.on('row', function (columns) {
    columns.forEach(function (column) {
      toReturn.push(column.value);
    });
  });

  connection.execSql(request);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
