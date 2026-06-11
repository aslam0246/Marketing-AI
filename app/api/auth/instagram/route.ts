
import { NextResponse } from "next/server";

export async function GET() {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`);

    // Generate a simple state
    const state = Math.random().toString(36).substring(7);

    // Scopes needed for Instagram Business publishing + comment management
    // See: https://developers.facebook.com/docs/instagram-api/getting-started
    const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_comments",
        "instagram_manage_insights",
        "pages_show_list",
        "pages_read_engagement",
        "business_management"
    ].join(",");

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&response_type=code`;

    return NextResponse.redirect(authUrl);
}
