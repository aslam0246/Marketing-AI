import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

// ── Auth helper ────────────────────────────────────────────────
async function verifyToken(req: Request): Promise<string> {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
    const { uid } = await getAuth().verifyIdToken(header.split("Bearer ")[1]);
    return uid;
}

// ── Route: POST /api/gemini/caption-from-image ─────────────────
export async function POST(req: Request) {
    try {
        const uid = await verifyToken(req);
        const { imageUrl, imageBase64, platform, tone, businessName, industry } = await req.json();

        if (!imageUrl && !imageBase64) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        // ── Build prompt ───────────────────────────────────────
        const prompt = `You are an expert social media content creator for ${businessName || "a business"} in the ${industry || "tech"} industry.

Analyze this image carefully and create an engaging ${platform || "social media"} caption that:
1. Directly relates to what you see in the image
2. Matches a ${tone || "Professional"} tone
3. Is optimized for ${platform || "social media"} (character limits, style, culture)
4. Includes 3-5 highly relevant hashtags at the end
5. Feels authentic and human, not robotic

Platform-specific guidelines:
- Instagram: Visual storytelling, emojis welcome, up to 2200 chars, hashtags at end
- LinkedIn: Professional narrative, no excessive emojis, up to 3000 chars, 3-5 hashtags
- Twitter: Punchy and concise, max 280 chars including hashtags

Return ONLY the caption text with hashtags. No explanations, no "Caption:" prefix.`;

        // ── Try Gemini Vision (gemini-2.0-flash supports images) ─
        const visionModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

        for (const model of visionModels) {
            try {
                // Build the parts array (image + text)
                const parts: any[] = [];

                if (imageUrl) {
                    // Use URL-based image part
                    parts.push({
                        inlineData: await fetchImageAsBase64(imageUrl)
                    });
                } else if (imageBase64) {
                    // Use base64 directly
                    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
                    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
                    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
                    parts.push({ inlineData: { data: base64Data, mimeType } });
                }

                parts.push({ text: prompt });

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: [{ parts }] }),
                        signal: AbortSignal.timeout(30000),
                    }
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.warn(`[CaptionFromImage] ${model} failed (${res.status}):`, err?.error?.message?.slice(0, 80));
                    continue;
                }

                const data = await res.json();
                const caption = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (caption && caption.length > 10) {
                    console.log(`[CaptionFromImage] ✅ Generated via ${model} (${caption.length} chars)`);
                    return NextResponse.json({ caption, model });
                }
            } catch (e: any) {
                console.warn(`[CaptionFromImage] ${model} error:`, e.message?.slice(0, 60));
            }
        }

        // ── Fallback: HuggingFace image-to-text ──────────────────
        const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
        if (hfKey && (imageUrl || imageBase64)) {
            try {
                console.log("[CaptionFromImage] Trying HuggingFace image-to-text fallback...");
                const imgBuffer = imageUrl
                    ? await (await fetch(imageUrl)).arrayBuffer()
                    : Buffer.from((imageBase64 as string).replace(/^data:[^;]+;base64,/, ""), "base64");

                const hfRes = await fetch(
                    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${hfKey}` },
                        body: imgBuffer,
                        signal: AbortSignal.timeout(20000),
                    }
                );

                if (hfRes.ok) {
                    const hfData = await hfRes.json();
                    const description = hfData?.[0]?.generated_text || "";
                    if (description) {
                        // Wrap the raw description in a basic caption
                        const caption = `${description}. Perfect for your next campaign! ✨\n\n#marketing #business #${platform?.toLowerCase() || "socialmedia"}`;
                        return NextResponse.json({ caption, model: "huggingface-blip" });
                    }
                }
            } catch (e: any) {
                console.warn("[CaptionFromImage] HuggingFace fallback failed:", e.message?.slice(0, 60));
            }
        }

        return NextResponse.json(
            { error: "Caption generation failed. Please try again or enter a topic manually." },
            { status: 503 }
        );

    } catch (error: any) {
        const status = error.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

/** Fetches an image URL and returns { data: base64, mimeType } for Gemini Vision */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const data = Buffer.from(buffer).toString("base64");
    return { data, mimeType };
}
