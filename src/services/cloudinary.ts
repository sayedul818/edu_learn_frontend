/**
 * Cloudinary image upload service
 * Handles uploading images to Cloudinary and returns the secure URL
 */

const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || "dbjpqg8e3";
const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "learnsmart_questions";

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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // Let Cloudinary detect resource type automatically, but force 'raw' for PDFs
    try {
      const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
      formData.append('resource_type', isPdf ? 'raw' : 'auto');
    } catch (e) {
      // ignore
    }
    // allow resource_type auto; Cloudinary will detect pdf/video/image
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
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
