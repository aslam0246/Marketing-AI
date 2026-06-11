
"use client";

import { useState } from "react";
import { Image as ImageIcon, Wand2, Upload, X, Sparkles, Loader2 } from "lucide-react";
import { ImageEditor } from "./ImageEditor";
import { AIImageCreator } from "./AIImageCreator";
import { ImageUploader } from "./ImageUploader";

interface VisualManagerProps {
    onImageSelected: (imageSource: Blob | string | null) => void;
    topic?: string;
    /** Called when user clicks "Generate Caption from Image" */
    onGenerateCaptionFromImage?: (imageSource: Blob | string) => void;
    isGeneratingCaption?: boolean;
}

export function VisualManager({ onImageSelected, topic, onGenerateCaptionFromImage, isGeneratingCaption }: VisualManagerProps) {
    const [activeTab, setActiveTab] = useState<"ai" | "upload">("ai");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageSource, setImageSource] = useState<Blob | string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleImageBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setImageSource(blob);
        onImageSelected(blob);
        setIsEditing(false);
    };

    const handleSaveEdit = (blob: Blob) => handleImageBlob(blob);

    const clearImage = () => {
        setPreviewUrl(null);
        setImageSource(null);
        onImageSelected(null);
        setIsEditing(false);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <ImageIcon className="h-5 w-5 text-primary" /> Visual Studio
            </h3>

            {isEditing && previewUrl ? (
                <ImageEditor
                    imageSrc={previewUrl}
                    onSave={handleSaveEdit}
                    onCancel={() => setIsEditing(false)}
                />
            ) : previewUrl ? (
                <div className="space-y-3">
                    {/* Image preview */}
                    <div className="relative group rounded-lg overflow-hidden border border-border bg-black/5">
                        <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain" />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-black/80 backdrop-blur-sm"
                            >
                                ✂️ Edit / Crop
                            </button>
                            <button
                                onClick={clearImage}
                                className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-600 backdrop-blur-sm"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Generate Caption from Image ── */}
                    {onGenerateCaptionFromImage && imageSource && (
                        <button
                            onClick={() => onGenerateCaptionFromImage(imageSource)}
                            disabled={isGeneratingCaption}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                                       bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold
                                       hover:opacity-90 transition-all shadow-lg shadow-violet-500/30
                                       disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isGeneratingCaption ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Analyzing image & writing caption...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    ✨ Generate Caption from this Image
                                </>
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex p-1 bg-muted/50 rounded-lg w-max gap-1">
                        <button
                            onClick={() => setActiveTab("ai")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5
                                ${activeTab === "ai" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Wand2 className="h-3.5 w-3.5" /> AI Create
                        </button>
                        <button
                            onClick={() => setActiveTab("upload")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5
                                ${activeTab === "upload" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Upload className="h-3.5 w-3.5" /> Upload
                        </button>
                    </div>

                    <div className="min-h-[150px]">
                        {activeTab === "ai" && (
                            <AIImageCreator
                                onImageSelected={(blob, originalUrl) => {
                                    const preview = URL.createObjectURL(blob);
                                    setPreviewUrl(preview);
                                    const src = originalUrl || blob;
                                    setImageSource(src);
                                    onImageSelected(src);
                                    setIsEditing(false);
                                }}
                                topic={topic}
                            />
                        )}
                        {activeTab === "upload" && (
                            <ImageUploader onImageSelected={handleImageBlob} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
