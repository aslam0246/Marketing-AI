
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
        console.error("Instagram Auth Error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=auth_failed`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=no_code`);
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

    try {
        // 1. Exchange code for short-lived token
        const tokenRes = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();

        if (tokenData.error) throw new Error(tokenData.error.message);

        const shortToken = tokenData.access_token;

        // 2. Exchange for long-lived token (60 days)
        const longTokenRes = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
        );
        const longTokenData = await longTokenRes.json();
        const longToken = longTokenData.access_token;

        // 3. Get User's Pages and their Instagram Business Accounts
        const pagesRes = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`
        );
        const pagesData = await pagesRes.json();

        let igAccountId = null;
        let pageName = null;

        for (const page of pagesData.data) {
            const igRes = await fetch(
                `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account,name&access_token=${longToken}`
            );
            const igData = await igRes.json();
            if (igData.instagram_business_account) {
                igAccountId = igData.instagram_business_account.id;
                pageName = igData.name || page.name;
                break;
            }
        }

        if (!igAccountId) {
            throw new Error("No Instagram Business account found linked to your Facebook pages.");
        }

        // 4. Store in temporary collection keyed by state
        if (state) {
            await adminDb.collection("pending_connections").doc(state).set({
                platform: "instagram",
                igAccountId,
                accessToken: longToken,
                pageName,
                createdAt: new Date().toISOString()
            });
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?state=${state}&ig_success=true`);

    } catch (err: any) {
        console.error("Callback Error:", err.message);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=${encodeURIComponent(err.message)}`);
    }
}
