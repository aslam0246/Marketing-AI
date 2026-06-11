import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getWeights, resetWeights } from "@/lib/agent/weights";

/**
 * GET /api/agent/weights
 * Returns the current adaptive weights for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const weights = await getWeights(userId);

        // Also fetch recent performance logs for UI display
        const logsSnap = await adminDb
            .collection("strategy_performance_logs")
            .where("userId", "==", userId)
            .orderBy("evaluatedAt", "desc")
            .limit(5)
            .get();

        const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({ weights, logs });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/agent/weights
 * Resets weights to baseline 1.0 (manual override).
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const { action } = await req.json();
        if (action !== "reset") {
            return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }

        const weights = await resetWeights(userId);
        return NextResponse.json({ success: true, weights });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
