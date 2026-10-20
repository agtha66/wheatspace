// WheatSpace 认证工具函数 - 使用本地后端 API (基于阿里云短信验证)

const API_BASE = window.WHEATSPACE_CONFIG?.apiBase || '/api';

/**
 * 发送短信验证码
 * @param {string} phone 手机号
 */
async function sendSmsCode(phone) {
    try {
        const response = await fetch(`${API_BASE}/auth/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '发送失败');
        return { success: true, message: data.message };
    } catch (error) {
        console.error('发送验证码失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 使用手机号和验证码登录
 * @param {string} phone 
 * @param {string} code 
 */
async function loginWithSms(phone, code) {
    try {
        const response = await fetch(`${API_BASE}/auth/login-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '登录失败');
        
        // 保存 token
        localStorage.setItem('wheatspace_token', data.token);
        localStorage.setItem('wheatspace_user', JSON.stringify(data.user));
        
        // 触发自定义认证状态改变事件
        window.dispatchEvent(new CustomEvent('wheatspace_auth_change', { detail: { session: data } }));
        
        return { success: true, user: data.user, token: data.token };
    } catch (error) {
        console.error('登录失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 检查用户是否已登录
 */
async function checkUserSession() {
    const token = localStorage.getItem('wheatspace_token');
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            // Token 无效或过期
            localStorage.removeItem('wheatspace_token');
            localStorage.removeItem('wheatspace_user');
            return null;
        }
        const data = await response.json();
        return { user: data.user, token };
    } catch (e) {
        return null;
    }
}

/**
 * 获取当前用户信息
 */
async function getCurrentUser() {
    const session = await checkUserSession();
    return session ? session.user : null;
}

/**
 * 用户登出
 */
async function handleLogout() {
    localStorage.removeItem('wheatspace_token');
    localStorage.removeItem('wheatspace_user');
    window.dispatchEvent(new CustomEvent('wheatspace_auth_change', { detail: { session: null } }));
    return { success: true };
}

/**
 * 更新用户资料
 */
async function updateUserProfile(updates) {
    console.warn("更新用户资料功能在此简化版本中未完全实现后端API");
    // 可以在此调用后端的 /api/users/me PUT 接口
    return { success: true };
}

/**
 * 设置认证状态变化监听
 */
function setupAuthStateListener(callback) {
    const handler = (e) => callback('STATE_CHANGED', e.detail.session);
    window.addEventListener('wheatspace_auth_change', handler);
    return () => {
        window.removeEventListener('wheatspace_auth_change', handler);
    };
}

/**
 * 获取设备和浏览器信息
 */
function getDeviceInfo() {
    return { platform: navigator.platform, userAgent: navigator.userAgent };
}
function getBrowserInfo() {
    return { name: "Browser", cookiesEnabled: navigator.cookieEnabled };
}

// 记录学习行为
async function recordLearningAction(action, data = {}, duration_seconds = 0) {
    const token = localStorage.getItem('wheatspace_token');
    if (!token) return;
    try {
        await fetch(`${API_BASE}/learning-records`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ action, data, duration_seconds })
        });
    } catch (e) {
        console.error("记录学习行为失败", e);
    }
}

if (typeof window !== 'undefined') {
    window.WheatSpaceAuth = {
        init: () => {},
        sendSmsCode,
        loginWithSms,
        checkSession: checkUserSession,
        getCurrentUser,
        logout: handleLogout,
        updateProfile: updateUserProfile,
        onAuthStateChange: setupAuthStateListener,
        getDeviceInfo,
        getBrowserInfo,
        recordLearningAction
    };
}
