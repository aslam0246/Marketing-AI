
"use client";

import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";

interface ImageUploaderProps {
    onImageSelected: (file: File) => void;
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            onImageSelected(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer
                ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/50"}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-4 bg-muted rounded-full">
                    <Upload className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-medium text-foreground">Click or Drag to Upload</p>
                    <p className="text-xs">Supports JPG, PNG, WEBP</p>
                </div>
            </div>
        </div>
    );
}
