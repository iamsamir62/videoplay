import { v2 as cloudinary } from "cloudinary"
import { log } from "console";
import fs from "fs"
import { ApiError } from "./ApiError.js";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API__SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("file is uploaded on cloudinary ", response.url);
        // Delete the file safely
        fs.unlink(localFilePath, err => {
            if (err) {
                console.error('Failed to delete local image:', err);
            }
        });
        return response;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        fs.unlink(localFilePath, err => {
            if (err) {
                console.error('Failed to delete local image:', err);
            }
        });
        return null;
    }
};

const deleteFromCloudinary = async (filePath) => {
    try {
        if (!filePath) null;

        await cloudinary.uploader.destroy(
            filePath.split("/").pop().split(".")[0],
            (error) => {
                if (error) {
                    throw new ApiError(404, error, "Image not found");
                }
            }
        );
    } catch (error) {
        console.log("error from cloudinay :", error);
    }
};



export { uploadOnCloudinary, deleteFromCloudinary }