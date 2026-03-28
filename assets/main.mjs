const THUMBNAIL_SIZE = 144;

export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^[.]/, '_')
    .substring(0, 255);
}

export async function generateThumbnail(file) {
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext("2d");

  if (file.type.startsWith("image/")) {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    ctx.drawImage(image, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  } else if (file.type === "video/mp4") {
    const video = await new Promise((resolve, reject) => {
      const vid = document.createElement("video");
      vid.muted = true;
      vid.src = URL.createObjectURL(file);
      vid.onloadedmetadata = () => {
        vid.currentTime = Math.min(1, vid.duration);
      };
      vid.onseeked = () => resolve(vid);
      vid.onerror = reject;
      setTimeout(() => reject(new Error("Video load timeout")), 2000);
      vid.play().then(() => vid.pause()).catch(reject);
    });
    ctx.drawImage(video, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }

  const thumbnailBlob = await new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob))
  );

  return thumbnailBlob;
}

export async function blobDigest(blob) {
  const digest = await crypto.subtle.digest("SHA-1", await blob.arrayBuffer());
  const digestArray = Array.from(new Uint8Array(digest));
  const digestHex = digestArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return digestHex;
}

export const SIZE_LIMIT = 100 * 1000 * 1000; // 100MB

export async function multipartUpload(key, file, options) {
  const headers = { ...options?.headers };
  headers["content-type"] = file.type;

  const uploadIdRes = await fetch(`/api/write/items/${key}?uploads`, {
    method: 'POST',
    body: '',
    headers
  });
  const { uploadId } = await uploadIdRes.json();
  
  const totalChunks = Math.ceil(file.size / SIZE_LIMIT);
  const uploadedParts = [];

  for (let i = 1; i <= totalChunks; i++) {
    const chunk = file.slice((i - 1) * SIZE_LIMIT, i * SIZE_LIMIT);
    const searchParams = new URLSearchParams({ partNumber: i, uploadId });
    
    const partRes = await fetch(`/api/write/items/${key}?${searchParams}`, {
      method: 'PUT',
      body: chunk,
      headers: { 'Content-Type': file.type }
    });
    
    const etag = partRes.headers.get('etag') || `"${i}"`;
    uploadedParts[i - 1] = { partNumber: i, etag };

    if (typeof options?.onUploadProgress === "function") {
      options.onUploadProgress({
        loaded: Math.min(i * SIZE_LIMIT, file.size),
        total: file.size,
      });
    }
  }

  const completeParams = new URLSearchParams({ uploadId });
  await fetch(`/api/write/items/${key}?${completeParams}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts: uploadedParts })
  });
}
