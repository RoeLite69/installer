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

if (handleSquirrelEvent()) {
  return;
}

function checkFiles() {
  if (!fs.existsSync(ROELITE_DIR)) {
    fs.mkdir(ROELITE_DIR, () => {});
    log.info('Created roelite dir');
  }
}

app.whenReady().then(() => {
  loadChecksums();
  setInterval(() => loadChecksums(), 1_800_000); //every 30 minutes
  log.transports.file.resolvePathFn = () => path.join(os.homedir(), '.roelite', 'logs', 'electron.log');
  checkFiles();
  // Create the browser window.
  titleWindow = new BrowserWindow({
    icon: path.join(__dirname, './img/roelite.ico'),
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    }
  });
  titleWindow.setMenuBarVisibility(false);
  titleWindow.setFullScreenable(false);
  titleWindow.setTitle('RoeLite Launcher');
  titleWindow.setMinimumSize(800, 600);
  titleWindow.loadFile(path.join(__dirname, './title/index.html')).then(r => {
    checkForUpdates(titleWindow).then(r => {
      log.info('Checked for updates.');
      checkJava(titleWindow).then(() => {
        log.info('Checked Java Version.');
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
