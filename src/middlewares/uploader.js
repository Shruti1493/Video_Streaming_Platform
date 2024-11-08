import multer from 'multer'
import { v4 as uuid } from 'uuid'

// Configure Multer for file storage
const multerConfig = () => {
    // Set up disk storage for uploaded files
    const storage = multer.diskStorage({
        // Define the destination directory for uploaded files
        destination: function (req, file, cb) {
            cb(null, `./uploads/`)
        },
        // Define the filename for uploaded files
        filename: function (req, file, cb) {
            // Extract the file extension
            const fileExtension = file.originalname.split('.').pop()
            // Generate a unique filename using timestamp and UUID
            cb(null, `${Date.now()}-${uuid()}.${fileExtension}`)
        },
    })

    // Create and return a Multer instance with the configured storage
    const upload = multer({ storage })
    return upload
}

// Export the uploader middleware
export const uploader = (fieldName) => {
    // Return a middleware function
    return (req, res, next) => {
        // Get the Multer upload instance
        const upload = multerConfig()
        // Set up Multer to handle a single file upload for the specified field
        const isUploaded = upload.single(fieldName)

        // Execute the file upload
        isUploaded(req, res, function (error) {
            if (error) {
                // If there's an error, return a 400 status with an error message
                return res
                    .status(400)
                    .json({ error: error.message ?? 'File upload failed!' })
            }
            // If upload is successful, move to the next middleware
            next()
        })
    }
}
