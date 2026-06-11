import { adminDb } from "@/lib/firebase-admin";
import { ObservedPost } from "./observer";

export interface AgentInsights {
    updatedAt: string;
    totalPostsAnalyzed: number;
    bestHour: number;
    bestDayOfWeek: number;
    bestTone: string;
    bestPlatform: string;
    bestContentCategory: string;
    avgEngagementScore: number;
    topHashtags: string[];
    hourlyEngagement: number[];       // Index = hour 0–23
    toneBreakdown: Record<string, number>;
    platformBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    recentTrend: "up" | "down" | "stable";
    confidence: number;               // 0–100 based on sample size
}

/**
 * Groups an array of posts by a key function,
 * computing the average engagement score per group.
 */
function groupByAverage<T>(
    posts: T[],
    keyFn: (p: T) => string | number,
    scoreFn: (p: T) => number
): Record<string, number> {
    const groups: Record<string, { total: number; count: number }> = {};
    for (const post of posts) {
        const key = String(keyFn(post));
        if (!groups[key]) groups[key] = { total: 0, count: 0 };
        groups[key].total += scoreFn(post);
        groups[key].count++;
    }
    const result: Record<string, number> = {};
    for (const [key, { total, count }] of Object.entries(groups)) {
        result[key] = parseFloat((total / count).toFixed(2));
    }
    return result;
}

/**
 * Returns the key with the highest average score.
 */
function bestKey(breakdown: Record<string, number>): string {
    return Object.entries(breakdown)
        .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "unknown";
}

/**
 * Ranks hashtags by average engagement score across posts that contain them.
 */
function rankHashtags(posts: ObservedPost[]): string[] {
    const tagScores: Record<string, { total: number; count: number }> = {};
    for (const post of posts) {
        for (const tag of post.hashtags || []) {
            if (!tagScores[tag]) tagScores[tag] = { total: 0, count: 0 };
            tagScores[tag].total += post.engagementScore || 0;
            tagScores[tag].count++;
        }
    }
    return Object.entries(tagScores)
        .sort(([, a], [, b]) => (b.total / b.count) - (a.total / a.count))
        .slice(0, 10)
        .map(([tag]) => tag);
}

/**
 * Detects engagement trend by comparing last 7 days vs previous 7 days.
 */
function detectTrend(posts: ObservedPost[]): "up" | "down" | "stable" {
    const now = Date.now();
    const oneDay = 86400000;
    const last7 = posts.filter(p => {
        const ts = new Date(p.publishedAt).getTime();
        return ts >= now - 7 * oneDay;
    });
    const prev7 = posts.filter(p => {
        const ts = new Date(p.publishedAt).getTime();
        return ts >= now - 14 * oneDay && ts < now - 7 * oneDay;
    });

    const avg = (arr: ObservedPost[]) =>
        arr.length ? arr.reduce((s, p) => s + (p.engagementScore || 0), 0) / arr.length : 0;

    const lastAvg = avg(last7);
    const prevAvg = avg(prev7);

    if (prevAvg === 0) return "stable";
    const delta = ((lastAvg - prevAvg) / prevAvg) * 100;
    if (delta >= 5) return "up";
    if (delta <= -5) return "down";
    return "stable";
}

/**
 * Confidence score based on sample size.
 * < 3 posts = 10, < 5 = 30, < 10 = 60, < 20 = 80, 20+ = 100
 */
function computeConfidence(count: number): number {
    if (count < 3) return 10;
    if (count < 5) return 30;
    if (count < 10) return 60;
    if (count < 20) return 80;
    return 100;
}

/**
 * Analyzer: Reads all enriched posts for a user, detects patterns,
 * and writes agent_insights to Firestore.
 */
export async function analyzeUserPosts(userId: string): Promise<AgentInsights> {
    // Fetch all published + enriched posts
    const snapshot = await adminDb.collection("posts")
        .where("userId", "==", userId)
        .where("status", "==", "published")
        .get();

    const posts: ObservedPost[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ObservedPost))
        .filter(p => p.engagementScore !== undefined && p.publishedAt);

    const totalPostsAnalyzed = posts.length;
    const scoreFn = (p: ObservedPost) => p.engagementScore || 0;

    // Group breakdowns
    const hourlyMap = groupByAverage(posts, p => p.postHour ?? 0, scoreFn);
    const toneBreakdown = groupByAverage(posts, p => p.tone || "Unknown", scoreFn);
    const platformBreakdown = groupByAverage(posts, p => p.platform || "Unknown", scoreFn);
    const categoryBreakdown = groupByAverage(posts, p => p.contentCategory || "Unknown", scoreFn);

    // Build 24-slot hourly engagement array
    const hourlyEngagement: number[] = Array.from({ length: 24 }, (_, i) => hourlyMap[i] || 0);

    // Best performers
    const bestHour = parseInt(bestKey(hourlyMap));
    const bestDayMap = groupByAverage(posts, p => p.postDayOfWeek ?? 0, scoreFn);
    const bestDayOfWeek = parseInt(bestKey(bestDayMap));
    const bestTone = bestKey(toneBreakdown);
    const bestPlatform = bestKey(platformBreakdown);
    const bestContentCategory = bestKey(categoryBreakdown);
    const avgEngagementScore = totalPostsAnalyzed
        ? parseFloat((posts.reduce((s, p) => s + (p.engagementScore || 0), 0) / totalPostsAnalyzed).toFixed(2))
        : 0;

    const topHashtags = rankHashtags(posts);
    const recentTrend = detectTrend(posts);
    const confidence = computeConfidence(totalPostsAnalyzed);

    const insights: AgentInsights = {
        updatedAt: new Date().toISOString(),
        totalPostsAnalyzed,
        bestHour,
        bestDayOfWeek,
        bestTone,
        bestPlatform,
        bestContentCategory,
        avgEngagementScore,
        topHashtags,
        hourlyEngagement,
        toneBreakdown,
        platformBreakdown,
        categoryBreakdown,
        recentTrend,
        confidence,
    };

    // Write to Firestore
    await adminDb.collection("agent_insights").doc(userId).set(insights);

    return insights;
}
