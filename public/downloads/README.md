# پوشه دانلود

فایل‌هایی که اینجا بگذاری، از سایت قابل دانلود می‌شوند:

| فایل | مسیر در سایت |
|---|---|
| `Ravand-Setup.exe` | `/downloads/Ravand-Setup.exe` |
| `ravand.apk` | `/downloads/ravand.apk` |
| `Ravand.dmg` (اختیاری، مک) | `/downloads/Ravand.dmg` |

نکته: `public/downloads/*.apk|*.exe|*.dmg` در `.gitignore` هستند — فایل جدید را باید با
`git add -f public/downloads/<file>` کامیت کنی، وگرنه روی سرور نمی‌رود و لینکش
بازنویسی HTML می‌شود (در حال حاضر فقط `ravand.apk` روی سایت مستقر است).
