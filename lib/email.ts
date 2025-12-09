'use server'

import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env

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
  const text = [
    'Hello,',
    '',
    `Here is your one-time code: ${code}`,
    'It expires in 10 minutes.',
    '',
    'If you did not request this email, you can safely ignore it.',
    '',
    'Thanks,',
    'The Viewly team',
  ].join('\n')

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1115;padding:24px;font-family:Arial,sans-serif;color:#e5e7eb;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#0f1621;border:1px solid #1f2937;border-radius:16px;padding:28px;">
          <tr>
            <td style="font-size:13px;color:#9ca3af;padding-bottom:8px;">Security verification</td>
          </tr>
          <tr>
            <td style="font-size:22px;font-weight:700;color:#fff;padding-bottom:6px;">Your Viewly code</td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:1.6;color:#d1d5db;padding-bottom:16px;">
              Use this one-time code to finish signing in. It expires in 10 minutes.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:18px;">
              <div style="display:inline-block;padding:14px 26px;background:#10b981;color:#0b0f12;font-size:24px;font-weight:700;letter-spacing:2px;border-radius:12px;">
                ${code}
              </div>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.6;color:#9ca3af;padding-bottom:12px;">
              If you did not request this email, you can safely ignore it. Your account stays secure.
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#9ca3af;padding-top:4px;">
              Thanks,<br/>The Viewly team
            </td>
          </tr>
        </table>
        <div style="margin-top:12px;font-size:12px;color:#6b7280;line-height:1.6;max-width:520px;">
          You are receiving this message because a login was requested for your account. This is not a marketing email.
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
