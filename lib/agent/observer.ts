import { adminDb } from "@/lib/firebase-admin";

export interface ObservedPost {
    id: string;
    content: string;
    platform: string;
    tone: string;
    publishedAt: string;
    metrics: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
    };
    contentCategory?: string;
    hashtags?: string[];
    postHour?: number;
    postDayOfWeek?: number;
    engagementScore?: number;
    engagementRate?: number;
}

/**
 * Computes engagement score for a post's metrics.
 * Formula: 0.5×likes + 0.3×comments + 0.2×shares
 */
export function computeEngagementScore(metrics: ObservedPost["metrics"]): number {
    return (
        0.5 * (metrics.likes || 0) +
        0.3 * (metrics.comments || 0) +
        0.2 * (metrics.shares || 0)
    );
}

/**
 * Computes engagement rate as a percentage of reach.
 */
export function computeEngagementRate(score: number, reach: number): number {
    if (!reach || reach === 0) return 0;
    return parseFloat(((score / reach) * 100).toFixed(2));
}

/**
 * Extracts hashtags from post content text.
 */
export function extractHashtags(content: string): string[] {
    const matches = content.match(/#[\w]+/g) || [];
    return [...new Set(matches.map(h => h.toLowerCase()))];
}

/**
 * Detects content category from content text (simple keyword heuristic).
 */
export function detectContentCategory(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes("sale") || lower.includes("discount") || lower.includes("offer") || lower.includes("buy") || lower.includes("launch")) {
        return "promotional";
    }
    if (lower.includes("tip") || lower.includes("how to") || lower.includes("guide") || lower.includes("learn") || lower.includes("fact")) {
        return "educational";
    }
    if (lower.includes("you") || lower.includes("what do you") || lower.includes("share") || lower.includes("comment") || lower.includes("tag")) {
        return "engagement";
    }
    return "news";
}

/**
 * Observer: Enriches a single post document in Firestore with
 * engagement scores, time slots, content category, and hashtags.
 */
export async function observePost(postId: string): Promise<ObservedPost | null> {
    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) return null;

    const post = postDoc.data() as any;
    if (!post.metrics || !post.publishedAt) return null;

    // Compute time fields
    const publishedDate = new Date(post.publishedAt);
    const postHour = publishedDate.getHours();
    const postDayOfWeek = publishedDate.getDay(); // 0=Sun, 6=Sat

    // Compute engagement scores
    const engagementScore = computeEngagementScore(post.metrics);
    const engagementRate = computeEngagementRate(engagementScore, post.metrics.reach);

    // Extract supplementary data
    const hashtags = extractHashtags(post.content || "");
    const contentCategory = post.contentCategory || detectContentCategory(post.content || "");

    const enrichment = {
        postHour,
        postDayOfWeek,
        engagementScore: parseFloat(engagementScore.toFixed(2)),
        engagementRate,
        hashtags,
        contentCategory,
        lastEnrichedAt: new Date().toISOString(),
    };

    // Write enrichment back to Firestore
    await postRef.update(enrichment);

    return { id: postId, ...post, ...enrichment };
}

/**
 * Observer: Enriches all published posts for a user.
 */
export async function observeAllPosts(userId: string): Promise<ObservedPost[]> {
    const snapshot = await adminDb.collection("posts")
        .where("userId", "==", userId)
        .where("status", "==", "published")
        .get();

    if (snapshot.empty) return [];

    const results = await Promise.allSettled(
        snapshot.docs.map(doc => observePost(doc.id))
    );

    return results
        .filter(r => r.status === "fulfilled" && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<ObservedPost>).value);
}
