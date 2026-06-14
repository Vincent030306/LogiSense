import prisma from '../database/db.js';

/**
 * Log actual outcomes of a completed trip
 */
export async function logOutcome(shipmentId, actualDuration, actualDelay, actualFuel, actualToll, issues) {
  try {
    const out = await prisma.outcomeLog.create({
      data: {
        shipment_id: shipmentId,
        actual_duration: actualDuration,
        actual_delay: actualDelay,
        actual_fuel: actualFuel,
        actual_toll: actualToll,
        issues: issues || ''
      }
    });
    console.log(`📊 Outcome logged for shipment ${shipmentId}`);
    return out;
  } catch (err) {
    console.error('Failed to log outcome:', err);
  }
}
