export const industryHashtags: Record<string, string[]> = {
    "SaaS": [
        "#SaaS", "#TechStartup", "#B2B", "#CloudComputing", "#SoftwareDevelopment",
        "#Innovation", "#FutureOfWork", "#Productivity", "#TechTrends"
    ],
    "E-commerce": [
        "#ShopLocal", "#OnlineShopping", "#RetailTherapy", "#MustHavers",
        "#StyleInspo", "#SmallBusiness", "#FlashSale", "#NewArrivals"
    ],
    "Finance": [
        "#FinTech", "#Investing", "#FinanceTips", "#MoneyManagement",
        "#Entrepreneurship", "#WealthBuilding", "#Crypto", "#BusinessGrowth"
    ],
    "Healthcare": [
        "#HealthTech", "#Wellness", "#DigitalHealth", "#MedTech",
        "#SelfCare", "#HealthyLiving", "#MentalHealthMatters"
    ],
    "Education": [
        "#EdTech", "#Learning", "#OnlineEducation", "#StudentLife",
        "#FutureOfLearning", "#Upskilling", "#KnowledgeSharing"
    ],
    "Other": [
        "#StartupLife", "#Business", "#Entrepreneur", "#Hustle",
        "#GrowthMindset", "#Success", "#Motivation"
    ]
};

export function getRecommendedHashtags(industry: string, count: number = 3): string[] {
    const tags = industryHashtags[industry] || industryHashtags["Other"];
    // Shuffle array and take first n elements
    const shuffled = [...tags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
