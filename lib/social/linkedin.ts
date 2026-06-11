
import { SocialConnector } from "../social-media-manager";

export class LinkedInConnector implements SocialConnector {
    private memberId: string;
    private accessToken: string;

    constructor(memberId: string, accessToken: string) {
        this.memberId = memberId;
        this.accessToken = accessToken;
    }

    async publish(content: string, imageUrl?: string): Promise<string> {
        console.log(`[LINKEDIN-PUBLISH] Starting publish for Member: ${this.memberId}`);

        let mediaAsset = null;

        if (imageUrl) {
            mediaAsset = await this.uploadImage(imageUrl);
        }

        const publishBody = {
            author: `urn:li:person:${this.memberId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: mediaAsset ? "IMAGE" : "NONE",
                    media: mediaAsset ? [{
                        status: "READY",
                        description: { text: "Post Image" },
                        media: mediaAsset,
                        title: { text: "Image" }
                    }] : []
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            },
            body: JSON.stringify(publishBody)
        });

        const data = await res.json();
        if (data.error || !res.ok) {
            throw new Error(`LinkedIn Publish Error: ${data.message || 'Unknown error'}`);
        }

        return data.id; // Returns the UGC Post URN
    }

    private async uploadImage(imageUrl: string): Promise<string> {
        // Step 1: Register Upload
        const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                registerUploadRequest: {
                    recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                    owner: `urn:li:person:${this.memberId}`,
                    serviceRelationships: [{
                        relationshipType: "OWNER",
                        identifier: "urn:li:userGeneratedContent"
                    }]
                }
            })
        });

        const registerData = await registerRes.json();
        const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const asset = registerData.value.asset;

        // Step 2: Upload Binary (Proxy through our server OR fetch and pipe)
        const imageFetch = await fetch(imageUrl);
        const imageBlob = await imageFetch.blob();

        const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Content-Type": imageBlob.type
            },
            body: imageBlob
        });

        if (!uploadRes.ok) throw new Error("LinkedIn Image Upload failed");

        return asset;
    }

    async getMetrics(platformPostId: string): Promise<{ likes: number; comments: number; shares: number; reach: number }> {
        console.log(`[LINKEDIN-METRICS] Fetching for: ${platformPostId}`);

        try {
            // platformPostId for LinkedIn is a URN like 'urn:li:ugcPost:12345'
            // The socialActions API uses the same URN
            const res = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(platformPostId)}`, {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0"
                }
            });

            if (!res.ok) {
                console.warn(`LinkedIn Metrics API returned ${res.status}. Falling back to defaults.`);
                return { likes: 0, comments: 0, shares: 0, reach: 0 };
            }

            const data = await res.json();

            return {
                likes: data.likesSummary?.totalLikes || 0,
                comments: data.commentsSummary?.totalComments || 0,
                shares: 0, // UGC Post metrics for shares often require specialized stats API
                reach: 0   // Reach is only available for Organizational Pages via organizationalEntityShareStatistics
            };
        } catch (error) {
            console.error("LinkedIn Metrics Fetch Failed:", error);
            return { likes: 0, comments: 0, shares: 0, reach: 0 };
        }
    }

    async getComments(platformPostId: string): Promise<Array<{ id: string, text: string, author: string, timestamp: string }>> {
        console.log(`[LINKEDIN-COMMENTS] Fetching for: ${platformPostId}`);

        try {
            const res = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(platformPostId)}/comments`, {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0"
                }
            });

            if (!res.ok) {
                console.warn(`LinkedIn Comments API returned ${res.status}. Returning empty.`);
                return [];
            }

            const data = await res.json();
            return (data.elements || []).map((c: any) => ({
                id: c.id,
                text: c.message.text,
                author: c.actor,
                timestamp: new Date(c.created.time).toISOString()
            }));
        } catch (error) {
            console.error("LinkedIn Comments Fetch Failed:", error);
            return [];
        }
    }
    async replyToComment(postId: string, commentId: string, replyText: string): Promise<string> {
        console.log(`[LINKEDIN-REPLY] Replying to comment: ${commentId} on post: ${postId}`);

        // LinkedIn replies are nested comments on a comment
        const res = await fetch(
            `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/comments`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                },
                body: JSON.stringify({
                    actor: `urn:li:person:${this.memberId}`,
                    message: { text: replyText }
                })
            }
        );

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`LinkedIn Reply Error: ${errorData.message || res.statusText}`);
        }

        const data = await res.json();
        return data.id;
    }

    async getFollowerCount(): Promise<number> {
        console.log(`[LINKEDIN-FOLLOWERS] Fetching follower count for: ${this.memberId}`);
        try {
            const res = await fetch(
                `https://api.linkedin.com/v2/networkSizes/urn:li:person:${this.memberId}?edgeType=CompanyFollowedByMember`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0"
                    }
                }
            );
            const data = await res.json();
            if (data.firstDegreeSize !== undefined) return data.firstDegreeSize;
            // Fallback: try connections count
            const connRes = await fetch(
                `https://api.linkedin.com/v2/connections?q=viewer&start=0&count=0`,
                { headers: { "Authorization": `Bearer ${this.accessToken}` } }
            );
            const connData = await connRes.json();
            return connData.paging?.total || 0;
        } catch (e) {
            console.error("[LINKEDIN-FOLLOWERS] Fetch failed:", e);
            return 0;
        }
    }
}
