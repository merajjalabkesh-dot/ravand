// فایل‌های مخصوص «سایت» را از dist حذف می‌کند تا داخل بستهٔ native (apk/exe)
// نروند. اپ native فقط index.html را لود می‌کند؛ پس این‌ها فقط وزن اضافه‌اند:
//   - downloads/          نصب‌کنندهٔ ویندوز و apk قدیمی (سایت دانلود)
//   - fonts/              فونت IRAN که فقط site.css استفاده می‌کند (اپ نمی‌خواندش)
//   - index-site.html     نقطهٔ ورود سایت (اپ هرگز آن را باز نمی‌کند)
//   - service-worker.js   اپ native سرویس‌ورکر ثبت نمی‌کند (گارد __IS_NATIVE_APP__)
//   - sw.js               نسخهٔ توسعهٔ همان سرویس‌ورکر
// اینها در git برای سایت می‌مانند؛ فقط از خروجی native حذف می‌شوند. حذفشان
// فقط در مسیرهای cap:* و electron:build اجرا می‌شود، نه در `npm run build` سایت.
import { rm, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ پیدا نشد؛ اول build کن.');
  process.exit(1);
}

// پوشه‌های فقط-سایت
const junkDirs = ['downloads', 'fonts'];
// فایل‌های فقط-سایت در ریشهٔ dist
const junkFiles = ['index-site.html', 'service-worker.js', 'sw.js'];
const junkExt = new Set(['.exe', '.msi', '.apk', '.dmg', '.deb', '.appimage', '.zip', '.7z', '.rar']);
let removed = 0;

for (const d of junkDirs) {
  const p = join(dist, d);
  if (existsSync(p)) {
    // شمارش فقط برای گزارش؛ حذف خودِ پوشه به‌صورت بازگشتی (زیرپوشه هم دارد، مثل fonts/iran/)
    const files = await readdir(p);
    await rm(p, { recursive: true, force: true });
    console.log(`prune-cap-dist: حذف dist/${d}/ (${files.length} مورد)`);
    removed += files.length;
  }
}

for (const f of junkFiles) {
  const p = join(dist, f);
  if (existsSync(p)) {
    await rm(p, { force: true });
    console.log(`prune-cap-dist: حذف dist/${f}`);
    removed++;
  }
}

// هر فایل باینری سنگین دیگری که اتفاقی در ریشهٔ dist باشد
for (const f of await readdir(dist)) {
  const full = join(dist, f);
  if (!statSync(full).isFile()) continue;
  const ext = f.slice(f.lastIndexOf('.')).toLowerCase();
  if (junkExt.has(ext)) {
    await rm(full, { force: true });
    console.log(`prune-cap-dist: حذف dist/${f}`);
    removed++;
  }
}

console.log(`prune-cap-dist: تمام شد (${removed} مورد).`);
