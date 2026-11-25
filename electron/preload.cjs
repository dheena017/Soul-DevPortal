const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soulDesktop', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  navigate: (hash) => {
    if (typeof hash === 'string') {
      ipcRenderer.send('soul:navigate', hash);
    }
  },
  onNavigate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, hash) => {
      if (typeof hash === 'string') callback(hash);
    };
    ipcRenderer.on('soul:navigate', listener);
    return () => ipcRenderer.removeListener('soul:navigate', listener);
  },
  openExternal: (url) => ipcRenderer.invoke('soul:open-external', url),
  openPanel: (hash, title, panelKey) =>
    ipcRenderer.invoke('soul:open-panel', { hash, title, panelKey }),
});
