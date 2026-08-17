import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Ensure .env is loaded when this module is imported (ESM imports are evaluated
// before top-level code in other modules). This guarantees the Cloudinary
// config uses the environment values.
dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary environment variables are not fully configured.");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export default cloudinary;
