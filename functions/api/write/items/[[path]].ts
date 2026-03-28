import { notFound, parseBucketPath } from "@/utils/bucket";
import {get_auth_status, check_permission} from "@/utils/auth";

const CSRF_HEADER = "x-requested-with";
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-requested-with, fd-thumbnail, x-amz-copy-source, cf-connecting-ip, x-forwarded-for",
  "Access-Control-Max-Age": "86400",
};

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/webm",
];

function sanitizePath(p: string): string {
  const decoded = decodeURIComponent(p);
  const parts = decoded.split('/').filter(part => part && part !== '.');
  return '/' + parts.join('/');
}

function validateContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  return ALLOWED_CONTENT_TYPES.some(t => contentType.toLowerCase().startsWith(t));
}

function safeError(message: string): string {
  if (message.includes("node_modules") || 
      message.includes("/home/") || 
      message.includes("\\") ||
      message.includes("C:") ||
      message.includes("env.") ||
      message.match(/\b[A-Z_]+_[A-Z_]+\b/)) {
    return "Internal server error";
  }
  return message.length > 100 ? message.substring(0, 100) + "..." : message;
}

function checkCSRF(request: Request): boolean {
  const header = request.headers.get(CSRF_HEADER);
  return header !== null && header.toLowerCase() === "xmlhttprequest";
}

export async function onRequestPostCreateMultipart(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  if (!checkCSRF(context.request)) {
    return new Response("CSRF validation failed", { status: 403 });
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  const request: Request = context.request;
  const contentType = request.headers.get("content-type");

  if (!validateContentType(contentType)) {
    return new Response("Invalid content type", { status: 400 });
  }

  const customMetadata: Record<string, string> = {};
  if (request.headers.has("fd-thumbnail"))
    customMetadata.thumbnail = request.headers.get("fd-thumbnail");

  try {
    const multipartUpload = await bucket.createMultipartUpload(path, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata,
    });

    return new Response(
      JSON.stringify({
        key: multipartUpload.key,
        uploadId: multipartUpload.uploadId,
      })
    );
  } catch (error: any) {
    return new Response(safeError(error.message), { status: 500 });
  }
}

export async function onRequestPostCompleteMultipart(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  const request: Request = context.request;
  const url = new URL(request.url);
  const uploadId = new URLSearchParams(url.search).get("uploadId");
  const multipartUpload = await bucket.resumeMultipartUpload(path, uploadId);

  const completeBody: { parts: Array<any> } = await request.json();

  try {
    const object = await multipartUpload.complete(completeBody.parts);
    return new Response(null, {
      headers: { etag: object.httpEtag },
    });
  } catch (error: any) {
    return new Response(safeError(error.message), { status: 400 });
  }
}

export async function onRequestPost(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  if (!checkCSRF(context.request)) {
    return new Response("CSRF validation failed", { status: 403 });
  }

  const url = new URL(context.request.url);
  const searchParams = new URLSearchParams(url.search);

  if (searchParams.has("uploads")) {
    return onRequestPostCreateMultipart(context);
  }

  if (searchParams.has("uploadId")) {
    return onRequestPostCompleteMultipart(context);
  }

  return new Response("Method not allowed", { status: 405 });
}

export async function onRequestPutMultipart(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  const request: Request = context.request;
  const url = new URL(request.url);

  const uploadId = new URLSearchParams(url.search).get("uploadId");
  const multipartUpload = await bucket.resumeMultipartUpload(path, uploadId);

  const partNumber = parseInt(
    new URLSearchParams(url.search).get("partNumber")
  );
  
  try {
    const uploadedPart = await multipartUpload.uploadPart(
      partNumber,
      request.body
    );

    return new Response(null, {
      headers: {
        "Content-Type": "application/json",
        etag: uploadedPart.etag,
      },
    });
  } catch (error: any) {
    return new Response(safeError(error.message), { status: 500 });
  }
}

export async function onRequestPut(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  if (!checkCSRF(context.request)) {
    return new Response("CSRF validation failed", { status: 403 });
  }

  const url = new URL(context.request.url);

  if (new URLSearchParams(url.search).has("uploadId")) {
    return onRequestPutMultipart(context);
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  if (!check_permission(context, path, "write")) {
    return new Response("Access denied", { status: 403 });
  }

  const request: Request = context.request;
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    return new Response("File too large", { status: 413 });
  }

  const contentType = request.headers.get("content-type");
  if (!validateContentType(contentType)) {
    return new Response("Invalid content type", { status: 400 });
  }

  let content = request.body;
  const customMetadata: Record<string, string> = {};

  if (request.headers.has("x-amz-copy-source")) {
    const sourceName = decodeURIComponent(
      request.headers.get("x-amz-copy-source")
    );
    const normalizedSource = sanitizePath(sourceName);
    if (!check_permission(context, normalizedSource, "read")) {
      return new Response("Access to copy source denied", { status: 403 });
    }
    const source = await bucket.get(sourceName);
    if (!source) {
      return new Response("Copy source not found", { status: 404 });
    }
    content = source.body;
    if (source.customMetadata.thumbnail)
      customMetadata.thumbnail = source.customMetadata.thumbnail;
  }

  if (request.headers.has("fd-thumbnail"))
    customMetadata.thumbnail = request.headers.get("fd-thumbnail");

  try {
    const obj = await bucket.put(path, content, { customMetadata });
    const { key, size, uploaded } = obj;
    return new Response(JSON.stringify({ key, size, uploaded }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(safeError(error.message), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  if (!get_auth_status(context)) {
    const header = new Headers();
    header.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
    for (const [k, v] of Object.entries(CORS_HEADERS)) header.set(k, v);
    return new Response("Unauthorized", {
      status: 401,
      headers: header,
    });
  }

  if (!checkCSRF(context.request)) {
    return new Response("CSRF validation failed", { status: 403 });
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  if (!check_permission(context, path, "write")) {
    return new Response("Access denied", { status: 403 });
  }

  try {
    if (path.endsWith('_$folder$')) {
      const folderPath = path.slice(0, -9);
      await deleteFolderRecursively(context, bucket, folderPath);
    }

    await bucket.delete(path);
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return new Response(safeError(error.message), { status: 500 });
  }
}

async function deleteFolderRecursively(context, bucket, folderPath) {
  const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
  let hasMore = true;
  let continuationToken = null;

  while (hasMore) {
    try {
      const list = await bucket.list({
        prefix: prefix,
        continuationToken: continuationToken
      });

      if (list.objects.length > 0) {
        for (const obj of list.objects) {
          if (!check_permission(context, obj.key, "write")) {
            throw new Error("Access denied to: " + obj.key);
          }
        }
        const deletePromises = list.objects.map(obj => bucket.delete(obj.key));
        await Promise.all(deletePromises);
      }

      const folderObjects = list.objects.filter(obj => obj.key.endsWith('_$folder$'));
      if (folderObjects.length > 0) {
        for (const folderObj of folderObjects) {
          const subFolderPath = folderObj.key.slice(0, -9);
          await deleteFolderRecursively(context, bucket, subFolderPath);
        }
      }

      hasMore = !!list.truncated;
      continuationToken = list.truncated ? list.cursor : null;
    } catch (error) {
      throw error;
    }
  }
}
