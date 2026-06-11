"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, Calendar, Image as ImageIcon, Clock, X, Trash2, Layers } from "lucide-react";

interface Post {
    id: string;
    content: string;
    platform: string;
    createdAt: string;
    status: string;
    imageUrl?: string;
    topic: string;
    scheduledAt?: string;
}

export default function MyPostsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"draft" | "scheduled" | "posted">("draft");

    // Scheduling State
    const [schedulePostId, setSchedulePostId] = useState<string | null>(null);
    const [scheduleDate, setScheduleDate] = useState("");

    const [isScheduling, setIsScheduling] = useState(false);
    const [isPublishing, setIsPublishing] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, [user]);

    async function fetchPosts() {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/posts", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fetch posts failed:", errorData);
                throw new Error(errorData.error || errorData.details || "Failed to fetch posts");
            }

            const data = await res.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleScheduleSubmit = async () => {
        if (!schedulePostId || !scheduleDate || !user) return;
        setIsScheduling(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/posts/${schedulePostId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "scheduled",
                    scheduledAt: new Date(scheduleDate).toISOString()
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Schedule failed:", errorData);
                throw new Error(errorData.error || errorData.details || "Failed to schedule");
            }

            // Update local state
            setPosts(prev => prev.map(p =>
                p.id === schedulePostId
                    ? { ...p, status: "scheduled", scheduledAt: new Date(scheduleDate).toISOString() }
                    : p
            ));

            setSchedulePostId(null);
            setScheduleDate("");
            alert("Post scheduled successfully!");
        } catch (error: any) {
            console.error("Schedule error:", error);
            alert("Failed to schedule post");
        } finally {
            setIsScheduling(false);
        }
    };

    const handlePublish = async (postId: string) => {
        if (!user || isPublishing) return;
        if (!confirm("Are you sure you want to publish this post immediately via the Mock Engine?")) return;

        setIsPublishing(postId);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/publish/now", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ postId })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to publish");
            }

            const result = await res.json();
            alert(`Success! Post published. Mock ID: ${result.platformPostId}`);

            // Update UI to show published
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, status: "published" } : p
            ));

        } catch (error: any) {
            console.error("Publishing error:", error);
            alert("Failed to publish: " + error.message);
        } finally {
            setIsPublishing(null);
        }
    };

    const handleDelete = async (postId: string, status: string) => {
        if (!user) return;
        const label = status === "scheduled" ? "scheduled" : "draft";
        if (!confirm(`Delete this ${label} post? This cannot be undone.`)) return;

        setIsDeleting(postId);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/posts/${postId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete");
            }

            // Remove from local state instantly
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Failed to delete: " + error.message);
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredPosts = posts.filter(post =>
        activeTab === "draft" ? post.status === "draft" :
            activeTab === "scheduled" ? post.status === "scheduled" :
                post.status === "published"
    );

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading posts...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative min-h-screen pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
                    <p className="text-muted-foreground">Manage your generated content and drafts.</p>
                </div>
                <Link
                    href="/dashboard/posts/platforms"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl text-sm font-bold transition-all"
                >
                    <Layers className="h-4 w-4" />
                    View by Platform
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {(["draft", "scheduled", "posted"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === tab
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab === "posted" ? "Posted" : tab === "scheduled" ? "Scheduled" : "Drafts"}
                        {" "}
                        <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                            {posts.filter(p =>
                                tab === "draft" ? p.status === "draft" :
                                    tab === "scheduled" ? p.status === "scheduled" :
                                        p.status === "published"
                            ).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Post Grid */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                    <p className="text-muted-foreground">No {activeTab} posts found.</p>
                    <a href="/dashboard/create" className="text-primary hover:underline text-sm mt-2 block">Create a new post</a>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">
                            {/* Image Header */}
                            {post.imageUrl ? (
                                <div className="h-40 bg-muted relative overflow-hidden">
                                    <img src={post.imageUrl} alt="Post Visual" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                </div>
                            ) : (
                                <div className="h-40 bg-muted/50 flex items-center justify-center text-muted-foreground/30">
                                    <ImageIcon className="h-10 w-10" />
                                </div>
                            )}

                            {/* Content Body */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium 
                                        ${post.platform === 'LinkedIn' ? 'bg-blue-100 text-blue-700' :
                                            post.platform === 'Twitter' ? 'bg-sky-100 text-sky-700' :
                                                'bg-pink-100 text-pink-700'}`}>
                                        {post.platform}
                                    </span>

                                    {post.status === 'scheduled' && post.scheduledAt && (
                                        <span className="flex items-center text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {new Date(post.scheduledAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-semibold truncate mb-2" title={post.topic}>{post.topic || "Untitled Post"}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                    {post.content}
                                </p>

                                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {post.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => setSchedulePostId(post.id)}
                                                    className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs font-medium transition-colors"
                                                >
                                                    Schedule
                                                </button>
                                                <button
                                                    onClick={() => handlePublish(post.id)}
                                                    disabled={isPublishing === post.id}
                                                    className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium transition-colors flex items-center"
                                                >
                                                    {isPublishing === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Publish"}
                                                </button>
                                            </>
                                        )}
                                        {(post.status === 'draft' || post.status === 'scheduled' || post.status === 'published') && (
                                            <button
                                                onClick={() => handleDelete(post.id, post.status)}
                                                disabled={isDeleting === post.id}
                                                title="Delete post"
                                                className="p-1.5 hover:bg-red-100 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                            >
                                                {isDeleting === post.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule Modal Overlay */}
            {schedulePostId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Schedule Post</h3>
                            <button
                                onClick={() => { setSchedulePostId(null); setScheduleDate(""); }}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Select Date & Time</label>
                            <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full h-10 px-4 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => { setSchedulePostId(null); setScheduleDate(""); }}
                                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleScheduleSubmit}
                                disabled={!scheduleDate || isScheduling}
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                                Confirm Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
