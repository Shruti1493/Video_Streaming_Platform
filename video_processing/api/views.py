
import os
import uuid
import shutil
import boto3
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from subprocess import run, CalledProcessError
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage

# Initialize S3 client
s3_client = boto3.client('s3')

# Set up logging
logger = logging.getLogger(__name__)

class VideoUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        video_file = request.FILES.get('video')
        if not video_file:
            return Response({'error': 'No video file provided'}, status=status.HTTP_400_BAD_REQUEST)

        video_id = str(uuid.uuid4())
        video_path = f"{video_id}.mp4"

        try:
            # Save uploaded file to S3
            logger.info("Saving uploaded file to S3.")
            video_url = default_storage.save(video_path, video_file)
        except Exception as e:
            logger.error("Failed to save video to S3: %s", e)
            return Response({'error': 'Failed to save video to S3'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Define paths and resolutions
        output_folder_root = os.path.join('/tmp', video_id)
        resolutions = {
            '360p': '640:360',
            '480p': '854:480',
            '720p': '1280:720',
            '1080p': '1920:1080'
        }
        os.makedirs(output_folder_root, exist_ok=True)

        local_video_path = f"/tmp/{video_id}.mp4"

        try:
            # Step 1: Download video from S3 to local storage
            logger.info("Downloading video from S3 to local storage.")
            s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, video_url, local_video_path)
        except Exception as e:
            logger.error("Failed to download video from S3: %s", e)
            return Response({'error': 'Failed to download video from S3'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Step 2: Generate HLS files for each resolution
            for res, dimensions in resolutions.items():
                output_folder = os.path.join(output_folder_root, res)
                os.makedirs(output_folder, exist_ok=True)
                hls_path = os.path.join(output_folder, 'index.m3u8')

                command = [
                    'ffmpeg', '-i', local_video_path, '-vf', f"scale={dimensions}",
                    '-c:v', 'libx264', '-b:v', '1400k', '-c:a', 'aac', '-b:a', '128k', '-f', 'hls', '-hls_time', '15',
                    '-hls_playlist_type', 'vod', '-hls_segment_filename', os.path.join(output_folder, 'segment%03d.ts'), hls_path
                ]

                logger.info("Running FFmpeg command: %s", " ".join(command))
                run(command, check=True)

                # Step 3: Upload HLS files to S3
                for file_name in os.listdir(output_folder):
                    s3_client.upload_file(
                        os.path.join(output_folder, file_name),
                        settings.AWS_STORAGE_BUCKET_NAME,
                        f"{video_id}/{res}/{file_name}"
                    )
                logger.info("Uploaded HLS files for resolution %s to S3.", res)

            # Create and upload a master playlist
            master_playlist_path = os.path.join(output_folder_root, 'index.m3u8')
            with open(master_playlist_path, 'w') as f:
                f.write('#EXTM3U\n')
                for res in resolutions.keys():
                    f.write(f"#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION={resolutions[res]}\n")
                    f.write(f"{res}/index.m3u8\n")

            s3_client.upload_file(
                master_playlist_path,
                settings.AWS_STORAGE_BUCKET_NAME,
                f"{video_id}/index.m3u8"
            )

            # Construct video URLs
            video_urls = {
                'master': f"http://{settings.AWS_S3_CUSTOM_DOMAIN}/{video_id}/index.m3u8",
                **{res: f"http://{settings.AWS_S3_CUSTOM_DOMAIN}/{video_id}/{res}/index.m3u8" for res in resolutions}
            }

            logger.info("HLS conversion and upload successful for video ID %s.", video_id)
            return Response({
                'videoId': video_id,
                'videoUrls': video_urls
            }, status=status.HTTP_200_OK)

        except CalledProcessError as e:
            logger.error("HLS conversion failed with error: %s", e)
            shutil.rmtree(output_folder_root, ignore_errors=True)
            default_storage.delete(video_url)
            return Response({'error': 'HLS conversion failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            # Clean up local files
            if os.path.exists(local_video_path):
                os.remove(local_video_path)
            shutil.rmtree(output_folder_root, ignore_errors=True)
