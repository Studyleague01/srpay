const axios = require("axios");
const fs = require("fs");
const path = require("path");

const COBALT_API = "https://cobalt-api.kwiatekmiki.com";
const CHANNEL_API = "https://backendmix-emergeny.vercel.app/list";
const DOWNLOAD_DIR = path.join(__dirname, "..", "downloads");

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Get the channel ID from CLI argument
const channelId = process.argv[2];

if (!channelId) {
    console.error("❌ Missing channel ID. Usage: node download_audio.js <CHANNEL_ID>");
    process.exit(1);
}

(async () => {
    try {
        console.log(`🔍 Fetching videos for channel ID: ${channelId}...`);
        const response = await axios.get(`${CHANNEL_API}/${channelId}`);

        if (!response.data || !response.data.videos || response.data.videos.length === 0) {
            console.error("❌ No videos found for this channel.");
            process.exit(1);
        }

        const videos = response.data.videos;
        console.log(`📹 Found ${videos.length} videos. Downloading audio...`);

        for (const video of videos) {
            const videoId = video.id;
            const videoTitle = video.title;

            console.log(`🎵 Downloading audio for: ${videoTitle} (ID: ${videoId})...`);

            try {
                // Get the download URL from Cobalt API
                const downloadResponse = await axios.post(
                    `${COBALT_API}/`,
                    {
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        audioFormat: "mp3",
                        downloadMode: "audio"
                    },
                    {
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    }
                );

                const { status, url } = downloadResponse.data;
                if (status !== "redirect" && status !== "tunnel") {
                    console.error(`❌ Failed to retrieve audio URL for ${videoTitle}`);
                    continue;
                }

                // Download the audio file
                const filePath = path.join(DOWNLOAD_DIR, `${videoId}.mp3`);
                const writer = fs.createWriteStream(filePath);
                const audioResponse = await axios({ url, method: "GET", responseType: "stream" });

                audioResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", resolve);
                    writer.on("error", reject);
                });

                console.log(`✅ Downloaded: ${filePath}`);
            } catch (err) {
                console.error(`❌ Error downloading ${videoTitle}:`, err.message);
            }
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
})();
