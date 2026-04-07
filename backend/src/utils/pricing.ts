import { flight_categoria, seat_seatClass } from '@prisma/client';

/**
 * Calcula el precio de un vuelo según:
 * - Tipo de vuelo (categoría: BASIC, PRIVATE, INTERNATIONAL)
 * - Clase de asiento (ECONOMY, PREMIUM, FIRST)
 */
export function calculatePrice(categoria: flight_categoria, seatClass: seat_seatClass): number {
  // Precios base en MXN según la tabla proporcionada
  const basePrices: Record<flight_categoria, Record<seat_seatClass, number>> = {
    BASIC: {
      ECONOMY: 12000,      // MXN 11,000-13,000 (promedio 12,000)
      PREMIUM: 15000,      // MXN 13,000-17,000 (promedio 15,000)
      FIRST: 29000,        // MXN 29,000 mínimo
    },
    PRIVATE: {
      ECONOMY: 765000,    // Vuelo privado mínimo
      PREMIUM: 765000,
      FIRST: 765000,
    },
    INTERNATIONAL: {
      ECONOMY: 14000,     // Ligeramente más caro que básico
      PREMIUM: 17000,      // Ligeramente más caro que básico
      FIRST: 35000,        // Más caro que básico
    },
  };

  return basePrices[categoria]?.[seatClass] || 0;
}

/**
 * Calcula el precio para un vuelo y asiento específicos
 */
export function getFlightPrice(
  categoria: flight_categoria,
  seatClass: seat_seatClass | null
): number {
  // Si no hay asiento, usar precio de clase económica
  const seat = seatClass || 'ECONOMY';
  return calculatePrice(categoria, seat);
}



