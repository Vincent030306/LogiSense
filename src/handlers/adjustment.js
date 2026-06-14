import prisma from '../database/db.js';
import { ownerAgent } from '../agents/owner-agent.js';

/**
 * Handle new trip events (issues) and determine if adjustment is needed.
 */
export async function handleTripIssue(tripEvent) {
  // Check if issue requires adjustment
  // Example logic: any delay > 60 mins might need rerouting
  if (tripEvent.delay_mins > 60 || tripEvent.event_type === 'issue') {
    
    // Check conflicts
    // E.g. find if there is another shipment assigned to this driver that will be delayed
    const conflicts = await prisma.shipment.findMany({
      where: {
        status: 'new', // pending assignments that might be affected
        // in a real app, we check schedules
      }
    });

    if (conflicts.length > 0) {
      // System generate suggestion
      const context = {
        issue: tripEvent.description,
        driver: tripEvent.driver_id,
        shipment: tripEvent.shipment_id,
        delay: tripEvent.delay_mins
      };

      const suggestionMsg = await ownerAgent.formatReroutingApproval(context);

      // Create pending adjustment
      const adj = await prisma.pendingAdjustment.create({
        data: {
          shipment_id: tripEvent.shipment_id,
          reason: tripEvent.description || 'Unknown issue',
          suggestion: suggestionMsg
        }
      });

      // Notify Owner Dashboard (via WebSocket or DB polling)
      console.log('⚠️ Pending Adjustment Created:', adj.id);
      
      return adj;
    }
  }
  return null;
}

export async function processAdminApproval(adjustmentId, decision, reason) {
  const adj = await prisma.pendingAdjustment.update({
    where: { id: adjustmentId },
    data: { status: decision }
  });

  await prisma.adminApproval.create({
    data: {
      adjustment_id: adjustmentId,
      decision: decision,
      reason: reason || ''
    }
  });

  if (decision === 'approved') {
    // Execute changes, update shipments, notify driver via Telegram
    console.log('✅ Adjustment Approved, executing changes for shipment:', adj.shipment_id);
    // bot.sendMessage(driverId, 'Rute Anda telah dialihkan...');
  } else {
    console.log('❌ Adjustment Rejected');
  }
}
