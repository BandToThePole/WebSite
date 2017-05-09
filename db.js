var ConnectionPool = require('tedious-connection-pool');

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

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

function getLog() {
    return log;
}

function pushLog(x) {
    log.push(x);
}

exports.getLog = getLog;
exports.pool = pool;
exports.pushLog = pushLog;
