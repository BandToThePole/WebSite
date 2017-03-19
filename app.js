var Connection = require('tedious').Connection;
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

var connection = new Connection(config);
connection.on('connect', function(err) {
  console.log(`connect: ${JSON.stringify(err, null, "  ")}`);
});
connection.on('errorMessage', function(err) {
  console.log(`errorMessage: ${JSON.stringify(err, null, "  ")}`)
});
connection.on('error', function(err) {
  console.log(`error: ${JSON.stringify(err, null, "  ")}`);
});