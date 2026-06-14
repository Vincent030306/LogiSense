import prisma from '../database/db.js';

/**
 * Log a decision made by the system (e.g. rerouting)
 */
export async function logDecision(context, candidates, finalChoice, reasoning) {
  try {
    const dec = await prisma.decisionLog.create({
      data: {
        context: JSON.stringify(context),
        candidates: JSON.stringify(candidates),
        final_choice: finalChoice,
        reasoning: reasoning
      }
    });
    console.log(`🧠 Decision logged: ${dec.id}`);
    return dec;
  } catch (err) {
    console.error('Failed to log decision:', err);
  }
}
