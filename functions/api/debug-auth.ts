export async function onRequest(context) {
    const headers = context.request.headers;
    const authHeader = headers.get('Authorization');

    let authInfo = {
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : null,
        envVars: {},
        decodedAccount: null,
        permissionResult: null
    };

    // 列出所有相关环境变量（不显示完整密码）
    for (const [key, value] of Object.entries(context.env)) {
        if (key.includes(':') || key.includes('GUEST')) {
            authInfo.envVars[key] = value ? value.substring(0, 10) + '...' : 'null';
        }
    }

    // 尝试解码认证信息
    if (authHeader && authHeader.startsWith('Basic ')) {
        try {
            const credentials = atob(authHeader.substring(6));
            authInfo.decodedAccount = credentials.split(':')[0] + ':' + '*'.repeat(credentials.split(':')[1].length);

            // 测试权限检查
            const [username] = credentials.split(':');
            const account = username + ':' + credentials.split(':')[1];

            if (context.env[account]) {
                authInfo.permissionResult = {
                    hasWritePermission: true,
                    hasReadPermission: !!context.env[account + '_READ'],
                    readPermissionValue: context.env[account + '_READ'] ? context.env[account + '_READ'].substring(0, 20) + '...' : null
                };
            } else {
                authInfo.permissionResult = {
                    hasWritePermission: false,
                    hasReadPermission: false,
                    error: '账户未找到'
                };
            }
        } catch (e) {
            authInfo.decodedAccount = '解码失败: ' + e.message;
        }
    }

    return new Response(JSON.stringify(authInfo, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}