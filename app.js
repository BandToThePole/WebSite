var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var util = require('util');
const zlib = require('zlib');
var basicAuth = require('basic-auth');
var ConnectionPool = require('tedious-connection-pool');

const MILLISEC_IN_SEC = 1000;


var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

app.use(bodyParser.raw({inflate:false,type:'*/*'}));

var log = [];

var poolConfig = {
    min: 2,
    log: function(message){log.push(message)}
};

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

var pool = new ConnectionPool(poolConfig,config);

pool.on('error',function(err){
    log.push(err);
});

var port = process.env.PORT || 1337;
app.get('/', function (req, res) {
  res.send(JSON.stringify(log));
});


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
	'distances': [],
    }

    console.log(req.query.start)

    var startDate = getQuery(req.query.start,'0001-01-01T00:00:00.000Z');
    var endDate = getQuery(req.query.end,'9999-12-31T23:59:59.999Z');

    console.log(startDate)
    console.log(endDate)

    pool.acquire(function(err,connection){
	if(err){
	    log.push(err);
	    res.sendStatus(500);
	}

	requestLocation = new Request("SELECT time,lat,long FROM Locations WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	    if (err) {
		log.push(err);
	    }
	    connection.execSql(requestHeartRate);
	});

	requestHeartRate = new Request("SELECT Time,bpm FROM HeartRates WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	    if (err) {
		log.push(err);
	    }
	    connection.execSql(requestCalories);
	});

	requestCalories = new Request("SELECT time,kcalcount FROM Calories WHERE time BETWEEN @start AND @end" , function(err, rowCount) {
	    if (err) {
		log.push(err);
	    }
	    connection.execSql(requestDistances);
	});

	requestDistances = new Request("SELECT time, distance, speed, pace, motion FROM Distances WHERE time BETWEEN @start AND @end", function(err, rowCount) {
	    if (err) {
		log.push(err);
	    }
	    connection.release();
	    res.send(JSON.stringify(toReturn));
	});


	requestLocation.addParameter('start', TYPES.DateTime2, startDate);
	requestLocation.addParameter('end', TYPES.DateTime2, endDate);
	requestHeartRate.addParameter('start', TYPES.DateTime2, startDate);
	requestHeartRate.addParameter('end', TYPES.DateTime2, endDate);
	requestCalories.addParameter('start', TYPES.DateTime2, startDate);
	requestCalories.addParameter('end', TYPES.DateTime2, endDate);
	requestDistances.addParameter('start', TYPES.DateTime2, startDate);
	requestDistances.addParameter('end', TYPES.DateTime2, endDate);



	requestLocation.on('row', function (columns) {
	    toReturn.locations.push({'time':columns[0].value,'lat':columns[1].value,'long':columns[2].value})
	});

	requestHeartRate.on('row', function (columns) {
	    toReturn.heart_rates.push({'time':columns[0].value,'bpm':columns[1].value})
	});

	requestCalories.on('row', function (columns) {
	    toReturn.calories.push({'time':columns[0].value,'kcalcount':columns[1].value})
	});

	requestDistances.on('row', function (columns) {
	    toReturn.distances.push({'time':columns[0].value, 'distance' : columns[1].value, 'speed' : columns[2].value, 'pace' : columns[3].value, 'motion' : columns[4].value})
	});

	connection.execSql(requestLocation);
    });
});

//Authenticator function
var auth = function(req,res,next){
    function unauthorized(res) {
	res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
	return res.sendStatus(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
	return unauthorized(res);
    };

    pool.acquire(function(err,connection){
	if(err){
	    log.push(err);
	    res.sendStatus(500);
	}
	//usernames and passwords are case sensitive
	requestAuth = new Request("SELECT * FROM Users WHERE USERNAME = @name AND PASSWORD = @pass",function(err,rowcount){
	    connection.release();
	    if (!err && rowcount == 1) {
		// pass username forward
		req.userid = user.name;
		return next();
	    } else {
		return unauthorized(res);
	    }
	});

	requestAuth.addParameter('name',TYPES.VarChar,user.name);
	requestAuth.addParameter('pass',TYPES.VarChar,user.pass);

	connection.execSql(requestAuth);
    });
};

app.post('/post', auth, function(req,res) {
    var sqlQuery = "" //sqlQuery to be built
    var body = JSON.parse(zlib.inflateRawSync(req.body).toString());

    pool.acquire(function(err,connection){
	if(err) {
	    log.push(err);
	    res.sendStatus(500);
	}

	request = new Request("SELECT COALESCE(MAX(sessionid),0) from Sessions", function(err,rowCount) {
	    if(err) {
		log.push(err);
	    }
	    else {
		console.log(sqlQuery)
		writeRequest = new Request(sqlQuery, function(err,rowCount){
		    if(err) {
			log.push(err);
		    }
		    connection.release();
		    res.send("Data written\n");
		});
		writeRequest.addParameter('name',TYPES.VarChar, req.userid);
		connection.execSql(writeRequest);
	    }
	}); //Get current maximum sessionid or 0 if there are no sessions

	request.on('row', function(columns) {
	    var nextSessionID = columns[0].value
	    body.recording_sessions.forEach(function(session){
      console.log(`Session ${nextSessionID + 1}: `);
		console.log(session);
		nextSessionID += 1; //increment value to get new unique value
		var sqlQueryTemp = "" //improve slicing efficiency
		sqlQuery += util.format("INSERT INTO Sessions VALUES (%d,'%s','%s','%s',@name);\n",nextSessionID,session.start,session.end,"!!What Goes Here!!");
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
});



app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
