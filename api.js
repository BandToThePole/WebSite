var util = require('util');
const zlib = require('zlib');
var basicAuth = require('basic-auth');
var uuid = require('uuid/v4');
var crypto = require('crypto');
var fs = require('fs');
var PImage = require('pureimage');
var db = require('./db.js');
var api = require('./api.js');

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;


//Generate map on program creation
console.log("Generating Map");
data(undefined,undefined,'AntarcticDemo',function(err,data) {
    if (err) console.log(err);
    else{
	console.log("Got Data");
	generateMap(data);
    }
});

function getLog(req, res) {
    res.send(db.getLog());
}

function getQuery(query,defvalue) {
    if (typeof query == 'undefined') {
        return defvalue;
    }
    else {
        return query
    }
}

function makeUUID(session) {
    if (typeof session.guid == 'undefined') {
	session.guid = uuid()
	return true;
    }
    return false;
}

function generateString(Columns,table,user) {
    if (typeof user == 'undefined') {
        return "SELECT " + Columns + " FROM " + table + " WHERE time BETWEEN @start AND @end";
    }
    else {
        return "SELECT " + Columns + " FROM " + table + " INNER JOIN Sessions ON " + table + ".Session = Sessions.SessionID WHERE time BETWEEN @start AND @end AND USERNAME=@user";
    }
}

function generateDailyString(Columns,table,user) {
    if (typeof user == 'undefined') {
        return "SELECT " + Columns + " FROM " + table;
    }
    else {
        return "SELECT " + Columns + " FROM " + table + " WHERE USERNAME=@user";
    }
}

function data(start,end,user,next){
    var toReturn = {
        'locations': [],
        'heart_rates': [],
        'calories': [],
        'distances': [],
	'daily_calories': [],
	'daily_distances': []
    }
    var startDate = getQuery(start, '0001-01-01T00:00:00.000Z');
    var endDate = getQuery(end, '9999-12-31T23:59:59.999Z');
    
    db.pool.acquire(function(err,connection) {
        if (err) {
            next(err,null);
            return
        }

        requestLocation = new Request(generateString("Time,Lat,Long", "Locations",user), function(err, rowCount) {
            if (err) {
                next(err,null);
            }
            connection.execSql(requestHeartRate);
        });

        requestHeartRate = new Request(generateString("Time,bpm","HeartRates",user) , function(err, rowCount) {
            if (err) {
                next(err,null);
            }
            connection.execSql(requestCalories);
        });

        requestCalories = new Request(generateString("Time,kcalcount","Calories",user) , function(err, rowCount) {
            if (err) {
                next(err,null);
            }
            connection.execSql(requestDistances);
        });

        requestDistances = new Request(generateString("Time, distance, speed, pace, motion","Distances",user), function(err, rowCount) {
            if (err) {
                next(err,null);
            }
            connection.execSql(requestDailyCalories);
        });

	requestDailyCalories = new Request(generateDailyString("Date,kcal", "DailyCalories",user) , function(err, rowCount) {
	    if (err) {
		next(err,null);
	    }
	    connection.execSql(requestDailyDistances);
	});

	requestDailyDistances = new Request(generateDailyString("Date,Distance", "DailyDistances", user), function(err, rowCount) {
	    connection.release();
	    if (err) {
		next(err,null);
	    }
	    else {
		next(null,toReturn);
	    }
	});
	    
	

        requestLocation.addParameter('start', TYPES.DateTime2, startDate);
        requestLocation.addParameter('end', TYPES.DateTime2, endDate);

        requestHeartRate.addParameter('start', TYPES.DateTime2, startDate);
        requestHeartRate.addParameter('end', TYPES.DateTime2, endDate);

        requestCalories.addParameter('start', TYPES.DateTime2, startDate);
        requestCalories.addParameter('end', TYPES.DateTime2, endDate);

        requestDistances.addParameter('start', TYPES.DateTime2, startDate);
        requestDistances.addParameter('end', TYPES.DateTime2, endDate);

        if(typeof user != 'undefined') {
            requestLocation.addParameter('user', TYPES.VarChar, user);
            requestHeartRate.addParameter('user', TYPES.VarChar, user);
            requestCalories.addParameter('user', TYPES.VarChar, user);
            requestDistances.addParameter('user', TYPES.VarChar, user);
	    requestDailyCalories.addParameter('user', TYPES.VarChar, user);
            requestDailyDistances.addParameter('user', TYPES.VarChar, user);
        }

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

	requestDailyCalories.on('row', function (columns) {
            toReturn.daily_calories.push({'date':columns[0].value,'kcalcount':columns[1].value})
        });

        requestDailyDistances.on('row', function (columns) {
            toReturn.daily_distances.push({'date':columns[0].value, 'distance' : columns[1].value})
        });

        connection.execSql(requestLocation);
    });
}

function getData(req, res) {
    data(req.query.start,req.query.end,req.query.user,function(err,ret){
	if(err){
	    console.log(err);
	    res.sendStatus(500);
	}
	else {
	    res.send(ret);
	}
    });   
}

//Authenticator function
function auth(req,res,next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }

    db.pool.acquire(function(err,connection) {
        if (err) {
            //log.push(err);
            res.sendStatus(500);
        }

	var hash = ""
	var salt = ""
	
        //usernames and passwords are case sensitive
        requestAuth = new Request("SELECT * FROM Users WHERE USERNAME = @name", function(err,rowcount) {
            connection.release();
            if (!err && rowcount == 1) {
		//authentificate
		crypto.pbkdf2(user.pass, salt, 100000, 256, 'sha256',function(err,key){
		    if (err){
			console.log(err);
		    }
		    else if(hash == key.toString('hex')){
			// pass username forward
			req.userid = user.name;
			return next();
		    }
		    else {
			return unauthorized(res);
		    }
		});
			    
            } else {
                return unauthorized(res);
            }
        });

	requestAuth.addParameter('name',TYPES.VarChar,user.name);

	requestAuth.on('row',function(column){
	    hash = column[2].value;
	    salt = column[3].value;
	});       

        connection.execSql(requestAuth);
    });
}

function generateMap(data) {
    var canvas = PImage.make(1000,1000);

    var context = canvas.getContext("2d");

    fs.readFile('static/images/south_pole.jpg', function(err, back){
	if (err) throw err;
	img = PImage.decodeJPEG(back);
	context.drawImage(img, 0, 0,1000,1000,0,0,1000,1000);
	PImage.decodePNG(fs.createReadStream('static/images/pin.png'), function(pinimg){
	    var pinlocations = []
	    var pincoordinates = []
	    data.locations.forEach(function(location) {
		//filter out locations above equator
		if(location.lat < 0){
		    pinlocations.push(location);
		}
	    });
	    var distance = 0;
	    for (var i = 0; i < pinlocations.length; i++) {
		distance = Math.sin((90 + pinlocations[i].lat)/180 * Math.PI) * 1114.10909837;
		coord = { x: Math.round(500 + Math.sin(pinlocations[i].long /180 * Math.PI) * distance),
			  y: Math.round(500 - Math.cos(pinlocations[i].long /180 * Math.PI) * distance)};
		if(0 <= x && x <= 1000 && 0 <= y && y <= 1000){//Only use points that fit on the map
		    pincoordinates.push(coord);
	    }
	    for (var i = 0; i < pincoordinates.length; i++) {
		if (i > 0) {
		    context.beginPath();
		    context.moveTo(pincoordinates[i - 1].x, pincoordinates[i - 1].y);
		    context.lineTo(pincoordinates[i].x, pincoordinates[i].y);
		    context.strokeStyle = "red";
		    context.stroke();
		}
		context.drawImage2(pinimg, 0,0,pinimg.width,pinimg.height, pincoordinates[i].x -10, pincoordinates[i].y - 20,pincoordinates[i].x + 10, pincoordinates[i].y);
	    }
	    PImage.encodePNG(canvas,fs.createWriteStream('static/images/south_pole_points.png'), (err) => { if(err) console.log(err)});
	});
    });
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

    var uniqueDatesSorted = Array.from(uniqueDates.values()).sort();
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

function resetDailyTables(user,next) {
    data(undefined,undefined,user,function(err,ret){
	if(err){
	    next(err);
	}
	else {
	    dates = []; values = []
	    ret.calories.forEach(function(datum) {
		dates.push(new Date(datum.time));
		values.push(datum.kcalcount);
	    });
	    console.log(dates);
	    var dailyCalories = totalPerDay(dates,values);
	    
	    dates = []; values = []
	    ret.distances.forEach(function(datum) {
		dates.push(new Date(datum.time));
		values.push(datum.distance);
	    });
	    var dailyDistances = totalPerDay(dates,values);
	    
	    var sqlQuery = "DELETE FROM DailyCalories WHERE USERNAME = @user;\n";
	    if(dailyCalories.length > 0){
		sqlQuery += "INSERT INTO DailyCalories VALUES ";
		for (var i = 0; i < dailyCalories.length; i++){
		    sqlQuery += util.format("(%d,'%s',%d, '%s')",i,dailyCalories[i].date.toISOString(),dailyCalories[i].value,user);
		    if(i == dailyCalories.length - 1){
			sqlQuery += ";\n";
		    }
		    else {
			sqlQuery += ", ";
		    }
		}
	    }
	    sqlQuery += "DELETE FROM DailyDistances WHERE USERNAME = @user;\n";
	    if(dailyDistances.length > 0){
	    sqlQuery += "INSERT INTO DailyDistances VALUES ";
		for (var i = 0; i < dailyDistances.length; i++){
		    sqlQuery += util.format("(%d,'%s',%d, '%s')",i,dailyDistances[i].date.toISOString(),dailyDistances[i].value,user);
		    if(i == dailyDistances.length - 1){
			sqlQuery += ";\n";
		    }
		    else {
			sqlQuery += ", ";
		    }
		}
	    }
	    console.log(sqlQuery);
	    db.pool.acquire(function(err,connection) {
		if (err) {
		    next(err);
		}
		else{
		    request = new Request(sqlQuery,function(err, rowCount) {
			connection.release();
			next(err);
		    });

		    request.addParameter('user',TYPES.VarChar, user);

		    connection.execSql(request);
		}
	    });
	    if(user == "AntarcticDemo"){
		generateMap(ret);
	    }
	    
	}
    });
}	    

function postData(req, res) {
    const dateCutoff = new Date('2017-01-01T00:00:00');

    var sqlQuery = ""; //sqlQuery to be built
    var body = JSON.parse(zlib.inflateRawSync(req.body).toString());

    db.pool.acquire(function(err,connection) {
        if (err) {
            //log.push(err);
            res.sendStatus(500);
        }

        request = new Request("SELECT COALESCE(MAX(sessionid),0) from Sessions", function(err, rowCount) {
            if (err) {
                res.sendStatus(500);
            }
            else {
                writeRequest = new Request(sqlQuery, function(err,rowCount) {
		    connection.release();
		    if (err) {
                        console.log(err);
                        res.sendStatus(500);
                    }
                    else {
			resetDailyTables(req.userid,function(err){
			    if(err){
				console.log(err);
				res.sendStatus(500);
			    }
			    else{
				res.sendStatus(202);
			    }
			});
                    }
                });
                writeRequest.addParameter('name',TYPES.VarChar, req.userid);
                connection.execSql(writeRequest);
            }
        }); //Get current maximum sessionid or 0 if there are no sessions

        request.on('row', function(columns) {
            var nextSessionID = columns[0].value;
            body.recording_sessions.forEach(function(session) {

		
                //console.log(`Session ${nextSessionID + 1}: `);
                //console.log(session);

                var startDate = new Date(session.start);
                if(dateCutoff > startDate){//ignore session as it is too early
                    return true; //Acts as continue in forEach
                }

                nextSessionID += 1; //increment value to get new unique value
                var sqlQueryTemp = ""; //improve slicing efficiency

		if(makeUUID(session)){// If a new UUID was made do duplicate elimination based off starttime
		    sqlQuery += util.format("IF NOT EXISTS(SELECT * FROM Sessions WHERE StartTime = '%s')\nBEGIN\n", session.start);
		}
		else { // otherwise use UUID
                    sqlQuery += util.format("IF NOT EXISTS(SELECT * FROM Sessions WHERE SessionGUID = '%s')\nBEGIN\n", session.guid);
		}
		
                sqlQuery += util.format("INSERT INTO Sessions VALUES (%d,'%s','%s','%s',@name);\n",nextSessionID,session.start,session.end,session.guid);

                const MILLISEC_IN_SEC = 1000;

                //add locations if present
                if (session.locations.length > 0){
                    sqlQueryTemp += "INSERT INTO Locations VALUES "; //LocationID is automatically filled
                    session.locations.forEach(function(location){
                        var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*location.dt)).toISOString();
                        sqlQueryTemp += util.format("(%d, %d, %d, '%s'),",nextSessionID,location.lat,location.long,time);
                    });
                    sqlQuery += sqlQueryTemp.slice(0,-1); //remove last comma
                    sqlQueryTemp = "";
                    sqlQuery += ";\n"
                }

                //add HeartRates
                if (session.heart_rate.length > 0){
                    sqlQueryTemp += "INSERT INTO HeartRates VALUES "; //HeartRateID is automatically filled
                    session.heart_rate.forEach(function(heart){
                        var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*heart.dt)).toISOString();
                        sqlQueryTemp += util.format("(%d,%d,'%s'),",nextSessionID,heart.bpm,time);
                    });
                    sqlQuery += sqlQueryTemp.slice(0,-1);
                    sqlQueryTemp = "";
                    sqlQuery += ";\n"
                }

                //add Calories
                if (session.calories.length > 0) {
                    sqlQueryTemp += "INSERT INTO Calories VALUES "; //CalorieID is automatically filled
                    session.calories.forEach(function(calorie){
                        var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*calorie.dt)).toISOString();
                        sqlQueryTemp += util.format("(%d,%d,'%s'),",nextSessionID,calorie.total_calories_since_start,time);
                    });
                    sqlQuery += sqlQueryTemp.slice(0,-1);
                    sqlQueryTemp = "";
                    sqlQuery += ";\n"
                }

                //add Distances
                if (session.distances.length > 0) {
                    sqlQueryTemp += "INSERT INTO Distances VALUES "; //DistanceID is automatically filled
                    session.distances.forEach(function(distance){
                        var time = (new Date(startDate.getTime() + MILLISEC_IN_SEC*distance.dt)).toISOString();
                        sqlQueryTemp += util.format("(%d,%d,%d,%d,'%s','%s'),",nextSessionID,distance.distance,distance.speed,distance.pace,distance.motion,time);
                    });
                    sqlQuery += sqlQueryTemp.slice(0,-1);
                    sqlQueryTemp = "";
                    sqlQuery += ";\n"
                }
                sqlQuery += "END\n"
            });
        });

        connection.execSql(request);
    });
}

// This call will be prefixed by an auth call, so we just need to send 200
function check(req, res) {
    res.sendStatus(200);
}

exports.auth = auth;
exports.check = check;
exports.getLog = getLog;
exports.getData = getData;
exports.postData = postData;
