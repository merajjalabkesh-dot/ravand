const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !app.isPackaged

function resolveIcon () {
  const p = path.join(__dirname, 'dist', 'brand', 'icon-512.png')
  return fs.existsSync(p) ? p : undefined
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    icon: resolveIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
