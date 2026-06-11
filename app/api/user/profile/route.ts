
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

        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json(userDoc.data());
    } catch (error: any) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 });
    }
}
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

        // 1. Validate data
        if (!data.businessName || !data.industry) {
            return NextResponse.json({ error: "Business name and industry are required" }, { status: 400 });
        }

        // 2. Save to user's profile doc (merge: true to preserve hasLinkedIn/hasInstagram flags)
        await adminDb.collection("users").doc(uid).set({
            businessName: data.businessName,
            industry: data.industry,
            targetAudience: data.targetAudience || "",
            tone: data.tone || "Professional",
            website: data.website || "",
            updatedAt: new Date().toISOString(),
            onboardingCompleted: true
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving profile:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
