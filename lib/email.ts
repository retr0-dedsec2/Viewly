'use server'

import nodemailer from 'nodemailer'

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env

function getTransport() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('[email] SMTP credentials missing. Emails will be logged only.')
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

export async function sendTwoFactorCode(to: string, code: string) {
  const transporter = getTransport()
  const subject = 'Your Viewly verification code'
  const text = `Here is your one-time code: ${code}\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1115;padding:24px;font-family:Arial,sans-serif;color:#e5e7eb;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
          <tr>
            <td style="padding-bottom:12px;">
              <div style="font-size:16px;font-weight:600;color:#a5b4fc;">Viewly Security</div>
              <div style="font-size:24px;font-weight:700;color:#fff;margin-top:4px;">Your verification code</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <div style="font-size:15px;line-height:1.6;color:#d1d5db;">
                Use this one-time code to finish signing in. It expires in 10 minutes.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 20px;">
              <div style="display:inline-block;padding:14px 24px;background:#10b981;color:#0b0f12;font-size:24px;font-weight:700;letter-spacing:2px;border-radius:10px;">
                ${code}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <div style="font-size:13px;line-height:1.6;color:#9ca3af;">
                If you did not request this code, you can safely ignore this email.
              </div>
            </td>
          </tr>
        </table>
        <div style="margin-top:12px;font-size:12px;color:#6b7280;">
          Sent by Viewly · Security notification
        </div>
      </td>
    </tr>
  </table>
  `

  if (!transporter) {
    console.log(`[2FA] Code for ${to}: ${code}`)
    return
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || 'no-reply@viewly.local',
      to,
      subject,
      text,
      html,
    })
  } catch (error) {
    console.error('[email] Failed to send 2FA code:', error)
    throw new Error('EMAIL_SEND_FAILED')
  }
}
