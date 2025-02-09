const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const util = require('util');
const execPromise = util.promisify(exec);

const API_URL = "https://backendmix-emergeny.vercel.app/d";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

async function execWithLog(command) {
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(`Command output: ${stdout}`);
        if (stderr) console.warn(`Command stderr: ${stderr}`);
        return { stdout, stderr };
    } catch (error) {
        console.error(`Failed executing command: ${command}`);
        console.error(`Error: ${error.message}`);
        throw error;
    }
}

async function checkGitStatus() {
    try {
        const { stdout } = await execWithLog('git status');
        console.log('Git status check:', stdout);
    } catch (error) {
        console.error('Failed to check git status:', error.message);
        throw error;
    }
}

async function setupGit() {
    try {
        await execWithLog('git config --global user.name "github-actions"');
        await execWithLog('git config --global user.email "github-actions@github.com"');
        console.log('✅ Git configuration set successfully');
    } catch (error) {
        console.error('Failed to configure git:', error.message);
        throw error;
    }
}

async function downloadAudio(videoId) {
    try {
        // Setup Git configuration
        await setupGit();
        
        // Ensure the downloads directory exists
        try {
            await fs.access(DOWNLOAD_DIR);
        } catch {
            console.log('Creating downloads directory...');
            await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
        }

        // Check initial git status
        await checkGitStatus();

        console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
        const response = await axios.get(`${API_URL}/${videoId}`);
        
        if (!response.data?.url) {
            throw new Error("Failed to retrieve audio URL from API response");
        }

        const downloadUrl = response.data.url;
        console.log(`🎵 Downloading audio from: ${downloadUrl}`);
        
        const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
        
        // Download the file
        await execWithLog(`curl -o "${filePath}" "${downloadUrl}"`);
        console.log(`✅ Downloaded: ${filePath}`);
        
        // Verify file exists
        await fs.access(filePath);
        console.log('✅ File verified at:', filePath);

        // Git operations with verification
        console.log('Starting git operations...');
        
        // Add the file
        await execWithLog(`git add "${filePath}"`);
        console.log('✅ File added to git');
        
        // Check git status again
        await checkGitStatus();
        
        // Commit the file
        try {
            await execWithLog(`git commit -m "Add downloaded audio for ${videoId}"`);
            console.log('✅ Changes committed');
        } catch (commitError) {
            console.error('Commit failed:', commitError.message);
            // Check if there are actually changes to commit
            const { stdout: statusOutput } = await execWithLog('git status --porcelain');
            if (!statusOutput) {
                console.log('No changes to commit. Continuing...');
            } else {
                throw commitError;
            }
        }
        
        // Push changes
        try {
            await execWithLog('git push');
            console.log('✅ Changes pushed successfully');
        } catch (pushError) {
            console.error('Push failed:', pushError.message);
            throw pushError;
        }

        return filePath;
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stdout) console.error("stdout:", error.stdout);
        if (error.stderr) console.error("stderr:", error.stderr);
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
