import nodemailer from 'nodemailer';

type Attachment = { filename: string; content: Buffer };

// Siempre crea un transporter fresco (nunca cachea) para que los cambios
// de variables de entorno en Render tengan efecto inmediato.
function createTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌ Variables SMTP faltantes:', {
      SMTP_HOST: !!SMTP_HOST,
      SMTP_USER: !!SMTP_USER,
      SMTP_PASS: !!SMTP_PASS,
    });
    return null;
  }

  const port = Number(SMTP_PORT || 587);
  const secure = port === 465 || SMTP_SECURE === 'true';

  console.log(`📧 Iniciando SMTP: ${SMTP_HOST}:${port} secure=${secure} user=${SMTP_USER}`);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false }
  });
}

export async function sendTicketEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const { SMTP_FROM, SMTP_FROM_NAME } = process.env;

  const transport = createTransporter();
  if (!transport) {
    throw new Error('SMTP no configurado correctamente. Revisa SMTP_HOST, SMTP_USER y SMTP_PASS en las variables de entorno.');
  }

  try {
    const fromAddress = SMTP_FROM_NAME
      ? `${SMTP_FROM_NAME} <${SMTP_FROM || process.env.SMTP_USER}>`
      : (SMTP_FROM || process.env.SMTP_USER);

    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments,
    });
    console.log('✅ Correo enviado exitosamente:', info.messageId);
    return info;
  } catch (error: any) {
    console.error('❌ Error al enviar correo:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw error;
  }
}



