import nodemailer from 'nodemailer'

function createTransport() {
  const host = process.env.EMAIL_SERVER_HOST
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD
  const port = parseInt(process.env.EMAIL_SERVER_PORT || '587')
  const secure = process.env.EMAIL_SERVER_SECURE === 'true'

  if (!host) return null

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

const FROM = process.env.EMAIL_FROM || 'HiTech Benchmark <noreply@hitechbenchmark.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hitechbenchmark.com'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transport = createTransport()
  if (!transport) {
    console.warn('[Email] EMAIL_SERVER_HOST not set — email skipped')
    return false
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html })
    return true
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}

export async function sendOtpEmail(email: string, otp: string) {
  return sendEmail({
    to: email,
    subject: 'Verify your HiTech Benchmark account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1e40af;margin-bottom:8px">Verify your email</h2>
        <p style="color:#6b7280;margin-bottom:24px">Enter this code to verify your HiTech Benchmark account:</p>
        <div style="background:#fff;border:2px solid #dbeafe;border-radius:8px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;font-family:monospace;letter-spacing:8px;color:#1e40af">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px">This code expires in 10 minutes. If you didn't register, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">HiTech Benchmark · <a href="${SITE}" style="color:#3b82f6">${SITE}</a></p>
      </div>
    `,
  })
}

export async function send2faEmail(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: 'Your HiTech Benchmark login code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1e40af;margin-bottom:8px">Login verification code</h2>
        <p style="color:#6b7280;margin-bottom:24px">Use this code to complete your sign-in:</p>
        <div style="background:#fff;border:2px solid #fde68a;border-radius:8px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;font-family:monospace;letter-spacing:8px;color:#d97706">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px">Expires in 5 minutes. If you didn't attempt to sign in, secure your account immediately.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">HiTech Benchmark · <a href="${SITE}" style="color:#3b82f6">${SITE}</a></p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmail({
    to: email,
    subject: 'Reset your HiTech Benchmark password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1e40af;margin-bottom:8px">Reset your password</h2>
        <p style="color:#6b7280;margin-bottom:24px">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px">If you didn't request this, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">HiTech Benchmark · <a href="${SITE}" style="color:#3b82f6">${SITE}</a></p>
      </div>
    `,
  })
}
