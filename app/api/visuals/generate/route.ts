
import { NextResponse } from "next/server";
import { GeminiClient } from "@/lib/gemini-client";

export async function POST(req: Request) {
    try {
        const { prompt, style } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const client = new GeminiClient({ apiKey });

        // Generate Image (Returns ArrayBuffer)
        const imageBuffer = await client.generateImage(prompt, style);

        if (!imageBuffer) {
            return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
        }

        // Convert ArrayBuffer to Base64 to send to client
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        return NextResponse.json({
            success: true,
            imageUrl: dataUrl
        });

    } catch (error: any) {
        console.error("API Route Error:", error);

        const status = error.message.includes("Quota") ? 429 : 500;
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status }
        );
    }
}
