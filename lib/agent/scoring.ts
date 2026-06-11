/**
 * scoring.ts
 * Computes the composite performance score used by both the Planner
 * (predicted) and the Evaluator (actual).
 *
 * compositeScore =
 *   (0.4 × normalizedEngagementScore) +
 *   (0.3 × engagementRate)             +
 *   (0.2 × growthRate)                 +
 *   (0.1 × consistencyScore)
 *
 * All inputs should be normalized 0–100.
 */

export interface CompositeInputs {
    /** Average engagement score of posts (0–100 normalized) */
    engagementScore: number;
    /** Engagement rate as a percentage (0–100) */
    engagementRate: number;
    /** Audience growth rate as a percentage (0–100, clamped) */
    growthRate: number;
    /** posts this week / recommended weekly posts, × 100 (0–100) */
    consistencyScore: number;
}

export interface CompositeResult {
    score: number;
    breakdown: CompositeInputs;
}

/** Weights for the composite score formula */
const WEIGHTS = {
    engagementScore: 0.4,
    engagementRate: 0.3,
    growthRate: 0.2,
    consistencyScore: 0.1,
} as const;

/**
 * Clamps a value between min and max.
 */
function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

/**
 * Normalizes a raw engagement score to 0–100 range
 * using a sliding scale based on typical social media metrics.
 * Tune MAX_SCORE as real data grows.
 */
export function normalizeEngagementScore(rawScore: number): number {
    const MAX_SCORE = 500; // 1000 likes, 300 comments, 200 shares at peak
    return clamp((rawScore / MAX_SCORE) * 100, 0, 100);
}

/**
 * Converts a fractional growth rate (e.g. 0.05 = 5% growth)
 * into a 0–100 normalized value.
 */
export function normalizeGrowthRate(fractionalRate: number): number {
    const MAX_GROWTH = 0.1; // 10% weekly growth = 100 score
    return clamp((fractionalRate / MAX_GROWTH) * 100, 0, 100);
}

/**
 * Computes the composite performance score.
 * All inputs must already be in 0–100 range.
 */
export function computeCompositeScore(inputs: CompositeInputs): CompositeResult {
    const normalizedInputs: CompositeInputs = {
        engagementScore: clamp(inputs.engagementScore, 0, 100),
        engagementRate: clamp(inputs.engagementRate, 0, 100),
        growthRate: clamp(inputs.growthRate, 0, 100),
        consistencyScore: clamp(inputs.consistencyScore, 0, 100),
    };

    const score = parseFloat((
        WEIGHTS.engagementScore * normalizedInputs.engagementScore +
        WEIGHTS.engagementRate * normalizedInputs.engagementRate +
        WEIGHTS.growthRate * normalizedInputs.growthRate +
        WEIGHTS.consistencyScore * normalizedInputs.consistencyScore
    ).toFixed(2));

    return { score, breakdown: normalizedInputs };
}

/**
 * Computes consistency score: postsThisWeek / recommendedWeeklyPosts × 100.
 * Clamped between 0 and 100.
 */
export function computeConsistencyScore(
    postsThisWeek: number,
    recommendedWeeklyPosts: number
): number {
    if (!recommendedWeeklyPosts) return 0;
    return clamp((postsThisWeek / recommendedWeeklyPosts) * 100, 0, 100);
}
