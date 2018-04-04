var settings = require("./settings.json");
var mkdirp = require("mkdirp");
var bu = require('backup');
Tail = require('tail').Tail;
const {
  exec
} = require('child_process');

var stopBackup = false;

mkdirp(settings.databaseBackupDirectory, (err) => {
  if (err) console.error(err);

  tail = new Tail(settings.log);

  tail.on("line", function (data) {
    console.log("LOG: " + data);
    if (data.indexOf("Exception in") >= 0 && !stopBackup) {
      console.log("Error found in log, restarting electrum...");
      stopBackup = true;
      exec(settings.electrumCommand + " stop");
      setTimeout(() => {
        exec("rm -rf " + settings.electrumDatabase);
        setTimeout(() => {
          exec(settings.electrumCommand + " start");
          stopBackup = false;
        }, 2000);
      }, 15000);
    }


  });

  tail.on("error", function (error) {
    console.error('ERROR: ', error);
  });

});