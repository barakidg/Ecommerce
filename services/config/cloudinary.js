import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadToCloudinary = async (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: `user-${crypto.randomUUID()}`,

            },
            (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve({ url: result.secure_url, public_id: result.public_id })
                }
            }
        )

        uploadStream.end(fileBuffer)
    })
}