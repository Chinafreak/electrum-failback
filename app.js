var settings = require("./settings.json");
var mkdirp = require("mkdirp");
var bu = require('backup');
Tail = require('tail').Tail;

var stopBackup = false;

mkdirp(settings.databaseBackupDirectory, (err) => {
  if (err) console.error(err);

  tail = new Tail(settings.log);

  tail.on("line", function (data) {
    if (data.indexOf("Exception in") != 0) {
      stopBackup = true;
      exec(settings.electrumCommand + " stop");
      setTimeout(() => {
        restore((err) => {
          if (err) {
            console.error("ERROR RESTORE: " + err)
          } else {
            setTimeout(() => {
              exec(settings.electrumCommand + " start");
              setTimeout(() => {
                stopBackup = false;
              }, 5000);
            }, 2000);
          }
        });
      }, 10000);
    }


  });

  tail.on("error", function (error) {
    console.error('ERROR: ', error);
  });

  backup();
  setInterval(() => {
    backup();
  }, timeBackupMinute * 1000 * 60)

});


var backup = (callback) => {
  if (!stopBackup) bu.backup(settings.database, settings.databaseBackupDirectory + settings.databaseBackupFile, (err) => {
    if (err) console.error("Backup failed: " + err);
    else console.log("Backup successful");
  });
}

var restore = () => {
  bu.restore(settings.databaseBackupDirectory + settings.databaseBackupFile, settings.database, (err) => callback(err));
}