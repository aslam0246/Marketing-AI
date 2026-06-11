"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MoreHorizontal } from "lucide-react";

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

export default function SchedulePage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchPosts();
    }, [user]);

    async function fetchPosts() {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/posts", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch posts");
            const data = await res.json();
            // Filter only scheduled or published posts with a date
            const scheduled = (data.posts || []).filter((p: Post) =>
                (p.status === 'scheduled' || p.status === 'published') && p.scheduledAt
            );
            setPosts(scheduled);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    }

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = new Date();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate grid offset (empty cells before 1st of month)
    const startDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday...
    const blanks = Array.from({ length: startDayOfWeek });

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading calendar...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
                    <p className="text-muted-foreground">Visualize your upcoming content schedule.</p>
                </div>

                <div className="flex items-center space-x-4 bg-card border border-border rounded-lg p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-semibold w-32 text-center select-none">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 auto-rows-[140px]">
                    {/* Empty cells for previous month */}
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="border-b border-r border-border bg-muted/5 last:border-r-0" />
                    ))}

                    {/* Actual Days */}
                    {daysInMonth.map(day => {
                        const isToday = isSameDay(day, today);
                        const dayPosts = posts.filter(p => p.scheduledAt && isSameDay(parseISO(p.scheduledAt), day));

                        return (
                            <div key={day.toISOString()} className={`p-2 border-b border-r border-border relative group transition-colors hover:bg-muted/10 ${isToday ? 'bg-primary/5' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                                        {format(day, "d")}
                                    </span>
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                                    {dayPosts.map(post => (
                                        <Link
                                            key={post.id}
                                            href={`/dashboard/create?edit=${post.id}`}
                                            className={`block text-xs p-1.5 rounded border mb-1 truncate cursor-pointer transition-colors
                                                ${post.status === 'published'
                                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                                }`}
                                            title={post.topic}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${post.platform === 'LinkedIn' ? 'bg-blue-600' :
                                                    post.platform === 'Twitter' ? 'bg-sky-500' : 'bg-pink-600'
                                                    }`} />
                                                <span className="font-medium truncate">{post.topic || "Untitled"}</span>
                                            </div>
                                            <div className="text-[10px] opacity-75 mt-0.5 truncate pl-2.5">
                                                {format(parseISO(post.scheduledAt!), "h:mm a")}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
