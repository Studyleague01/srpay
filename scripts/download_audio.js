const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

        const { status, url } = response.data;
        if (!url || (status !== "redirect" && status !== "tunnel")) {
            throw new Error("Failed to retrieve a valid audio URL.");
        }

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
