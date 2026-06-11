import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const data = await req.json();

        if (!data.content || !data.topic) {
            return NextResponse.json({ error: "Missing content" }, { status: 400 });
        }

        // Save to 'posts' collection
        const docRef = await adminDb.collection("posts").add({
            ...data,
            userId: uid,
            status: data.status || "draft", // Use provided status or default to draft
            scheduledAt: data.scheduledAt || null, // Optional schedule time
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("Error creating post:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 });
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

        const snapshot = await adminDb.collection("posts")
            .where("userId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 });
    }
}
