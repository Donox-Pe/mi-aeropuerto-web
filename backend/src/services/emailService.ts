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
  port: Number(SMTP_PORT || 465),
  secure: SMTP_PORT === '465' || SMTP_SECURE === 'true', // True para 465, False para 587
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  tls: {
    rejectUnauthorized: false // Ayuda con problemas de certificados en algunos entornos
  }
});

type Attachment = { filename: string; content: Buffer };

export async function sendTicketEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error('❌ Error de configuración SMTP:', { SMTP_HOST, SMTP_USER, hasPass: !!SMTP_PASS, SMTP_FROM });
    throw new Error('SMTP no configurado. Revisa variables SMTP_* en .env');
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM_NAME ? `${SMTP_FROM_NAME} <${SMTP_FROM}>` : SMTP_FROM,
      to,
      subject,
      html,
      attachments,
    });
    console.log('✅ Correo enviado exitosamente:', info.messageId);
    return info;
  } catch (error: any) {
    console.error('❌ Error detallado al enviar correo:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
}


