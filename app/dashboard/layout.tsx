"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    PenTool,
    Calendar,
    BarChart2,
    Settings,
    Menu,
    X,
    Bell,
    Search,
    Sparkles,
    Loader2,
    Sun,
    Moon,
    Brain,
    Clock,
    CheckCheck,
    AlertCircle,
    TrendingUp,
    LogOut,
    Layers,
} from "lucide-react";
import { ProfileModal } from "@/components/ProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Notification state
    type Notification = { id: string; type: "info" | "warning" | "success"; title: string; body: string; time: string; read: boolean; };
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => { setMounted(true); }, []);

    // Fetch Profile
    const fetchProfile = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/user/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Layout Profile Fetch Error:", error);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            fetchProfile();
            loadNotifications();
        }
    }, [user, loading]);

    // Close notification panel on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // --- AUTO-PUBLISHER POLLING ---
    // Runs an API call every 60s to check for & publish due scheduled posts
    useEffect(() => {
        if (!user) return; // Only poll when a user is logged in

        console.log("[Auto-Publisher] Checking for due posts...");
        const TRIGGER_INTERVAL = 60 * 1000; // 60 seconds

        // Trigger immediately on mount
        fetch("/api/cron/publish-scheduled").catch(e => console.error("Cron trigger failed:", e));

        const interval = setInterval(() => {
            fetch("/api/cron/publish-scheduled")
                .catch(e => console.error("Cron trigger failed:", e));
        }, TRIGGER_INTERVAL);

        return () => clearInterval(interval);
    }, [user]);
    // ------------------------------

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/posts", { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) return;
            const data = await res.json();
            const posts: any[] = data.posts || [];
            const now = new Date();
            const generated: Notification[] = [];

            // Upcoming scheduled posts
            const upcoming = posts
                .filter(p => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt) > now)
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .slice(0, 3);
            upcoming.forEach(p => {
                const d = new Date(p.scheduledAt);
                const diffHrs = Math.round((d.getTime() - now.getTime()) / 3600000);
                const timeLabel = diffHrs < 24 ? `in ${diffHrs}h` : `on ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
                generated.push({
                    id: `sched-${p.id}`,
                    type: "info",
                    title: `Scheduled: ${p.platform}`,
                    body: `"${(p.topic || "Post").slice(0, 40)}" goes live ${timeLabel}`,
                    time: timeLabel,
                    read: false,
                });
            });

            // Recently published posts (last 48h)
            const recentPublished = posts.filter(p => {
                if (p.status !== "published") return false;
                const pub = p.publishedAt || p.createdAt;
                return pub && (now.getTime() - new Date(pub).getTime()) < 48 * 3600000;
            }).slice(0, 2);
            recentPublished.forEach(p => {
                generated.push({
                    id: `pub-${p.id}`,
                    type: "success",
                    title: `Published on ${p.platform}`,
                    body: `"${(p.topic || "Post").slice(0, 40)}" is now live.`,
                    time: "recent",
                    read: false,
                });
            });

            // No posts warning
            if (posts.filter(p => p.status === "published").length === 0) {
                generated.push({
                    id: "no-posts",
                    type: "warning",
                    title: "No published posts yet",
                    body: "Create and publish your first post to start growing your audience.",
                    time: "now",
                    read: false,
                });
            }

            // Sync reminder if last published post has 0 reach
            const publishedWithNoReach = posts.filter(p => p.status === "published" && (p.metrics?.reach || 0) === 0);
            if (publishedWithNoReach.length > 0) {
                generated.push({
                    id: "sync-reminder",
                    type: "info",
                    title: "Analytics out of date",
                    body: `${publishedWithNoReach.length} post${publishedWithNoReach.length > 1 ? "s have" : " has"} no reach data. Go to Analytics → Sync Fresh Data.`,
                    time: "now",
                    read: false,
                });
            }

            if (generated.length === 0) {
                generated.push({
                    id: "all-good",
                    type: "success",
                    title: "You're all caught up!",
                    body: "No new alerts. Keep creating great content.",
                    time: "now",
                    read: true,
                });
            }

            setNotifications(generated);
        } catch (e) {
            console.error("Notification load failed:", e);
        }
    };

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const handleLogout = async () => {
        if (!confirm("Are you sure you want to log out?")) return;
        setLoggingOut(true);
        try {
            await logout();
            router.push("/login");
        } catch (e) {
            console.error("Logout failed:", e);
            setLoggingOut(false);
        }
    };

    // Auth Protection Logic
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Securing your session...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null; // Prevent flicker while redirecting

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Create Content", href: "/dashboard/create", icon: PenTool },
        { name: "My Posts", href: "/dashboard/posts", icon: Sparkles },
        { name: "Platform Posts", href: "/dashboard/posts/platforms", icon: Layers, sub: true },
        { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
        { name: "Strategy Agent", href: "/dashboard/strategy", icon: Brain },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    const userInitials = profile?.businessName
        ? profile.businessName.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "MA";

    return (
        <div className="min-h-screen bg-muted/20 flex overflow-hidden">
            {/* Sidebar Desktop/Overlay */}
            <AnimatePresence mode="wait">
                {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card/80 backdrop-blur-xl border-r border-border md:translate-x-0 flex flex-col shadow-2xl md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        {/* Logo Section */}
                        <div className="h-20 flex items-center px-8 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <span className="font-bold text-2xl tracking-tight text-gradient">MarketingAI</span>
                            </div>
                            <button
                                className="ml-auto md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                            <div className="px-3 mb-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                                Main Menu
                            </div>
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const isSub = (item as any).sub === true;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all group duration-200
                                            ${isSub ? "px-3 py-2 ml-6" : "px-4 py-3"}
                                            ${isActive
                                                ? isSub
                                                    ? "bg-primary/10 text-primary border border-primary/20"
                                                    : "bg-primary text-white shadow-xl shadow-primary/30"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className={`transition-transform group-hover:scale-110
                                            ${isSub ? "h-3.5 w-3.5" : "h-5 w-5"}
                                            ${isActive
                                                ? isSub ? "text-primary" : "text-white"
                                                : "text-muted-foreground group-hover:text-primary"}`}
                                        />
                                        <span className={isSub ? "text-xs" : ""}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Profile + Logout (Bottom) */}
                        <div className="p-4 border-t border-border/50 space-y-2">
                            <button
                                onClick={() => setIsProfileModalOpen(true)}
                                className="w-full p-3 rounded-2xl hover:bg-muted/50 transition-all text-left group border border-transparent hover:border-border/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300">
                                        {userInitials}
                                    </div>
                                    <div className="text-sm truncate">
                                        <p className="font-bold truncate group-hover:text-primary transition-colors">{profile?.businessName || "My Business"}</p>
                                        <p className="text-xs text-muted-foreground truncate opacity-70">{user?.email}</p>
                                    </div>
                                </div>
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all group disabled:opacity-50"
                            >
                                {loggingOut
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                }
                                {loggingOut ? "Logging out..." : "Log Out"}
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="h-20 sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border/40 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="relative hidden lg:block group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="h-11 w-80 pl-11 pr-4 rounded-xl bg-muted/40 border-none focus:ring-2 focus:ring-primary/20 text-sm transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        )}

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifications(); }}
                                className="relative p-2.5 text-muted-foreground hover:text-foreground transition-all hover:bg-muted/50 rounded-xl active:scale-95"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-secondary text-white text-[9px] font-black flex items-center justify-center border-2 border-background">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Panel */}
                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-bold">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-secondary/10 text-secondary rounded-full">{unreadCount} new</span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors">
                                                    <CheckCheck className="h-3 w-3" /> Mark all read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notification List */}
                                        <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                                            {notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`px-4 py-3 flex gap-3 transition-colors hover:bg-muted/30 cursor-default ${!n.read ? "bg-primary/5" : ""
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg ${n.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                                                        n.type === "warning" ? "bg-amber-500/10 text-amber-500" :
                                                            "bg-blue-500/10 text-blue-500"
                                                        }`}>
                                                        {n.type === "success" ? <TrendingUp className="h-3.5 w-3.5" /> :
                                                            n.type === "warning" ? <AlertCircle className="h-3.5 w-3.5" /> :
                                                                <Clock className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold">{n.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                                                    </div>
                                                    {!n.read && <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-primary" />}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="px-4 py-2.5 border-t border-border bg-muted/10">
                                            <button
                                                onClick={() => { router.push("/dashboard/analytics"); setNotifOpen(false); }}
                                                className="w-full text-xs font-bold text-primary hover:underline text-center"
                                            >
                                                View Analytics →
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => router.push("/dashboard/create")}
                            className="btn-premium text-white text-sm font-bold px-6 py-2.5 rounded-xl flex items-center gap-2"
                        >
                            <PenTool className="h-4 w-4" />
                            Create
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Modals */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentProfile={profile}
                onUpdate={fetchProfile}
            />
        </div>
    );
}
