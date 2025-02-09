const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const COBALT_API = "https://cobalt-api.kwiatekmiki.com";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const videoId = process.argv[2];

if (!videoId) {
    console.error("❌ Missing video ID. Usage: node download_audio.js <VIDEO_ID>");
    process.exit(1);
}

// Ensure Git is properly configured for GitHub Actions
try {
    execSync("git config --global user.name \"github-actions\"");
    console.log("✅ Git user configured successfully.");
} catch (error) {
    console.error("❌ Failed to configure Git user:", error.message);
}

(async () => {
    try {
        console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
        const response = await axios.post(
            `${COBALT_API}/`,
            {
                audioFormat: "mp3",
                audioQuality: "96kbps",
                downloadMode: "audio",
                filenameStyle: "basic",
                url: `https://www.youtube.com/watch?v=${videoId}`
            },
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status !== 200 || !response.data.url) {
            throw new Error(`Failed to retrieve a valid audio URL. Status: ${response.status}, Message: ${response.data.message || "Unknown error"}`);
        }

        const { url } = response.data;
        console.log(`🎵 Downloading audio from: ${url}`);
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        const writer = fs.createWriteStream(filePath);
        
        const audioResponse = await axios({ url, method: "GET", responseType: "stream" });
        audioResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        console.log(`✅ Downloaded: ${filePath}`);
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
})();
