import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { SocialMediaManager } from "@/lib/social-media-manager";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const body = await req.json();
        const { postId, commentId, replyText } = body;

        if (!postId || !commentId || !replyText?.trim()) {
            return NextResponse.json({ error: "postId, commentId, and replyText are required" }, { status: 400 });
        }

        // Verify ownership
        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const post = postDoc.data();
        if (post?.userId !== uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Post the reply through the correct platform
        const replyId = await SocialMediaManager.replyToComment(postId, uid, commentId, replyText.trim());

        return NextResponse.json({ success: true, replyId });

    } catch (error: any) {
        console.error("Post Reply Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
