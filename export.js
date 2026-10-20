// WheatSpace 数据导出模块
// 依赖：SheetJS (xlsx)

/**
 * 通用导出函数，将JSON数组导出为Excel或CSV
 * @param {Array} data - 要导出的JSON数据数组
 * @param {string} filename - 导出的文件名（不含扩展名）
 * @param {string} format - 导出格式 ('xlsx' 或 'csv')
 */
function exportData(data, filename, format = 'xlsx') {
    if (!data || data.length === 0) {
        alert('没有数据可导出');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('导出库尚未加载完成，请稍后再试');
        return;
    }

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // 导出文件
    const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`;
    XLSX.writeFile(wb, fullFilename);
}

/**
 * 格式化用户数据并导出
 */
async function exportUsersData(format = 'xlsx') {
    try {
        if (typeof window.fetchApi !== 'function') throw new Error('未找到 API 接口函数 fetchApi');
        
        const { data } = await window.fetchApi('/admin/users');
        
        if (!data) throw new Error('未获取到用户数据');
        
        const formattedData = data.map(u => ({
            '用户ID': u.id,
            '手机号/账号': u.phone || u.email || '',
            '昵称': u.nickname || '',
            '注册时间': new Date(u.created_at).toLocaleString('zh-CN'),
            '最后登录': u.last_login_at ? new Date(u.last_login_at).toLocaleString('zh-CN') : '未登录',
            '总学习时间(秒)': u.total_study_time || 0,
            '总学习单词': u.total_words_learned || 0,
            '状态': u.is_active ? '活跃' : '停用'
        }));

        exportData(formattedData, 'WheatSpace_Users', format);
    } catch (err) {
        console.error('导出用户数据失败:', err);
        alert('导出失败: ' + err.message);
    }
}

/**
 * 格式化学习记录并导出
 */
async function exportLearningRecords(format = 'xlsx') {
    try {
        if (typeof window.fetchApi !== 'function') throw new Error('未找到 API 接口函数 fetchApi');
        
        const { data } = await window.fetchApi('/admin/learning-records?limit=5000');
        
        if (!data) throw new Error('未获取到学习记录数据');
        
        const actionMap = {
            'learn_word': '单词学习',
            'quiz_perfect': '完美挑战',
            'add_custom_word': '添加单词',
            'login': '登录',
            'session_start': '会话开始',
            'session_end': '会话结束'
        };

        const formattedData = data.map(r => ({
            '记录ID': r.id,
            '用户账号': r.users ? (r.users.phone || r.users.email) : r.user_id,
            '行为类型': actionMap[r.action] || r.action,
            '持续时间(秒)': r.duration_seconds || 0,
            '详情数据': r.data ? JSON.stringify(r.data) : '',
            '记录时间': new Date(r.created_at).toLocaleString('zh-CN')
        }));

        exportData(formattedData, 'WheatSpace_LearningRecords', format);
    } catch (err) {
        console.error('导出学习记录失败:', err);
        alert('导出失败: ' + err.message);
    }
}

// 暴露到全局
if (typeof window !== 'undefined') {
    window.WheatSpaceExport = {
        exportData,
        exportUsersData,
        exportLearningRecords
    };
}
