const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('alarmDesktop', {
  readStore: (name) => ipcRenderer.invoke('store:read', name),
  writeStore: (name, value) => ipcRenderer.invoke('store:write', name, value),
  setStartup: (enabled) => ipcRenderer.invoke('app:set-startup', enabled),
  getStartup: () => ipcRenderer.invoke('app:get-startup'),
  alarmStarted: () => ipcRenderer.send('alarm:started'),
  alarmStopped: () => ipcRenderer.send('alarm:stopped'),
  platform: process.platform
})
