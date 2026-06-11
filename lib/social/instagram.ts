
import { SocialConnector } from "../social-media-manager";

export class InstagramConnector implements SocialConnector {
    private igAccountId: string;
    private accessToken: string;

    constructor(igAccountId: string, accessToken: string) {
        this.igAccountId = igAccountId;
        this.accessToken = accessToken;
    }

    async publish(content: string, imageUrl?: string): Promise<string> {
        if (!imageUrl) {
            throw new Error("Instagram requires an image for publishing.");
        }

        console.log(`[INSTAGRAM-PUBLISH] Starting publish for IG Account: ${this.igAccountId}`);

        // Step 1: Create Media Container
        // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating
        const containerRes = await fetch(
            `https://graph.facebook.com/v18.0/${this.igAccountId}/media`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption: content,
                    access_token: this.accessToken
                })
            }
        );

        const containerData = await containerRes.json();
        if (containerData.error) {
            throw new Error(`IG Container Error: ${containerData.error.message}`);
        }

        const creationId = containerData.id;

        // Step 2: Wait for Container to be ready (Polling)
        // Usually fast for small images, but required by API
        let status = "IN_PROGRESS";
        let attempts = 0;
        while (status !== "FINISHED" && attempts < 10) {
            await new Promise(r => setTimeout(r, 2000));
            const statusRes = await fetch(
                `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${this.accessToken}`
            );
            const statusData = await statusRes.json();
            status = statusData.status_code;
            attempts++;

            if (status === "ERROR") throw new Error("IG Media container processing failed.");
        }

        if (status !== "FINISHED") {
            throw new Error("IG Media container timeout.");
        }

        // Step 3: Publish Media
        const publishRes = await fetch(
            `https://graph.facebook.com/v18.0/${this.igAccountId}/media_publish`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creation_id: creationId,
                    access_token: this.accessToken
                })
            }
        );

        const publishData = await publishRes.json();
        if (publishData.error) {
            throw new Error(`IG Publish Error: ${publishData.error.message}`);
        }

        return publishData.id; // Returns the IG Media ID
    }

    async getMetrics(platformPostId: string): Promise<{ likes: number; comments: number; shares: number; reach: number }> {
        console.log(`[INSTAGRAM-METRICS] Fetching for: ${platformPostId}`);

        try {
            // 1. Fetch Basic Stats (Likes/Comments)
            // https://developers.facebook.com/docs/instagram-api/reference/ig-media
            const basicRes = await fetch(
                `https://graph.facebook.com/v18.0/${platformPostId}?fields=like_count,comments_count&access_token=${this.accessToken}`
            );

            const basicData = await basicRes.json();
            if (basicData.error) {
                console.warn(`IG Basic Metrics Error: ${basicData.error.message}`);
            }

            // 2. Fetch Insights (Reach) - Requires Business/Creator account
            // https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
            const insightsRes = await fetch(
                `https://graph.facebook.com/v18.0/${platformPostId}/insights?metric=reach,impressions&access_token=${this.accessToken}`
            );

            const insightsData = await insightsRes.json();
            let reach = 0;
            if (insightsData.data) {
                const reachMetric = insightsData.data.find((m: any) => m.name === 'reach');
                if (reachMetric) reach = reachMetric.values[0].value;
            }

            return {
                likes: basicData.like_count || 0,
                comments: basicData.comments_count || 0,
                shares: 0, // Instagram API doesn't expose 'shares' for individual media usually
                reach: reach
            };
        } catch (error) {
            console.error("Instagram Metrics Fetch Failed:", error);
            return { likes: 0, comments: 0, shares: 0, reach: 0 };
        }
    }

    async getComments(platformPostId: string): Promise<Array<{ id: string, text: string, author: string, timestamp: string }>> {
        console.log(`[INSTAGRAM-COMMENTS] Fetching for: ${platformPostId}`);

        try {
            const res = await fetch(
                `https://graph.facebook.com/v18.0/${platformPostId}/comments?fields=id,text,username,timestamp&access_token=${this.accessToken}`
            );

            const data = await res.json();
            if (data.error) {
                console.warn(`IG Comments Error: ${data.error.message}`);
                return [];
            }

            return (data.data || []).map((c: any) => ({
                id: c.id,
                text: c.text,
                author: c.username,
                timestamp: c.timestamp
            }));
        } catch (error) {
            console.error("Instagram Comments Fetch Failed:", error);
            return [];
        }
    }

    async replyToComment(commentId: string, replyText: string): Promise<string> {
        console.log(`[INSTAGRAM-REPLY] Replying to comment: ${commentId}`);

        const res = await fetch(
            `https://graph.facebook.com/v18.0/${commentId}/replies`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: replyText,
                    access_token: this.accessToken
                })
            }
        );

        const data = await res.json();
        if (data.error) {
            throw new Error(`IG Reply Error: ${data.error.message}`);
        }

        return data.id;
    }

    async getFollowerCount(): Promise<number> {
        console.log(`[INSTAGRAM-FOLLOWERS] Fetching follower count for: ${this.igAccountId}`);
        try {
            const res = await fetch(
                `https://graph.facebook.com/v18.0/${this.igAccountId}?fields=followers_count&access_token=${this.accessToken}`
            );
            const data = await res.json();
            if (data.error) {
                console.warn(`[INSTAGRAM-FOLLOWERS] API Error: ${data.error.message}`);
                return 0;
            }
            return data.followers_count || 0;
        } catch (e) {
            console.error("[INSTAGRAM-FOLLOWERS] Fetch failed:", e);
            return 0;
        }
    }
}
