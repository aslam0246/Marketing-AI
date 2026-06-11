import { NextResponse } from "next/server";
import { GeminiClient } from "@/lib/gemini-client";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { getUpcomingFestivals, getCurrentSeason, REGIONS } from "@/lib/content-engine/festivals";

// ── 1. Fetch real news headlines from NewsAPI ──────────────────────
async function fetchNewsHeadlines(niche: string, country: string = ""): Promise<string[]> {
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) return [];
    try {
        const query = encodeURIComponent(niche);
        // Use country filter for top-headlines, fall back to everything if not supported
        const countryParam = country && country !== "GLOBAL" ? `&country=${country.toLowerCase()}` : "";
        // top-headlines supports country; everything supports q better
        const url = countryParam
            ? `https://newsapi.org/v2/top-headlines?q=${query}&language=en${countryParam}&pageSize=6&apiKey=${newsApiKey}`
            : `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${newsApiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) { console.warn(`[NewsAPI] Failed: ${res.status}`); return []; }
        const data = await res.json();
        if (data.status !== "ok" || !data.articles?.length) return [];
        return (data.articles as any[])
            .filter(a => a.title && !a.title.includes("[Removed]"))
            .slice(0, 6)
            .map(a => `• ${a.title}${a.description ? ` — ${a.description.slice(0, 100)}` : ""}`);
    } catch (e: any) {
        console.warn("[NewsAPI] Error:", e.message?.slice(0, 60));
        return [];
    }
}

// ── 2. Fetch Instagram hashtag data via Graph API ─────────────────
interface InstagramHashtagData {
    hashtag: string;
    mediaCount: number;
    recentTopPosts: number;
}

async function fetchInstagramHashtags(
    uid: string,
    keywords: string[]
): Promise<InstagramHashtagData[]> {
    try {
        // Get stored Instagram token from Firestore
        const connSnap = await adminDb
            .collection("users").doc(uid)
            .collection("connections").doc("instagram")
            .get();

        if (!connSnap.exists) return [];
        const { accessToken, igAccountId } = connSnap.data()!;
        if (!accessToken || !igAccountId) return [];

        const results: InstagramHashtagData[] = [];

        // Query up to 4 keywords (Instagram limits: 30 unique hashtags/user/day)
        for (const keyword of keywords.slice(0, 4)) {
            try {
                const cleanTag = keyword.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                if (!cleanTag) continue;

                // Step A: Get hashtag ID
                const idRes = await fetch(
                    `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${igAccountId}&q=${cleanTag}&access_token=${accessToken}`,
                    { signal: AbortSignal.timeout(6000) }
                );
                if (!idRes.ok) continue;
                const idData = await idRes.json();
                const hashtagId = idData.data?.[0]?.id;
                if (!hashtagId) continue;

                // Step B: Get top media count for this hashtag
                const mediaRes = await fetch(
                    `https://graph.facebook.com/v19.0/${hashtagId}/top_media?user_id=${igAccountId}&fields=like_count,comments_count,timestamp&limit=10&access_token=${accessToken}`,
                    { signal: AbortSignal.timeout(6000) }
                );
                if (!mediaRes.ok) continue;
                const mediaData = await mediaRes.json();
                const posts = mediaData.data || [];

                const totalEngagement = posts.reduce((sum: number, p: any) =>
                    sum + (p.like_count || 0) + (p.comments_count || 0), 0);

                results.push({
                    hashtag: cleanTag,
                    mediaCount: posts.length,
                    recentTopPosts: totalEngagement,
                });

                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 200));
            } catch (e: any) {
                console.warn(`[Instagram] Hashtag ${keyword} failed:`, e.message?.slice(0, 40));
            }
        }

        return results.sort((a, b) => b.recentTopPosts - a.recentTopPosts);
    } catch (e: any) {
        console.warn("[Instagram Trends] Error:", e.message?.slice(0, 60));
        return [];
    }
}

// ── Format Instagram data for Gemini context ─────────────────────
function formatInstagramContext(igData: InstagramHashtagData[]): string {
    if (!igData.length) return "";
    const lines = igData.map(h =>
        `• #${h.hashtag} — ${h.recentTopPosts} total engagements on top ${h.mediaCount} posts`
    );
    return `\nREAL Instagram Hashtag Performance Data:\n${lines.join("\n")}\n(Use this to recommend high-performing hashtags for this niche)`;
}

// ── Main Route ─────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = await getAuth().verifyIdToken(token);
        const uid = decoded.uid;

        const body = await req.json();
        const niche = body.niche || body.topic || "Technology and SaaS";
        const region = body.region || "IN"; // default India

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        // ── Fetch all real data sources in parallel ───────────────
        const keywords = niche.split(/[\s,]+/).filter(Boolean).slice(0, 4);
        const newsCountry = region === "IN" ? "in" : region === "US" ? "us" : region === "UK" ? "gb" : "";

        const [newsHeadlines, igHashtags] = await Promise.all([
            fetchNewsHeadlines(niche, newsCountry),
            fetchInstagramHashtags(uid, keywords),
        ]);

        // ── Festival & Seasonal Context ───────────────────────────
        const upcomingFestivals = getUpcomingFestivals(region, 35);
        const currentSeason = getCurrentSeason(region);
        const regionLabel = REGIONS[region] || region;

        const festivalContext = upcomingFestivals.length > 0
            ? `\nUpcoming Festivals/Events in ${regionLabel} (next 35 days):\n${upcomingFestivals.map(f =>
                `• ${f.name} (${f.dateStr}, ${f.daysAway} days away) — Marketing angle: ${f.marketingAngle}`
              ).join("\n")}`
            : "";

        const seasonContext = `\nCurrent Season in ${regionLabel}: ${currentSeason}`;

        const hasNews = newsHeadlines.length > 0;
        const hasIG = igHashtags.length > 0;
        const hasRealData = hasNews || hasIG;

        // ── Build Gemini prompt with all real data ────────────────
        const todayDate = new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        const newsSection = hasNews
            ? `\nREAL news headlines (${regionLabel}) published TODAY:\n${newsHeadlines.join("\n")}`
            : "";

        const igSection = formatInstagramContext(igHashtags);

        const dataSection = hasRealData
            ? `${newsSection}${igSection}${festivalContext}${seasonContext}\n\nAnalyze ALL of this real data to extract what's actually trending right now.`
            : `${festivalContext}${seasonContext}\n(No live news data available — use your knowledge of trends for ${todayDate} in ${regionLabel}.)`;

        const prompt = `
You are an elite social media strategist and trend analyst.
Niche/Industry: ${niche}
Region/Market: ${regionLabel}
Today's Date: ${todayDate}
${dataSection}

Your task:
1. Identify 3-4 specific trending topics grounded in the real data above.
   - If there are upcoming festivals, include at least 1 festival-specific content idea.
   - Titles must be specific and punchy (e.g. "Diwali Gift Guide for Tech Lovers" not "Festival content").
   - Descriptions: WHY it's hot right now + what content angle to take (2 sentences max).
2. Suggest 5 viral hashtags — prioritize high-engagement IG ones + festival hashtags if relevant.
3. Identify 2-3 buzzwords gaining traction in this niche right now.
4. Write one sharp daily strategy recommendation that accounts for the upcoming festivals/season (2-3 sentences, highly actionable).

Return ONLY valid JSON, no markdown:

{
    "trends": [
        { "title": "string", "description": "string" }
    ],
    "hashtags": ["string"],
    "buzzwords": ["string"],
    "recommendation": "string"
}`;

        const client = new GeminiClient({ apiKey: geminiKey });
        const resultText = await client.generateText(prompt);

        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Gemini returned non-JSON response");
        const data = JSON.parse(jsonMatch[0]);

        // ── Attach metadata for UI display ────────────────────────
        data.dataSource = hasRealData ? "live-news" : "ai-knowledge";
        data.headlineCount = newsHeadlines.length;
        data.instagramHashtags = igHashtags;
        data.upcomingFestivals = upcomingFestivals.map(f => ({
            name: f.name,
            dateStr: f.dateStr,
            daysAway: f.daysAway,
            type: f.type,
            marketingAngle: f.marketingAngle,
        }));
        data.currentSeason = currentSeason;
        data.region = regionLabel;

        const sources = [
            hasNews && `${newsHeadlines.length} news`,
            hasIG && `${igHashtags.length} IG hashtags`,
            upcomingFestivals.length && `${upcomingFestivals.length} festivals`,
        ].filter(Boolean).join(" + ");

        console.log(`[Trends] "${niche}" | Region: ${regionLabel} | Sources: ${sources || "AI only"}`);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Trend Navigator Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
