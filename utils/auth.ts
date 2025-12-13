// 统一权限检查函数
export function check_permission(context, path, operation = 'write') {
    // 系统文件总是允许访问
    if (path.startsWith("_$flaredrive$/")) return true;

    // 解析认证信息
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
                // Base64 解码失败，继续使用游客权限
                console.error('Base64 decode error:', error.message);
            }
        }
    }

    // 检查游客权限（仅限读取操作）
    if (!authAccount && operation === 'read' && context.env["GUEST_READ"]) {
        const allow_guest = context.env["GUEST_READ"].split(",");
        for (var aa of allow_guest) {
            if (aa === "*" || path.startsWith(aa)) {
                return true;
            }
        }
    }

    // 检查已认证用户权限
    if (authAccount) {
        const envKey = operation === 'read' ? `${authAccount}_READ` : authAccount;
        if (context.env[envKey]) {
            const allow = context.env[envKey].split(",");
            for (var a of allow) {
                if (a === "*" || path.startsWith(a)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// 保持原有函数兼容性
export function get_auth_status(context) {
    var dopath = context.request.url.split("/api/write/items/")[1];
    return check_permission(context, dopath, 'write');
}

// 新增读取权限检查
export function get_read_permission(context, path) {
    return check_permission(context, path, 'read');
}
  