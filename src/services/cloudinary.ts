/**
 * Cloudinary image upload service
 * Handles uploading images to Cloudinary and returns the secure URL
 */

const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || "dbjpqg8e3";
const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "learnsmart_questions";

const IMAGE_COMPRESS_THRESHOLD_BYTES = 300 * 1024;
const IMAGE_MAX_DIMENSION = 1920;

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = (error) => {
    URL.revokeObjectURL(url);
    reject(error);
  };
  image.src = url;
});

const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.size <= IMAGE_COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82);
    });

    if (!blob || blob.size >= file.size) return file;

    const nextName = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([blob], `${nextName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Return the secure URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

/**
 * Alternative method using base64 if needed
 * (Less recommended for large files)
 */
export const uploadBase64ToCloudinary = async (base64String: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: JSON.stringify({
          file: base64String,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

/**
 * Upload any file (image/pdf/etc) to Cloudinary using unsigned preset.
 * Returns the secure URL returned by Cloudinary.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  try {
    const fileToUpload = await compressImageIfNeeded(file);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const isImage = fileToUpload.type.startsWith('image/');
    const isVideo = fileToUpload.type.startsWith('video/');
    const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    const data = await response.json();
    return data.secure_url || data.url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw err;
  }
};
