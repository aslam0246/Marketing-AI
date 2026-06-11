import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Fetch all published posts with metrics
        const postsRef = adminDb.collection("posts");
        const snapshot = await postsRef
            .where("userId", "==", uid)
            .where("status", "==", "published")
            .get();

        if (snapshot.empty) {
            return NextResponse.json({
                optimalTime: "10:00 AM",
                windows: ["09:00 AM", "01:00 PM", "06:00 PM"],
                message: "Not enough data yet. Using general best practices."
            });
        }

        // 2. Aggregate Reach by Hour
        const hourStats: Record<number, { reach: number, count: number }> = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.publishedAt || !data.metrics?.reach) return;

            const date = new Date(data.publishedAt);
            const hour = date.getHours();

            if (!hourStats[hour]) hourStats[hour] = { reach: 0, count: 0 };
            hourStats[hour].reach += data.metrics.reach;
            hourStats[hour].count += 1;
        });

        // 3. Calculate Average Reach per Hour
        const averages = Object.keys(hourStats).map(h => {
            const hour = parseInt(h);
            return {
                hour,
                avgReach: hourStats[hour].reach / hourStats[hour].count,
                label: `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`
            };
        });

        // 4. Sort and return top windows
        const sorted = averages.sort((a, b) => b.avgReach - a.avgReach);
        const topWindows = sorted.slice(0, 3).map(w => w.label);

        return NextResponse.json({
            optimalTime: topWindows[0] || "10:00 AM",
            windows: topWindows.length > 0 ? topWindows : ["09:00 AM", "01:00 PM", "06:00 PM"],
            message: "Based on your unique audience engagement history."
        });

    } catch (error: any) {
        console.error("Timing Engine Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
