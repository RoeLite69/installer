const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

let checksums = {};
let lastChecksumFetch = 0;

function loadChecksums() {
	return new Promise((resolve, reject) => {
		const currentTime = Date.now();
		if (currentTime - lastChecksumFetch < 120000) {
			// 2 minutes in milliseconds
			console.log('Using cached checksums');
			return resolve(checksums);
		}
		const options = {
			hostname: 'cloud.roelite.net',
			port: 443,
			path: '/v2/dl/launchers',
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
						lastChecksumFetch = currentTime;
						resolve(checksums);
					} catch (e) {
						console.error('Failed to parse checksums:', e.message);
						reject(e);
					}
				});
			} else {
				const error = new Error(
					`Failed to download checksums.json: Server responded with status code ${response.statusCode}`,
				);
				console.error(error.message);
				reject(error);
			}
		});
		request.on('error', function (e) {
			console.error(`Problem with request: ${e.message}`);
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
