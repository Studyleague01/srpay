const axios = require("axios");
const { exec } = require("child_process");
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
            console.error("❌ Failed to retrieve audio URL.");
            process.exit(1);
        }

        const downloadUrl = response.data.url;
        console.log(`🎵 Downloading audio from: ${downloadUrl}`);
        
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        exec(`curl -o ${filePath} "${downloadUrl}"`, (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Download error:", stderr);
                process.exit(1);
            }
            console.log(`✅ Downloaded: ${filePath}`);
            
            // Commit the file to the repo
            exec(`git add ${filePath} && git commit -m "Add downloaded audio for ${videoId}" && git push`, (gitErr, gitStdout, gitStderr) => {
                if (gitErr) {
                    console.error("❌ Git error:", gitStderr);
                } else {
                    console.log("✅ Audio file committed and pushed.");
                }
            });
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
})();
