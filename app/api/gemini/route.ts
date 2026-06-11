
import { NextResponse } from "next/server";
import { GeminiClient } from "@/lib/gemini-client";

export async function POST(req: Request) {
    // Basic clean up if needed, though Client logic should handle it
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            console.error("[GEMINI-ROUTE] Missing prompt in request body");
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        console.log(`[GEMINI-ROUTE] Incoming prompt: "${prompt.substring(0, 50)}..."`);

        const client = new GeminiClient({ apiKey });
        const generatedText = await client.generateText(prompt);

        console.log(`[GEMINI-ROUTE] Success! Generated ${generatedText.length} chars.`);

        return NextResponse.json({ generated_text: generatedText });

    } catch (error: any) {
        console.error("[GEMINI-ROUTE] ERROR:", error.message);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
