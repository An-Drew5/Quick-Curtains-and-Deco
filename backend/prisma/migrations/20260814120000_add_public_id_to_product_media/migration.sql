-- Add public_id column to product_media for storing Cloudinary public_id
ALTER TABLE product_media
ADD COLUMN public_id TEXT;
