const { version } = require('./package.json');

module.exports = {
	packagerConfig: {
		asar: true,
		icon: './src/img/RoeLite',
		win32metadata: {
			CompanyName: 'Roe',
			FileDescription: 'Third party client for Oldschool Runescape and RSPS.',
			OriginalFilename: 'RoeLite.exe',
			ProductName: 'RoeLite',
			InternalName: 'RoeLite',
		},
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
				iconUrl: 'https://raw.githubusercontent.com/RoeLite69/installer/refs/heads/main/src/img/RoeLite.ico',
				setupIcon: './src/img/RoeLite.ico',
				icon: './src/img/RoeLite.ico',
				noMsi: true,
				remoteReleases: '',
				shortcutName: 'RoeLite',
				title: 'RoeLite',
				setupExe: 'RoeLiteInstaller.exe',
				skipUpdateIcon: false,
				usePackageJson: false,
				version: version,
			},
		},
		{
			name: '@electron-forge/maker-dmg',
			config: {
				name: 'RoeLiteInstaller',
				title: 'RoeLite',
				icon: './src/img/RoeLite.icns',
				window: { width: 250, height: 150 },
				format: 'ULFO',
				overwrite: true,
			},
		},
	],
};
