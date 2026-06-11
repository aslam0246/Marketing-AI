"use client";

import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { loginWithGoogle, user, loading } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-6">
            {/* Background Aesthetic */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg glass border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 transition-all">
                <div className="p-12 text-center">
                    <div className="h-16 w-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>

                    <h1 className="text-4xl font-black tracking-tight mb-3">Welcome Back</h1>
                    <p className="text-muted-foreground text-lg mb-10 font-medium">Sign in to your creative suite.</p>

                    <button
                        onClick={loginWithGoogle}
                        className="w-full h-14 bg-foreground text-background hover:opacity-90 font-bold rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-foreground/10"
                    >
                        <div className="bg-white p-1 rounded-lg">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                        </div>
                        <span className="text-sm">Sign in with Google</span>
                    </button>

                    <div className="mt-10 text-xs text-muted-foreground font-medium opacity-60">
                        By signing in, you agree to our <a href="#" className="underline decoration-primary/30 hover:text-primary transition-colors">Terms</a> and <a href="#" className="underline decoration-primary/30 hover:text-primary transition-colors">Privacy</a>.
                    </div>
                </div>
            </div>

            <div className="mt-10 text-sm font-bold text-muted-foreground relative z-10">
                <a href="/" className="flex items-center gap-2 hover:text-primary transition-all group">
                    <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </a>
            </div>
        </div>
    );
}
