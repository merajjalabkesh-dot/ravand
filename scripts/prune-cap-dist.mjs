// فایل‌های باینری سنگین وب‌سایت (نصب‌کنندهٔ ویندوز، APK قدیمی و…) را از dist حذف می‌کند.
// اینها فقط برای سایت دانلود هستند، در git هم نیستند (public/downloads ignored) و
// نباید داخل APK/EXE بسته‌بندی شوند — وگرنه خروجی ~۱۰۰ مگابایتی می‌شود.
import { rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ پیدا نشد؛ اول build کن.');
  process.exit(1);
}

const junkDirs = ['downloads'];
const junkExt = new Set(['.exe', '.msi', '.apk', '.dmg', '.deb', '.appimage', '.zip', '.7z', '.rar']);
let removed = 0;

for (const d of junkDirs) {
  const p = join(dist, d);
  if (existsSync(p)) {
    const files = await readdir(p);
    for (const f of files) await rm(join(p, f), { force: true });
    await rm(p, { recursive: true, force: true });
    console.log(`prune-cap-dist: حذف dist/${d}/ (${files.length} فایل)`);
    removed += files.length;
  }
}

// هر فایل باینری سنگین دیگری که اتفاقی در ریشهٔ dist باشد
for (const f of await readdir(dist)) {
  const ext = f.slice(f.lastIndexOf('.')).toLowerCase();
  if (junkExt.has(ext)) {
    await rm(join(dist, f), { force: true });
    console.log(`prune-cap-dist: حذف dist/${f}`);
    removed++;
  }
}

console.log(`prune-cap-dist: تمام شد (${removed} مورد).`);