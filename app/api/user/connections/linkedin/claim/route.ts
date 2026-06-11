import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        const { state } = await req.json();
        if (!state) {
            return NextResponse.json({ error: "Missing state" }, { status: 400 });
        }

        // Read the pending connection saved by the OAuth callback
        const pendingRef = adminDb.collection("pending_connections").doc(state);
        const pendingSnap = await pendingRef.get();

        if (!pendingSnap.exists) {
            return NextResponse.json({ error: "Pending connection not found or expired" }, { status: 404 });
        }

        const data = pendingSnap.data()!;

        if (data.platform !== "linkedin") {
            return NextResponse.json({ error: "Wrong platform" }, { status: 400 });
        }

        // Move connection to the user's Firestore document
        await adminDb
            .collection("users")
            .doc(uid)
            .collection("connections")
            .doc("linkedin")
            .set({
                linkedinId: data.linkedinId,
                accessToken: data.accessToken,
                name: data.name,
                connectedAt: new Date().toISOString(),
            });

        // Clean up the temporary pending doc
        await pendingRef.delete();

        return NextResponse.json({ success: true, name: data.name });
    } catch (err: any) {
        console.error("LinkedIn claim error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
