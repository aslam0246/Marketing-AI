import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { SocialMediaManager } from "@/lib/social-media-manager";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 1. Verify Ownership
        const postRef = adminDb.collection("posts").doc(id);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const post = postDoc.data();
        if (post?.userId !== uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch Comments
        const comments = await SocialMediaManager.getPostComments(id, uid);

        return NextResponse.json({ comments });
    } catch (error: any) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
