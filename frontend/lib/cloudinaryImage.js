const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

export const CLOUDINARY_IMAGE_WIDTHS = {
  thumbnail: 400,
  detail: 1200,
};

function getQualityTransformation(quality) {
  if (typeof quality === "number" && Number.isFinite(quality)) {
    const normalized = Math.min(100, Math.max(1, Math.round(quality)));
    return `q_${normalized}`;
  }

  if (typeof quality === "string" && quality.trim()) {
    const value = quality.trim();
    return value.startsWith("q_") ? value : `q_${value}`;
  }

  return "q_auto";
}

export function cloudinaryImageUrl(rawUrl, options = {}) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return rawUrl;
  }

  if (!rawUrl.includes("res.cloudinary.com")) {
    return rawUrl;
  }

  const uploadIndex = rawUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) {
    return rawUrl;
  }

  const insertAt = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const remainder = rawUrl.slice(insertAt);
  const firstSegment = remainder.split("/")[0] || "";

  // Avoid stacking duplicate transforms if the URL is already transformed.
  if (firstSegment && !/^v\d+$/i.test(firstSegment)) {
    return rawUrl;
  }

  const width = Number(options.width ?? CLOUDINARY_IMAGE_WIDTHS.thumbnail);
  const qualityTransform = getQualityTransformation(options.quality);
  const transforms = ["f_auto", qualityTransform];

  if (Number.isFinite(width) && width > 0) {
    transforms.push(`c_limit,w_${Math.round(width)}`);
  }

  return `${rawUrl.slice(0, insertAt)}${transforms.join(",")}/${remainder}`;
}

export default cloudinaryImageUrl;