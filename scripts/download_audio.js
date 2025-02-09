const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_URL = "https://backendmix-emergeny.vercel.app/d";
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
        const response = await axios.get(`${API_URL}/${videoId}`);
        
        if (!response.data || !response.data.url) {
            console.error("❌ Failed to retrieve audio URL from API.");
            process.exit(1);
        }

        const downloadUrl = response.data.url;
        console.log(`🎵 Checking availability of: ${downloadUrl}`);

        // Verify if the URL is accessible
        try {
            await axios.head(downloadUrl);
        } catch (err) {
            console.error(`❌ Download URL is not accessible (HTTP ${err.response?.status || "Unknown"})`);
            process.exit(1);
        }

        console.log(`🎵 Downloading audio from: ${downloadUrl}`);
        
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        const writer = fs.createWriteStream(filePath);
        const audioResponse = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });

        audioResponse.data.pipe(writer);

        writer.on("finish", async () => {
            console.log(`✅ Downloaded: ${filePath}`);
            
            // Commit the file to the repo
            const { exec } = require("child_process");
            exec(`git add ${filePath} && git commit -m "Add downloaded audio for ${videoId}" && git push`, (err, stdout, stderr) => {
                if (err) {
                    console.error("❌ Git error:", stderr);
                } else {
                    console.log("✅ Audio file committed and pushed.");
                }
            });
        });

        writer.on("error", (err) => console.error("❌ Error saving file:", err));
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
})();
