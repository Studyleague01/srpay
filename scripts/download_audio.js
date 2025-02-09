const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const API_URL = "https://backendmix-emergeny.vercel.app/d";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

async function downloadAudio(videoId) {
    try {
        // Ensure the downloads directory exists
        try {
            await fs.access(DOWNLOAD_DIR);
        } catch {
            await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
        }

        console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
        const response = await axios.get(`${API_URL}/${videoId}`);
        
        if (!response.data?.url) {
            throw new Error("Failed to retrieve audio URL from API response");
        }

        const downloadUrl = response.data.url;
        console.log(`🎵 Downloading audio from: ${downloadUrl}`);
        
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        
        return new Promise((resolve, reject) => {
            exec(`curl -o "${filePath}" "${downloadUrl}"`, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(`Download error: ${stderr}`));
                    return;
                }
                
                console.log(`✅ Downloaded: ${filePath}`);
                
                // Commit the file to the repo
                exec(
                    `git add "${filePath}" && git commit -m "Add downloaded audio for ${videoId}" && git push`,
                    (gitErr, gitStdout, gitStderr) => {
                        if (gitErr) {
                            console.error("❌ Git error:", gitStderr);
                            reject(gitErr);
                            return;
                        }
                        console.log("✅ Audio file committed and pushed.");
                        resolve(filePath);
                    }
                );
            });
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

// Get the video ID from CLI argument
const videoId = process.argv[2];
if (!videoId) {
    console.error("❌ Missing video ID. Usage: node download_audio.js <VIDEO_ID>");
    process.exit(1);
}

downloadAudio(videoId).catch(error => {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
});
