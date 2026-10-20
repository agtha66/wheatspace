-- Supabase 用户登录系统升级脚本
-- 扩展users表结构，支持社交登录和增强数据分析

-- 1. 添加社交登录相关字段到users表
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Shanghai',
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS browser_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS total_study_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_words_learned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consecutive_login_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMP WITH TIME ZONE;

-- 2. 创建唯一索引，防止同一社交账号多次注册
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_id 
ON users(provider, provider_id) 
WHERE provider IS NOT NULL AND provider_id IS NOT NULL;

-- 3. 创建用户细分标签表
CREATE TABLE IF NOT EXISTS user_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    segment_type TEXT NOT NULL, -- 'activity_level', 'learning_style', 'retention_risk'
    segment_value TEXT NOT NULL, -- 'high', 'medium', 'low' 或具体值
    confidence_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_segments_user_id ON user_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_segments_type_value ON user_segments(segment_type, segment_value);

-- 4. 创建学习进度快照表（用于留存率计算）
CREATE TABLE IF NOT EXISTS learning_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    words_learned_today INTEGER DEFAULT 0,
    study_time_today INTEGER DEFAULT 0, -- 秒
    quizzes_taken INTEGER DEFAULT 0,
    quizzes_perfect INTEGER DEFAULT 0,
    login_count_today INTEGER DEFAULT 0,
    streak_maintained BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_snapshots_user_date 
ON learning_snapshots(user_id, snapshot_date);

-- 5. 创建留存率计算缓存表
CREATE TABLE IF NOT EXISTS retention_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_date DATE NOT NULL,
    cohort_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    cohort_size INTEGER NOT NULL,
    day1_retention FLOAT,
    day7_retention FLOAT,
    day30_retention FLOAT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_metrics_cohort ON retention_metrics(cohort_date, cohort_type);

-- 6. 创建数据导出任务表
CREATE TABLE IF NOT EXISTS export_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'users', 'learning_records', 'analytics'
    file_format TEXT NOT NULL, -- 'csv', 'excel', 'json'
    filters JSONB DEFAULT '{}'::jsonb,
    file_url TEXT,
    file_size BIGINT,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. 为users表添加触发器，自动更新last_study_date
CREATE OR REPLACE FUNCTION update_last_study_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action IN ('learn_word', 'quiz_completed', 'review_word') THEN
        UPDATE users 
        SET last_study_date = NOW(),
            total_study_time = COALESCE(total_study_time, 0) + COALESCE(NEW.duration_seconds, 0)
        WHERE id = NEW.user_id;
        
        -- 更新单词学习计数
        IF NEW.action = 'learn_word' THEN
            UPDATE users 
            SET total_words_learned = COALESCE(total_words_learned, 0) + 1
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_study_date ON learning_records;
CREATE TRIGGER trigger_update_last_study_date
AFTER INSERT ON learning_records
FOR EACH ROW
EXECUTE FUNCTION update_last_study_date();

-- 8. 创建RPC函数用于计算留存率
CREATE OR REPLACE FUNCTION calculate_cohort_retention(
    start_date DATE,
    end_date DATE,
    cohort_type TEXT
)
RETURNS TABLE(
    cohort_date DATE,
    cohort_size INTEGER,
    day1_retention FLOAT,
    day7_retention FLOAT,
    day30_retLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH cohorts AS (
        SELECT 
            DATE(u.created_at) as cohort_date,
            COUNT(DISTINCT u.id) as cohort_size
        FROM users u
        WHERE DATE(u.created_at) BETWEEN start_date AND end_date
        GROUP BY DATE(u.created_at)
    ),
    retention AS (
        SELECT 
            DATE(u.created_at) as cohort_date,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT CASE WHEN lr.created_at >= DATE(u.created_at) + INTERVAL '1 day' 
                                 AND lr.created_at < DATE(u.created_at) + INTERVAL '2 days' 
                            THEN u.id END) as day1_users,
            COUNT(DISTINCT CASE WHEN lr.created_at >= DATE(u.created_at) + INTERVAL '7 days' 
                                 AND lr.created_at < DATE(u.created_at) + INTERVAL '8 days' 
                            THEN u.id END) as day7_users,
            COUNT(DISTINCT CASE WHEN lr.created_at >= DATE(u.created_at) + INTERVAL '30 days' 
                                 AND lr.created_at < DATE(u.created_at) + INTERVAL '31 days' 
                            THEN u.id END) as day30_users
        FROM users u
        LEFT JOIN learning_records lr ON u.id = lr.user_id
        WHERE DATE(u.created_at) BETWEEN start_date AND end_date
        GROUP BY DATE(u.created_at)
    )
    SELECT 
        c.cohort_date,
        c.cohort_size,
        ROUND(r.day1_users::FLOAT / NULLIF(c.cohort_size, 0) * 100, 2) as day1_retention,
        ROUND(r.day7_users::FLOAT / NULLIF(c.cohort_size, 0) * 100, 2) as day7_retention,
        ROUND(r.day30_users::FLOAT / NULLIF(c.cohort_size, 0) * 100, 2) as day30_retention
    FROM cohorts c
    JOIN retention r ON c.cohort_date = r.cohort_date
    ORDER BY c.cohort_date;
END;
$$;

-- 9. 注释说明
COMMENT ON TABLE user_segments IS '用户细分标签，用于用户群体分析和个性化推荐';
COMMENT ON TABLE learning_snapshots IS '每日学习进度快照，用于留存率计算和学习趋势分析';
COMMENT ON TABLE retention_metrics IS '留存率指标缓存，提高报表查询性能';
COMMENT ON TABLE export_tasks IS '数据导出任务队列，支持异步导出功能';

-- 10. 更新现有用户数据，填充新字段的默认值
UPDATE users 
SET total_study_time = COALESCE(total_study_time, 0),
    total_words_learned = COALESCE(total_words_learned, 0),
    consecutive_login_days = COALESCE(consecutive_login_days, 0),
    subscription_tier = COALESCE(subscription_tier, 'free'),
    timezone = COALESCE(timezone, 'Asia/Shanghai')
WHERE total_study_time IS NULL 
   OR total_words_learned IS NULL 
   OR consecutive_login_days IS NULL 
   OR subscription_tier IS NULL 
   OR timezone IS NULL;