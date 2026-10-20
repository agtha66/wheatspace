# Supabase OAuth 配置指南

## 概述
本指南介绍如何为 WheatSpace 英语学习平台配置 Supabase OAuth 提供者（Google 和 GitHub），以支持社交登录功能。

## 现有配置信息
- **Supabase URL**: `https://jgikxtxeurlagdctmvkt.supabase.co`
- **项目 ID**: `jgikxtxeurlagdctmvkt`
- **现有认证**: 邮箱/密码认证

## 步骤 1: 在 Supabase 控制台中启用 OAuth 提供者

### Google OAuth 配置
1. 登录 [Supabase 控制台](https://app.supabase.com)
2. 选择 `jgikxtxeurlagdctmvkt` 项目
3. 进入 **Authentication** → **Providers**
4. 找到 **Google** 并点击启用

### Google OAuth 所需信息
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建或选择现有项目
3. 进入 **API 和服务** → **凭据**
4. 创建 **OAuth 2.0 客户端 ID**
   - 应用类型: Web 应用
   - 名称: `WheatSpace OAuth`
   - 已获授权的 JavaScript 来源: 
     - `https://wheatspace.top`
     - `http://localhost:3000` (开发环境)
   - 已获授权的重定向 URI:
     - `https://jgikxtxeurlagdctmvkt.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (开发环境)

### GitHub OAuth 配置
1. 在 GitHub 上注册 OAuth 应用:
   - 访问 [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
   - 点击 **New OAuth App**
   - 应用名称: `WheatSpace`
   - 主页 URL: `https://wheatspace.top`
   - 授权回调 URL: `https://jgikxtxeurlagdctmvkt.supabase.co/auth/v1/callback`

2. 回到 Supabase 控制台:
   - 启用 **GitHub** 提供者
   - 填入 GitHub 提供的 Client ID 和 Client Secret

## 步骤 2: 运行数据库升级脚本

1. 在 Supabase 控制台中进入 **SQL Editor**
2. 复制 `supabase_schema_upgrade.sql` 文件内容
3. 执行 SQL 脚本，扩展 users 表和创建相关分析表

### 验证表结构更新
执行以下查询验证表结构:
```sql
-- 检查 users 表新增字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 检查新表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_segments', 'learning_snapshots', 'retention_metrics', 'export_tasks');
```

## 步骤 3: 配置环境变量（可选）

如果需要后端服务，可添加以下环境变量:

```env
# Supabase 配置
SUPABASE_URL=https://jgikxtxeurlagdctmvkt.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Nk6lOhLoLWofLgPz3RyC7w_WgHmiixt
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth 回调 URL（前端）
VITE_SUPABASE_REDIRECT_URL=https://wheatspace.top/auth/callback
VITE_SUPABASE_AUTH_CALLBACK_PATH=/auth/callback
```

## 步骤 4: 测试 OAuth 配置

### 测试步骤
1. 更新前端代码以支持社交登录按钮
2. 点击 Google 或 GitHub 登录按钮
3. 确认跳转到对应提供者的授权页面
4. 授权后重定向回应用
5. 验证用户信息是否正确保存到 `users` 表

### 常见问题排查

#### 1. 重定向 URI 不匹配
- 错误信息: `redirect_uri_mismatch`
- 解决方案: 确保 Google Cloud Console 和 Supabase 中的重定向 URI 完全一致

#### 2. OAuth 提供者未启用
- 错误信息: `Provider not enabled`
- 解决方案: 在 Supabase Authentication → Providers 中启用对应提供者

#### 3. 缺少必要权限
- 错误信息: `Insufficient permissions`
- 解决方案: 检查 Google Cloud API 密钥是否启用了必要的 OAuth API

#### 4. 用户信息未保存
- 现象: 登录成功但 `users` 表无记录
- 解决方案: 检查认证后的用户信息同步逻辑

## 步骤 5: 数据收集与隐私考虑

### 收集的数据字段
1. **基本身份信息**: email, provider, provider_id
2. **个人资料**: full_name, avatar_url, phone (可选)
3. **设备信息**: device_info, browser_info
4. **学习数据**: total_study_time, total_words_learned

### 隐私保护措施
1. 明确告知用户数据收集目的
2. 提供隐私政策链接
3. 允许用户选择性提供信息
4. 符合 GDPR 和当地数据保护法规

## 后续步骤

### 数据分析能力
1. **留存率计算**: 使用 `calculate_cohort_retention` 函数
2. **用户细分**: 基于学习行为自动分类用户
3. **学习进度**: 跟踪单词掌握程度和学习习惯

### 导出功能
1. **CSV 导出**: 基础数据导出
2. **Excel 导出**: 支持多工作表和格式
3. **批量处理**: 异步导出大容量数据

## 支持与帮助

如遇配置问题:
1. 查阅 [Supabase 官方文档](https://supabase.com/docs)
2. 检查项目中的 `auth.js` 和 `analytics.js` 实现
3. 参考前端登录组件代码