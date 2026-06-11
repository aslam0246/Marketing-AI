"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Copy, RefreshCw, Send, Check, Loader2, Save, Shield, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { generateContent } from "@/lib/content-engine/generator";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { VisualManager } from "@/components/visuals/VisualManager";
import { TrendNavigator } from "@/components/trends/TrendNavigator";
import { Brain, Clock, Calendar as CalendarIcon } from "lucide-react";
import { PostPreviewCard } from "@/components/PostPreviewCard";

export default function CreateContentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editingId = searchParams.get("edit");
    const isFromScout = searchParams.get("scout") === "1";
    const scoutTopic = searchParams.get("topic") || "";
    const scoutPlatform = searchParams.get("platform") || "";
    const scoutContent = searchParams.get("content") || "";

    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    // Visual State
    const [selectedImage, setSelectedImage] = useState<Blob | string | null>(null);

    // User Profile Data
    const [businessName, setBusinessName] = useState("My Business");
    const [industry, setIndustry] = useState("SaaS");
    const [tone, setTone] = useState("Professional");
    const [platform, setPlatform] = useState<"Twitter" | "LinkedIn" | "Instagram">("LinkedIn");

    const [isSaving, setIsSaving] = useState(false);
    const [optimalTiming, setOptimalTiming] = useState<{ optimalTime: string, windows: string[] } | null>(null);
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    // Tone Guard State
    const [toneGuardResult, setToneGuardResult] = useState<{
        toneScore: number;
        qualityScore: number;
        toneDetected: string;
        issues: string[];
        improvements: string[];
        rewritten: string;
    } | null>(null);
    const [isGuarding, setIsGuarding] = useState(false);
    const [showRewritten, setShowRewritten] = useState(false);

    // Load existing post if editing
    useEffect(() => {
        async function fetchPostToEdit() {
            if (editingId && user) {
                try {
                    const token = await user.getIdToken();
                    const res = await fetch(`/api/posts/${editingId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const post = data.post;
                        setTopic(post.topic || "");
                        setKeywords(post.keywords || "");
                        setGeneratedContent(post.content || "");
                        setPlatform(post.platform as any);
                        if (post.tone) setTone(post.tone);
                        if (post.imageUrl) setSelectedImage(post.imageUrl);
                    }
                } catch (error) {
                    console.error("Error fetching post to edit:", error);
                }
            }
        }
        fetchPostToEdit();
    }, [editingId, user]);

    // ─── Load Scout Data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isFromScout) return;
        // Clear any existing local draft so scout data takes priority
        localStorage.removeItem("draft_post");
        if (scoutTopic) setTopic(scoutTopic);
        if (scoutPlatform) setPlatform(scoutPlatform as any);
        if (scoutContent) setGeneratedContent(scoutContent); // Scout already generated content
    }, [isFromScout]);

    // Fetch Optimal Timing
    useEffect(() => {
        async function fetchTiming() {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const res = await fetch("/api/analytics/timing", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setOptimalTiming(data);
                        if (data.optimalTime && !scheduledTime) {
                            // Set default to optimal time
                            // Time format from API: "10:00 AM" -> "10:00"
                            // Simple conversion
                            const timeMatch = data.optimalTime.match(/^(\d{1,2}:\d{2})\s([AP]M)$/);
                            if (timeMatch) {
                                let [_, time, ampm] = timeMatch;
                                let [hours, mins] = time.split(':');
                                if (ampm === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
                                if (ampm === 'AM' && hours === '12') hours = '00';
                                if (hours.length === 1) hours = `0${hours}`;
                                setScheduledTime(`${hours}:${mins}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching timing:", error);
                }
            }
        }
        fetchTiming();
    }, [user]);

    const handleApplyTrend = (trendTitle: string) => {
        setTopic(prev => prev ? `${prev}\n\nRe: ${trendTitle}` : `Exploring the trend: ${trendTitle}`);
    };

    const handleToneGuard = async () => {
        if (!generatedContent || !user) return;
        setIsGuarding(true);
        setToneGuardResult(null);
        setShowRewritten(false);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/agent/tone-guard", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: generatedContent })
            });
            if (res.ok) {
                const data = await res.json();
                setToneGuardResult(data);
            }
        } catch (error) {
            console.error("Tone guard failed:", error);
        } finally {
            setIsGuarding(false);
        }
    };

    // ─── Generate caption from uploaded/AI image ────────────────────────────
    const handleGenerateCaptionFromImage = async (imageSource: Blob | string) => {
        if (!user) return;
        setIsGeneratingCaption(true);
        try {
            const token = await user.getIdToken();
            const body: Record<string, any> = { platform, tone, businessName, industry };

            if (typeof imageSource === "string") {
                // URL from AI generation — send directly
                body.imageUrl = imageSource;
            } else {
                // Blob from upload — convert to base64
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageSource);
                });
                body.imageBase64 = base64;
            }

            const res = await fetch("/api/gemini/caption-from-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (res.ok && data.caption) {
                setGeneratedContent(data.caption);
            } else {
                alert(data.error || "Caption generation failed. Please try again.");
            }
        } catch (e) {
            console.error("Caption from image failed:", e);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    // Load saved draft on mount (only if NOT editing and NOT coming from scout)
    useEffect(() => {
        if (editingId || isFromScout) return;
        const saved = localStorage.getItem("draft_post");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.topic) setTopic(data.topic);
                if (data.keywords) setKeywords(data.keywords);
                if (data.generatedContent) setGeneratedContent(data.generatedContent);
                if (data.platform) setPlatform(data.platform);
                if (data.tone) setTone(data.tone);
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    // Save draft on change (only if NOT editing and NOT scout)
    useEffect(() => {
        if (editingId || isFromScout) return;
        const draft = { topic, keywords, generatedContent, platform, tone };
        localStorage.setItem("draft_post", JSON.stringify(draft));
    }, [topic, keywords, generatedContent, platform, tone, editingId]);

    // Fetch user profile on load
    useEffect(() => {
        async function fetchProfile() {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const res = await fetch("/api/user/profile", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setBusinessName(data.businessName || "My Business");
                        setIndustry(data.industry || "SaaS");
                        if (data.tone) setTone(data.tone);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
        }
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user || !generatedContent) return;

        setIsSaving(true);
        try {
            console.log("Starting save for user:", user.uid);
            let imageUrl = null;

            // 1. Upload Image (if exists) via API
            if (selectedImage) {
                // If it's already a persistent URL (not a local blob URL), use it directly
                if (typeof selectedImage === "string" && !selectedImage.startsWith("blob:")) {
                    imageUrl = selectedImage;
                } else {
                    try {
                        const formData = new FormData();
                        // If it's a blob URL string (should not happen with our new logic, but for safety),
                        // or if it's a Blob object.
                        const fileToUpload = typeof selectedImage === "string"
                            ? await fetch(selectedImage).then(r => r.blob())
                            : selectedImage;

                        formData.append("file", fileToUpload);

                        const token = await user.getIdToken();
                        const uploadRes = await fetch("/api/upload", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`
                            },
                            body: formData
                        });

                        if (!uploadRes.ok) {
                            const errorData = await uploadRes.json().catch(() => ({}));
                            console.error("Upload failed details:", errorData);
                            throw new Error(errorData.error || errorData.details || "Upload failed");
                        }

                        const uploadData = await uploadRes.json();
                        imageUrl = uploadData.url;
                    } catch (imgError: any) {
                        console.error("Image upload failed:", imgError);
                        alert("Image upload failed! Saving text only.");
                    }
                }
            }

            // 2. Save Data to API
            const token = await user.getIdToken();
            const endpoint = editingId ? `/api/posts/${editingId}` : "/api/posts";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic,
                    platform,
                    tone,
                    content: generatedContent,
                    imageUrl,
                    keywords,
                    // If editing, keep existing status unless it was a draft and we're clicking save
                    status: showScheduler ? "scheduled" : (editingId ? undefined : "draft"),
                    scheduledAt: showScheduler ? `${scheduledDate}T${scheduledTime}:00Z` : undefined
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Post save failed details:", errorData);
                throw new Error(errorData.error || errorData.details || "Failed to save post");
            }

            // Clear draft if successfully saved
            localStorage.removeItem("draft_post");

            // Redirect
            router.push("/dashboard/posts");

        } catch (error: any) {
            console.error(error);
            alert("Error saving post: " + error.message);
            setIsSaving(false);
        } finally {
            // Do not force set false immediately to avoid UI glitch before redirect unmounts
            // but if redirection fails/lags, user might be stuck.
            // Given SPA behavior, unmount will clear state anyway.
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setGeneratedContent(""); // Clear previous

        try {
            const content = await generateContent({
                businessName,
                industry,
                tone,
                topic,
                keywords,
                platform
            });
            setGeneratedContent(content);
        } catch (error) {
            console.error("Generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Scout Origin Banner */}
            {isFromScout && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-primary">Loaded from AI Content Scout</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Caption pre-filled for <strong>{scoutPlatform}</strong>. Edit the topic or content below, then save or schedule.</p>
                    </div>
                </div>
            )}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Content</h1>
                <p className="text-muted-foreground">Describe what you want to post, and let AI handle the rest.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Input & Preview Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Post Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">What is this post about?</label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full h-32 px-4 py-3 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Announcing our new summer collection..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Keywords (optional)</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full h-10 px-4 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Comma separated tags..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Platform</label>
                                    <select
                                        value={platform}
                                        onChange={(e) => setPlatform(e.target.value as any)}
                                        className="w-full h-10 px-4 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Twitter">Twitter / X</option>
                                        <option value="Instagram">Instagram</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Tone</label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full h-10 px-4 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="Professional">Professional</option>
                                        <option value="Friendly">Friendly</option>
                                        <option value="Witty">Witty</option>
                                        <option value="Bold">Bold</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!topic || isGenerating}
                                className="w-full h-12 mt-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg font-medium shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" /> Generate Content
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold">Preview</h2>
                            {generatedContent && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerate}
                                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw className="h-3 w-3" /> Regenerate Text
                                    </button>
                                </div>
                            )}
                        </div>

                        {generatedContent ? (
                            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Social Post Mockup */}
                                <div className="p-4 border-b border-border flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {businessName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{businessName}</p>
                                        <p className="text-xs text-muted-foreground">Just now • {platform}</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {generatedContent && (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {generatedContent}
                                        </p>
                                    )}

                                    {selectedImage && (
                                        <div className="rounded-lg overflow-hidden border border-border mt-4">
                                            <img
                                                src={typeof selectedImage === "string" ? selectedImage : URL.createObjectURL(selectedImage)}
                                                alt="Post Visual"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
                                    <div className="text-xs text-muted-foreground">
                                        Generated by AI
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(generatedContent)}
                                            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            title="Copy Text"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving || !generatedContent}
                                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                                            {editingId ? "Update Post" : "Save Draft"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center sticky top-8">
                                <Sparkles className="h-12 w-12 mb-4 text-muted-foreground/30" />
                                <p className="font-medium">Ready to create magic?</p>
                                <p className="text-sm max-w-xs mt-2 opacity-70">Enter your topic on the left and hit Generate.</p>
                            </div>
                        )}
                    </div>

                    {/* Scheduling Section */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Schedule Post
                            </h2>
                            <button
                                onClick={() => setShowScheduler(!showScheduler)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${showScheduler ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {showScheduler ? 'ENABLED' : 'DRAFT ONLY'}
                            </button>
                        </div>

                        {showScheduler && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {optimalTiming && (
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                            <div>
                                                <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Smart Suggestion</p>
                                                <p className="text-sm font-bold">{optimalTiming.optimalTime}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setScheduledTime(optimalTiming.optimalTime.replace(/\s[AP]M/, ''))}
                                            className="text-[10px] font-bold px-2 py-1 bg-primary text-white rounded-md"
                                        >
                                            APPLY
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Date</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Studio Section */}
                <div className="lg:col-span-5 space-y-8">
                    <VisualManager
                        onImageSelected={setSelectedImage}
                        topic={topic}
                        onGenerateCaptionFromImage={handleGenerateCaptionFromImage}
                        isGeneratingCaption={isGeneratingCaption}
                    />

                    {/* Post Preview Card */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="text-sm font-bold">Post Preview</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Live Platform Preview</p>
                        </div>
                        <div className="p-4">
                            <PostPreviewCard
                                content={generatedContent}
                                imageUrl={selectedImage}
                                platform={platform as any}
                                businessName={businessName}
                            />
                        </div>
                    </div>
                </div>

                {/* Strategy Sidebar */}
                <div className="lg:col-span-3 lg:sticky lg:top-8 pb-10 space-y-6">
                    <TrendNavigator onSelectTrend={handleApplyTrend} industry={industry} />

                    {/* Tone & Quality Guard */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-violet-500/10 rounded-lg">
                                        <Shield className="h-4 w-4 text-violet-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">Tone & Quality Guard</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">AI Brand Alignment</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToneGuard}
                                    disabled={!generatedContent || isGuarding}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-violet-600 transition-all disabled:opacity-40"
                                >
                                    {isGuarding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                                    {isGuarding ? 'Analyzing...' : 'Check'}
                                </button>
                            </div>
                        </div>

                        {!toneGuardResult && !isGuarding && (
                            <div className="p-5 text-center text-muted-foreground">
                                <Shield className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">Generate content to run the AI quality check.</p>
                            </div>
                        )}

                        {isGuarding && (
                            <div className="p-5 flex flex-col items-center gap-3 text-center">
                                <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                                <p className="text-xs text-muted-foreground animate-pulse">Analyzing tone alignment...</p>
                            </div>
                        )}

                        {toneGuardResult && (
                            <div className="p-5 space-y-5 animate-in fade-in duration-300">
                                {/* Score Gauges */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Tone Fit', value: toneGuardResult.toneScore, color: toneGuardResult.toneScore >= 75 ? 'bg-emerald-500' : toneGuardResult.toneScore >= 50 ? 'bg-amber-500' : 'bg-red-500' },
                                        { label: 'Quality', value: toneGuardResult.qualityScore, color: toneGuardResult.qualityScore >= 75 ? 'bg-emerald-500' : toneGuardResult.qualityScore >= 50 ? 'bg-amber-500' : 'bg-red-500' },
                                    ].map(item => (
                                        <div key={item.label} className="p-3 bg-muted/20 rounded-xl border border-border/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                                                <span className="text-lg font-black">{item.value}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Detected Tone */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground font-medium text-xs">Detected Tone:</span>
                                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-600 text-xs font-black rounded-full">{toneGuardResult.toneDetected}</span>
                                </div>

                                {/* Issues */}
                                {toneGuardResult.issues.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                            <AlertTriangle className="h-3 w-3 text-amber-500" /> Issues Found
                                        </p>
                                        <ul className="space-y-1.5">
                                            {toneGuardResult.issues.map((issue, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                    <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improvements */}
                                {toneGuardResult.improvements.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Suggestions
                                        </p>
                                        <ul className="space-y-1.5">
                                            {toneGuardResult.improvements.map((imp, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">↑</span>
                                                    <span>{imp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Rewritten Version */}
                                <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setShowRewritten(!showRewritten)}
                                        className="w-full flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-widest text-violet-500 hover:bg-violet-500/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> AI Rewritten Version</span>
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showRewritten ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showRewritten && (
                                        <div className="p-3 border-t border-violet-500/20">
                                            <p className="text-xs leading-relaxed text-foreground/80">{toneGuardResult.rewritten}</p>
                                            <button
                                                onClick={() => {
                                                    setGeneratedContent(toneGuardResult.rewritten);
                                                    setShowRewritten(false);
                                                }}
                                                className="mt-3 w-full py-2 bg-violet-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-violet-600 transition-all"
                                            >
                                                Apply Rewrite
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
