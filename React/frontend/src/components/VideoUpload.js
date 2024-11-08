

import React, { useState } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player/lazy';

const VideoUpload = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [videoUrls, setVideoUrls] = useState(null);
    const [error, setError] = useState('');
    const [selectedQuality, setSelectedQuality] = useState('master'); // Default to 'master'

    const handleVideoChange = (e) => {
        setVideoFile(e.target.files[0]);
        setError(''); // Clear error when file selected
    };

    const handleUpload = async () => {
        if (!videoFile) {
            setError('Please select a video file.');
            return;
        }

        const formData = new FormData();
        formData.append('video', videoFile);

        setUploading(true);
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { videoUrls } = response.data;  // Extract video URLs from API response
            setVideoUrls(videoUrls); // Set the video URLs for the different resolutions
            setUploading(false);
        } catch (err) {
            setError('An error occurred while uploading the video.');
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Upload Video</h2>
                
                {error && (
                    <div className="mb-4 text-red-600 bg-red-100 border border-red-400 p-3 rounded">
                        {error}
                    </div>
                )}
                
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Select a video file</label>
                    <input
                        type="file"
                        onChange={handleVideoChange}
                        accept="video/*"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
                    />
                </div>
                
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className={`w-full py-2 px-4 font-medium rounded-lg text-white shadow ${
                        uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
                    } focus:outline-none focus:ring focus:ring-indigo-500`}
                >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                </button>

                {videoUrls && (
                    <>
                        <div className="mt-6">
                            <label className="block text-gray-700 font-medium mb-2">Select Video Quality</label>
                            <select
                                onChange={(e) => setSelectedQuality(e.target.value)}
                                value={selectedQuality}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
                            >
                                <option value="master">Master</option>
                                <option value="360p">360p</option>
                                <option value="480p">480p</option>
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transcoded Video Stream</h3>
                            <div className="rounded overflow-hidden shadow-lg">
                                <ReactPlayer
                                    url={videoUrls[selectedQuality]}
                                    controls
                                    playing
                                    width="100%"
                                    height="auto"
                                    config={{
                                        file: {
                                            attributes: {
                                                crossOrigin: "anonymous",
                                            },
                                            hlsOptions: {
                                                withCredentials: false,
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;
