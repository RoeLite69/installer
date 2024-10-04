const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const os = require('os');

function setupSquirrelHandlers() {
	if (process.platform !== 'win32') return false;
	const squirrelCommand = process.argv[1];
	const appPath = path.resolve(process.execPath, '..');
	const updateExe = path.resolve(appPath, '..', 'Update.exe');
	const exeName = path.basename(process.execPath);
	switch (squirrelCommand) {
		case '--squirrel-install':
		case '--squirrel-updated':
			updateShortcuts(updateExe, exeName, true);
			return true;
		case '--squirrel-uninstall':
			updateShortcuts(updateExe, exeName, false);
			cleanupDirectories();
			return true;
		case '--squirrel-obsolete':
			return true;
		default:
			return false;
	}
}

function updateShortcuts(updateExe, exeName, create) {
	const locations = ['Desktop,StartMenu'];
	const args = create ? ['--createShortcut', exeName] : ['--removeShortcut', exeName];
	exec(`${updateExe} ${args.join(' ')} --shortcut-locations ${locations}`);
}

async function cleanupDirectories() {
	const directories = [
		path.join(os.homedir(), '.roelite'),
		path.join(os.homedir(), '.runelite', 'repository2', 'old'),
		path.join(os.homedir(), 'AppData', 'Local', 'RoeLite'),
		path.join(os.homedir(), 'AppData', 'Roaming', 'RoeLite'),
		'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\RoeLite',
	];
	for (const dir of directories) {
		await fs.rmdir(dir).catch(() => {});
	}
}

module.exports = { setupSquirrelHandlers };
