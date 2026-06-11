
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import {
    Save,
    Loader2,
    Building2,
    Users,
    Megaphone,
    Image as ImageIcon,
    Moon,
    Sun,
    Download,
    UserPlus,
    Shield,
    Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Connection State - initialized from localStorage for instant render on tab switch
    const [instagramAccount, setInstagramAccount] = useState<{ id: string, name: string } | null>(() => {
        if (typeof window === "undefined") return null;
        try { const s = localStorage.getItem("ig_conn"); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const [linkedinAccount, setLinkedinAccount] = useState<{ id: string, name: string } | null>(() => {
        if (typeof window === "undefined") return null;
        try { const s = localStorage.getItem("li_conn"); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function fetchConnections() {
            if (!user) return;
            try {
                // Fetch Connections
                const connRef = collection(db, "users", user.uid, "connections");
                const connSnap = await getDocs(connRef);
                connSnap.forEach(doc => {
                    if (doc.id === "instagram") {
                        const data = doc.data();
                        setInstagramAccount({ id: data.igAccountId, name: data.pageName || "Connected Account" });
                    }
                    if (doc.id === "linkedin") {
                        const data = doc.data();
                        setLinkedinAccount({ id: data.linkedinId, name: data.name || "Connected Account" });
                    }
                });

            } catch (e) {
                console.error("Error fetching connections", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchConnections();
    }, [user]);

    // Sync connection state to localStorage whenever it changes
    useEffect(() => {
        if (instagramAccount) localStorage.setItem("ig_conn", JSON.stringify(instagramAccount));
        else if (!isLoading) localStorage.removeItem("ig_conn");
    }, [instagramAccount, isLoading]);

    useEffect(() => {
        if (linkedinAccount) localStorage.setItem("li_conn", JSON.stringify(linkedinAccount));
        else if (!isLoading) localStorage.removeItem("li_conn");
    }, [linkedinAccount, isLoading]);

    // Handle OAuth Callback Claim (omitted for brevity in this replace call, but should be preserved or simplified)
    useEffect(() => {
        const state = searchParams.get("state");
        if (state && user && !isClaiming) {
            if (searchParams.get("ig_success")) handleClaimInstagram(state);
            if (searchParams.get("li_success")) handleClaimLinkedIn(state);
        }
    }, [searchParams, user]);

    const handleClaimLinkedIn = async (state: string) => {
        setIsClaiming(true);
        setClaimError(null);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/user/connections/linkedin/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ state })
            });
            if (res.ok) {
                const data = await res.json();
                setLinkedinAccount({ id: "connected", name: data.name });
                setClaimSuccess(`LinkedIn connected as ${data.name}`);
                router.replace("/dashboard/settings");
            } else {
                const err = await res.json();
                setClaimError(err.error || "Failed to connect LinkedIn. Please try again.");
            }
        } catch (error) {
            setClaimError("Connection failed. Please try again.");
            console.error(error);
        } finally { setIsClaiming(false); }
    };

    const handleClaimInstagram = async (state: string) => {
        setIsClaiming(true);
        setClaimError(null);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/user/connections/instagram/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ state })
            });
            if (res.ok) {
                const data = await res.json();
                setInstagramAccount({ id: "connected", name: data.pageName });
                setClaimSuccess(`Instagram connected as ${data.pageName}`);
                router.replace("/dashboard/settings");
            } else {
                const err = await res.json();
                setClaimError(err.error || "Failed to connect Instagram. Please try again.");
            }
        } catch (error) {
            setClaimError("Connection failed. Please try again.");
            console.error(error);
        } finally { setIsClaiming(false); }
    };

    const handleExportData = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/user/export", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `marketing-ai-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDisconnect = async (platform: "instagram" | "linkedin") => {
        if (!user) return;
        const label = platform === "instagram" ? "Instagram" : "LinkedIn";
        if (!confirm(`Disconnect ${label}? You will need to re-authorise to publish to this platform.`)) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/user/connections/disconnect", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ platform })
            });
            if (res.ok) {
                if (platform === "instagram") {
                    setInstagramAccount(null);
                    localStorage.removeItem("ig_conn");
                } else {
                    setLinkedinAccount(null);
                    localStorage.removeItem("li_conn");
                }
                setClaimSuccess(`${label} disconnected successfully.`);
            } else {
                const err = await res.json();
                setClaimError(err.error || `Failed to disconnect ${label}.`);
            }
        } catch (error) {
            setClaimError(`Failed to disconnect ${label}. Please try again.`);
            console.error(error);
        }
    };

    if (isLoading || isClaiming) return (
        <div className="h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
            {isClaiming && <p className="text-sm font-medium text-muted-foreground animate-pulse">Connecting your account...</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-lg">Manage your account integrations, team, and data.</p>
            </div>

            {/* Success Banner */}
            {claimSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-green-600">{claimSuccess}</p>
                    <button onClick={() => setClaimSuccess(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
            )}

            {/* Error Banner */}
            {claimError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-600">{claimError}</p>
                    <button onClick={() => setClaimError(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
            )}

            <div className="grid gap-8">
                {/* Social Connections */}
                <section className="glass border border-border/50 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Integrations</h3>
                            <p className="text-sm text-muted-foreground font-medium">Connect your social ecosystems</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="group bg-muted/30 border border-border/50 rounded-3xl p-6 transition-all hover:bg-muted/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${instagramAccount ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-pink-500 text-white shadow-pink-500/20'}`}>
                                    <ImageIcon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">Instagram</p>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        {instagramAccount ? `✓ ${instagramAccount.name}` : 'Not Connected'}
                                    </p>
                                </div>
                            </div>
                            {instagramAccount ? (
                                <div className="space-y-2">
                                    <div className="w-full py-3 rounded-xl text-sm font-black text-center bg-green-500/10 text-green-600 border border-green-500/20">
                                        Connected · Direct Publishing
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect("instagram")}
                                        className="w-full py-2 rounded-xl text-xs font-black transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.location.href = "/api/auth/instagram"}
                                    className="w-full py-3 rounded-xl text-sm font-black transition-all btn-premium text-white"
                                >
                                    Link Account
                                </button>
                            )}
                        </div>

                        <div className="group bg-muted/30 border border-border/50 rounded-3xl p-6 transition-all hover:bg-muted/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${linkedinAccount ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-blue-400 text-white shadow-blue-400/20'}`}>
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">LinkedIn</p>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        {linkedinAccount ? `✓ ${linkedinAccount.name}` : 'Not Connected'}
                                    </p>
                                </div>
                            </div>
                            {linkedinAccount ? (
                                <div className="space-y-2">
                                    <div className="w-full py-3 rounded-xl text-sm font-black text-center bg-blue-600/10 text-blue-700 border border-blue-600/20">
                                        Connected · Direct Publishing
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect("linkedin")}
                                        className="w-full py-2 rounded-xl text-xs font-black transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.location.href = "/api/auth/linkedin"}
                                    className="w-full py-3 rounded-xl text-sm font-black transition-all btn-premium text-white"
                                >
                                    Link Account
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Team Management */}
                    <section className="glass border border-border/50 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-secondary/10 rounded-2xl">
                                    <Users className="h-6 w-6 text-secondary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Team</h3>
                                </div>
                            </div>
                            <button className="p-2 bg-muted/50 hover:bg-muted rounded-xl transition-all">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </button>
                        </div>

                        <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-muted/20 rounded-3xl border border-dashed border-border/50">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 transition-transform hover:rotate-12">
                                <Users className="h-8 w-8 text-muted-foreground opacity-30" />
                            </div>
                            <p className="font-bold mb-1">Solo Mission</p>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Collaborate with others by inviting them to your workspace.
                            </p>
                        </div>
                    </section>

                    {/* Data Sovereignty */}
                    <section className="glass border border-border/50 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Download className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Data</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                                <p className="font-bold text-sm mb-2">Export Library</p>
                                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                                    Your brand data, generated copies, and connection history in one JSON bundle.
                                </p>
                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-3 rounded-xl text-sm font-black hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download Bundle
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Premium Note */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 flex flex-col items-center text-center gap-2">
                <Sparkles className="h-8 w-8 text-primary mb-2 opacity-30" />
                <p className="text-sm font-bold text-primary tracking-wide">
                    PRO TIP
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Want to refine your brand's AI voice or industry? Use the **Profile Settings** in the sidebar.
                </p>
            </div>
        </div>
    );
}
