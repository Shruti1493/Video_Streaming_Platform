// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';


// import React, { useState } from 'react';
// import axios from 'axios';

// const VideoUpload = () => {
//     const [videoFile, setVideoFile] = useState(null);
//     const [uploading, setUploading] = useState(false);
//     const [videoUrls, setVideoUrls] = useState(null);
//     const [error, setError] = useState('');

//     const handleVideoChange = (e) => {
//         setVideoFile(e.target.files[0]);
//     };

//     const handleUpload = async () => {
//         if (!videoFile) {
//             setError('Please select a video file.');
//             return;
//         }

//         const formData = new FormData();
//         formData.append('video', videoFile);

//         setUploading(true);
//         setError('');
//         try {
//             const response = await axios.post('http://localhost:2000/api/upload', formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });

//             const { videoId, videoUrls } = response.data;
//             setVideoUrls(videoUrls); // Set the video URLs for the different resolutions
//             setUploading(false);
//         } catch (err) {
//             setError('An error occurred while uploading the video.');
//             setUploading(false);
//         }
//     };

//     return (
//         <div className="upload-container">
//             <h2>Upload Video</h2>
//             <input type="file" onChange={handleVideoChange} accept="video/*" />
//             <button onClick={handleUpload} disabled={uploading}>
//                 {uploading ? 'Uploading...' : 'Upload Video'}
//             </button>

//             {error && <p className="error">{error}</p>}

//             {videoUrls && (
//                 <div className="video-streams">
//                     <h3>Transcoded Video Streams</h3>
//                     <div className="video-item">
//                         <h4>360p</h4>
//                         <video controls>
//                             <source src={videoUrls['360p']} type="application/x-mpegURL" />
//                             Your browser does not support HLS.
//                         </video>
//                     </div>
//                     <div className="video-item">
//                         <h4>480p</h4>
//                         <video controls>
//                             <source src={videoUrls['480p']} type="application/x-mpegURL" />
//                             Your browser does not support HLS.
//                         </video>
//                     </div>
//                     <div className="video-item">
//                         <h4>720p</h4>
//                         <video controls>
//                             <source src={videoUrls['720p']} type="application/x-mpegURL" />
//                             Your browser does not support HLS.
//                         </video>
//                     </div>
//                     <div className="video-item">
//                         <h4>1080p</h4>
//                         <video controls>
//                             <source src={videoUrls['1080p']} type="application/x-mpegURL" />
//                             Your browser does not support HLS.
//                         </video>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default VideoUpload;



// import React, { useState } from 'react';
// import ReactPlayer from 'react-player/lazy';

// const VideoPlayer = () => {
//   // Hardcoded video URLs for testing (replace with actual API response in production)
//   const videoUrls = {
//     master: "http://localhost:2000/hls-output/ec22cb63-bbf7-49f4-97c9-cf0b8e08e72e/index.m3u8",
//     "360p": "http://localhost:2000/hls-output/ec22cb63-bbf7-49f4-97c9-cf0b8e08e72e/360p/index.m3u8",
//     "480p": "http://localhost:2000/hls-output/ec22cb63-bbf7-49f4-97c9-cf0b8e08e72e/480p/index.m3u8",
//     "720p": "http://localhost:2000/hls-output/ec22cb63-bbf7-49f4-97c9-cf0b8e08e72e/720p/index.m3u8",
//     "1080p": "http://localhost:2000/hls-output/ec22cb63-bbf7-49f4-97c9-cf0b8e08e72e/1080p/index.m3u8"
//   };

//   // State to store selected video quality
//   const [quality, setQuality] = useState("master");

//   return (
//     <div>
//       <h1>Video Stream</h1>

//       {/* Quality Selection Buttons */}
//       <div>
//         <button onClick={() => setQuality("360p")}>360p</button>
//         <button onClick={() => setQuality("480p")}>480p</button>
//         <button onClick={() => setQuality("720p")}>720p</button>
//         <button onClick={() => setQuality("1080p")}>1080p</button>
//       </div>

    //   {/* Video Player */}
    //   <div>
    //     <ReactPlayer
    //       url={videoUrls[quality]} // Use the selected quality URL
    //       controls
    //       playing
    //       width="100%"
    //       height="auto"
    //       config={{
    //         file: {
    //           attributes: {
    //             crossOrigin: "anonymous",
    //           },
    //           hlsOptions: {
    //             // Ensure HLS support, configure if needed for your player setup
    //             withCredentials: false,
    //           }
    //         }
    //       }}
    //     />
    //   </div>
//     </div>
//   );
// };

// export default VideoPlayer;