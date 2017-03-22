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
    var toReturn = {
	'locations': [],
	'heart_rates': [],
	'calories': [],
    }
    requestLocation = new Request("SELECT time,lat,long FROM Locations" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	connection.execSql(requestHeartRate)
    });

    requestHeartRate = new Request("SELECT Time,bpm FROM HeartRates" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	connection.execSql(requestCalories)
    });

    requestCalories = new Request("SELECT time,kcalcount FROM Calories" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	res.send(JSON.stringify(toReturn));
    });
    

    requestLocation.on('row', function (columns) {
	toReturn.locations.push({'time':columns[0].value,'lat':columns[1].value,'long':columns[2].value})
    });

    requestHeartRate.on('row', function (columns) {
	toReturn.heart_rates.push({'time':columns[0].value,'bpm':columns[1].value})
    });

    requestCalories.on('row', function (columns) {
	toReturn.calories.push({'time':columns[0].value,'kcalcount':columns[1].value})
    });

    connection.execSql(requestLocation);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
