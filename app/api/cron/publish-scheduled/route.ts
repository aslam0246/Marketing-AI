import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { SocialMediaManager } from "@/lib/social-media-manager";

// IMPORTANT: In production, you would secure this endpoint using a secret token
// e.g. if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) return 401
// For local MVPs using client-side polling, we leave it open but rate-limited/safe.

export async function GET(req: Request) {
    console.log("[CRON] Checking for scheduled posts to publish...");

    try {
        const now = new Date().toISOString();

        // 1. Find posts where status is "scheduled" and scheduledAt <= now
        const snapshot = await adminDb.collection("posts")
            .where("status", "==", "scheduled")
            .where("scheduledAt", "<=", now)
            .get();

        if (snapshot.empty) {
            console.log("[CRON] No scheduled posts due for publishing right now.");
            return NextResponse.json({ message: "No posts due", count: 0 });
        }

        console.log(`[CRON] Found ${snapshot.size} post(s) to publish.`);

        const results = [];

        // 2. Loop through and trigger publish for each
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const postId = doc.id;
            const userId = data.userId;

            try {
                // The SocialMediaManager is now idempotent, so it's safe to call
                const result = await SocialMediaManager.publishPost(postId, userId);
                results.push({ postId, success: true, result });
            } catch (error: any) {
                console.error(`[CRON] Error publishing post ${postId}:`, error);

                // Note: SocialMediaManager already sets status to "failed" internally if it throws
                results.push({ postId, success: false, error: error.message });
            }
        }

        return NextResponse.json({
            message: `Processed ${snapshot.size} scheduled posts.`,
            count: snapshot.size,
            results
        });

    } catch (error: any) {
        console.error("[CRON] Failed to process scheduled posts:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
