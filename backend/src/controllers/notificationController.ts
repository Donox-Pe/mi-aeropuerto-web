import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

/**
 * GET /api/notifications
 * Listar notificaciones del usuario autenticado.
 */
export async function getNotifications(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user.sub } }),
  ]);

  return res.json({
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const count = await prisma.notification.count({
    where: { userId: req.user.sub, isRead: false },
  });

  return res.json({ count });
}

/**
 * PUT /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user.sub) {
    return res.status(404).json({ message: 'Notificación no encontrada' });
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return res.json({ message: 'Marcada como leída' });
}

/**
 * PUT /api/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  await prisma.notification.updateMany({
    where: { userId: req.user.sub, isRead: false },
    data: { isRead: true },
  });

  return res.json({ message: 'Todas las notificaciones marcadas como leídas' });
}
