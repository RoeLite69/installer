const electron = require('electron');
const app = electron.app;
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');
// Define paths related to the app and its updates
const appExecutablePath = path.basename(process.execPath);
const updateExecutable = path.resolve(path.join(path.dirname(process.execPath), '..', 'Update.exe'));

// Define paths for RoeLite data directories
const userHome = os.homedir();
const appDataPath = path.join(userHome, 'AppData');
const localDataDir = path.join(appDataPath, 'Local', 'RoeLite');
const roamingDataDir = path.join(appDataPath, 'Roaming', 'RoeLite');
const startMenuShortcut = path.join('C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\RoeLite');
const roeliteDir = path.join(userHome, '.roelite');
const osrsCM = path.join(userHome, '.runelite', 'repository2', 'old');

function executeUpdate(args) {
  try {
    childProcess.spawn(updateExecutable, args, {detached: true});
  } catch (error) {
    console.error('Failed to spawn process:', error);
  }
}

function removeDirectories(directories) {
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmdirSync(dir, {recursive: true});
    }
  });
}

function handleSquirrelEvent() {
  if (process.argv.length === 1 || os.platform() === 'darwin') {
    return false;
  }
  const squirrelEvent = process.argv[1];
  const isSquirrelEvent = squirrelEvent.startsWith('--squirrel');
  if (!isSquirrelEvent) return false;
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      executeUpdate(['--createShortcut', appExecutablePath, '--shortcut-locations', 'Desktop,StartMenu']);
      break;
    case '--squirrel-uninstall':
      executeUpdate(['--removeShortcut', appExecutablePath, '--shortcut-locations', 'Desktop,StartMenu']);
      removeDirectories([startMenuShortcut, localDataDir, roamingDataDir, roeliteDir, osrsCM]);
      break;
    case '--squirrel-obsolete':
      break;
  }
  setTimeout(app.quit, 1000);
  return true;
}

module.exports = {handleSquirrelEvent};
