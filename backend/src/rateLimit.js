// محدودکنندهٔ سادهٔ نرخ در حافظه — بدون وابستگی جدید.
// برای محافظت از مسیرهای حساس (ورود/ثبت‌نام/تغییر رمز) در برابر brute-force.
// توجه: حافظهٔ پروسه‌ای است؛ اگر چند instance روی Railway بالا باشد، هر کدام
// سهم خودش را می‌شمارد. برای این پروژه کافی است و جلوی حملهٔ ساده را می‌گیرد.

/** پنجرهٔ لغزان ساده: تا `max` درخواست در هر `windowMs` از یک کلید. */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, keyFn } = {}) {
  const hits = new Map() // key -> { count, reset }

  // پاک‌سازی دوره‌ای تا Map با کلیدهای قدیمی باد نکند
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
  }, windowMs).unref?.() ?? null

  return function limiter(req, res, next) {
    const key = (keyFn ? keyFn(req) : req.ip) || 'unknown'
    const now = Date.now()
    let e = hits.get(key)
    if (!e || e.reset <= now) { e = { count: 0, reset: now + windowMs }; hits.set(key, e) }
    e.count++
    if (e.count > max) {
      const retry = Math.ceil((e.reset - now) / 1000)
      res.set('Retry-After', String(retry))
      return res.status(429).json({ error: 'too-many-requests', retryAfter: retry })
    }
    next()
  }
}
