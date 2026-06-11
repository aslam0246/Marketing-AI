export interface Template {
    id: string;
    industry: string;
    tone: string;
    platform: "Twitter" | "LinkedIn" | "Instagram";
    content: string; // Contains placeholders like {{topic}}, {{businessName}}, {{keywords}}
}

export const templates: Template[] = [
    // --- SaaS / Tech ---
    {
        id: "saas-launch-professional-li",
        industry: "SaaS",
        tone: "Professional",
        platform: "LinkedIn",
        content:
            "🚀 Exciting news from {{businessName}}!\n\nWe are exploring {{topic}} to help businesses streamline their operations. In today's fast-paced digital landscape, efficiency is key. \n\nKey focus areas:\n{{keywords}}\n\nHow is your team handling this challenge? Let's discuss in the comments. 👇",
    },
    {
        id: "saas-update-friendly-tw",
        industry: "SaaS",
        tone: "Friendly",
        platform: "Twitter",
        content:
            "Big things coming to {{businessName}}! ✨\n\nWe're working on {{topic}} to make your life easier. Who else loves saving time? 🙋‍♂️\n\n#TechTrends #StartupLife {{keywords}}",
    },
    {
        id: "saas-bold-li",
        industry: "SaaS",
        tone: "Bold",
        platform: "LinkedIn",
        content:
            "Stop wasting time on outdated methods. 🛑\n\nAt {{businessName}}, we believe in {{topic}} as the future. The old way is dead. \n\nWe're doubling down on:\n{{keywords}}\n\nAgree or disagree?",
    },

    // --- E-commerce ---
    {
        id: "ecom-product-friendly-ig",
        industry: "E-commerce",
        tone: "Friendly",
        platform: "Instagram",
        content:
            "✨ Level up your lifestyle with {{businessName}}! ✨\n\nWe are obsessed with {{topic}} right now. 😍 Nothing beats quality and style.\n\nCheck out our latest drops related to {{keywords}}.\n\nLink in bio! 🛍️",
    },
    {
        id: "ecom-sale-witty-tw",
        industry: "E-commerce",
        tone: "Witty",
        platform: "Twitter",
        content:
            "Your wallet might hate us, but your style will thank us. 💅\n\nTalking about {{topic}} at {{businessName}} today. \n\nGrab it before it's gone! {{keywords}}",
    },

    // --- B2B Service / Consulting ---
    {
        id: "consulting-insight-professional-li",
        industry: "Finance",
        tone: "Professional",
        platform: "LinkedIn",
        content:
            "The landscape of {{topic}} is shifting.\n\nAt {{businessName}}, we advise our clients to stay ahead of the curve. It's not just about reacting; it's about predicting.\n\nRelevance: {{keywords}}.\n\nWhat's your strategy for the coming quarter?",
    }
];
