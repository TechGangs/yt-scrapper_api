const express = require('express');
const cors = require('express');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/info', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({
                error: '❌ Missing video ID',
                message: 'Please provide YouTube video ID'
            });
        }
        
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        const info = await ytdl.getInfo(videoUrl);
        
        res.json({
            success: true,
            info: {
                title: info.videoDetails.title,
                author: info.videoDetails.author.name,
                description: info.videoDetails.description,
                duration: info.videoDetails.lengthSeconds,
                views: info.videoDetails.viewCount,
                likes: info.videoDetails.likes,
                thumbnail: info.videoDetails.thumbnails[0].url,
                uploadDate: info.videoDetails.uploadDate,
                videoId: id
            }
        });
    } catch (error) {
        res.status(500).json({
            error: '❌ Info fetch failed',
            message: error.message
        });
    }
});

module.exports = app;
