"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, Users, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        businessName: "",
        industry: "",
        website: "",
        targetAudience: "",
        tone: "Professional",
        socials: { twitter: "", linkedin: "", instagram: "" }
    });

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Background Aesthetic */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Progress Header */}
                <div className="mb-10 space-y-4 px-2">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">Onboarding Voyage</p>
                            <h2 className="text-sm font-bold text-muted-foreground opacity-70">
                                Phase {step} of 3
                            </h2>
                        </div>
                        <span className="text-xs font-black text-foreground">{Math.round((step / 3) * 100)}% COMPLETE</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/20">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        />
                    </div>
                </div>

                {/* Main Card */}
                <div className="glass border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-10 flex-1 flex flex-col">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <StepOne key="step1" data={formData} update={updateField} onNext={handleNext} />
                            )}
                            {step === 2 && (
                                <StepTwo key="step2" data={formData} update={updateField} onBack={handleBack} onNext={handleNext} />
                            )}
                            {step === 3 && (
                                <StepThree key="step3" data={formData} update={updateField} onBack={handleBack} />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

const isValidStep1 = (data: any) => data.businessName && data.industry;

function StepOne({ data, update, onNext }: { data: any, update: any, onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Building2 className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Your Startup Profile</h2>
                    <p className="text-muted-foreground font-medium">Basics to fuel your AI content engine.</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                <div className="group">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">Business Name</label>
                    <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium placeholder:opacity-30"
                        placeholder="e.g. Acme AI"
                    />
                </div>
                <div className="group">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">Industry</label>
                    <div className="relative">
                        <select
                            value={data.industry}
                            onChange={(e) => update("industry", e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Select Industry</option>
                            <option value="SaaS">SaaS / Tech</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                            <ArrowRight className="h-4 w-4 rotate-90" />
                        </div>
                    </div>
                </div>
                <div className="group">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">Website</label>
                    <input
                        type="url"
                        value={data.website}
                        onChange={(e) => update("website", e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium placeholder:opacity-30"
                        placeholder="https://acme.ai"
                    />
                </div>
            </div>

            <div className="pt-10 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!isValidStep1(data)}
                    className="btn-premium text-white px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl"
                >
                    Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}

function StepTwo({ data, update, onBack, onNext }: { data: any, update: any, onBack: () => void, onNext: () => void }) {
    const tones = ["Professional", "Friendly", "Witty", "Bold", "Empathetic"];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary shadow-inner">
                    <Users className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Brand Persona</h2>
                    <p className="text-muted-foreground font-medium">How should your AI speak to the world?</p>
                </div>
            </div>

            <div className="space-y-8 flex-1">
                <div className="group">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 group-focus-within:text-secondary transition-colors">Target Audience</label>
                    <input
                        type="text"
                        value={data.targetAudience}
                        onChange={(e) => update("targetAudience", e.target.value)}
                        className="w-full h-14 px-6 rounded-2xl bg-muted/20 border border-border/50 focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-medium placeholder:opacity-30"
                        placeholder="e.g. Small business owners, Gen Z gamers..."
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Desired Brand Tone</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {tones.map((tone) => (
                            <button
                                key={tone}
                                onClick={() => update("tone", tone)}
                                className={`h-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 ${data.tone === tone
                                    ? "border-secondary bg-secondary/10 text-secondary shadow-lg shadow-secondary/10"
                                    : "border-border/50 hover:border-secondary/30 text-muted-foreground"
                                    }`}
                            >
                                {tone}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-10 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground px-6 py-4 font-bold text-sm transition-colors border-2 border-transparent hover:border-border/50 rounded-2xl"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="btn-premium text-white px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 shadow-xl group"
                >
                    Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}

function StepThree({ data, update, onBack }: { data: any, update: any, onBack: () => void }) {
    const router = useRouter();
    const { user } = useAuth();

    const handleComplete = async () => {
        if (!user) {
            alert("Please sign in to save your startup profile.");
            router.push("/login");
            return;
        }

        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                alert("Failed to save data. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving data");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Final Preview</h2>
                    <p className="text-muted-foreground font-medium">Verify your details before launching.</p>
                </div>
            </div>

            <div className="flex-1">
                <div className="p-8 rounded-[2rem] bg-muted/20 border-2 border-border/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Sparkles className="h-12 w-12" />
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Startup Identity</span>
                            <span className="font-bold text-foreground">{data.businessName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chosen Tone</span>
                            <span className="font-bold text-secondary">{data.tone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Domain Focus</span>
                            <span className="font-bold text-foreground">{data.industry}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-10 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground px-6 py-4 font-bold text-sm transition-colors border-2 border-transparent hover:border-border/50 rounded-2xl"
                >
                    Go Back
                </button>
                <button
                    onClick={handleComplete}
                    className="btn-premium text-white px-12 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl flex items-center gap-3"
                >
                    Launch Dashboard
                </button>
            </div>
        </motion.div>
    );
}
