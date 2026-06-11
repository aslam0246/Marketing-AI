/**
 * evaluator.ts
 * Weekly Strategy Evaluator Agent.
 *
 * Flow:
 * 1. Fetch the active strategy for a user.
 * 2. Aggregate actual post metrics from the strategy period.
 * 3. Compute actual composite score.
 * 4. Compare with predicted score → performance delta.
 * 5. Log result to strategy_performance_logs.
 * 6. Mark strategy as "completed".
 * 7. Update adaptive weights.
 */

import { adminDb } from "@/lib/firebase-admin";
import {
    computeCompositeScore,
    computeConsistencyScore,
    normalizeEngagementScore,
    normalizeGrowthRate,
} from "./scoring";
import { updateWeights } from "./weights";
import { computeEngagementScore, computeEngagementRate } from "./observer";

export interface EvaluationResult {
    strategyId: string;
    predictedCompositeScore: number;
    actualCompositeScore: number;
    performanceDelta: number;
    breakdown: {
        engagementScore: number;
        engagementRate: number;
        growthRate: number;
        consistencyScore: number;
    };
    evaluatedAt: string;
    weightsUpdated: boolean;
}

/**
 * Fetches the latest follower count snapshot for a user.
 * Returns { current, previous } follower counts.
 */
async function getFollowerGrowth(userId: string): Promise<{ current: number; previous: number }> {
    const snaps = await adminDb
        .collection("follower_snapshots")
        .where("userId", "==", userId)
        .orderBy("recordedAt", "desc")
        .limit(2)
        .get();

    const docs = snaps.docs.map(d => d.data() as { followers: number; recordedAt: string });
    if (docs.length < 2) return { current: docs[0]?.followers ?? 0, previous: 0 };
    return { current: docs[0].followers, previous: docs[1].followers };
}

/**
 * Prevents duplicate evaluations by checking if a log already exists
 * for this strategy within the current week.
 */
async function alreadyEvaluatedThisWeek(strategyId: string): Promise<boolean> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const existing = await adminDb
        .collection("strategy_performance_logs")
        .where("strategyId", "==", strategyId)
        .where("evaluatedAt", ">=", oneWeekAgo.toISOString())
        .limit(1)
        .get();

    return !existing.empty;
}

/**
 * Core evaluation function.
 * Called once per week after a strategy period has elapsed.
 */
export async function evaluateWeeklyStrategy(userId: string): Promise<EvaluationResult> {
    // 1. Fetch the active strategy
    const stratSnap = await adminDb
        .collection("agent_strategies")
        .where("userId", "==", userId)
        .where("status", "==", "active")
        .orderBy("generatedAt", "desc")
        .limit(1)
        .get();

    if (stratSnap.empty) {
        throw new Error("No active strategy found. Run the Planner first.");
    }

    const stratDoc = stratSnap.docs[0];
    const strategy = stratDoc.data();
    const strategyId = stratDoc.id;

    // 2. Prevent duplicate evaluation
    if (await alreadyEvaluatedThisWeek(strategyId)) {
        throw new Error("Strategy already evaluated this week. Next evaluation available in 7 days.");
    }

    // 3. Fetch posts created during the strategy period
    const strategyStart = new Date(strategy.generatedAt);
    const postsSnap = await adminDb
        .collection("posts")
        .where("userId", "==", userId)
        .where("status", "==", "published")
        .where("createdAt", ">=", strategy.generatedAt)
        .get();

    const posts = postsSnap.docs.map(d => d.data() as any);
    const postsThisWeek = posts.length;

    // 4. Aggregate metrics
    let totalEngagementScore = 0;
    let totalReach = 0;

    for (const post of posts) {
        const metrics = post.metrics || { likes: 0, comments: 0, shares: 0, reach: 0 };
        const score = computeEngagementScore(metrics);
        totalEngagementScore += score;
        totalReach += metrics.reach || 0;
    }

    const avgRawEngagementScore = postsThisWeek > 0 ? totalEngagementScore / postsThisWeek : 0;
    const avgRawEngagementRate = postsThisWeek > 0
        ? computeEngagementRate(totalEngagementScore / postsThisWeek, totalReach / postsThisWeek)
        : 0;

    // 5. Follower growth
    const { current: currentFollowers, previous: prevFollowers } = await getFollowerGrowth(userId);
    const fractionalGrowth = prevFollowers > 0
        ? (currentFollowers - prevFollowers) / prevFollowers
        : 0;

    // 6. Consistency score
    const recommendedPosts = strategy.weeklyPostTarget || 4;
    const consistencyScore = computeConsistencyScore(postsThisWeek, recommendedPosts);

    // 7. Normalize all inputs
    const normalizedEngScore = normalizeEngagementScore(avgRawEngagementScore);
    const engagementRate = Math.min(avgRawEngagementRate, 100);
    const growthRate = normalizeGrowthRate(fractionalGrowth);

    // 8. Compute actual composite score
    const { score: actualCompositeScore, breakdown } = computeCompositeScore({
        engagementScore: normalizedEngScore,
        engagementRate,
        growthRate,
        consistencyScore,
    });

    const predictedCompositeScore = strategy.predictedCompositeScore ?? 50;
    const performanceDelta = parseFloat((actualCompositeScore - predictedCompositeScore).toFixed(2));

    const evaluatedAt = new Date().toISOString();

    // 9. Write performance log
    await adminDb.collection("strategy_performance_logs").add({
        strategyId,
        userId,
        actualEngagementScore: parseFloat(normalizedEngScore.toFixed(2)),
        actualEngagementRate: parseFloat(engagementRate.toFixed(2)),
        actualGrowthRate: parseFloat(growthRate.toFixed(2)),
        consistencyScore: parseFloat(consistencyScore.toFixed(2)),
        actualCompositeScore,
        predictedCompositeScore,
        performanceDelta,
        postsAnalyzed: postsThisWeek,
        evaluatedAt,
    });

    // 10. Mark strategy as completed
    await stratDoc.ref.update({ status: "completed", completedAt: evaluatedAt });

    // 11. Update adaptive weights based on delta
    const shouldUpdateWeights = Math.abs(performanceDelta) > 5;
    if (shouldUpdateWeights) {
        await updateWeights(userId, performanceDelta);
    }

    return {
        strategyId,
        predictedCompositeScore,
        actualCompositeScore,
        performanceDelta,
        breakdown,
        evaluatedAt,
        weightsUpdated: shouldUpdateWeights,
    };
}
