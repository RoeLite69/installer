const { getDirectories, ACCOUNTS_DIR, RUNELITE_DIR } = require('./utils');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');

// Gets the accounts from the RoeLite accounts directory - Vibblez
async function getJagexAccounts(window) {
    const accounts = await getDirectories(ACCOUNTS_DIR);
	window.webContents.send('jagexAccounts', accounts);
}

// Deletes the credentials.properties file from the RuneLite directory - Vibblez
function deleteJagexAccountCredentialsFromRunelite() {
	if (fs.existsSync(RUNELITE_DIR)) {
		if (fs.existsSync(path.join(RUNELITE_DIR, 'credentials.properties'))) {
			fs.unlinkSync(path.join(RUNELITE_DIR, 'credentials.properties'));
		}
	}
}

// Copies the credentials.properties file from the RoeLite accounts directory to the RuneLite directory - Vibblez
async function copyJagexAccountCredentialsToRunelite(account) {
    if (!fs.existsSync(ACCOUNTS_DIR)) {
        log.info('RoeLite jagex_accounts directory does not exist');
        return;
    }

    try {
        const sourceCredentialsPath = path.join(ACCOUNTS_DIR, account, 'credentials.properties');
        const targetCredentialsPath = path.join(RUNELITE_DIR, 'credentials.properties');

        if (fs.existsSync(sourceCredentialsPath)) {
            fs.copyFileSync(sourceCredentialsPath, targetCredentialsPath);
            log.info(`Copied credentials for account: ${account}`);
        }    
    } catch (error) {
        log.error('Error copying credentials to RuneLite:', error);
    }
}

module.exports = {
	getJagexAccounts,
	deleteJagexAccountCredentialsFromRunelite,
	copyJagexAccountCredentialsToRunelite,
};
