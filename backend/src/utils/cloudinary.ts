import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import fs from 'fs';

// Configure Cloudinary using the credentials we set up in our .env file back in Phase 1
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Step 4.2: Cloudinary Utility
 * Uploads a local file to Cloudinary, applies optimizations, and deletes the local copy.
 * 
 * @param localFilePath The path to the temporary file saved by Multer (e.g., 'uploads/evidence-123.jpg')
 * @returns The public, secure URL of the uploaded image
 */
export const uploadToCloudinary = async (localFilePath: string): Promise<string> => {
  try {
    // 1. Upload to Cloudinary with built-in MeraWard-style optimizations
    const response = await cloudinary.uploader.upload(localFilePath, {
      // Keep everything organized in one folder
      folder: 'community-hero/issues',
      
      // Automatic format conversion (e.g., convert heavy PNGs to lightweight WebP)
      fetch_format: 'auto',
      
      // Automatic quality compression (looks identical to human eye, but 50% smaller size)
      quality: 'auto',
      
      // Resize massive 4K phone camera photos down to a reasonable max width
      width: 1200,
      crop: 'limit',
    });

    // 2. The upload was successful! We no longer need the local file, so delete it to save disk space.
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // 3. Return the public URL that we will eventually save in PostgreSQL
    return response.secure_url;

  } catch (error) {
    // IMPORTANT: If Cloudinary crashes (e.g., bad API key), we MUST still delete the local file,
    // otherwise our Node server's hard drive will slowly fill up with orphaned images until it crashes.
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    console.error('Cloudinary upload failed:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};
