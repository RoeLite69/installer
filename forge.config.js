module.exports = {
	packagerConfig: {
		asar: true,
		icon: './src/img/RoeLite',
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
					{ x: 192, y: 344, type: 'file', path: 'RoeLite.app' },
				],
				format: 'ULFO',
				overwrite: true,
			},
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
		},
		{
			name: '@electron-forge/maker-deb',
			config: {
				options: {
					maintainer: 'Roe',
					homepage: 'https://roelite.net',
					icon: './src/img/RoeLite.png',
					categories: ['Game'],
					description: 'Third party client for Oldschool Runescape and RSPS.',
					productName: 'RoeLite',
					genericName: 'RoeLite Launcher',
					section: 'games',
					priority: 'optional',
				},
			},
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {
				options: {
					maintainer: 'Roe',
					homepage: 'https://roelite.net',
					icon: './src/img/RoeLite.png',
					categories: ['Game'],
					description: 'Third party client for Oldschool Runescape and RSPS.',
					productName: 'RoeLite',
					genericName: 'RoeLite Launcher',
					group: 'Applications/Games',
					license: 'MIT',
				},
			},
		},
		{
			name: '@electron-forge/maker-appimage',
			platforms: ['linux'],
			config: {
				options: {
					name: 'RoeLiteInstaller',
					productName: 'RoeLite',
					genericName: 'RoeLite Launcher',
					description: 'Third party client for Oldschool Runescape and RSPS.',
					categories: ['Game'],
					icon: './src/img/RoeLite.png',
					executableName: 'roelite',
					mimeType: ['x-scheme-handler/roelite'],
					desktop: {
						Name: 'RoeLite',
						Comment: 'Third party client for Oldschool Runescape and RSPS.',
						Categories: 'Game;',
						Terminal: 'false',
						Type: 'Application',
						Icon: 'roelite',
						StartupWMClass: 'roelite',
					},
				},
			},
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
	],
	publishers: [
		{
			name: '@electron-forge/publisher-github',
			config: {
				repository: {
					owner: 'RoeLite69',
					name: 'installer',
				},
				prerelease: false,
				draft: true,
			},
		},
	],
};
