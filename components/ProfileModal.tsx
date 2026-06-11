"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Building2, Briefcase, MessageSquare, Target, Save, Loader2, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: any;
    onUpdate: () => void;
}

export function ProfileModal({ isOpen, onClose, currentProfile, onUpdate }: ProfileModalProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        businessName: "",
        industry: "",
        tone: "Professional",
        targetAudience: "",
        website: ""
    });

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                businessName: currentProfile.businessName || "",
                industry: currentProfile.industry || "",
                tone: currentProfile.tone || "Professional",
                targetAudience: currentProfile.targetAudience || "",
                website: currentProfile.website || ""
            });
        }
    }, [currentProfile, isOpen]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            alert("Error updating profile");
        } finally {
            setIsSaving(false);
        }
    };

    const tones = ["Professional", "Friendly", "Witty", "Bold", "Empathetic"];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-card/95 border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden backdrop-blur-md"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <h2 className="font-bold text-lg">Profile Settings</h2>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        placeholder="e.g. Acme AI"
                                        className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        Industry
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="">Select Industry</option>
                                        <option value="SaaS">SaaS / Tech</option>
                                        <option value="E-commerce">E-commerce</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Education">Education</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        Target Audience
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                        placeholder="e.g. Tech Founders, Busy Moms..."
                                        className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        Brand Tone
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {tones.map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setFormData({ ...formData, tone: t })}
                                                className={`h-9 rounded-lg border text-sm font-medium transition-all ${formData.tone === t
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-muted/30 border-border hover:border-primary/50"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formData.businessName || !formData.industry}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
