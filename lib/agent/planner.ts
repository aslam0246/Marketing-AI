import { adminDb } from "@/lib/firebase-admin";
import { AgentInsights } from "./analyzer";
import { getWeights } from "./weights";
import { computeCompositeScore, normalizeEngagementScore } from "./scoring";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORY_RATIOS: Record<string, Record<string, number>> = {
    promotional: { promotional: 0.5, educational: 0.2, engagement: 0.2, news: 0.1 },
    educational: { promotional: 0.2, educational: 0.5, engagement: 0.2, news: 0.1 },
    engagement: { promotional: 0.2, educational: 0.2, engagement: 0.5, news: 0.1 },
    news: { promotional: 0.2, educational: 0.3, engagement: 0.2, news: 0.3 },
};

export interface AgentStrategy {
    generatedAt: string;
    weeklyPostTarget: number;
    recommendedPostTimes: string[];
    contentMix: {
        promotional: number;
        educational: number;
        engagement: number;
        news: number;
    };
    recommendedTone: string;
    recommendedPlatform: string;
    recommendedHashtags: string[];
    reasoning: string[];
    confidence: number;
    predictedCompositeScore: number;
    appliedWeights?: {
        bestHourWeight: number;
        toneWeight: number;
    };
}

/**
 * Generates next best posting times based on bestHour + bestDayOfWeek.
 * Returns an array of 3 upcoming time slots.
 */
function generatePostTimes(bestHour: number, bestDayOfWeek: number): string[] {
    const slots: string[] = [];
    const today = new Date();
    const todayDay = today.getDay();

    // Build 3 upcoming slots: best day this/next week + 2 adjacent days
    const days = [bestDayOfWeek, (bestDayOfWeek + 2) % 7, (bestDayOfWeek + 4) % 7];
    for (const day of days) {
        const hourStr = `${bestHour.toString().padStart(2, "0")}:00`;
        slots.push(`${DAY_NAMES[day]} ${hourStr}`);
    }
    return slots;
}

/**
 * Builds human-readable reasoning strings from insights.
 */
function buildReasoning(insights: AgentInsights): string[] {
    const reasons: string[] = [];
    const { bestHour, bestTone, bestPlatform, bestContentCategory, recentTrend,
        toneBreakdown, platformBreakdown, categoryBreakdown, totalPostsAnalyzed } = insights;

    reasons.push(`Posts at ${bestHour}:00 have your highest average engagement score.`);

    if (bestTone && toneBreakdown[bestTone]) {
        const otherTones = Object.entries(toneBreakdown)
            .filter(([t]) => t !== bestTone)
            .sort(([, a], [, b]) => b - a);
        if (otherTones.length > 0) {
            const diff = ((toneBreakdown[bestTone] - otherTones[0][1]) / Math.max(otherTones[0][1], 1) * 100).toFixed(0);
            reasons.push(`Your "${bestTone}" tone outperforms others by ~${diff}% in engagement.`);
        } else {
            reasons.push(`"${bestTone}" is your most effective tone.`);
        }
    }

    if (bestPlatform && platformBreakdown[bestPlatform]) {
        const platforms = Object.keys(platformBreakdown);
        if (platforms.length > 1) {
            const otherPlatforms = Object.entries(platformBreakdown)
                .filter(([p]) => p !== bestPlatform)
                .sort(([, a], [, b]) => b - a);
            const diff = ((platformBreakdown[bestPlatform] - otherPlatforms[0][1]) / Math.max(otherPlatforms[0][1], 1) * 100).toFixed(0);
            reasons.push(`${bestPlatform} gives ~${diff}% better engagement than other platforms.`);
        } else {
            reasons.push(`Your content performs best on ${bestPlatform}.`);
        }
    }

    if (bestContentCategory) {
        reasons.push(`"${bestContentCategory}" posts drive the most engagement in your feed.`);
    }

    if (recentTrend === "up") reasons.push("Your engagement is trending upward — maintain current strategy momentum.");
    if (recentTrend === "down") reasons.push("Engagement dropped this week — try a fresh tone or topic to re-engage.");
    if (recentTrend === "stable") reasons.push("Engagement is stable — consider experimenting with posting time.");

    if (totalPostsAnalyzed < 5) {
        reasons.push("Low data confidence — post more content to improve recommendation accuracy.");
    }

    return reasons;
}

/**
 * Planner: Reads agent_insights for a user and generates a weekly strategy.
 * Applies adaptive weights, stores to agent_strategy and agent_strategies.
 */
export async function planStrategy(userId: string): Promise<AgentStrategy> {
    const insightDoc = await adminDb.collection("agent_insights").doc(userId).get();

    if (!insightDoc.exists) {
        throw new Error("No insights found. Run the Analyzer first.");
    }

    const insights = insightDoc.data() as AgentInsights;
    const { bestHour, bestDayOfWeek, bestTone, bestPlatform,
        bestContentCategory, topHashtags, confidence, totalPostsAnalyzed,
        avgEngagementScore, toneBreakdown, hourlyEngagement } = insights;

    // Fetch adaptive weights for this user
    const weights = await getWeights(userId);

    // Apply weights to hourly engagement to pick best weighted hour
    const weightedHours = hourlyEngagement.map((score, hour) => ({
        hour,
        weightedScore: score * weights.bestHourWeight,
    }));
    const bestWeightedHour = weightedHours.reduce(
        (best, cur) => (cur.weightedScore > best.weightedScore ? cur : best),
        weightedHours[0] || { hour: bestHour, weightedScore: 0 }
    ).hour;

    // Apply tone weight (scale avg score for the best tone)
    const bestWeightedTone = Object.entries(toneBreakdown || {})
        .map(([tone, score]) => ({ tone, weightedScore: score * weights.toneWeight }))
        .sort((a, b) => b.weightedScore - a.weightedScore)[0]?.tone || bestTone;

    // Weekly post target: scale with confidence
    const weeklyPostTarget = confidence >= 80 ? 5 : confidence >= 50 ? 4 : 3;

    const recommendedPostTimes = generatePostTimes(bestWeightedHour, bestDayOfWeek);

    // Content mix based on best category
    const contentMix = CATEGORY_RATIOS[bestContentCategory] || CATEGORY_RATIOS["promotional"];
    const contentMixPct = {
        promotional: Math.round(contentMix.promotional * 100),
        educational: Math.round(contentMix.educational * 100),
        engagement: Math.round(contentMix.engagement * 100),
        news: Math.round(contentMix.news * 100),
    };

    const reasoning = buildReasoning(insights);

    // Predicted composite score using current insights
    const normalizedEngScore = normalizeEngagementScore(avgEngagementScore || 0);
    const { score: predictedCompositeScore } = computeCompositeScore({
        engagementScore: normalizedEngScore,
        engagementRate: Math.min(insights.avgEngagementScore || 0, 100),
        growthRate: 0, // unknown at planning time
        consistencyScore: Math.min((totalPostsAnalyzed / weeklyPostTarget) * 100, 100),
    });

    const strategy: AgentStrategy = {
        generatedAt: new Date().toISOString(),
        weeklyPostTarget,
        recommendedPostTimes,
        contentMix: contentMixPct,
        recommendedTone: bestWeightedTone,
        recommendedPlatform: bestPlatform,
        recommendedHashtags: topHashtags.slice(0, 5),
        reasoning,
        confidence,
        predictedCompositeScore: parseFloat(predictedCompositeScore.toFixed(2)),
        appliedWeights: {
            bestHourWeight: weights.bestHourWeight,
            toneWeight: weights.toneWeight,
        },
    };

    // Write to legacy single-doc collection (for backward compat)
    await adminDb.collection("agent_strategy").doc(userId).set(strategy);

    // Write to queryable agent_strategies collection (for evaluator)
    await adminDb.collection("agent_strategies").add({
        ...strategy,
        userId,
        status: "active",
    });

    return strategy;
}
