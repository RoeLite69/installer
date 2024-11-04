const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

let checksums = {};
let lastChecksumFetch = 0;
let loadingChecksums = null;

function loadChecksums() {
	const currentTime = Date.now();
	if (currentTime - lastChecksumFetch < 300000) {
		// 5 minutes in milliseconds
		console.log('Using cached checksums');
		return Promise.resolve(checksums);
	}
	if (loadingChecksums) {
		// Return the ongoing promise
		return loadingChecksums;
	}
	loadingChecksums = downloadChecksums('https://api.roelite.net/v2/dl/launchers');
	return loadingChecksums;
}

function downloadChecksums(url, redirectCount = 0) {
	return new Promise((resolve, reject) => {
		if (redirectCount > 5) {
			return reject(new Error('Too many redirects while loading checksums'));
		}
		const parsedUrl = new URL(url);
		const options = {
			hostname: parsedUrl.hostname,
			port: parsedUrl.port || 443,
			path: parsedUrl.pathname + parsedUrl.search,
			method: 'GET',
			headers: {
				filename: 'checksums.json',
			},
			rejectUnauthorized: false,
		};
		const request = https.get(options, function (response) {
			if (response.statusCode === 200) {
				let rawData = '';
				response.on('data', chunk => {
					rawData += chunk;
				});
				response.on('end', () => {
					try {
						checksums = JSON.parse(rawData);
						console.log('Checksums loaded into memory.');
						console.log(JSON.stringify(checksums));
						lastChecksumFetch = Date.now();
						loadingChecksums = null;
						resolve(checksums);
					} catch (e) {
						console.error('Failed to parse checksums:', e.message);
						loadingChecksums = null;
						reject(e);
					}
				});
			} else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
				// Handle redirect
				const newUrl = response.headers.location;
				console.log(`Redirecting to ${newUrl}`);
				request.abort();
				downloadChecksums(newUrl, redirectCount + 1)
					.then(resolve)
					.catch(reject);
			} else {
				const error = new Error(
					`Failed to download checksums.json: Server responded with status code ${response.statusCode}`,
				);
				console.error(error.message);
				loadingChecksums = null;
				reject(error);
			}
		});
		request.on('error', function (e) {
			console.error(`Problem with request: ${e.message}`);
			loadingChecksums = null;
			reject(e);
		});
	});
}

async function getChecksum(key) {
	console.log('Getting checksum for', key);
	try {
		await loadChecksums();
	} catch (error) {
		console.error('Failed to reload checksums:', error);
	}
	return checksums[key] || null;
}

function getFileChecksum(filePath) {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('MD5');
		const stream = fs.createReadStream(filePath);
		stream.on('data', data => hash.update(data));
		stream.on('end', () => resolve(hash.digest('hex')));
		stream.on('error', error => {
			if (error.code === 'ENOENT') {
				console.error('File does not exist:', filePath);
				resolve(null);
			} else {
				reject(error);
			}
		});
	});
}

module.exports = { getChecksum, getFileChecksum };
