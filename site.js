function home(req, res) {
    res.render('home', { activeHome: true });
}

function team(req, res) {
    res.render('team', { title: "Team", activeTeam: true });
}

function log(req, res) {
    res.render('log', { title: "Log" });
}

function data(req, res) {
    res.render('data', { title: "Data", activeData: true });
}

function graphs(req, res) {
    res.render('graphs', { title: "Graphs", activeGraphs: true });
}

exports.home = home;
exports.team = team;
exports.log = log;
exports.data = data;
exports.graphs = graphs;
