import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { evaluateWeeklyStrategy } from "@/lib/agent/evaluator";

/**
 * POST /api/agent/evaluate
 * Triggers the weekly strategy evaluation for the authenticated user.
 * Only runs once per week per strategy (duplicate protection built-in).
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

        const result = await evaluateWeeklyStrategy(userId);

        return NextResponse.json({ success: true, result });
    } catch (err: any) {
        // Surface user-friendly messages for known cases
        const knownErrors = [
            "No active strategy found",
            "Strategy already evaluated this week",
        ];
        const isKnown = knownErrors.some(e => err.message?.includes(e));

        return NextResponse.json(
            { error: err.message || "Evaluation failed" },
            { status: isKnown ? 400 : 500 }
        );
    }
}
