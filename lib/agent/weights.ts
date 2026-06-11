/**
 * weights.ts
 * Manages adaptive weights for the Strategy Agent.
 * Weights are stored per-user in Firestore: adaptive_weights/{userId}
 *
 * Each weight multiplies raw Analyzer scores when the Planner picks
 * the best hour, tone, platform, and category.
 * Default: 1.0 (neutral). Range: 0.5–1.5.
 */

import { adminDb } from "@/lib/firebase-admin";

export interface AdaptiveWeights {
    userId: string;
    bestHourWeight: number;
    toneWeight: number;
    platformWeight: number;
    categoryWeight: number;
    lastUpdated: string;
    updateCount: number;
    consecutiveUnderperformances: number;
}

const DEFAULTS: Omit<AdaptiveWeights, "userId" | "lastUpdated"> = {
    bestHourWeight: 1.0,
    toneWeight: 1.0,
    platformWeight: 1.0,
    categoryWeight: 1.0,
    updateCount: 0,
    consecutiveUnderperformances: 0,
};

const WEIGHT_MIN = 0.5;
const WEIGHT_MAX = 1.5;
const MAX_DELTA_PER_CYCLE = 0.1; // ±10% cap

/** Clamps a weight between 0.5 and 1.5 */
export function clampWeight(val: number): number {
    return Math.min(Math.max(parseFloat(val.toFixed(3)), WEIGHT_MIN), WEIGHT_MAX);
}

/**
 * Retrieves adaptive weights for a user.
 * Creates defaults if none exist.
 */
export async function getWeights(userId: string): Promise<AdaptiveWeights> {
    const ref = adminDb.collection("adaptive_weights").doc(userId);
    const snap = await ref.get();

    if (snap.exists) {
        return snap.data() as AdaptiveWeights;
    }

    // First-time defaults
    const defaults: AdaptiveWeights = {
        userId,
        ...DEFAULTS,
        lastUpdated: new Date().toISOString(),
    };
    await ref.set(defaults);
    return defaults;
}

/**
 * Updates adaptive weights based on performanceDelta.
 *
 * Rules:
 *   delta < -10  → decrease hour and tone weights
 *   delta > +10  → increase hour and tone weights
 *   2 consecutive underperformances → reset all to 1.0
 */
export async function updateWeights(
    userId: string,
    performanceDelta: number
): Promise<AdaptiveWeights> {
    const current = await getWeights(userId);
    let {
        bestHourWeight,
        toneWeight,
        platformWeight,
        categoryWeight,
        consecutiveUnderperformances,
        updateCount,
    } = current;

    const isUnderperforming = performanceDelta < -10;
    const isOverperforming = performanceDelta > 10;

    // Track consecutive underperformances
    if (isUnderperforming) {
        consecutiveUnderperformances += 1;
    } else {
        consecutiveUnderperformances = 0;
    }

    // Safety: reset after 2 consecutive underperformances
    if (consecutiveUnderperformances >= 2) {
        bestHourWeight = 1.0;
        toneWeight = 1.0;
        platformWeight = 1.0;
        categoryWeight = 1.0;
        consecutiveUnderperformances = 0;
    } else if (isUnderperforming) {
        bestHourWeight = clampWeight(bestHourWeight - 0.1);
        toneWeight = clampWeight(toneWeight - 0.05);
    } else if (isOverperforming) {
        bestHourWeight = clampWeight(bestHourWeight + 0.1);
        toneWeight = clampWeight(toneWeight + 0.05);
    }

    const updated: AdaptiveWeights = {
        userId,
        bestHourWeight,
        toneWeight,
        platformWeight,
        categoryWeight,
        consecutiveUnderperformances,
        updateCount: updateCount + 1,
        lastUpdated: new Date().toISOString(),
    };

    await adminDb.collection("adaptive_weights").doc(userId).set(updated);

    // Log each weight update for audit trail
    await adminDb.collection("weight_update_logs").add({
        userId,
        performanceDelta,
        before: current,
        after: updated,
        loggedAt: new Date().toISOString(),
    });

    return updated;
}

/**
 * Resets weights to baseline 1.0 manually (e.g. user request).
 */
export async function resetWeights(userId: string): Promise<AdaptiveWeights> {
    const reset: AdaptiveWeights = {
        userId,
        ...DEFAULTS,
        lastUpdated: new Date().toISOString(),
    };
    await adminDb.collection("adaptive_weights").doc(userId).set(reset);
    return reset;
}
