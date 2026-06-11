import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { observeAllPosts } from "@/lib/agent/observer";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const enrichedPosts = await observeAllPosts(uid);

        return NextResponse.json({
            success: true,
            enrichedCount: enrichedPosts.length,
        });

    } catch (error: any) {
        console.error("Observer Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
