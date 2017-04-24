var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var api = require('./api.js');

// From now on this file should stay fairly empty

app.use(bodyParser.raw({ inflate:false, type:'*/*' }));

// Add new API paths here
app.get('/api/log', api.getLog);
app.get('/api/data', api.getData);
app.post('/api/data', api.auth, api.postData);

// For all the static resources
app.use(express.static("static/"));

var port = process.env.PORT || 1337;
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
