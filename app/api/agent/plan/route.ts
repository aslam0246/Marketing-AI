import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { planStrategy } from "@/lib/agent/planner";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const strategy = await planStrategy(uid);

        return NextResponse.json({ success: true, strategy });

    } catch (error: any) {
        console.error("Planner Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const { adminDb } = await import("@/lib/firebase-admin");
        const [insightDoc, strategyDoc] = await Promise.all([
            adminDb.collection("agent_insights").doc(uid).get(),
            adminDb.collection("agent_strategy").doc(uid).get(),
        ]);

        return NextResponse.json({
            insights: insightDoc.exists ? insightDoc.data() : null,
            strategy: strategyDoc.exists ? strategyDoc.data() : null,
        });

    } catch (error: any) {
        console.error("Plan Fetch Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
