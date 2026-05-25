type Attachment = { filename: string; content: Buffer };

export async function sendTicketEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const { APPS_SCRIPT_URL } = process.env;

  if (!APPS_SCRIPT_URL) {
    throw new Error('❌ APPS_SCRIPT_URL no configurada. Revisa las variables de entorno.');
  }

  try {
    console.log(`📧 Enviando correo a ${to} usando Apps Script...`);
    
    // Node.js 18+ incluye fetch nativo
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: 'AeroAztecaSecret123',
        to,
        subject,
        html,
        // Los attachments en Apps Script requieren codificación base64, 
        // pero para la recuperación de contraseña no se usan attachments,
        // así que los ignoramos por ahora para mantener el script simple.
      }),
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Apps Script Error: ${result.error}`);
    }

    console.log('✅ Correo enviado exitosamente por el puente de Google.');
    return result;
  } catch (error: any) {
    console.error('❌ Error al enviar correo:', {
      message: error.message,
    });
    throw error;
  }
}




