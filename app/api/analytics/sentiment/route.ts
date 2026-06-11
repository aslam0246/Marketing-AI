import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { SocialMediaManager } from "@/lib/social-media-manager";
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
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: "Missing postId" }, { status: 400 });
        }

        // 1. Verify Ownership
        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const post = postDoc.data();
        if (post?.userId !== uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch Comments
        const comments = await SocialMediaManager.getPostComments(postId, uid);

        if (!comments || comments.length === 0) {
            return NextResponse.json({
                sentiment: "Neutral",
                score: 5,
                themes: ["No comments yet"],
                summary: "This post hasn't received any comments for analysis."
            });
        }

        // 3. Analyze with Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const commentText = comments.map(c => `- ${c.author}: ${c.text}`).join("\n");
        const prompt = `
            Task: Analyze the sentiment of the following social media comments.
            Comments:
            ${commentText}

            Instructions:
            1. Determine the overall sentiment (Positive, Negative, Mixed, or Neutral).
            2. Provide a sentiment score from 1 (Very Negative) to 10 (Very Positive).
            3. Identify the top 3 recurring themes or topics mentioned in the comments.
            4. Write a 2-sentence executive summary of the audience feedback.

            Output Format (JSON strictly):
            {
                "sentiment": "Positive/Negative/Mixed/Neutral",
                "score": number,
                "themes": ["theme1", "theme2", "theme3"],
                "summary": "string"
            }
        `;

        const client = new GeminiClient({ apiKey });
        const analysisText = await client.generateText(prompt);

        // Extract JSON from potential markdown markers
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisText);

        return NextResponse.json({
            ...analysis,
            comments: comments
        });

    } catch (error: any) {
        console.error("Sentiment Analysis Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
