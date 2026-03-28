import { notFound, parseBucketPath } from "@/utils/bucket";
import { get_read_permission } from "@/utils/auth";

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

export async function onRequestGet(context) {
  try {
    const [bucket, path] = parseBucketPath(context);
    const prefix = path && `${path}/`;
    if (!bucket || prefix.startsWith("_$flaredrive$/")) return notFound();

    if (!get_read_permission(context, prefix || "")) {
        const headers = new Headers();
        headers.set("WWW-Authenticate", 'Basic realm="Unauthorized"');
        return new Response("Authentication required", {
            status: 401,
            headers: headers,
        });
    }

    const objList = await bucket.list({
      prefix,
      delimiter: "/",
      include: ["httpMetadata", "customMetadata"],
    });
    const objKeys = objList.objects
      .filter((obj) => !obj.key.endsWith("/_$folder$"))
      .map((obj) => {
        const { key, size, uploaded, httpMetadata, customMetadata } = obj;
        return { key, size, uploaded, httpMetadata, customMetadata };
      });

    let folders = objList.delimitedPrefixes;
    if (!path)
      folders = folders.filter((folder) => folder !== "_$flaredrive$/");

    return new Response(JSON.stringify({ value: objKeys, folders }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(safeError(e.message), { status: 500 });
  }
}
