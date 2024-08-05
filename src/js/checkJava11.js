const extract = require('extract-zip');
const log = require('electron-log');
const {net} = require('electron');
const {exec} = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ROELITE_DIR = path.join(os.homedir(), '.roelite');
const JAVA_BIN = path.join(ROELITE_DIR, 'jre', 'bin');
const JDK_ZIP_PATH = path.join(ROELITE_DIR, 'openjdk-11.zip');

async function checkJava(mainWindow) {
  // Attempt to delete existing JDK zip file
  await fs.unlink(JDK_ZIP_PATH, () => {});
  checkJavaVersion(async jdk => {
    if (jdk) {
      mainWindow.webContents.send('versionInfo', {jdk});
    } else {
      mainWindow.webContents.send('versionInfo', {jdk: `Downloading (0%)...`});
      await installJava11(mainWindow);
      // After installation, recheck the Java version
      checkJavaVersion(jdk => {
        if (jdk) {
          mainWindow.webContents.send('versionInfo', {jdk});
        } else {
          mainWindow.webContents.send('versionInfo', {jdk: 'ERROR!'});
          log.error('Failed to install Java 11 correctly.');
        }
      });
    }
  });
}

// Helper function to check Java version
function checkJavaVersion(callback) {
  exec(`"${JAVA_BIN}/java.exe" -version`, (error, stdout, stderr) => {
    if (error) {
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
  const jdkUrl = 'https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.22%2B7/OpenJDK11U-jre_x64_windows_hotspot_11.0.22_7.zip';
  const request = net.request(jdkUrl);
  return new Promise((resolve, reject) => {
    request.on('response', response => {
      const writeStream = fs.createWriteStream(JDK_ZIP_PATH);
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
        writeStream.end();
        try {
          mainWindow.webContents.send('versionInfo', {jdk: `Extracting...`});
        } catch (e) {}
        extract(JDK_ZIP_PATH, {dir: path.join(ROELITE_DIR)})
          .then(() => {
            try {
              mainWindow.webContents.send('versionInfo', {jdk: `Renaming...`});
            } catch (e) {}
            fs.rename(path.join(ROELITE_DIR, 'jdk-11.0.22+7-jre'), path.join(ROELITE_DIR, 'jre'), err => {
              if (err) {
                log.error('Failed to rename JDK folder:', err);
                reject(err);
              } else {
                log.info('Java 11 installed successfully');
                resolve();
              }
            });
          })
          .catch(error => {
            log.error('Failed to unzip JDK:', error);
            reject(error);
          });
      });
    });
    request.on('error', err => {
      log.error('Download failed:', err);
      reject(err);
    });
    request.end();
  });
}

module.exports = {checkJava};
