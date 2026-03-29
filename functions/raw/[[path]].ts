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

    const textExtensions = [
      '.txt', '.md', '.markdown', '.json', '.js', '.jsx', '.ts', '.tsx',
      '.xml', '.html', '.htm', '.css', '.scss', '.less', '.yaml', '.yml',
      '.toml', '.ini', '.cfg', '.conf', '.log', '.csv', '.tsv',
      '.sh', '.bash', '.zsh', '.fish', '.bat', '.cmd', '.ps1',
      '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp',
      '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.cljs',
      '.sql', '.graphql', '.gql', '.proto', '.avro',
      '.vue', '.svelte', '.astro',
      '.env', '.gitignore', '.dockerignore', '.editorconfig',
      '.htaccess', '.nginx', '.conf',
    ];

    const filename = path.split('/').pop()?.toLowerCase() || '';
    const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
    const isTextByExtension = textExtensions.includes(ext);

    if (object.httpMetadata) {
      if (object.httpMetadata.contentType) {
        let contentType = object.httpMetadata.contentType;
        if (!contentType.includes('charset')) {
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
          const needsCharset = textBasedTypes.some(type => contentType.startsWith(type));
          if (needsCharset || isTextByExtension) {
            contentType += '; charset=utf-8';
          }
        }
        headers.set("Content-Type", contentType);
      } else if (isTextByExtension) {
        headers.set("Content-Type", "text/plain; charset=utf-8");
      }
    } else if (isTextByExtension) {
      headers.set("Content-Type", "text/plain; charset=utf-8");
    }

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