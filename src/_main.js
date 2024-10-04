const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { checkForUpdates, downloadAndUpdate } = require('./updateManager');
const { checkJava } = require('./javaManager');
const { runJar } = require('./jarRunner');
const { setupSquirrelHandlers } = require('./squirrelHandler');
const { setupDirectories } = require('./utils');
const http = require('http');

let mainWindow;
let localServer;
let store;

if (setupSquirrelHandlers()) {
	return;
} else {
	app.whenReady().then(async () => {
		const Store = await import('electron-store');
		store = new Store.default();
		await run();
	});
}

async function run() {
	await setupDirectories();
	await createWindow();
	await setupHandlers();
}

async function createWindow() {
	const windowState = store.get('windowState', {
		width: 500,
		height: 400,
		x: undefined,
		y: undefined,
	});
	mainWindow = new BrowserWindow({
		width: windowState.width,
		height: windowState.height,
		x: windowState.x,
		y: windowState.y,
		webPreferences: {
			preload: path.join(__dirname, '_preload.js'),
		},
		icon: path.join(__dirname, './img/roelite.ico'),
	});
	await mainWindow.loadFile(path.join(__dirname, './title/index.html'));
	mainWindow.setFullScreenable(false);
	mainWindow.setMenuBarVisibility(false);
	mainWindow.setTitle('RoeLite Launcher');
	mainWindow.setMinimumSize(500, 400);
	// Save window state on close
	mainWindow.on('close', () => {
		const { width, height } = mainWindow.getBounds();
		const [x, y] = mainWindow.getPosition();
		store.set('windowState', { width, height, x, y });
	});
}

async function setupHandlers() {
	await checkJava(mainWindow);
	await startLocalServer();
	await checkForUpdates(mainWindow);
	setInterval(() => checkForUpdates(mainWindow), 10 * 60 * 1000);
	ipcMain.on('downloadAndUpdate', () => downloadAndUpdate(mainWindow));
	ipcMain.on('runJar', (_, filePath, server) => runJar(filePath, server));
}

app.on('window-all-closed', () => {
	if (localServer) {
		localServer.close(() => {
			app.quit();
		});
	} else {
		app.quit();
	}
});

function startLocalServer() {
	const server = http.createServer((req, res) => {
		if (req.method === 'POST') {
			let body = '';
			req.on('data', chunk => {
				body += chunk.toString();
			});
			req.on('end', () => {
				mainWindow.webContents.send('resetButton', body);
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('OK');
			});
		} else {
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Send POST request with server name');
		}
	});
	server.listen(6969, '127.0.0.1', () => {});
	server.on('error', e => {
		if (e.code === 'EADDRINUSE') {
			// Handle address in use error
		} else {
			console.error('Server error:', e);
		}
	});
	localServer = server;
}
