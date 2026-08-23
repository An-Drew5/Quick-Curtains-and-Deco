import cloudinary from "../lib/cloudinary.js";

export function signature(req, res, next) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      return res
        .status(500)
        .json({
          success: false,
          error: "Cloudinary not configured on server.",
        });
    }

    // timestamp used for signature
    const timestamp = Math.floor(Date.now() / 1000);

    // folder where uploads should go
    const folder = "products";

    // Only sign the exact fields the frontend will send (timestamp + folder).
    // Including extra fields (e.g. allowed_formats) in the signed payload
    // will produce a signature that doesn't match the client's upload request.
    const paramsToSign = {
      timestamp,
      folder,
    };

    // Use sign_request() for proper upload signatures (designed for upload widgets)
    // It uses the api_secret from cloudinary.config() and returns a complete signed object
    const signedParams = cloudinary.utils.sign_request(paramsToSign);

    res.json({
      success: true,
      data: {
        signature: signedParams.signature,
        timestamp: signedParams.timestamp,
        cloudName,
        apiKey,
        folder,
      },
    });
  } catch (error) {
    next(error);
  }
}
