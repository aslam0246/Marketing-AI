
const http = require('http');

async function checkRedirect() {
    console.log("Checking Instagram Auth Redirect...");
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/api/auth/instagram', (res) => {
            console.log("Status Code:", res.statusCode);
            console.log("Location:", res.headers.location);

            if (res.statusCode === 307 || res.statusCode === 302) {
                const url = new URL(res.headers.location);
                const appId = url.searchParams.get("client_id");
                const state = url.searchParams.get("state");
                const scope = url.searchParams.get("scope");

                console.log("--- REDIRECT DETAILS ---");
                console.log("Target Host:", url.host);
                console.log("App ID:", appId);
                console.log("State Prefix:", state ? "Found" : "NOT FOUND");
                console.log("Scopes:", scope);

                if (appId === "1365463521966115") {
                    console.log("SUCCESS: App ID matches!");
                } else {
                    console.log("FAILURE: App ID mismatch or missing.");
                }

                if (scope && scope.includes("instagram_content_publish")) {
                    console.log("SUCCESS: Publishing scope present!");
                } else {
                    console.log("FAILURE: Required scope missing.");
                }
            } else {
                console.log("FAILURE: Not a redirect.");
            }
            resolve();
        });
        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });
    });
}

checkRedirect().catch(console.error);
