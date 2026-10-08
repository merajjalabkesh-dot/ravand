// preload الکترون — تنها چیزی که به رندرر تزریق می‌شود.
// contextIsolation روشن و nodeIntegration خاموش می‌ماند؛ فقط چند مقدار
// امن و یک تابع محدود از این‌جا رد می‌شوند.
const { contextBridge, ipcRenderer } = require('electron')

// نسخهٔ واقعی اپ از main با additionalArguments می‌آید
// (--rg-version=0.1.0) تا بدون IPC و همگام خوانده شود.
function argValue (name) {
  const p = '--' + name + '='
  const a = process.argv.find((s) => s.startsWith(p))
  return a ? a.slice(p.length) : ''
}

const version = argValue('rg-version') || '0.0.0'

try {
  contextBridge.exposeInMainWorld('ravandApp', {
    isElectron: true,
    platform: process.platform,
    version,
    // باز کردن لینک دانلود در مرورگر سیستم؛ اعتبارسنجی نهایی در main است
    openExternal: (url) => ipcRenderer.invoke('rg:open-external', url),
  })
} catch (e) {
  // اگر روزی preload بیرون از الکترون لود شد، بی‌صدا رد شو
}
