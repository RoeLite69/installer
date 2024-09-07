module.exports = {
	packagerConfig: {
		asar: true,
		icon: './src/img/RoeLite',
		out: './out',
	},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			config: {
				name: 'RoeLite',
				description: 'Third party client for Oldschool Runescape and RSPS.',
				authors: 'Roe',
				exe: 'RoeLite.exe',
				loadingGif: './src/img/loading.gif',
				iconUrl: 'https://roelite.net/favicon.ico',
				noMsi: true,
				remoteReleases: '',
				shortcutName: 'RoeLite',
				title: 'RoeLite',
				setupExe: 'RoeLiteInstaller.exe',
				setupIcon: './src/img/RoeLite.ico',
				skipUpdateIcon: true,
			},
		},
		{
			name: '@electron-forge/maker-dmg',
			config: {
				name: 'RoeLiteInstaller',
				title: 'RoeLite',
				icon: './src/img/RoeLite.icns',
				background: './src/img/dmg-background.png',
				contents: [
					{ x: 448, y: 344, type: 'link', path: '/Applications' },
					{ x: 192, y: 344, type: 'file', path: './RoeLite.app' },
				],
				format: 'ULFO',
				overwrite: true,
			},
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
	],
};
