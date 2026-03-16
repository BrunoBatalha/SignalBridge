import { app, BrowserWindow, ipcMain } from 'electron'
import  { join } from 'node:path'
import {SerialPort} from 'serialport'

let mainWindow: BrowserWindow | null = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createMainWindow()
  
  let selectedPort: SerialPort | null = null

  ipcMain.handle('com:list', async () => {
    const ports = await SerialPort.list();
    return ports.map(port => ({
      friendlyName: port.friendlyName ?? `Porta de comunicação (${port.path})`,
      path: port.path,
    }))
  })

  ipcMain.on('com:connect', async (_event, payload: { path: string }) => {   
    selectedPort = new SerialPort({
      path: payload.path,
      baudRate: 115200,
    })  

    // selectedPort.open((err) => {
    //   if(err){
    //     console.log('Erro ao abrir a porta:', err)
    //   }
    // })
  })
    
  ipcMain.on('com:onData', async () => {
    let buffer = ''
      selectedPort!.on('data', (data) => {
        buffer += data.toString('latin1')
        let idx;
        while((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).replace(/\r/g, '')
          buffer = buffer.slice(idx + 1)
          if (line.trim()){
            mainWindow?.webContents.send('com:onData', line)
          } 
        }      
      })
    })

  ipcMain.on('com:send', async (_event, payload: { command: string }) => {    
    selectedPort!.write(payload.command, (err) => {
      if(err){
        console.error('Erro ao enviar comando:', err)
      }
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
