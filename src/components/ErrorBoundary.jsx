import React, { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  // بدون این، خطا فقط نمایش داده می‌شد و در کنسول چیزی ثبت نمی‌شد،
  // پس پیدا کردنش سخت بود.
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info?.componentStack) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 520, margin: '80px auto', fontFamily: "'Vazirmatn', sans-serif", textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>خطایی رخ داد</h1>
          <p style={{ fontSize: 14, color: '#999', wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn" style={{ marginTop: 18 }} onClick={() => location.reload()}>تلاش دوباره</button>
        </div>
      )
    }
    return this.props.children
  }
}
