"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    Loader2, Image as ImageIcon, Clock, CheckCircle2, FileText,
    Instagram, Linkedin, Twitter, Globe, ChevronDown, ChevronUp,
    Calendar, Hash, BarChart2, Eye, Heart, MessageCircle, Share2,
    ExternalLink, ArrowLeft, RefreshCw, Search, Filter
} from "lucide-react";

interface Post {
    id: string;
    content: string;
    platform: string;
    createdAt: string;
    status: string;
    imageUrl?: string;
    topic: string;
    keywords?: string;
    tone?: string;
    scheduledAt?: string;
    publishedAt?: string;
    platformPostId?: string;
    engagementScore?: number;
    metrics?: {
        likes?: number;
        comments?: number;
        shares?: number;
        reach?: number;
        impressions?: number;
    };
}

// ── Platform config ──────────────────────────────────────────────
const PLATFORMS = [
    {
        id: "All",
        label: "All Platforms",
        icon: Globe,
        color: "text-foreground",
        bg: "bg-muted/50",
        border: "border-border",
        badge: "bg-muted text-foreground",
        accent: "from-slate-500 to-slate-700",
    },
    {
        id: "Instagram",
        label: "Instagram",
        icon: Instagram,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        border: "border-pink-500/30",
        badge: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
        accent: "from-pink-500 to-purple-600",
    },
    {
        id: "LinkedIn",
        label: "LinkedIn",
        icon: Linkedin,
        color: "text-blue-600",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
        accent: "from-blue-600 to-blue-800",
    },
    {
        id: "Twitter",
        label: "Twitter / X",
        icon: Twitter,
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
        accent: "from-sky-400 to-sky-600",
    },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft:     { label: "Draft",     color: "bg-muted text-muted-foreground",              icon: <FileText className="h-3 w-3" /> },
    scheduled: { label: "Scheduled", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", icon: <Clock className="h-3 w-3" /> },
    published: { label: "Published", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> },
};

function getPlatformCfg(id: string) {
    return PLATFORMS.find(p => p.id === id) ?? PLATFORMS[0];
}

// ── Expanded Detail Panel ────────────────────────────────────────
function PostDetailPanel({ post }: { post: Post }) {
    const platform = getPlatformCfg(post.platform);
    const PIcon = platform.icon;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 rounded-2xl p-5 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Left: Image + meta */}
            <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                    {post.imageUrl
                        ? <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover" />
                        : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    }
                </div>
                <div className="space-y-2 text-xs">
                    {[
                        { label: "Post ID",     value: post.id.slice(0, 16) + "…" },
                        { label: "Platform",    value: post.platform, icon: <PIcon className={`h-3 w-3 ${platform.color}`} /> },
                        { label: "Tone",        value: post.tone || "—" },
                        { label: "Created",     value: new Date(post.createdAt).toLocaleString() },
                        ...(post.scheduledAt ? [{ label: "Scheduled", value: new Date(post.scheduledAt).toLocaleString() }] : []),
                        ...(post.publishedAt  ? [{ label: "Published", value: new Date(post.publishedAt).toLocaleString() }] : []),
                        ...(post.platformPostId ? [{ label: "Platform ID", value: post.platformPostId }] : []),
                    ].map(row => (
                        <div key={row.label} className="flex items-center justify-between gap-2 py-1 border-b border-border/30 last:border-0">
                            <span className="text-muted-foreground font-medium">{row.label}</span>
                            <span className="flex items-center gap-1 font-semibold text-foreground truncate max-w-[150px]">
                                {"icon" in row && row.icon}{row.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Full content + keywords */}
            <div className="space-y-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Full Caption</p>
                    <div className="bg-card border border-border rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {post.content || <span className="text-muted-foreground italic">No content</span>}
                    </div>
                </div>
                {post.keywords && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Keywords / Hashtags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {post.keywords.split(/[\s,]+/).filter(Boolean).map((kw, i) => (
                                <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${platform.badge}`}>
                                    {kw.startsWith("#") ? kw : `#${kw}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Metrics */}
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <BarChart2 className="h-3 w-3" /> Engagement Metrics
                </p>

                {post.engagementScore !== undefined && (
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${platform.accent} text-white text-center`}>
                        <p className="text-3xl font-black">{post.engagementScore.toFixed(1)}</p>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Engagement Score</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: <Heart className="h-4 w-4 text-red-400" />,        label: "Likes",       value: post.metrics?.likes },
                        { icon: <MessageCircle className="h-4 w-4 text-blue-400" />, label: "Comments",  value: post.metrics?.comments },
                        { icon: <Share2 className="h-4 w-4 text-green-400" />,     label: "Shares",      value: post.metrics?.shares },
                        { icon: <Eye className="h-4 w-4 text-purple-400" />,       label: "Reach",       value: post.metrics?.reach },
                    ].map(m => (
                        <div key={m.label} className="bg-card border border-border rounded-xl p-3 text-center">
                            <div className="flex justify-center mb-1">{m.icon}</div>
                            <p className="text-lg font-black">{m.value ?? "—"}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{m.label}</p>
                        </div>
                    ))}
                </div>

                <Link
                    href={`/dashboard/create?edit=${post.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors"
                >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Editor
                </Link>
            </div>
        </div>
    );
}

// ── Platform Stats Bar ───────────────────────────────────────────
function PlatformStats({ posts, platformId }: { posts: Post[]; platformId: string }) {
    const filtered = platformId === "All" ? posts : posts.filter(p => p.platform === platformId);
    const total     = filtered.length;
    const published = filtered.filter(p => p.status === "published").length;
    const scheduled = filtered.filter(p => p.status === "scheduled").length;
    const drafts    = filtered.filter(p => p.status === "draft").length;
    const avgScore  = filtered.filter(p => p.engagementScore).length > 0
        ? filtered.reduce((s, p) => s + (p.engagementScore || 0), 0) / filtered.filter(p => p.engagementScore).length
        : null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
                { label: "Total Posts",       value: total,     color: "text-foreground",    bg: "bg-muted/50" },
                { label: "Published",          value: published, color: "text-emerald-600",  bg: "bg-emerald-500/10" },
                { label: "Scheduled",          value: scheduled, color: "text-amber-600",    bg: "bg-amber-500/10" },
                { label: "Drafts",             value: drafts,    color: "text-muted-foreground", bg: "bg-muted/30" },
                { label: "Avg Eng. Score",     value: avgScore !== null ? avgScore.toFixed(1) : "—", color: "text-primary", bg: "bg-primary/10" },
            ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-border/50 text-center`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{s.label}</p>
                </div>
            ))}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────
export default function PlatformPostsPage() {
    const { user } = useAuth();
    const [posts, setPosts]           = useState<Post[]>([]);
    const [loading, setLoading]       = useState(true);
    const [activePlatform, setActive] = useState("All");
    const [expandedId, setExpanded]   = useState<string | null>(null);
    const [search, setSearch]         = useState("");
    const [statusFilter, setStatus]   = useState<"all" | "draft" | "scheduled" | "published">("all");
    const [sortBy, setSort]           = useState<"newest" | "oldest" | "score">("newest");

    useEffect(() => { if (user) fetchPosts(); }, [user]);

    async function fetchPosts() {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/posts", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    // ── Filtering + sorting ──────────────────────────────────────
    const visible = posts
        .filter(p => activePlatform === "All" || p.platform === activePlatform)
        .filter(p => statusFilter === "all" || p.status === statusFilter)
        .filter(p => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                p.topic?.toLowerCase().includes(q) ||
                p.content?.toLowerCase().includes(q) ||
                p.keywords?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === "score")  return (b.engagementScore || 0) - (a.engagementScore || 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    if (loading) return (
        <div className="h-64 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading all posts...
        </div>
    );

    return (
        <div className="space-y-6 pb-12">

            {/* ── Header ── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/posts" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-3xl font-extrabold tracking-tight">Platform Post Details</h1>
                    </div>
                    <p className="text-muted-foreground">All-time post history grouped by platform — full details for every post.</p>
                </div>
                <button
                    onClick={fetchPosts}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            {/* ── Platform Tabs ── */}
            <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map(p => {
                    const count = p.id === "All" ? posts.length : posts.filter(x => x.platform === p.id).length;
                    const PIcon = p.icon;
                    const active = activePlatform === p.id;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setActive(p.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all
                                ${active
                                    ? `${p.bg} ${p.border} ${p.color} shadow-sm`
                                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <PIcon className="h-4 w-4" />
                            {p.label}
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? p.badge : "bg-muted text-muted-foreground"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Stats ── */}
            <PlatformStats posts={posts} platformId={activePlatform} />

            {/* ── Filters + Search ── */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search topic, content, keywords..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
                    {(["all", "draft", "scheduled", "published"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all
                                ${statusFilter === s ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => setSort(e.target.value as any)}
                    className="text-xs font-bold py-2 px-3 bg-card border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="score">Highest Score</option>
                </select>

                <span className="text-xs text-muted-foreground ml-auto">{visible.length} posts</span>
            </div>

            {/* ── Posts Table ── */}
            {visible.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-2xl">
                    <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">No posts found for this filter.</p>
                    <Link href="/dashboard/create" className="text-primary hover:underline text-sm mt-2 block">Create your first post</Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {visible.map(post => {
                        const platform = getPlatformCfg(post.platform);
                        const status   = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
                        const PIcon    = platform.icon;
                        const expanded = expandedId === post.id;

                        return (
                            <div key={post.id} className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200
                                ${expanded ? "border-primary/40 shadow-md shadow-primary/10" : "border-border hover:border-border/80 hover:shadow-sm"}`}>

                                {/* Row Header — always visible */}
                                <button
                                    onClick={() => setExpanded(expanded ? null : post.id)}
                                    className="w-full flex items-center gap-4 p-4 text-left group"
                                >
                                    {/* Thumbnail */}
                                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0 border border-border">
                                        {post.imageUrl
                                            ? <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                                              </div>
                                        }
                                    </div>

                                    {/* Topic + snippet */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{post.topic || "Untitled Post"}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.content?.slice(0, 120)}</p>
                                    </div>

                                    {/* Platform badge */}
                                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${platform.bg} ${platform.color} border ${platform.border} flex-shrink-0`}>
                                        <PIcon className="h-3.5 w-3.5" />
                                        {post.platform}
                                    </div>

                                    {/* Status badge */}
                                    <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${status.color} flex-shrink-0`}>
                                        {status.icon}
                                        {status.label}
                                    </div>

                                    {/* Date */}
                                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    </div>

                                    {/* Score */}
                                    {post.engagementScore !== undefined && (
                                        <div className="hidden md:flex flex-col items-center flex-shrink-0">
                                            <span className="text-sm font-black text-primary">{post.engagementScore.toFixed(1)}</span>
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Score</span>
                                        </div>
                                    )}

                                    {/* Expand icon */}
                                    <div className="text-muted-foreground flex-shrink-0 ml-2">
                                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {expanded && (
                                    <div className="px-4 pb-4">
                                        <PostDetailPanel post={post} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
