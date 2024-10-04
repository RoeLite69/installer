const path = require('path');
const { spawn } = require('child_process');
const log = require('electron-log');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { getChecksum, getFileChecksum } = require('./checksums');

const ROELITE_DIR = path.join(os.homedir(), '.roelite');
const JRE_PATH = path.join(ROELITE_DIR, 'jdk-11.0.22+7-jre');
const JAVA_PATH =
	os.platform() === 'win32'
		? path.join(JRE_PATH, 'bin', 'java.exe')
		: path.join(JRE_PATH, 'Contents', 'Home', 'bin', 'java');

async function runJar(filePath, server) {
	if (!filePath) {
		log.error('runJar: No filePath provided.');
		return;
	}
	try {
		const jarPath = await downloadJarIfChanged(filePath);
		if (!jarPath) {
			log.error('runJar: Failed finding jarPath:', filePath);
			return;
		}
		const args = server ? [server.toLowerCase()] : [];
		const jarProcess = spawn(JAVA_PATH, ['-jar', jarPath, ...args], {
			detached: true,
			stdio: 'ignore',
		});
		jarProcess.unref();
	} catch (error) {
		log.error('Error during JAR operation:', error);
		fs.unlink(filePath, err => {
			if (err) log.error('Failed to delete the JAR file after error:', err);
			else log.info('Deleted the JAR file after encountering an error in preparation.');
		});
	}
}

async function downloadJarIfChanged(filePath) {
	const jarName = path.basename(filePath);
	const jarPath = path.join(ROELITE_DIR, jarName);
	const remoteChecksum = await getChecksum(`${jarName}`);
	const localChecksum = await getFileChecksum(jarPath);
	log.info('Checksums - Local:', localChecksum, 'Remote:', remoteChecksum);
	if (localChecksum === remoteChecksum) {
		log.info(`${jarName} is up to date.`);
		return jarPath;
	}
	if (localChecksum) {
		const canWrite = await canWriteToFile(jarPath);
		if (!canWrite) {
			log.error(`Cannot write to ${jarName}: file may be in use.`);
			return jarPath;
		}
	}
	log.info('Downloading JAR from path:', filePath);
	return downloadFile(jarName, jarPath);
}

function canWriteToFile(filePath) {
	return new Promise(resolve => {
		fs.open(filePath, 'r+', (err, fd) => {
			if (err) {
				resolve(false);
			} else {
				fs.close(fd, err => {
					if (err) log.error(`Error closing file ${filePath}:`, err);
					resolve(true);
				});
			}
		});
	});
}

function downloadFile(filename, destPath) {
	return new Promise((resolve, reject) => {
		const fileStream = fs.createWriteStream(destPath);
		const options = {
			hostname: 'cloud.roelite.net',
			port: 443,
			path: '/v2/dl/launchers',
			method: 'GET',
			headers: {
				filename: `${filename}`,
			},
			rejectUnauthorized: false,
		};
		const request = https.get(options, response => {
			if (response.statusCode === 200) {
				response.pipe(fileStream);
				fileStream.on('finish', () => {
					fileStream.close(() => {
						log.info(`${path.basename(destPath)} downloaded successfully.`);
						resolve(destPath);
					});
				});
			} else {
				log.error(
					`Failed to download ${path.basename(destPath)}: Server responded with status code ${response.statusCode}`,
				);
				fileStream.close(() => {
					fs.unlink(destPath, () =>
						reject(
							new Error(
								`Failed to download ${path.basename(destPath)}: Server responded with status code ${response.statusCode}`,
							),
						),
					);
				});
			}
		});
		request.on('error', err => {
			log.error(`Problem with request: ${err.message}`);
			fileStream.close(() => {
				fs.unlink(destPath, () => reject(err));
			});
		});
	});
}

module.exports = { runJar };
