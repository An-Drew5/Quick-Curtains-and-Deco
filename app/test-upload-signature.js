import fs from 'fs/promises';
import path from 'path';

(async () => {
  try {
    const base = path.resolve('./');
    const serverBase = 'http://localhost:3001';

    // 1) Login to get admin_token cookie
    const loginRes = await fetch(`${serverBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'andrews.oppongx@gmail.com', password: 'testme1234' }),
    });

    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) throw new Error('No set-cookie header from login');
    const cookie = setCookie.split(';')[0]; // admin_token=...
    console.log('Got cookie:', cookie);

    // 2) Get signature
    const sigRes = await fetch(`${serverBase}/api/uploads/signature`, {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    const sigJson = await sigRes.json();
    if (!sigJson.success) throw new Error('Signature request failed: ' + JSON.stringify(sigJson));
    const { signature, timestamp, cloudName, apiKey, folder } = sigJson.data;
    console.log('Signature response:', sigJson.data);

    // 3) Prepare a tiny 1x1 PNG buffer (base64)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const buffer = Buffer.from(pngBase64, 'base64');

    // 4) Build multipart/form-data using global FormData and Blob
    const form = new FormData();
    const blob = new Blob([buffer], { type: 'image/png' });
    form.append('file', blob, 'test.png');
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', folder);

    // 5) Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('Uploading to Cloudinary:', uploadUrl);
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
    const uploadJson = await uploadRes.json();
    console.log('Cloudinary response:', uploadJson);

    // 6) Optionally save to backend (skipped by default)
    // If you want, uncomment below and set productId
    // const productId = '<product-id-here>';
    // const saveRes = await fetch(`${serverBase}/api/products/${productId}/media`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Cookie: cookie },
    //   body: JSON.stringify({ url: uploadJson.secure_url, type: 'image', sort_order: 0 }),
    // });
    // console.log('Save response:', await saveRes.json());

  } catch (err) {
    console.error('Test failed:', err);
  }
})();
