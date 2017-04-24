var express = require('express');
var handlebars = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var api = require('./api.js');
var site = require('./site.js');

// From now on this file should stay fairly empty
app.use(bodyParser.raw({ inflate:false, type:'*/*' }));

// For all the static resources
app.use(express.static("static/"));

// Handlebars (dynamic page rendering) config
app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Add new dynamic page paths here
app.get('/team', site.team);
app.get('/log', site.log);
app.get('/', site.home);

// Add new API paths here
app.get('/api/log', api.getLog);
app.get('/api/data', api.getData);
app.post('/api/data', api.auth, api.postData);

var port = process.env.PORT || 1337;
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
