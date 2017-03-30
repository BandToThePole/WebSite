var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var util = require('util');
const zlib = require('zlib');

const MILLISEC_IN_SEC = 1000;
    
app.use(bodyParser.raw({inflate:false,type:'*/*'}));


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
    log.push(`connect: ` + (new Date).toISOString());
});
connection.on('errorMessage', function(err) {
    log.push(`errorMessage: ` + JSON.stringify(err) + ' ' + (new Date).toISOString());
});
connection.on('error', function(err) {
    log.push('error: ' + JSON.stringify(err) + ' ' + (new Data).toISOString());
});

var port = process.env.PORT || 1337;
app.get('/', function (req, res) {
  res.send(JSON.stringify(log));
});

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

function getQuery(query,defvalue){
    if (typeof query == 'undefined'){
	return defvalue
    }
    else {
	return query
    }
};

app.get('/api.json', function (req, res) {
    var toReturn = {
	'locations': [],
	'heart_rates': [],
	'calories': [],
    }

    console.log(req.query.start)
    
    var startDate = getQuery(req.query.start,'0001-01-01T00:00:00.000Z');
    var endDate = getQuery(req.query.end,'9999-12-31T23:59:59.999Z');

    console.log(startDate)
    console.log(endDate)
    
    requestLocation = new Request("SELECT time,lat,long FROM Locations WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	connection.execSql(requestHeartRate)
    });

    requestHeartRate = new Request("SELECT Time,bpm FROM HeartRates WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	connection.execSql(requestCalories)
    });

    requestCalories = new Request("SELECT time,kcalcount FROM Calories WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	if (err) {
	    console.log(err);
	}
	res.send(JSON.stringify(toReturn));
    });

    requestLocation.addParameter('start', TYPES.DateTime2, startDate);
    requestLocation.addParameter('end', TYPES.DateTime2, endDate);
    requestHeartRate.addParameter('start', TYPES.DateTime2, startDate);
    requestHeartRate.addParameter('end', TYPES.DateTime2, endDate);
    requestCalories.addParameter('start', TYPES.DateTime2, startDate);
    requestCalories.addParameter('end', TYPES.DateTime2, endDate);
    
    

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

app.post('/post', function(req,res) {
    var sqlQuery = "" //sqlQuery to be built
    var body = JSON.parse(zlib.inflateRawSync(req.body).toString());
    console.log(body)
    request = new Request("SELECT COALESCE(MAX(sessionid),0) from Sessions", function(err,rowCount) {
	if(err) {
	    console.log(err);
	}
	else {
	    console.log(sqlQuery)
	    writeRequest = new Request(sqlQuery, function(err,rowCount){
		if(err) {
		    console.log(err);
		}
		res.send("Data written");
	    });
	    connection.execSql(writeRequest);
	}
    }); //Get current maximum sessionid or 0 if there are no sessions

    request.on('row', function(columns) {
	var nextSessionID = columns[0].value
	body.recording_sessions.forEach(function(session){
	    console.log(session);
	    nextSessionID += 1; //increment value to get new unique value
	    var sqlQueryTemp = "" //improve slicing efficiency
	    sqlQuery += util.format("INSERT INTO Sessions VALUES (%d,'%s','%s','%s');\n",nextSessionID,session.start,session.end,"!!What Goes Here!!");
	    var startDate = new Date(session.start);

	    //add locations if present
	    if (session.locations.length > 0){
		sqlQueryTemp = "INSERT INTO Locations VALUES " //LocationID is automatically filled
		session.locations.forEach(function(location){
		    var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*location.dt)).toISOString();
		    sqlQueryTemp += util.format("(%d, %d, %d, '%s'),",nextSessionID,location.lat,location.long,time);
		});
		sqlQuery += sqlQueryTemp.slice(0,-1); //remove last comma
		sqlQuery += ";\n"
	    }

	    //add HeartRates
	    if (session.heart_rate.length > 0){
		sqlQueryTemp = "INSERT INTO HeartRates VALUES " //HeartRateID is automatically filled
		session.heart_rate.forEach(function(heart){
		    var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*heart.dt)).toISOString();
		    sqlQueryTemp += util.format("(%d,%d,'%s'),",nextSessionID,heart.bpm,time);
		});
		sqlQuery += sqlQueryTemp.slice(0,-1);
		sqlQuery += ";\n"
	    }

	    //add Calories
	    if (session.calories.length > 0) {
		sqlQueryTemp = "INSERT INTO Calories VALUES " //CalorieID is automatically filled
		session.calories.forEach(function(calorie){
		    var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*calorie.dt)).toISOString();
		    sqlQueryTemp += util.format("(%d,%d,'%s'),",nextSessionID,calorie.total_calories_since_start,time);
		});
		sqlQuery += sqlQueryTemp.slice(0,-1);
		sqlQuery += ";\n"
	    }

	    //add Distances
	    if (session.distances.length > 0) {
		sqlQueryTemp = "INSERT INTO Distances VALUES " //DistanceID is automatically filled
		session.distances.forEach(function(distance){
		    var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*distance.dt)).toISOString();
		    sqlQueryTemp += util.format("(%d,%d,%d,%d,'%s','%s'),",nextSessionID,distance.distance,distance.speed,distance.pace,distance.motion,time);
		});
		sqlQuery += sqlQueryTemp.slice(0,-1);
		sqlQuery += ";\n"
	    }		
	}); 
    });

    connection.execSql(request);
});



app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
