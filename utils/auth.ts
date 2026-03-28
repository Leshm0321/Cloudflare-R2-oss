const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function normalizePath(p: string): string {
    const decoded = decodeURIComponent(p);
    const parts = decoded.split('/').filter(part => part && part !== '.');
    return '/' + parts.join('/');
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    record.count++;
    return true;
}

export function check_permission(context, path, operation = 'write') {
    if (path.startsWith("_$flaredrive$/thumbnails/")) {
        return true;
    }

    if (path.startsWith("_$flaredrive$/")) {
        return false;
    }

    var headers = new Headers(context.request.headers);
    var authAccount = null;

    if (headers.get('Authorization')) {
        const authHeader = headers.get('Authorization');
        const basicMatch = authHeader.match(/^Basic\s+(.+)$/);

        if (basicMatch) {
            try {
                const Authorization = basicMatch[1];
                const account = atob(Authorization);
                if (context.env[account]) {
                    authAccount = account;
                }
            } catch (error) {
                console.error('Base64 decode error:', error.message);
            }
        }
    }

    if (!authAccount && operation === 'read' && context.env["GUEST_READ"]) {
        const allow_guest = context.env["GUEST_READ"].split(",");
        const normalizedPath = normalizePath(path);
        for (var aa of allow_guest) {
            const normalizedAa = normalizePath(aa);
            if (aa === "*" || normalizedPath.startsWith(normalizedAa)) {
                return true;
            }
        }
    }

    if (authAccount) {
        const envKey = operation === 'read' ? `${authAccount}_READ` : authAccount;
        if (context.env[envKey]) {
            const allow = context.env[envKey].split(",");
            const normalizedPath = normalizePath(path);
            for (var a of allow) {
                const normalizedA = normalizePath(a);
                if (a === "*" || normalizedPath.startsWith(normalizedA)) {
                    return true;
                }
            }
        }
    }

    return false;
}

export function get_auth_status(context) {
    const clientIP = context.request.headers.get("cf-connecting-ip") || 
                     context.request.headers.get("x-forwarded-for")?.split(",")[0] ||
                     "unknown";
    
    if (!checkRateLimit(clientIP)) {
        return false;
    }
    
    var dopath = context.request.url.split("/api/write/items/")[1];
    return check_permission(context, dopath, 'write');
}

export function get_read_permission(context, path) {
    return check_permission(context, path, 'read');
}
