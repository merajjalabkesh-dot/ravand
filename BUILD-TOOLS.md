# ساخت نسخهٔ ویندوز (exe) و اندروید (apk)

این راهنما را کنار پروژه نگه دار. **تنظیمات هر دو ساخت (Tauri و Capacitor) از قبل در پروژه نوشته شده** — کاری که تو باید بکنی فقط نصب ابزارها (یک بار) و گرفتن خروجی است.

---

## چرا ساخت را من (Claude) انجام نمی‌دهم؟

محیطی که در آن کار می‌کنم یک لینوکس ایزوله بدون گرافیک است و ابزارهای ساخت ویندوز و اندروید روی آن نصب نمی‌شوند (Android SDK حدود ۱۰ گیگابایت و Windows SDK هم هستند، ولی در محیط من قابل نصب نیستند). ضمناً `npx vite build` هم در این محیط شکست می‌خورد چون باینری‌ها فقط نسخهٔ ویندوز دارند.

پس تقسیم کار این‌طور است: **من کد و تنظیمات کامل را می‌نویسم، تو یک بار خروجی می‌گیری.**

> ## ✅ وضعیت فعلی (۲۰۲۶/۱۰/۰۱) — APK ساخته شد
>
> روی همین ویندوز **با موفقیت ساخته شد**؛ دیگر لازم نیست Android Studio را باز کنی. فقط بزن:
>
> ```bash
> npm run cap:apk            # نسخه debug (۴.۴ مگابایت)
> npm run cap:apk:release    # نسخه release امضاشده (۳.۳ مگابایت) ← این را روی گوشی نصب کن
> ```
>
> خروجی‌ها:
>
> ```
> android/app/build/outputs/apk/release/ravand-release-v1.0.apk   ← امضاشده، برای نصب
> android/app/build/outputs/apk/debug/ravand-debug-v1.0.apk
> ```
>
> سه مشکلی که قبلاً ساخت را می‌شکست اصلاح شد:
>
> 1. `@capacitor/cli` در `package.json` نبود → الان هست (بعد از `npm install` دستور `cap` کار می‌کند).
> 2. اسکریپت‌های `cap:*` فایل ناموجود `dist/index-app.html` را کپی می‌کردند → حذف شد.
> 3. سیستم فقط **Java 25** دارد که Gradle 8.14 با آن نمی‌چرخد (خطای `Unsupported class file major version 69`)
>    → JDK 21 دانلود شد و در `android/gradle.properties` با `org.gradle.java.home` وصل شد.
>
> نکته: فایل‌های سنگین `public/downloads/` (نصب‌کنندهٔ ویندوز و APK قدیمی) قبلاً داخل APK می‌رفتند و
> خروجی را به ~۱۰۰ مگابایت می‌رساندند؛ حالا `scripts/prune-cap-dist.mjs` قبل از هر `cap sync` آن‌ها را
> از `dist` حذف می‌کند.

---

# بخش ۰ — کار مشترک (فقط یک بار)

در ترمینال، داخل پوشهٔ پروژه:

```bash
npm install
```

> **این مرحله را رد نکن.** دستورهای `npm run tauri:build` و `npm run cap:sync` به ابزارهایی
> وابسته‌اند که `@tauri-apps/cli` و `@capacitor/cli` در `package.json` اضافه شده‌اند و با همین
> `npm install` نصب می‌شوند. بدون آن، هر دو دستور با پیام «command not found» می‌شکنند.

---

# بخش ۱ — نسخهٔ ویندوز با Tauri

Tauri فایل exe خیلی کوچکی می‌سازد (حدود ۵ مگابایت) چون از موتور وب سیستم استفاده می‌کند، نه یک مرورگر کامل مثل Electron.

> **توجه:** فایل‌های `src-tauri/` از قبل ساخته شده‌اند (شامل `tauri.conf.json`، `Cargo.toml`، کد Rust و آیکون‌ها). **دیگر `npx tauri init` را نزن** — تنظیمات آماده است و آن دستور ممکن است روی فایل‌های موجود بیفتد.

## ۱.۱ نصب Rust

۱. به آدرس <https://rustup.rs> برو.
۲. روی دکمهٔ سبز **Download Rustup** کلیک کن.
۳. فایل `rustup-init.exe` را باز کن.
۴. در پنجرهٔ باز شده، گزینهٔ پیش‌فرض را بزن و **Install** را بزن.
۵. بعد از نصب، **ترمینال (Command Prompt یا PowerShell) را ببند و دوباره باز کن** — این مرحله مهم است، وگرنه دستور `cargo` شناخته نمی‌شود.
۶. این دستور را بزن تا از نصب مطمئن شوی:
   ```
   cargo --version
   ```
   باید یه شماره مثل `cargo 1.82.0` نشون بده.

## ۱.۲ نصب Visual Studio Build Tools

Rust برای کامپایل کردن به کامپایلر C نیاز دارد.

۱. به آدرس <https://visualstudio.microsoft.com/visual-cpp-build-tools/> برو.
۲. روی **Download Build Tools** کلیک کن.
۳. فایل نصبی باز می‌شود. در صفحهٔ انتخاب کامپوننت‌ها، تیک این سه مورد را بزن:
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
   - ✅ **Windows 10 SDK** (مهم: پایین‌ترین نسخه را انتخاب کن)
   - ✅ **C++ CMake tools for Windows**
۴. حجم دانلود حدود ۶ گیگابایت است، صبر کن.
۵. بعد از نصب، سیستم را ری‌استارت کن.

> اگر حافظه یا اینترنت محدود داری بگو تا به‌جای Tauri بریم سراغ **Electron** که فقط Node.js می‌خواهد و exe بزرگ‌تری می‌دهد ولی نصبش خیلی ساده‌تر است.

## ۱.۳ گرفتن خروجی

```bash
npm run tauri:build
```

خروجی در این مسیر ساخته می‌شود:

```
src-tauri/target/release/bundle/nsis/Ravand_0.1.0_x64-setup.exe
```

> بار اول ۱۰ تا ۲۰ دقیقه طول می‌کشد چون کتابخانه‌های Rust کامپایل می‌شوند. بارهای بعدی خیلی سریع‌تر است.

برای تست بدون ساخت نصب‌کننده:

```bash
npm run tauri:dev
```

---

# بخش ۲ — نسخهٔ اندروید با Capacitor

> **توجه:** فایل `capacitor.config.json` از قبل ساخته شده. **دیگر `npx cap init` را نزن.** فقط `npx cap add android` لازم است که پوشهٔ `android/` را تولید می‌کند (این پوشه در `.gitignore` است و عمداً commit نمی‌شود).

## ۲.۱ نصب Android Studio

۱. به آدرس <https://developer.android.com/studio> برو.
۲. **Download Android Studio** را بزن.
۳. فایل نصب را باز کن و مراحل را برو. مسیر پیش‌فرض نصب خوب است.
۴. بعد از نصب، Android Studio برای اولین بار باز می‌شود و **Setup Wizard** اجرا می‌شود. اجازه بده **Standard** نصب کند.
۵. نصب کامل می‌شود. این مرحله حدود ۵ گیگابایت دانلود دارد.

## ۲.۲ فعال کردن JDK

اگر JDK روی سیستم نصب نیست:

۱. به آدرس <https://adoptium.net> برو.
۲. **JDK 21** را دانلود و نصب کن (نسخهٔ LTS که Capacitor 7 می‌خواهد).
۳. متغیر محیطی `JAVA_HOME` را تنظیم کن:
   - کلید ویندوز را بزن، `Environment Variables` را جستجو کن.
   - در `System variables` روی **New** بزن.
   - نام: `JAVA_HOME`
   - مقدار: مسیر نصب JDK، مثلاً `C:\Program Files\Eclipse Adoptium\jdk-21.0.5`
   - در `Path` هم `%JAVA_HOME%\bin` را اضافه کن.
۴. ترمینال را ببند و دوباره باز کن و بزن:
   ```
   java -version
   ```

## ۲.۳ ساخت پوشهٔ اندروید

در پوشهٔ پروژه:

```bash
npx cap add android
```

این دستور یک بار اجرا می‌شود و پوشهٔ `android/` را می‌سازد.

## ۲.۴ گذاشتن آیکون واقعی روی لانچر

آیکون‌های روند در پوشهٔ `android-res/` آماده‌اند. بعد از ساخت `android/` این‌ها را کپی کن:

```bash
cp android-res/mipmap-mdpi/ic_launcher.png     android/app/src/main/res/mipmap-mdpi/
cp android-res/mipmap-hdpi/ic_launcher.png     android/app/src/main/res/mipmap-hdpi/
cp android-res/mipmap-xhdpi/ic_launcher.png    android/app/src/main/res/mipmap-xhdpi/
cp android-res/mipmap-xxhdpi/ic_launcher.png   android/app/src/main/res/mipmap-xxhdpi/
cp android-res/mipmap-xxxhdpi/ic_launcher.png  android/app/src/main/res/mipmap-xxxhdpi/
```

جزئیات بیشتر (adaptive icon و رنگ پس‌زمینه) در `android-res/README.md` است.

---

# بخش ۳ — ساخت فایل apk

هر بار که کد وب تغییر کرد، اول باید خروجی وب ساخته و کپی شود:

```bash
npm run cap:sync
```

این دستور خودش `npm run build` را اجرا می‌کند، بعد `cap sync` می‌زند (یعنی `copy` + `update`).

ساخت APK مستقیم از ترمینال (بدون Android Studio):

```bash
npm run cap:apk            # خروجی debug
npm run cap:apk:release    # خروجی release امضاشده ← برای نصب روی گوشی و فروشگاه
```

هر دو دستور خودشان به ترتیب `vite build` → `prune-cap-dist` → `cap sync` → `gradlew` را اجرا می‌کنند.
اولین بار ۲-۳ دقیقه (دانلود کتابخانه‌ها) و بارهای بعدی حدود ۲۰ ثانیه طول می‌کشد. خروجی:

```
android/app/build/outputs/apk/release/ravand-release-v1.0.apk   ← امضاشده با کلید اختصاصی
android/app/build/outputs/apk/debug/ravand-debug-v1.0.apk
```

**امضای نسخهٔ release:** کلید در `android/app/ravand-release.jks` است و رمز/alias آن در
`android/keystore.properties` (هر دو داخل `android/` که در `.gitignore` است). **این دو فایل را
حتماً نگه دار** — اگر گم شوند دیگر نمی‌شود روی نسخهٔ قبلی اپ در گوشی‌ها آپدیت زد. چون زیر
پوشهٔ OneDrive هستند، نسخهٔ ابری هم دارند؛ یک کپی دستی جدا هم بگیر.

> برای تست سریع: `npm run cap:sync` بعد `npm run cap:android` (باز کردن Android Studio) همچنان
> کار می‌کند، ولی برای گرفتن فایل APK لازم نیست.

---

# بخش ۴ — گذاشتن فایل‌ها روی سایت

بعد از اینکه فایل‌ها ساخته شد، کافی است آن‌ها را با این نام‌ها در پوشهٔ زیر کپی کنی:

```
public/downloads/Ravand-Setup.exe
public/downloads/Ravand.apk
```

سپس `npm run build` بزن. سایت به‌صورت خودکار لینک دانلود را نشان می‌دهد.

تا وقتی این فایل‌ها ساخته نشده‌اند، کارت دانلود در صفحهٔ `/download` نمایش داده می‌شود ولی کلیک روی آن خطای ۴۰۴ می‌دهد — این طبیعی است و در خود صفحه هم نوشته شده.

---

# مشکلات رایج

**`cargo` شناخته نمی‌شود** → ترمینال را ببند و دوباره باز کن.

**`link.exe not found`** → Visual Studio Build Tools درست نصب نشده. دوباره باز کن و کامپوننت MSVC را تیک بزن.

**`JAVA_HOME is not set`** → مرحلهٔ ۲.۲ را کامل کن.

**`Unsupported class file major version 69`** → سیستم Java 25 دارد ولی Gradle 8.14 تا Java 24 را می‌شناسد.
`android/gradle.properties` را ببین؛ باید `org.gradle.java.home` به یک **JDK 21** اشاره کند
(الان روی `C:/Users/meraj/.jdks/jdk-21.0.12.1+1` تنظیم است — JDK 21 را جداگانه دانلود کردم).

**`Unable to delete directory ... outputs/apk/debug`** → یک پروسه هنوز فایل APK قدیمی را باز نگه داشته
(معمولاً همگام‌ساز OneDrive یا یک پروسهٔ پایتون قدیمی). فایل `app-debug.apk` را پیدا و پاک کن، یا
یک ری‌استارت کافی است. نسخهٔ release این مشکل را ندارد.

**APK حدود ۱۰۰ مگابایت شده** → داری با `cap sync` خام می‌زنی و `dist/downloads/` (نصب‌کنندهٔ ویندوز)
داخل APK رفته. از `npm run cap:apk` / `npm run cap:apk:release` استفاده کن که `prune-cap-dist` را
قبلش اجرا می‌کند؛ خروجی باید حدود ۳-۴ مگابایت باشد.

**`SDK location not found`** → در Android Studio از منوی `File → Settings → Languages & Frameworks → Android SDK` مسیر SDK را بررسی کن.

**`Capacitor requires JDK 21`** → نسخهٔ JDK را از 17 به 21 ارتقا بده.

**خروجی خیلی دیر آماده می‌شود** → بار اول همیشه کند است چون باید کتابخانه‌ها کامپایل شوند. بارهای بعدی خیلی سریع‌تر است.

**اپ در apk سفید می‌ماند** → `npm run cap:sync` را نزدیکی. این دستور هم `vite build` می‌کند هم خروجی را به `android/` کپی می‌کند.

---

# خلاصهٔ دستورها

| کار | دستور |
|---|---|
| نصب وابستگی‌ها (یک بار) | `npm install` |
| تست اپ روی دسکتاپ | `npm run tauri:dev` |
| ساخت exe ویندوز | `npm run tauri:build` |
| ساخت پوشهٔ اندروید (یک بار) | `npx cap add android` |
| همگام‌سازی وب با اندروید | `npm run cap:sync` |
| باز کردن Android Studio | `npm run cap:android` |
| بیلد سایت برای انتشار | `npm run build` |
| **ساخت APK (debug)** | `npm run cap:apk` |
| **ساخت APK امضاشده (release)** | `npm run cap:apk:release` |
| فایل خروجی نصب‌پذیر | `android/app/build/outputs/apk/release/ravand-release-v1.0.apk` |
