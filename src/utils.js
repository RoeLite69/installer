const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const log = require('electron-log');

const ROELITE_DIR = path.join(os.homedir(), '.roelite');
const LOGS_DIR = path.join(ROELITE_DIR, 'logs');

async function setupDirectories() {
	await createDir(ROELITE_DIR);
	await createDir(LOGS_DIR);
	await fs.unlink(path.join(ROELITE_DIR, 'logs', 'electron.old.log'), () => {});
	log.transports.file.resolvePathFn = () => path.join(ROELITE_DIR, 'logs', 'electron.log');
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

const { URL } = require('url');
const zlib = require('zlib');

async function downloadFile(fileUrl, progressConsumer) {
	console.log('Downloading File:', fileUrl);
	return new Promise((resolve, reject) => {
		https
			.get(fileUrl, { headers: { 'User-Agent': 'RoeLiteInstaller' } }, response => {
				if (response.statusCode === 302) {
					downloadFile(response.headers.location, progressConsumer).then(resolve).catch(reject);
					return;
				}

				let fileName = '';
				const contentDisposition = response.headers['content-disposition'];
				if (contentDisposition) {
					const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
					if (fileNameMatch) {
						fileName = fileNameMatch[1];
					}
				}

				if (!fileName) {
					const urlObject = new URL(fileUrl);
					fileName = path.basename(urlObject.pathname);
				}

				if (!fileName) {
					fileName = 'downloaded_file';
				}

				const filePath = path.join(ROELITE_DIR, fileName);
				const fileStream = fs.createWriteStream(filePath);

				let downloadedBytes = 0;
				const totalBytes = parseInt(response.headers['content-length'], 10);

				let responseStream = response;

				// Handle compressed responses
				const contentEncoding = response.headers['content-encoding'];
				if (contentEncoding === 'gzip') {
					responseStream = response.pipe(zlib.createGunzip());
				} else if (contentEncoding === 'deflate') {
					responseStream = response.pipe(zlib.createInflate());
				}

				responseStream.on('data', chunk => {
					downloadedBytes += chunk.length;
					if (totalBytes) {
						const progress = Math.floor((downloadedBytes / totalBytes) * 100);
						if (typeof progressConsumer === 'function') {
							progressConsumer(progress);
						}
					}
				});

				responseStream.pipe(fileStream);

				fileStream.on('finish', () => {
					fileStream.close();
					resolve(filePath);
				});

				fileStream.on('error', err => {
					fs.unlink(filePath, () => {});
					reject(err);
				});
			})
			.on('error', reject);
	});
}

async function getLatestReleaseInfo() {
	const releasesUrl = 'https://api.github.com/repos/RoeLite69/installer/releases/latest';
	const releaseData = await fetchData(releasesUrl);
	if (!releaseData) return {};
	const release = JSON.parse(releaseData);
	if (!release.name || !release.assets) return {};
	const assetName = getInstallerAssetName();
	const asset = release.assets.find(a => a.name === assetName);
	return asset ? { version: release.name, url: asset.browser_download_url } : {};
}

function getInstallerAssetName() {
	switch (process.platform) {
		case 'win32':
			return 'RoeLiteInstaller.exe';
		case 'darwin':
			return 'RoeLiteInstaller.dmg';
		case 'linux':
			return 'RoeLiteInstaller.AppImage';
		default:
			throw new Error('Unsupported platform');
	}
}

function fetchData(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, { headers: { 'User-Agent': 'RoeLiteInstaller' } }, res => {
				let data = '';
				res.on('data', chunk => (data += chunk));
				res.on('end', () => resolve(data.trim()));
			})
			.on('error', reject);
	});
}

module.exports = { ROELITE_DIR, setupDirectories, downloadFile, getLatestReleaseInfo };
