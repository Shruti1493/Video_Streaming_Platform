
import express from 'express'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import { uploader } from './middlewares/uploader.js'
import fs from 'fs' // NEW
// exec - Needed to execute command in shell
import { exec } from 'child_process' // NEW
import path from 'path' // NEW

// Set up port, defaulting to 2000 if not specified in environment
const port = process.env.PORT || 2000

// Initialize Express application
const app = express()

// Enable CORS for all routes
app.use(cors())

// Parse JSON and URL-encoded bodies
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Serve HLS output files statically (NEW)
app.use('/hls-output', express.static(path.join(process.cwd(), 'hls-output'))) 

// Define route for video upload
app.post('/api/upload', uploader('video'), (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('Video not sent!')
    }

    // Generate a unique ID for the video
    const videoId = uuid()
    const uploadedVideoPath = req.file.path

    // Define output folder structure (NEW)
    const outputFolderRootPath = `./hls-output/${videoId}`
    const outputFolderSubDirectoryPath = {
        '360p': `${outputFolderRootPath}/360p`,
        '480p': `${outputFolderRootPath}/480p`,
        '720p': `${outputFolderRootPath}/720p`,
        '1080p': `${outputFolderRootPath}/1080p`,
    }

    // Create directories if they don't exist, for storing output video (NEW)
    if (!fs.existsSync(outputFolderRootPath)) {
        // ./hls-output/video-id/360p/
        fs.mkdirSync(outputFolderSubDirectoryPath['360p'], { recursive: true })
        // ./hls-output/video-id/480p/
        fs.mkdirSync(outputFolderSubDirectoryPath['480p'], { recursive: true }) 
        // ./hls-output/video-id/720p/
        fs.mkdirSync(outputFolderSubDirectoryPath['720p'], { recursive: true }) 
        // ./hls-output/video-id/1080p/
        fs.mkdirSync(outputFolderSubDirectoryPath['1080p'], { recursive: true })
    }

    // Define FFmpeg commands for different resolutions (NEW)
    const ffmpegCommands = [
        // 360p resolution
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=640:h=360" -c:v libx264 -b:v 800k -c:a aac -b:a 96k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['360p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['360p']}/index.m3u8"`,
        // 480p resolution
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=854:h=480" -c:v libx264 -b:v 1400k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['480p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['480p']}/index.m3u8"`,
        // 720p resolution
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1280:h=720" -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['720p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['720p']}/index.m3u8"`,
        // 1080p resolution
        `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1920:h=1080" -c:v libx264 -b:v 5000k -c:a aac -b:a 192k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['1080p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['1080p']}/index.m3u8"`,
    ]

    // Function to execute a single FFmpeg command (NEW)
    const executeCommand = (command)=> {
        return new Promise((resolve, reject) => {
            // Execute ffmpeg command in shell
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }

    // Execute all FFmpeg commands concurrently (NEW)
    Promise.all(ffmpegCommands.map((cmd) => executeCommand(cmd)))
        .then(() => {
            // Create master playlist
            const masterPlaylistPath = `${outputFolderRootPath}/index.m3u8` // ./hls-output/video-id/index.m3u8
            const masterPlaylistContent = `
                #EXTM3U
                #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
                360p/index.m3u8
                #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
                480p/index.m3u8
                #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
                720p/index.m3u8
                #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
                1080p/index.m3u8
            `.trim() 

            fs.writeFileSync(masterPlaylistPath, masterPlaylistContent) // write the above content in the index.m3u8 file

            // Creating URLs for accessing the video streams
            const videoUrls = {
                master: `http://localhost:${port}/hls-output/${videoId}/index.m3u8`,
                '360p': `http://localhost:${port}/hls-output/${videoId}/360p/index.m3u8`,
                '480p': `http://localhost:${port}/hls-output/${videoId}/480p/index.m3u8`,
                '720p': `http://localhost:${port}/hls-output/${videoId}/720p/index.m3u8`,
                '1080p': `http://localhost:${port}/hls-output/${videoId}/1080p/index.m3u8`,
            }

            // Send success response with video URLs
            return res.status(200).json({ videoId, videoUrls })
        })
        .catch((error) => {
            console.error(`HLS conversion error: ${error}`)

            // Clean up: Delete the uploaded video file
            try {
                fs.unlinkSync(uploadedVideoPath)
            } catch (err) {
                console.error(`Failed to delete original video file: ${err}`)
            }

            // Clean up: Delete the generated HLS files and folders
            try {
                fs.unlinkSync(outputFolderRootPath)
            } catch (err) {
                console.error(`Failed to delete generated HLS files: ${err}`)
            }

            // Send error response
            return res.status(500).send('HLS conversion failed!')
        })
})

// Start the server
app.listen(port, () => {
    console.log(`Server is running at ${port}`)
})