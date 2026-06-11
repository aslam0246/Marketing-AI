
const GEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiConfig {
    apiKey: string;
}

export class GeminiClient {
    private apiKey: string;

    constructor(config: GeminiConfig) {
        this.apiKey = config.apiKey;
    }

    /**
     * Generates text with cascading fallbacks.
     * Updated March 2026: removed deprecated models (gemini-1.5-flash, gemini-2.0-flash-exp).
     */
    async generateText(prompt: string): Promise<string> {
        // ── Tier 1: Gemini models (fastest, best quality) ──────────────
        const geminiModels = [
            "gemini-2.5-flash",       // Newest — 5 RPM free tier
            "gemini-2.0-flash",       // Fast stable — 15 RPM
            "gemini-2.0-flash-lite",  // Lightweight — separate quota pool
        ];

        for (const model of geminiModels) {
            try {
                return await this.callGeminiWithModel(model, prompt);
            } catch (e: any) {
                const msg = e.message || "";
                const reason = msg.includes("429") ? "quota/rate-limit" : msg.includes("404") ? "not found" : "error";
                console.warn(`[Gemini] ${model} failed (${reason})`);
            }
        }

        // ── Tier 2: Groq (free, 30 req/min, llama-3.3-70b) ────────────
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            try {
                return await this.generateTextGroq(prompt, groqKey);
            } catch (e: any) {
                console.warn("[Groq] Failed:", e.message?.slice(0, 80));
            }
        }

        // ── Tier 3: HuggingFace (chat completions API) ─────────────────
        const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
        if (hfKey) {
            try {
                return await this.generateTextHF(prompt, hfKey);
            } catch (e: any) {
                console.warn("[HuggingFace] Failed:", e.message?.slice(0, 80));
            }
        }

        // ── Tier 4: OpenRouter (free models, no key needed for some) ───
        try {
            return await this.generateTextOpenRouter(prompt);
        } catch (e: any) {
            console.warn("[OpenRouter] Failed:", e.message?.slice(0, 80));
        }

        // ── Tier 5: Pollinations text (no key needed) ──────────────────
        try {
            return await this.generateTextFallback(prompt);
        } catch (fallbackError: any) {
            console.error("All text generation methods failed:", fallbackError.message);
            throw new Error("Content generation unavailable. Please try again later.");
        }
    }

    /** Tier 2: Groq — free API, 30 req/min, llama-3.3-70b (excellent quality) */
    private async generateTextGroq(prompt: string, apiKey: string): Promise<string> {
        console.log("[Groq] Trying llama-3.3-70b-versatile...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are an expert social media marketing assistant. Write only the requested content, nothing else." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1024,
                temperature: 0.7,
            }),
            signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
            const err = await response.text().catch(() => "");
            throw new Error(`Groq ${response.status}: ${err.slice(0, 100)}`);
        }
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "";
        if (!text) throw new Error("Groq returned empty response");
        console.log(`[Groq] ✅ Success (${text.length} chars)`);
        return text;
    }

    /** Tier 3: HuggingFace — using chat completions API (updated May 2026) */
    private async generateTextHF(prompt: string, apiKey: string): Promise<string> {
        console.log("[HuggingFace] Trying chat completions...");
        // Use the new Inference Providers chat completions endpoint
        const response = await fetch(
            "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct/v1/chat/completions",
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                signal: AbortSignal.timeout(25000),
                body: JSON.stringify({
                    model: "meta-llama/Llama-3.2-3B-Instruct",
                    messages: [
                        { role: "system", content: "You are an expert social media marketing assistant." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 512,
                    temperature: 0.7,
                }),
            }
        );
        if (!response.ok) throw new Error(`HF failed (${response.status})`);
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "";
        if (!text) throw new Error("HF returned empty response");
        return text;
    }

    /** Tier 4: OpenRouter — routes to free models (mistral, llama, gemma) */
    private async generateTextOpenRouter(prompt: string): Promise<string> {
        console.log("[OpenRouter] Trying free models...");
        // Free models on OpenRouter (no key required for some, or use free tier key)
        const openRouterKey = process.env.OPENROUTER_API_KEY || "";
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                ...(openRouterKey ? { Authorization: `Bearer ${openRouterKey}` } : {}),
                "Content-Type": "application/json",
                "HTTP-Referer": "https://marketingai.app",
                "X-Title": "MarketingAI",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.2-3b-instruct:free", // Always free on OpenRouter
                messages: [
                    { role: "system", content: "You are an expert social media marketing assistant. Write only the requested content." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 512,
            }),
            signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "";
        if (!text) throw new Error("OpenRouter returned empty response");
        console.log(`[OpenRouter] ✅ Success (${text.length} chars)`);
        return text;
    }

    private async callGeminiWithModel(model: string, prompt: string): Promise<string> {
        const url = `${GEN_API_URL}/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Model ${model} failed (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    /** Tier 5: Pollinations text — updated endpoint (May 2026) */
    private async generateTextFallback(prompt: string): Promise<string> {
        // Pollinations updated their text API — try both endpoints
        const endpoints = [
            "https://text.pollinations.ai/",        // Simple GET-style POST
            "https://text.pollinations.ai/openai",  // OpenAI-compatible
        ];

        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "openai",
                        messages: [
                            { role: "system", content: "You are an expert social media marketing assistant. Write only the requested social media post, nothing else." },
                            { role: "user", content: prompt }
                        ],
                        seed: Math.floor(Math.random() * 9999)
                    }),
                    signal: AbortSignal.timeout(20000),
                });
                if (!response.ok) continue;
                const data = await response.json().catch(() => null);
                const text = data?.choices?.[0]?.message?.content?.trim();
                if (text) {
                    console.log(`[Pollinations] ✅ Text success via ${url}`);
                    return text;
                }
            } catch (e: any) {
                console.warn(`[Pollinations] ${url} failed:`, e.message?.slice(0, 50));
            }
        }
        throw new Error("Pollinations text fallback exhausted all endpoints");
    }

    /**
     * Generates an AI image from a text prompt.
     * Cascading fallback chain (all are content-aware AI generation, NOT search):
     *   1. Pollinations FLUX    — fastest, free, no key, may add watermark
     *   2. HuggingFace FLUX-schnell — high quality, uses HF key if available
     *   3. AI Horde             — community Stable Diffusion, free, no key needed
     *   4. Picsum               — last resort random placeholder
     */
    async generateImage(prompt: string, style: string = "Photorealistic"): Promise<ArrayBuffer | null> {
        const enrichedPrompt = `${prompt}, ${style} style, professional marketing photo, high quality, 4k, sharp details, commercial photography`;

        // ── Provider 1: Pollinations FLUX ────────────────────────────
        try {
            const result = await this.generateViaPollinationsFlux(enrichedPrompt);
            if (result) return result;
        } catch (e: any) {
            console.warn("[Image] Pollinations FLUX failed:", e.message?.slice(0, 60));
        }

        // ── Provider 2: HuggingFace FLUX-schnell ─────────────────────
        const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
        if (hfKey) {
            try {
                const result = await this.generateViaHuggingFace(enrichedPrompt, hfKey);
                if (result) return result;
            } catch (e: any) {
                console.warn("[Image] HuggingFace FLUX-schnell failed:", e.message?.slice(0, 60));
            }
        }

        // ── Provider 3: AI Horde (Stable Diffusion, no key needed) ───
        try {
            const result = await this.generateViaAIHorde(enrichedPrompt);
            if (result) return result;
        } catch (e: any) {
            console.warn("[Image] AI Horde failed:", e.message?.slice(0, 60));
        }

        // ── Provider 4: Picsum (last resort placeholder) ──────────────
        return this.generateImageFallback(prompt);
    }

    /** Provider 1: Pollinations.ai — FLUX model, GET request, no key needed */
    private async generateViaPollinationsFlux(prompt: string): Promise<ArrayBuffer | null> {
        const encoded = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 99999);
        // Use Pollinations with a token if configured, otherwise anonymous (may watermark)
        const token = process.env.POLLINATIONS_TOKEN
            ? `&token=${process.env.POLLINATIONS_TOKEN}`
            : "";
        const url = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}${token}`;

        console.log(`[Image] Trying Pollinations FLUX...`);
        const res = await fetch(url, {
            signal: AbortSignal.timeout(25000), // 25s timeout
            headers: {
                "Referer": "https://pollinations.ai/",
                "User-Agent": "Mozilla/5.0 (compatible; MarketingAI/1.0)",
                "Accept": "image/webp,image/png,image/*,*/*",
            }
        });

        if (!res.ok) throw new Error(`Pollinations ${res.status}`);
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("image")) throw new Error(`Pollinations non-image response: ${ct}`);
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 5000) throw new Error(`Pollinations tiny response (${buf.byteLength}b)`);

        console.log(`[Image] Pollinations success — ${(buf.byteLength / 1024).toFixed(0)} KB`);
        return buf;
    }

    /** Provider 2: HuggingFace — FLUX-schnell (state-of-the-art, fast generation) */
    private async generateViaHuggingFace(prompt: string, apiKey: string): Promise<ArrayBuffer | null> {
        console.log(`[Image] Trying HuggingFace FLUX-schnell...`);
        const res = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                method: "POST",
                signal: AbortSignal.timeout(30000),
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "X-Wait-For-Model": "true", // Wait if model is loading (cold start)
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        width: 1024,
                        height: 1024,
                        num_inference_steps: 4, // schnell is optimized for 4 steps
                        guidance_scale: 0.0,
                    }
                })
            }
        );

        if (!res.ok) {
            const err = await res.text().catch(() => "");
            throw new Error(`HF ${res.status}: ${err.slice(0, 100)}`);
        }
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 5000) throw new Error(`HF tiny response (${buf.byteLength}b)`);

        console.log(`[Image] HuggingFace FLUX-schnell success — ${(buf.byteLength / 1024).toFixed(0)} KB`);
        return buf;
    }

    /**
     * Provider 3: AI Horde — Community Stable Diffusion grid.
     * Completely free, no API key needed, uses community GPU workers.
     * Slower (~15–60s), but always produces real AI images.
     */
    private async generateViaAIHorde(prompt: string): Promise<ArrayBuffer | null> {
        console.log(`[Image] Trying AI Horde (community Stable Diffusion)...`);
        const HORDE_API = "https://aihorde.net/api/v2";

        // Submit generation job
        const submitRes = await fetch(`${HORDE_API}/generate/async`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": "0000000000",       // Anonymous key — always accepted
                "Client-Agent": "MarketingAI:1.0:support@marketingai.com"
            },
            body: JSON.stringify({
                prompt: prompt.slice(0, 1000), // AI Horde limit
                params: {
                    sampler_name: "k_euler",
                    cfg_scale: 7,
                    width: 1024,
                    height: 1024,
                    steps: 20,
                    n: 1,
                },
                models: ["Deliberate"],
                r2: true, // Use R2 CDN for faster image delivery
            })
        });

        if (!submitRes.ok) throw new Error(`AI Horde submit failed: ${submitRes.status}`);
        const { id } = await submitRes.json();
        if (!id) throw new Error("AI Horde: no job ID returned");

        // Poll for completion (up to 60s)
        for (let attempt = 0; attempt < 12; attempt++) {
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s between polls

            const checkRes = await fetch(`${HORDE_API}/generate/check/${id}`);
            const status = await checkRes.json();

            if (status.faulted) throw new Error("AI Horde job faulted");

            if (status.done) {
                // Fetch the final result
                const resultRes = await fetch(`${HORDE_API}/generate/status/${id}`);
                const result = await resultRes.json();
                const imageUrl = result.generations?.[0]?.img;
                if (!imageUrl) throw new Error("AI Horde: no image URL in result");

                // Download the image
                const imgRes = await fetch(imageUrl);
                if (!imgRes.ok) throw new Error(`AI Horde image download failed: ${imgRes.status}`);
                const buf = await imgRes.arrayBuffer();
                console.log(`[Image] AI Horde success — ${(buf.byteLength / 1024).toFixed(0)} KB`);
                return buf;
            }

            console.log(`[Image] AI Horde: waiting... (${status.waiting} waiting, ${status.processing} processing)`);
        }

        throw new Error("AI Horde timed out after 60s");
    }

    /** Last resort: Picsum random high-quality photo */
    async generateImageFallback(prompt: string): Promise<ArrayBuffer | null> {
        try {
            console.warn(`[Image] All AI providers failed. Using Picsum placeholder...`);
            const seed = Math.abs(prompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 1000;
            const url = `https://picsum.photos/seed/${seed}/1024/1024`;
            const res = await fetch(url, { redirect: "follow" });
            if (!res.ok) throw new Error(`Picsum failed: ${res.status}`);
            return await res.arrayBuffer();
        } catch (error) {
            console.error("[Image] All providers exhausted:", error);
            return null;
        }
    }
}

