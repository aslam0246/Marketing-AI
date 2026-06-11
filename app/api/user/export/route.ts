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

        // 1. Fetch Profile
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};

        // 2. Fetch Posts
        const postsSnap = await adminDb.collection("users").doc(uid).collection("posts").get();
        const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Fetch Connections (Basic info only)
        const connSnap = await adminDb.collection("users").doc(uid).collection("connections").get();
        const connections = connSnap.docs.map(doc => ({ platform: doc.id, connected: true }));

        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                uid: uid,
                email: decodedToken.email,
                profile: profile
            },
            content: {
                totalPosts: posts.length,
                posts: posts
            },
            integrations: connections
        };

        return NextResponse.json(exportData);
    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
