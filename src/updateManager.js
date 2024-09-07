const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');
const semver = require('semver');
const { downloadFile, getLatestReleaseInfo, ROELITE_DIR } = require('./utils');
const { exec } = require('child_process');
const { tmpdir } = require('node:os');

let cachedVersion = null;
let cachedUrl = null;

async function checkForUpdates(mainWindow) {
	const localVersion = app.getVersion();
	try {
		await cleanupInstallers();
		const { version: remoteVersion, url } = await getLatestReleaseInfo();
		console.log('Version', remoteVersion, 'URL:', url);
		if (!remoteVersion || !url) return;
		const updateAvailable = semver.gt(remoteVersion, localVersion);
		if (updateAvailable) {
			cachedVersion = remoteVersion;
			cachedUrl = url;
			sendVersionInfo(mainWindow, localVersion, remoteVersion, true);
		} else {
			sendVersionInfo(mainWindow, localVersion, remoteVersion, false);
		}
	} catch (error) {
		log.error('Update check failed:', error);
		sendVersionInfo(mainWindow, localVersion, 'Error', false);
	}
}

async function downloadAndUpdate(window) {
	if (!cachedVersion || !cachedUrl) {
		log.error('Update information not available. Please check for updates first.');
		sendVersionInfo(window, 'Error', 'Error', false);
		return;
	}
	try {
		sendVersionInfo(window, 'Downloading', cachedVersion, true);
		const installerPath = await downloadFile(cachedUrl, progress => {
			try {
				window.webContents.send('updateProgress', { progress });
			} catch (e) {}
		});
		sendVersionInfo(window, 'Installing', cachedVersion, true);
		await installUpdate(installerPath);
		sendVersionInfo(window, 'Restarting', cachedVersion, true);
		restartApp();
	} catch (error) {
		log.error('Update failed:', error);
		sendVersionInfo(window, 'Error', cachedVersion, false);
	}
}

function sendVersionInfo(mainWindow, local, remote, update) {
	mainWindow.webContents.send('versionInfo', { local, remote, update });
}

function cleanupInstallers() {
	const installers = ['RoeLiteInstaller.exe', 'RoeLiteInstaller.dmg', 'RoeLiteInstaller.AppImage'];
	return Promise.all(
		installers.map(installer => fs.promises.unlink(path.join(ROELITE_DIR, installer)).catch(() => {})),
	);
}

function installUpdate(installerPath) {
	return new Promise((resolve, reject) => {
		switch (process.platform) {
			case 'win32':
				exec(`"${installerPath}" --updated`, error => {
					if (error) reject(error);
					else resolve();
				});
				break;
			case 'darwin':
				const tempDir = fs.mkdtempSync(path.join(tmpdir(), 'roelite-update-'));
				const mountPoint = path.join(tempDir, 'RoeLite');
				const script = `
          hdiutil attach "${installerPath}" -mountpoint "${mountPoint}" -nobrowse
          cp -R "${mountPoint}/RoeLite.app" /Applications/
          hdiutil detach "${mountPoint}"
          rm -rf "${tempDir}"
          rm "${installerPath}"
        `;
				exec(script, (error, stdout, stderr) => {
					if (error) {
						log.error('macOS update error:', error);
						log.error('stdout:', stdout);
						log.error('stderr:', stderr);
						reject(error);
					} else {
						log.info('macOS update successful');
						resolve();
					}
				});
				break;
			case 'linux':
				fs.chmodSync(installerPath, '755');
				exec(`"${installerPath}" --appimage-extract-and-run`, error => {
					if (error) reject(error);
					else resolve();
				});
				break;
			default:
				reject(new Error('Unsupported platform'));
		}
	});
}

function restartApp() {
	if (process.platform === 'darwin') {
		const appPath = path.join('/Applications', 'RoeLite.app');
		exec(`open "${appPath}"`, error => {
			if (error) {
				log.error('Failed to reopen app:', error);
			}
			app.quit();
		});
	} else {
		app.exit(0);
	}
}

module.exports = { checkForUpdates, downloadAndUpdate };
