import { NextResponse } from "next/server";

// GET /api/visuals/proxy?prompt=...&style=...
// Searches Pexels for a relevant photo matching the prompt
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "PEXELS_API_KEY not configured" }, { status: 500 });
    }

    try {
        // Use the first 3-4 words of the prompt as the search query for better results
        const searchQuery = prompt.split(",")[0].trim(); // Take part before first comma
        const encoded = encodeURIComponent(searchQuery);
        const url = `https://api.pexels.com/v1/search?query=${encoded}&per_page=10&orientation=landscape`;

        console.log(`[Pexels Proxy] Searching for: "${searchQuery}"`);

        const res = await fetch(url, {
            headers: { "Authorization": apiKey }
        });

        if (!res.ok) {
            console.error(`[Pexels] API error: ${res.status}`);
            return NextResponse.json({ error: `Pexels API error: ${res.status}` }, { status: 502 });
        }

        const data = await res.json();
        const photos = data.photos || [];

        if (photos.length === 0) {
            return NextResponse.json({ error: "No images found for this prompt" }, { status: 404 });
        }

        // Pick a random photo from results for variety
        const randomIdx = Math.floor(Math.random() * Math.min(photos.length, 5));
        const photo = photos[randomIdx];
        const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

        console.log(`[Pexels] Found image: ${imageUrl}`);

        // Fetch and proxy the actual image bytes
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);

        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const imageBuffer = await imgRes.arrayBuffer();

        console.log(`[Pexels] Success! Size: ${imageBuffer.byteLength} bytes`);

        return new Response(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(imageBuffer.byteLength),
                "Cache-Control": "public, max-age=3600",
                "X-Photo-Credit": `Photo by ${photo.photographer} on Pexels`,
                "X-Original-URL": imageUrl // Return the Pexels URL for direct saving
            }
        });

    } catch (error: any) {
        console.error("[Pexels Proxy] Error:", error.message);
        return NextResponse.json({ error: error.message || "Failed to fetch image" }, { status: 500 });
    }
}
