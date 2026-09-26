import React from 'react'

/*
 * پس‌زمینهٔ لکنتیک روند
 * ------------------------
 * سه خانهٔ لوگو که بی‌نهایت بالا می‌روند و محو می‌شوند — همان ایدهٔ
 * جدول روزها که نشانهٔ برند از آن آمده.
 *
 * این کار را ویدیوی پس‌زمینه می‌کند بدون اینکه هزینهٔ دانلود و
 * مصرف پردازنده داشته باشد، و ۱۰۰٪ متعلق به خودِ روند است.
 */

export default function KineticField() {
  // ستون‌های نور در چند نقطه، با تأخیر متفاوت
  const streaks = [
    { left: '12%', dur: 17, delay: 0 },
    { left: '28%', dur: 21, delay: -4 },
    { left: '72%', dur: 19, delay: -8 },
    { left: '88%', dur: 23, delay: -2 },
    { left: '46%', dur: 25, delay: -12 },
  ]

  return (
    <div className="rv-field" aria-hidden="true">
      {streaks.map((s, i) => (
        <span
          key={i}
          className="rv-streak"
          style={{ left: s.left, animationDuration: s.dur + 's', animationDelay: s.delay + 's' }}
        />
      ))}

      <span className="rv-step rv-step-1" style={{ insetInlineStart: '6%' }} />
      <span className="rv-step rv-step-2" style={{ insetInlineStart: '38%' }} />
      <span className="rv-step rv-step-3" style={{ insetInlineStart: '70%' }} />

      <span className="rv-core" />
      <span className="rv-veil" />
    </div>
  )
}
