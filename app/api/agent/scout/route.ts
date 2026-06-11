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

        // 1. Fetch User Profile
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }
        const profile = userDoc.data() || {};
        const industry = profile.industry || "General Business";
        const tone = profile.tone || "Professional";

        // 2. Scout Trends & Generate Suggested Drafts
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const prompt = `
            Task: Act as a proactive social media manager. Scout 3 trending content ideas based on the user's business today (${new Date().toLocaleDateString()}).
            
            Business Context:
            - Business Name: ${profile.businessName || "My Business"}
            - Industry: ${industry}
            - Preferred Tone: ${tone}

            Instructions:
            1. Identify 3 distinct trending topics or "hooks" relevant to this industry right now.
            2. For each, generate a short, ready-to-use social media draft that captures the trend.
            3. Each suggestion must include:
               - topic: A short descriptive title
               - content: The actual text for the post
               - platform: Recommended platform (Instagram, LinkedIn, or Twitter)

            Output Format (JSON strictly):
            {
                "suggestions": [
                    {
                        "topic": "string",
                        "content": "string",
                        "platform": "Instagram/LinkedIn/Twitter"
                    }
                ]
            }
        `;

        const client = new GeminiClient({ apiKey });
        const resultText = await client.generateText(prompt);

        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultText);

        // 3. Save Suggested Drafts to Firestore
        const savedSuggestions = [];
        if (data.suggestions && Array.isArray(data.suggestions)) {
            for (const suggestion of data.suggestions) {
                const docRef = await adminDb.collection("posts").add({
                    ...suggestion,
                    userId: uid,
                    status: "suggested", // Distinction for AI scouts
                    createdAt: new Date().toISOString(),
                    isAISuggestion: true,
                    // Set a default scheduled time for tomorrow to appear in lists
                    scheduledAt: new Date(Date.now() + 86400000).toISOString()
                });
                savedSuggestions.push({ id: docRef.id, ...suggestion });
            }
        }

        return NextResponse.json({
            success: true,
            count: savedSuggestions.length,
            suggestions: savedSuggestions
        });

    } catch (error: any) {
        console.error("Content Scout Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
