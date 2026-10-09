import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { diskStorage } from 'multer';
import * as fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getCloudinaryStorage = (folder: string) => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: `lightkids/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      } as any,
    });
  }
  
  // Fallback to local storage if Cloudinary is not configured
  const uploadPath = `./uploads/${folder}`;
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  return diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
};
