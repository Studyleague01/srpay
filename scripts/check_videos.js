const fs = require('fs');
const path = require('path');
const { Client } = require('youtubei.js');

const filePath = path.join(__dirname, '../downloads.json');

async function checkVideos() {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        let downloads = JSON.parse(rawData);

        if (!Array.isArray(downloads)) {
            throw new Error('downloads.json must contain an array.');
        }

        const youtube = new Client();

        for (const entry of downloads) {
            if (entry.title && entry.title.match(/^[a-zA-Z0-9_-]{11}$/)) { // Check if it's a video ID
                console.log(`Fetching details for video ID: ${entry.title}`);
                
                try {
                    const video = await youtube.getVideo(entry.title);
                    entry.title = video.title; // Replace video ID with actual title
                    console.log(`Updated title: ${video.title}`);
                } catch (err) {
                    console.error(`Failed to fetch video info for ${entry.title}:`, err);
                }
            }
        }

        fs.writeFileSync(filePath, JSON.stringify(downloads, null, 2));
        console.log('downloads.json updated successfully.');
    } catch (error) {
        console.error('Error processing downloads.json:', error);
    }
}

checkVideos();
