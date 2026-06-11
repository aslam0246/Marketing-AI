const https = require('https');

const apiKey = "AIzaSyBeJVA7R4L6VV2VPOvVDxxlnGruAc7-VJ0";

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
};

console.log(`Listing models...`);

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const data = JSON.parse(body);
            if (data.models) {
                console.log("Available Models (First 5):");
                data.models.slice(0, 5).forEach(m => console.log(m.name));
            } else {
                console.log("No models found.");
            }
        } catch (e) {
            console.log("Error parsing JSON:", e.message);
            console.log("Raw Body:", body);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end(); // No body for GET
