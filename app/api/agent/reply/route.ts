import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { GeminiClient } from "@/lib/gemini-client";

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
        const { postId, commentText, commentAuthor } = body;

        if (!postId || !commentText) {
            return NextResponse.json({ error: "Missing postId or commentText" }, { status: 400 });
        }

        // 1. Fetch Post & User Profile for Context
        const [postDoc, userDoc] = await Promise.all([
            adminDb.collection("posts").doc(postId).get(),
            adminDb.collection("users").doc(uid).get()
        ]);

        if (!postDoc.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const post = postDoc.data();
        if (post?.userId !== uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const userProfile = userDoc.exists ? userDoc.data() : {};
        const businessName = userProfile?.businessName || "our business";
        const industry = userProfile?.industry || "Marketing";
        const tone = userProfile?.tone || "Professional";

        // 2. Generate Reply with Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const prompt = `
            Task: Generate a high-quality, engaging social media reply to a specific comment.
            
            Context:
            - Business Name: ${businessName}
            - Industry: ${industry}
            - Preferred Tone: ${tone}
            - Original Post Content: "${post?.content}"
            - Comment from ${commentAuthor || 'a user'}: "${commentText}"

            Instructions:
            1. The reply should be helpful, appreciative, and maintain the brand's tone.
            2. Keep it concise (max 2 sentences).
            3. Use appropriate emojis if the tone allows.
            4. If the comment is a question, try to answer it generally or invite them to DM (Direct Message).
            5. If the comment is critical, be polite and professional.

            Output Format:
            Return ONLY the reply text, no extra commentary or quotes.
        `;

        const client = new GeminiClient({ apiKey });
        const reply = (await client.generateText(prompt)).trim();

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Agent Reply Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
