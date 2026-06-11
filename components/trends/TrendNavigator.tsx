"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp, Hash, Lightbulb, RefreshCw, Loader2,
    ChevronRight, Brain, Instagram, Heart, Zap, Globe,
    CalendarDays, Sun, MapPin
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Trend { title: string; description: string; }

interface IGHashtag {
    hashtag: string;
    mediaCount: number;
    recentTopPosts: number;
}

interface UpcomingFestival {
    name: string;
    dateStr: string;
    daysAway: number;
    type: string;
    marketingAngle: string;
}

interface TrendData {
    trends: Trend[];
    hashtags: string[];
    buzzwords: string[];
    recommendation: string;
    dataSource?: "live-news" | "ai-knowledge";
    headlineCount?: number;
    instagramHashtags?: IGHashtag[];
    upcomingFestivals?: UpcomingFestival[];
    currentSeason?: string;
    region?: string;
}

interface TrendNavigatorProps {
    onSelectTrend: (trend: string) => void;
    industry?: string;
}

const REGIONS = [
    { code: "IN",     label: "🇮🇳 India" },
    { code: "US",     label: "🇺🇸 United States" },
    { code: "UK",     label: "🇬🇧 United Kingdom" },
    { code: "GLOBAL", label: "🌐 Global" },
];

const FESTIVAL_COLORS: Record<string, string> = {
    festival: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30",
    holiday:  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    event:    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
    season:   "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30",
};

export function TrendNavigator({ onSelectTrend, industry }: TrendNavigatorProps) {
    const { user } = useAuth();
    const [data, setData]       = useState<TrendData | null>(null);
    const [loading, setLoading] = useState(false);
    const [region, setRegion]   = useState("IN");

    useEffect(() => { if (user) fetchTrends(); }, [user, industry, region]);

    async function fetchTrends() {
        setLoading(true);
        setData(null);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/trends", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ niche: industry, region })
            });
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error("Failed to fetch trends", e);
        } finally {
            setLoading(false);
        }
    }

    // Build source badge
    const sourceParts: string[] = [];
    if (data?.headlineCount) sourceParts.push(`${data.headlineCount} news`);
    if (data?.instagramHashtags?.length) sourceParts.push(`${data.instagramHashtags.length} IG`);
    if (data?.upcomingFestivals?.length) sourceParts.push(`${data.upcomingFestivals.length} festivals`);
    const isLive = data?.dataSource === "live-news" || (data?.instagramHashtags?.length ?? 0) > 0;
    const sourceBadge = sourceParts.length
        ? `🟢 Live — ${sourceParts.join(" + ")}`
        : "🤖 AI Knowledge";

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

            {/* ── Header ── */}
            <div className="p-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trend Navigator</h3>
                            {data && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                    isLive
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground"
                                }`}>
                                    {sourceBadge}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={fetchTrends}
                        disabled={loading}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                        title="Refresh trends"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* ── Region Selector ── */}
                <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <div className="flex gap-1 flex-wrap">
                        {REGIONS.map(r => (
                            <button
                                key={r.code}
                                onClick={() => setRegion(r.code)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                                    region === r.code
                                        ? "bg-primary text-white shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Scouting live trends in {REGIONS.find(r => r.code === region)?.label}...
                        </p>
                    </div>
                ) : data ? (
                    <>
                        {/* ── Season ── */}
                        {data.currentSeason && (
                            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                <Sun className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                                    {data.currentSeason}
                                </p>
                            </div>
                        )}

                        {/* ── Upcoming Festivals ── */}
                        {data.upcomingFestivals && data.upcomingFestivals.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>Upcoming Festivals</span>
                                </div>
                                <div className="space-y-1.5">
                                    {data.upcomingFestivals.map((f, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onSelectTrend(`${f.name} content`)}
                                            className={`w-full text-left p-2.5 rounded-xl border transition-all hover:brightness-95 ${FESTIVAL_COLORS[f.type] || FESTIVAL_COLORS.event}`}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[11px] font-black">{f.name}</span>
                                                <span className="text-[9px] font-bold opacity-70">
                                                    {f.daysAway === 0 ? "Today! 🎉" : `${f.daysAway}d away`}
                                                </span>
                                            </div>
                                            <p className="text-[9px] opacity-80 leading-relaxed line-clamp-1">
                                                💡 {f.marketingAngle}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── AI Strategy ── */}
                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                <Lightbulb className="h-3 w-3" />
                                <span>AI Strategy</span>
                            </div>
                            <p className="text-xs leading-relaxed font-medium">{data.recommendation}</p>
                        </div>

                        {/* ── Instagram Hashtag Performance ── */}
                        {data.instagramHashtags && data.instagramHashtags.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-pink-500">
                                    <Instagram className="h-3 w-3" />
                                    <span>Instagram Hashtag Performance</span>
                                </div>
                                <div className="space-y-1.5">
                                    {data.instagramHashtags.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onSelectTrend(`#${h.hashtag}`)}
                                            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-pink-200/50 dark:border-pink-500/20 bg-pink-50/50 dark:bg-pink-500/5 hover:border-pink-400 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-pink-600 dark:text-pink-400">#{h.hashtag}</span>
                                                <span className="text-[9px] text-muted-foreground">{h.mediaCount} top posts</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-pink-600 dark:text-pink-400">
                                                <Heart className="h-2.5 w-2.5" />
                                                {h.recentTopPosts.toLocaleString()}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Trending Topics ── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>Trending Now</span>
                            </div>
                            <div className="space-y-2">
                                {data.trends.map((trend, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSelectTrend(trend.title)}
                                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold group-hover:text-primary transition-colors">{trend.title}</span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2">{trend.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Hashtags & Buzzwords ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Hash className="h-3 w-3" /><span>Hashtags</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {data.hashtags.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onSelectTrend(`#${h}`)}
                                            className="text-[10px] font-bold px-1.5 py-0.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-md tracking-tight transition-colors"
                                        >
                                            #{h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Zap className="h-3 w-3" /><span>Buzzwords</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {data.buzzwords.map((b, i) => (
                                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 bg-secondary/10 text-secondary rounded-md tracking-tight">
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-xs italic">
                        Select a region and click refresh to see live trends.
                    </div>
                )}
            </div>
        </div>
    );
}
