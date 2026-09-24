// Gmail/SMTP mailer for OTP codes (nodemailer).
import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: +(process.env.SMTP_PORT || 587),
    secure: +(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return transporter
}

export async function sendOtpEmail(to, code) {
  const tr = getTransporter()
  if (!tr) return { error: 'SMTP not configured' }
  try {
    await tr.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'کد ورود به روند',
      text: `کد ورود شما: ${code}\n\nاین کد تا ۱۰ دقیقه معتبر است.`,
      html: `<div dir="rtl" style="font-family:Tahoma;background:#0a0f1f;color:#e7f6ff;padding:24px;border-radius:16px">
        <h2 style="margin:0 0 12px">روند 🌱</h2>
        <p>کد ورود شما:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#12203c;padding:12px 20px;border-radius:12px;display:inline-block">${code}</div>
        <p style="margin-top:16px;color:#9fc0e8;font-size:13px">این کد تا ۱۰ دقیقه معتبر است.</p>
      </div>`,
    })
    return { ok: true }
  } catch (e) {
    console.error('mailer error', e.message)
    return { error: e.message }
  }
}