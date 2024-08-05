const {checkForUpdates, downloadAndUpdate} = require('./js/updatemanager');
const {handleSquirrelEvent} = require('./js/squirrel');
const log = require('electron-log');
const path = require('path');
const {app, BrowserWindow, ipcMain} = require('electron');
const fs = require('fs');
const os = require('os');
const {loadChecksums} = require('./js/checksums');
const {checkJava} = require('./js/checkJava11');
const {runJar} = require('./js/runJar');
const ROELITE_DIR = path.join(os.homedir(), '.roelite');
let titleWindow = null;

roeliteDir();
if (handleSquirrelEvent()) {
  return;
}

async function createDir(dir, extra) {
  if (!fs.existsSync(dir)) {
    if (extra) {
      await fs.mkdir(path.join(dir, extra), () => {});
      log.info(`Created ${dir}/${extra} dir`);
    } else {
      fs.mkdir(dir, () => {});
      log.info(`Created ${dir} dir`);
    }
  }
}

function roeliteDir() {
  createDir(ROELITE_DIR).then(() => {});
  createDir(ROELITE_DIR, 'logs').then(() => {});
  fs.unlink(path.join(ROELITE_DIR, 'RoeLiteInstaller.exe'), () => {});
}

app.whenReady().then(() => {
  log.transports.file.resolvePathFn = () => path.join(os.homedir(), '.roelite', 'logs', 'electron.log');
  loadChecksums();
  setInterval(() => loadChecksums(), 1_800_000); //every 30 minutes
  // Create the browser window.
  titleWindow = new BrowserWindow({
    icon: path.join(__dirname, './img/roelite.ico'),
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    }
  });
  titleWindow.setFullScreenable(false);
  titleWindow.setMenuBarVisibility(false);
  titleWindow.setFullScreenable(false);
  titleWindow.setMaximizable(false);
  titleWindow.setTitle('RoeLite Launcher');
  titleWindow.setMinimumSize(600, 400);
  titleWindow.setMaximumSize(600, 400);
  titleWindow.loadFile(path.join(__dirname, './title/index.html')).then(r => {
    checkJava(titleWindow).then(() => {
      checkForUpdates(titleWindow).then(r => {
        setInterval(() => {
          checkForUpdates(titleWindow).then(() => {
            log.info('Periodically checked for updates.');
          });
        }, 1_800_000); //every 30 minutes
      });
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('downloadAndUpdate', () => {
  downloadAndUpdate(titleWindow);
});

ipcMain.on('runJar', async (event, filePath) => {
  runJar(filePath);
});
