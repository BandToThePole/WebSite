var util = require('util');
const zlib = require('zlib');
var basicAuth = require('basic-auth');
var db = require('./db.js');
var api = require('./api.js');

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

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

function generateString(Columns,table,user) {
    if (typeof user == 'undefined') {
        return "SELECT " + Columns + " FROM " + table + " WHERE time BETWEEN @start AND @end";
    }
    else {
        return "SELECT " + Columns + " FROM " + table + " INNER JOIN Sessions ON " + table + ".Session = Sessions.SessionID WHERE time BETWEEN @start AND @end AND USERNAME=@user";
    }
}

function getData(req, res) {
    var toReturn = {
        'locations': [],
        'heart_rates': [],
        'calories': [],
        'distances': []
    }

    var startDate = getQuery(req.query.start, '0001-01-01T00:00:00.000Z');
    var endDate = getQuery(req.query.end, '9999-12-31T23:59:59.999Z');

    //console.log(startDate);
    //console.log(endDate);
    //console.log(req.query.user);

    //console.log(generateString("Time,Lat,Long", "Locations",req.query.user));

    db.pool.acquire(function(err,connection) {
        if (err) {
            //log.push(err);
            res.sendStatus(500);
            return
        }

        requestLocation = new Request(generateString("Time,Lat,Long", "Locations",req.query.user), function(err, rowCount) {
            if (err) {
                // TODO: Better error handling
                //log.push(err);
            }
            connection.execSql(requestHeartRate);
        });

        requestHeartRate = new Request(generateString("Time,bpm","HeartRates",req.query.user) , function(err, rowCount) {
            if (err) {
                // TODO: Better error handling
                //log.push(err);
            }
            connection.execSql(requestCalories);
        });

        requestCalories = new Request(generateString("Time,kcalcount","Calories",req.query.user) , function(err, rowCount) {
            if (err) {
                // TODO: Better error handling
                //log.push(err);
            }
            connection.execSql(requestDistances);
        });

        requestDistances = new Request(generateString("Time, distance, speed, pace, motion","Distances",req.query.user), function(err, rowCount) {
            if (err) {
                // TODO: Better error handling
                //log.push(err);
            }
            else {
                connection.release();
                res.send(toReturn);
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

        if(typeof req.query.user != 'undefined') {
            requestLocation.addParameter('user', TYPES.VarChar, req.query.user);
            requestHeartRate.addParameter('user', TYPES.VarChar, req.query.user);
            requestCalories.addParameter('user', TYPES.VarChar, req.query.user);
            requestDistances.addParameter('user', TYPES.VarChar, req.query.user);
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

        connection.execSql(requestLocation);
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
        //usernames and passwords are case sensitive
        requestAuth = new Request("SELECT * FROM Users WHERE USERNAME = @name AND PASSWORD = @pass", function(err,rowcount) {
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
                // log.push(err);
            }
            else {
                console.log(sqlQuery);
                writeRequest = new Request(sqlQuery, function(err,rowCount) {
                    if (err) {
                        console.log(err);
                        res.sendStatus(500);
                    }
                    else {
                        res.sendStatus(202);
                    }
                    connection.release();
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
                sqlQuery += util.format("IF NOT EXISTS(SELECT * FROM Sessions WHERE SessionGUID = '%s')\nBEGIN\n", session.guid);
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

exports.auth = auth;
exports.getLog = getLog;
exports.getData = getData;
exports.postData = postData;
