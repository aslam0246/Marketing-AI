
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, ...values] = line.split('=');
        if (key) {
            let val = values.join('=');
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (!process.env[key.trim()]) process.env[key.trim()] = val;
        }
    });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function listModels() {
    console.log("🔍 Listing Gemini Models...");
    if (!GEMINI_API_KEY) {
        console.error("❌ Key missing");
        return;
    }

    try {
        const response = await fetch(`${URL}?key=${GEMINI_API_KEY}`);
        if (!response.ok) {
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }
        const data = await response.json();
        const outputPath = path.resolve(process.cwd(), 'models.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`✅ Saved models to ${outputPath}`);

    } catch (e) {
        console.error(e);
    }
}

listModels();
