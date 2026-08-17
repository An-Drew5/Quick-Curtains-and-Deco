import dotenv from 'dotenv';
dotenv.config();

import cloudinary from './lib/cloudinary.js';

(async () => {
  try {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const dataUri = 'data:image/png;base64,' + pngBase64;
    console.log('Uploading via SDK...');
    const res = await cloudinary.uploader.upload(dataUri, { folder: 'products/test-sdk' });
    console.log('SDK upload success:', res.secure_url, res.public_id);
  } catch (err) {
    console.error('SDK upload error:', err);
  }
})();
