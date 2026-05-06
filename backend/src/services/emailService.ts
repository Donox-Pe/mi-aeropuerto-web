import nodemailer from 'nodemailer';

let transporter: any = null;

function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST) {
    console.warn('⚠️ SMTP_HOST no definido. El servicio de correo no funcionará.');
    return null;
  }

  const port = Number(SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465 || SMTP_SECURE === 'true',
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

type Attachment = { filename: string; content: Buffer };

export async function sendTicketEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error('❌ Error de configuración SMTP:', { SMTP_HOST, SMTP_USER, hasPass: !!SMTP_PASS, SMTP_FROM });
    throw new Error('SMTP no configurado correctamente en el servidor.');
  }

  const transport = getTransporter();
  if (!transport) throw new Error('No se pudo inicializar el transportador SMTP.');

  try {
    const info = await transport.sendMail({
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


