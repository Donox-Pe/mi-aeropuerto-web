import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';

const APP_NAME = process.env.TWO_FACTOR_APP_NAME || 'AeroAzteca';

/**
 * Genera un secreto TOTP y la URI para QR.
 */
export function generateTOTPSecret(email: string) {
  const secret = new Secret({ size: 20 });

  const totp = new TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Genera imagen QR como data URL.
 */
export async function generateQRDataURL(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/**
 * Valida un código TOTP de 6 dígitos contra el secreto.
 * Permite ventana de ±1 período (30s) para compensar relojes.
 */
export function verifyTOTPToken(secretBase32: string, token: string): boolean {
  const secret = Secret.fromBase32(secretBase32);

  const totp = new TOTP({
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  // delta devuelve null si falla, o el número de ventanas de diferencia
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
