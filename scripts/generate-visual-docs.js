const fs = require("fs");
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, Table, TableRow, TableCell, WidthType,
    BorderStyle, ShadingType, ImageRun, PageBreak,
} = require("docx");

// ── Output path ────────────────────────────────────────────────────────────
const OUT = "C:\\Users\\ASUS\\OneDrive\\Desktop\\MarketingAI_Visual_Documentation.docx";
const IMG = "C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\4c5717d7-bcb3-4d93-aa02-c78cc10a7593\\";
const REC = IMG; // recordings (webp) same folder

// ── Screenshots captured ────────────────────────────────────────────────────
const SCREENS = {
    dashboard: IMG + "dashboard_full_page_1772378960056.png",
    create: IMG + "create_content_page_1772379030232.png",
    analytics: IMG + "analytics_dashboard_full_1772379147864.png",
    strategy: IMG + "strategy_agent_page_1772379211752.png",
    schedule: IMG + "schedule_page_loaded_1772379245996.png",
    posts: IMG + "my_posts_page_loaded_1772379234793.png",
    settings: IMG + "settings_page_loaded_1772379259952.png",
};

const RECORDINGS = {
    dashboardTour: REC + "strategy_agent_demo_1772379191246.webp",
    createContent: REC + "create_content_capture_1772379004095.webp",
    analyticsFlow: REC + "analytics_page_capture_1772379118746.webp",
    dashboardHome: REC + "dashboard_home_capture_1772378815879.webp",
};

// ── Helper builders ─────────────────────────────────────────────────────────
const sp = (before = 0, after = 0) => ({ before, after });

function h1(text) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: sp(360, 180), pageBreakBefore: true });
}
function h2(text) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: sp(240, 120) });
}
function h3(text) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: sp(180, 80) });
}
function body(text, bold = false) {
    return new Paragraph({ children: [new TextRun({ text, bold, size: 22 })], spacing: sp(0, 80) });
}
function bullet(text, level = 0) {
    return new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level }, spacing: sp(0, 60) });
}
function gap(lines = 1) {
    return new Paragraph({ spacing: sp(0, lines * 100) });
}
function caption(text) {
    return new Paragraph({
        children: [new TextRun({ text: `▶ ${text}`, italics: true, color: "6B7280", size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: sp(60, 180),
    });
}
function sectionLabel(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, color: "4F46E5", size: 20, allCaps: true })],
        spacing: sp(200, 60),
    });
}
function hr() {
    return new Paragraph({ border: { bottom: { color: "E5E7EB", space: 1, value: "single", size: 6 } }, spacing: sp(120, 120) });
}

function img(filePath, width = 600, height = 380) {
    try {
        const buf = fs.readFileSync(filePath);
        return new Paragraph({
            children: [new ImageRun({ data: buf, transformation: { width, height } })],
            alignment: AlignmentType.CENTER,
            spacing: sp(80, 40),
        });
    } catch (e) {
        return body(`[Image not found: ${filePath}]`);
    }
}

function infoBox(lines) {
    return new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: lines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 20, color: "1E3A5F" })], spacing: sp(40, 40) })),
                        shading: { type: ShadingType.SOLID, color: "EEF2FF", fill: "EEF2FF" },
                        margins: { top: 120, bottom: 120, left: 200, right: 200 },
                    }),
                ],
            }),
        ],
    });
}

function formulaBox(lines) {
    return new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: lines.map(l => new Paragraph({ children: [new TextRun({ text: l, font: "Courier New", size: 20, color: "111827" })], spacing: sp(40, 40) })),
                        shading: { type: ShadingType.SOLID, color: "F0FDF4", fill: "F0FDF4" },
                        margins: { top: 120, bottom: 120, left: 200, right: 200 },
                    }),
                ],
            }),
        ],
    });
}

function tbl(headers, rows) {
    return new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            new TableRow({
                children: headers.map(h => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })], spacing: sp(60, 60) })],
                    shading: { type: ShadingType.SOLID, color: "4F46E5", fill: "4F46E5" },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                })),
            }),
            ...rows.map(row => new TableRow({
                children: row.map(cell => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })], spacing: sp(60, 60) })],
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                })),
            })),
        ],
    });
}

// ── Document Content ────────────────────────────────────────────────────────
const children = [

    // ─── Cover Page ────────────────────────────────────────────────────────
    new Paragraph({
        children: [new TextRun({ text: "MarketingAI", bold: true, size: 72, color: "4F46E5" })],
        alignment: AlignmentType.CENTER, spacing: sp(600, 80),
    }),
    new Paragraph({
        children: [new TextRun({ text: "AI-Powered Social Media Manager", size: 36, color: "374151" })],
        alignment: AlignmentType.CENTER, spacing: sp(0, 80),
    }),
    new Paragraph({
        children: [new TextRun({ text: "Complete Platform Documentation — March 2026", size: 24, color: "9CA3AF", italics: true })],
        alignment: AlignmentType.CENTER, spacing: sp(0, 600),
    }),
    hr(),

    // ─── 1. OVERVIEW ───────────────────────────────────────────────────────
    h1("1. PLATFORM OVERVIEW"),
    body("MarketingAI is a full-stack SaaS marketing platform built to help businesses and creators generate, manage, schedule, and analyze social media content — powered by Google Gemini AI."),
    gap(),
    sectionLabel("Core Loop"),
    infoBox([
        "  Post → Publish → Collect Engagement Data → Analyze → Decide → Post Better",
        "",
        "  Each phase of the platform feeds into this loop. The Strategy Agent closes it automatically.",
    ]),
    gap(),
    h2("Technology Stack"),
    tbl(
        ["Layer", "Technology", "Purpose"],
        [
            ["Frontend", "Next.js 14 (App Router) + TypeScript", "Full-stack React framework"],
            ["Styling", "Tailwind CSS + Framer Motion", "UI styling and animations"],
            ["Auth", "Firebase Auth (client) + Admin SDK", "JWT-based authentication"],
            ["Database", "Firestore (Firebase)", "Posts, users, insights, strategies"],
            ["AI Engine", "Google Gemini 2.0 Flash", "Captions, sentiment, strategy, replies"],
            ["AI Fallback", "Hugging Face Inference API", "Backup if Gemini fails"],
            ["Social APIs", "Facebook Graph API v18 + LinkedIn API v2", "Publishing, metrics, comments, replies"],
            ["Images", "Pexels API", "Free stock photo search"],
        ]
    ),
    gap(2),

    // ─── 2. AUTHENTICATION ─────────────────────────────────────────────────
    h1("2. AUTHENTICATION SYSTEM"),
    h2("How It Works"),
    body("Firebase Auth handles all authentication using email and password. When a user logs in, Firebase issues a short-lived JWT token (ID Token) that expires every hour and is automatically refreshed."),
    gap(),
    h3("Login Flow"),
    bullet("User enters email + password on /login page"),
    bullet("Firebase Auth SDK calls signInWithEmailAndPassword()"),
    bullet("Firebase returns an ID Token stored in the Auth Context (React)"),
    bullet("Every API call includes: Authorization: Bearer <token> in the request header"),
    bullet("Each API route calls getAuth().verifyIdToken(token) to confirm identity before proceeding"),
    gap(),
    infoBox([
        "Security: Tokens are never stored in localStorage. They live in React memory.",
        "Protection: The dashboard layout auto-redirects to /login if no valid session exists.",
        "Onboarding: First-time users set up their Business Profile (name, industry, tone) saved to Firestore.",
    ]),
    gap(2),

    // ─── 3. DASHBOARD HOME ─────────────────────────────────────────────────
    h1("3. DASHBOARD HOME (/dashboard)"),
    body("The central hub showing a real-time overview of the user's marketing performance, AI suggestions, and quick access to all features."),
    gap(),
    img(SCREENS.dashboard, 600, 390),
    caption("Dashboard Home — Overview of performance stats, AI Scout, and Strategy Agent banner"),
    gap(),
    h2("What's on This Page"),
    h3("① Header Stats Row (6 Cards)"),
    tbl(
        ["Metric", "What It Shows", "How Calculated"],
        [
            ["Reach", "Total audience reached", "Sum of reach across all published posts"],
            ["Likes", "Total likes all-time", "Sum of likes from Firestore metrics"],
            ["Comments", "Total comments", "Sum of comments across published posts"],
            ["Engagement", "Engagement rate %", "(likes + comments) / reach × 100"],
            ["Shares", "Total shares", "Sum of shares from Firestore"],
            ["Upcoming", "Next scheduled posts", "Count of posts with status='scheduled'"],
        ]
    ),
    gap(),
    h3("② Content Performance Panel"),
    body("Placeholder chart area that fills with real data as posts accumulate. Clicking 'View Detailed Report' navigates to the Analytics page."),
    gap(),
    h3("③ AI Content Scout"),
    body("Clicking 'Scan for Trends' calls the Scout Agent (POST /api/agent/scout). Gemini generates 3 trending topic posts relevant to the user's business. These are saved as 'suggested' drafts in Firestore and appear here for review."),
    gap(),
    h3("④ Strategy Agent Banner"),
    body("A click-through banner linking directly to /dashboard/strategy. It shows the Agent's role: learning from engagement history to recommend what to post, when, and how."),
    gap(),
    h3("⑤ Upcoming Content"),
    body("Lists the next scheduled posts with their platform and topic. Empty state shows a checklist guiding new users."),
    gap(2),

    // ─── 4. CREATE CONTENT ─────────────────────────────────────────────────
    h1("4. CREATE CONTENT PAGE (/dashboard/create)"),
    body("The primary AI-powered content creation workspace. Everything a user needs to produce a publish-ready post lives on this page."),
    gap(),
    img(SCREENS.create, 600, 400),
    caption("Create Content — AI generation form, Visual Studio, Trend Navigator, and Tone Guard"),
    gap(),
    h2("Left Panel — Post Details Form"),
    tbl(
        ["Field", "Purpose"],
        [
            ["What is this post about?", "The main topic/brief — sent to Gemini as the core prompt"],
            ["Keywords (optional)", "Extra terms to include in the caption"],
            ["Platform", "Instagram, LinkedIn, or Twitter — adjusts character limits and style"],
            ["Tone", "Professional, Casual, Humorous, Inspirational, or Persuasive"],
            ["Generate Content button", "Calls POST /api/content/generate — returns AI-written caption"],
        ]
    ),
    gap(),
    h3("Gemini Prompt Structure"),
    formulaBox([
        "You are a {tone} social media expert for a {industry} business.",
        "Write a {platform} post about: {topic}",
        "Keywords to include: {keywords}",
        "Include 5 relevant hashtags. Keep it under {limit} characters.",
    ]),
    gap(),
    h2("Center Panel — Visual Studio"),
    body("Provides 3 ways to attach an image to the post:"),
    bullet("AI Create — generates an image using Gemini's image generation capability"),
    bullet("Find Image — searches Pexels API for free stock photos matching a description"),
    bullet("Upload — user uploads their own image file"),
    body("Images are stored as CDN URLs (Pexels) or Base64 — never uploaded to Firebase Storage to avoid storage costs."),
    gap(),
    h2("Right Panel — Sidebars"),
    h3("Trend Navigator"),
    body("Auto-generates 5 current trending topics relevant to the user's industry using Gemini with the current date as context. Topics refresh each time the page loads."),
    gap(),
    h3("Tone & Quality Guard"),
    body("After generating content, clicking CHECK sends the post to POST /api/agent/tone-guard. Gemini analyzes whether the writing matches the user's configured brand tone. If it detects misalignment (e.g., too formal for a casual brand), it highlights the issue and offers a rewritten version."),
    gap(),
    h2("Bottom — Preview + Schedule"),
    body("The generated caption appears in an editable preview card. Below it is a 'Schedule Post' section with a datetime picker to set a future publish time and save as a scheduled draft."),
    gap(2),

    // ─── 5. MY POSTS ───────────────────────────────────────────────────────
    h1("5. MY POSTS PAGE (/dashboard/posts)"),
    body("Central management hub for all posts regardless of status."),
    gap(),
    img(SCREENS.posts, 600, 390),
    caption("My Posts — All posts in one place across all statuses"),
    gap(),
    h2("Post Statuses"),
    tbl(
        ["Status", "What It Means", "Next Action Available"],
        [
            ["draft", "Saved but not scheduled", "Schedule or Publish Now"],
            ["suggested", "Created by AI Content Scout", "Review, edit, then schedule"],
            ["scheduled", "Queued for future publishing", "Edit time or cancel"],
            ["published", "Live on the platform", "View metrics, analyze sentiment"],
        ]
    ),
    gap(),
    h2("Actions per Post"),
    bullet("Click a post card — opens it in the Create Content editor for revision"),
    bullet("Schedule button — opens a datetime picker saved to Firestore as scheduledAt"),
    bullet("Publish Now — immediately calls the publishing API to push live"),
    bullet("Delete — removes from Firestore"),
    gap(2),

    // ─── 6. SCHEDULE / CALENDAR ────────────────────────────────────────────
    h1("6. SCHEDULE / CALENDAR PAGE (/dashboard/schedule)"),
    body("A month-at-a-glance view of all scheduled and published content to help visualize posting consistency and gaps."),
    gap(),
    img(SCREENS.schedule, 600, 390),
    caption("Schedule — Monthly calendar showing scheduled and published posts as colored chips"),
    gap(),
    h2("How It Works"),
    bullet("Renders a monthly calendar grid using React state — no external calendar library"),
    bullet("Each day cell queries Firestore for posts where scheduledAt falls on that date"),
    bullet("Posts appear as colored chips on their respective calendar day"),
    bullet("Clicking a chip opens the post for viewing and editing"),
    gap(),
    infoBox([
        "Color coding:",
        "  Blue chip = Scheduled (queued, not yet published)",
        "  Green chip = Published (live on the platform)",
        "  Yellow chip = Draft (saved but not yet scheduled)",
    ]),
    gap(2),

    // ─── 7. ANALYTICS ──────────────────────────────────────────────────────
    h1("7. ANALYTICS PAGE (/dashboard/analytics)"),
    body("Full engagement analytics dashboard with real-time metrics sync and AI-powered sentiment analysis on comments."),
    gap(),
    img(SCREENS.analytics, 600, 390),
    caption("Analytics — Real-time metrics sync, audience growth chart, channel performance, and top-performing posts"),
    gap(),
    h2("Sync Fresh Data"),
    body("Clicking 'Sync Fresh Data' triggers POST /api/analytics/sync which:"),
    bullet("Fetches all of the user's published posts from Firestore"),
    bullet("For each post, calls SocialMediaManager.syncPostMetrics() which hits the platform API"),
    bullet("Instagram: calls Facebook Graph API /media/{id}/insights for likes, comments, reach, shares"),
    bullet("LinkedIn: calls /v2/socialMetadata/{postId} for equivalent metrics"),
    bullet("Writes updated metrics: { likes, comments, shares, reach } back to each Firestore post document"),
    bullet("NEW: Automatically fires the Observer agent in the background to re-score engagement (fire-and-forget)"),
    gap(),
    h2("Key Metrics Displayed"),
    tbl(
        ["Metric", "Source", "Description"],
        [
            ["Total Reach", "Firestore metrics.reach", "Sum of all audiences across published posts"],
            ["Total Likes", "Firestore metrics.likes", "Sum of all likes"],
            ["Total Comments", "Firestore metrics.comments", "Sum of all comments"],
            ["Total Shares", "Firestore metrics.shares", "Sum of all shares"],
            ["Audience Growth", "Line chart", "Reach plotted over time across weekly posts"],
            ["Channel Performance", "Platform breakdown", "Per-platform reach and post count"],
        ]
    ),
    gap(),
    h2("'Analyze Pulse' — Sentiment Analysis Modal"),
    body("Clicking 'Analyze Pulse' on any published post opens a modal that:"),
    bullet("Calls POST /api/analytics/sentiment with the postId"),
    bullet("Server fetches comments from the platform (Instagram Graph API / LinkedIn API)"),
    bullet("Sends all comment texts to Gemini with a structured analysis prompt"),
    bullet("Gemini returns: overall sentiment score (0–100), dominant emotion, top positive themes, top negative themes, summary paragraph"),
    bullet("Modal displays: Score gauge, Positive/Negative/Neutral split, top themes chips, and individual comments"),
    gap(),
    h2("AI Reply Suggestions (within Pulse Modal)"),
    body("Next to each comment in the Pulse Modal there is a 'Suggest Reply' button:"),
    bullet("Sends comment text to POST /api/agent/suggest-reply"),
    bullet("Gemini generates a brand-appropriate reply using the user's configured tone and business context"),
    bullet("Reply appears in an editable textarea — user can revise before posting"),
    bullet("'Post Reply' button calls POST /api/agent/post-reply"),
    bullet("Server posts the reply directly to Instagram (Graph API /replies endpoint) or LinkedIn (nested comments endpoint)"),
    bullet("After posting, the textarea is disabled and shows 'Posted!' status — preventing double-posting"),
    gap(2),

    // ─── 8. STRATEGY AGENT ─────────────────────────────────────────────────
    h1("8. STRATEGY AGENT — COMPLETE GUIDE (/dashboard/strategy)"),
    body("The most sophisticated feature in the platform. An analytical AI feedback loop — not a chatbot. It observes what works in your past posts, detects patterns, and prescribes a data-driven weekly strategy."),
    gap(),
    img(SCREENS.strategy, 600, 390),
    caption("Strategy Agent — Empty state shown before first run. Displays 'Run Strategy Agent' button and prompt to publish posts first."),
    gap(),
    infoBox([
        "The agent runs in 3 sequential stages:",
        "  Stage 1 — OBSERVE: Score and enrich every post with engagement metrics",
        "  Stage 2 — ANALYZE: Detect patterns across hours, tones, platforms, and categories",
        "  Stage 3 — PLAN: Generate a concrete weekly strategy with human-readable reasoning",
    ]),
    gap(),

    // Observer
    h2("Stage 1 — OBSERVER MODULE"),
    body("File: lib/agent/observer.ts  |  Trigger: POST /api/agent/observe  |  Auto-runs: After every analytics/sync", true),
    gap(),
    h3("What It Does"),
    body("For every published post, the Observer reads the current metrics and computes:"),
    gap(),
    sectionLabel("Engagement Score Formula"),
    formulaBox([
        "  engagementScore = (0.5 × likes) + (0.3 × comments) + (0.2 × shares)",
        "",
        "  Example: 100 likes, 30 comments, 10 shares",
        "  = (0.5 × 100) + (0.3 × 30) + (0.2 × 10) = 50 + 9 + 2 = 61.0",
    ]),
    gap(),
    h3("Why These Weights?"),
    tbl(
        ["Action", "Weight", "Reasoning"],
        [
            ["Likes", "0.5", "Most common, moderate signal strength"],
            ["Comments", "0.3", "Higher intent — active engagement is harder to get"],
            ["Shares", "0.2", "Strongest virality signal but rarest — weighted lower to avoid outlier distortion"],
        ]
    ),
    gap(),
    sectionLabel("Engagement Rate Formula"),
    formulaBox([
        "  engagementRate = (engagementScore / reach) × 100",
        "",
        "  Why: Normalizes performance across posts of different audience sizes.",
        "  A post with score 50 from 500 reach (10%) outperforms score 200 from 5000 reach (4%).",
    ]),
    gap(),
    h3("Time Enrichment"),
    formulaBox([
        "  postHour        = publishedDate.getHours()    // 0–23",
        "  postDayOfWeek   = publishedDate.getDay()      // 0=Sun, 6=Sat",
    ]),
    body("Maps each post to the exact hour and day it was published, enabling the Analyzer to find time-based patterns."),
    gap(),
    h3("Other Enrichment Fields"),
    bullet("hashtags — all #tags extracted from content text via regex: /#[\\w]+/g"),
    bullet("contentCategory — keyword heuristic classifying the post as: promotional / educational / engagement / news"),
    gap(),
    infoBox([
        "All enrichment is written back to each post document in Firestore:",
        "  post.engagementScore  = computed float",
        "  post.engagementRate   = computed float",
        "  post.postHour         = 0–23",
        "  post.postDayOfWeek    = 0–6",
        "  post.hashtags         = [\"#marketing\", \"#ai\"]",
        "  post.contentCategory  = \"promotional\"",
        "  post.lastEnrichedAt   = ISO timestamp",
    ]),
    gap(2),

    // Analyzer
    h2("Stage 2 — ANALYZER MODULE"),
    body("File: lib/agent/analyzer.ts  |  Trigger: POST /api/agent/analyze  |  Output: agent_insights/{userId} in Firestore", true),
    gap(),
    h3("Pattern Detection — Group-By-Average"),
    body("For every dimension (hour, tone, platform, category, hashtag), the Analyzer groups all posts by that value and calculates the average engagementScore per group:"),
    formulaBox([
        "  Hour 7:  avg score = 12.3  (from 2 posts)",
        "  Hour 12: avg score = 18.7  (from 3 posts)",
        "  Hour 19: avg score = 41.2  (from 5 posts)  ← BEST HOUR",
        "  Hour 21: avg score = 22.1  (from 2 posts)",
        "",
        "  → bestHour = 19",
    ]),
    body("Same group-by-average logic applied to: bestTone, bestPlatform, bestContentCategory, bestDayOfWeek"),
    gap(),
    h3("24-Slot Hourly Array"),
    body("The Analyzer builds an array of 24 numbers where each index = an hour of day. This directly feeds the heatmap visualization on the Strategy Dashboard."),
    formulaBox([
        "  hourlyEngagement[0]  = avg score at midnight",
        "  hourlyEngagement[19] = avg score at 7PM",
        "  ...etc across all 24 hours",
    ]),
    gap(),
    h3("7-Day Trend Detection"),
    formulaBox([
        "  last7Avg  = mean(engagementScore for posts published in last 7 days)",
        "  prev7Avg  = mean(engagementScore for posts published 8–14 days ago)",
        "  delta     = ((last7Avg - prev7Avg) / prev7Avg) × 100",
        "",
        "  if delta >= 5%:   recentTrend = 'up'",
        "  if delta <= -5%:  recentTrend = 'down'",
        "  else:             recentTrend = 'stable'",
    ]),
    gap(),
    h3("Confidence Score"),
    tbl(
        ["Posts Analyzed", "Confidence Score", "Label Shown to User"],
        [
            ["< 3", "10", "Very Low — not enough data"],
            ["3–4", "30", "Low"],
            ["5–9", "60", "Medium"],
            ["10–19", "80", "High"],
            ["20+", "100", "Very High"],
        ]
    ),
    body("All recommendations show a confidence badge. Users with few posts see Low Confidence warnings — preventing over-reliance on sparse data."),
    gap(2),

    // Planner
    h2("Stage 3 — PLANNER MODULE"),
    body("File: lib/agent/planner.ts  |  Trigger: POST /api/agent/plan  |  Output: agent_strategy/{userId} in Firestore", true),
    gap(),
    body("Reads agent_insights and generates a concrete weekly strategy. No LLM needed — pure rule-based logic on real user data."),
    gap(),
    h3("Weekly Post Target"),
    formulaBox([
        "  confidence >= 80  → weeklyPostTarget = 5",
        "  confidence >= 50  → weeklyPostTarget = 4",
        "  else              → weeklyPostTarget = 3",
        "",
        "  Reason: Lower confidence = fewer posts recommended,",
        "  because strategy accuracy hasn't been proven yet.",
    ]),
    gap(),
    h3("Recommended Post Times"),
    formulaBox([
        "  Slot 1: bestDay         at bestHour:00",
        "  Slot 2: bestDay + 2days at bestHour:00",
        "  Slot 3: bestDay + 4days at bestHour:00",
        "",
        "  Example: bestDay=Tuesday, bestHour=19",
        "  → Slots: [Tue 19:00, Thu 19:00, Sat 19:00]",
    ]),
    gap(),
    h3("Content Mix Formula"),
    body("Based on the best-performing content category, the Planner assigns a weekly content split:"),
    tbl(
        ["Best Category", "Promotional %", "Educational %", "Engagement %", "News %"],
        [
            ["promotional", "50%", "20%", "20%", "10%"],
            ["educational", "20%", "50%", "20%", "10%"],
            ["engagement", "20%", "20%", "50%", "10%"],
            ["news", "20%", "30%", "20%", "30%"],
        ]
    ),
    body("Logic: Double down on what works, but maintain variety. No category drops below 10%."),
    gap(),
    h3("Agent Reasoning — Plain English Explanations"),
    body("The Planner computes human-readable explanations for every recommendation:"),
    formulaBox([
        "  Example output reasoning[]:",
        "  \"Posts at 19:00 have your highest average engagement score.\"",
        "  \"Your 'Casual' tone outperforms others by ~42% in engagement.\"",
        "  \"Instagram gives ~120% better engagement than other platforms.\"",
        "  \"'promotional' posts drive the most engagement in your feed.\"",
        "  \"Your engagement is trending upward — maintain current strategy momentum.\"",
    ]),
    gap(2),

    // Strategy Dashboard UI
    h2("Strategy Dashboard UI — Element-by-Element"),
    h3("① Run Strategy Agent Button"),
    body("Single button that triggers the full pipeline sequentially: observe → analyze → plan. Shows step status: 'Scoring engagement... → Detecting patterns... → Building strategy...' Refreshes the page once complete."),
    gap(),
    h3("② Quick Stats Row (4 Cards)"),
    tbl(
        ["Card", "Shows", "Color"],
        [
            ["Posts Analyzed", "Total posts processed by the agent", "Blue"],
            ["Avg Engagement Score", "Mean score across all posts", "Purple (Primary)"],
            ["Best Platform", "Instagram / LinkedIn — highest average score", "Green"],
            ["Recent Trend", "↑ Up / ↓ Down / → Stable with 7-day data", "Green/Red/Amber"],
        ]
    ),
    gap(),
    h3("③ Hourly Engagement Heatmap"),
    body("A 2-row grid of 12 columns each (hours 0–11 on top, 12–23 on bottom). Each cell's purple opacity intensity = average engagement score at that hour. Darker = more engagement. The best hour is labeled in the card header. This visualizes the optimal posting window at a glance."),
    gap(),
    h3("④ Platform Performance Bars"),
    body("Horizontal progress bars comparing each platform's average engagement score. Instagram = pink bar, LinkedIn = blue bar. The longest bar is the highest-ROI platform."),
    gap(),
    h3("⑤ Tone & Category Breakdown"),
    body("Side-by-side bar charts showing which tone (Casual, Professional, etc.) and which content category (promotional, educational, etc.) generates the highest average scores. Directly informs future writing decisions."),
    gap(),
    h3("⑥ Top Hashtags by Engagement"),
    body("Hashtags ranked by average engagement score across all posts containing them. The #1 hashtag gets the primary color badge. Users should prioritize these in future posts."),
    gap(),
    h3("⑦ Weekly Strategy Card"),
    body("The main strategy output containing:"),
    bullet("Confidence Badge — High/Medium/Low with percentage score"),
    bullet("Generation Date — when strategy was last computed"),
    bullet("Weekly Target — e.g., '4 posts this week'"),
    bullet("Best Post Times — 3 recommended time slots with clock icons"),
    bullet("Tone & Platform — recommended style and social channel"),
    bullet("Content Mix Bar — segmented color bar showing % split with legend"),
    bullet("Top Hashtags — the 5 hashtags to use in upcoming posts"),
    gap(),
    h3("⑧ Agent Reasoning"),
    body("A list of checkmarked bullet points explaining WHY every recommendation was made. Critical for user trust. The agent doesn't just say 'post at 7PM' — it says 'Posts at 7PM have your highest average engagement score.' Every decision is grounded in the user's real data."),
    gap(2),

    // ─── 9. SETTINGS ───────────────────────────────────────────────────────
    h1("9. SETTINGS PAGE (/dashboard/settings)"),
    img(SCREENS.settings, 600, 390),
    caption("Settings — Integrations panel showing Instagram and LinkedIn connection cards"),
    gap(),
    h2("Integrations Tab"),
    body("Connect social media accounts. Each connection goes through a full OAuth flow:"),
    gap(),
    h3("Instagram Connection Flow"),
    bullet("'Link Account' redirects to Facebook/Meta OAuth via GET /api/auth/instagram"),
    bullet("User authorizes the app on Meta's consent screen (requests instagram_manage_comments, instagram_content_publish, etc.)"),
    bullet("Meta redirects back to /api/auth/instagram/callback with an authorization code"),
    bullet("Server exchanges code for a long-lived access token"),
    bullet("Stores igAccountId, accessToken, pageId in users/{uid}/connections/instagram in Firestore"),
    gap(),
    h3("LinkedIn Connection Flow"),
    bullet("Same OAuth pattern via GET /api/auth/linkedin"),
    bullet("After authorization, stores linkedinId, accessToken, memberId in Firestore"),
    gap(),
    h2("Team Tab"),
    body("Invite team members by email (Phase 7 — not yet implemented). Will support Role-Based Access Control (Admin vs Member)."),
    gap(),
    h2("Data Tab"),
    body("Export Library — download all brand data, generated content copies, and connection settings."),
    gap(2),

    // ─── 10. BACKEND ARCHITECTURE ─────────────────────────────────────────
    h1("10. BACKEND ARCHITECTURE"),
    h2("API Routes Reference"),
    tbl(
        ["Method", "Route", "Description"],
        [
            ["GET", "/api/user/profile", "Fetch user business profile"],
            ["POST", "/api/user/profile", "Create/update profile"],
            ["GET", "/api/posts", "List all posts for user"],
            ["POST", "/api/posts", "Create new post/draft"],
            ["GET+PATCH+DELETE", "/api/posts/{id}", "Read/update/delete single post"],
            ["GET", "/api/posts/{id}/comments", "Fetch comments from platform"],
            ["POST", "/api/content/generate", "Generate AI caption via Gemini"],
            ["GET", "/api/auth/instagram", "Start Instagram OAuth"],
            ["GET", "/api/auth/instagram/callback", "Complete Instagram OAuth + save token"],
            ["GET", "/api/auth/linkedin", "Start LinkedIn OAuth"],
            ["GET", "/api/auth/linkedin/callback", "Complete LinkedIn OAuth + save token"],
            ["POST", "/api/analytics/sync", "Sync metrics from platforms + auto-trigger Observer"],
            ["POST", "/api/analytics/sentiment", "Run sentiment analysis on comments via Gemini"],
            ["GET", "/api/analytics/timing", "Best posting time analysis"],
            ["POST", "/api/agent/observe", "Run Observer module manually"],
            ["POST", "/api/agent/analyze", "Run Analyzer — write agent_insights"],
            ["GET+POST", "/api/agent/plan", "Fetch or generate weekly strategy"],
            ["POST", "/api/agent/scout", "Run Content Scout agent"],
            ["POST", "/api/agent/suggest-reply", "Generate AI comment reply"],
            ["POST", "/api/agent/post-reply", "Post reply directly to platform"],
            ["POST", "/api/agent/tone-guard", "Validate content against brand tone"],
        ]
    ),
    gap(),
    h2("Security Design"),
    bullet("Every API route verifies Authorization: Bearer <token> header"),
    bullet("Firebase Admin verifyIdToken() confirms token authenticity before any operation"),
    bullet("Post ownership verified: post.userId === uid before any modification"),
    bullet("Social access tokens stored server-side in Firestore — never exposed to frontend"),
    bullet("Agent never posts autonomously — default mode is suggestion only"),
    bullet("All strategy recommendations include confidence score warning for low data scenarios"),
    gap(2),

    // ─── 11. SCREEN RECORDINGS ─────────────────────────────────────────────
    h1("11. SCREEN RECORDINGS"),
    body("The following videos were recorded automatically during documentation capture. Each shows an interactive walkthrough of a key flow."),
    gap(),
    h2("Recording 1 — Dashboard Home Tour"),
    body("A walkthrough of the Dashboard home page showing the navigation sidebar, stat cards, AI Scout panel, and Strategy Agent banner."),
    gap(),
    h2("Recording 2 — Create Content Flow"),
    body("Shows the complete content creation flow: entering a topic, selecting tone and platform, clicking Generate Content, and the Visual Studio image options."),
    gap(),
    h2("Recording 3 — Analytics Page"),
    body("Demonstrates the Analytics Overview, Sync Fresh Data button, Audience Growth chart, Channel Performance breakdown, and Top Performing Content section."),
    gap(),
    h2("Recording 4 — Full Dashboard Navigation"),
    body("A complete tour navigating from Strategy Agent → Create Content → My Posts → Schedule → Settings, demonstrating all pages in sequence."),
    gap(2),

    // ─── FINAL ─────────────────────────────────────────────────────────────
    h1("12. WHAT'S NEXT"),
    h2("Phase 7 — Team Workspaces (Not Yet Built)"),
    tbl(
        ["Feature", "What It Enables"],
        [
            ["Workspace collection in Firestore", "Group users + their posts under one workspace entity"],
            ["Membership system", "Link multiple users to the same workspace"],
            ["Workspace-scoped posts", "Posts belong to workspace, not individual user"],
            ["Invitation by email", "Invite team members with magic link"],
            ["Role-Based Access Control", "Admin: publish | Member: draft only"],
        ]
    ),
    gap(),
    h2("Optional Future Enhancements"),
    tbl(
        ["Feature", "Value It Adds"],
        [
            ["Strategy Executor", "Agent auto-schedules posts based on strategy (suggestion approve mode)"],
            ["Twitter/X Integration", "Third platform connector alongside Instagram + LinkedIn"],
            ["Engagement Prediction", "Score a draft before publishing using historical patterns"],
            ["Monthly Campaign Planning", "Agent plans a full month, not just a week"],
            ["Push Notifications", "Alert when a post performs unusually well or drops"],
            ["PDF Export", "Download performance analytics as formatted PDF report"],
        ]
    ),
    gap(),
    hr(),
    new Paragraph({
        children: [new TextRun({ text: "End of Documentation — MarketingAI Platform © 2026", italics: true, color: "9CA3AF", size: 18 })],
        alignment: AlignmentType.CENTER, spacing: sp(240, 0),
    }),
];

// ── Build + Write ─────────────────────────────────────────────────────────
const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: {
        default: {
            document: { run: { font: "Calibri", size: 22, color: "1F2937" } },
        },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal",
                run: { size: 44, bold: true, color: "4F46E5" },
                paragraph: { spacing: { before: 360, after: 200 } }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal",
                run: { size: 30, bold: true, color: "1F2937" },
                paragraph: { spacing: { before: 240, after: 120 } }
            },
            {
                id: "Heading3", name: "Heading 3", basedOn: "Normal",
                run: { size: 24, bold: true, color: "4B5563" },
                paragraph: { spacing: { before: 180, after: 80 } }
            },
        ],
    },
});

Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync(OUT, buf);
    console.log("✅ Visual documentation generated:", OUT);
}).catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
