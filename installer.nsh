; NSIS Custom Script for electron-builder
; Ensures all running instances are terminated before install / uninstall

!macro customInit
  nsExec::Exec 'taskkill.exe /F /T /IM Ravand.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM ravand.exe'
  Pop $0
!macroend

!macro customUnInstall
  nsExec::Exec 'taskkill.exe /F /T /IM Ravand.exe'
  Pop $0
  nsExec::Exec 'taskkill.exe /F /T /IM ravand.exe'
  Pop $0
  Sleep 500
!macroend
