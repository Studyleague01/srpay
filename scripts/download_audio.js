const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const util = require('util');
const execPromise = util.promisify(exec);

const API_URL = "https://backendmix-emergeny.vercel.app/d";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

async function configureGit() {
    try {
        await execPromise('git config --global user.name "GitHub Actions Bot"');
        await execPromise('git config --global user.email "actions@github.com"');
        console.log('✅ Git configuration set successfully');
    } catch (error) {
        throw new Error(`Failed to configure Git: ${error.message}`);
    }
}

async function downloadAudio(videoId) {
    try {
        // Ensure the downloads directory exists
        try {
            await fs.access(DOWNLOAD_DIR);
        } catch {
            await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
        }

        // Configure Git before any operations
        await configureGit();

        console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
        const response = await axios.get(`${API_URL}/${videoId}`);
        
        if (!response.data?.url) {
            throw new Error("Failed to retrieve audio URL from API response");
        }

        const downloadUrl = response.data.url;
        console.log(`🎵 Downloading audio from: ${downloadUrl}`);
        
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        
        // Download the file using curl
        await execPromise(`curl -o "${filePath}" "${downloadUrl}"`);
        console.log(`✅ Downloaded: ${filePath}`);
        
        // Commit and push the file
        const gitCommands = [
            `git add "${filePath}"`,
            `git commit -m "Add downloaded audio for ${videoId}"`,
            'git push'
        ];
        
        for (const cmd of gitCommands) {
            await execPromise(cmd);
        }
        
        console.log("✅ Audio file committed and pushed successfully");
        return filePath;
        
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
