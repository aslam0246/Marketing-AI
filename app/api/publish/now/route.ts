
import { NextResponse } from "next/server";
import { SocialMediaManager } from "@/lib/social-media-manager";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

// This endpoint allows manual triggering of "Publish Now"
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const { postId } = await req.json();

        if (!postId) {
            return NextResponse.json({ error: "Post ID required" }, { status: 400 });
        }

        // Verify ownership before publishing
        const postDoc = await adminDb.collection("posts").doc(postId).get();
        if (!postDoc.exists || postDoc.data()?.userId !== uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Trigger Publish
        const result = await SocialMediaManager.publishPost(postId, uid);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Publish API Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
