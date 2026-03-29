import { notFound, parseBucketPath } from "@/utils/bucket";
import { get_read_permission } from "@/utils/auth";

export async function onRequestGet(context) {
  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  // 检查读取权限
  if (!get_read_permission(context, path)) {
      const headers = new Headers();
      headers.set("WWW-Authenticate", 'Basic realm="需要登录"');
      return new Response("需要认证才能下载文件", {
          status: 401,
          headers: headers,
      });
  }

  // 尝试从 R2 桶直接读取（更安全，支持流量控制）
  try {
    const object = await bucket.get(path);
    if (!object) return notFound();

    const headers = new Headers();
    if (object.httpMetadata) {
      if (object.httpMetadata.contentType) {
        let contentType = object.httpMetadata.contentType;
        // Add charset for text-based types to ensure proper encoding for Chinese characters
        // Only add charset if not already present in the Content-Type header
        if (!contentType.includes('charset')) {
          // List of MIME types that may contain text content and need charset
          const textBasedTypes = [
            'text/',
            'application/json',
            'application/javascript',
            'application/xml',
            'application/xhtml+xml',
            'application/x-javascript',
            'application/typescript',
            'application/x-typescript',
            'application/markdown',
          ];
          // Check if the content type starts with any of the text-based types
          const needsCharset = textBasedTypes.some(type => contentType.startsWith(type));
          if (needsCharset) {
            contentType += '; charset=utf-8';
          }
        }
        headers.set("Content-Type", contentType);
      }
    }

    // Set Content-Disposition with RFC 5987 encoding for Chinese filenames
    // This ensures proper filename display in downloads, especially for non-ASCII characters
    const filename = path.split('/').pop() || 'download';
    const encodedFilename = encodeURIComponent(filename);
    headers.set("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

    // 缩略图长期缓存
    if (path.startsWith("_$flaredrive$/thumbnails/")) {
      headers.set("Cache-Control", "max-age=31536000");
    }

    return new Response(object.body, {
      headers: headers,
    });
  } catch (error) {
    // 如果直接读取失败，回退到公共URL方式
    const url = context.env["PUBURL"] + "/" + context.request.url.split("/raw/")[1];
    const response = await fetch(url);

    const headers = new Headers(response.headers);
    if (path.startsWith("_$flaredrive$/thumbnails/")) {
      headers.set("Cache-Control", "max-age=31536000");
    }

    return new Response(response.body, {
      headers: headers,
      status: response.status,
      statusText: response.statusText
    });
  }
}