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
  const text = `Your verification code is ${code}. It expires in 10 minutes.`

  if (!transporter) {
    console.log(`[2FA] Code for ${to}: ${code}`)
    return
  }

  await transporter.sendMail({
    from: EMAIL_FROM || 'no-reply@viewly.local',
    to,
    subject,
    text,
  })
}
