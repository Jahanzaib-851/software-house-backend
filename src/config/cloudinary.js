import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// 1. Env variables ko load karna lazmi hai
dotenv.config();

// 2. Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 3. Debugging (Yeh terminal mein batayega ke keys mili ya nahi)
if (!process.env.CLOUDINARY_API_KEY) {
  console.log("❌ CLOUDINARY ERROR: Keys not found in .env file!");
} else {
  console.log("✅ CLOUDINARY CONFIG: Keys loaded for", process.env.CLOUDINARY_CLOUD_NAME);
}

export default cloudinary;