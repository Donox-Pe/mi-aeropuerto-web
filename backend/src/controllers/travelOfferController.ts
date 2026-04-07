import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';

const createOfferSchema = z.object({
  destination: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  originalPrice: z.number().positive(),
  discountPrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100),
  destinationCode: z.string().optional(),
});

const updateOfferSchema = createOfferSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export async function listOffers(_req: Request, res: Response) {
  const offers = await prisma.traveloffer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return res.json(offers);
}

export async function listActiveOffers(_req: Request, res: Response) {
  const offers = await prisma.traveloffer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(offers);
}

export async function getOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const offer = await prisma.traveloffer.findUnique({ where: { id } });
  if (!offer) return res.status(404).json({ message: 'Oferta no encontrada' });

  return res.json(offer);
}

export async function createOffer(req: Request, res: Response) {
  const parsed = createOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
  }

  // Verificar que discountPrice sea menor que originalPrice
  if (parsed.data.discountPrice && parsed.data.originalPrice) {
    if (parsed.data.discountPrice >= (parsed.data.originalPrice as number)) {
      return res.status(400).json({ message: 'El precio con descuento debe ser menor al precio original' });
    }
  }

  // Calcular el porcentaje de descuento si no coincide
  let finalDiscountPercent = parsed.data.discountPercent;
  if (parsed.data.originalPrice && parsed.data.discountPrice) {
    const calculatedDiscount = Math.round(
      ((parsed.data.originalPrice - parsed.data.discountPrice) / parsed.data.originalPrice) * 100
    );
    finalDiscountPercent = parsed.data.discountPercent || calculatedDiscount;
  }

  const offer = await prisma.traveloffer.create({
    data: {
      ...parsed.data,
      discountPercent: finalDiscountPercent || 0,
    } as any,
  });

  return res.status(201).json(offer);
}

export async function updateOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const parsed = updateOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
  }

  const existingOffer = await prisma.traveloffer.findUnique({ where: { id } });
  if (!existingOffer) return res.status(404).json({ message: 'Oferta no encontrada' });

  // Si se actualizan precios, validar
  if (parsed.data.discountPrice && parsed.data.originalPrice) {
    if (parsed.data.discountPrice >= parsed.data.originalPrice) {
      return res.status(400).json({ message: 'El precio con descuento debe ser menor al precio original' });
    }
  }

  const offer = await prisma.traveloffer.update({
    where: { id },
    data: parsed.data as any,
  });

  return res.json(offer);
}

export async function deleteOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const offer = await prisma.traveloffer.findUnique({ where: { id } });
  if (!offer) return res.status(404).json({ message: 'Oferta no encontrada' });

  await prisma.traveloffer.delete({ where: { id } });
  return res.status(204).send();
}


