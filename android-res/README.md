# فایل‌های منبع آیکون اندروید

این پوشه فقط **منبع** است و در بیلد استفاده نمی‌شود. `npx cap add android` پوشهٔ `android/`
را می‌سازد و آیکون‌های پیش‌فرض خودش را می‌گذارد. برای اینکه آیکون واقعی روند روی لانچر
دیده شود، بعد از ساخت `android/` این فایل‌ها را کپی کن.

## ۱. آیکون معمولی (برای همهٔ نسخه‌های اندروید)

از داخل پوشهٔ ریشهٔ پروژه:

```bash
cp android-res/mipmap-mdpi/ic_launcher.png     android/app/src/main/res/mipmap-mdpi/
cp android-res/mipmap-hdpi/ic_launcher.png     android/app/src/main/res/mipmap-hdpi/
cp android-res/mipmap-xhdpi/ic_launcher.png    android/app/src/main/res/mipmap-xhdpi/
cp android-res/mipmap-xxhdpi/ic_launcher.png   android/app/src/main/res/mipmap-xxhdpi/
cp android-res/mipmap-xxxhdpi/ic_launcher.png  android/app/src/main/res/mipmap-xxxhdpi/
```

## ۲. آیکون تطبیقی (adaptive icon، اندروید ۸ به بالا)

اگر می‌خواهی آیکون با پس‌زمینهٔ رنگی و شکل‌های مختلف لانچر خوب دیده شود، دو فایل
`ic_launcher_foreground.png` را هم کپی کن و یک فایل XML بساز.

**اول:** فایل‌های foreground را کنار بقیه بگذار:

```bash
cp android-res/mipmap-mdpi/ic_launcher_foreground.png     android/app/src/main/res/mipmap-mdpi/
cp android-res/mipmap-hdpi/ic_launcher_foreground.png     android/app/src/main/res/mipmap-hdpi/
cp android-res/mipmap-xhdpi/ic_launcher_foreground.png    android/app/src/main/res/mipmap-xhdpi/
cp android-res/mipmap-xxhdpi/ic_launcher_foreground.png   android/app/src/main/res/mipmap-xxhdpi/
cp android-res/mipmap-xxxhdpi/ic_launcher_foreground.png  android/app/src/main/res/mipmap-xxxhdpi/
```

**دوم:** فایل `android/app/src/main/res/values/colors.xml` را باز کن و این خط را
داخل `<resources>` اضافه کن (اگر هست، مقدارش را عوض کن):

```xml
<color name="ic_launcher_background">#070b18</color>
```

**سوم:** فایل‌های XML زیر را در هر پوشهٔ `mipmap-*` بگذار
(`android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`):

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
```

اندروید برای Adaptive Icon یک بوم ۱۰۸dp می‌خواهد و فقط وسط آن را نشان می‌دهد — به همین
دلیل `ic_launcher_foreground.png` کلی حاشیهٔ شفاف دارد. اگر حاشیه را حذف کنی، آیکون
هنگام ساخته شدن بریده می‌شود.

## ۳. تصویر فروشگاه

اگر روزی خواستی در کافه‌بازار یا گوگل‌پلی منتشر کنی، فایل `play-store-512.png`
همین پوشه همان فایلی است که باید آپلود شود.

| فایل | اندازه |
|---|---|
| `mipmap-mdpi/ic_launcher.png` | 48×48 |
| `mipmap-hdpi/ic_launcher.png` | 72×72 |
| `mipmap-xhdpi/ic_launcher.png` | 96×96 |
| `mipmap-xxhdpi/ic_launcher.png` | 144×144 |
| `mipmap-xxxhdpi/ic_launcher.png` | 192×192 |
| `ic_launcher_foreground.png` (هر چگالی) | ۲.۲۵ برابر اندازهٔ بالا، با حاشیهٔ شفاف |
| `play-store-512.png` | 512×512 |
