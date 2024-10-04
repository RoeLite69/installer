const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const app = require('electron').app;

function setupSquirrelHandlers() {
	if (process.platform !== 'win32') {
		return false;
	}
	const squirrelCommand = process.argv[1];
	const exeName = path.basename(process.execPath);
	const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
	const run = args => {
		return new Promise(resolve => {
			console.log('Spawning `%s` with args `%s`', updateExe, args);
			spawn(updateExe, args, {
				detached: true,
			}).on('close', resolve);
		});
	};
	switch (squirrelCommand) {
		case '--squirrel-install':
		case '--squirrel-updated':
			run(['--createShortcut=' + exeName]).then(() => {});
			return true;
		case '--squirrel-uninstall':
			run(['--removeShortcut=' + exeName]).then(() => {
				cleanupDirectories().then(() => {
					app.quit();
				});
			});
			return true;
		case '--squirrel-obsolete':
			app.quit();
			return true;
		default:
			return false;
	}
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
		try {
			await fs.rmdir(dir, { recursive: true });
			console.log('Successfully removed directory:', dir);
		} catch (error) {
			console.log('Error removing directory:', dir, error);
		}
	}
	// Remove RoeLite shortcuts
	await removeRoeLiteShortcuts();
}

async function removeRoeLiteShortcuts() {
	const shortcutLocations = [
		path.join(os.homedir(), 'Desktop'),
		path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
	];
	for (const location of shortcutLocations) {
		try {
			const entries = await fs.readdir(location);
			for (const entry of entries) {
				if (entry.toLowerCase().includes('roelite') && path.extname(entry).toLowerCase() === '.lnk') {
					const shortcutPath = path.join(location, entry);
					try {
						await fs.unlink(shortcutPath);
						console.log('Removed RoeLite shortcut:', shortcutPath);
					} catch (error) {
						console.log('Error removing shortcut:', shortcutPath, error);
					}
				}
			}
		} catch (error) {
			console.log('Error processing directory:', location, error);
		}
	}
}

module.exports = { setupSquirrelHandlers };
