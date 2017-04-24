function home(req, res) {
    res.render('home', { activeHome: true });
}

function team(req, res) {
    res.render('team', { activeTeam: true });
}

exports.home = home;
exports.team = team;
