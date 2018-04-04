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
      console.log("[FAILBACK] Error found in log, restarting electrum...");
      stopBackup = true;
      exec(settings.electrumCommand + " stop");
      setTimeout(() => {
        console.log("[FAILBACK] Removing Database....");
        exec("sudo rm -rf " + settings.database);
        setTimeout(() => {
          console.log("[FAILBACK] electrum restarted....");
          exec(settings.electrumCommand + " start");
          stopBackup = false;
          /*
          console.log("[FAILBACK] Restoring.....");
          restore((err) => {
            if (err) {
              console.error("[FAILBACK] ERROR RESTORE: " + err)
            } else {
              console.log("[FAILBACK] Restore successful");
              setTimeout(() => {
                exec(settings.electrumCommand + " start");
                stopBackup = false;
              }, 2000);
            }
          });
          */
        }, 10000);

      }, 10000);
    }


  });

  tail.on("error", function (error) {
    console.error('ERROR: ', error);
  });

  backup();
  setInterval(() => {
    backup();
  }, settings.timeBackupMinute * 1000 * 60)

});


var backup = (callback) => {
  if (!stopBackup) bu.backup(settings.database, settings.databaseBackupDirectory + settings.databaseBackupFile, (err) => {
    if (err) console.error("Backup failed: " + err);
    else console.log("Backup successful");
  });
}

var restore = (callback) => {
  bu.restore(settings.databaseBackupDirectory + settings.databaseBackupFile, settings.database, (err) => callback(err));
}