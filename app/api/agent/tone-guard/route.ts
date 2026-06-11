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
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // 1. Fetch User Profile to check the desired tone
        const userDoc = await adminDb.collection("users").doc(uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};
        const desiredTone = profile?.tone || "Professional";
        const businessName = profile?.businessName || "My Business";
        const industry = profile?.industry || "General";

        // 2. Run Tone & Quality Analysis with Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const prompt = `
            Task: Analyze this social media post for tone alignment and quality. Act as a brand guardian.
            
            Post Content:
            "${content}"
            
            Business Context:
            - Business: ${businessName}
            - Industry: ${industry}
            - Desired Tone: ${desiredTone}

            Analysis Instructions:
            1. **Tone Score** (0-100): How well does the post align with the desired tone?
            2. **Quality Score** (0-100): Overall quality (clarity, grammar, engagement potential).
            3. **Tone Detected**: What tone does this post actually have?
            4. **Issues**: List up to 3 specific issues found (be concise, 1 sentence each).
            5. **Improvements**: Provide up to 3 specific actionable suggestions.
            6. **Rewritten Version**: Provide a corrected/improved version of the post.

            Output Format (JSON strictly):
            {
                "toneScore": number,
                "qualityScore": number,
                "toneDetected": "string",
                "issues": ["string"],
                "improvements": ["string"],
                "rewritten": "string"
            }
        `;

        const client = new GeminiClient({ apiKey });
        const resultText = await client.generateText(prompt);

        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultText);

        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error("Tone Guard Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
