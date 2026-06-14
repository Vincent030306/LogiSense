import prisma from '../database/db.js';

/**
 * Update route memory aggregate based on a new outcome
 */
export async function updateRouteMemory(origin, destination, newDuration, newCost, tollUsed) {
  try {
    const existing = await prisma.routeMemory.findFirst({
      where: { origin, destination }
    });

    if (existing) {
      // Exponential moving average or simple average
      const tripCount = existing.trip_count + 1;
      const avgDuration = ((existing.avg_duration_min * existing.trip_count) + newDuration) / tripCount;
      const avgCost = ((existing.avg_cost * existing.trip_count) + newCost) / tripCount;

      await prisma.routeMemory.update({
        where: { id: existing.id },
        data: {
          avg_duration_min: avgDuration,
          avg_cost: avgCost,
          trip_count: tripCount
        }
      });
    } else {
      await prisma.routeMemory.create({
        data: {
          origin,
          destination,
          avg_duration_min: newDuration,
          avg_cost: newCost,
          toll_vs_nontoll: tollUsed ? 'toll' : 'nontoll',
          trip_count: 1
        }
      });
    }
  } catch (err) {
    console.error('Failed to update route memory:', err);
  }
}
