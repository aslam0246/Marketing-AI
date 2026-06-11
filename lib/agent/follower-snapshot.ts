import { adminDb } from "../firebase-admin";

/**
 * Saves a follower count snapshot for the user.
 * De-duplicates: if a snapshot already exists for TODAY, it updates it instead of creating a duplicate.
 */
export async function saveFollowerSnapshot(
    userId: string,
    followerCount: number,
    platform: string
) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const colRef = adminDb.collection("follower_snapshots");

    // Check if we already saved one today for this user + platform
    const existing = await colRef
        .where("userId", "==", userId)
        .where("platform", "==", platform)
        .where("date", "==", today)
        .limit(1)
        .get();

    if (!existing.empty) {
        // Update today's snapshot
        await existing.docs[0].ref.update({
            followerCount,
            recordedAt: new Date().toISOString()
        });
        console.log(`[FOLLOWER-SNAPSHOT] Updated today's snapshot for ${platform}: ${followerCount}`);
    } else {
        // Create a new one
        await colRef.add({
            userId,
            platform,
            followerCount,
            date: today,
            recordedAt: new Date().toISOString()
        });
        console.log(`[FOLLOWER-SNAPSHOT] Saved new snapshot for ${platform}: ${followerCount}`);
    }
}

/**
 * Fetches the latest follower snapshot for a user (most recent across all platforms).
 * Returns combined total, or per-platform if you want breakdown.
 */
export async function getLatestFollowerCount(userId: string): Promise<number> {
    const snapshot = await adminDb
        .collection("follower_snapshots")
        .where("userId", "==", userId)
        .orderBy("recordedAt", "desc")
        .limit(5)
        .get();

    if (snapshot.empty) return 0;

    // Sum up follower counts from all platforms from recent snapshots
    const seenPlatforms = new Set<string>();
    let total = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!seenPlatforms.has(data.platform)) {
            seenPlatforms.add(data.platform);
            total += data.followerCount || 0;
        }
    }
    return total;
}
