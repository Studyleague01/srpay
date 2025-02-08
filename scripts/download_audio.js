const axios = require("axios");
const fs = require("fs");
const https = require("https");
const path = require("path");
const util = require("util");

const VIDEO_ID = process.argv[2];
const API_URL = "https://cobalt-api.kwiatekmiki.com/";
const OUTPUT_DIR = "downloads";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchAudioUrl(videoId, attempt = 1) {
  try {
    console.log(`🔍 Attempt ${attempt}: Fetching audio URL for video ID: ${videoId}...`);

    const response = await axios.post(
      API_URL,
      {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        downloadMode: "audio",
        audioFormat: "mp3",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "tunnel" || response.data.status === "redirect") {
      return response.data.url; // Direct download URL
    } else {
      throw new Error(`Unexpected API response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`❌ Error fetching URL: ${error.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await util.promisify(setTimeout)(RETRY_DELAY);
      return fetchAudioUrl(videoId, attempt + 1);
    } else {
      console.error("❌ Max retries reached. Exiting.");
      process.exit(1);
    }
  }
}

async function downloadAudio(videoId, audioUrl) {
  const filePath = path.join(OUTPUT_DIR, `${videoId}.mp3`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  console.log(`🎵 Downloading audio from: ${audioUrl}`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(audioUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file. Status Code: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`✅ Downloaded: ${filePath}`);
          resolve();
        });
      })
      .on("error", (error) => {
        fs.unlink(filePath, () => {}); // Cleanup on error
        reject(error);
      });
  });
}

(async () => {
  const audioUrl = await fetchAudioUrl(VIDEO_ID);
  await downloadAudio(VIDEO_ID, audioUrl);
})();
