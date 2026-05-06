import { Router } from 'express';
import {
  login,
  register,
  setup2FA,
  verify2FA,
  validate2FA,
  disable2FA,
  get2FAStatus,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
  resendVerification,
  testEmail,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authRateLimiter, resetRateLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../schemas/index.js';

const router = Router();

// Auth básica
router.get('/me', requireAuth, getMe);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/test-email', testEmail);

// 2FA - requiere estar autenticado (excepto validate que es parte del login)
router.post('/2fa/setup', requireAuth, setup2FA);
router.post('/2fa/verify', requireAuth, verify2FA);
router.post('/2fa/validate', authRateLimiter, validate2FA); // No requiere auth, es parte del login
router.post('/2fa/disable', requireAuth, disable2FA);
router.get('/2fa/status', requireAuth, get2FAStatus);

// Recuperación de contraseña
router.post('/forgot-password', resetRateLimiter, forgotPassword);
router.post('/reset-password', resetRateLimiter, resetPassword);

export default router;
