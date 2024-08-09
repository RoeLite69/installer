module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/img/RoeLite'
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
        skipUpdateIcon: true
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'RoeLite',
        title: 'RoeLite',
        icon: './src/img/RoeLite.icns',
        window: {width: 250, height: 150},
        format: 'ULFO',
        overwrite: true
      }
    }
  ]
};
