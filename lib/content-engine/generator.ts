import { generateWithAI } from "./ai-provider";

interface GeneratorParams {
    businessName: string;
    industry: string;
    tone: string;
    topic: string;
    keywords: string;
    platform: "Twitter" | "LinkedIn" | "Instagram";
}

export async function generateContent(params: GeneratorParams): Promise<string> {
    const { businessName, industry, tone, topic, keywords, platform } = params;

    // 1. Try AI Generation (The "Brain" Upgrade)
    const aiContent = await generateWithAI({
        businessName,
        industry,
        tone,
        topic,
        keywords,
        platform
    });

    if (aiContent) return aiContent;

    // If AI fails, throw error instead of using generic templates
    throw new Error("AI Generation failed. Please try again.");
}
