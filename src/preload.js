const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
  runJar: filePath => ipcRenderer.send('runJar', filePath),
  downloadAndUpdate: () => ipcRenderer.send('downloadAndUpdate'),
  // New methods for Java 11 check and installation
  checkJava11: () => ipcRenderer.send('checkJava11'),
  onVersionInfo: callback => ipcRenderer.on('versionInfo', (_, data) => callback(data)),
  onUpdateProgress: callback => ipcRenderer.on('updateProgress', (_, data) => callback(data))
});
