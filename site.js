function home(req, res) {
    res.render('home');
}

function team(req, res) {
    res.render('team');
}

exports.home = home;
exports.team = team;
