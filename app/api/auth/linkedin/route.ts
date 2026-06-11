import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

    // LinkedIn Scopes: w_member_social (Post content), openid (Authentication), profile (User Details)
    const scopes = encodeURIComponent("w_member_social openid profile email");
    const state = Math.random().toString(36).substring(2, 15);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}`;

    return NextResponse.redirect(authUrl);
}
