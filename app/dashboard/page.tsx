"use client";

import { BarChart2, TrendingUp, Users, Calendar, Loader2, Plus, ArrowUpRight, Brain, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function DashboardHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<{ businessName: string } | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [suggestedPosts, setSuggestedPosts] = useState<any[]>([]);
    const [isScouting, setIsScouting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();

                // Fetch Profile
                const profileRes = await fetch("/api/user/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data);
                }

                // Fetch Posts for stats
                const postsRes = await fetch("/api/posts", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (postsRes.ok) {
                    const data = await postsRes.json();
                    setPosts(data.posts || []);
                    setSuggestedPosts((data.posts || []).filter((p: any) => p.status === "suggested"));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleScout = async () => {
        if (!user) return;
        setIsScouting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/agent/scout", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Just update locally instead of full refetch for better UX
                setSuggestedPosts(data.suggestions || []);
                // Update main posts as well
                setPosts(prev => [...prev, ...(data.suggestions || [])]);
            }
        } catch (error) {
            console.error("Scout failed:", error);
        } finally {
            setIsScouting(false);
        }
    };

    // Calculate Real Stats
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === "published");
    const now = new Date();
    // Only show scheduled posts whose scheduled time is in the future
    const scheduledPosts = posts
        .filter(p => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const totalReach = publishedPosts.reduce((acc, p) => acc + (p.metrics?.reach || 0), 0);
    const totalLikes = publishedPosts.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0);
    const totalComments = publishedPosts.reduce((acc, p) => acc + (p.metrics?.comments || 0), 0);
    const totalShares = publishedPosts.reduce((acc, p) => acc + (p.metrics?.shares || 0), 0);
    const engagementRate = totalReach > 0 ? (((totalLikes + totalComments) / totalReach) * 100).toFixed(1) : "0.0";

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Welcome back, <span className="text-foreground font-semibold">{profile?.businessName || "Acme AI"}</span>. Here's your overview.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/dashboard/create")}
                    className="hidden sm:flex btn-premium text-white px-5 py-2.5 rounded-xl font-bold text-sm items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Campaign
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard
                    title="Reach"
                    value={totalReach.toLocaleString()}
                    change="Daily"
                    icon={<Users className="h-5 w-5" />}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    title="Likes"
                    value={totalLikes.toLocaleString()}
                    change="Live"
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="text-rose-500"
                    bg="bg-rose-500/10"
                />
                <StatCard
                    title="Comments"
                    value={totalComments.toLocaleString()}
                    change="Realtime"
                    icon={<Plus className="h-5 w-5" />}
                    color="text-indigo-500"
                    bg="bg-indigo-500/10"
                />
                <StatCard
                    title="Engagement"
                    value={`${engagementRate}%`}
                    change="Rate"
                    icon={<BarChart2 className="h-5 w-5" />}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
                <StatCard
                    title="Shares"
                    value={totalShares.toLocaleString()}
                    change="Social"
                    icon={<ArrowUpRight className="h-5 w-5" />}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <StatCard
                    title="Upcoming"
                    value={scheduledPosts.length.toString()}
                    change="Tasks"
                    icon={<Calendar className="h-5 w-5" />}
                    color="text-indigo-500"
                    bg="bg-indigo-500/10"
                />
            </div>

            {/* Content Row */}
            <div className="grid lg:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                    <div className="glass border border-border/50 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Content Performance</h2>
                            <button
                                onClick={() => router.push("/dashboard/analytics")}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                View Detailed Report <ArrowUpRight className="h-3 w-3" />
                            </button>
                        </div>
                        <ContentPerformanceChart posts={publishedPosts} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                    {/* AI Agent Suggestions */}
                    <div className="glass border border-primary/20 bg-primary/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Brain className="h-32 w-32" />
                        </div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    AI Content Scout
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Daily Trending Suggestions</p>
                            </div>
                            <button
                                onClick={handleScout}
                                disabled={isScouting}
                                className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                title="Run Scout Now"
                            >
                                <RefreshCw className={`h-4 w-4 ${isScouting ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {suggestedPosts.length > 0 ? (
                                suggestedPosts.slice(0, 3).map((post) => (
                                    <div key={post.id} className="p-4 bg-background/40 backdrop-blur-md border border-border/50 rounded-2xl hover:border-primary/40 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${post.platform === 'LinkedIn' ? 'bg-blue-500/10 text-blue-600' :
                                                post.platform === 'Instagram' ? 'bg-pink-500/10 text-pink-600' :
                                                    'bg-sky-500/10 text-sky-600'
                                                }`}>
                                                {post.platform}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-sm font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">{post.topic}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">"{post.content}"</p>
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams({
                                                    scout: "1",
                                                    topic: post.topic || "",
                                                    platform: post.platform || "Instagram",
                                                    content: post.content || "",
                                                    postId: post.id || "",
                                                });
                                                router.push(`/dashboard/create?${params.toString()}`);
                                            }}
                                            className="w-full py-2.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                                        >
                                            Review & Customize
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/5 rounded-full">
                                            <Brain className="h-8 w-8 text-primary/20" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-6 font-medium">Agent is waiting for orders.</p>
                                    <button
                                        onClick={handleScout}
                                        disabled={isScouting}
                                        className="btn-premium text-white px-8 py-3 rounded-2xl text-xs font-bold shadow-xl shadow-primary/20"
                                    >
                                        {isScouting ? 'Scouting Trends...' : 'Scan for Trends'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Strategy Agent Banner */}
                    <div
                        className="glass border border-violet-500/20 bg-violet-500/5 rounded-3xl p-6 shadow-xl flex items-center gap-5 cursor-pointer group hover:border-violet-500/40 transition-all"
                        onClick={() => router.push("/dashboard/strategy")}
                    >
                        <div className="h-12 w-12 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-sm">Strategy Agent</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                AI learns from your engagement history and recommends what to post, when, and how.
                            </p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-violet-500 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>

                    <div className="glass border border-border/50 rounded-3xl p-8 shadow-xl">
                        <h2 className="text-xl font-bold mb-6">Upcoming Content</h2>
                        <ul className="space-y-4">
                            {scheduledPosts.length > 0 ? (
                                scheduledPosts.slice(0, 4).map((post) => {
                                    const scheduledDate = new Date(post.scheduledAt);
                                    const diffMs = scheduledDate.getTime() - now.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                    let label = "";
                                    if (diffHrs < 1) label = "in < 1 hr";
                                    else if (diffHrs < 24) label = `Today at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    else if (diffDays === 1) label = `Tomorrow at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    else label = scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                                    const platformColors: Record<string, string> = {
                                        Instagram: "bg-pink-500/10 text-pink-500",
                                        LinkedIn: "bg-blue-500/10 text-blue-500",
                                        Twitter: "bg-sky-500/10 text-sky-500",
                                    };
                                    const platformColor = platformColors[post.platform] || "bg-muted text-muted-foreground";

                                    return (
                                        <li key={post.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => router.push("/dashboard/schedule")}>
                                            <span className={`mt-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex-shrink-0 ${platformColor}`}>
                                                {post.platform}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{post.topic || "Untitled Post"}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                            </div>
                                        </li>
                                    );
                                })
                            ) : (
                                <>
                                    <ListItem text="Connect your social accounts" completed={posts.length > 0} />
                                    <ListItem text="Create your first AI post" completed={posts.length > 0} />
                                    <ListItem text="Schedule content for next week" completed={scheduledPosts.length > 0} />
                                    <ListItem text="View your first analytics pulse" completed={publishedPosts.length > 0} />
                                </>
                            )}
                        </ul>
                        <button
                            onClick={() => router.push("/dashboard/schedule")}
                            className="w-full mt-8 py-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-bold transition-all"
                        >
                            View Full Schedule
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatCard({ title, value, change, icon, color, bg }: { title: string, value: string, change: string, icon: React.ReactNode, color: string, bg: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group glass p-6 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-bl-[100px] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500`} />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`p-3 rounded-2xl ${bg} ${color}`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    {change.split(' ')[0]}
                </span>
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-black mb-1">{value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</div>
            </div>
        </motion.div>
    );
}

function ContentPerformanceChart({ posts }: { posts: any[] }) {
    if (posts.length === 0) {
        return (
            <div className="h-72 bg-muted/30 rounded-2xl flex flex-col items-center justify-center border border-dashed border-border/50 text-muted-foreground gap-3">
                <div className="p-4 bg-background/50 rounded-full">
                    <BarChart2 className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium opacity-50">Publish posts to see performance data.</p>
            </div>
        );
    }

    // Take the last 6 published posts
    const data = posts.slice(-6).map((p) => ({
        label: (p.topic || p.content || "Post").slice(0, 12) + "...",
        likes: p.metrics?.likes || 0,
        comments: p.metrics?.comments || 0,
        shares: p.metrics?.shares || 0,
        reach: p.metrics?.reach || 0,
    }));

    const maxVal = Math.max(1, ...data.map(d => Math.max(d.likes, d.comments, d.shares, d.reach)));
    const chartHeight = 180;

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />Likes</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />Comments</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />Shares</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />Reach</span>
            </div>

            {/* Chart */}
            <div className="relative bg-muted/20 rounded-2xl p-4 overflow-x-auto">
                <svg width="100%" viewBox={`0 0 ${data.length * 90} ${chartHeight + 40}`} preserveAspectRatio="xMidYMid meet">
                    {/* Gridlines */}
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                        <line
                            key={pct}
                            x1="0" y1={chartHeight - pct * chartHeight}
                            x2={data.length * 90} y2={chartHeight - pct * chartHeight}
                            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
                        />
                    ))}

                    {data.map((d, i) => {
                        const x = i * 90 + 8;
                        const bw = 14;
                        const gap = 3;
                        const bars = [
                            { val: d.likes, color: "#f43f5e" },
                            { val: d.comments, color: "#6366f1" },
                            { val: d.shares, color: "#f59e0b" },
                            { val: d.reach, color: "#10b981" },
                        ];
                        return (
                            <g key={i}>
                                {bars.map((bar, bi) => {
                                    const barH = Math.max(3, (bar.val / maxVal) * chartHeight);
                                    return (
                                        <rect
                                            key={bi}
                                            x={x + bi * (bw + gap)}
                                            y={chartHeight - barH}
                                            width={bw}
                                            height={barH}
                                            fill={bar.color}
                                            rx="3"
                                            opacity="0.85"
                                        />
                                    );
                                })}
                                {/* X-axis label */}
                                <text
                                    x={x + 30}
                                    y={chartHeight + 18}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="currentColor"
                                    opacity="0.4"
                                >
                                    {d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Total Likes", val: posts.reduce((a, p) => a + (p.metrics?.likes || 0), 0), color: "text-rose-500" },
                    { label: "Comments", val: posts.reduce((a, p) => a + (p.metrics?.comments || 0), 0), color: "text-indigo-500" },
                    { label: "Shares", val: posts.reduce((a, p) => a + (p.metrics?.shares || 0), 0), color: "text-amber-500" },
                    { label: "Total Reach", val: posts.reduce((a, p) => a + (p.metrics?.reach || 0), 0), color: "text-emerald-500" },
                ].map(s => (
                    <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                        <div className={`text-lg font-black ${s.color}`}>{s.val.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ListItem({ text, completed }: { text: string, completed: boolean }) {
    return (
        <li className="flex items-center gap-4 text-sm group cursor-pointer">
            <div className={`h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all ${completed
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                : "border-border bg-muted/30 group-hover:border-primary/50"
                }`}>
                {completed && <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`font-medium transition-all ${completed ? "text-muted-foreground line-through opacity-50" : "text-foreground group-hover:text-primary"}`}>
                {text}
            </span>
        </li>
    );
}
