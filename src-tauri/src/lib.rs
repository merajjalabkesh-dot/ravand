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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_in_browser])
        .run(tauri::generate_context!())
        .expect("error while running روند");
}
