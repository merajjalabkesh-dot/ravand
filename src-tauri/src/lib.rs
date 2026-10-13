use std::io::{Read, Write};
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct UpdateProgressPayload {
    percent: u32,
    downloaded: u64,
    total: u64,
}

#[tauri::command]
fn open_in_browser(url: String) -> Result<(), String> {
    if !url.starts_with("https://") {
        return Err("Only HTTPS allowed".into());
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();
    }
    Ok(())
}

#[tauri::command]
async fn download_and_apply_update(window: tauri::Window, url: String) -> Result<(), String> {
    if !url.starts_with("https://") {
        return Err("Only HTTPS allowed".into());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let temp_dir = std::env::temp_dir();
        let installer_path = temp_dir.join("Habitick-Setup-Update.exe");

        let response = ureq::get(&url)
            .timeout(std::time::Duration::from_secs(180))
            .call()
            .map_err(|e| format!("Download request failed: {}", e))?;

        let total: u64 = response
            .header("content-length")
            .and_then(|v| v.parse().ok())
            .unwrap_or(0);

        let mut file = std::fs::File::create(&installer_path)
            .map_err(|e| format!("Failed to create temp installer file: {}", e))?;

        let mut reader = response.into_reader();
        let mut buf = [0u8; 32768];
        let mut downloaded: u64 = 0;
        let mut last_percent: u32 = 0;

        loop {
            let n = reader
                .read(&mut buf)
                .map_err(|e| format!("Failed to read stream: {}", e))?;
            if n == 0 {
                break;
            }
            file.write_all(&buf[..n])
                .map_err(|e| format!("Failed to write to file: {}", e))?;
            downloaded += n as u64;

            let percent = if total > 0 {
                ((downloaded * 100) / total).min(100) as u32
            } else {
                0
            };

            if percent != last_percent {
                last_percent = percent;
                let _ = window.emit(
                    "app-update-progress",
                    UpdateProgressPayload {
                        percent,
                        downloaded,
                        total,
                    },
                );
            }
        }

        file.flush()
            .map_err(|e| format!("Failed to flush file: {}", e))?;
        drop(file);

        let _ = window.emit(
            "app-update-progress",
            UpdateProgressPayload {
                percent: 100,
                downloaded,
                total: if total > 0 { total } else { downloaded },
            },
        );

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const DETACHED_PROCESS: u32 = 0x00000008;
            const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;

            let child = std::process::Command::new(&installer_path)
                .args(["/S", "/R"])
                .creation_flags(DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP)
                .spawn();

            if let Err(e) = child {
                return Err(format!("Failed to launch installer: {}", e));
            }

            // خروج تمیز پروسه فعلی پس از اجرای نصاب جهت اعمال بدون قفل فایل
            std::thread::sleep(std::time::Duration::from_millis(600));
            std::process::exit(0);
        }

        #[cfg(not(target_os = "windows"))]
        {
            Ok(())
        }
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_in_browser,
            download_and_apply_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running هبیتیک");
}
