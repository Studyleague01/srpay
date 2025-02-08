const axios = require("axios");
const fs = require("fs");
const https = require("https");
const path = require("path");

const videoId = process.argv[2];

if (!videoId) {
  console.error("❌ No video ID provided.");
  process.exit(1);
}

(async () => {
  try {
    console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);

    // Construct Invidious API URL
    const apiUrl = `https://companion.nikkosphere.com/latest_version?id=${videoId}&itag=140`;

    // Fetch the audio URL
    const response = await axios.get(apiUrl);
    if (!response.data || typeof response.data !== "string") {
      console.error("❌ Failed to get valid audio URL.");
      process.exit(1);
    }

    const audioUrl = response.data;
    console.log(`🎵 Downloading audio from: ${audioUrl}`);

    // Prepare file path
    const downloadsDir = path.join(__dirname, "..", "downloads");
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

    const filePath = path.join(downloadsDir, `${videoId}.m4a`);
    const file = fs.createWriteStream(filePath);

    // Use HTTPS module to download file
    https.get(audioUrl, (response) => {
      if (response.statusCode !== 200) {
        console.error(`❌ HTTP Error: ${response.statusCode}`);
        process.exit(1);
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log(`✅ Downloaded: ${filePath}`);
      });
    }).on("error", (err) => {
      console.error("❌ Error downloading file:", err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
