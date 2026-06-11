// =====================================================
// DEMO SEED SCRIPT — MarketingAI
// Inserts realistic fake data for presentation demo.
// All records tagged with demoData:true for safe cleanup.
// Run with: node scripts/seed-demo.js
// =====================================================
require("dotenv").config({ path: ".env.local" });
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const app = initializeApp({
    credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
}, "demo-seed-app");

const db = getFirestore(app);

// ─── CONFIG ─────────────────────────────────────────
// ⚠ Replace this with your real Firebase user UID
// Find it at: Firebase Console → Authentication → Users
const DEMO_USER_ID = "fIrBGG3ebLUMFBLvIjMm8dyXAhv1";

const DEMO_TAG = { demoData: true };

// ─── HELPERS ────────────────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function hoursFromNow(n) {
    return new Date(Date.now() + n * 60 * 60 * 1000).toISOString();
}

// ─── DEMO POSTS ─────────────────────────────────────
const posts = [
    {
        topic: "5 ways AI saves your business 10 hours/week",
        content: "🤖 AI is no longer a luxury — it's a necessity.\n\nHere are 5 ways AI tools are saving businesses 10+ hours every week:\n\n1. Automated content creation\n2. Smart email filtering\n3. AI-powered scheduling\n4. Instant data analysis\n5. Automated customer replies\n\nWhich one do you already use? Drop it below 👇\n\n#AI #Productivity #SmallBusiness #MarketingAI #TechStartup",
        platform: "Instagram", tone: "Professional",
        status: "published", publishedAt: daysAgo(13),
        metrics: { likes: 245, comments: 38, shares: 12, reach: 3200 },
        engagementScore: (0.5 * 245) + (0.3 * 38) + (0.2 * 12), engagementRate: 8.84,
        postHour: 19, postDayOfWeek: 2, contentCategory: "educational",
        hashtags: ["#AI", "#Productivity", "#SmallBusiness", "#MarketingAI", "#TechStartup"],
        imageUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
        platformPostId: "mock-ig-001",
    },
    {
        topic: "Why every startup needs a content strategy",
        content: "Most startups build great products but forget to tell anyone about them.\n\nA strong content strategy is what separates startups that grow from those that plateau.\n\nHere's what a winning content strategy looks like in 2026:\n✅ Consistent posting schedule\n✅ Platform-specific content\n✅ Data-driven decisions\n✅ AI-assisted creation\n\nStart building yours today. 🚀\n\n#ContentStrategy #StartupGrowth #LinkedIn #Marketing",
        platform: "LinkedIn", tone: "Professional",
        status: "published", publishedAt: daysAgo(11),
        metrics: { likes: 189, comments: 52, shares: 9, reach: 2800 },
        engagementScore: (0.5 * 189) + (0.3 * 52) + (0.2 * 9), engagementRate: 9.50,
        postHour: 9, postDayOfWeek: 4, contentCategory: "educational",
        hashtags: ["#ContentStrategy", "#StartupGrowth", "#LinkedIn", "#Marketing"],
        imageUrl: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        platformPostId: "mock-li-001",
    },
    {
        topic: "We just launched our new AI dashboard!",
        content: "🚀 BIG NEWS — TechStartup AI just launched MarketingAI!\n\nAfter months of building, we're proud to introduce an AI platform that:\n✨ Writes your social media content\n📊 Analyzes your engagement data\n🤖 Learns what works and gets smarter every week\n📅 Auto-publishes at the perfect time\n\nWe hit 500 sign-ups in the first 24 hours 🎉\n\nLink in bio to try it free.\n\n#ProductLaunch #MarketingAI #StartupLife #AITools",
        platform: "Instagram", tone: "Inspirational",
        status: "published", publishedAt: daysAgo(8),
        metrics: { likes: 412, comments: 74, shares: 31, reach: 5100 },
        engagementScore: (0.5 * 412) + (0.3 * 74) + (0.2 * 31), engagementRate: 10.12,
        postHour: 20, postDayOfWeek: 5, contentCategory: "promotional",
        hashtags: ["#ProductLaunch", "#MarketingAI", "#StartupLife", "#AITools"],
        imageUrl: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg",
        platformPostId: "mock-ig-002",
    },
    {
        topic: "How to grow LinkedIn followers organically",
        content: "Growing on LinkedIn doesn't require paid ads.\n\nHere's what actually works in 2026:\n\n🔹 Post 3–4x per week consistently\n🔹 Lead with a bold opening line\n🔹 Use data and personal stories\n🔹 Comment meaningfully on others' posts\n🔹 End every post with a question\n\nThe algorithm rewards consistency over virality.\n\nWhat's your current posting frequency?\n\n#LinkedIn #GrowthHacking #PersonalBranding #ContentMarketing",
        platform: "LinkedIn", tone: "Casual",
        status: "published", publishedAt: daysAgo(6),
        metrics: { likes: 98, comments: 21, shares: 5, reach: 1600 },
        engagementScore: (0.5 * 98) + (0.3 * 21) + (0.2 * 5), engagementRate: 7.94,
        postHour: 8, postDayOfWeek: 1, contentCategory: "educational",
        hashtags: ["#LinkedIn", "#GrowthHacking", "#PersonalBranding", "#ContentMarketing"],
        imageUrl: "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg",
        platformPostId: "mock-li-002",
    },
    {
        topic: "AI vs manual marketing — which wins?",
        content: "We ran an experiment for 30 days:\n\n📌 Week 1–2: Manual content creation & posting\n📌 Week 3–4: AI-assisted content + smart scheduling\n\nResults:\n\n❌ Manual: 12 posts, avg 180 reach, 3.2% engagement\n✅ AI-powered: 21 posts, avg 380 reach, 8.7% engagement\n\nThe numbers don't lie. AI wins — not by replacing creativity but by amplifying it.\n\nWill you make the switch?\n\n#AIMarketing #DigitalMarketing #MarketingStrategy #Growth #MarketingAI",
        platform: "Instagram", tone: "Persuasive",
        status: "published", publishedAt: daysAgo(4),
        metrics: { likes: 310, comments: 45, shares: 18, reach: 4200 },
        engagementScore: (0.5 * 310) + (0.3 * 45) + (0.2 * 18), engagementRate: 9.12,
        postHour: 19, postDayOfWeek: 3, contentCategory: "promotional",
        hashtags: ["#AIMarketing", "#DigitalMarketing", "#MarketingStrategy", "#Growth", "#MarketingAI"],
        imageUrl: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg",
        platformPostId: "mock-ig-003",
    },
    {
        topic: "Behind the scenes of our product launch",
        content: "Behind every successful launch is weeks of sleepless nights and endless iteration.\n\nHere's what our journey looked like:\n\n• Month 1: Wireframes and user research\n• Month 2: Building the AI engine\n• Month 3: Beta testing with 50 users\n• Month 4: Refining based on feedback\n• Month 5: Launch day 🚀\n\nThe hardest part wasn't the code. It was staying consistent when progress felt invisible.\n\nKeep building. Your launch day is coming.\n\n#BuildInPublic #StartupJourney #Founders #SaaS",
        platform: "LinkedIn", tone: "Casual",
        status: "published", publishedAt: daysAgo(2),
        metrics: { likes: 178, comments: 29, shares: 7, reach: 2400 },
        engagementScore: (0.5 * 178) + (0.3 * 29) + (0.2 * 7), engagementRate: 8.92,
        postHour: 18, postDayOfWeek: 2, contentCategory: "engagement",
        hashtags: ["#BuildInPublic", "#StartupJourney", "#Founders", "#SaaS"],
        imageUrl: "https://images.pexels.com/photos/1181673/pexels-photo-1181673.jpeg",
        platformPostId: "mock-li-003",
    },
    // One scheduled post for live demo
    {
        topic: "Top 3 AI tools every marketer needs in 2026",
        content: "AI is reshaping marketing.\n\nHere are the top 3 tools you need right now:\n\n1. 🧠 MarketingAI — content creation + strategy\n2. 📧 AI Email Writer — personalised campaigns at scale\n3. 📊 AI Analytics — understand your audience faster\n\nWhich one are you already using?\n\n#AITools #Marketing2026 #DigitalMarketing #GrowthHacking",
        platform: "Instagram", tone: "Professional",
        status: "scheduled",
        scheduledAt: hoursFromNow(0.1), // ~6 minutes from now — goes live during demo!
        imageUrl: "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg",
    },
];

// ─── DEMO AGENT INSIGHTS ────────────────────────────
const agentInsights = {
    userId: DEMO_USER_ID,
    updatedAt: new Date().toISOString(),
    totalPostsAnalyzed: 6,
    bestHour: 19,
    bestDayOfWeek: 2,
    bestTone: "Professional",
    bestPlatform: "Instagram",
    bestContentCategory: "promotional",
    avgEngagementScore: 187.5,
    topHashtags: ["#MarketingAI", "#AI", "#ContentStrategy", "#ProductLaunch", "#GrowthHacking"],
    hourlyEngagement: Array.from({ length: 24 }, (_, i) =>
        i === 19 ? 195.2 : i === 20 ? 180.1 : i === 9 ? 145.3 : i === 8 ? 89.4 : i === 18 ? 160.7 : 0
    ),
    toneBreakdown: { Professional: 195.2, Persuasive: 188.4, Casual: 130.2, Inspirational: 241.8 },
    platformBreakdown: { Instagram: 195.2, LinkedIn: 142.8 },
    categoryBreakdown: { promotional: 218.3, educational: 152.4, engagement: 145.6, news: 0 },
    recentTrend: "up",
    confidence: 60,
    ...DEMO_TAG,
};

// ─── DEMO STRATEGY ──────────────────────────────────
const agentStrategy = {
    userId: DEMO_USER_ID,
    generatedAt: new Date().toISOString(),
    weeklyPostTarget: 4,
    recommendedPostTimes: ["Wed 19:00", "Fri 19:00", "Sun 20:00"],
    contentMix: { promotional: 50, educational: 20, engagement: 20, news: 10 },
    recommendedTone: "Professional",
    recommendedPlatform: "Instagram",
    recommendedHashtags: ["#MarketingAI", "#AI", "#ContentStrategy", "#GrowthHacking", "#StartupLife"],
    predictedCompositeScore: 72.4,
    reasoning: [
        "Posts at 19:00 have your highest average engagement score of 195.2.",
        "Your 'Professional' tone outperforms others by ~48% in engagement.",
        "Instagram gives ~37% better engagement than LinkedIn for your audience.",
        "'Promotional' posts drive the most engagement in your feed.",
        "Your engagement is trending upward — maintain current strategy momentum.",
    ],
    confidence: 60,
    status: "active",
    appliedWeights: { bestHourWeight: 1.0, toneWeight: 1.0 },
    ...DEMO_TAG,
};

// ─── DEMO FOLLOWER SNAPSHOTS ────────────────────────
const followerSnapshots = [
    { userId: DEMO_USER_ID, platform: "instagram", followerCount: 1240, date: new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10), recordedAt: daysAgo(13), ...DEMO_TAG },
    { userId: DEMO_USER_ID, platform: "instagram", followerCount: 1285, date: new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10), recordedAt: daysAgo(8), ...DEMO_TAG },
    { userId: DEMO_USER_ID, platform: "instagram", followerCount: 1347, date: new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10), recordedAt: daysAgo(4), ...DEMO_TAG },
    { userId: DEMO_USER_ID, platform: "instagram", followerCount: 1412, date: new Date().toISOString().slice(0, 10), recordedAt: new Date().toISOString(), ...DEMO_TAG },
    { userId: DEMO_USER_ID, platform: "linkedin", followerCount: 830, date: new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10), recordedAt: daysAgo(13), ...DEMO_TAG },
    { userId: DEMO_USER_ID, platform: "linkedin", followerCount: 875, date: new Date().toISOString().slice(0, 10), recordedAt: new Date().toISOString(), ...DEMO_TAG },
];

// ─── MAIN SEED ───────────────────────────────────────
async function seed() {
    console.log("\n🌱 MarketingAI — Seeding demo data...\n");

    if (DEMO_USER_ID === "REPLACE_WITH_YOUR_UID") {
        console.error("❌ ERROR: Please set DEMO_USER_ID to your Firebase UID first!");
        process.exit(1);
    }

    const seededIds = [];

    // Insert posts
    for (const post of posts) {
        const ref = await db.collection("posts").add({
            ...post,
            userId: DEMO_USER_ID,
            createdAt: post.publishedAt || new Date().toISOString(),
            ...DEMO_TAG,
        });
        seededIds.push({ collection: "posts", id: ref.id });
        console.log(`  ✅ Post: "${post.topic.slice(0, 45)}..." [${ref.id}]`);
    }

    // Insert agent insights
    await db.collection("agent_insights").doc(DEMO_USER_ID).set(agentInsights, { merge: false });
    seededIds.push({ collection: "agent_insights", id: DEMO_USER_ID });
    console.log("  ✅ Agent Insights saved");

    // Insert agent strategy
    await db.collection("agent_strategy").doc(DEMO_USER_ID).set(agentStrategy, { merge: false });
    seededIds.push({ collection: "agent_strategy", id: DEMO_USER_ID });
    console.log("  ✅ Agent Strategy saved");

    // Insert follower snapshots
    for (const snap of followerSnapshots) {
        const ref = await db.collection("follower_snapshots").add(snap);
        seededIds.push({ collection: "follower_snapshots", id: ref.id });
    }
    console.log(`  ✅ ${followerSnapshots.length} Follower Snapshots saved`);

    // Save seeded IDs to disk for cleanup script
    const fs = require("fs");
    fs.writeFileSync("scripts/demo-seed-ids.json", JSON.stringify(seededIds, null, 2));
    console.log("\n📋 Seeded IDs saved to scripts/demo-seed-ids.json");
    console.log("\n✅ Demo data seeded successfully! Open http://localhost:3000");
    console.log("🗑  After demo, run: node scripts/cleanup-demo.js\n");

    process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e); process.exit(1); });
