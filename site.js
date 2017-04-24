function home(req, res) {
    res.render('home', { activeHome: true });
}

function team(req, res) {
    res.render('team', { activeTeam: true });
}

function log(req, res) {
    res.render('log');
}

function data(req, res) {
    res.render('data', { activeData: true });
}

exports.home = home;
exports.team = team;
exports.log = log;
exports.data = data;
