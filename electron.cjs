const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !app.isPackaged

// فقط لینک دانلود GitHub Releases اجازهٔ باز شدن در مرورگر سیستم را دارد.
const GITHUB_RE = /^https:\/\/(github\.com|[a-z0-9-]+\.githubusercontent\.com)(\/|$)/i

function resolveIcon () {
  const p = path.join(__dirname, 'dist', 'brand', 'icon-512.png')
  return fs.existsSync(p) ? p : undefined
}

// باز کردن لینک دانلود از سمت رندرر — تنها IPC مجاز همین است.
ipcMain.handle('rg:open-external', (_e, url) => {
  if (typeof url === 'string' && GITHUB_RE.test(url)) {
    shell.openExternal(url)
    return true
  }
  return false
})

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    icon: resolveIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // پل امن preload: نسخهٔ واقعی اپ + باز کردن لینک دانلود
      preload: path.join(__dirname, 'preload.cjs'),
      // نسخه را همگام به preload می‌رساند تا بدون IPC خوانده شود
      additionalArguments: ['--rg-version=' + app.getVersion()]
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5175')
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
