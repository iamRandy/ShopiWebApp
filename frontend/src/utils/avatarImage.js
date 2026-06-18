export const MAX_AVATAR_SOURCE_BYTES = 2 * 1024 * 1024;

export function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

export async function readAvatarFile(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_AVATAR_SOURCE_BYTES) {
    throw new Error("Image must be under 2MB.");
  }

  const dataUrl = await resizeImageToDataUrl(file, 256);
  if (estimateDataUrlBytes(dataUrl) > 512 * 1024) {
    throw new Error("Processed image is too large. Try a smaller photo.");
  }
  return dataUrl;
}

function resizeImageToDataUrl(file, maxSize) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not process image."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };

    image.src = url;
  });
}
