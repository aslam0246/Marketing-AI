
const GEMINI_API = "/api/gemini";

interface AIParams {
    businessName: string;
    industry: string;
    tone: string;
    topic: string;
    keywords: string;
    platform: string;
}

/**
 * Generates social media text using Gemini 1.5 Flash.
 */
export async function generateWithAI(params: AIParams): Promise<string | null> {
    // User requested strict adherence to topic and variety, avoiding generic templates.
    const prompt = `You are an expert social media manager for a ${params.industry} company called "${params.businessName}".

    Task: Write a completely UNIQUE and CREATIVE ${params.tone} social media post for ${params.platform} strictly about "${params.topic}".
    
    CRITICAL INSTRUCTION: Generate fresh, non-repetitive content. Do NOT use generic templates. Every output must feel distinct.

    Specific Rules for ${params.platform}:
    - LinkedIn: Professional yet conversational, short paragraphs, end with a thought-provoking question.
    - Twitter/X: Under 280 chars, punchy, direct, no fluff.
    - Instagram: Visual storytelling, atmospheric description (vibe/taste/look), hashtags at the bottom.

    Content Guidelines:
    1. **Strict Context**: Focus 100% on "${params.topic}". If it's a burger, describe the cheese melting. If it's software, talk about speed.
    2. **Strong Hook**: Start immediately with a question, controversy, or value proposition.
    3. **No Fluff**: Avoid generic intro sentences like "We are excited to announce". Jump straight into the value.
    4. **Hashtags**: Generate 3-5 hashtags SPECIFIC to "${params.topic}" (not just generic industry tags).
    
    Output ONLY the social media post text.`;

    try {
        const response = await fetch(GEMINI_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            let errorMsg = "Text generation failed";
            try {
                const errorData = await response.json();
                console.error("AI Generation Server Error Object:", errorData);
                errorMsg = errorData.error || errorMsg;
            } catch (p) {
                const rawText = await response.text();
                console.error("AI Generation Server Raw Error:", rawText);
                errorMsg = `Server Error (${response.status})`;
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        return result.generated_text?.trim() || null;
    } catch (error) {
        console.error("Content Gen Error:", error);
        return null;
    }
}
