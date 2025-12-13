export async function onRequest(context) {
    // 列出所有环境变量（不显示敏感信息）
    const envInfo = {};

    for (const [key, value] of Object.entries(context.env)) {
        if (key.includes(':') || key.includes('GUEST')) {
            envInfo[key] = value ? `已设置 (长度: ${value.length})` : '未设置';
        }
    }

    // 尝试认证
    const headers = context.request.headers;
    const authHeader = headers.get('Authorization');

    let authResult = {
        hasAuthHeader: !!authHeader,
        authHeaderPreview: authHeader ? authHeader.substring(0, 50) : null,
        decodedCredentials: null,
        foundInEnv: false,
        readPermission: null,
        writePermission: null
    };

    if (authHeader && authHeader.startsWith('Basic ')) {
        try {
            const credentials = atob(authHeader.substring(6));
            authResult.decodedCredentials = credentials.substring(0, credentials.indexOf(':')) + ':****';

            // 检查环境变量
            if (context.env[credentials]) {
                authResult.foundInEnv = true;
                authResult.writePermission = context.env[credentials];
            }

            // 检查读取权限
            const readKey = credentials + '_READ';
            if (context.env[readKey]) {
                authResult.readPermission = context.env[readKey];
            }

        } catch (e) {
            authResult.decodedCredentials = '解码失败: ' + e.message;
        }
    }

    return new Response(JSON.stringify({
        environmentVariables: envInfo,
        authenticationTest: authResult
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}