import { contextBridge, ipcRenderer } from 'electron'

interface SerialPortInfo {
  friendlyName: string
  path: string
}


contextBridge.exposeInMainWorld('comBridge', {
  listPorts: () => ipcRenderer.invoke('com:list') as Promise<SerialPortInfo[]>,
  sendCommand: (command: string) => ipcRenderer.invoke('com:send', { command }),
  onData: (handleData: (data: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: string) => handleData(data)
    ipcRenderer.send('com:onData')
    ipcRenderer.on('com:onData', handler)
    return () => ipcRenderer.off('com:onData', handler)
  },
  connect: (path: string) => ipcRenderer.send('com:connect', { path }),
  send: (command:string) => ipcRenderer.send('com:send', { command }),
})
