const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Use a unique partition to avoid any old Service Workers from previous builds
  const partition = 'persist:ravand-app';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 640,
    title: 'روند',
    icon: path.join(__dirname, '../src-tauri/icons/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      partition: partition,
    },
    show: false,
    backgroundColor: '#070b18',
  });

  // CSP برای امنیت - مشابه تنظیمات Tauri
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "img-src 'self' data: blob: https:; " +
          "media-src 'self' blob: https://d8j0ntlcm91z4.cloudfront.net; " +
          "connect-src 'self' https://ravand-production.up.railway.app https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self'"
        ],
      },
    });
  });

  // لینک‌های خارجی را در مرورگر پیش‌فرض باز کن
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load URL
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/index-app.html');
    const fileUrl = `file://${indexPath}#/login`;
    mainWindow.loadURL(fileUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Clear Service Worker and cache on the partition we actually use
  try {
    const ses = session.fromPartition('persist:ravand-app');
    await ses.clearCache();
    const sws = await ses.serviceWorker.getAllRegistrations();
    for (const sw of sws) {
      await sw.unregister();
    }
  } catch (_) {}

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers برای ارتباط امن با Renderer (در صورت نیاز)
ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('platform', () => process.platform);