
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (error) {
        console.error("LinkedIn Auth Error:", error);
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=linkedin_auth_failed`);
    }

    if (!code) {
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=no_code`);
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    try {
        // 1. Exchange code for Access Token
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const accessToken = tokenData.access_token;

        // 2. Get User Profile (using OIDC endpoint)
        const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const profileData = await profileRes.json();

        const linkedinId = profileData.sub; // sub is the unique user ID in OIDC
        const name = profileData.name || `${profileData.given_name} ${profileData.family_name}`;

        // 3. Store in temporary collection keyed by state
        if (state) {
            await adminDb.collection("pending_connections").doc(state).set({
                platform: "linkedin",
                linkedinId,
                accessToken,
                name,
                createdAt: new Date().toISOString()
            });
        }

        return NextResponse.redirect(`${baseUrl}/dashboard/settings?state=${state}&li_success=true`);

    } catch (err: any) {
        console.error("LinkedIn Callback Error:", err.message);
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=${encodeURIComponent(err.message)}`);
    }
}
