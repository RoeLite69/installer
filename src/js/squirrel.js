const electron = require('electron');
const app = electron.app;
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');
// Define paths related to the app and its updates
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
  if (process.platform === 'win32') {
    let cmd = process.argv[1];
    let target = path.basename(process.execPath);
    const quit = () => setTimeout(electron.app.quit, 1000);
    if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
      executeUpdate(['--createShortcut', target, '--shortcut-locations', 'Desktop,StartMenu']);
      quit();
      return true;
    }
    if (cmd === '--squirrel-uninstall') {
      executeUpdate(['--removeShortcut', target, '--shortcut-locations', 'Desktop,StartMenu']);
      removeDirectories([startMenuShortcut, localDataDir, roamingDataDir, roeliteDir, osrsCM]);
      quit();
      return true;
    }
    if (cmd === '--squirrel-obsolete') {
      quit();
      return true;
    }
  }
  return false;
}

module.exports = {handleSquirrelEvent};
