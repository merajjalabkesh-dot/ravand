# ساخت نسخه ویندوز (exe) و اندروید (apk)

این راهنما را کنار پروژه نگه دار. هر ابزار فقط **یک بار** نصب می‌شود و بعد از آن ساخت فایل‌ها خودکار است.

---

## چرا این کار را من (Claude) انجام نمی‌دهم؟

محیطی که در آن کار می‌کنم یک لینوکس ایزوله بدون گرافیک است و ابزارهای ساخت ویندوز و اندروید روی آن نصب نمی‌شوند (اندروید SDK حدود ۱۰ گیگابایت و Windows SDK هم هستند، ولی در محیط من قابل نصب نیستند).

پس تقسیم کار این‌طور است: **من کد و تنظیمات کامل را می‌نویسم، تو یک بار خروجی می‌گیری.**

---

# بخش ۱ — نسخه ویندوز با Tauri

Tauri فایل exe خیلی کوچکی می‌سازد (حدود ۵ مگابایت) چون از موتور وب سیستم استفاده می‌کند، نه یک مرورگر کامل مثل Electron.

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

## ۱.۳ نصب Tauri روی پروژه

ترمینال را در پوشهٔ پروژه باز کن و این دستورها را اجرا کن:

```bash
npm install
npm install -D @tauri-apps/cli
npx tauri init
```

در `tauri init` این مقادیر را بده:

| سؤال | جواب |
|---|---|
| App name | `Ravand` |
| Window title | `روند` |
| Web assets location | `../dist` |
| Frontend dev URL | `http://localhost:5173` |
| Frontend build command | `npm run build` |
| Dev host | *(خالی بگذار)* |

---

# بخش ۲ — نسخه اندروید با Capacitor

## ۲.۱ نصب Android Studio

۱. به آدرس <https://developer.android.com/studio> برو.
۲. **Download Android Studio** را بزن.
۳. فایل نصب را باز کن و مراحل را برو. مسیر پیش‌فرض نصب خوب است.
۴. بعد از نصب، Android Studio برای اولین بار باز می‌شود و **Setup Wizard** اجرا می‌شود. اجازه بده **Standard** نصب کند.
۵. نصب کامل می‌شود. این مرحله حدود ۵ گیگابایت دانلود دارد.

## ۲.۲ فعال کردن JDK

اگر JDK روی سیستم نصب نیست:

۱. به آدرس <https://adoptium.net> برو.
۲. **JDK 17** را دانلود و نصب کن (نسخه LTS).
۳. متغیر محیطی `JAVA_HOME` را تنظیم کن:
   - کلید ویندوز را بزن، `Environment Variables` را جستجو کن.
   - در `System variables` روی **New** بزن.
   - نام: `JAVA_HOME`
   - مقدار: مسیر نصب JDK، مثلاً `C:\Program Files\Eclipse Adoptium\jdk-17.0.11`
   - در `Path` هم `%JAVA_HOME%\bin` را اضافه کن.
۴. ترمینال را ببند و دوباره باز کن و بزن:
   ```
   java -version
   ```

## ۲.۳ نصب Capacitor

در پوشهٔ پروژه:

```bash
npm install
npm install -D @capacitor/cli
npx cap init "Ravand" "app.ravand.ios" --web-dir=dist
npx cap add android
```

---

# بخش ۳ — ساخت خروجی

## ساخت exe ویندوز

```bash
npm run tauri build
```

خروجی در این مسیر ساخته می‌شود:
```
src-tauri/target/release/bundle/nsis/Ravand_1.0.0_x64-setup.exe
```

## ساخت apk اندروید

اول باید dist ساخته بشه:
```bash
npm run build
npx cap copy
npx cap sync
```

بعد پروژهٔ اندروید را باز کن:
```bash
npx cap open android
```

در Android Studio:
۱. از منوی بالا **Build → Build Bundle(s) / APK(s) → Build APK(s)** را بزن.
۲. صبر کن (اولین بیل ممکن است ۵-۱۰ دقیقه طول بکشد).
۳. پیام سبز «APK(s) generated successfully» می‌بینی.
۴. مسیر فایل خروجی در همان صفحه نوشته می‌شود، معمولاً:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

برای نسخهٔ نهایی که روی سایت می‌گذاریم، بهتر است **release** بسازی که نیاز به امضا دارد. راهنمای امضا را بعداً می‌دهم.

---

# بخش ۴ — گذاشتن فایل‌ها روی سایت

بعد از اینکه فایل‌ها ساخته شد، کافی است آن‌ها را با این نام‌ها در پوشهٔ زیر کپی کنی:

```
public/downloads/Ravand-Setup.exe
public/downloads/Ravand.apk
```

سپس `npm run build` بزن. سایت به‌صورت خودکار لینک دانلود را نشان می‌دهد.

---

# مشکلات رایج

**`cargo` شناخته نمی‌شود** → ترمینال را ببند و دوباره باز کن.

**`link.exe not found`** → Visual Studio Build Tools درست نصب نشده. دوباره باز کن و کامپوننت MSVC را تیک بزن.

**`JAVA_HOME is not set`** → مرحله ۲.۲ را کامل کن.

**`SDK location not found`** → در Android Studio از منوی `File → Settings → Languages & Frameworks → Android SDK` مسیر SDK را بررسی کن.

**خروجی خیلی دیر آماده می‌شود** → بار اول همیشه کند است چون باید کتابخانه‌ها کامپایل شوند. بارهای بعدی خیلی سریع‌تر است.
