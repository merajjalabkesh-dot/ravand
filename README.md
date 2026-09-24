# روند — اپ عادت‌ها و روزانه (React)

## نصب و اجرا

پروژه کامل است؛ فقط نیاز به نصب بسته‌هاست.

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. اجرای محیط توسعه (چند ثانیه بعد لینک می‌دهد، مثلاً http://localhost:5173)
npm run dev
```

## ساخت نسخه نهایی (اختیاری)
```bash
npm run build
```
خروجی در پوشه `dist/` قرار می‌گیرد.

## تغییر نام اپ
فایل `src/config/app.config.js` را باز کن و مقدار `APP_NAME` را عوض کن.

## ساختار
```
src/
  main.jsx          ورودی
  App.jsx           روتر + آنیمیشن بین صفحات
  components/Layout.jsx   سایدبار + هدر
  lib/store.jsx     داده (localStorage) + منطق جلالی/عادت/خواب
  pages/            همه ۸ صفحه
  styles/index.css  استایل (شیشه‌ای / دارک)
  config/app.config.js   برندینگ و نام اپ
```
