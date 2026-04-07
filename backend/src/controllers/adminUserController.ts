import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';
import { hashPassword } from '../utils/hash.js';

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(users.map(u => ({ 
    id: u.id, 
    email: u.email, 
    fullName: u.fullName, 
    role: u.role, 
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    lastLogout: u.lastLogout
  })));
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'AGENT', 'PASSENGER']),
});

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  const { email, password, fullName, role } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'Email ya registrado' });
  const hashed = await hashPassword(password);
  const created = await prisma.user.create({ data: { email, password: hashed, fullName, role } });
  return res.status(201).json({ id: created.id });
}

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'AGENT', 'PASSENGER']).optional(),
});

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  const data: any = {};
  if (parsed.data.fullName) data.fullName = parsed.data.fullName;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.password) data.password = await hashPassword(parsed.data.password);
  const updated = await prisma.user.update({ where: { id }, data });
  return res.json({ id: updated.id });
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
}








