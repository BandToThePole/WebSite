function home(req, res) {
    res.render('home', { activeHome: true });
}

function team(req, res) {
    res.render('team', { activeTeam: true });
}

function log(req, res) {
    res.render('log');
}

exports.home = home;
exports.team = team;
exports.log = log;
