import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { analyzeUserPosts } from "@/lib/agent/analyzer";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const insights = await analyzeUserPosts(uid);

        return NextResponse.json({ success: true, insights });

    } catch (error: any) {
        console.error("Analyzer Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
