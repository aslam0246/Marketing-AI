import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const data = await req.json();

        // Validate data (basic check)
        if (!data.businessName || !data.industry) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Save to 'startups' collection with user ID as document ID
        await adminDb.collection("startups").doc(uid).set({
            ...data,
            userId: uid,
            createdAt: new Date().toISOString(),
            email: decodedToken.email,
        });

        return NextResponse.json({ success: true, id: uid });
    } catch (error) {
        console.error("Error creating startup:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
