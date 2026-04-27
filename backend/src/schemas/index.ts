import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    firstName: z.string().min(2, 'Nombre demasiado corto'),
    lastName: z.string().min(2, 'Apellido demasiado corto'),
    phone: z.string().optional(),
  }),
});

export const flightSearchSchema = z.object({
  query: z.object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    date: z.string().optional(),
    passengers: z.string().optional().transform(v => v ? parseInt(v) : 1),
  }),
});
