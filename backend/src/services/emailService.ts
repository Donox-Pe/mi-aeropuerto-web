import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_FROM_NAME,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: SMTP_SECURE === 'true',
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

type Attachment = { filename: string; content: Buffer };

export async function sendTicketEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('SMTP no configurado. Revisa variables SMTP_* en .env');
  }

  await transporter.sendMail({
    from: SMTP_FROM_NAME ? `${SMTP_FROM_NAME} <${SMTP_FROM}>` : SMTP_FROM,
    to,
    subject,
    html,
    attachments,
  });
}


