package app.ravand.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void startUpdate(PluginCall call) {
        String urlString = call.getString("url");
        if (urlString == null || urlString.trim().isEmpty()) {
            call.reject("آدرس فایل به‌روزرسانی نامعتبر است");
            return;
        }

        call.resolve();

        executor.execute(() -> {
            emitProgress("preparing", 0, 0, 0, null);
            try {
                File apkFile = downloadApk(urlString);
                emitProgress("installing", 100, apkFile.length(), apkFile.length(), null);
                launchInstaller(apkFile);
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : "خطای دانلود به‌روزرسانی";
                emitProgress("error", 0, 0, 0, errorMsg);
            }
        });
    }

    private File downloadApk(String fileUrl) throws Exception {
        Context context = getContext();
        File updateDir = new File(context.getCacheDir(), "updates");
        if (!updateDir.exists()) {
            updateDir.mkdirs();
        }

        File targetFile = new File(updateDir, "ravand-update.apk");
        if (targetFile.exists()) {
            targetFile.delete();
        }

        URL url = new URL(fileUrl);
        HttpURLConnection connection = openConnectionWithRedirects(url);

        int responseCode = connection.getResponseCode();
        if (responseCode < 200 || responseCode >= 300) {
            throw new Exception("کد پاسخ سرور: " + responseCode);
        }

        long totalSize = connection.getContentLengthLong();
        long downloaded = 0;
        int lastPercent = -1;
        long lastEmitTime = 0;

        try (InputStream in = connection.getInputStream();
             FileOutputStream out = new FileOutputStream(targetFile)) {

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
                downloaded += bytesRead;

                int percent = 0;
                if (totalSize > 0) {
                    percent = (int) ((downloaded * 100) / totalSize);
                }

                long now = System.currentTimeMillis();
                if (percent != lastPercent && (now - lastEmitTime > 150 || percent == 100)) {
                    lastPercent = percent;
                    lastEmitTime = now;
                    emitProgress("downloading", percent, downloaded, totalSize, null);
                }
            }
            out.flush();
        } finally {
            connection.disconnect();
        }

        return targetFile;
    }

    private HttpURLConnection openConnectionWithRedirects(URL url) throws Exception {
        int redirects = 0;
        HttpURLConnection conn = null;

        while (redirects < 5) {
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);
            conn.setRequestProperty("User-Agent", "RavandApp-Android");
            conn.connect();

            int code = conn.getResponseCode();
            if (code == HttpURLConnection.HTTP_MOVED_PERM ||
                code == HttpURLConnection.HTTP_MOVED_TEMP ||
                code == HttpURLConnection.HTTP_SEE_OTHER ||
                code == 307 || code == 308) {

                String newUrl = conn.getHeaderField("Location");
                if (newUrl != null) {
                    conn.disconnect();
                    url = new URL(newUrl);
                    redirects++;
                    continue;
                }
            }
            return conn;
        }

        throw new Exception("تعداد ریدایرکت‌های دانلود زیاد است");
    }

    private void launchInstaller(File apkFile) throws Exception {
        Context context = getContext();
        if (apkFile == null || !apkFile.exists()) {
            throw new Exception("فایل دانلودشده یافت نشد");
        }

        Uri apkUri = FileProvider.getUriForFile(
            context,
            context.getPackageName() + ".fileprovider",
            apkFile
        );

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        context.startActivity(intent);
    }

    private void emitProgress(String stage, int percent, long downloaded, long total, String error) {
        if (getActivity() == null) return;

        getActivity().runOnUiThread(() -> {
            try {
                JSObject detail = new JSObject();
                detail.put("stage", stage);
                detail.put("percent", percent);
                detail.put("downloaded", downloaded);
                detail.put("total", total);
                if (error != null) {
                    detail.put("error", error);
                }
                notifyListeners("appUpdateProgress", detail);

                if (getBridge() != null && getBridge().getWebView() != null) {
                    String escapedError = error != null ? "'" + error.replace("'", "\\'") + "'" : "null";
                    String js = String.format(
                        Locale.US,
                        "window.dispatchEvent(new CustomEvent('app-update-progress', { detail: { stage: '%s', percent: %d, downloaded: %d, total: %d, error: %s } }));",
                        stage,
                        percent,
                        downloaded,
                        total,
                        escapedError
                    );
                    getBridge().getWebView().evaluateJavascript(js, null);
                }
            } catch (Exception ignored) {}
        });
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        executor.shutdownNow();
    }
}
