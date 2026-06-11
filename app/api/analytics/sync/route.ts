import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { SocialMediaManager } from "@/lib/social-media-manager";
import { observeAllPosts } from "@/lib/agent/observer";
import { saveFollowerSnapshot } from "@/lib/agent/follower-snapshot";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Fetch all published posts for this user
        const snapshot = await adminDb.collection("posts")
            .where("userId", "==", uid)
            .where("status", "==", "published")
            .get();

        // 2. Sync metrics for each post
        let syncedCount = 0;
        let failureCount = 0;

        if (!snapshot.empty) {
            const syncResults = await Promise.allSettled(
                snapshot.docs.map(doc => SocialMediaManager.syncPostMetrics(doc.id, uid))
            );
            syncedCount = syncResults.filter(r => r.status === "fulfilled").length;
            failureCount = syncResults.filter(r => r.status === "rejected").length;
        }

        // 3. Auto-save follower snapshots for each connected platform
        const connectionsRef = adminDb
            .collection("users").doc(uid)
            .collection("connections");

        const connectionsSnap = await connectionsRef.get();

        for (const connDoc of connectionsSnap.docs) {
            const platform = connDoc.id;    // "instagram" or "linkedin"
            const connData = connDoc.data();

            try {
                let followerCount = 0;

                if (platform === "instagram") {
                    const { InstagramConnector } = await import("@/lib/social/instagram");
                    const connector = new InstagramConnector(connData.igAccountId, connData.accessToken);
                    followerCount = await connector.getFollowerCount();
                } else if (platform === "linkedin") {
                    const { LinkedInConnector } = await import("@/lib/social/linkedin");
                    const connector = new LinkedInConnector(connData.linkedinId, connData.accessToken);
                    followerCount = await connector.getFollowerCount();
                }

                if (followerCount > 0) {
                    await saveFollowerSnapshot(uid, followerCount, platform);
                }
            } catch (e) {
                console.error(`[FOLLOWER-SNAPSHOT] Failed for ${platform}:`, e);
            }
        }

        // 4. Run Observer in background to re-score engagement
        observeAllPosts(uid).catch(err =>
            console.error("[AGENT-OBSERVER] Background enrichment failed:", err)
        );

        return NextResponse.json({
            success: true,
            syncedCount,
            failureCount
        });

    } catch (error: any) {
        console.error("Error syncing analytics:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

