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
  fs.unlink(JDK_ZIP_PATH, () => {
  });
  checkJavaVersion(jdk => {
    if (jdk) {
      mainWindow.send('versionInfo', {
        jdk
      });
    } else {
      installJava11();
    }
  });
}

// Helper function to check Java version
function checkJavaVersion(callback) {
  exec(`"${JAVA_BIN}/java.exe" -version`, (error, stdout, stderr) => {
    if (error) {
      log.error('Error checking Java version: ' + error);
      return callback(null);
    }
    const versionMatch = stderr.match(/version "(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : null;
    log.info('JRE: ' + version);
    callback(version);
  });
}

// Function to download and install Java 11
function installJava11() {
  const jdkUrl = 'https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.22%2B7/OpenJDK11U-jre_x64_windows_hotspot_11.0.22_7.zip';
  const request = net.request(jdkUrl);
  request.on('response', response => {
    let downloadedBytes = 0;
    const writeStream = fs.createWriteStream(JDK_ZIP_PATH);
    response.on('data', chunk => {
      writeStream.write(chunk);
      downloadedBytes += chunk.length;
    });
    response.on('end', async () => {
      writeStream.close();
      try {
        await extract(JDK_ZIP_PATH, {dir: ROELITE_DIR});
        fs.rename(path.join(ROELITE_DIR, 'jdk-11.0.22+7-jre'), path.join(ROELITE_DIR, 'jre'), async err => {
          if (err) {
            log.error('Failed to rename JDK folder:', err);
          }
        });
      } catch (error) {
        log.error('Failed to unzip JDK:', error);
      }
    });
  });
  request.on('error', err => {
    log.error('Download failed:', err);
  });
  request.end();
}

module.exports = {checkJava};
