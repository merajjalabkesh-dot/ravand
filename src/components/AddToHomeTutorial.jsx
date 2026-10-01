import { useEffect, useState } from 'react';

export default function AddToHomeTutorial({ onDismiss }) {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return shouldShowTutorial();
  });

  useEffect(() => {
    if (show) setShow(true);
  }, [show]);

  function shouldShowTutorial() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    return isIOS && isSafari && !isStandalone;
  }

  function handleDismiss() {
    onDismiss();
  }

  if (!show) return null;

  return (
    <div className="tutorial-backdrop" onClick={handleDismiss}>
      <div className="tutorial-card" onClick={e => e.stopPropagation()}>
        <div className="tutorial-icon">
          {/* Checkmark icon in teal circle */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#10B981"/>
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="tutorial-title">
          نصب نسخهٔ وب اپلیکیشن «روند»
        </h2>
        <div className="tutorial-divider"></div>
        <ol className="tutorial-steps">
          <li className="tutorial-step">
            در نوار پایین گوشی، <span className="tutorial-btn">#{shareIcon}</span> را انتخاب کنید.
          </li>
          <li className="tutorial-step">
            منوی باز شده را به بالا اسکرول کنید و <span className="tutorial-btn">افزودن به صفحه اصلی +</span> را انتخاب کنید.
          </li>
          <li className="tutorial-step">
            در بالای صفحه، <span className="tutorial-btn">افزودن</span> را انتخاب کنید.
          </li>
        </ol>
        <button className="tutorial-dismiss" onClick={handleDismiss}>
          متوجه شدم
        </div>
    </div>
  );
}

// Helper to render share icon inline
function shareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 4L12 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 12L12 16L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}