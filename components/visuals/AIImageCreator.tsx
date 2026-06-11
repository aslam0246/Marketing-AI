
"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

interface AIImageCreatorProps {
    onImageSelected: (blob: Blob, originalUrl?: string | null) => void;
    topic?: string;
}

const STYLES = [
    { label: "Photorealistic", tag: "photorealistic" },
    { label: "Cinematic", tag: "cinematic lighting" },
    { label: "Minimalist", tag: "minimalist" },
    { label: "Vibrant", tag: "vibrant colors" },
    { label: "Dark Mood", tag: "dark moody" },
    { label: "Studio", tag: "studio photography" },
];

export function AIImageCreator({ onImageSelected, topic }: AIImageCreatorProps) {
    const [prompt, setPrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleGenerate = async (inputPrompt: string) => {
        if (!inputPrompt.trim()) return;
        setError("");
        setIsLoading(true);
        setImageUrl(null);

        try {
            // Use our same-origin proxy (calls Pexels server-side — no CORS issues)
            const params = new URLSearchParams({
                prompt: `${inputPrompt}, ${selectedStyle.tag}`
            });
            const proxyUrl = `/api/visuals/proxy?${params.toString()}`;

            const res = await fetch(proxyUrl);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(errData.error || `Request failed (${res.status})`);
            }

            const blob = await res.blob();
            if (blob.size < 1000) throw new Error("Received empty image");

            const originalUrl = res.headers.get("X-Original-URL");
            const objectUrl = URL.createObjectURL(blob);
            setImageUrl(objectUrl);
            onImageSelected(blob, originalUrl);

        } catch (err: any) {
            console.error("[AIImageCreator] Error:", err);
            setError(err.message || "Failed to generate image. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-200">
                    ❌ {error}
                </div>
            )}

            {/* Preview */}
            {imageUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-black/5">
                    <img src={imageUrl} alt="AI Selected" className="w-full h-auto max-h-[280px] object-cover" />
                    <p className="text-[10px] text-muted-foreground text-center py-1">
                        📷 High-quality photo matched to your content
                    </p>
                </div>
            )}

            {/* Auto-prompt from topic */}
            {topic && !prompt && !imageUrl && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-center justify-between">
                    <span>Find image for: <strong>{topic}</strong>?</span>
                    <button
                        onClick={() => handleGenerate(topic)}
                        disabled={isLoading}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? "Searching..." : "Auto-Find"}
                    </button>
                </div>
            )}

            {/* Prompt Input */}
            <div className="flex gap-2">
                <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate(prompt)}
                    placeholder='Describe your image (e.g. "burger with fries", "business meeting")...'
                    className="flex-1 px-3 py-2 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none text-sm"
                    disabled={isLoading}
                />
                <button
                    onClick={() => handleGenerate(prompt)}
                    disabled={!prompt.trim() || isLoading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /><span>Finding...</span></>
                    ) : imageUrl ? (
                        <><RefreshCw className="h-4 w-4" /><span>Find Another</span></>
                    ) : (
                        <><Sparkles className="h-4 w-4" /><span>Find Image</span></>
                    )}
                </button>
            </div>

            {/* Style Presets */}
            <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                    <button
                        key={s.label}
                        onClick={() => setSelectedStyle(s)}
                        disabled={isLoading}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors disabled:opacity-50
                            ${selectedStyle.label === s.label
                                ? "bg-primary/10 border-primary text-primary font-medium"
                                : "bg-muted hover:bg-muted/80 border-transparent"}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {isLoading && (
                <p className="text-xs text-muted-foreground text-center py-2 animate-pulse">
                    🔍 Searching for the perfect image...
                </p>
            )}
        </div>
    );
}
