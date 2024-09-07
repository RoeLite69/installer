const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { ROELITE_DIR, downloadFile } = require('./utils');

const JRE_VERSION = '11.0.22+7';
const JRE_PATH = path.join(ROELITE_DIR, `jdk-${JRE_VERSION}-jre`);
const JAVA_PATH = getJavaPath();

async function checkJava(mainWindow) {
	try {
		mainWindow.webContents.send('versionInfo', { jdk: 'Checking...' });
		let jdk = await checkJavaVersion();
		if (!jdk) {
			await installJava11(mainWindow);
			return checkJava(mainWindow);
		}
		mainWindow.webContents.send('versionInfo', { jdk });
	} catch (err) {
		console.error('Error checking Java:', err);
	}
}

function checkJavaVersion() {
	return new Promise((resolve, reject) => {
		exec(`"${JAVA_PATH}" -version`, (error, stdout, stderr) => {
			if (error) {
				fs.rmdir(JRE_PATH).catch(() => {});
				resolve(null);
			} else {
				const version = stderr.match(/version "(\d+\.\d+\.\d+)/)?.[1];
				resolve(version);
			}
		});
	});
}

async function installJava11(mainWindow) {
	const jreFileName = getJREFileName();
	const jreDlUrl = `https://github.com/adoptium/temurin11-binaries/releases/download/jdk-${JRE_VERSION}/${jreFileName}`;
	const zipPath = path.join(ROELITE_DIR, jreFileName);
	await downloadFile(jreDlUrl, progress => {
		try {
			mainWindow.webContents.send('versionInfo', { jdk: `Downloading (${progress}%)...` });
		} catch (e) {}
	});
	mainWindow.webContents.send('versionInfo', { jdk: 'Extracting...' });

	if (process.platform === 'win32') {
		await require('extract-zip')(zipPath, { dir: ROELITE_DIR });
	} else {
		await require('tar').x({ file: zipPath, C: ROELITE_DIR });
	}

	await fs.unlink(zipPath);
}

function getJREFileName() {
	const arch = os.arch();
	const platform = process.platform;
	const base = `OpenJDK11U-jre_${arch === 'arm64' ? 'aarch64' : 'x64'}_`;
	switch (platform) {
		case 'win32':
			return `OpenJDK11U-jre_x64_windows_hotspot_${JRE_VERSION.replace('+', '_')}.zip`;
		case 'darwin':
			return `${base}mac_hotspot_${JRE_VERSION.replace('+', '_')}.tar.gz`;
		case 'linux':
			return `${base}linux_hotspot_${JRE_VERSION.replace('+', '_')}.tar.gz`;
		default:
			throw new Error('Unsupported platform');
	}
}

function getJavaPath() {
	const binPath =
		process.platform === 'darwin' ? path.join(JRE_PATH, 'Contents', 'Home', 'bin') : path.join(JRE_PATH, 'bin');
	return path.join(binPath, process.platform === 'win32' ? 'java.exe' : 'java');
}

module.exports = { checkJava };
