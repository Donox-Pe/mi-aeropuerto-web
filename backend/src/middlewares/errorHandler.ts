import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Manejo de errores específicos
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'fail',
      message: 'Error de validación',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'fail', message: 'Token inválido. Inicie sesión de nuevo.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'fail', message: 'Su sesión ha expirado. Inicie sesión de nuevo.' });
  }

  // Respuesta genérica
  console.error('💥 ERROR:', err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Algo salió mal en el servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
  });
};
