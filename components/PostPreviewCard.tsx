"use client";

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Repeat2, Send, Globe } from "lucide-react";

interface PostPreviewCardProps {
    content: string;
    imageUrl?: string | Blob | null;
    platform: "Instagram" | "LinkedIn" | "Twitter";
    businessName?: string;
}

// ── Helpers ─────────────────────────────────────────────────────
function getImageSrc(imageUrl?: string | Blob | null): string | null {
    if (!imageUrl) return null;
    if (typeof imageUrl === "string") return imageUrl;
    return URL.createObjectURL(imageUrl);
}

function formatContent(text: string) {
    return text.split(/(\#\w+)/g).map((part, i) =>
        part.startsWith("#")
            ? <span key={i} className="text-blue-500 font-medium">{part}</span>
            : <span key={i}>{part}</span>
    );
}

// ── Instagram Preview ────────────────────────────────────────────
function InstagramPreview({ content, imageUrl, businessName }: Omit<PostPreviewCardProps, "platform">) {
    const imgSrc = getImageSrc(imageUrl);
    const initials = (businessName || "MA").slice(0, 2).toUpperCase();

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden max-w-sm mx-auto shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                        <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-xs font-black text-purple-600">
                            {initials}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">{businessName || "your_business"}</p>
                        <p className="text-[10px] text-muted-foreground">Sponsored</p>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Image */}
            <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                {imgSrc
                    ? <img src={imgSrc} alt="Post" className="w-full h-full object-cover" />
                    : <div className="text-muted-foreground/30 text-xs text-center p-4">
                        <div className="text-4xl mb-2">🖼️</div>
                        Image will appear here
                    </div>
                }
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Heart className="h-6 w-6 text-foreground hover:text-red-500 transition-colors cursor-pointer" />
                    <MessageCircle className="h-6 w-6 text-foreground cursor-pointer" />
                    <Send className="h-6 w-6 text-foreground cursor-pointer" />
                </div>
                <Bookmark className="h-6 w-6 text-foreground cursor-pointer" />
            </div>

            {/* Caption */}
            {content && (
                <div className="px-4 pb-4 space-y-1">
                    <p className="text-xs font-bold text-foreground">{businessName || "your_business"}&nbsp;
                        <span className="font-normal text-foreground/80 leading-relaxed">
                            {formatContent(content.slice(0, 180))}
                            {content.length > 180 && <span className="text-muted-foreground"> ...more</span>}
                        </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Just now</p>
                </div>
            )}
            {!content && (
                <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground/40 italic">Your caption will appear here...</p>
                </div>
            )}
        </div>
    );
}

// ── LinkedIn Preview ─────────────────────────────────────────────
function LinkedInPreview({ content, imageUrl, businessName }: Omit<PostPreviewCardProps, "platform">) {
    const imgSrc = getImageSrc(imageUrl);
    const initials = (businessName || "MA").slice(0, 2).toUpperCase();

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden max-w-sm mx-auto shadow-lg">
            {/* Header */}
            <div className="flex items-start gap-3 px-4 py-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">{businessName || "Your Business"}</p>
                    <p className="text-[11px] text-muted-foreground">Company · 1,234 followers</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>Now · Public</span>
                    </div>
                </div>
                <button className="ml-auto text-blue-600 text-xs font-bold border border-blue-600 rounded-full px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    + Follow
                </button>
            </div>

            {/* Content */}
            {content && (
                <div className="px-4 pb-3">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                        {formatContent(content.slice(0, 300))}
                        {content.length > 300 && <span className="text-blue-500 cursor-pointer"> ...see more</span>}
                    </p>
                </div>
            )}
            {!content && (
                <div className="px-4 pb-3">
                    <p className="text-sm text-muted-foreground/40 italic">Your post content will appear here...</p>
                </div>
            )}

            {/* Image */}
            {imgSrc && (
                <div className="aspect-video bg-muted/30 overflow-hidden">
                    <img src={imgSrc} alt="Post" className="w-full h-full object-cover" />
                </div>
            )}

            {/* Engagement */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">👍 47 · 12 comments</span>
                <span className="text-[10px] text-muted-foreground">3 reposts</span>
            </div>

            {/* Actions */}
            <div className="px-2 pb-2 grid grid-cols-4 gap-1">
                {[
                    { icon: ThumbsUp, label: "Like" },
                    { icon: MessageCircle, label: "Comment" },
                    { icon: Repeat2, label: "Repost" },
                    { icon: Send, label: "Send" },
                ].map(({ icon: Icon, label }) => (
                    <button key={label} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Twitter/X Preview ────────────────────────────────────────────
function TwitterPreview({ content, imageUrl, businessName }: Omit<PostPreviewCardProps, "platform">) {
    const imgSrc = getImageSrc(imageUrl);
    const initials = (businessName || "MA").slice(0, 2).toUpperCase();
    const handle = (businessName || "YourBusiness").toLowerCase().replace(/\s+/g, "_");

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden max-w-sm mx-auto shadow-lg">
            <div className="p-4">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{businessName || "Your Business"}</span>
                            <span className="text-muted-foreground text-xs">@{handle}</span>
                            <span className="text-muted-foreground text-xs">· now</span>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-foreground/90 leading-relaxed mt-1">
                            {content
                                ? <>{formatContent(content.slice(0, 280))}{content.length > 280 && <span className="text-sky-500"> [truncated]</span>}</>
                                : <span className="text-muted-foreground/40 italic">Your tweet will appear here...</span>
                            }
                        </p>

                        {/* Image */}
                        {imgSrc && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-border aspect-video">
                                <img src={imgSrc} alt="Post" className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 text-muted-foreground max-w-xs">
                            <button className="flex items-center gap-1.5 text-xs hover:text-sky-500 transition-colors group">
                                <MessageCircle className="h-4 w-4" />
                                <span>12</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs hover:text-green-500 transition-colors">
                                <Repeat2 className="h-4 w-4" />
                                <span>5</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs hover:text-red-500 transition-colors">
                                <Heart className="h-4 w-4" />
                                <span>47</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs hover:text-sky-500 transition-colors">
                                <Share2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Export ──────────────────────────────────────────────────
export function PostPreviewCard({ content, imageUrl, platform, businessName }: PostPreviewCardProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Live Preview · {platform}
                </p>
            </div>

            {platform === "Instagram" && (
                <InstagramPreview content={content} imageUrl={imageUrl} businessName={businessName} />
            )}
            {platform === "LinkedIn" && (
                <LinkedInPreview content={content} imageUrl={imageUrl} businessName={businessName} />
            )}
            {platform === "Twitter" && (
                <TwitterPreview content={content} imageUrl={imageUrl} businessName={businessName} />
            )}
        </div>
    );
}
