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

        const { platform } = await req.json();
        if (!platform || !["instagram", "linkedin"].includes(platform)) {
            return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
        }

        await adminDb
            .collection("users")
            .doc(uid)
            .collection("connections")
            .doc(platform)
            .delete();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Disconnect error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
