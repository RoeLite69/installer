const electron = require('electron');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');
const { exec } = require('child_process');
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

function findAndEjectDMG(appName) {
  exec('hdiutil info', (error, stdout) => {
    if (error) {
      console.error('Failed to get hdiutil info:', error);
      return;
    }
    const lines = stdout.split('\n');
    const pattern = new RegExp(`/Volumes/${appName}`);
    for (let line of lines) {
      if (pattern.test(line)) {
        const match = line.match(/(\/Volumes\/[^ ]+)/);
        if (match) {
          ejectDMG(match[1]);
          break;
        }
      }
    }
  });
}

function ejectDMG(volumePath) {
  exec(`hdiutil detach "${volumePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error ejecting DMG:', stderr);
      return;
    }
    console.log('DMG ejected successfully:', stdout);
  });
}

function handleSquirrelEvent() {
  if (os.platform() === 'win32') {
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
  } else if (os.platform() === 'darwin') {
    findAndEjectDMG('RoeLite');
  }
  return false;
}

module.exports = {handleSquirrelEvent};
