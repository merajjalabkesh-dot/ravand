// همگام‌سازی فایل‌های سفارشی اندروید (مانند پلاگین به‌روزرسانی درون‌برنامه‌ای، منیفست و دسترسی‌ها)
// از پوشهٔ ردیابی‌شده در گیت (android-custom/) به پوشهٔ واقعی android/
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = join(root, 'android');
const customDir = join(root, 'android-custom');

if (!existsSync(androidDir)) {
  // اگر پوشه android هنوز با cap add android ساخته نشده، نیازی به کپی نیست
  process.exit(0);
}

const targets = [
  {
    src: join(customDir, 'AppUpdatePlugin.java'),
    dest: join(androidDir, 'app', 'src', 'main', 'java', 'app', 'ravand', 'app', 'AppUpdatePlugin.java'),
  },
  {
    src: join(customDir, 'MainActivity.java'),
    dest: join(androidDir, 'app', 'src', 'main', 'java', 'app', 'ravand', 'app', 'MainActivity.java'),
  },
  {
    src: join(customDir, 'AndroidManifest.xml'),
    dest: join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml'),
  },
  {
    src: join(customDir, 'file_paths.xml'),
    dest: join(androidDir, 'app', 'src', 'main', 'res', 'xml', 'file_paths.xml'),
  },
];

let synced = 0;
for (const item of targets) {
  if (existsSync(item.src)) {
    await mkdir(dirname(item.dest), { recursive: true });
    await copyFile(item.src, item.dest);
    synced++;
  }
}

console.log(`sync-android-custom: ${synced} فایل سفارشی اندروید با موفقیت همگام شد.`);
