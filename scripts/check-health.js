
async function checkHealth() {
    const pages = [
        "http://localhost:3000",
        "http://localhost:3000/dashboard/posts",
        "http://localhost:3000/api/posts" // Check API too
    ];

    console.log("Checking server health...");

    for (const url of pages) {
        try {
            const start = Date.now();
            const res = await fetch(url);
            const duration = Date.now() - start;
            console.log(`[${res.status}] ${url} - ${duration}ms`);

            if (!res.ok) {
                console.log(`Error body for ${url}:`, await res.text().catch(e => "Could not read body"));
            }
        } catch (error) {
            console.error(`FAILED to connect to ${url}:`, error.message);
        }
    }
}

checkHealth();
