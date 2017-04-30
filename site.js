function home(req, res) {
    res.render('home', { activeHome: true });
}

function team(req, res) {
    res.render('team', { title: "Team", activeTeam: true });
}

function data(req, res) {
    res.render('data', { title: "Data", activeData: true });
}

function graphs(req, res) {
    res.render('graphs', { title: "Graphs", activeGraphs: true });
}

function twitter(req, res) {
    res.render('twitter', { title: "Twitter", activeTwitter: true });
}

function antarctica(req, res) {
    res.render('antarctica', { title: "Antarctica Map", activeMap: true});
}
exports.home = home;
exports.team = team;
exports.twitter = twitter;
exports.data = data;
exports.graphs = graphs;
exports.antarctica = antarctica;
