import React from 'react'

/** آیکون‌های خطی سایت — همه ۲۴×۲۴، stroke-based */
const S = ({ children, size = 22, fill = 'none', ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

export const IconCalendar = (p) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></S>
export const IconChart = (p) => <S {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx="1" /><rect x="12" y="8" width="3" height="10" rx="1" /><rect x="17" y="5" width="3" height="13" rx="1" /></S>
export const IconBook = (p) => <S {...p}><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" /><path d="M5 4a2 2 0 0 0-2 2v12" /><path d="M9 8h6M9 12h6" /></S>
export const IconMoon = (p) => <S {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="4" /></S>
export const IconBell = (p) => <S {...p}><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></S>
export const IconCloud = (p) => <S {...p}><path d="M17.5 19a4.5 4.5 0 0 0 .3-9A6.5 6.5 0 0 0 5.2 11 3.8 3.8 0 0 0 5.5 19z" /></S>

export const IconWindows = (p) => <S {...p}><path d="M3 5.5 10.5 4.3v7.2H3zM12 4.1 21 3v8.5h-9zM3 12.5h7.5v7.2L3 18.5zM12 12.5H21V21l-9-1.1z" /></S>
export const IconAndroid = (p) => <S {...p}><path d="M5 16V10a7 7 0 0 1 14 0v6" /><path d="M5 16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2H5z" /><path d="M9.5 5.2 8.4 3.4M14.5 5.2l1.1-1.8" /><circle cx="9.5" cy="12.5" r=".9" fill="currentColor" stroke="none" /><circle cx="14.5" cy="12.5" r=".9" fill="currentColor" stroke="none" /></S>
export const IconWeb = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" /></S>

export const IconDownload = (p) => <S {...p}><path d="M12 3v12" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 20h16" /></S>
export const IconCheck = (p) => <S {...p}><path d="M4 12.5 9 17.5 20 6.5" /></S>
export const IconX = (p) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
export const IconMinus = (p) => <S {...p}><path d="M5 12h14" /></S>
export const IconArrow = (p) => <S {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></S>
export const IconShield = (p) => <S {...p}><path d="M12 3 5 6v5.5c0 4.2 2.8 8.1 7 9.5 4.2-1.4 7-5.3 7-9.5V6z" /><path d="m9 12 2 2 4-4" /></S>
export const IconSparkle = (p) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8.5 13.6 12 12 15.5 10.4 12z" fill="currentColor" stroke="none" /></S>

/** جدول هر روز — همان نشانهٔ برند، در اندازهٔ آیکون */
export const IconGrid = (p) => (
  <S {...p} fill="currentColor" stroke="none">
    <rect x="3" y="16" width="5" height="5" rx="1.4" opacity="0.32" />
    <rect x="9.5" y="11" width="5" height="5" rx="1.4" opacity="0.6" />
    <rect x="16" y="6" width="5" height="5" rx="1.4" />
  </S>
)

/** نگاشت نام آیکون به کامپوننت */
export const ICONS = {
  grid: IconGrid,
  calendar: IconCalendar,
  chart: IconChart,
  book: IconBook,
  moon: IconMoon,
  bell: IconBell,
  cloud: IconCloud,
  windows: IconWindows,
  android: IconAndroid,
  web: IconWeb,
}

export default ICONS
