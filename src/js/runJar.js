const path = require('path');
const {exec} = require('child_process');
const log = require('electron-log');
const fs = require('fs');
const os = require('os');
const https = require('https');
const {getChecksum, getFileChecksum} = require('./checksums');

const ROELITE_DIR = path.join(os.homedir(), '.roelite');

async function runJar(filePath) {
  if (!filePath) {
    log.error('runJar: No filePath provided.');
    return;
  }
  try {
    const jarPath = await downloadJarIfChanged(filePath);
    if (!jarPath) {
      console.error('runJar: Failed finding jarPath:', filePath);
      return;
    }
    const jarName = path.basename(filePath);
    const javaExecutable = os.platform() === 'win32' ? 'java.exe' : 'java';
    const javaPath = path.join(ROELITE_DIR, 'jre', 'bin', javaExecutable);
    exec(`"${javaPath}" -jar "${jarPath}"`, (error, stdout) => {
      if (error) {
        log.error('JAR launch failed:', error);
        log.info('Deleting the invalid JAR file.');
        fs.unlink(jarPath, err => {
          if (err) {
            log.error('Failed to delete invalid JAR file:', err);
          } else {
            log.info(jarName + ' was deleted successfully.');
          }
        });
      } else {
        log.info('JAR launched successfully:', stdout);
      }
    });
  } catch (error) {
    log.error('Error during JAR operation:', error);
    fs.unlink(filePath, err => {
      if (err) console.error('Failed to delete the JAR file after preparation error:', err);
      else console.log('Deleted the JAR file after encountering an error in preparation.');
    });
  }
}

async function downloadJarIfChanged(filePath) {
  const jarName = path.basename(filePath);
  const jarPath = path.join(os.homedir(), '.roelite', jarName);
  // Ensure checksums are loaded and compared
  const remoteChecksum = getChecksum(filePath); // getChecksum seems to be synchronous now
  const localChecksum = await getFileChecksum(jarPath);
  console.log('Local:', localChecksum, 'Remote:', remoteChecksum);
  // If checksums match, the file is up to date
  if (localChecksum === remoteChecksum) {
    console.log(`${jarName} is up to date.`);
    return jarPath;
  }
  // Check for write access
  if (localChecksum) {
    const canWrite = await canWriteToFile(jarPath);
    if (!canWrite) {
      console.error(`Cannot write to ${jarName}: file may be in use.`);
      return jarPath;
    }
  }
  console.log('Downloading JAR from path: ' + filePath);
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(jarPath, {flags: 'w'});
    fileStream.on('error', err => {
      console.error(`Error writing to file ${jarName}:`, err);
      reject(new Error(`Error writing to file ${jarName}: ${err.message}`));
    });
    const options = {
      hostname: 'cloud.roelite.net',
      port: 443,
      path: '/files/download',
      method: 'GET',
      headers: {
        branch: 'dev',
        filename: filePath
      },
      rejectUnauthorized: false
    };
    const request = https.get(options, response => {
      if (response.statusCode === 200) {
        response.pipe(fileStream).on('finish', () => {
          console.log(`${jarName} downloaded successfully.`);
          resolve(jarPath);
        });
      } else {
        console.error(`Failed to download ${jarName}: Server responded with status code ${response.statusCode}`);
        fileStream.end(() => {
          fs.unlink(jarPath, () => reject(new Error(`Failed to download ${jarName}: Server responded with status code ${response.statusCode}`)));
        });
      }
    });
    request.on('error', err => {
      console.error(`Problem with request: ${err.message}`);
      fileStream.end(() => {
        fs.unlink(jarPath, () => reject(err));
      });
    });
  });
}

function canWriteToFile(filePath) {
  return new Promise(resolve => {
    fs.open(filePath, 'r+', (err, fd) => {
      if (err) {
        resolve(false); // If there's an error opening the file for writing, resolve as false
      } else {
        fs.close(fd, err => {
          if (err) {
            console.error(`Error closing file ${filePath}:`, err);
          }
          resolve(true); // Successfully opened and closed the file for writing
        });
      }
    });
  });
}

module.exports = {runJar};
