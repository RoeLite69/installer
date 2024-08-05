const fs = require('fs');
const path = require('path');
const {app} = require('electron');
const log = require('electron-log');
const semver = require('semver');
const https = require('https');
const os = require('os');
const exec = require('child_process').exec;

const ROELITE_DIR = path.join(os.homedir(), '.roelite');
const LOCAL_VER_PATH = path.join(ROELITE_DIR, '.launcherversion');

// Utility to fetch data from a URL
async function fetchData(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {headers: {'User-Agent': 'RoeLiteInstaller'}}, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

// Get the latest release version and download URL from GitHub
async function getLatestReleaseInfo() {
  let map = [];
  try {
    const releasesUrl = 'https://api.github.com/repos/RoeLite69/installer/releases/latest';
    const releaseData = await fetchData(releasesUrl);
    if (!releaseData) {
      log.error('No release data for:', releasesUrl);
      return map;
    }
    const release = JSON.parse(releaseData);
    if (!release) {
      log.error('Failed JSONifying.');
      return map;
    }
    if (!release.name || !release.assets) {
      console.error('Failed finding release name or assets, response:', release);
      return map;
    }
    const version = release.name;
    const asset = release.assets.find(asset => asset.name === 'RoeLiteInstaller.exe');
    if (asset && asset.browser_download_url) {
      map.version = version;
      map.url = asset.browser_download_url;
    } else {
      console.error('Failed to find RoeLiteInstaller.exe asset in release.');
    }
  } catch (error) {
    log.error('Error getting latest release info:', error);
  }
  return map;
}

// Check for updates and handle the update process
async function checkForUpdates(mainWindow) {
  try {
    const {version, url} = await getLatestReleaseInfo();
    if (!version || !url) {
      return;
    }
    if (!semver.valid(version)) {
      log.error('Invalid semver for remote:', version);
      return;
    }
    log.info('Remote version: ' + version);
    if (!fs.existsSync(LOCAL_VER_PATH)) {
      fs.writeFileSync(LOCAL_VER_PATH, version);
      log.info('Local version file not found, reset to remote: ', version);
      sendVersionInfo(mainWindow, version, version, false);
    } else {
      let localVersion = fs.readFileSync(LOCAL_VER_PATH, 'utf-8').trim();
      if (semver.gt(version, localVersion)) {
        sendVersionInfo(mainWindow, localVersion, version, true);
      } else {
        sendVersionInfo(mainWindow, localVersion, version, false);
      }
    }
  } catch (error) {
    sendVersionInfo(mainWindow, 'Error', 'Error', false);
    log.error('Update check failed:', error);
  }
}

// Send version information to the renderer process
function sendVersionInfo(mainWindow, local, remote, update) {
  mainWindow.webContents.send('versionInfo', {
    local,
    remote,
    update
  });
}

async function downloadAndUpdate(window) {
  const {version, url} = await getLatestReleaseInfo();
  if (!version || !url) {
    return;
  }
  log.info('Remote version: ' + version + ', download url: ' + url);
  dlUrl(window, url, version);
}

function dlUrl(window, url, remoteVersion) {
  log.info('Downloading launcher from:', url);
  const updateExePath = path.join(ROELITE_DIR, 'RoeLiteInstaller.exe');
  const requestOptions = {
    method: 'GET',
    headers: {'User-Agent': 'RoeLiteInstaller'}
  };
  https
    .get(url, requestOptions, response => {
      if (response.statusCode === 200) {
        // Only handle the response if it's a direct download (status code 200)
        const fileStream = fs.createWriteStream(updateExePath);
        let downloadedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length'], 10);
        response.on('data', chunk => {
          downloadedBytes += chunk.length;
          const progress = Math.floor((downloadedBytes / totalBytes) * 100);
          try {
            window.webContents.send('updateProgress', {progress});
          } catch (e) {}
        });
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            log.info('Update downloaded, starting the update process...');
            fs.writeFileSync(LOCAL_VER_PATH, remoteVersion);
            exec(updateExePath, error => {
              if (error) {
                log.error(`Error executing update: ${error}`);
              }
              app.quit(); // Quit the app to allow the installer to run
            });
          });
        });
        fileStream.on('error', error => {
          log.error('File Stream Error:', error);
          fileStream.close();
        });
      } else if (response.statusCode > 300 && response.statusCode < 399 && response.headers.location) {
        // Handle redirects
        dlUrl(window, response.headers.location, remoteVersion);
      } else {
        log.error('Download request failed with status:', response.statusCode);
      }
    })
    .on('error', err => {
      log.error('HTTPS Request Error:', err);
    });
}

module.exports = {checkForUpdates, downloadAndUpdate};