import { generateContent } from "../lib/content-engine/generator";

console.log("--- Testing Content Engine ---");

const testCases = [
    {
        businessName: "CloudScale",
        industry: "SaaS",
        tone: "Professional",
        platform: "LinkedIn",
        topic: "AI Automation",
        keywords: "efficiency, scale",
    },
    {
        businessName: "FashionNova",
        industry: "E-commerce",
        tone: "Friendly",
        platform: "Instagram",
        topic: "Winter Sale",
        keywords: "cozy, discount",
    },
    {
        businessName: "EduMaster",
        industry: "Education",
        tone: "Professional",
        platform: "Twitter",
        topic: "New Course Launch",
        keywords: "learn, coding",
    },
];

testCases.forEach((params) => {
    console.log(`\n\n[Test: ${params.industry} | ${params.platform}]`);
    const result = generateContent(params as any);
    console.log(result);
});
