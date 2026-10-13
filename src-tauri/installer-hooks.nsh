; NSIS Custom Hooks for Tauri Installer and Uninstaller
; Ensures all application and background/webview child processes are cleanly terminated

!macro NSIS_HOOK_PREINSTALL
  ; Force terminate running instances before install or update so files are not locked
  nsExec::Exec 'taskkill.exe /F /T /IM habitick.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM Habitick.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM ravand.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM Ravand.exe'
  Pop $0
  Sleep 500
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Force terminate all running instances and child processes (WebView2, renderer, etc.) before uninstallation
  nsExec::Exec 'taskkill.exe /F /T /IM habitick.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM Habitick.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM ravand.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM Ravand.exe'
  Pop $0
  Sleep 500
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Post-uninstall hook
!macroend
