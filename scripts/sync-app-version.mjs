// ---------------------------------------------------------------
//  scripts/sync-app-version.mjs
// ---------------------------------------------------------------
//  public/app-version.json  منبع اصلی است (روی Cloudflare Pages سرو می‌شود
//  و داخل بستهٔ apk می‌رود). این اسکریپت:
//    ۱. نسخه را از package.json برمی‌دارد،
//    ۲. همان فایل را عیناً به backend/src/appVersion.json آینه می‌کند
//       (روی Railway سرو می‌شود).
//  این‌طور دو استقرار هم‌یشه یکی می‌مانند و فقط یک جا ویرایش می‌کنی.
//
//  اجرا در زمان انتشار:  npm run version:sync
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const pubPath = path.join(root, 'public', 'app-version.json')
const bePath = path.join(root, 'backend', 'src', 'appVersion.json')

let src = {}
try { src = JSON.parse(fs.readFileSync(pubPath, 'utf8')) } catch { /* اول بار */ }

const out = {
  version: String(pkg.version || '0.0.0'),
  notes: typeof src.notes === 'string' ? src.notes : '',
  apkUrl: typeof src.apkUrl === 'string' ? src.apkUrl : '',
  exeUrl: typeof src.exeUrl === 'string' ? src.exeUrl : '',
  mandatory: src.mandatory === true,
}

const json = JSON.stringify(out, null, 2) + '\n'
fs.writeFileSync(pubPath, json, 'utf8')
fs.mkdirSync(path.dirname(bePath), { recursive: true })
fs.writeFileSync(bePath, json, 'utf8')
console.log('[version] synced ' + out.version + ' -> public/app-version.json + backend/src/appVersion.json')
