
import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
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

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `posts/${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;

        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        console.log("[api/upload] Using bucket:", bucketName);

        if (!bucketName) {
            console.error("[api/upload] Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set");
            throw new Error("Storage bucket not configured");
        }

        const bucket = adminStorage.bucket(bucketName);
        const fileRef = bucket.file(filename);

        console.log("[api/upload] Attempting to save file:", filename);
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        console.log("[api/upload] File saved successfully. Making public...");
        // Make the file public
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log("[api/upload] Success! Public URL:", publicUrl);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error("[api/upload] CRITICAL ERROR:");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Full Error:", error);

        return NextResponse.json({
            error: error.message || "Upload failed",
            details: error.code || "unknown_error"
        }, { status: 500 });
    }
}
