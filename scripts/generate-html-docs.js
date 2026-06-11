const fs = require("fs");
const path = require("path");

const IMG = "C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\4c5717d7-bcb3-4d93-aa02-c78cc10a7593\\";
const OUT = "C:\\Users\\ASUS\\OneDrive\\Desktop\\MarketingAI_Documentation.html";

function b64(file) {
    try {
        return "data:image/png;base64," + fs.readFileSync(file).toString("base64");
    } catch { return ""; }
}

const imgs = {
    dashboard: b64(IMG + "dashboard_full_page_1772378960056.png"),
    create: b64(IMG + "create_content_page_1772379030232.png"),
    analytics: b64(IMG + "analytics_dashboard_full_1772379147864.png"),
    strategy: b64(IMG + "strategy_agent_page_1772379211752.png"),
    schedule: b64(IMG + "schedule_page_loaded_1772379245996.png"),
    posts: b64(IMG + "my_posts_page_loaded_1772379234793.png"),
    settings: b64(IMG + "settings_page_loaded_1772379259952.png"),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MarketingAI — Platform Documentation</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1f2937;line-height:1.7;font-size:15px}
  .cover{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:80px 60px;text-align:center}
  .cover h1{font-size:56px;font-weight:900;margin-bottom:12px;letter-spacing:-1px}
  .cover p{font-size:20px;opacity:.85;margin-bottom:6px}
  .cover .sub{font-size:14px;opacity:.6;margin-top:16px}
  .toc{background:#fff;border-left:4px solid #4f46e5;margin:40px auto;max-width:900px;padding:32px 40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.07)}
  .toc h2{font-size:18px;color:#4f46e5;margin-bottom:16px;text-transform:uppercase;letter-spacing:.1em}
  .toc a{display:block;color:#374151;text-decoration:none;padding:4px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
  .toc a:hover{color:#4f46e5}
  .section{max-width:960px;margin:0 auto;padding:48px 40px}
  .section+.section{border-top:2px solid #e5e7eb}
  h2.sec{font-size:30px;font-weight:800;color:#4f46e5;margin-bottom:8px;padding-bottom:12px;border-bottom:3px solid #e0e7ff}
  h3{font-size:20px;font-weight:700;color:#1f2937;margin:28px 0 10px}
  h4{font-size:16px;font-weight:700;color:#4b5563;margin:20px 0 8px;text-transform:uppercase;letter-spacing:.06em}
  p{margin-bottom:12px;color:#374151}
  ul{margin:8px 0 16px 24px}
  li{margin-bottom:6px;color:#374151}
  .screenshot{width:100%;border-radius:12px;border:2px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,.12);margin:20px 0 8px;display:block}
  .caption{text-align:center;font-size:13px;color:#6b7280;font-style:italic;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:14px}
  th{background:#4f46e5;color:#fff;padding:10px 14px;text-align:left;font-weight:700}
  td{padding:9px 14px;border-bottom:1px solid #e5e7eb;color:#374151}
  tr:nth-child(even) td{background:#f9fafb}
  .formula{background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;margin:16px 0;font-family:'Courier New',monospace;font-size:13px;color:#14532d;white-space:pre-line}
  .infobox{background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:14px;color:#1e3a5f;white-space:pre-line}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .badge.blue{background:#dbeafe;color:#1d4ed8}
  .badge.green{background:#dcfce7;color:#166534}
  .badge.purple{background:#ede9fe;color:#6d28d9}
  .badge.amber{background:#fef3c7;color:#92400e}
  .step-row{display:flex;gap:16px;margin:8px 0}
  .step-num{width:28px;height:28px;background:#4f46e5;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;margin-top:2px}
  .element-card{border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:10px 0;background:#fff}
  .element-card h4{margin-top:0;color:#4f46e5}
  .footer{background:#1f2937;color:#9ca3af;text-align:center;padding:32px;font-size:13px}
  @media print{
    .section{padding:24px 20px}
    .screenshot{max-width:700px;margin:16px auto}
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>🤖 MarketingAI</h1>
  <p>AI-Powered Social Media Manager</p>
  <p>Complete Platform Documentation with Screenshots</p>
  <div class="sub">March 2026 · Next.js · Firebase · Google Gemini AI</div>
</div>

<!-- TOC -->
<div class="toc">
  <h2>Table of Contents</h2>
  <a href="#overview">1. Platform Overview & Tech Stack</a>
  <a href="#auth">2. Authentication System</a>
  <a href="#dashboard">3. Dashboard Home</a>
  <a href="#create">4. Create Content Page</a>
  <a href="#posts">5. My Posts Page</a>
  <a href="#schedule">6. Schedule / Calendar</a>
  <a href="#analytics">7. Analytics Page</a>
  <a href="#strategy">8. Strategy Agent — Complete Deep Dive</a>
  <a href="#settings">9. Settings Page</a>
  <a href="#backend">10. Backend Architecture & API Routes</a>
  <a href="#whats-next">11. What's Next</a>
</div>

<!-- 1. OVERVIEW -->
<div class="section" id="overview">
  <h2 class="sec">1. Platform Overview & Tech Stack</h2>
  <p>MarketingAI is a full-stack SaaS marketing platform that helps businesses generate AI-written content, schedule it, publish it to Instagram and LinkedIn, analyze its performance, and learn from data using an intelligent Strategy Agent — all in one place.</p>
  <div class="infobox">Core Loop:
  Post → Publish → Collect Engagement Data → Analyze → Decide → Post Better

  Every piece of the system feeds this loop. The Strategy Agent closes it automatically.</div>
  <h3>Technology Stack</h3>
  <table>
    <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
    <tr><td>Frontend</td><td>Next.js 14 (App Router) + TypeScript</td><td>Full-stack React framework, routing, SSR</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS + Framer Motion</td><td>UI design + page transition animations</td></tr>
    <tr><td>Auth</td><td>Firebase Auth + Admin SDK</td><td>JWT-based login, token verification per request</td></tr>
    <tr><td>Database</td><td>Firestore (Firebase)</td><td>Posts, users, insights, agent strategies</td></tr>
    <tr><td>Primary AI</td><td>Google Gemini 2.0 Flash</td><td>Captions, sentiment, strategy, replies, tone guard</td></tr>
    <tr><td>AI Fallback</td><td>Hugging Face Inference API</td><td>Backup if Gemini fails</td></tr>
    <tr><td>Social APIs</td><td>Facebook Graph API v18 + LinkedIn API v2</td><td>Publishing, metrics, comments, replies</td></tr>
    <tr><td>Images</td><td>Pexels API</td><td>Free stock photo search via server-side proxy</td></tr>
  </table>
</div>

<!-- 2. AUTH -->
<div class="section" id="auth">
  <h2 class="sec">2. Authentication System</h2>
  <p>Firebase Auth handles all authentication. Every API route is protected by verifying the user's JWT token before processing any request.</p>
  <h3>Login Flow — Step by Step</h3>
  <div class="step-row"><div class="step-num">1</div><div>User enters email + password on <code>/login</code></div></div>
  <div class="step-row"><div class="step-num">2</div><div>Firebase Auth SDK calls <code>signInWithEmailAndPassword()</code></div></div>
  <div class="step-row"><div class="step-num">3</div><div>Firebase issues a short-lived JWT ID Token (1 hour TTL, auto-refreshed)</div></div>
  <div class="step-row"><div class="step-num">4</div><div>Every API call sends: <code>Authorization: Bearer &lt;token&gt;</code></div></div>
  <div class="step-row"><div class="step-num">5</div><div>Each API route calls <code>getAuth().verifyIdToken(token)</code> — rejects any expired or tampered tokens</div></div>
  <h3>Security Principles</h3>
  <ul>
    <li>Tokens stored in React memory, never in localStorage</li>
    <li>Dashboard layout auto-redirects to <code>/login</code> if no valid session</li>
    <li>Every API verifies <code>post.userId === uid</code> before modifying any data (ownership check)</li>
    <li>Social access tokens (Instagram, LinkedIn) stored server-side in Firestore — never exposed to frontend</li>
  </ul>
</div>

<!-- 3. DASHBOARD -->
<div class="section" id="dashboard">
  <h2 class="sec">3. Dashboard Home (/dashboard)</h2>
  <p>The central hub showing a real-time overview of performance, AI suggestions, and quick access to all features.</p>
  ${imgs.dashboard ? `<img class="screenshot" src="${imgs.dashboard}" alt="Dashboard Home"/>
  <div class="caption">Dashboard Home — Stats row, AI Content Scout panel, Strategy Agent banner, and Upcoming Content checklist</div>` : ""}
  <h3>Page Elements Explained</h3>
  <div class="element-card">
    <h4>① Header Stats Row (6 Cards)</h4>
    <table>
      <tr><th>Card</th><th>Data Source</th><th>Formula / Logic</th></tr>
      <tr><td>Reach</td><td>Firestore metrics.reach</td><td>Sum of reach across all published posts</td></tr>
      <tr><td>Likes</td><td>Firestore metrics.likes</td><td>Sum of all likes</td></tr>
      <tr><td>Comments</td><td>Firestore metrics.comments</td><td>Sum of all comments</td></tr>
      <tr><td>Engagement Rate</td><td>Computed on load</td><td>(likes + comments) / reach × 100</td></tr>
      <tr><td>Shares</td><td>Firestore metrics.shares</td><td>Sum of all shares</td></tr>
      <tr><td>Upcoming</td><td>Firestore query</td><td>Count of posts with status = "scheduled"</td></tr>
    </table>
  </div>
  <div class="element-card">
    <h4>② AI Content Scout Panel</h4>
    <p>Clicking "Scan for Trends" calls <code>POST /api/agent/scout</code>. Gemini generates 3 trending topic posts tailored to the user's business profile and saves them as <code>suggested</code> drafts in Firestore. Posts appear immediately in this panel for review.</p>
  </div>
  <div class="element-card">
    <h4>③ Strategy Agent Banner</h4>
    <p>A click-through card that links to <code>/dashboard/strategy</code>. Describes the agent's role: it learns from engagement history and recommends what to post, when, and how.</p>
  </div>
  <div class="element-card">
    <h4>④ Upcoming Content</h4>
    <p>Lists upcoming scheduled posts. For new users, shows a "getting started" checklist: connect accounts → create first post → schedule → view analytics.</p>
  </div>
</div>

<!-- 4. CREATE -->
<div class="section" id="create">
  <h2 class="sec">4. Create Content Page (/dashboard/create)</h2>
  <p>The AI-powered content creation workspace. Enter a topic, pick a tone and platform, and Gemini writes a publish-ready caption with hashtags.</p>
  ${imgs.create ? `<img class="screenshot" src="${imgs.create}" alt="Create Content"/>
  <div class="caption">Create Content — Post Details form (left), Visual Studio (center), Trend Navigator + Tone Guard (right)</div>` : ""}
  <h3>Left Panel — Post Details Form</h3>
  <table>
    <tr><th>Field</th><th>Purpose</th></tr>
    <tr><td>What is this post about?</td><td>Main topic/brief — becomes the core Gemini prompt</td></tr>
    <tr><td>Keywords (optional)</td><td>Extra terms to weave into the caption</td></tr>
    <tr><td>Platform</td><td>Instagram / LinkedIn / Twitter — adjusts character limits and writing style</td></tr>
    <tr><td>Tone</td><td>Professional / Casual / Humorous / Inspirational / Persuasive</td></tr>
    <tr><td>Generate Content</td><td>Calls <code>POST /api/content/generate</code> → returns Gemini-written caption</td></tr>
  </table>
  <h3>Gemini Prompt Structure</h3>
  <div class="formula">You are a {tone} social media expert for a {industry} business.
Write a {platform} post about: {topic}
Keywords to include: {keywords}
Include 5 relevant hashtags. Keep it under {character_limit} characters.</div>
  <h3>Center Panel — Visual Studio</h3>
  <ul>
    <li><strong>AI Create</strong> — generates an image using Gemini's image generation capability based on the post topic</li>
    <li><strong>Find Image</strong> — searches Pexels API (routed through server-side proxy) for free stock photos</li>
    <li><strong>Upload</strong> — user uploads their own image</li>
  </ul>
  <p>Images are stored as CDN URLs (never uploaded to Firebase Storage) to eliminate storage costs.</p>
  <h3>Right Sidebars</h3>
  <div class="element-card">
    <h4>Trend Navigator</h4>
    <p>Auto-generates 5 trending topics for the user's industry using Gemini with the current date as context. Refreshes each page load. Click a topic to auto-fill the post form.</p>
  </div>
  <div class="element-card">
    <h4>Tone &amp; Quality Guard</h4>
    <p>After generating content, "CHECK" calls <code>POST /api/agent/tone-guard</code>. Gemini compares the writing style to the user's configured brand tone. If misaligned (e.g., too formal for a casual brand), it highlights the issue with a rewrite suggestion.</p>
  </div>
</div>

<!-- 5. MY POSTS -->
<div class="section" id="posts">
  <h2 class="sec">5. My Posts Page (/dashboard/posts)</h2>
  <p>Central management hub for all posts regardless of status.</p>
  ${imgs.posts ? `<img class="screenshot" src="${imgs.posts}" alt="My Posts"/>
  <div class="caption">My Posts — All content in a unified view with status badges and quick actions</div>` : ""}
  <h3>Post Statuses</h3>
  <table>
    <tr><th>Status</th><th>Meaning</th><th>Available Actions</th></tr>
    <tr><td><span class="badge amber">draft</span></td><td>Saved but not yet scheduled</td><td>Schedule, Publish Now, Edit, Delete</td></tr>
    <tr><td><span class="badge purple">suggested</span></td><td>Created by AI Content Scout</td><td>Review, Customize, then Schedule or Publish</td></tr>
    <tr><td><span class="badge blue">scheduled</span></td><td>Queued for future publishing</td><td>Edit time, Cancel, Publish Now</td></tr>
    <tr><td><span class="badge green">published</span></td><td>Live on the platform</td><td>View metrics, Analyze Sentiment, Reply to comments</td></tr>
  </table>
</div>

<!-- 6. SCHEDULE -->
<div class="section" id="schedule">
  <h2 class="sec">6. Schedule / Calendar (/dashboard/schedule)</h2>
  <p>Month-at-a-glance view of all scheduled and published content to help visualize posting consistency and gaps.</p>
  ${imgs.schedule ? `<img class="screenshot" src="${imgs.schedule}" alt="Schedule Calendar"/>
  <div class="caption">Schedule — Monthly calendar with posts shown as color-coded chips on their scheduled dates</div>` : ""}
  <h3>How It Works</h3>
  <ul>
    <li>Built with pure React state — no external calendar library</li>
    <li>Each day cell queries Firestore for posts whose <code>scheduledAt</code> falls on that date</li>
    <li>Posts appear as colored chips (blue = scheduled, green = published)</li>
    <li>Click any chip to open that post for editing</li>
    <li>Seeing gaps in the calendar motivates consistent posting</li>
  </ul>
</div>

<!-- 7. ANALYTICS -->
<div class="section" id="analytics">
  <h2 class="sec">7. Analytics Page (/dashboard/analytics)</h2>
  <p>Full engagement analytics with real-time metrics sync from Instagram and LinkedIn, plus AI-powered sentiment analysis on comments.</p>
  ${imgs.analytics ? `<img class="screenshot" src="${imgs.analytics}" alt="Analytics"/>
  <div class="caption">Analytics — Total Reach, Likes, Comments, Shares, Audience Growth chart, Channel Performance breakdown</div>` : ""}
  <h3>Sync Fresh Data — How It Works</h3>
  <div class="step-row"><div class="step-num">1</div><div>User clicks "Sync Fresh Data" → calls <code>POST /api/analytics/sync</code></div></div>
  <div class="step-row"><div class="step-num">2</div><div>Fetches all published posts for the user from Firestore</div></div>
  <div class="step-row"><div class="step-num">3</div><div>For each post, calls platform API: Instagram Graph API <code>/media/{id}/insights</code> or LinkedIn <code>/v2/socialMetadata/{id}</code></div></div>
  <div class="step-row"><div class="step-num">4</div><div>Writes back <code>metrics: { likes, comments, shares, reach }</code> to each Firestore post document</div></div>
  <div class="step-row"><div class="step-num">5</div><div><strong>Auto-triggers Observer agent in background</strong> to re-score engagement (fire-and-forget, non-blocking)</div></div>
  <h3>Analyze Pulse — Sentiment Modal</h3>
  <p>Clicking "Analyze Pulse" on any published post opens a modal:</p>
  <ul>
    <li>Fetches all comments from the platform via the comments API</li>
    <li>Sends comment texts to Gemini: <em>"Analyze sentiment. Return: score 0–100, dominant emotion, top positive/negative themes, summary."</em></li>
    <li>Displays: score gauge, positive/negative/neutral split, theme chips, individual comments</li>
  </ul>
  <h3>AI Reply Suggestions (inside Pulse Modal)</h3>
  <ul>
    <li>"Suggest Reply" → <code>POST /api/agent/suggest-reply</code> → Gemini writes brand-aligned reply</li>
    <li>Reply appears in an <strong>editable textarea</strong> — user can modify before posting</li>
    <li>"Post Reply" → <code>POST /api/agent/post-reply</code> → posts directly to Instagram (Graph API <code>/replies</code>) or LinkedIn (nested comments)</li>
    <li>After posting: textarea disabled, shows "Posted!" — prevents double-posting</li>
  </ul>
</div>

<!-- 8. STRATEGY AGENT -->
<div class="section" id="strategy">
  <h2 class="sec">8. Strategy Agent — Complete Deep Dive (/dashboard/strategy)</h2>
  <p>The most sophisticated feature. An analytical AI feedback loop that observes what works in your posts, finds patterns, and prescribes a data-driven weekly content strategy.</p>
  ${imgs.strategy ? `<img class="screenshot" src="${imgs.strategy}" alt="Strategy Agent"/>
  <div class="caption">Strategy Agent — Empty state before first run. Shows the "Run Strategy Agent" button and guidance to publish 3+ posts first.</div>` : ""}
  <div class="infobox">Agent runs in 3 sequential stages:
  STAGE 1 — OBSERVE:  Score every post with engagement metrics
  STAGE 2 — ANALYZE:  Detect patterns across hours, tones, platforms, categories
  STAGE 3 — PLAN:     Generate a weekly strategy with plain-English reasoning</div>

  <h3>Stage 1 — OBSERVER MODULE</h3>
  <p><strong>File:</strong> <code>lib/agent/observer.ts</code> &nbsp;|&nbsp; <strong>Trigger:</strong> <code>POST /api/agent/observe</code> &nbsp;|&nbsp; <strong>Auto-runs:</strong> After every analytics sync</p>
  <h4>Engagement Score Formula</h4>
  <div class="formula">engagementScore = (0.5 × likes) + (0.3 × comments) + (0.2 × shares)

Example: 100 likes, 30 comments, 10 shares
= (0.5 × 100) + (0.3 × 30) + (0.2 × 10)
= 50 + 9 + 2 = 61.0</div>
  <table>
    <tr><th>Action</th><th>Weight</th><th>Reason</th></tr>
    <tr><td>Likes</td><td><strong>0.5</strong></td><td>Most common action, moderate signal</td></tr>
    <tr><td>Comments</td><td><strong>0.3</strong></td><td>Higher intent — active engagement is harder to get</td></tr>
    <tr><td>Shares</td><td><strong>0.2</strong></td><td>Strongest virality signal but rarest — lower weight prevents outlier distortion</td></tr>
  </table>
  <h4>Engagement Rate Formula</h4>
  <div class="formula">engagementRate = (engagementScore / reach) × 100

Why: Normalizes performance across posts of different audience sizes.
Post A: score 50 from 500 reach = 10% → outperforms
Post B: score 200 from 5000 reach = 4%</div>
  <h4>Other Fields Computed per Post</h4>
  <ul>
    <li><code>postHour</code> = <code>publishedDate.getHours()</code> (0–23)</li>
    <li><code>postDayOfWeek</code> = <code>publishedDate.getDay()</code> (0=Sun, 6=Sat)</li>
    <li><code>hashtags</code> = all <code>#tags</code> extracted via regex <code>/#[\w]+/g</code></li>
    <li><code>contentCategory</code> = promotional / educational / engagement / news (keyword heuristic)</li>
  </ul>

  <h3>Stage 2 — ANALYZER MODULE</h3>
  <p><strong>File:</strong> <code>lib/agent/analyzer.ts</code> &nbsp;|&nbsp; <strong>Output:</strong> <code>agent_insights/{userId}</code> in Firestore</p>
  <h4>Pattern Detection — Group-By-Average</h4>
  <div class="formula">For each dimension (hour, tone, platform, category):
  Group all posts by value → calculate mean(engagementScore) per group → find max

Example hourly breakdown:
  Hour 07 → avg 12.3  (2 posts)
  Hour 12 → avg 18.7  (3 posts)
  Hour 19 → avg 41.2  (5 posts)  ← bestHour = 19
  Hour 21 → avg 22.1  (2 posts)</div>
  <h4>7-Day Trend Detection</h4>
  <div class="formula">last7Avg  = mean(scores for posts in last 7 days)
prev7Avg  = mean(scores for posts 8–14 days ago)
delta     = ((last7Avg - prev7Avg) / prev7Avg) × 100

if delta >= 5%:   recentTrend = "up"   ↑
if delta <= -5%:  recentTrend = "down" ↓
else:             recentTrend = "stable" →</div>
  <h4>Confidence Score</h4>
  <table>
    <tr><th>Posts Analyzed</th><th>Confidence</th><th>Label</th></tr>
    <tr><td>&lt; 3</td><td>10%</td><td>Very Low — not enough data</td></tr>
    <tr><td>3–4</td><td>30%</td><td>Low</td></tr>
    <tr><td>5–9</td><td>60%</td><td>Medium</td></tr>
    <tr><td>10–19</td><td>80%</td><td>High</td></tr>
    <tr><td>20+</td><td>100%</td><td>Very High</td></tr>
  </table>

  <h3>Stage 3 — PLANNER MODULE</h3>
  <p><strong>File:</strong> <code>lib/agent/planner.ts</code> &nbsp;|&nbsp; <strong>Output:</strong> <code>agent_strategy/{userId}</code> in Firestore</p>
  <h4>Weekly Post Target</h4>
  <div class="formula">confidence >= 80  → weeklyPostTarget = 5
confidence >= 50  → weeklyPostTarget = 4
else              → weeklyPostTarget = 3</div>
  <h4>Recommended Post Times</h4>
  <div class="formula">Slot 1: bestDay         at bestHour:00
Slot 2: bestDay + 2 days at bestHour:00
Slot 3: bestDay + 4 days at bestHour:00

If bestDay=Tuesday, bestHour=19 → ["Tue 19:00", "Thu 19:00", "Sat 19:00"]</div>
  <h4>Content Mix Formula</h4>
  <table>
    <tr><th>Best Performing Category</th><th>Promotional</th><th>Educational</th><th>Engagement</th><th>News</th></tr>
    <tr><td>promotional</td><td>50%</td><td>20%</td><td>20%</td><td>10%</td></tr>
    <tr><td>educational</td><td>20%</td><td>50%</td><td>20%</td><td>10%</td></tr>
    <tr><td>engagement</td><td>20%</td><td>20%</td><td>50%</td><td>10%</td></tr>
    <tr><td>news</td><td>20%</td><td>30%</td><td>20%</td><td>30%</td></tr>
  </table>
  <h4>Sample Agent Reasoning Output</h4>
  <div class="formula">"Posts at 19:00 have your highest average engagement score."
"Your 'Casual' tone outperforms others by ~42% in engagement."
"Instagram gives ~120% better engagement than other platforms."
"'promotional' posts drive the most engagement in your feed."
"Your engagement is trending upward — maintain current strategy momentum."</div>

  <h3>Dashboard UI — Every Element Explained</h3>
  <table>
    <tr><th>Element</th><th>What It Shows</th><th>Why It's There</th></tr>
    <tr><td>Run Strategy Agent button</td><td>Triggers observe → analyze → plan pipeline</td><td>Manual control — user decides when to refresh</td></tr>
    <tr><td>Posts Analyzed card</td><td>Total posts scored by Observer</td><td>Shows agent data quality</td></tr>
    <tr><td>Avg Engagement Score card</td><td>Mean score across all posts</td><td>Baseline performance benchmark</td></tr>
    <tr><td>Best Platform card</td><td>Instagram or LinkedIn — highest avg score</td><td>Where to focus effort</td></tr>
    <tr><td>Recent Trend card</td><td>↑ Up / ↓ Down / → Stable (7-day delta)</td><td>Early warning system for performance changes</td></tr>
    <tr><td>Hourly Heatmap</td><td>24-cell grid, purple opacity = avg score</td><td>Instantly shows the best hour to post</td></tr>
    <tr><td>Platform Bars</td><td>Horizontal score bars per platform</td><td>ROI comparison between channels</td></tr>
    <tr><td>Tone &amp; Category Bars</td><td>Which writing style / content type wins</td><td>Informs how to write future posts</td></tr>
    <tr><td>Top Hashtags</td><td>Tags ranked by avg post score</td><td>Tells user which tags drive the most engagement</td></tr>
    <tr><td>Weekly Strategy Card</td><td>Post target, times, tone, platform, mix, hashtags</td><td>Complete action plan for the week</td></tr>
    <tr><td>Confidence Badge</td><td>High / Medium / Low + %</td><td>Prevents over-reliance on sparse data</td></tr>
    <tr><td>Agent Reasoning list</td><td>Plain-English explanation for every recommendation</td><td>Builds trust — every suggestion has a data reason</td></tr>
  </table>
</div>

<!-- 9. SETTINGS -->
<div class="section" id="settings">
  <h2 class="sec">9. Settings Page (/dashboard/settings)</h2>
  ${imgs.settings ? `<img class="screenshot" src="${imgs.settings}" alt="Settings"/>
  <div class="caption">Settings — Integrations tab showing Instagram and LinkedIn connection cards with "Link Account" OAuth buttons</div>` : ""}
  <h3>Instagram Connection — OAuth Flow</h3>
  <div class="step-row"><div class="step-num">1</div><div>"Link Account" → redirects to Meta OAuth via <code>GET /api/auth/instagram</code></div></div>
  <div class="step-row"><div class="step-num">2</div><div>User approves on Meta consent screen (permissions: <code>instagram_manage_comments</code>, <code>instagram_content_publish</code>)</div></div>
  <div class="step-row"><div class="step-num">3</div><div>Meta redirects to <code>/api/auth/instagram/callback</code> with an authorization code</div></div>
  <div class="step-row"><div class="step-num">4</div><div>Server exchanges code for long-lived access token and saves to Firestore: <code>users/{uid}/connections/instagram</code></div></div>
  <h3>LinkedIn Connection</h3>
  <p>Same OAuth flow via <code>GET /api/auth/linkedin</code>. Stores <code>{ linkedinId, accessToken, memberId }</code> in Firestore.</p>
</div>

<!-- 10. BACKEND -->
<div class="section" id="backend">
  <h2 class="sec">10. Backend Architecture & API Routes</h2>
  <table>
    <tr><th>Method</th><th>Route</th><th>Description</th></tr>
    <tr><td>GET/POST</td><td>/api/user/profile</td><td>Fetch or update business profile</td></tr>
    <tr><td>GET/POST</td><td>/api/posts</td><td>List all posts / create new post</td></tr>
    <tr><td>GET/PATCH/DELETE</td><td>/api/posts/{id}</td><td>Read / update / delete a single post</td></tr>
    <tr><td>GET</td><td>/api/posts/{id}/comments</td><td>Fetch comments from the social platform</td></tr>
    <tr><td>POST</td><td>/api/content/generate</td><td>Generate AI caption via Gemini</td></tr>
    <tr><td>GET</td><td>/api/auth/instagram</td><td>Start Instagram OAuth redirect</td></tr>
    <tr><td>GET</td><td>/api/auth/instagram/callback</td><td>Complete token exchange + save</td></tr>
    <tr><td>GET</td><td>/api/auth/linkedin</td><td>Start LinkedIn OAuth redirect</td></tr>
    <tr><td>GET</td><td>/api/auth/linkedin/callback</td><td>Complete LinkedIn token exchange</td></tr>
    <tr><td>POST</td><td>/api/analytics/sync</td><td>Sync metrics from platforms + auto-trigger Observer</td></tr>
    <tr><td>POST</td><td>/api/analytics/sentiment</td><td>Run Gemini sentiment analysis on comments</td></tr>
    <tr><td>GET</td><td>/api/analytics/timing</td><td>Best posting time analysis</td></tr>
    <tr><td>POST</td><td>/api/agent/observe</td><td>Run Observer module manually</td></tr>
    <tr><td>POST</td><td>/api/agent/analyze</td><td>Run Analyzer → write agent_insights</td></tr>
    <tr><td>GET/POST</td><td>/api/agent/plan</td><td>Fetch existing / generate new weekly strategy</td></tr>
    <tr><td>POST</td><td>/api/agent/scout</td><td>Run Content Scout — generate suggested posts</td></tr>
    <tr><td>POST</td><td>/api/agent/suggest-reply</td><td>Generate AI reply to a comment</td></tr>
    <tr><td>POST</td><td>/api/agent/post-reply</td><td>Post a reply directly to the platform</td></tr>
    <tr><td>POST</td><td>/api/agent/tone-guard</td><td>Validate content against brand tone</td></tr>
  </table>
</div>

<!-- 11. NEXT -->
<div class="section" id="whats-next">
  <h2 class="sec">11. What's Next</h2>
  <h3>Phase 7 — Team Workspaces (Not Yet Built)</h3>
  <table>
    <tr><th>Feature</th><th>What It Enables</th></tr>
    <tr><td>Workspace Firestore collection</td><td>Group users + posts under one workspace</td></tr>
    <tr><td>Membership system</td><td>Link multiple users to the same workspace</td></tr>
    <tr><td>Workspace-scoped posts</td><td>Posts belong to workspace, not individual user</td></tr>
    <tr><td>Invitation by email</td><td>Invite team members with a magic link</td></tr>
    <tr><td>Role-Based Access Control</td><td>Admin: publish | Member: draft only</td></tr>
  </table>
  <h3>Optional Future Enhancements</h3>
  <table>
    <tr><th>Feature</th><th>Value</th></tr>
    <tr><td>Strategy Executor</td><td>Agent auto-schedules posts based on the strategy plan</td></tr>
    <tr><td>Twitter/X Integration</td><td>Third platform connector</td></tr>
    <tr><td>Engagement Prediction</td><td>Score a draft before publishing using historical patterns</td></tr>
    <tr><td>Monthly Campaign Planning</td><td>Full month strategy, not just one week</td></tr>
    <tr><td>Push Notifications</td><td>Alert when posts perform unusually well or drop</td></tr>
    <tr><td>PDF Export</td><td>Download performance reports as formatted PDFs</td></tr>
  </table>
</div>

<div class="footer">
  MarketingAI Platform Documentation — March 2026<br/>
  Built with Next.js · Firebase · Google Gemini AI · Instagram Graph API · LinkedIn API
</div>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log("✅ HTML documentation generated:", OUT);
console.log("   Open it in any browser (Chrome, Edge, Firefox).");
console.log("   To save as PDF: browser → Print → Save as PDF");
