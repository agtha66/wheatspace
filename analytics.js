// WheatSpace 数据分析模块
// 提供留存率计算、用户细分分析、学习进度追踪功能

// =============================================
// Supabase 配置（复用全局配置）
// =============================================

// 假设全局 supabase 客户端已存在
function getSupabase() {
    if (window.supabase) {
        return window.supabase;
    }
    if (window.WheatSpaceAuth && window.WheatSpaceAuth.init) {
        return window.WheatSpaceAuth.init();
    }
    console.error('Supabase客户端未初始化');
    return null;
}

// =============================================
// 留存率计算
// =============================================

/**
 * 计算留存率数据
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @param {string} cohortType - 分组类型: 'daily', 'weekly', 'monthly'
 * @returns {Promise<Object>} 留存率数据
 */
async function calculateRetention(startDate, endDate, cohortType = 'daily') {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            throw new Error('Supabase客户端未初始化');
        }

        // 调用Supabase Edge Function（如果可用）
        // 否则使用客户端计算
        const { data, error } = await supabase.functions.invoke('calculate-retention', {
            body: { startDate, endDate, cohortType }
        });

        if (!error) {
            return { success: true, data };
        }

        // 如果Edge Function不可用，使用客户端计算
        console.warn('Edge Function不可用，使用客户端计算留存率');
        return await calculateRetentionClient(startDate, endDate, cohortType);
    } catch (error) {
        console.error('留存率计算失败:', error);
        return { 
            success: false, 
            error: error.message || '留存率计算失败',
            details: error 
        };
    }
}

/**
 * 客户端留存率计算（简化版）
 */
async function calculateRetentionClient(startDate, endDate, cohortType) {
    const supabase = getSupabase();
    const intervalMap = { daily: 'day', weekly: 'week', monthly: 'month' };
    const interval = intervalMap[cohortType] || 'day';

    // 获取用户首次登录日期
    const { data: cohorts, error: cohortError } = await supabase
        .from('users')
        .select('id, created_at, last_login_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

    if (cohortError) throw cohortError;

    // 获取所有登录记录
    const { data: loginRecords, error: loginError } = await supabase
        .from('user_login_logs')
        .select('user_id, login_at')
        .gte('login_at', startDate)
        .lte('login_at', endDate)
        .order('login_at', { ascending: true });

    if (loginError) throw loginError;

    // 分组计算
    const cohortMap = {};
    cohorts.forEach(user => {
        const cohortDate = user.created_at.split('T')[0];
        if (!cohortMap[cohortDate]) {
            cohortMap[cohortDate] = {
                date: cohortDate,
                totalUsers: 0,
                retention: {}
            };
        }
        cohortMap[cohortDate].totalUsers++;
    });

    // 计算每个分组的留存
    Object.keys(cohortMap).forEach(cohortDate => {
        const cohortUsers = cohorts.filter(u => u.created_at.split('T')[0] === cohortDate).map(u => u.id);
        const retentionDays = [1, 3, 7, 14, 30]; // 计算这些天后的留存
        
        retentionDays.forEach(day => {
            const targetDate = new Date(cohortDate);
            targetDate.setDate(targetDate.getDate() + day);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            const activeUsers = loginRecords.filter(record => {
                const loginDate = record.login_at.split('T')[0];
                return cohortUsers.includes(record.user_id) && loginDate === targetDateStr;
            }).length;

            const retentionRate = cohortUsers.length > 0 ? (activeUsers / cohortUsers.length * 100).toFixed(1) : 0;
            cohortMap[cohortDate].retention[`day${day}`] = {
                activeUsers,
                totalUsers: cohortUsers.length,
                rate: parseFloat(retentionRate)
            };
        });
    });

    const result = Object.values(cohortMap).sort((a, b) => a.date.localeCompare(b.date));
    return result;
}

// =============================================
// 用户细分分析
// =============================================

/**
 * 用户细分分析
 * @param {Object} options - 分析选项
 * @returns {Promise<Object>} 用户细分结果
 */
async function analyzeUserSegments(options = {}) {
    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase客户端未初始化');

        const { 
            segmentBy = 'activity', // activity, progress, frequency, device
            dateRange = 'last30days'
        } = options;

        // 获取用户数据
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, created_at, last_login_at, total_study_time, total_words_learned, subscription_tier, device_info')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // 获取学习记录
        const { data: learningRecords, error: learningError } = await supabase
            .from('learning_records')
            .select('user_id, action, duration_seconds, created_at')
            .order('created_at', { ascending: false });

        if (learningError) throw learningError;

        let segments = {};

        switch (segmentBy) {
            case 'activity':
                segments = segmentByActivity(users, learningRecords);
                break;
            case 'progress':
                segments = segmentByProgress(users);
                break;
            case 'frequency':
                segments = segmentByFrequency(users, learningRecords);
                break;
            case 'device':
                segments = segmentByDevice(users);
                break;
            default:
                segments = segmentByActivity(users, learningRecords);
        }

        return { success: true, segments, totalUsers: users.length };
    } catch (error) {
        console.error('用户细分分析失败:', error);
        return { 
            success: false, 
            error: error.message || '用户细分分析失败',
            details: error 
        };
    }
}

/**
 * 按活跃度细分用户
 */
function segmentByActivity(users, learningRecords) {
    const now = new Date();
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
    const oneMonthAgo = new Date(now.setDate(now.getDate() - 30));

    const segments = {
        highlyActive: { users: [], count: 0, description: '过去7天有5天以上活跃' },
        moderatelyActive: { users: [], count: 0, description: '过去7天有2-4天活跃' },
        lowActive: { users: [], count: 0, description: '过去7天有1天活跃' },
        dormant: { users: [], count: 0, description: '过去30天无活跃' }
    };

    users.forEach(user => {
        const userRecords = learningRecords.filter(record => record.user_id === user.id);
        const recentRecords = userRecords.filter(record => new Date(record.created_at) > oneWeekAgo);
        const activeDays = new Set(recentRecords.map(r => r.created_at.split('T')[0])).size;

        if (activeDays >= 5) {
            segments.highlyActive.users.push(user.id);
            segments.highlyActive.count++;
        } else if (activeDays >= 2) {
            segments.moderatelyActive.users.push(user.id);
            segments.moderatelyActive.count++;
        } else if (activeDays >= 1) {
            segments.lowActive.users.push(user.id);
            segments.lowActive.count++;
        } else {
            // 检查是否休眠
            const lastActivity = userRecords.length > 0 ? 
                new Date(userRecords[0].created_at) : new Date(user.created_at);
            if (lastActivity < oneMonthAgo) {
                segments.dormant.users.push(user.id);
                segments.dormant.count++;
            } else {
                // 默认归为低活跃
                segments.lowActive.users.push(user.id);
                segments.lowActive.count++;
            }
        }
    });

    return segments;
}

/**
 * 按学习进度细分用户
 */
function segmentByProgress(users) {
    const segments = {
        beginner: { users: [], count: 0, description: '学习时间<1小时 或 单词数<50' },
        intermediate: { users: [], count: 0, description: '学习时间1-10小时 或 单词数50-200' },
        advanced: { users: [], count: 0, description: '学习时间>10小时 或 单词数>200' },
        premium: { users: [], count: 0, description: '付费用户' }
    };

    users.forEach(user => {
        const studyHours = (user.total_study_time || 0) / 3600;
        const wordCount = user.total_words_learned || 0;

        if (user.subscription_tier === 'premium' || user.subscription_tier === 'pro') {
            segments.premium.users.push(user.id);
            segments.premium.count++;
        } else if (studyHours > 10 || wordCount > 200) {
            segments.advanced.users.push(user.id);
            segments.advanced.count++;
        } else if (studyHours >= 1 || wordCount >= 50) {
            segments.intermediate.users.push(user.id);
            segments.intermediate.count++;
        } else {
            segments.beginner.users.push(user.id);
            segments.beginner.count++;
        }
    });

    return segments;
}

/**
 * 按学习频率细分用户
 */
function segmentByFrequency(users, learningRecords) {
    const segments = {
        dailyLearner: { users: [], count: 0, description: '平均每天学习' },
        weeklyLearner: { users: [], count: 0, description: '平均每周学习' },
        occasionalLearner: { users: [], count: 0, description: '偶尔学习' },
        inconsistent: { users: [], count: 0, description: '学习不规律' }
    };

    // 计算每个用户的学习频率
    users.forEach(user => {
        const userRecords = learningRecords.filter(record => record.user_id === user.id);
        if (userRecords.length === 0) {
            segments.occasionalLearner.users.push(user.id);
            segments.occasionalLearner.count++;
            return;
        }

        const dates = userRecords.map(r => new Date(r.created_at).toDateString());
        const uniqueDays = new Set(dates).size;
        const totalDays = Math.max(1, (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));

        const frequency = uniqueDays / totalDays;

        if (frequency > 0.7) {
            segments.dailyLearner.users.push(user.id);
            segments.dailyLearner.count++;
        } else if (frequency > 0.3) {
            segments.weeklyLearner.users.push(user.id);
            segments.weeklyLearner.count++;
        } else if (frequency > 0.1) {
            segments.occasionalLearner.users.push(user.id);
            segments.occasionalLearner.count++;
        } else {
            segments.inconsistent.users.push(user.id);
            segments.inconsistent.count++;
        }
    });

    return segments;
}

/**
 * 按设备细分用户
 */
function segmentByDevice(users) {
    const segments = {
        mobile: { users: [], count: 0, description: '移动设备用户' },
        desktop: { users: [], count: 0, description: '桌面设备用户' },
        tablet: { users: [], count: 0, description: '平板设备用户' },
        unknown: { users: [], count: 0, description: '设备未知' }
    };

    users.forEach(user => {
        const deviceInfo = user.device_info || {};
        if (deviceInfo.isMobile) {
            segments.mobile.users.push(user.id);
            segments.mobile.count++;
        } else if (deviceInfo.isTablet) {
            segments.tablet.users.push(user.id);
            segments.tablet.count++;
        } else if (deviceInfo.platform && deviceInfo.platform.includes('Win') || 
                   deviceInfo.platform && deviceInfo.platform.includes('Mac')) {
            segments.desktop.users.push(user.id);
            segments.desktop.count++;
        } else {
            segments.unknown.users.push(user.id);
            segments.unknown.count++;
        }
    });

    return segments;
}

// =============================================
// 学习进度追踪
// =============================================

/**
 * 获取用户学习进度
 * @param {string} userId - 用户ID（可选，默认当前用户）
 * @returns {Promise<Object>} 学习进度数据
 */
async function getLearningProgress(userId = null) {
    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase客户端未初始化');

        // 如果没有提供userId，尝试获取当前用户
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('用户未登录');
            userId = user.id;
        }

        // 获取用户基本信息
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('total_study_time, total_words_learned, consecutive_login_days, last_study_date, created_at')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // 获取最近学习记录
        const { data: recentRecords, error: recordsError } = await supabase
            .from('learning_records')
            .select('action, duration_seconds, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (recordsError) throw recordsError;

        // 计算学习趋势
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const recentWeekRecords = recentRecords.filter(r => r.created_at.split('T')[0] >= weekAgoStr);
        const dailyStats = {};

        recentWeekRecords.forEach(record => {
            const date = record.created_at.split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { studyTime: 0, wordsLearned: 0, quizzes: 0 };
            }
            dailyStats[date].studyTime += record.duration_seconds || 0;
            if (record.action === 'learn_word') {
                dailyStats[date].wordsLearned++;
            }
            if (record.action === 'quiz_completed') {
                dailyStats[date].quizzes++;
            }
        });

        // 格式化每日数据
        const dailyData = Object.keys(dailyStats).sort().map(date => ({
            date,
            studyTime: dailyStats[date].studyTime,
            wordsLearned: dailyStats[date].wordsLearned,
            quizzes: dailyStats[date].quizzes
        }));

        // 计算整体进度
        const totalStudyHours = (userData.total_study_time || 0) / 3600;
        const totalWords = userData.total_words_learned || 0;
        const streak = userData.consecutive_login_days || 0;

        // 进度评分（基于学习时长和单词量）
        const progressScore = Math.min(100, 
            Math.sqrt(totalStudyHours * 10 + totalWords * 0.5)
        );

        return {
            success: true,
            data: {
                userId,
                totalStudyHours: totalStudyHours.toFixed(1),
                totalWords,
                streak,
                lastStudyDate: userData.last_study_date,
                joinDate: userData.created_at,
                dailyData,
                progressScore: Math.round(progressScore),
                level: calculateLevel(totalStudyHours, totalWords)
            }
        };
    } catch (error) {
        console.error('获取学习进度失败:', error);
        return { 
            success: false, 
            error: error.message || '获取学习进度失败',
            details: error 
        };
    }
}

/**
 * 根据学习时长和单词量计算用户等级
 */
function calculateLevel(studyHours, wordCount) {
    const score = studyHours * 10 + wordCount * 0.5;
    if (score >= 1000) return '大师';
    if (score >= 500) return '专家';
    if (score >= 200) return '高级';
    if (score >= 100) return '中级';
    if (score >= 50) return '初级';
    return '新手';
}

/**
 * 记录学习活动
 * @param {string} action - 学习活动类型
 * @param {number} durationSeconds - 持续时间（秒）
 * @param {Object} metadata - 附加元数据
 */
async function recordLearningActivity(action, durationSeconds = 0, metadata = {}) {
    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase客户端未初始化');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('用户未登录');

        const { data, error } = await supabase
            .from('learning_records')
            .insert({
                user_id: user.id,
                action,
                duration_seconds: durationSeconds,
                metadata: metadata
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('记录学习活动失败:', error);
        return { 
            success: false, 
            error: error.message || '记录学习活动失败'
        };
    }
}

// =============================================
// 全局导出
// =============================================

// 只在浏览器环境中导出
if (typeof window !== 'undefined') {
    window.WheatSpaceAnalytics = {
        // 留存率计算
        calculateRetention,
        
        // 用户细分
        analyzeUserSegments,
        
        // 学习进度
        getLearningProgress,
        recordLearningActivity,
        
        // 辅助函数
        getSupabase
    };
    
    console.log('WheatSpace数据分析模块已加载');
}

// CommonJS导出（Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateRetention,
        analyzeUserSegments,
        getLearningProgress,
        recordLearningActivity,
        getSupabase
    };
}