const axios = require("axios");
const fs = require("fs");
const path = require("path");

const COBALT_API = "https://cobalt-api.kwiatekmiki.com";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Get the video ID from CLI argument
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
                url: `https://www.youtube.com/watch?v=${videoId}`,
                audioFormat: "opus",
                downloadMode: "audio",
                audioBitrate: "96",
                filenameStyle: "basic"
            },
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            }
        );

        const { status, url, filename } = response.data;
        if (status !== "redirect" && status !== "tunnel") {
            console.error("❌ Failed to retrieve audio URL.");
            process.exit(1);
        }

        console.log(`🎵 Downloading audio from: ${url}`);
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp4`);
        const writer = fs.createWriteStream(filePath);
        const audioResponse = await axios({ url, method: "GET", responseType: "stream" });

        audioResponse.data.pipe(writer);

        writer.on("finish", () => console.log(`✅ Downloaded: ${filePath}`));
        writer.on("error", (err) => console.error("❌ Error saving file:", err));
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
})();
