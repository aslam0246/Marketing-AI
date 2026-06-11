"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    Brain, TrendingUp, TrendingDown, Minus, Clock, Sparkles,
    Hash, Target, BarChart2, Loader2, ChevronRight, AlertCircle,
    CheckCircle, Zap, Calendar, MessageSquare, Activity, RefreshCw,
    RotateCcw, ArrowUp, ArrowDown,
} from "lucide-react";
import Link from "next/link";

interface AgentInsights {
    updatedAt: string;
    totalPostsAnalyzed: number;
    bestHour: number;
    bestDayOfWeek: number;
    bestTone: string;
    bestPlatform: string;
    bestContentCategory: string;
    avgEngagementScore: number;
    topHashtags: string[];
    hourlyEngagement: number[];
    toneBreakdown: Record<string, number>;
    platformBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    recentTrend: "up" | "down" | "stable";
    confidence: number;
}

interface AgentStrategy {
    generatedAt: string;
    weeklyPostTarget: number;
    recommendedPostTimes: string[];
    contentMix: { promotional: number; educational: number; engagement: number; news: number };
    recommendedTone: string;
    recommendedPlatform: string;
    recommendedHashtags: string[];
    reasoning: string[];
    confidence: number;
    predictedCompositeScore?: number;
    appliedWeights?: { bestHourWeight: number; toneWeight: number };
}

interface AdaptiveWeights {
    bestHourWeight: number;
    toneWeight: number;
    platformWeight: number;
    categoryWeight: number;
    updateCount: number;
    consecutiveUnderperformances: number;
    lastUpdated: string;
}

interface PerfLog {
    id: string;
    actualCompositeScore: number;
    predictedCompositeScore: number;
    performanceDelta: number;
    consistencyScore: number;
    postsAnalyzed: number;
    evaluatedAt: string;
}

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function ConfidenceBadge({ score }: { score: number }) {
    const [cls, label] = score >= 80
        ? ["text-emerald-500 bg-emerald-500/10 border-emerald-500/30", "High"]
        : score >= 50
            ? ["text-amber-500 bg-amber-500/10 border-amber-500/30", "Medium"]
            : ["text-red-400 bg-red-400/10 border-red-400/30", "Low"];
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cls}`}>
            {label} · {score}%
        </span>
    );
}

function ScoreBar({ label, value, max, color = "bg-primary" }: { label: string; value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="font-semibold capitalize text-foreground/80">{label}</span>
                <span className="text-muted-foreground font-mono">{value.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function HourHeatmap({ hourly }: { hourly: number[] }) {
    const max = Math.max(...hourly, 1);
    const rows = [hourly.slice(0, 12), hourly.slice(12)];
    return (
        <div className="space-y-2">
            {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-12 gap-0.5">
                    {row.map((val, i) => {
                        const hour = ri * 12 + i;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1" title={`${hour}:00 — ${val.toFixed(1)}`}>
                                <div
                                    className="w-full rounded-sm"
                                    style={{ height: "26px", backgroundColor: `rgba(139,92,246,${(val / max).toFixed(2)})`, minHeight: "4px" }}
                                />
                                <span className="text-[8px] text-muted-foreground">{hour}</span>
                            </div>
                        );
                    })}
                </div>
            ))}
            <p className="text-[10px] text-muted-foreground text-center pt-1">Hourly engagement heatmap · Darker = higher score</p>
        </div>
    );
}

export default function StrategyPage() {
    const { user } = useAuth();
    const [insights, setInsights] = useState<AgentInsights | null>(null);
    const [strategy, setStrategy] = useState<AgentStrategy | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [runStep, setRunStep] = useState("");
    const [weights, setWeights] = useState<AdaptiveWeights | null>(null);
    const [perfLogs, setPerfLogs] = useState<PerfLog[]>([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evalMsg, setEvalMsg] = useState<string | null>(null);
    const [isResettingWeights, setIsResettingWeights] = useState(false);

    useEffect(() => { if (user) { load(); loadWeights(); } }, [user]);

    async function load() {
        setLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/agent/plan", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const d = await res.json();
                setInsights(d.insights ?? null);
                setStrategy(d.strategy ?? null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function loadWeights() {
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/agent/weights", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const d = await res.json();
                setWeights(d.weights ?? null);
                setPerfLogs(d.logs ?? []);
            }
        } catch (e) { console.error(e); }
    }

    async function runEvaluation() {
        if (!user || isEvaluating) return;
        setIsEvaluating(true);
        setEvalMsg(null);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/agent/evaluate", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            const d = await res.json();
            if (res.ok) {
                const delta = d.result.performanceDelta;
                setEvalMsg(`Evaluation complete. Delta: ${delta > 0 ? "+" : ""}${delta.toFixed(1)} · Weights ${d.result.weightsUpdated ? "updated" : "stable"}`);
                await loadWeights();
            } else {
                setEvalMsg(d.error || "Evaluation failed");
            }
        } catch (e) {
            setEvalMsg("Evaluation failed. Please try again.");
        } finally { setIsEvaluating(false); }
    }

    async function resetWeights() {
        if (!user || isResettingWeights) return;
        if (!confirm("Reset all adaptive weights to 1.0 baseline?")) return;
        setIsResettingWeights(true);
        try {
            const token = await user.getIdToken();
            await fetch("/api/agent/weights", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
            });
            await loadWeights();
        } catch (e) { console.error(e); } finally { setIsResettingWeights(false); }
    }

    async function runAgent() {
        if (!user || isRunning) return;
        setIsRunning(true);
        try {
            const token = await user.getIdToken();
            const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
            setRunStep("Scoring engagement...");
            await fetch("/api/agent/observe", { method: "POST", headers: h });
            setRunStep("Detecting patterns...");
            await fetch("/api/agent/analyze", { method: "POST", headers: h });
            setRunStep("Building strategy...");
            await fetch("/api/agent/plan", { method: "POST", headers: h });
            setRunStep("Refreshing...");
            await load();
        } catch (e) { console.error(e); }
        finally { setIsRunning(false); setRunStep(""); }
    }

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    const hasData = !!insights && insights.totalPostsAnalyzed > 0;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10">

            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-1">Strategy Agent</h1>
                    <p className="text-muted-foreground text-lg">AI-powered insights built from your own engagement history.</p>
                </div>
                <button
                    onClick={runAgent}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-60"
                >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {isRunning ? runStep || "Running..." : "Run Strategy Agent"}
                </button>
            </motion.div>

            {/* No data state */}
            {!hasData && (
                <motion.div variants={itemVariants} className="flex items-start gap-4 p-6 bg-amber-500/5 border border-amber-500/30 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-amber-500 mb-1">Not enough data yet</p>
                        <p className="text-sm text-muted-foreground">
                            Publish at least 3 posts, sync analytics, then click <strong>Run Strategy Agent</strong>.
                        </p>
                        <Link href="/dashboard/analytics" className="inline-flex items-center gap-1 text-sm font-bold text-primary mt-3 hover:underline">
                            Go to Analytics <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </motion.div>
            )}

            {hasData && (
                <>
                    {/* Quick Stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Posts Analyzed", value: insights!.totalPostsAnalyzed, icon: <BarChart2 className="h-4 w-4" />, cls: "text-blue-500 bg-blue-500/10" },
                            { label: "Avg Eng. Score", value: insights!.avgEngagementScore.toFixed(1), icon: <Target className="h-4 w-4" />, cls: "text-primary bg-primary/10" },
                            { label: "Best Platform", value: insights!.bestPlatform, icon: <Zap className="h-4 w-4" />, cls: "text-emerald-500 bg-emerald-500/10" },
                            {
                                label: "Recent Trend",
                                value: insights!.recentTrend === "up" ? "↑ Up" : insights!.recentTrend === "down" ? "↓ Down" : "→ Stable",
                                icon: insights!.recentTrend === "up" ? <TrendingUp className="h-4 w-4" /> : insights!.recentTrend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />,
                                cls: insights!.recentTrend === "up" ? "text-emerald-500 bg-emerald-500/10" : insights!.recentTrend === "down" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10"
                            },
                        ].map((c, i) => (
                            <div key={i} className="glass border border-border/40 rounded-2xl p-5 space-y-2">
                                <div className={`h-8 w-8 rounded-xl ${c.cls} flex items-center justify-center`}>{c.icon}</div>
                                <p className="text-2xl font-extrabold">{c.value}</p>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{c.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* Left — Charts */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Heatmap */}
                            <motion.div variants={itemVariants} className="glass border border-border/40 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Engagement by Hour</h3>
                                    <span className="ml-auto text-sm font-bold text-primary">Best: {insights!.bestHour}:00</span>
                                </div>
                                <HourHeatmap hourly={insights!.hourlyEngagement} />
                            </motion.div>

                            {/* Platform bars */}
                            <motion.div variants={itemVariants} className="glass border border-border/40 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Platform Performance</h3>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(insights!.platformBreakdown).sort(([, a], [, b]) => b - a).map(([p, s]) => (
                                        <ScoreBar key={p} label={p} value={s} max={Math.max(...Object.values(insights!.platformBreakdown))}
                                            color={p === "Instagram" ? "bg-pink-500" : p === "LinkedIn" ? "bg-blue-500" : "bg-sky-400"} />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Tone + Category */}
                            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                                {[
                                    { title: "Tone", icon: <MessageSquare className="h-4 w-4 text-primary" />, data: insights!.toneBreakdown, color: "bg-violet-500" },
                                    { title: "Category", icon: <Target className="h-4 w-4 text-primary" />, data: insights!.categoryBreakdown, color: "bg-emerald-500" },
                                ].map(({ title, icon, data, color }) => (
                                    <div key={title} className="glass border border-border/40 rounded-3xl p-5 space-y-3">
                                        <div className="flex items-center gap-2">{icon}<h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{title}</h3></div>
                                        <div className="space-y-2">
                                            {Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 4).map(([k, v]) => (
                                                <ScoreBar key={k} label={k} value={v} max={Math.max(...Object.values(data))} color={color} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Hashtag Analytics Card */}
                            {insights!.topHashtags.length > 0 && (
                                <motion.div variants={itemVariants} className="glass border border-border/40 rounded-3xl p-6 space-y-5">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                <Hash className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">Hashtag Analytics</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Top by Engagement Score</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-full">
                                            {insights!.topHashtags.length} tags
                                        </span>
                                    </div>

                                    {/* Hashtag Rows */}
                                    <div className="space-y-3">
                                        {insights!.topHashtags.slice(0, 8).map((tag, i) => {
                                            // Simulate a decay score — top hashtag = 100, falls off
                                            const score = Math.max(10, 100 - i * (100 / (insights!.topHashtags.length + 1)));
                                            const rankColors = [
                                                "from-yellow-400 to-amber-500",   // #1 gold
                                                "from-gray-300 to-gray-400",       // #2 silver
                                                "from-orange-400 to-orange-600",   // #3 bronze
                                            ];
                                            const barColor = i === 0 ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                                                : i === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400"
                                                    : i === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                                        : "bg-primary/70";

                                            return (
                                                <div key={tag} className="group space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {/* Rank badge */}
                                                            <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${rankColors[i] ?? "from-primary/40 to-primary/60"} flex items-center justify-center text-[9px] font-black text-white`}>
                                                                {i + 1}
                                                            </span>
                                                            <span className="font-bold text-foreground">{tag}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground font-mono text-[10px]">{score.toFixed(0)} pts</span>
                                                            {/* Use in post button */}
                                                            <Link
                                                                href={`/dashboard/create?topic=${encodeURIComponent(tag)}`}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white"
                                                            >
                                                                Use →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    {/* Engagement bar */}
                                                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${barColor} rounded-full transition-all duration-700`}
                                                            style={{ width: `${score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer tip */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                        <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Hover any hashtag and click <strong>Use →</strong> to pre-fill your next post with that topic.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                        </div>

                        {/* Right — Strategy Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {strategy ? (
                                <>
                                    <motion.div variants={itemVariants} className="glass border border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-5 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                                        <div className="flex items-start justify-between gap-2 relative">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
                                                    <Sparkles className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-base">This Week's Strategy</h3>
                                                    <p className="text-[10px] text-muted-foreground">{new Date(strategy.generatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <ConfidenceBadge score={strategy.confidence} />
                                        </div>

                                        {/* Weekly target */}
                                        <div className="flex items-center gap-3 p-3 bg-background/40 rounded-2xl">
                                            <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Weekly Target</p>
                                                <p className="font-extrabold">{strategy.weeklyPostTarget} posts this week</p>
                                            </div>
                                        </div>

                                        {/* Post times */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best Post Times</p>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.recommendedPostTimes.map((t, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-background/60 border border-border rounded-xl text-sm font-bold flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-primary" />{t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tone + Platform */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[{ label: "Tone", val: strategy.recommendedTone }, { label: "Platform", val: strategy.recommendedPlatform }].map(({ label, val }) => (
                                                <div key={label} className="p-3 bg-background/40 rounded-xl text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                                                    <p className="font-extrabold text-sm capitalize">{val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Content Mix */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content Mix</p>
                                            <div className="flex h-3 rounded-full overflow-hidden">
                                                <div className="bg-primary" style={{ width: `${strategy.contentMix.promotional}%` }} title={`Promotional ${strategy.contentMix.promotional}%`} />
                                                <div className="bg-blue-500" style={{ width: `${strategy.contentMix.educational}%` }} title={`Educational ${strategy.contentMix.educational}%`} />
                                                <div className="bg-emerald-500" style={{ width: `${strategy.contentMix.engagement}%` }} title={`Engagement ${strategy.contentMix.engagement}%`} />
                                                <div className="bg-amber-400" style={{ width: `${strategy.contentMix.news}%` }} title={`News ${strategy.contentMix.news}%`} />
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px]">
                                                {[["Promotional", strategy.contentMix.promotional, "bg-primary"], ["Educational", strategy.contentMix.educational, "bg-blue-500"], ["Engagement", strategy.contentMix.engagement, "bg-emerald-500"], ["News", strategy.contentMix.news, "bg-amber-400"]].map(([l, p, c]) => (
                                                    <span key={String(l)} className="flex items-center gap-1 font-semibold text-muted-foreground">
                                                        <span className={`h-2 w-2 rounded-full ${c}`} />{l} {p}%
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hashtags */}
                                        {strategy.recommendedHashtags.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Use These Hashtags</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {strategy.recommendedHashtags.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Reasoning */}
                                    <motion.div variants={itemVariants} className="glass border border-border/40 rounded-3xl p-6 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Brain className="h-4 w-4 text-primary" />
                                            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Agent Reasoning</h3>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {strategy.reasoning.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                    <span className="text-foreground/80">{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div variants={itemVariants} className="glass border border-border/40 rounded-3xl p-8 text-center space-y-4">
                                    <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <Sparkles className="h-7 w-7 text-primary" />
                                    </div>
                                    <p className="font-bold text-lg">No strategy yet</p>
                                    <p className="text-sm text-muted-foreground">Click <strong>Run Strategy Agent</strong> to generate your first weekly plan.</p>
                                </motion.div>
                            )}

                            {/* Quick links */}
                            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Create Post", href: "/dashboard/create", icon: <Sparkles className="h-4 w-4" /> },
                                    { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart2 className="h-4 w-4" /> },
                                ].map(l => (
                                    <Link key={l.href} href={l.href}
                                        className="flex items-center gap-2 p-4 glass border border-border/40 rounded-2xl text-sm font-bold hover:border-primary/40 hover:bg-primary/5 transition-all group">
                                        <span className="text-primary">{l.icon}</span>{l.label}
                                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    </Link>
                                ))}
                            </motion.div>
                        </div>
                    </div>

                    {/* ── Adaptive Intelligence Section ── */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                <Activity className="h-4 w-4 text-violet-500" />
                            </div>
                            <h2 className="text-xl font-extrabold">Adaptive Intelligence</h2>
                            <span className="text-xs font-black px-2 py-1 bg-violet-500/10 text-violet-500 rounded-full border border-violet-500/20">LIVE</span>
                        </div>

                        {evalMsg && (
                            <div className={`p-3 rounded-xl text-sm font-bold border flex items-center gap-2 ${evalMsg.includes("failed") || evalMsg.includes("error")
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                }`}>
                                <CheckCircle className="h-4 w-4 flex-shrink-0" />{evalMsg}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Adaptive Weights Card */}
                            <div className="glass border border-border/40 rounded-3xl p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Adaptive Weights</h3>
                                    {weights && <span className="text-[10px] text-muted-foreground">Updated {weights.updateCount}×</span>}
                                </div>
                                {weights ? (
                                    <div className="space-y-3">
                                        {[
                                            { label: "Best Hour", val: weights.bestHourWeight },
                                            { label: "Tone", val: weights.toneWeight },
                                            { label: "Platform", val: weights.platformWeight },
                                            { label: "Category", val: weights.categoryWeight },
                                        ].map(({ label, val }) => {
                                            const pct = ((val - 0.5) / 1.0) * 100;
                                            const color = val > 1.05 ? "bg-emerald-500" : val < 0.95 ? "bg-red-400" : "bg-blue-400";
                                            return (
                                                <div key={label} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-semibold text-foreground/80">{label}</span>
                                                        <span className={`font-black font-mono ${val > 1.05 ? "text-emerald-500" : val < 0.95 ? "text-red-400" : "text-muted-foreground"}`}>{val.toFixed(2)}×</span>
                                                    </div>
                                                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2 flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground">
                                                {weights.consecutiveUnderperformances > 0
                                                    ? `⚠ ${weights.consecutiveUnderperformances} consecutive underperformance${weights.consecutiveUnderperformances > 1 ? "s" : ""}`
                                                    : "✓ Performance on track"}
                                            </span>
                                            <button onClick={resetWeights} disabled={isResettingWeights}
                                                className="flex items-center gap-1 text-[10px] font-black text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50">
                                                <RotateCcw className="h-3 w-3" /> Reset
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Run Strategy Agent to initialise weights.</p>
                                )}
                            </div>

                            {/* Evaluation Trigger Card */}
                            <div className="glass border border-border/40 rounded-3xl p-6 space-y-5 flex flex-col">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Weekly Evaluation</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                    Compare this week's actual performance against the predicted score.
                                    Weights auto-adjust if the delta exceeds ±10 points.
                                </p>
                                <button onClick={runEvaluation} disabled={isEvaluating}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60">
                                    {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    {isEvaluating ? "Evaluating..." : "Run Weekly Evaluation"}
                                </button>
                                <p className="text-[10px] text-muted-foreground text-center">Only runs once per week · Safe to trigger manually</p>
                            </div>
                        </div>

                        {/* Performance History Log */}
                        {perfLogs.length > 0 && (
                            <div className="glass border border-border/40 rounded-3xl p-6 space-y-4">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Performance History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                {["Date", "Predicted", "Actual", "Delta", "Posts", "Consistency"].map(h => (
                                                    <th key={h} className="text-left py-2 pr-4 font-black text-muted-foreground uppercase tracking-widest text-[10px]">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {perfLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 pr-4 text-muted-foreground">{new Date(log.evaluatedAt).toLocaleDateString()}</td>
                                                    <td className="py-2.5 pr-4 font-bold">{log.predictedCompositeScore.toFixed(1)}</td>
                                                    <td className="py-2.5 pr-4 font-bold">{log.actualCompositeScore.toFixed(1)}</td>
                                                    <td className="py-2.5 pr-4">
                                                        <span className={`flex items-center gap-1 font-black ${log.performanceDelta > 0 ? "text-emerald-500" : log.performanceDelta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                                            {log.performanceDelta > 0 ? <ArrowUp className="h-3 w-3" /> : log.performanceDelta < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                                                            {log.performanceDelta > 0 ? "+" : ""}{log.performanceDelta.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 pr-4">{log.postsAnalyzed}</td>
                                                    <td className="py-2.5">{log.consistencyScore.toFixed(0)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>

                </>
            )}
        </motion.div>
    );
}
