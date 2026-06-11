
import { adminDb } from "./firebase-admin";

export interface PostMetrics {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
}

export interface SocialConnector {
    publish(content: string, imageUrl?: string): Promise<string>;
    getMetrics(platformPostId: string): Promise<PostMetrics>;
    getComments(platformPostId: string): Promise<Array<{ id: string, text: string, author: string, timestamp: string }>>;
}

export class MockConnector implements SocialConnector {
    private platform: string;

    constructor(platform: string = "MockPlatform") {
        this.platform = platform;
    }

    async publish(content: string, imageUrl?: string): Promise<string> {
        console.log(`[MOCK-PUBLISH] Platform: ${this.platform}`);
        console.log(`[MOCK-PUBLISH] Content: ${content}`);
        if (imageUrl) console.log(`[MOCK-PUBLISH] Image: ${imageUrl}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return `mock-id-${this.platform}-${Date.now()}`;
    }

    async getMetrics(platformPostId: string): Promise<PostMetrics> {
        console.log(`[MOCK-METRICS] Fetching for: ${platformPostId}`);
        return {
            likes: Math.floor(Math.random() * 500) + 10,
            comments: Math.floor(Math.random() * 50) + 1,
            shares: Math.floor(Math.random() * 20),
            reach: Math.floor(Math.random() * 5000) + 200
        };
    }

    async getComments(platformPostId: string): Promise<Array<{ id: string, text: string, author: string, timestamp: string }>> {
        console.log(`[MOCK-COMMENTS] Fetching for: ${platformPostId}`);
        return [
            { id: "mock-c1", text: "This is an amazing post!", author: "User1", timestamp: new Date().toISOString() },
            { id: "mock-c2", text: "I'm not sure about this approach.", author: "User2", timestamp: new Date().toISOString() },
            { id: "mock-c3", text: "Great insights as always.", author: "User3", timestamp: new Date().toISOString() },
            { id: "mock-c4", text: "Could be better.", author: "User4", timestamp: new Date().toISOString() },
            { id: "mock-c5", text: "Perfect timing!", author: "User5", timestamp: new Date().toISOString() }
        ];
    }
}

export class SocialMediaManager {
    static async publishPost(postId: string, userId: string) {
        console.log(`Starting publish workflow for post: ${postId}`);

        // 1. Fetch Post
        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            throw new Error(`Post ${postId} not found`);
        }

        const post = postDoc.data();
        if (!post) throw new Error("Post data empty");

        // Idempotency check: prevent double-publishing
        if (post.status === "published" || post.status === "publishing") {
            console.log(`[IDEMPOTENCY] Post ${postId} is already ${post.status}. Skipping.`);
            return { success: true, platformPostId: post.platformPostId, skipped: true };
        }

        // Mark as publishing to prevent race conditions
        await postRef.update({ status: "publishing" });

        // 2. Select Connector
        let connector: SocialConnector;

        if (post.platform === "Instagram") {
            // Check if user has a real Instagram connection
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("instagram");
            const connDoc = await connRef.get();

            if (connDoc.exists) {
                const connData = connDoc.data();
                const { InstagramConnector } = await import("./social/instagram");
                connector = new InstagramConnector(connData?.igAccountId, connData?.accessToken);
                console.log(`[REAL-PUBLISH] Using InstagramConnector for user ${userId}`);
            } else {
                console.log(`[MOCK-PUBLISH] No Instagram connection found, falling back to Mock.`);
                connector = new MockConnector("Instagram (Mock)");
            }
        } else if (post.platform === "LinkedIn") {
            // Check if user has a real LinkedIn connection
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("linkedin");
            const connDoc = await connRef.get();

            if (connDoc.exists) {
                const connData = connDoc.data();
                const { LinkedInConnector } = await import("./social/linkedin");
                connector = new LinkedInConnector(connData?.linkedinId, connData?.accessToken);
                console.log(`[REAL-PUBLISH] Using LinkedInConnector for user ${userId}`);
            } else {
                console.log(`[MOCK-PUBLISH] No LinkedIn connection found, falling back to Mock.`);
                connector = new MockConnector("LinkedIn (Mock)");
            }
        } else {
            connector = new MockConnector(post.platform || "Generic");
        }

        try {
            // 3. Publish
            const platformPostId = await connector.publish(post.content, post.imageUrl);

            // 4. Update Firestore
            await postRef.update({
                status: "published",
                publishedAt: new Date().toISOString(),
                platformPostId: platformPostId,
                error: null // clear any previous errors
            });

            console.log(`Successfully published post ${postId}`);
            return { success: true, platformPostId };

        } catch (error: any) {
            console.error(`Failed to publish post ${postId}`, error);

            await postRef.update({
                status: "failed",
                error: error.message
            });

            throw error;
        }
    }

    static async syncPostMetrics(postId: string, userId: string) {
        console.log(`Syncing metrics for post: ${postId}`);

        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) throw new Error("Post not found");
        const post = postDoc.data();
        if (!post || post.status !== "published" || !post.platformPostId) {
            console.log(`Post ${postId} not eligible for sync.`);
            return null;
        }

        // 1. Get Connector
        let connector: SocialConnector;
        if (post.platform === "Instagram") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("instagram");
            const connDoc = await connRef.get();
            if (connDoc.exists) {
                const connData = connDoc.data();
                const { InstagramConnector } = await import("./social/instagram");
                connector = new InstagramConnector(connData?.igAccountId, connData?.accessToken);
            } else {
                connector = new MockConnector("Instagram");
            }
        } else if (post.platform === "LinkedIn") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("linkedin");
            const connDoc = await connRef.get();
            if (connDoc.exists) {
                const connData = connDoc.data();
                const { LinkedInConnector } = await import("./social/linkedin");
                connector = new LinkedInConnector(connData?.linkedinId, connData?.accessToken);
            } else {
                connector = new MockConnector("LinkedIn");
            }
        } else {
            connector = new MockConnector(post.platform);
        }

        // 2. Fetch Metrics
        try {
            const metrics = await connector.getMetrics(post.platformPostId);

            // 3. Update Firestore
            await postRef.update({
                metrics: metrics,
                lastMetricsSync: new Date().toISOString()
            });

            return metrics;
        } catch (error) {
            console.error(`Failed to sync metrics for post ${postId}`, error);
            throw error;
        }
    }

    static async getPostComments(postId: string, userId: string): Promise<Array<{ text: string, author: string, timestamp: string }>> {
        console.log(`Fetching comments for post: ${postId}`);

        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) throw new Error("Post not found");
        const post = postDoc.data();
        if (!post || post.status !== "published" || !post.platformPostId) {
            return [];
        }

        // 1. Get Connector
        let connector: SocialConnector;
        if (post.platform === "Instagram") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("instagram");
            const connDoc = await connRef.get();
            if (connDoc.exists) {
                const connData = connDoc.data();
                const { InstagramConnector } = await import("./social/instagram");
                connector = new InstagramConnector(connData?.igAccountId, connData?.accessToken);
            } else {
                connector = new MockConnector("Instagram");
            }
        } else if (post.platform === "LinkedIn") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("linkedin");
            const connDoc = await connRef.get();
            if (connDoc.exists) {
                const connData = connDoc.data();
                const { LinkedInConnector } = await import("./social/linkedin");
                connector = new LinkedInConnector(connData?.linkedinId, connData?.accessToken);
            } else {
                connector = new MockConnector("LinkedIn");
            }
        } else {
            connector = new MockConnector(post.platform);
        }

        // 2. Fetch Comments
        try {
            return await connector.getComments(post.platformPostId);
        } catch (error) {
            console.error(`Failed to fetch comments for post ${postId}`, error);
            return [];
        }
    }

    static async replyToComment(postId: string, userId: string, commentId: string, replyText: string): Promise<string> {
        console.log(`Posting reply to comment ${commentId} on post ${postId}`);

        const postRef = adminDb.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) throw new Error("Post not found");
        const post = postDoc.data();
        if (!post || !post.platformPostId) {
            throw new Error("Post is not published or has no platform ID");
        }

        if (post.platform === "Instagram") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("instagram");
            const connDoc = await connRef.get();
            if (!connDoc.exists) throw new Error("Instagram not connected");
            const connData = connDoc.data();
            const { InstagramConnector } = await import("./social/instagram");
            const connector = new InstagramConnector(connData?.igAccountId, connData?.accessToken);
            // For Instagram, commentId IS the platform comment ID from the Graph API
            return await connector.replyToComment(commentId, replyText);

        } else if (post.platform === "LinkedIn") {
            const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("linkedin");
            const connDoc = await connRef.get();
            if (!connDoc.exists) throw new Error("LinkedIn not connected");
            const connData = connDoc.data();
            const { LinkedInConnector } = await import("./social/linkedin");
            const connector = new LinkedInConnector(connData?.linkedinId, connData?.accessToken);
            return await connector.replyToComment(post.platformPostId, commentId, replyText);

        } else {
            // Mock mode: simulate posting
            console.log(`[MOCK-REPLY] Platform: ${post.platform}, Reply: "${replyText}"`);
            await new Promise(r => setTimeout(r, 800));
            return `mock-reply-${Date.now()}`;
        }
    }
}
