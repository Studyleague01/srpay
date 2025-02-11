const fs = require('fs');
const { Innertube } = require('youtubei.js');

async function checkVideos() {
    try {
        const youtube = await Innertube.create();
        const downloads = JSON.parse(fs.readFileSync('downloads.json', 'utf-8'));

        for (const item of downloads) {
            const videoId = item.videoId || item.id; // Adjust key based on your JSON structure
            try {
                const video = await youtube.getDetails(videoId);
                if (!video || video.playability_status.status !== 'OK') {
                    console.log(`❌ Video unavailable: ${videoId}`);
                } else {
                    console.log(`✅ Video available: ${videoId}`);
                }
            } catch (error) {
                console.log(`❌ Error checking video ${videoId}: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('Failed to initialize YouTube client:', error);
    }
}

checkVideos();
