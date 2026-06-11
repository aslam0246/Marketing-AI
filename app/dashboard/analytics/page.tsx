"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    Users,
    TrendingUp,
    MessageSquare,
    MousePointer2,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Instagram,
    Linkedin,
    Twitter,
    RefreshCw,
    Loader2,
    Filter,
    Download,
    Brain,
    Smile,
    Frown,
    Meh,
    ExternalLink,
    X,
    MessageCircle,
    Send,
    Copy,
    CheckCircle
} from "lucide-react";

interface Post {
    id: string;
    topic: string;
    platform: string;
    status: string;
    publishedAt?: string;
    metrics?: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
    };
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [timeRange, setTimeRange] = useState("Last 30 Days");
    const [analyzingPost, setAnalyzingPost] = useState<Post | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        sentiment: string;
        score: number;
        themes: string[];
        summary: string;
        comments?: Array<{ id: string, text: string, author: string, timestamp: string }>;
    } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedReplies, setSuggestedReplies] = useState<{ [key: string]: string }>({});
    const [isSuggesting, setIsSuggesting] = useState<{ [key: string]: boolean }>({});
    const [isPostingReply, setIsPostingReply] = useState<{ [key: string]: boolean }>({});
    const [postedReplies, setPostedReplies] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (user) {
            loadDashboard();

            // Set up real-time polling (every 60 seconds)
            const interval = setInterval(() => {
                fetchPosts();
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [user]);

    async function loadDashboard() {
        setLoading(true);
        try {
            await fetchPosts();
            // Trigger a background sync for fresh data
            syncAnalytics();
        } finally {
            setLoading(false);
        }
    }

    async function fetchPosts() {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/posts", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // We only care about published posts for analytics
                const published = (data.posts || []).filter((p: Post) => p.status === "published");
                setPosts(published);
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    }

    async function syncAnalytics() {
        if (!user || isSyncing) return;
        setIsSyncing(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/analytics/sync", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                // Reload posts to show fresh metrics
                await fetchPosts();
            }
        } catch (error) {
            console.error("Analytics sync failed:", error);
        } finally {
            setIsSyncing(false);
        }
    }

    async function handleAnalyzeSentiment(post: Post) {
        setAnalyzingPost(post);
        setAnalysisResult(null);
        setIsAnalyzing(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/analytics/sentiment", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ postId: post.id })
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysisResult(data);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }

    async function handleSuggestReply(postId: string, commentText: string, commentAuthor: string, commentId: string) {
        setIsSuggesting(prev => ({ ...prev, [commentId]: true }));
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/agent/reply", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ postId, commentText, commentAuthor })
            });

            if (res.ok) {
                const data = await res.json();
                setSuggestedReplies(prev => ({ ...prev, [commentId]: data.reply }));
            }
        } catch (error) {
            console.error("Reply suggestion failed:", error);
        } finally {
            setIsSuggesting(prev => ({ ...prev, [commentId]: false }));
        }
    }

    async function handlePostReply(postId: string, commentPlatformId: string, commentKey: string) {
        const replyText = suggestedReplies[commentKey];
        if (!replyText?.trim()) return;
        setIsPostingReply(prev => ({ ...prev, [commentKey]: true }));
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/agent/post-reply", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ postId, commentId: commentPlatformId, replyText })
            });

            if (res.ok) {
                setPostedReplies(prev => ({ ...prev, [commentKey]: true }));
            } else {
                const err = await res.json();
                alert(`Failed to post reply: ${err.error}`);
            }
        } catch (error) {
            console.error("Post reply failed:", error);
            alert("Failed to post reply. Please try again.");
        } finally {
            setIsPostingReply(prev => ({ ...prev, [commentKey]: false }));
        }
    }

    // Calculate aggregate stats
    const totalLikes = posts.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.metrics?.comments || 0), 0);
    const totalReach = posts.reduce((acc, p) => acc + (p.metrics?.reach || 0), 0);
    const totalShares = posts.reduce((acc, p) => acc + (p.metrics?.shares || 0), 0);

    // Calculate chart data (Group reach by date)
    const getChartData = () => {
        const dailyData: Record<string, { reach: number; label: string }> = {};
        const now = new Date();
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toDateString(); // More reliable key
            const label = d.toLocaleDateString(undefined, { weekday: 'short' });
            dailyData[key] = { reach: 0, label };
        }

        posts.forEach(post => {
            // Use publishedAt first, fall back to createdAt
            const dateStr = post.publishedAt || (post as any).createdAt;
            if (dateStr) {
                const key = new Date(dateStr).toDateString();
                if (dailyData[key] !== undefined) {
                    dailyData[key].reach += post.metrics?.reach || 0;
                }
            }
        });

        return Object.values(dailyData);
    };

    const chartData = getChartData();
    const chartValues = chartData.map(d => d.reach);
    const maxReach = Math.max(...chartValues, 1);
    const hasChartData = chartValues.some(v => v > 0);

    const stats = [
        { name: "Total Reach", value: totalReach.toLocaleString(), change: totalReach > 0 ? "+12%" : "0%", trendingUp: totalReach > 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { name: "Likes", value: totalLikes.toLocaleString(), change: totalLikes > 0 ? "+5%" : "0%", trendingUp: totalLikes > 0, icon: MessageSquare, color: "text-rose-500", bg: "bg-rose-500/10" },
        { name: "Comments", value: totalComments.toLocaleString(), change: totalComments > 0 ? "+2%" : "0%", trendingUp: totalComments > 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { name: "Shares", value: totalShares.toLocaleString(), change: "Stable", trendingUp: true, icon: MousePointer2, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    const getPlatformStats = (pName: string) => {
        const platformPosts = posts.filter(p => p.platform === pName);
        const reach = platformPosts.reduce((acc, p) => acc + (p.metrics?.reach || 0), 0);
        const eng = platformPosts.reduce((acc, p) => acc + (p.metrics?.likes || 0) + (p.metrics?.comments || 0), 0);
        const percentage = totalReach > 0 ? (reach / totalReach) * 100 : 0;
        return { reach, eng, count: platformPosts.length, percentage: `${Math.round(percentage)}%` };
    };

    const platformStats = [
        { platform: "Instagram", reach: getPlatformStats("Instagram").reach.toLocaleString(), posts: getPlatformStats("Instagram").count, icon: Instagram, color: "text-pink-600", percentage: getPlatformStats("Instagram").percentage },
        { platform: "LinkedIn", reach: getPlatformStats("LinkedIn").reach.toLocaleString(), posts: getPlatformStats("LinkedIn").count, icon: Linkedin, color: "text-blue-700", percentage: getPlatformStats("LinkedIn").percentage },
        { platform: "Twitter (X)", reach: getPlatformStats("Twitter").reach.toLocaleString(), posts: getPlatformStats("Twitter").count, icon: Twitter, color: "text-sky-500", percentage: getPlatformStats("Twitter").percentage },
    ];

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Analyzing your social impact...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Overview</h1>
                    <p className="text-muted-foreground text-lg">Real-time performance metrics from your social channels.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={syncAnalytics}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Fresh Data'}</span>
                    </button>
                    <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-sm font-medium shadow-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{timeRange}</span>
                    </div>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="group glass p-6 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden transition-all hover:-translate-y-1"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-[100px] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-all duration-500`} />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-lg shadow-black/5`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${stat.trendingUp ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>
                                {stat.change}
                                {stat.trendingUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="text-3xl font-black mb-1 tracking-tight">{stat.value}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.name}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-card border border-border p-8 rounded-2xl shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Audience Growth</h3>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-primary"></div>
                                <span>Reach</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full relative group">
                        <div className="absolute inset-0 flex items-end justify-between gap-2 px-4">
                            {chartValues.map((val, i) => {
                                const hPercent = (val / maxReach) * 100;
                                return (
                                    <div key={i} className="flex-1 space-y-2 group/bar">
                                        <div
                                            style={{ height: `${Math.max(hPercent, 5)}%` }}
                                            className="w-full bg-primary/20 rounded-t-lg transition-all duration-700 hover:bg-primary/30 relative overflow-hidden"
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-primary rounded-t-lg shadow-lg shadow-primary/20 transition-all duration-700"
                                                style={{ height: '100%' }}
                                            />
                                            {/* Tooltip on hover */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 bg-foreground text-background text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none font-bold">
                                                {val.toLocaleString()} Reach
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground text-center font-bold">
                                            {(() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (6 - i));
                                                return d.toLocaleDateString(undefined, { weekday: 'short' });
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 border-b border-border"></div>
                        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/50"></div>
                    </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-card border border-border p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-6">Channel Performance</h3>
                        <div className="space-y-6">
                            {platformStats.map((p) => (
                                <div key={p.platform} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <p.icon className={`h-4 w-4 ${p.color}`} />
                                            <span>{p.platform}</span>
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">{p.reach} Reach</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            style={{ width: p.percentage }}
                                            className={`h-full rounded-full ${p.platform === "Instagram" ? "bg-pink-500" : p.platform === "LinkedIn" ? "bg-blue-600" : "bg-sky-400"}`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <span>{p.posts} Posts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="w-full mt-8 py-3 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">
                        View Detailed Reports
                    </button>
                </div>
            </div>

            {/* Top Posts Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold">Top Performing Content</h3>
                </div>
                {posts.length === 0 ? (
                    <div className="p-20 text-center text-muted-foreground">
                        No published posts found to analyze.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Reach</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Likes</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Comments</th>
                                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {posts.sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0)).slice(0, 5).map((post) => (
                                    <tr key={post.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-8 py-5 font-semibold text-sm">{post.topic}</td>
                                        <td className="px-8 py-5 text-sm">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${post.platform === 'LinkedIn' ? 'bg-blue-100 text-blue-700' :
                                                post.platform === 'Instagram' ? 'bg-pink-100 text-pink-700' :
                                                    'bg-sky-100 text-sky-700'
                                                }`}>
                                                {post.platform}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium">{post.metrics?.reach || 0}</td>
                                        <td className="px-8 py-5 text-sm font-medium">{post.metrics?.likes || 0}</td>
                                        <td className="px-8 py-5 text-sm font-medium">{post.metrics?.comments || 0}</td>
                                        <td className="px-8 py-5 text-sm text-muted-foreground">
                                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleAnalyzeSentiment(post)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                            >
                                                <Brain className="h-3.5 w-3.5" />
                                                <span>Analyze Pulse</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sentiment Analysis Modal */}
            {analyzingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Brain className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Social Intelligence Pulse</h3>
                                    <p className="text-xs text-muted-foreground">Analyzing: {analyzingPost.topic}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAnalyzingPost(null)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-8">
                            {isAnalyzing ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                        <Brain className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium animate-pulse">Gemini is reading comments...</p>
                                </div>
                            ) : analysisResult ? (
                                <div className="space-y-8">
                                    {/* Sentiment Score */}
                                    <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-2xl border border-border">
                                        <div className={`p-5 rounded-2xl ${analysisResult.score >= 7 ? 'bg-green-100 text-green-600' :
                                            analysisResult.score <= 4 ? 'bg-red-100 text-red-600' :
                                                'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {analysisResult.score >= 7 ? <Smile className="h-10 w-10" /> :
                                                analysisResult.score <= 4 ? <Frown className="h-10 w-10" /> :
                                                    <Meh className="h-10 w-10" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Overall Sentiment</span>
                                                <span className="text-xl font-black">{analysisResult.score}/10</span>
                                            </div>
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${analysisResult.score >= 7 ? 'bg-green-500' :
                                                        analysisResult.score <= 4 ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                        }`}
                                                    style={{ width: `${analysisResult.score * 10}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>Audience Executive Summary</span>
                                        </div>
                                        <p className="text-lg leading-relaxed font-medium">
                                            "{analysisResult.summary}"
                                        </p>
                                    </div>

                                    {/* Themes */}
                                    <div className="space-y-3">
                                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Key Recurring Themes</span>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.themes.map((theme, i) => (
                                                <span key={i} className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
                                                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                                    {theme}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Real Comments & Suggested Replies */}
                                    {analysisResult.comments && analysisResult.comments.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>Audience Voices & AI Reply Agent</span>
                                            </div>
                                            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                {analysisResult.comments.map((comment, i) => {
                                                    const commentKey = `${comment.author}-${comment.timestamp}-${i}`;
                                                    const platformCommentId = (comment as any).id || commentKey;
                                                    const hasReply = !!suggestedReplies[commentKey];
                                                    const isPosted = postedReplies[commentKey];
                                                    return (
                                                        <div key={i} className="p-4 bg-muted/10 rounded-2xl border border-border/50 space-y-3">
                                                            {/* Comment */}
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1">
                                                                    <span className="text-sm font-bold block">{comment.author}</span>
                                                                    <p className="text-sm text-muted-foreground italic mt-1">"{comment.text}"</p>
                                                                </div>
                                                                {!hasReply && (
                                                                    <button
                                                                        onClick={() => handleSuggestReply(analyzingPost!.id, comment.text, comment.author, commentKey)}
                                                                        disabled={isSuggesting[commentKey]}
                                                                        className="flex-shrink-0 text-[10px] font-black uppercase tracking-tighter bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                                                    >
                                                                        {isSuggesting[commentKey] ? 'Crafting...' : 'Suggest Reply'}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Editable Reply + Post Button */}
                                                            {hasReply && (
                                                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                            <Brain className="h-2 w-2 text-white" />
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI Reply — Edit & Post</span>
                                                                        {isPosted && (
                                                                            <span className="ml-auto flex items-center gap-1 text-[10px] font-black text-emerald-500">
                                                                                <CheckCircle className="h-3.5 w-3.5" /> Posted!
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Editable Textarea */}
                                                                    <textarea
                                                                        value={suggestedReplies[commentKey]}
                                                                        onChange={(e) => setSuggestedReplies(prev => ({ ...prev, [commentKey]: e.target.value }))}
                                                                        disabled={isPosted}
                                                                        rows={3}
                                                                        className="w-full text-sm px-3 py-2.5 bg-background/60 border border-emerald-500/30 rounded-xl resize-none outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium leading-relaxed disabled:opacity-60"
                                                                    />

                                                                    {/* Action Buttons */}
                                                                    {!isPosted && (
                                                                        <div className="flex gap-2 justify-end">
                                                                            <button
                                                                                onClick={() => navigator.clipboard.writeText(suggestedReplies[commentKey])}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold hover:bg-muted/80 transition-all"
                                                                            >
                                                                                <Copy className="h-3 w-3" />
                                                                                Copy
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handlePostReply(analyzingPost!.id, platformCommentId, commentKey)}
                                                                                disabled={isPostingReply[commentKey] || !suggestedReplies[commentKey]?.trim()}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all disabled:opacity-50"
                                                                            >
                                                                                {isPostingReply[commentKey] ? (
                                                                                    <><Loader2 className="h-3 w-3 animate-spin" /> Posting...</>
                                                                                ) : (
                                                                                    <><Send className="h-3 w-3" /> Post Reply</>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setAnalyzingPost(null)}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all text-lg"
                                    >
                                        Got it, Thanks!
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Something went wrong with the analysis. Please try again.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
