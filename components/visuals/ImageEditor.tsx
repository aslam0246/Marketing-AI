
"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Check, X, Crop as CropIcon, SlidersHorizontal, Image as ImageIcon, Type } from "lucide-react";
import getCroppedImg, { addTextOverlay } from "@/lib/canvas-utils";

interface ImageEditorProps {
    imageSrc: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export function ImageEditor({ imageSrc, onSave, onCancel }: ImageEditorProps) {
    const [mode, setMode] = useState<"crop" | "text">("crop");

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(1); // 1:1 Square default
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Text State
    const [text, setText] = useState("");
    const [textColor, setTextColor] = useState("#ffffff");
    const [textPos, setTextPos] = useState<"top" | "center" | "bottom">("center");

    // Filter State
    const [filter, setFilter] = useState("none");
    const [isSaving, setIsSaving] = useState(false);

    const onCropComplete = useCallback((active: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const ASPECTS = [
        { label: "Square (1:1)", value: 1 },
        { label: "Post (4:5)", value: 4 / 5 },
        { label: "Wide (16:9)", value: 16 / 9 },
    ];

    const FILTERS = [
        { label: "Normal", value: "none" },
        { label: "B&W", value: "grayscale(100%)" },
        { label: "Sepia", value: "sepia(70%)" },
        { label: "Vivid", value: "saturate(200%)" },
        { label: "Warm", value: "sepia(30%) saturate(150%) hue-rotate(-10deg)" },
    ];

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // 1. Crop
            let finalBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            // 2. Add Text (if exists)
            if (finalBlob && text) {
                finalBlob = await addTextOverlay(finalBlob, text, {
                    color: textColor,
                    position: textPos,
                    fontSize: 1.5
                });
            }

            if (finalBlob) {
                onSave(finalBlob);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-black/90 rounded-xl overflow-hidden text-white relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 z-10 backdrop-blur-sm absolute top-0 left-0 right-0">
                <span className="font-semibold flex items-center gap-2">
                    <CropIcon className="h-4 w-4" /> Edit Visual
                </span>
                <div className="flex bg-black/50 rounded-lg p-1">
                    <button
                        onClick={() => setMode("crop")}
                        className={`p-1.5 rounded-md ${mode === "crop" ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}
                    >
                        <CropIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setMode("text")}
                        className={`p-1.5 rounded-md ${mode === "text" ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}
                    >
                        <Type className="h-4 w-4" />
                    </button>
                </div>
                <button onClick={onCancel} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Cropper Area */}
            <div className="flex-1 relative bg-black/80">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    style={{
                        containerStyle: { background: "rgb(20, 20, 20)" },
                        // Applying CSS filter strictly for preview
                        mediaStyle: { filter: filter !== "none" ? filter : undefined }
                    }}
                />

                {/* Text Preview Overlay (Approximate) */}
                {text && mode === "text" && (
                    <div className={`absolute left-0 right-0 text-center pointer-events-none z-20 px-8 ${textPos === "top" ? "top-[20%]" : textPos === "bottom" ? "bottom-[20%]" : "top-[50%] -translate-y-1/2"
                        }`}>
                        <span style={{
                            color: textColor,
                            fontSize: "24px",
                            fontWeight: "bold",
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}>
                            {text}
                        </span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-neutral-900 space-y-4 z-10">

                {mode === "crop" ? (
                    <>
                        {/* Zoom */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium w-10">Zoom</span>
                            <input
                                type="range"
                                min={1} max={3} step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Aspect Ratios */}
                        <div className="flex gap-2 pb-2 overflow-x-auto">
                            {ASPECTS.map((ratio) => (
                                <button
                                    key={ratio.label}
                                    onClick={() => setAspect(ratio.value)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap
                                        ${aspect === ratio.value ? "bg-white text-black font-bold border-white" : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500"}
                                    `}
                                >
                                    {ratio.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.label}
                                    onClick={() => setFilter(f.value)}
                                    className={`text-xs flex flex-col items-center gap-1 min-w-[60px] p-1 rounded-lg transition-colors
                                        ${filter === f.value ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}
                                    `}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full bg-cover bg-center border border-neutral-700"
                                        style={{
                                            backgroundImage: `url(${imageSrc})`,
                                            filter: f.value
                                        }}
                                    />
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter headline..."
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500"
                        />
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                {/* Positions */}
                                {["top", "center", "bottom"].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setTextPos(p as any)}
                                        className={`px-3 py-1 rounded text-xs capitalize ${textPos === p ? "bg-neutral-700 text-white" : "text-neutral-500"}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                {/* Colors */}
                                {["#ffffff", "#000000", "#facc15", "#f87171"].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setTextColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 ${textColor === c ? "border-white" : "border-transparent"}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-2 border-t border-neutral-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                        {isSaving ? "Processing..." : <><Check className="h-4 w-4" /> Apply Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
