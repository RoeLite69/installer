const log = require('electron-log');
const {net} = require('electron');
const {exec} = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ROELITE_DIR = path.join(os.homedir(), '.roelite');
const tar = require('tar');
const extract = require('extract-zip');

const JRE_FILE_NAME =
  os.platform() === 'win32'
    ? 'OpenJDK11U-jre_x64_windows_hotspot_11.0.22_7.zip'
    : 'OpenJDK11U-jre_x64_mac_hotspot_11.0.22_7.tar.gz';
const ZIP_PATH =
  os.platform() === 'win32' ? path.join(ROELITE_DIR, 'openjdk-11.zip') : path.join(ROELITE_DIR, 'openjdk-11.tar.gz');
const JRE_DL_URL = `https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.22%2B7/${JRE_FILE_NAME}`;
const JRE_PATH = path.join(ROELITE_DIR, 'jdk-11.0.22+7-jre');
let JAVA_PATH =
  os.platform() === 'win32'
    ? path.join(JRE_PATH, 'bin', 'java.exe')
    : path.join(JRE_PATH, 'Contents', 'Home', 'bin', 'java');

async function checkJava(mainWindow) {
  fs.unlink(ZIP_PATH, () => {});
  if (fs.existsSync(path.join(ROELITE_DIR, 'jre'))) {
    fs.rmdirSync(path.join(ROELITE_DIR, 'jre'), {recursive: true});
  }
  checkJavaVersion(jdk => {
    if (jdk) {
      mainWindow.webContents.send('versionInfo', {jdk});
    } else {
      mainWindow.webContents.send('versionInfo', {jdk: `Downloading (0%)...`});
      installJava11(mainWindow).then(() => {
        // After installation, recheck the Java version
        checkJavaVersion(jdk => {
          if (jdk) {
            mainWindow.webContents.send('versionInfo', {jdk});
          } else {
            mainWindow.webContents.send('versionInfo', {jdk: 'ERROR!'});
          }
        });
      });
    }
  });
}

// Helper function to check Java version
function checkJavaVersion(callback) {
  exec(`"${JAVA_PATH}" -version`, (error, stdout, stderr) => {
    if (error) {
      console.error('Java check failed:', stderr);
      try {
        fs.rmdir(JRE_PATH, {recursive: true}, () => {});
      } catch (err) {}
      callback(null);
      return;
    }
    const versionMatch = stderr.match(/version "(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : null;
    log.info('JRE: ' + version);
    callback(version);
  });
}

// Function to download and install Java 11
async function installJava11(mainWindow) {
  const request = net.request(JRE_DL_URL);
  return new Promise((resolve, reject) => {
    request.on('response', response => {
      const writeStream = fs.createWriteStream(ZIP_PATH);
      let downloadedBytes = 0;
      const totalBytes = parseInt(response.headers['content-length'], 10);
      response.on('data', chunk => {
        writeStream.write(chunk);
        downloadedBytes += chunk.length;
        const progress = Math.floor((downloadedBytes / totalBytes) * 100);
        try {
          mainWindow.webContents.send('versionInfo', {jdk: `Downloading (${progress}%)...`});
        } catch (e) {}
      });
      response.on('end', () => {
        try {
          mainWindow.webContents.send('versionInfo', {jdk: `Extracting...`});
        } catch (e) {}
        writeStream.end();
        if (os.platform() === 'win32') {
          extractZip(mainWindow, ZIP_PATH, resolve, reject);
        } else {
          extractTarGz(mainWindow, ZIP_PATH, resolve, reject);
        }
      });
    });
    request.on('error', err => {
      log.error('Download failed:', err);
      reject(err);
    });
    request.end();
  });
}

function extractTarGz(filePath, resolve, reject) {
  try {
    tar.x({
      file: filePath,
      C: path.join(ROELITE_DIR)
    });
    resolve();
  } catch (err) {
    try {
      fs.rmdir(JRE_PATH, {recursive: true}, () => {});
      fs.unlink(filePath, () => {});
    } catch (err) {}
    reject(err);
  }
}

function extractZip(filePath, resolve, reject) {
  extract(filePath, {dir: path.join(ROELITE_DIR)})
    .then(() => resolve())
    .catch(error => {
      try {
        fs.rmdir(JRE_PATH, {recursive: true}, () => {});
        fs.unlink(filePath, () => {});
      } catch (err) {}
      reject(error);
    });
}

module.exports = {checkJava};
