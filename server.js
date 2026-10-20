require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// 阿里云 SDK
const Dypnsapi20170525 = require('@alicloud/dypnsapi20170525');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Credential = require('@alicloud/credentials');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (process.env.NODE_ENV === 'production' && (!SECRET_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD)) {
    throw new Error('Production requires JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables.');
}

app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// Only serve known frontend assets; never expose server code, env files, or data files.
const FRONTEND_DIR = path.join(__dirname, 'other');
const FRONTEND_FILES = [
    'admin.html', 'auth.js', 'export.js', 'script.js', 'style.css',
    'social-login.css', 'teddy.png', 'vocabulary.json'
];
app.get('/', (_req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
for (const file of FRONTEND_FILES) {
    app.get(`/${file}`, (_req, res) => res.sendFile(path.join(FRONTEND_DIR, file)));
}

// 简单的数据持久化
const DB_FILE = path.join(DATA_DIR, 'data.json');
let db = {
    users: [],
    learning_records: []
};

if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (!db.users) db.users = [];
        if (!db.learning_records) db.learning_records = [];
    } catch (e) {
        console.error("加载数据失败", e);
    }
}

function saveDb() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// 初始化阿里云 Client
function createAliyunClient() {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) throw new Error('SMS service credentials are not configured.');
    
    let config = new OpenApi.Config({
        accessKeyId: accessKeyId,
        accessKeySecret: accessKeySecret,
        regionId: 'cn-hangzhou'
    });
    config.endpoint = `dypnsapi.aliyuncs.com`;
    return new Dypnsapi20170525.default(config);
}

// In-memory verification codes expire after five minutes.
const smsCache = {};

// 生成 4 位随机验证码
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- API 路由 ---

// 1. 发送短信验证码
app.post('/api/auth/send-sms', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号不能为空' });

    const code = generateCode();

    try {
        let client = createAliyunClient();
        let sendSmsRequest = new Dypnsapi20170525.SendSmsVerifyCodeRequest({
            phoneNumber: phone,
            signName: '速通互联验证码',
            templateCode: '100001',
            templateParam: `{"code":"${code}","min":"5"}`,
        });
        let runtime = new Util.RuntimeOptions({
            readTimeout: 10000,
            connectTimeout: 10000
        });
        let response = await client.sendSmsVerifyCodeWithOptions(sendSmsRequest, runtime);
        
        if (response.body.code !== 'OK') {
            console.warn('[SMS] Provider rejected the send request.');
            return res.status(502).json({ error: '短信发送失败，请稍后重试' });
        }
        
        // 保存验证码，有效期 5 分钟
        smsCache[phone] = { code, expire: Date.now() + 5 * 60 * 1000 };
        res.json({ success: true, message: '验证码已发送' });
    } catch (error) {
        console.error('SMS send failed:', error.message);
        res.status(503).json({ error: '短信服务暂不可用，请稍后重试' });
    }
});

// 2. 验证短信并登录/注册
app.post('/api/auth/login-sms', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: '手机号和验证码不能为空' });

    const cached = smsCache[phone];
    if (!cached || cached.code !== code || Date.now() > cached.expire) {
        return res.status(400).json({ error: '验证码无效或已过期' });
    }

    // 验证成功，清除验证码
    delete smsCache[phone];

    // 查找或创建用户
    let user = db.users.find(u => u.phone === phone);
    if (!user) {
        user = {
            id: 'usr_' + Date.now().toString(),
            phone,
            created_at: new Date().toISOString(),
            is_active: true
        };
        db.users.push(user);
    }
    user.last_login_at = new Date().toISOString();
    saveDb();

    const token = jwt.sign({ id: user.id, phone: user.phone }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ success: true, token, user });
});

// 3. 管理员登录
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (ADMIN_EMAIL && ADMIN_PASSWORD && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '1d' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: '邮箱或密码错误' });
    }
});

// --- 需要鉴权的中间件 ---
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未授权' });
    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Token 无效' });
    }
}

function adminMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未授权' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') throw new Error('Not admin');
        next();
    } catch (e) {
        res.status(403).json({ error: '无管理员权限' });
    }
}

// 4. 获取当前用户
app.get('/api/users/me', authMiddleware, (req, res) => {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, user });
});

// 5. 提交学习记录
app.post('/api/learning-records', authMiddleware, (req, res) => {
    const { action, data, duration_seconds } = req.body;
    const record = {
        id: 'rec_' + Date.now().toString(),
        user_id: req.user.id,
        action: action || 'unknown',
        data: data || {},
        duration_seconds: duration_seconds || 0,
        created_at: new Date().toISOString()
    };
    db.learning_records.push(record);
    saveDb();
    res.json({ success: true, record });
});

// 6. AI 对话接口 (AI Speaking Partner)

// 百度语音识别 (STT) 配置
const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
let baiduToken = null;
let baiduTokenExpire = 0;

async function getBaiduToken() {
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) throw new Error('Speech recognition credentials are not configured.');
    if (baiduToken && Date.now() < baiduTokenExpire) return baiduToken;
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    if (data.access_token) {
        baiduToken = data.access_token;
        baiduTokenExpire = Date.now() + (data.expires_in - 3600) * 1000;
        return baiduToken;
    }
    throw new Error('Failed to get Baidu token: ' + JSON.stringify(data));
}

app.post('/api/ai/stt', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No audio file' });
    
    const inputPath = req.file.path;
    const outputPath = inputPath + '.wav';

    try {
        // Convert to 16kHz mono wav
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioChannels(1)
                .audioFrequency(16000)
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        const audioBuffer = fs.readFileSync(outputPath);
        const base64Audio = audioBuffer.toString('base64');
        const token = await getBaiduToken();
        const fileSize = audioBuffer.length;

        const body = {
            format: 'wav',
            rate: 16000,
            channel: 1,
            cuid: 'wheatspace-user',
            token: token,
            speech: base64Audio,
            len: fileSize
        };

        const baiduRes = await fetch('http://vop.baidu.com/server_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const baiduData = await baiduRes.json();
        
        // Clean up
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        if (baiduData.err_no === 0 && baiduData.result && baiduData.result.length > 0) {
            let text = baiduData.result[0];
            // Remove punctuation at the end if necessary, but keep it natural
            return res.json({ success: true, text: text });
        } else {
            console.error('Baidu API Error:', baiduData);
            return res.status(400).json({ success: false, error: 'Recognition failed: ' + baiduData.err_msg });
        }
    } catch (err) {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        console.error('STT Error:', err);
        return res.status(500).json({ success: false, error: 'STT conversion error' });
    }
});

app.post('/api/ai/chat', async (req, res) => {
    const { messages, gradeLevel } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: '无效的消息格式' });
    }

    // 优先使用 DeepSeek，其次是 OpenAI。如果都没配置，返回测试提示信息
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const apiKey = deepseekKey || openaiKey;

    if (!apiKey) {
        // 如果没有配置 Key，返回一条友好的提示
        return res.json({ 
            success: true, 
            reply: "Hi! I am your AI partner. Please configure the DEEPSEEK_API_KEY or OPENAI_API_KEY in the backend to start real conversation with me."
        });
    }

    const apiUrl = deepseekKey ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const model = deepseekKey ? 'deepseek-chat' : 'gpt-3.5-turbo';

    const gradeMap = {
        'primary1': '1st grade (very simple words and grammar)',
        'primary2': '2nd grade (simple words and short sentences)',
        'primary3': '3rd grade (basic conversations)',
        'primary4': '4th grade (daily conversations)',
        'primary5': '5th grade (intermediate level)',
        'primary6': '6th grade (intermediate level)',
        'junior1': '7th grade (middle school beginner)',
        'junior2': '8th grade (middle school intermediate)',
        'junior3': '9th grade (middle school advanced)',
        'senior1': '10th grade (high school beginner)',
        'senior2': '11th grade (high school intermediate)',
        'senior3': '12th grade (high school advanced)',
    };
    const difficultyLevel = gradeMap[gradeLevel] || 'beginner';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { 
                        role: 'system', 
                        content: `You are a friendly and encouraging English speaking partner for a student at the ${difficultyLevel} level. Talk with the user naturally in English. Use vocabulary and grammar appropriate for their grade level. Keep your answers relatively short (1-3 sentences) to facilitate conversation. Occasionally praise their English or gently correct obvious grammar mistakes if appropriate.` 
                    },
                    ...messages
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            res.json({ success: true, reply });
        } else {
            console.error("API 异常返回:", data);
            throw new Error(data.error?.message || 'API 返回格式错误');
        }
    } catch (error) {
        console.error("AI API 请求失败:", error);
        res.status(500).json({ error: '请求 AI 服务失败，请稍后再试' });
    }
});

// --- Admin API ---

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
    const totalUsers = db.users.length;
    
    // DAU (今日活跃)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = db.learning_records.filter(r => r.created_at.startsWith(todayStr));
    const dau = new Set(todayRecords.map(r => r.user_id)).size;

    // 昨日学习次数
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayRecords = db.learning_records.filter(r => r.created_at.startsWith(yesterday));
    const yesterdayRecordsCount = yesterdayRecords.length;

    // 本周新增用户
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const newWeek = db.users.filter(u => u.created_at >= sevenDaysAgo).length;

    // 最近活跃用户
    const recentUsers = [...db.users]
        .sort((a, b) => new Date(b.last_login_at || 0) - new Date(a.last_login_at || 0))
        .slice(0, 10);

    // DAU 历史 (近 14 天)
    const dauHistory = {};
    for(let i=13; i>=0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        const records = db.learning_records.filter(r => r.created_at.startsWith(d));
        dauHistory[d] = new Set(records.map(r => r.user_id)).size;
    }

    // 行为分布
    const actions = {};
    db.learning_records.forEach(r => {
        actions[r.action] = (actions[r.action] || 0) + 1;
    });

    // 时长统计
    const totalDuration = db.learning_records.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    const todayDuration = todayRecords.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    const avgTodayDuration = dau > 0 ? Math.floor(todayDuration / dau) : 0;
    
    // 历史人均日均时长：总时长 / 总活跃人次(人天)
    const activeDaysSet = new Set(db.learning_records.map(r => r.user_id + '_' + r.created_at.split('T')[0]));
    const avgDailyDuration = activeDaysSet.size > 0 ? Math.floor(totalDuration / activeDaysSet.size) : 0;

    res.json({
        totalUsers, dau, yesterdayRecordsCount, newWeek, recentUsers, dauHistory, actions, totalDuration, todayDuration, avgTodayDuration, avgDailyDuration
    });
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
    res.json({ success: true, data: db.users });
});

app.get('/api/admin/learning-records', adminMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 5000;
    const records = [...db.learning_records]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map(r => {
            const user = db.users.find(u => u.id === r.user_id);
            return { ...r, users: { phone: user ? user.phone : '未知' } };
        });
    const stats = {
        total: db.learning_records.length,
        learn_word: db.learning_records.filter(r => r.action === 'learn_word').length,
        quiz_perfect: db.learning_records.filter(r => r.action === 'quiz_perfect').length,
        add_custom_word: db.learning_records.filter(r => r.action === 'add_custom_word').length,
        total_duration: db.learning_records.reduce((sum, r) => sum + (r.duration_seconds || 0), 0)
    };
    res.json({ success: true, data: records, stats });
});

app.get('/api/admin/retention', adminMiddleware, (req, res) => {
    // 简化版留存
    const calcRetention = (days) => {
        const cohortDay = new Date(Date.now() - (days + 1) * 86400000).toISOString().split('T')[0];
        const targetDay = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]; // yesterday
        
        const cohortUsers = db.users.filter(u => u.created_at.startsWith(cohortDay));
        if (cohortUsers.length === 0) return '—';

        const cohortIds = cohortUsers.map(u => u.id);
        const retainedIds = new Set(db.learning_records
            .filter(r => cohortIds.includes(r.user_id) && r.created_at >= targetDay)
            .map(r => r.user_id));
        
        return Math.round((retainedIds.size / cohortUsers.length) * 100) + '%';
    };

    const growth = {};
    for(let i=29; i>=0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        growth[d] = db.users.filter(u => u.created_at.startsWith(d)).length;
    }

    res.json({
        d1: calcRetention(1),
        d7: calcRetention(7),
        d30: calcRetention(30),
        growth
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
