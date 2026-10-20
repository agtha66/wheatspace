const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} = React;

// =============================================
// Supabase 初始化
// =============================================
const SUPABASE_URL = 'https://jgikxtxeurlagdctmvkt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nk6lOhLoLWofLgPz3RyC7w_WgHmiixt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// 数据埋点：上报用户行为
// =============================================
const trackEvent = async (userId, action, data = {}, durationSeconds = 0) => {
  if (!userId) return;
  try {
    await supabase.from('learning_records').insert({
      user_id: userId,
      action,
      data,
      duration_seconds: durationSeconds
    });
  } catch (e) {
    console.warn('trackEvent error:', e);
  }
};

// =============================================
// 数据层：词库、例句、成就
// =============================================
const WORD_BANKS = {
  primary1: [{
    en: 'apple',
    zh: '苹果',
    emoji: '🍎',
    sentence: 'I eat an apple every day.',
    tip: 'A开头，红色的水果'
  }, {
    en: 'banana',
    zh: '香蕉',
    emoji: '🍌',
    sentence: 'The banana is yellow.',
    tip: '长长弯弯像月亮'
  }, {
    en: 'cat',
    zh: '猫',
    emoji: '🐱',
    sentence: 'The cat is sleeping.',
    tip: '喵喵叫的小动物'
  }, {
    en: 'dog',
    zh: '狗',
    emoji: '🐶',
    sentence: 'My dog likes to play.',
    tip: '人类最好的朋友'
  }, {
    en: 'sun',
    zh: '太阳',
    emoji: '☀️',
    sentence: 'The sun is very bright.',
    tip: '天上最亮的星'
  }, {
    en: 'moon',
    zh: '月亮',
    emoji: '🌙',
    sentence: 'I can see the moon at night.',
    tip: '晚上出来的圆盘'
  }, {
    en: 'water',
    zh: '水',
    emoji: '💧',
    sentence: 'Please drink more water.',
    tip: '透明的液体，我们要多喝'
  }, {
    en: 'book',
    zh: '书',
    emoji: '📚',
    sentence: 'This book is very interesting.',
    tip: '用来看和读的'
  }, {
    en: 'tree',
    zh: '树',
    emoji: '🌳',
    sentence: 'The tree is very tall.',
    tip: '长在土里，有绿叶'
  }, {
    en: 'house',
    zh: '房子',
    emoji: '🏠',
    sentence: 'My house has a garden.',
    tip: '我们住的地方'
  }, {
    en: 'fish',
    zh: '鱼',
    emoji: '🐟',
    sentence: 'The fish swims in the river.',
    tip: '生活在水里的动物'
  }, {
    en: 'bird',
    zh: '鸟',
    emoji: '🐦',
    sentence: 'The bird sings beautifully.',
    tip: '会飞会唱歌'
  }, {
    en: 'flower',
    zh: '花',
    emoji: '🌸',
    sentence: 'The flower smells sweet.',
    tip: '很香很漂亮'
  }, {
    en: 'rabbit',
    zh: '兔子',
    emoji: '🐰',
    sentence: 'The rabbit runs very fast.',
    tip: '长耳朵爱吃萝卜'
  }, {
    en: 'ball',
    zh: '球',
    emoji: '⚽',
    sentence: 'Let us play with the ball.',
    tip: '圆圆的可以踢'
  }, {
    en: 'cake',
    zh: '蛋糕',
    emoji: '🎂',
    sentence: 'The cake is delicious.',
    tip: '生日时吃的甜点'
  }, {
    en: 'star',
    zh: '星星',
    emoji: '⭐',
    sentence: 'The stars shine at night.',
    tip: '晚上闪烁的小点点'
  }, {
    en: 'rain',
    zh: '雨',
    emoji: '🌧️',
    sentence: 'I like walking in the rain.',
    tip: '从天上掉下来的水'
  }, {
    en: 'bread',
    zh: '面包',
    emoji: '🍞',
    sentence: 'I have bread for breakfast.',
    tip: '早餐吃的软软的'
  }, {
    en: 'egg',
    zh: '鸡蛋',
    emoji: '🥚',
    sentence: 'I like fried eggs.',
    tip: '母鸡下的，营养丰富'
  }, {
    en: 'milk',
    zh: '牛奶',
    emoji: '🥛',
    sentence: 'I drink milk every morning.',
    tip: '白色的饮料，钙丰富'
  }, {
    en: 'apple',
    zh: '苹果',
    emoji: '🍎',
    sentence: 'An apple a day keeps the doctor away.',
    tip: '一天一个，医生远离我'
  }, {
    en: 'car',
    zh: '汽车',
    emoji: '🚗',
    sentence: 'My dad drives a red car.',
    tip: '四个轮子在跑'
  }, {
    en: 'pen',
    zh: '钢笔',
    emoji: '🖊️',
    sentence: 'I write with a pen.',
    tip: '用来写字的工具'
  }, {
    en: 'desk',
    zh: '桌子',
    emoji: '🪑',
    sentence: 'There is a book on the desk.',
    tip: '用来放东西的家具'
  }, {
    en: 'door',
    zh: '门',
    emoji: '🚪',
    sentence: 'Please close the door.',
    tip: '进出房间的入口'
  }, {
    en: 'eye',
    zh: '眼睛',
    emoji: '👁️',
    sentence: 'I have two eyes.',
    tip: '用来看东西的器官'
  }, {
    en: 'hand',
    zh: '手',
    emoji: '✋',
    sentence: 'Wash your hands before eating.',
    tip: '用来做事的身体部位'
  }, {
    en: 'ice',
    zh: '冰',
    emoji: '🧊',
    sentence: 'The ice is very cold.',
    tip: '冷冻的水'
  }, {
    en: 'orange',
    zh: '橙子',
    emoji: '🍊',
    sentence: 'I like orange juice.',
    tip: '橙色的水果'
  }],
  primary2: [{
    en: 'school',
    zh: '学校',
    emoji: '🏫',
    sentence: 'I go to school every day.',
    tip: '学习知识的地方'
  }, {
    en: 'teacher',
    zh: '老师',
    emoji: '👩‍🏫',
    sentence: 'My teacher is very kind.',
    tip: '教我们知识的人'
  }, {
    en: 'friend',
    zh: '朋友',
    emoji: '👫',
    sentence: 'She is my best friend.',
    tip: '一起玩的伙伴'
  }, {
    en: 'family',
    zh: '家庭',
    emoji: '👨‍👩‍👧',
    sentence: 'I love my family so much.',
    tip: '爸爸妈妈和我'
  }, {
    en: 'happy',
    zh: '开心的',
    emoji: '😊',
    sentence: 'I feel happy today.',
    tip: '心里很舒服的感觉'
  }, {
    en: 'weather',
    zh: '天气',
    emoji: '🌤️',
    sentence: 'The weather is nice today.',
    tip: '晴天雨天都是它'
  }, {
    en: 'morning',
    zh: '早晨',
    emoji: '🌅',
    sentence: 'I wake up early in the morning.',
    tip: '太阳刚出来的时候'
  }, {
    en: 'evening',
    zh: '傍晚',
    emoji: '🌆',
    sentence: 'We have dinner in the evening.',
    tip: '太阳下山的时候'
  }, {
    en: 'market',
    zh: '市场',
    emoji: '🏪',
    sentence: 'Mom buys food at the market.',
    tip: '买菜买东西的地方'
  }, {
    en: 'bicycle',
    zh: '自行车',
    emoji: '🚲',
    sentence: 'I ride my bicycle to school.',
    tip: '两个轮子，用脚踩'
  }, {
    en: 'garden',
    zh: '花园',
    emoji: '🌻',
    sentence: 'We play in the garden.',
    tip: '有花草的地方'
  }, {
    en: 'library',
    zh: '图书馆',
    emoji: '📖',
    sentence: 'I read books at the library.',
    tip: '借书看书的地方'
  }, {
    en: 'music',
    zh: '音乐',
    emoji: '🎵',
    sentence: 'I love listening to music.',
    tip: '用耳朵欣赏的声音'
  }, {
    en: 'sport',
    zh: '运动',
    emoji: '🏃',
    sentence: 'Playing sport keeps me healthy.',
    tip: '跑步打球都是运动'
  }, {
    en: 'draw',
    zh: '画画',
    emoji: '🎨',
    sentence: 'I like to draw animals.',
    tip: '用笔画出图案'
  }, {
    en: 'jump',
    zh: '跳跃',
    emoji: '🦘',
    sentence: 'The child likes to jump.',
    tip: '双脚离开地面'
  }, {
    en: 'swim',
    zh: '游泳',
    emoji: '🏊',
    sentence: 'I can swim very well.',
    tip: '在水里移动'
  }, {
    en: 'clean',
    zh: '干净的',
    emoji: '✨',
    sentence: 'Keep your room clean.',
    tip: '没有灰尘很整洁'
  }, {
    en: 'strong',
    zh: '强壮的',
    emoji: '💪',
    sentence: 'He is strong and brave.',
    tip: '很有力气的感觉'
  }, {
    en: 'dream',
    zh: '梦想',
    emoji: '💭',
    sentence: 'Follow your dream always.',
    tip: '心里想实现的目标'
  }, {
    en: 'breakfast',
    zh: '早餐',
    emoji: '🍳',
    sentence: 'Breakfast is important.',
    tip: '早上吃的饭'
  }, {
    en: 'lunch',
    zh: '午餐',
    emoji: '🍱',
    sentence: 'We have lunch at noon.',
    tip: '中午吃的饭'
  }, {
    en: 'dinner',
    zh: '晚餐',
    emoji: '🍽️',
    sentence: 'Dinner is with family.',
    tip: '晚上吃的饭'
  }, {
    en: 'homework',
    zh: '作业',
    emoji: '📝',
    sentence: 'I finish my homework first.',
    tip: '放学后要做的练习'
  }, {
    en: 'playground',
    zh: '操场',
    emoji: '🏟️',
    sentence: 'We run on the playground.',
    tip: '学校里跑步的地方'
  }, {
    en: 'computer',
    zh: '电脑',
    emoji: '💻',
    sentence: 'I use a computer to learn.',
    tip: '用来工作和学习的机器'
  }, {
    en: 'cloud',
    zh: '云',
    emoji: '☁️',
    sentence: 'The cloud is white and fluffy.',
    tip: '天上飘的白棉花'
  }, {
    en: 'snow',
    zh: '雪',
    emoji: '❄️',
    sentence: 'Snow falls in winter.',
    tip: '冬天的白色精灵'
  }, {
    en: 'wind',
    zh: '风',
    emoji: '💨',
    sentence: 'The wind is strong today.',
    tip: '看不见但能感觉到'
  }, {
    en: 'summer',
    zh: '夏天',
    emoji: '☀️',
    sentence: 'Summer is very hot.',
    tip: '一年中最热的季节'
  }],
  junior: [{
    en: 'environment',
    zh: '环境',
    emoji: '🌍',
    sentence: 'We must protect the environment.',
    tip: '我们周围的一切：空气、水、土地'
  }, {
    en: 'adventure',
    zh: '冒险',
    emoji: '🗺️',
    sentence: 'Reading is a great adventure.',
    tip: '勇敢地去探索未知'
  }, {
    en: 'curious',
    zh: '好奇的',
    emoji: '🔍',
    sentence: 'She is curious about science.',
    tip: '想知道更多的感觉，像小猫一样'
  }, {
    en: 'challenge',
    zh: '挑战',
    emoji: '🏆',
    sentence: 'I accept every challenge bravely.',
    tip: '困难的任务，需要努力完成'
  }, {
    en: 'knowledge',
    zh: '知识',
    emoji: '🧠',
    sentence: 'Knowledge is power.',
    tip: '书本里学到的智慧'
  }, {
    en: 'culture',
    zh: '文化',
    emoji: '🎭',
    sentence: 'I am interested in Chinese culture.',
    tip: '一个国家的传统和习惯'
  }, {
    en: 'technology',
    zh: '技术',
    emoji: '💻',
    sentence: 'Technology changes our life.',
    tip: '让生活更方便的科学方法'
  }, {
    en: 'opportunity',
    zh: '机会',
    emoji: '🚀',
    sentence: 'Seize every opportunity to learn.',
    tip: '好的时机，要抓住它'
  }, {
    en: 'patience',
    zh: '耐心',
    emoji: '⏳',
    sentence: 'Success needs patience and effort.',
    tip: '不着急，慢慢等待'
  }, {
    en: 'confidence',
    zh: '自信',
    emoji: '🦁',
    sentence: 'Speak with confidence every day.',
    tip: '相信自己能做到'
  }, {
    en: 'creative',
    zh: '有创意的',
    emoji: '💡',
    sentence: 'She has many creative ideas.',
    tip: '想出新点子的能力'
  }, {
    en: 'responsible',
    zh: '负责任的',
    emoji: '🛡️',
    sentence: 'Be responsible for your actions.',
    tip: '对自己的行为负责'
  }, {
    en: 'communicate',
    zh: '交流',
    emoji: '💬',
    sentence: 'We communicate by email now.',
    tip: '与他人分享想法'
  }, {
    en: 'efficient',
    zh: '高效的',
    emoji: '⚡',
    sentence: 'This method is very efficient.',
    tip: '用最少的时间做最多的事'
  }, {
    en: 'respect',
    zh: '尊重',
    emoji: '🤝',
    sentence: 'Always respect your teachers.',
    tip: '认真对待他人'
  }, {
    en: 'volunteer',
    zh: '志愿者',
    emoji: '🙋',
    sentence: 'She works as a volunteer.',
    tip: '免费帮助别人的人'
  }, {
    en: 'celebrate',
    zh: '庆祝',
    emoji: '🎉',
    sentence: 'We celebrate the Spring Festival.',
    tip: '开心地纪念重要日子'
  }, {
    en: 'discover',
    zh: '发现',
    emoji: '🔭',
    sentence: 'Scientists discover new planets.',
    tip: '找到以前不知道的东西'
  }, {
    en: 'improve',
    zh: '提高',
    emoji: '📈',
    sentence: 'Practice helps you improve fast.',
    tip: '变得比以前更好'
  }, {
    en: 'encourage',
    zh: '鼓励',
    emoji: '🌟',
    sentence: 'Friends encourage each other always.',
    tip: '给他人力量和信心'
  }, {
    en: 'decision',
    zh: '决定',
    emoji: '🎯',
    sentence: 'Making a decision takes time.',
    tip: '做出选择'
  }, {
    en: 'achievement',
    zh: '成就',
    emoji: '🏅',
    sentence: 'This is a great achievement.',
    tip: '努力后取得的成果'
  }, {
    en: 'attention',
    zh: '注意力',
    emoji: '👀',
    sentence: 'Please pay attention in class.',
    tip: '专心听讲的集中力'
  }, {
    en: 'behavior',
    zh: '行为',
    emoji: '🎭',
    sentence: 'Good behavior is important.',
    tip: '我们怎么做事情'
  }, {
    en: 'competition',
    zh: '比赛',
    emoji: '🏁',
    sentence: 'The competition was exciting.',
    tip: '看谁做得更好'
  }, {
    en: 'experiment',
    zh: '实验',
    emoji: '🧪',
    sentence: 'We did a science experiment.',
    tip: '用科学方法测试'
  }, {
    en: 'generation',
    zh: '一代人',
    emoji: '👥',
    sentence: 'Young people are the new generation.',
    tip: '同龄的一群人'
  }, {
    en: 'influence',
    zh: '影响',
    emoji: '🌐',
    sentence: 'Parents have great influence on children.',
    tip: '对某人或某事的作用'
  }, {
    en: 'journey',
    zh: '旅程',
    emoji: '✈️',
    sentence: 'Life is a long journey.',
    tip: '从一个地方到另一个地方'
  }, {
    en: 'memory',
    zh: '记忆',
    emoji: '🧠',
    sentence: 'I have a good memory.',
    tip: '记住过去事情的能力'
  }]
};
const SENTENCES = [{
  en: 'The quick brown fox jumps over the lazy dog.',
  zh: '那只敏捷的棕色狐狸跳过了懒狗。',
  level: 'easy',
  blank: 'jumps',
  blankIdx: 4,
  options: ['jumps', 'runs', 'sleeps', 'flies']
}, {
  en: 'Every morning I brush my teeth and wash my face.',
  zh: '每天早上我刷牙和洗脸。',
  level: 'easy',
  blank: 'brush',
  blankIdx: 3,
  options: ['brush', 'clean', 'fix', 'cut']
}, {
  en: 'Reading books helps us learn new things every day.',
  zh: '读书帮助我们每天学习新事物。',
  level: 'easy',
  blank: 'learn',
  blankIdx: 5,
  options: ['learn', 'forget', 'write', 'sleep']
}, {
  en: 'We should protect the environment for future generations.',
  zh: '我们应该为子孙后代保护环境。',
  level: 'medium',
  blank: 'protect',
  blankIdx: 2,
  options: ['protect', 'destroy', 'ignore', 'build']
}, {
  en: 'Technology makes communication much faster and easier.',
  zh: '技术让交流变得更快更容易。',
  level: 'medium',
  blank: 'communication',
  blankIdx: 2,
  options: ['communication', 'transportation', 'celebration', 'education']
}, {
  en: 'Confidence is the key to success in everything you do.',
  zh: '自信是做任何事情成功的关键。',
  level: 'medium',
  blank: 'success',
  blankIdx: 5,
  options: ['success', 'failure', 'happiness', 'friendship']
}];
const BADGES = [{
  id: 'first_word',
  emoji: '🌱',
  name: '初次萌芽',
  desc: '第一次学习单词',
  condition: p => p.totalWordsLearned >= 1
}, {
  id: 'word10',
  emoji: '🌻',
  name: '词汇新手',
  desc: '累计学习 10 个单词',
  condition: p => p.totalWordsLearned >= 10
}, {
  id: 'word50',
  emoji: '🌲',
  name: '词汇达人',
  desc: '累计学习 50 个单词',
  condition: p => p.totalWordsLearned >= 50
}, {
  id: 'streak3',
  emoji: '🔥',
  name: '三日连胜',
  desc: '连续打卡 3 天',
  condition: p => p.streak >= 3
}, {
  id: 'streak7',
  emoji: '⚡',
  name: '周冠军',
  desc: '连续打卡 7 天',
  condition: p => p.streak >= 7
}, {
  id: 'correct50',
  emoji: '🎯',
  name: '百发百中',
  desc: '累计答对 50 题',
  condition: p => p.correctAnswers >= 50
}, {
  id: 'custom5',
  emoji: '✏️',
  name: '词汇创造者',
  desc: '添加 5 个自定义单词',
  condition: (p, cw) => (cw || []).length >= 5
}, {
  id: 'level5',
  emoji: '👑',
  name: '学习之王',
  desc: '达到 5 级',
  condition: p => p.level >= 5
}, {
  id: 'flip_complete',
  emoji: '🧩',
  name: '翻牌高手',
  desc: '完成一次翻牌配对游戏',
  condition: p => p.flipGamesCompleted >= 1
}, {
  id: 'quiz_perfect',
  emoji: '💎',
  name: '完美挑战',
  desc: '挑战模式获得 3 星',
  condition: p => p.perfectQuizzes >= 1
}, {
  id: 'pronunciation',
  emoji: '🎤',
  name: '发音达人',
  desc: '获得 10 次 80 分以上发音',
  condition: p => p.goodPronunciations >= 10
}];
const ENCOURAGEMENTS = ['加油！你快成功了！💪', '没关系，再试一次！🌈', '错了也是学习哦！✨', '你比昨天进步了！🌟', '继续加油，你最棒！🏆'];

// =============================================
// 工具函数
// =============================================
const speak = (text, lang = null) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);

  // 确定使用的语言/口音
  let useLang = lang;
  if (!useLang) {
    // 从localStorage读取偏好，如果没有则使用默认值
    try {
      const saved = localStorage.getItem('eq_accent');
      useLang = saved === 'uk' ? 'en-GB' : 'en-US';
    } catch {
      useLang = 'en-US';
    }
  }
  utter.lang = useLang;
  utter.rate = 0.85;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
};
const playSound = type => {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(type === 'correct' ? 800 : 300, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.3);
};
const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
};

// 检查是否支持语音识别（需要HTTPS或localhost）
const checkSpeechSupport = () => {
  const SpeechRecognition = getSpeechRecognition();
  const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!SpeechRecognition) {
    return {
      supported: false,
      reason: 'browser'
    }; // 浏览器不支持
  }
  if (!isSecureContext) {
    return {
      supported: false,
      reason: 'https'
    }; // 需要HTTPS
  }
  return {
    supported: true,
    reason: null
  };
};
const recognizePronunciation = (expectedText, onResult) => {
  const support = checkSpeechSupport();
  if (!support.supported) {
    const errorMsg = support.reason === 'browser' ? '当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器' : '语音识别需要 HTTPS 安全连接，请联系管理员配置证书';
    onResult({
      error: errorMsg,
      score: 0,
      needsHttps: support.reason === 'https'
    });
    return null;
  }
  const SpeechRecognition = getSpeechRecognition();
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    const expected = expectedText.toLowerCase();
    let score = 0;
    if (transcript === expected) {
      score = 100;
    } else {
      // 简单相似度计算
      const len = Math.max(transcript.length, expected.length);
      let matches = 0;
      for (let i = 0; i < Math.min(transcript.length, expected.length); i++) {
        if (transcript[i] === expected[i]) matches++;
      }
      score = Math.round(matches / len * 100);
    }
    onResult({
      transcript,
      score,
      error: null
    });
  };
  recognition.onerror = event => {
    // 更详细的错误信息
    const errorMessages = {
      'not-allowed': '请允许麦克风权限后再试',
      'no-speech': '没有检测到语音，请对着麦克风说话',
      'network': '网络错误，请检查网络连接',
      'audio-capture': '无法访问麦克风，请检查设备',
      'aborted': '录音被中断',
      'service-not-allowed': '语音服务不可用'
    };
    onResult({
      error: errorMessages[event.error] || `识别错误: ${event.error}`,
      score: 0
    });
  };
  recognition.onend = () => {
    // 识别结束
  };
  try {
    recognition.start();
  } catch (e) {
    onResult({
      error: '启动语音识别失败，请刷新页面重试',
      score: 0
    });
  }
  return recognition;
};
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const calcLevel = xp => {
  let level = 1,
    needed = 0;
  while (xp >= needed + level * 50) {
    needed += level * 50;
    level++;
  }
  return {
    level,
    xpInLevel: xp - needed,
    xpNeeded: level * 50
  };
};
const getTodayStr = () => new Date().toISOString().split('T')[0];

// 每日单词选择：根据日期生成固定的5个单词
const getDailyWords = (bankKey, dateStr = null) => {
  const today = dateStr || getTodayStr();
  const allWords = WORD_BANKS[bankKey];
  if (!allWords || allWords.length === 0) return [];

  // 使用日期作为种子生成稳定的随机选择
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const wordCount = 6; // 每天显示6个单词

  // 简单的伪随机选择（同一天选择相同的单词）
  const selected = [];
  const used = new Set();
  for (let i = 0; i < wordCount && selected.length < wordCount; i++) {
    const idx = (seed * (i + 1) * 7 + i * 13) % allWords.length;
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(allWords[idx]);
    }
  }
  return selected;
};

// 检查今日任务是否完成（学习20个单词 + 完成1次挑战）
const isDailyTaskComplete = dailyLogs => {
  const today = getTodayStr();
  const log = dailyLogs[today];
  const target = 20 + (log?.extraLimit || 0);
  return log && log.words >= target && log.answers >= 5;
};
const generateQuiz = words => {
  const pool = shuffle(words).slice(0, 5);
  const quizTypes = ['zh2en', 'emoji2en', 'en2zh'];
  return pool.map((word, i) => {
    const type = quizTypes[i % 3];
    const wrongPool = words.filter(w => w.en !== word.en);
    const wrongs = shuffle(wrongPool).slice(0, 3);
    let options, question, answer;
    if (type === 'zh2en') {
      question = word.zh;
      answer = word.en;
      options = shuffle([word.en, ...wrongs.map(w => w.en)]);
    } else if (type === 'emoji2en') {
      question = word.emoji;
      answer = word.en;
      options = shuffle([word.en, ...wrongs.map(w => w.en)]);
    } else {
      question = word.en;
      answer = word.zh;
      options = shuffle([word.zh, ...wrongs.map(w => w.zh)]);
    }
    return {
      type,
      question,
      answer,
      options,
      word
    };
  });
};

// =============================================
// 粒子庆祝效果组件
// =============================================
const CelebrationEffect = ({
  onDone
}) => {
  const colors = ['#5C7995', '#D49DAA', '#745B72', '#E6BCBC', '#AAABB9', '#8A6888'];
  const particles = useMemo(() => Array.from({
    length: 30
  }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    size: 8 + Math.random() * 10,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    tx: (Math.random() - 0.5) * 300 + 'px',
    ty: Math.random() * -200 - 50 + 'px',
    delay: Math.random() * 0.3,
    duration: 0.9 + Math.random() * 0.6
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 pointer-events-none z-50"
  }, particles.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    className: "particle",
    style: {
      left: p.x + '%',
      top: p.y + '%',
      width: p.size,
      height: p.size,
      background: p.color,
      '--tx': p.tx,
      '--ty': p.ty,
      animationDelay: p.delay + 's',
      animationDuration: p.duration + 's'
    }
  })));
};

// =============================================
// Header 组件
// =============================================
const Header = ({
  playerData,
  user,
  onLogout,
  accentPreference,
  onAccentChange,
  onOpenSettings
}) => {
  const {
    level,
    xpInLevel,
    xpNeeded
  } = calcLevel(playerData.xp);
  const pct = Math.round(xpInLevel / xpNeeded * 100);
  return /*#__PURE__*/React.createElement("header", {
    className: "fixed top-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-md border-b border-quest-blush/40 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl mx-auto flex items-center justify-between gap-2 px-3 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 flex-shrink-0"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "32",
    height: "32",
    viewBox: "0 0 512 512",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M80 300 Q80 120 256 80 Q432 120 432 300 Z",
    fill: "#745B72"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "256",
    cy: "298",
    rx: "176",
    ry: "28",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "232",
    y: "240",
    width: "48",
    height: "62",
    rx: "24",
    fill: "#FAF3F3"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "128",
    y: "200",
    width: "16",
    height: "12",
    rx: "3",
    fill: "#AAABB9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "148",
    y: "200",
    width: "16",
    height: "12",
    rx: "3",
    fill: "#AAABB9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "128",
    y: "218",
    width: "16",
    height: "12",
    rx: "3",
    fill: "#AAABB9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "148",
    y: "218",
    width: "16",
    height: "12",
    rx: "3",
    fill: "#AAABB9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M200 148 Q170 80 230 40",
    stroke: "#D49DAA",
    strokeWidth: "9",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "230",
    cy: "40",
    rx: "10",
    ry: "16",
    transform: "rotate(-20 230 40)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "252",
    cy: "52",
    rx: "10",
    ry: "16",
    transform: "rotate(5 252 52)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "268",
    cy: "74",
    rx: "9",
    ry: "15",
    transform: "rotate(20 268 74)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "276",
    cy: "100",
    rx: "8",
    ry: "14",
    transform: "rotate(35 276 100)",
    fill: "#8A9BB5"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "278",
    cy: "125",
    rx: "7",
    ry: "13",
    transform: "rotate(48 278 125)",
    fill: "#8A9BB5"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "212",
    cy: "56",
    rx: "8",
    ry: "13",
    transform: "rotate(-40 212 56)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "240",
    cy: "35",
    rx: "7",
    ry: "12",
    transform: "rotate(-10 240 35)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "260",
    cy: "62",
    rx: "8",
    ry: "13",
    transform: "rotate(12 260 62)",
    fill: "#8A9BB5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "hidden xs:block"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-bold text-base leading-none",
    style: {
      background: 'linear-gradient(135deg,#745B72,#5C7995)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }
  }, "WheatSpace"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs leading-none",
    style: {
      color: '#9B8FA0'
    }
  }, "\u82F1\u8BED\u5B66\u4E60\u4E50\u56ED"))), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:flex items-center gap-2 flex-1 max-w-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\u2B50"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm",
    style: {
      color: '#745B72'
    }
  }, "Lv.", level)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs mb-0.5",
    style: {
      color: '#9B8FA0'
    }
  }, /*#__PURE__*/React.createElement("span", null, xpInLevel, " XP"), /*#__PURE__*/React.createElement("span", null, xpNeeded, " XP")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-2 rounded-full overflow-hidden",
    style: {
      background: '#F5EEEE'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full rounded-full xp-bar",
    style: {
      width: pct + '%',
      background: 'linear-gradient(90deg, #745B72, #5C7995)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "header-row1-right flex items-center gap-2 flex-shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flame text-lg"
  }, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-quest-purple text-sm"
  }, playerData.streak)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-quest-lavender rounded-full px-2 py-1"
  }, /*#__PURE__*/React.createElement("select", {
    value: accentPreference,
    onChange: e => onAccentChange(e.target.value),
    className: "text-xs bg-transparent border-0 outline-none text-quest-purple font-medium",
    style: {
      fontSize: '12px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "us"
  }, "\uD83C\uDDFA\uD83C\uDDF8"), /*#__PURE__*/React.createElement("option", {
    value: "uk"
  }, "\uD83C\uDDEC\uD83C\uDDE7"))), user ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-purple font-medium max-w-[64px] truncate"
  }, "\uD83D\uDC64 ", user.username), /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    className: "text-xs text-quest-coral px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
  }, "\u9000\u51FA")) : /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSettings,
    className: "text-xs text-white font-medium px-3 py-1.5 rounded-full transition-all",
    style: {
      background: 'linear-gradient(135deg,#745B72,#5C7995)'
    }
  }, "\uD83D\uDD13 \u767B\u5F55"))), /*#__PURE__*/React.createElement("div", {
    className: "header-row2 max-w-3xl mx-auto items-center justify-between gap-2 px-3 pb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 flex-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "\u2B50"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-quest-purple text-xs"
  }, "Lv.", level), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 h-2 rounded-full overflow-hidden",
    style: {
      background: '#F5EEEE'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full rounded-full xp-bar",
    style: {
      width: pct + '%',
      background: 'linear-gradient(90deg, #745B72, #5C7995)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-muted whitespace-nowrap"
  }, xpInLevel, "/", xpNeeded)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 ml-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flame text-base"
  }, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-quest-purple text-xs"
  }, playerData.streak)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center bg-quest-lavender rounded-full px-2 py-0.5 ml-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: accentPreference,
    onChange: e => onAccentChange(e.target.value),
    className: "text-xs bg-transparent border-0 outline-none text-quest-purple font-medium",
    style: {
      fontSize: '12px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "us"
  }, "\uD83C\uDDFA\uD83C\uDDF8"), /*#__PURE__*/React.createElement("option", {
    value: "uk"
  }, "\uD83C\uDDEC\uD83C\uDDE7"))), /*#__PURE__*/React.createElement("div", {
    className: "ml-2"
  }, user ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-purple font-medium max-w-[56px] truncate"
  }, "\uD83D\uDC64 ", user.username), /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    className: "text-xs text-quest-coral px-1.5 py-0.5 rounded-full"
  }, "\u9000\u51FA")) : /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSettings,
    className: "text-xs text-white font-medium px-2.5 py-1 rounded-full",
    style: {
      background: 'linear-gradient(135deg,#745B72,#5C7995)'
    }
  }, "\u767B\u5F55"))));
};

// =============================================
// 登录模态框组件（邮箱 + 密码）
// =============================================
const LoginModal = ({
  visible,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'github' | null

  const resetModal = () => {
    setEmail('');
    setPassword('');
    setNickname('');
    setLoading(false);
    setError('');
    setSuccessMsg('');
    setSocialLoading(null);
    setMode('login');
  };
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // 弹窗时锁定 body 滚动
  useEffect(() => {
    if (visible) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [visible]);

  // 社交登录处理
  const handleSocialLogin = async provider => {
    setSocialLoading(provider);
    setError('');
    setSuccessMsg('');
    try {
      if (!window.WheatSpaceAuth || !window.WheatSpaceAuth.socialLogin) {
        throw new Error('认证模块未加载，请刷新页面重试');
      }
      const result = await window.WheatSpaceAuth.socialLogin(provider);
      if (!result.success) {
        throw new Error(result.error || '社交登录失败');
      }
      // 登录流程已启动，页面将重定向到OAuth提供商
      // 无需进一步操作，等待回调
    } catch (err) {
      console.error(`${provider}登录失败:`, err);
      setError(`${provider === 'google' ? 'Google' : 'GitHub'}登录失败: ${err.message}`);
      setSocialLoading(null);
    }
  };
  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入正确的邮箱格式');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const {
          data,
          error: err
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nickname: nickname.trim() || email.split('@')[0]
            },
            emailRedirectTo: 'https://wheatspace.top'
          }
        });
        if (err) throw err;
        if (data.user && !data.session) {
          // 需要邮箱验证
          setSuccessMsg('注册成功！请检查邮箱并点击验证链接后再登录。');
          return;
        }
        // 直接登录成功（邮箱验证已关闭时）
        const authUser = data.user;
        await supabase.from('users').upsert({
          id: authUser.id,
          email: authUser.email,
          nickname: nickname.trim() || authUser.email.split('@')[0],
          last_login_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        onLoginSuccess({
          id: authUser.id,
          email: authUser.email,
          username: nickname.trim() || authUser.email.split('@')[0]
        });
        handleClose();
      } else {
        const {
          data,
          error: err
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (err) throw err;
        const authUser = data.user;
        const {
          data: profile
        } = await supabase.from('users').upsert({
          id: authUser.id,
          email: authUser.email,
          last_login_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        }).select().single();
        const displayName = profile?.nickname || authUser.user_metadata?.nickname || authUser.email.split('@')[0];
        onLoginSuccess({
          id: authUser.id,
          email: authUser.email,
          username: displayName
        });
        handleClose();
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('Invalid login credentials')) setError('邮箱或密码错误');else if (msg.includes('Email not confirmed')) setError('邮箱尚未验证，请查收验证邮件');else if (msg.includes('User already registered')) setError('该邮箱已注册，请直接登录');else setError(msg || '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  if (!visible) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-panel bg-white rounded-3xl p-6 w-full max-w-sm mx-0 sm:mx-4 shadow-2xl bounce-in-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-quest-dark text-lg"
  }, mode === 'login' ? '🔑 登录账号' : '🌱 注册账号'), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-quest-muted mt-0.5"
  }, "\u767B\u5F55\u540E\u6570\u636E\u4E91\u7AEF\u540C\u6B65\uFF0C\u6C38\u4E0D\u4E22\u5931")), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    className: "text-quest-muted hover:text-quest-coral text-2xl leading-none"
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "flex rounded-xl overflow-hidden border border-gray-200 mb-5"
  }, [['login', '登录'], ['register', '注册']].map(([m, label]) => /*#__PURE__*/React.createElement("button", {
    key: m,
    onClick: () => {
      setMode(m);
      setError('');
      setSuccessMsg('');
    },
    className: `flex-1 py-2 text-sm font-medium transition-all ${mode === m ? 'text-white' : 'text-quest-muted bg-gray-50 hover:bg-gray-100'}`,
    style: mode === m ? {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    } : {}
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "social-login-container"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSocialLogin('google'),
    disabled: socialLoading !== null,
    className: `social-login-btn btn-google ${socialLoading === 'google' ? 'social-login-btn-loading' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "social-login-btn-icon"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: "16",
    height: "16"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#4285F4",
    d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#34A853",
    d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#FBBC05",
    d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#EA4335",
    d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "social-login-btn-text"
  }, socialLoading === 'google' ? '处理中...' : '使用 Google 登录')), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSocialLogin('github'),
    disabled: socialLoading !== null,
    className: `social-login-btn btn-github ${socialLoading === 'github' ? 'social-login-btn-loading' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "social-login-btn-icon"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: "16",
    height: "16"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "white",
    d: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.47-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.479 5.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.8.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "social-login-btn-text"
  }, socialLoading === 'github' ? '处理中...' : '使用 GitHub 登录'))), /*#__PURE__*/React.createElement("div", {
    className: "login-separator"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-separator-text"
  }, "\u6216")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "\u90AE\u7BB1\u5730\u5740",
    type: "email",
    autoComplete: "email",
    className: "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-quest-orange focus:outline-none"
  }), mode === 'register' && /*#__PURE__*/React.createElement("input", {
    value: nickname,
    onChange: e => setNickname(e.target.value),
    placeholder: "\u6635\u79F0\uFF08\u53EF\u9009\uFF09",
    type: "text",
    className: "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-quest-orange focus:outline-none"
  }), /*#__PURE__*/React.createElement("input", {
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: mode === 'register' ? '设置密码（至少 6 位）' : '密码',
    type: "password",
    autoComplete: mode === 'register' ? 'new-password' : 'current-password',
    onKeyDown: e => e.key === 'Enter' && handleSubmit(),
    className: "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-quest-orange focus:outline-none"
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-quest-coral"
  }, error), successMsg && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-quest-teal font-medium"
  }, successMsg), !successMsg && /*#__PURE__*/React.createElement("button", {
    onClick: handleSubmit,
    disabled: loading,
    className: "w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50",
    style: {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    }
  }, loading ? '处理中...' : mode === 'login' ? '登录' : '注册')), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-xs text-quest-muted mt-4"
  }, mode === 'login' ? '还没有账号？' : '已有账号？', /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMode(mode === 'login' ? 'register' : 'login');
      setError('');
      setSuccessMsg('');
    },
    className: "text-quest-orange font-medium ml-1 hover:underline"
  }, mode === 'login' ? '立即注册' : '去登录'))));
};

// =============================================
// TabNav 底部导航
// =============================================
const TAB_LIST = [{
  id: 'garden',
  label: '词语花园',
  emoji: '🌸'
}, {
  id: 'sentence',
  label: '句子任务',
  emoji: '📝'
}, {
  id: 'challenge',
  label: '挑战模式',
  emoji: '⚔️'
}, {
  id: 'calendar',
  label: '学习日历',
  emoji: '📅'
}, {
  id: 'achievement',
  label: '成就馆',
  emoji: '🏆'
}];
const TabNav = ({
  activeTab,
  setActiveTab
}) => /*#__PURE__*/React.createElement("nav", {
  className: "fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-md border-t shadow-[0_-8px_24px_rgba(74,25,66,0.10)] bottom-nav-safe",
  style: {
    borderColor: 'rgba(237,174,187,0.4)'
  }
}, /*#__PURE__*/React.createElement("div", {
  className: "max-w-3xl mx-auto flex"
}, TAB_LIST.map(tab => /*#__PURE__*/React.createElement("button", {
  key: tab.id,
  onClick: () => setActiveTab(tab.id),
  className: `flex-1 flex flex-col items-center py-2 gap-0.5 transition-all duration-200`,
  style: {
    color: activeTab === tab.id ? '#5C7995' : '#9B8FA0'
  }
}, /*#__PURE__*/React.createElement("span", {
  className: `text-lg transition-transform duration-200 ${activeTab === tab.id ? 'scale-125' : 'scale-100'}`
}, tab.emoji), /*#__PURE__*/React.createElement("span", {
  className: `text-[10px] font-medium leading-tight text-center ${activeTab === tab.id ? 'font-bold' : ''}`
}, tab.label), activeTab === tab.id && /*#__PURE__*/React.createElement("div", {
  className: "w-5 h-0.5 rounded-full",
  style: {
    background: '#5C7995'
  }
})))));

// =============================================
// Tab1: 词语花园
// =============================================

// ---- 单词详情弹层 ----
const SIMILAR_WORDS = {
  // 形近词简单示例（实际可扩展为JSON数据）
};
const WordDetailPage = ({
  word,
  onBack,
  onLearn
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [extraData, setExtraData] = useState(null);

  // 进入页面时滚到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [word?.en]);

  // 从vocabulary.json获取形近词、近义词
  useEffect(() => {
    if (!word) return;
    setLoadingExtra(true);
    fetch('./vocabulary.json').then(r => r.ok ? r.json() : Promise.reject()).then(all => {
      const en = word.en.toLowerCase();
      const similar = all.filter(w => {
        if (w.word === en) return false;
        const s = w.word.toLowerCase();
        return s[0] === en[0] && Math.abs(s.length - en.length) <= 2 || s.slice(0, 2) === en.slice(0, 2) && s !== en;
      }).slice(0, 5);
      const syns = all.filter(w => {
        if (w.word === en) return false;
        return w.grade === (word.grade || '') || w.emoji === word.emoji;
      }).slice(0, 5);
      setExtraData({
        similar,
        synonyms: syns
      });
    }).catch(() => setExtraData({
      similar: [],
      synonyms: []
    })).finally(() => setLoadingExtra(false));
  }, [word?.en]);
  if (!word) return null;
  const handleSpeak = () => {
    setSpeaking(true);
    speak(word.en);
    onLearn && onLearn(word.en);
    setTimeout(() => setSpeaking(false), 1400);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "word-detail-page fixed inset-0 z-50 overflow-y-auto",
    style: {
      background: 'linear-gradient(160deg,#FAF3F3 0%,#F0E8F0 45%,#EAE8F0 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-md",
    style: {
      background: 'rgba(250,243,243,0.92)',
      borderBottom: '1px solid rgba(230,188,188,0.35)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-sm transition-all active:scale-95",
    style: {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, "\u2190 \u8FD4\u56DE"), /*#__PURE__*/React.createElement("span", {
    className: "text-base font-bold truncate",
    style: {
      color: '#3D2E3D'
    }
  }, word.en)), /*#__PURE__*/React.createElement("div", {
    className: "h-1",
    style: {
      background: 'linear-gradient(90deg,#745B72,#AAABB9,#5C7995)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto px-4 py-6 pb-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-4 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-7xl leading-none"
  }, word.emoji || '📖'), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-5xl font-bold leading-tight",
    style: {
      color: '#3D2E3D'
    }
  }, word.en), word.phonetic && /*#__PURE__*/React.createElement("span", {
    className: "inline-block mt-2 px-3 py-1 rounded-full text-sm phonetic-badge"
  }, "/", word.phonetic, "/"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleSpeak,
    className: "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
    style: speaking ? {
      background: '#5C7995',
      color: '#fff'
    } : {
      background: '#fff',
      color: '#745B72',
      border: '1.5px solid #E6BCBC'
    }
  }, speaking ? '🔊 朗读中…' : '🔊 听发音')))), /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-5 rounded-3xl shadow-card",
    style: {
      background: '#fff',
      border: '1px solid #E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "detail-section-title mb-2"
  }, "\u91CA\u4E49"), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-bold",
    style: {
      color: '#3D2E3D'
    }
  }, word.zh)), word.sentence && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-5 rounded-3xl shadow-card",
    style: {
      background: '#fff',
      border: '1px solid #E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "detail-section-title"
  }, "\u4F8B\u53E5"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      speak(word.sentence);
    },
    className: "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
    style: {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, "\uD83D\uDD0A \u6717\u8BFB\u4F8B\u53E5")), /*#__PURE__*/React.createElement("p", {
    className: "text-base leading-relaxed italic",
    style: {
      color: '#745B72'
    }
  }, word.sentence), word.sentenceZh && /*#__PURE__*/React.createElement("p", {
    className: "text-sm mt-2",
    style: {
      color: '#9B8FA0'
    }
  }, word.sentenceZh)), word.tip && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-5 rounded-3xl",
    style: {
      background: 'linear-gradient(135deg,#745B72,#8A6888)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "detail-section-title mb-2",
    style: {
      color: '#E6BCBC'
    }
  }, "\u8BB0\u5FC6\u5C0F\u8D34\u58EB"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm leading-relaxed",
    style: {
      color: '#FAF3F3'
    }
  }, "\uD83D\uDCA1 ", word.tip)), !loadingExtra && extraData && /*#__PURE__*/React.createElement(React.Fragment, null, extraData.similar.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-5 rounded-3xl shadow-card",
    style: {
      background: '#fff',
      border: '1px solid #E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "detail-section-title mb-3"
  }, "\u5F62\u8FD1\u8BCD"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, extraData.similar.map(w => /*#__PURE__*/React.createElement("span", {
    key: w.word,
    className: "related-chip"
  }, w.word, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#9B8FA0',
      fontSize: '11px'
    }
  }, w.zh))))), extraData.synonyms.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-5 rounded-3xl shadow-card",
    style: {
      background: '#fff',
      border: '1px solid #E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "detail-section-title mb-3"
  }, "\u540C\u7C7B\u8BCD"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, extraData.synonyms.map(w => /*#__PURE__*/React.createElement("span", {
    key: w.word,
    className: "related-chip"
  }, w.emoji || '📖', " ", w.word))))), loadingExtra && /*#__PURE__*/React.createElement("div", {
    className: "text-center py-4",
    style: {
      color: '#9B8FA0',
      fontSize: '13px'
    }
  }, "\u23F3 \u52A0\u8F7D\u6269\u5C55\u8BCD\u6C47\u2026")));
};
const WordCard = ({
  word,
  onLearn,
  onOpenDetail,
  addXP,
  updatePlayer
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [listenMode, setListenMode] = useState(false); // 跟读模式
  const [scoreResult, setScoreResult] = useState(null); // { score, transcript }
  const recognitionRef = useRef(null);
  const handleSpeak = e => {
    e.stopPropagation();
    setSpeaking(true);
    speak(word.en);
    onLearn(word.en);
    setTimeout(() => setSpeaking(false), 1200);
  };
  const handleFollowRead = e => {
    e.stopPropagation();
    if (listenMode) {
      // 取消跟读
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      setListenMode(false);
      setScoreResult(null);
      return;
    }
    setScoreResult(null);
    setListenMode(true);
    // 先朗读一遍示范
    speak(word.en);
    setTimeout(() => {
      const rec = recognizePronunciation(word.en, result => {
        setListenMode(false);
        if (result.error) {
          setScoreResult({
            score: -1,
            msg: result.error
          });
        } else {
          setScoreResult({
            score: result.score,
            transcript: result.transcript
          });
          if (result.score >= 80 && addXP) addXP(1);
          if (result.score >= 80 && updatePlayer) updatePlayer(prev => ({
            ...prev,
            goodPronunciations: (prev.goodPronunciations || 0) + 1
          }));
        }
        setTimeout(() => setScoreResult(null), 3000);
      });
      recognitionRef.current = rec;
    }, 1200);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "word-card bg-white rounded-3xl p-4 shadow-card flex flex-col items-center gap-1.5 relative cursor-pointer",
    onClick: () => onOpenDetail && onOpenDetail(word),
    style: {
      border: '1.5px solid #F5EEEE'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-2.5 right-2.5 text-xs rounded-full px-1.5 py-0.5",
    style: {
      background: '#F5EEEE',
      color: '#9B8FA0',
      fontSize: '10px'
    }
  }, "\u8BE6\u60C5 \u203A"), /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-0.5"
  }, word.emoji), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: '#3D2E3D'
    }
  }, word.en), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5 mt-0.5",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleSpeak,
    className: `flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all`,
    style: speaking ? {
      background: '#5C7995',
      color: '#fff'
    } : {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, speaking ? '🔊…' : '🔊'), /*#__PURE__*/React.createElement("button", {
    onClick: handleFollowRead,
    className: "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
    style: listenMode ? {
      background: '#D49DAA',
      color: '#fff',
      animation: 'pulse 1s infinite'
    } : {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, listenMode ? '🎤 听...' : '🎤 跟读')), scoreResult && /*#__PURE__*/React.createElement("div", {
    className: "w-full mt-1 px-2 py-1 rounded-xl text-center text-xs font-bold",
    style: scoreResult.score >= 80 ? {
      background: '#AAABB9',
      color: '#fff'
    } : scoreResult.score >= 50 ? {
      background: '#E6BCBC',
      color: '#3D2E3D'
    } : {
      background: '#F5EEEE',
      color: '#9B8FA0'
    }
  }, scoreResult.score < 0 ? scoreResult.msg : scoreResult.score >= 80 ? `🎉 ${scoreResult.score}分 棒极了！` : scoreResult.score >= 50 ? `👍 ${scoreResult.score}分 继续加油` : `💪 ${scoreResult.score}分 再试试`));
};
const FlipGame = ({
  words,
  onComplete,
  addXP
}) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [checking, setChecking] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [moves, setMoves] = useState(0);
  const timerRef = useRef(null);
  const initGame = useCallback(() => {
    const picked = shuffle(words).slice(0, 6);
    const deck = shuffle([...picked.map((w, i) => ({
      id: 'en' + i,
      pairId: i,
      type: 'en',
      content: w.en,
      word: w
    })), ...picked.map((w, i) => ({
      id: 'zh' + i,
      pairId: i,
      type: 'zh',
      content: w.zh,
      word: w
    }))]);
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setChecking(false);
    setMoves(0);
    setCelebrate(false);
  }, [words]);
  useEffect(() => {
    initGame();
  }, [words]);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  const handleFlip = card => {
    if (checking || flipped.includes(card.id) || matched.includes(card.pairId)) return;
    if (flipped.length === 0) {
      setFlipped([card.id]);
      speak(card.type === 'en' ? card.content : card.word.en);
    } else if (flipped.length === 1) {
      const first = cards.find(c => c.id === flipped[0]);
      setFlipped([flipped[0], card.id]);
      setMoves(m => m + 1);
      if (first.pairId === card.pairId) {
        playSound('correct');
        setMatched(prev => {
          const next = [...prev, card.pairId];
          if (next.length === 6) {
            setCelebrate(true);
            addXP(20);
            onComplete();
          }
          return next;
        });
        setFlipped([]);
      } else {
        playSound('wrong');
        setChecking(true);
        timerRef.current = setTimeout(() => {
          setFlipped([]);
          setChecking(false);
        }, 900);
      }
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, celebrate && /*#__PURE__*/React.createElement(CelebrationEffect, {
    onDone: () => setCelebrate(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-quest-orange font-bold"
  }, "\uD83C\uDFAE \u7FFB\u724C\u914D\u5BF9"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-muted"
  }, "\u627E\u51FA\u6240\u6709\u914D\u5BF9\uFF01")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-muted"
  }, "\u5DF2\u7FFB ", moves, " \u6B21"), /*#__PURE__*/React.createElement("button", {
    onClick: initGame,
    className: "text-xs px-3 py-1.5 rounded-full bg-quest-lavender text-quest-purple font-medium hover:bg-quest-orange hover:text-white transition-all"
  }, "\uD83D\uDD04 \u91CD\u65B0\u5F00\u59CB"))), celebrate && /*#__PURE__*/React.createElement("div", {
    className: "bounce-in text-center py-6 mb-4 rounded-3xl bg-gradient-to-r from-quest-orange to-quest-coral text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83C\uDF89"), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-lg"
  }, "\u592A\u5389\u5BB3\u4E86\uFF01\u5168\u90E8\u914D\u5BF9\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm opacity-90 mt-1"
  }, "\u83B7\u5F97 +20 XP \u5956\u52B1\uFF01")), /*#__PURE__*/React.createElement("div", {
    className: "flip-grid grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3"
  }, cards.map(card => {
    const isFlipped = flipped.includes(card.id) || matched.includes(card.pairId);
    const isMatched = matched.includes(card.pairId);
    return /*#__PURE__*/React.createElement("div", {
      key: card.id,
      className: "flip-card aspect-square",
      onClick: () => handleFlip(card)
    }, /*#__PURE__*/React.createElement("div", {
      className: `flip-card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`,
      style: {
        width: '100%',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flip-card-front w-full h-full card-purple-grad rounded-2xl flex items-center justify-center shadow-card"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-3xl"
    }, "\u2753")), /*#__PURE__*/React.createElement("div", {
      className: `flip-card-back w-full h-full rounded-2xl flex items-center justify-center shadow-card text-center px-2 ${isMatched ? 'match-glow' : ''}`,
      style: {
        background: isMatched ? 'linear-gradient(135deg, #AAABB9, #8A9BB5)' : 'linear-gradient(135deg, #FAF3F3, #F5EEEE)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `font-bold text-sm break-all ${isMatched ? 'text-white' : 'text-quest-dark'}`
    }, card.content))));
  })));
};

// 课程标准词库年级/版本映射
const CURRICULUM_BANKS = [{
  key: 'primary1',
  label: '小学一年级',
  emoji: '🌱',
  grade: 'primary1'
}, {
  key: 'primary2',
  label: '小学二年级',
  emoji: '🌿',
  grade: 'primary2'
}, {
  key: 'primary3',
  label: '小学三年级',
  emoji: '🍀',
  grade: 'primary3'
}, {
  key: 'primary4',
  label: '小学四年级',
  emoji: '🌻',
  grade: 'primary4'
}, {
  key: 'primary5',
  label: '小学五年级',
  emoji: '🌳',
  grade: 'primary5'
}, {
  key: 'primary6',
  label: '小学六年级',
  emoji: '🏫',
  grade: 'primary6'
}, {
  key: 'junior1',
  label: '初中七年级',
  emoji: '📘',
  grade: 'junior1'
}, {
  key: 'junior2',
  label: '初中八年级',
  emoji: '📗',
  grade: 'junior2'
}, {
  key: 'junior3',
  label: '初中九年级',
  emoji: '📙',
  grade: 'junior3'
}, {
  key: 'senior1',
  label: '高中一年级',
  emoji: '📕',
  grade: 'senior1'
}, {
  key: 'senior2',
  label: '高中二年级',
  emoji: '📔',
  grade: 'senior2'
}, {
  key: 'senior3',
  label: '高中三年级',
  emoji: '🎓',
  grade: 'senior3'
}];

// 词汇缓存（避免重复请求）
const vocabCache = {};
const useCurriculumVocab = grade => {
  const [words, setWords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!grade) return;
    if (vocabCache[grade]) {
      setWords(vocabCache[grade]);
      return;
    }
    setLoading(true);
    // 优先从本地JSON加载
    fetch('./vocabulary.json').then(r => r.ok ? r.json() : Promise.reject()).then(all => {
      const filtered = all.filter(w => w.grade === grade);
      if (filtered.length > 0) {
        vocabCache[grade] = filtered.map(w => ({
          en: w.word,
          zh: w.zh,
          emoji: w.emoji || '📖',
          sentence: w.sentence,
          tip: w.tip || '',
          phonetic: w.phonetic
        }));
        setWords(vocabCache[grade]);
        setLoading(false);
      } else {
        throw new Error('no data');
      }
    }).catch(() => {
      // 回退到 Supabase
      const SUPABASE_URL = 'https://jgikxtxeurlagdctmvkt.supabase.co';
      const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaWt4dHhldXJsYWdkY3Rtdmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTMyNDgsImV4cCI6MjA5MTEyOTI0OH0.kFd7SLCNN7iGg2TblJHi8gvv-J341djygQ95DmZ6tv0';
      fetch(`${SUPABASE_URL}/rest/v1/vocabulary?grade=eq.${grade}&select=word,phonetic,zh,emoji,sentence,tip&order=id`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      }).then(r => r.json()).then(data => {
        vocabCache[grade] = data.map(w => ({
          en: w.word,
          zh: w.zh,
          emoji: w.emoji || '📖',
          sentence: w.sentence,
          tip: w.tip || '',
          phonetic: w.phonetic
        }));
        setWords(vocabCache[grade]);
      }).catch(() => setWords([])).finally(() => setLoading(false));
    });
  }, [grade]);
  return {
    words,
    loading
  };
};

// =============================================
// 拼写练习组件（初高中年级）
// =============================================
const SpellingPractice = ({
  words,
  onClose,
  addXP
}) => {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // 'correct'|'wrong'|null
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const practiceWords = useMemo(() => {
    if (!words || words.length === 0) return [];
    return shuffle(words).slice(0, Math.min(words.length, 6));
  }, [words.length]);
  const current = practiceWords[idx];
  if (!current && !done) return null;
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [idx]);
  const handleSpeak = () => speak(current.en);
  const handleSubmit = () => {
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === current.en.toLowerCase();
    setResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setScore(s => s + 1);
      addXP && addXP(3);
      playSound('correct');
    } else {
      playSound('wrong');
    }
    setTimeout(() => {
      setResult(null);
      setInput('');
      if (idx + 1 >= practiceWords.length) {
        setDone(true);
      } else {
        setIdx(i => i + 1);
      }
    }, 1200);
  };
  if (done) {
    const total = practiceWords.length;
    const pct = Math.round(score / total * 100);
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center px-4",
      style: {
        background: 'rgba(61,46,61,0.55)',
        backdropFilter: 'blur(4px)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl",
      style: {
        background: '#FAF3F3'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-5xl mb-3"
    }, pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'), /*#__PURE__*/React.createElement("h3", {
      className: "text-2xl font-bold mb-1",
      style: {
        color: '#3D2E3D'
      }
    }, "\u62FC\u5199\u7EC3\u4E60\u5B8C\u6210\uFF01"), /*#__PURE__*/React.createElement("p", {
      className: "text-4xl font-black mb-2",
      style: {
        color: '#5C7995'
      }
    }, score, "/", total), /*#__PURE__*/React.createElement("p", {
      className: "text-sm mb-6",
      style: {
        color: '#9B8FA0'
      }
    }, pct >= 80 ? '太棒了，拼写达人！' : pct >= 50 ? '不错哦，继续努力！' : '多练练，你能行！'), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "w-full py-3 rounded-2xl font-bold text-white text-base",
      style: {
        background: 'linear-gradient(135deg,#745B72,#5C7995)'
      }
    }, "\u5B8C\u6210 \u2713")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto",
    style: {
      background: 'linear-gradient(160deg,#FAF3F3 0%,#F0E8F0 45%,#EAE8F0 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-md",
    style: {
      background: 'rgba(250,243,243,0.92)',
      borderBottom: '1px solid rgba(230,188,188,0.35)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
    style: {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, "\u2190 \u9000\u51FA"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm",
    style: {
      color: '#3D2E3D'
    }
  }, "\u270D\uFE0F \u62FC\u5199\u7EC3\u4E60 ", idx + 1, "/", practiceWords.length), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm",
    style: {
      color: '#5C7995'
    }
  }, "\u5F97\u5206 ", score)), /*#__PURE__*/React.createElement("div", {
    className: "h-1",
    style: {
      background: 'linear-gradient(90deg,#745B72,#AAABB9,#5C7995)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-1.5",
    style: {
      background: '#F5EEEE'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full transition-all duration-300",
    style: {
      width: `${idx / practiceWords.length * 100}%`,
      background: 'linear-gradient(90deg,#745B72,#5C7995)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "max-w-md mx-auto px-4 py-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-7xl mb-4"
  }, current.emoji || '📖'), /*#__PURE__*/React.createElement("p", {
    className: "text-lg font-medium mb-1",
    style: {
      color: '#9B8FA0'
    }
  }, "\u8BF7\u62FC\u5199\u4EE5\u4E0B\u5355\u8BCD\uFF1A"), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-bold mb-3",
    style: {
      color: '#3D2E3D'
    }
  }, current.zh), /*#__PURE__*/React.createElement("button", {
    onClick: handleSpeak,
    className: "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
    style: {
      background: '#F5EEEE',
      color: '#745B72',
      border: '1.5px solid #E6BCBC'
    }
  }, "\uD83D\uDD0A \u542C\u53D1\u97F3")), /*#__PURE__*/React.createElement("div", {
    className: "relative mb-4"
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: input,
    onChange: e => setInput(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') handleSubmit();
    },
    placeholder: "\u5728\u6B64\u8F93\u5165\u82F1\u6587\u5355\u8BCD...",
    disabled: result !== null,
    className: "w-full px-5 py-4 rounded-2xl text-xl font-bold text-center outline-none border-2 transition-all",
    style: {
      background: '#fff',
      borderColor: result === 'correct' ? '#AAABB9' : result === 'wrong' ? '#D49DAA' : '#E6BCBC',
      color: result === 'correct' ? '#5C7995' : result === 'wrong' ? '#D49DAA' : '#3D2E3D'
    }
  }), result === 'wrong' && /*#__PURE__*/React.createElement("p", {
    className: "text-center text-sm mt-2 font-medium",
    style: {
      color: '#D49DAA'
    }
  }, "\u6B63\u786E\u7B54\u6848\uFF1A", /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: '#745B72'
    }
  }, current.en))), /*#__PURE__*/React.createElement("button", {
    onClick: handleSubmit,
    disabled: !input.trim() || result !== null,
    className: "w-full py-4 rounded-2xl font-bold text-white text-lg transition-all disabled:opacity-40",
    style: {
      background: 'linear-gradient(135deg,#745B72,#5C7995)'
    }
  }, result === 'correct' ? '✓ 正确！' : result === 'wrong' ? '✗ 错误' : '确认提交')));
};

// =============================================
// 虚拟宠物组件（咖色泰迪狗）
// =============================================
const VirtualPet = ({
  event,
  onSpeak
}) => {
  const [animation, setAnimation] = useState('idle');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // 宠物的英文对话库
  const petMessages = {
    learn: ['Great job!', 'Awesome!', 'Keep going!', 'You rock!', 'Well done!'],
    perfect: ['Amazing!', 'Perfect score!', 'You are a star!', 'Brilliant!'],
    streak: ["You're on fire!", 'Keep the streak!', 'So proud of you!'],
    idle: ['Let\'s learn!', 'Ready?', 'Hi there!', 'Tap me!']
  };

  // 监听事件触发动画和语音
  useEffect(() => {
    if (!event) return;
    const {
      type
    } = event;
    if (type === 'learn') {
      setAnimation('jump');
      const msg = petMessages.learn[Math.floor(Math.random() * petMessages.learn.length)];
      setMessage(msg);
      setShowMessage(true);
      speakPetMessage(msg);
      setTimeout(() => {
        setAnimation('idle');
        setShowMessage(false);
      }, 3000);
    } else if (type === 'perfect') {
      setAnimation('bark');
      const msg = petMessages.perfect[Math.floor(Math.random() * petMessages.perfect.length)];
      setMessage(msg);
      setShowMessage(true);
      speakPetMessage(msg);
      setTimeout(() => {
        setAnimation('idle');
        setShowMessage(false);
      }, 3500);
    } else if (type === 'streak') {
      setAnimation('jump');
      const msg = petMessages.streak[Math.floor(Math.random() * petMessages.streak.length)];
      setMessage(msg);
      setShowMessage(true);
      speakPetMessage(msg);
      setTimeout(() => {
        setAnimation('idle');
        setShowMessage(false);
      }, 3000);
    }
  }, [event]);

  // 小男孩音色说话
  const speakPetMessage = text => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.1;
    utterance.pitch = 1.5; // 高音调模拟儿童声音
    // 尝试选择儿童/年轻男声
    const voices = speechSynthesis.getVoices();
    const childVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Kid') || v.name.includes('Child') || v.name.includes('Junior'))) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Male'));
    if (childVoice) utterance.voice = childVoice;
    speechSynthesis.speak(utterance);
  };

  // 点击宠物
  const handlePetClick = () => {
    setAnimation('jump');
    const msg = petMessages.idle[Math.floor(Math.random() * petMessages.idle.length)];
    setMessage(msg);
    setShowMessage(true);
    speakPetMessage(msg);
    setTimeout(() => {
      setAnimation('idle');
      setShowMessage(false);
    }, 2500);
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: handlePetClick,
    className: "fixed left-4 bottom-24 z-40 cursor-pointer select-none",
    style: {
      width: '130px'
    }
  }, showMessage && /*#__PURE__*/React.createElement("div", {
    className: "speech-bubble absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-lg",
    style: {
      background: '#FAF3F3',
      color: '#745B72',
      border: '2px solid #E6BCBC'
    }
  }, message), /*#__PURE__*/React.createElement("div", {
    className: `dog-${animation}`
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    style: {
      width: '100%',
      height: 'auto',
      filter: 'drop-shadow(0 4px 8px rgba(116,91,114,0.25))'
    }
  }, /*#__PURE__*/React.createElement("g", {
    style: {
      transformOrigin: '20px 75px',
      animation: animation === 'idle' ? 'dogWagTail 0.3s ease-in-out infinite' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 28 75 Q 12 85 15 65 Q 25 55 28 70 Z",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "68",
    r: "5",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "62",
    r: "4",
    fill: "#915133"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M 35 50 Q 20 65 25 85 L 75 85 Q 80 65 65 50 Z",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "65",
    r: "7",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "75",
    r: "8",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "72",
    cy: "65",
    r: "7",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "74",
    cy: "75",
    r: "8",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "60",
    r: "14",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 20 80 Q 15 90 25 90 Q 35 90 32 80 Z",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 80 80 Q 85 90 75 90 Q 65 90 68 80 Z",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 22 86 L 22 90 M 26 86 L 26 90",
    stroke: "#68341D",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 74 86 L 74 90 M 78 86 L 78 90",
    stroke: "#68341D",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 40 75 Q 36 90 45 90 Q 50 90 48 75 Z",
    fill: "#B37351"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 60 75 Q 64 90 55 90 Q 50 90 52 75 Z",
    fill: "#B37351"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 42 86 L 42 90 M 46 86 L 46 90",
    stroke: "#7A4529",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 54 86 L 54 90 M 58 86 L 58 90",
    stroke: "#7A4529",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "42",
    r: "21",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "40",
    cy: "24",
    r: "7",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "20",
    r: "8",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "24",
    r: "7",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "34",
    cy: "30",
    r: "6",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "66",
    cy: "30",
    r: "6",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "45",
    cy: "18",
    r: "6",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "55",
    cy: "18",
    r: "6",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "45",
    cy: "30",
    r: "10",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "55",
    cy: "30",
    r: "10",
    fill: "#A46442"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 32 35 Q 15 40 18 55 Q 22 68 32 55 Z",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "22",
    cy: "45",
    r: "6",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "52",
    r: "6",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "60",
    r: "5",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 68 35 Q 85 40 82 55 Q 78 68 68 55 Z",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "78",
    cy: "45",
    r: "6",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "80",
    cy: "52",
    r: "6",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "74",
    cy: "60",
    r: "5",
    fill: "#915133"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "50",
    cy: "50",
    rx: "15",
    ry: "11",
    fill: "#C58763"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "43",
    cy: "48",
    r: "7",
    fill: "#C58763"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "57",
    cy: "48",
    r: "7",
    fill: "#C58763"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "50",
    cy: "45",
    rx: "5",
    ry: "3.5",
    fill: "#1A1A1A"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 47 44 Q 50 42 53 44",
    stroke: "#4A4A4A",
    strokeWidth: "1",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 45 52 Q 50 56 55 52",
    stroke: "#1A1A1A",
    strokeWidth: "1.5",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 47 53 Q 50 60 53 53 Z",
    fill: "#F28C9F"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 50 53 L 50 57",
    stroke: "#D85C75",
    strokeWidth: "1",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "39",
    cy: "38",
    r: "4.5",
    fill: "#1A1A1A"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "61",
    cy: "38",
    r: "4.5",
    fill: "#1A1A1A"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "37.5",
    cy: "36.5",
    r: "1.5",
    fill: "#FFFFFF"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "40.5",
    cy: "39.5",
    r: "0.8",
    fill: "#FFFFFF"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "59.5",
    cy: "36.5",
    r: "1.5",
    fill: "#FFFFFF"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "62.5",
    cy: "39.5",
    r: "0.8",
    fill: "#FFFFFF"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "33",
    cy: "46",
    rx: "4",
    ry: "2",
    fill: "#E89AA8",
    opacity: "0.4"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "67",
    cy: "46",
    rx: "4",
    ry: "2",
    fill: "#E89AA8",
    opacity: "0.4"
  }))));
};

// =============================================
// 番茄时钟组件（15分钟休息提醒）
// =============================================
const PomodoroTimer = ({
  onBreakTime,
  sessionActive
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const BREAK_INTERVAL = 15 * 60; // 15分钟

  useEffect(() => {
    if (!sessionActive) {
      setSeconds(0);
      setIsBreak(false);
      return;
    }
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (next >= BREAK_INTERVAL && !isBreak) {
          setIsBreak(true);
          onBreakTime && onBreakTime();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive, isBreak, onBreakTime]);
  const formatTime = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const progress = seconds / BREAK_INTERVAL * 100;
  return /*#__PURE__*/React.createElement("div", {
    className: `pomodoro-timer ${isBreak ? 'break-time' : ''}`,
    title: isBreak ? '休息时间到！' : `学习时间: ${formatTime(seconds)}`
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '16px'
    }
  }, isBreak ? '🍅' : '⏱️'), /*#__PURE__*/React.createElement("span", null, isBreak ? '休息!' : formatTime(seconds)), !isBreak && /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-1.5 rounded-full overflow-hidden",
    style: {
      background: 'rgba(255,255,255,0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full rounded-full transition-all",
    style: {
      width: `${progress}%`,
      background: '#FAF3F3'
    }
  })));
};

// =============================================
// 休息游戏组件（英文动作指令 + 姿态检测）
// =============================================
const BreakGame = ({
  onClose,
  onComplete
}) => {
  const [currentAction, setCurrentAction] = useState(0);
  const [actionComplete, setActionComplete] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detected, setDetected] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);

  // 英文动作指令库
  const ACTIONS = [{
    text: 'Jump 3 times!',
    emoji: '🦘',
    checkPose: 'jump'
  }, {
    text: 'Touch your nose!',
    emoji: '👃',
    checkPose: 'touch_nose'
  }, {
    text: 'Raise both hands!',
    emoji: '🙌',
    checkPose: 'raise_hands'
  }, {
    text: 'Turn around!',
    emoji: '🔄',
    checkPose: 'turn'
  }, {
    text: 'Clap 5 times!',
    emoji: '👏',
    checkPose: 'clap'
  }, {
    text: 'Touch your toes!',
    emoji: '🦶',
    checkPose: 'touch_toes'
  }];
  const [actions] = useState(() => shuffle([...ACTIONS]).slice(0, 3));

  // 初始化摄像头和姿态检测
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          initPoseDetection();
        }
      } catch (err) {
        console.log('Camera not available:', err);
        setCameraReady(false);
      }
    };
    const initPoseDetection = () => {
      if (typeof window.Pose === 'undefined') {
        console.log('MediaPipe Pose not loaded');
        return;
      }
      const pose = new window.Pose({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
      });
      pose.setOptions({
        modelComplexity: 0,
        // 轻量级
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      pose.onResults(onPoseResults);
      poseRef.current = pose;

      // 启动检测循环
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({
              image: videoRef.current
            });
          }
        },
        width: 320,
        height: 240
      });
      camera.start();
    };
    initCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 处理姿态检测结果
  const onPoseResults = results => {
    if (!results.poseLandmarks) return;
    const landmarks = results.poseLandmarks;
    const action = actions[currentAction];
    if (!action) return;
    let detected = false;

    // 简化的姿态检测逻辑
    if (action.checkPose === 'raise_hands') {
      // 双手举过头顶
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      const nose = landmarks[0];
      if (leftWrist && rightWrist && nose) {
        detected = leftWrist.y < nose.y - 0.1 && rightWrist.y < nose.y - 0.1;
      }
    } else if (action.checkPose === 'touch_nose') {
      // 手接近鼻子
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      const nose = landmarks[0];
      if (leftWrist && rightWrist && nose) {
        const distL = Math.sqrt(Math.pow(leftWrist.x - nose.x, 2) + Math.pow(leftWrist.y - nose.y, 2));
        const distR = Math.sqrt(Math.pow(rightWrist.x - nose.x, 2) + Math.pow(rightWrist.y - nose.y, 2));
        detected = distL < 0.15 || distR < 0.15;
      }
    }
    // 其他动作简化为随机检测（实际产品需要更精确的算法）
    else {
      // 对于jump/clap/turn等动态动作，使用简化的检测
      detected = Math.random() > 0.98; // 偶尔触发
    }
    if (detected && !actionComplete) {
      setDetected(true);
      setActionComplete(true);
      playSound('correct');
      setTimeout(() => {
        if (currentAction + 1 >= actions.length) {
          // 全部完成
          onComplete && onComplete();
        } else {
          setCurrentAction(c => c + 1);
          setActionComplete(false);
          setDetected(false);
        }
      }, 1500);
    }

    // 绘制骨架（可选）
    if (canvasRef.current && results.poseLandmarks) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, 320, 240);
      // 可以绘制骨架点
      landmarks.forEach(lm => {
        if (lm.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(lm.x * 320, lm.y * 240, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#5C7995';
          ctx.fill();
        }
      });
    }
  };

  // 跳过当前动作
  const handleSkip = () => {
    setSkipCount(s => s + 1);
    if (currentAction + 1 >= actions.length) {
      onComplete && onComplete();
    } else {
      setCurrentAction(c => c + 1);
      setActionComplete(false);
      setDetected(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex flex-col items-center justify-center px-4",
    style: {
      background: 'linear-gradient(160deg, #FAF3F3, #F0E8F0, #EAE8F0)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center",
    style: {
      background: '#F5EEEE',
      color: '#745B72'
    }
  }, "\u2715"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold mb-2",
    style: {
      color: '#745B72'
    }
  }, "\uD83C\uDFAE \u4F11\u606F\u65F6\u95F4\uFF01"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-6",
    style: {
      color: '#9B8FA0'
    }
  }, "\u5B8C\u6210\u52A8\u4F5C\u4F11\u606F\u4E00\u4E0B\u773C\u775B\u5427"), /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-3xl p-6 mb-4 text-center bounce-in",
    style: {
      background: '#fff',
      boxShadow: '0 8px 32px rgba(116,91,114,0.15)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-6xl mb-3"
  }, actions[currentAction]?.emoji), /*#__PURE__*/React.createElement("p", {
    className: "text-xl font-bold",
    style: {
      color: '#3D2E3D'
    }
  }, actions[currentAction]?.text), detected && /*#__PURE__*/React.createElement("p", {
    className: "text-green-500 font-bold mt-2"
  }, "\u2713 \u68C0\u6D4B\u5230!")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-6"
  }, actions.map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `w-3 h-3 rounded-full ${i < currentAction ? 'bg-green-400' : i === currentAction ? 'bg-quest-purple' : 'bg-gray-200'}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "relative w-64 h-48 rounded-2xl overflow-hidden mb-4",
    style: {
      background: '#000'
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    className: "w-full h-full object-cover",
    playsInline: true,
    muted: true
  }), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: "absolute inset-0 w-full h-full",
    width: 320,
    height: 240
  }), !cameraReady && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-center justify-center text-white text-sm"
  }, "\u6B63\u5728\u542F\u52A8\u6444\u50CF\u5934...")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleSkip,
    className: "px-6 py-3 rounded-2xl font-medium",
    style: {
      background: '#F5EEEE',
      color: '#9B8FA0'
    }
  }, "\u8DF3\u8FC7 (", skipCount, "/3)"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "px-6 py-3 rounded-2xl font-bold text-white",
    style: {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    }
  }, "\u7EE7\u7EED\u5B66\u4E60")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-4",
    style: {
      color: '#AAABB9'
    }
  }, "\uD83D\uDCA1 \u59FF\u6001\u68C0\u6D4B\u9700\u8981\u6444\u50CF\u5934\u6743\u9650\uFF0C\u4E5F\u53EF\u4EE5\u70B9\u51FB\u8DF3\u8FC7"));
};
const WordGarden = ({
  playerData,
  addXP,
  onLearnWord,
  customWords,
  dailyLogs,
  onOpenWordDetail,
  updatePlayer,
  updateTodayLog,
  wordProgress
}) => {
  const [mode, setMode] = useState('curriculum'); // 'curriculum' | 'custom'
  const [gradeKey, setGradeKey] = useState('primary1');
  const [showFlip, setShowFlip] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showGradeMenu, setShowGradeMenu] = useState(false);
  const [spellingPrompt, setSpellingPrompt] = useState(false);
  const [showSpelling, setShowSpelling] = useState(false);
  const [viewedWords, setViewedWords] = useState(new Set());
  const {
    words: currWords,
    loading
  } = useCurriculumVocab(mode === 'curriculum' ? gradeKey : null);
  const currentGradeInfo = CURRICULUM_BANKS.find(b => b.key === gradeKey) || CURRICULUM_BANKS[0];
  const isMiddleOrHigh = gradeKey.startsWith('junior') || gradeKey.startsWith('senior');
  const allWords = mode === 'custom' ? customWords : currWords;
  const dailyWords = mode === 'custom' ? customWords : (() => {
    if (currWords.length === 0) return [];
    const today = getTodayStr();
    const log = dailyLogs[today] || {};
    const limit = 20 + (log.extraLimit || 0);

    // Find review words (Ebbinghaus)
    let reviewWords = [];
    if (wordProgress) {
      const now = Date.now();
      const toReview = Object.keys(wordProgress).filter(en => now >= wordProgress[en].nextReview);
      reviewWords = currWords.filter(w => toReview.includes(w.en)).slice(0, limit);
    }
    const remaining = limit - reviewWords.length;
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const selected = [];
    const used = new Set();
    const reviewEn = new Set(reviewWords.map(w => w.en));
    for (let i = 0; i < currWords.length && selected.length < remaining; i++) {
      const idx = (seed * (i + 1) * 7 + i * 13) % currWords.length;
      if (!used.has(idx) && !reviewEn.has(currWords[idx].en)) {
        used.add(idx);
        selected.push(currWords[idx]);
      }
    }
    return [...reviewWords, ...selected];
  })();
  const words = showAll || mode === 'custom' ? allWords : dailyWords;
  const taskComplete = isDailyTaskComplete(dailyLogs);

  // 当用户查看了所有今日单词（初高中），弹出拼写邀请
  const handleOpenDetail = word => {
    if (onOpenWordDetail) onOpenWordDetail(word);
    if (isMiddleOrHigh && mode === 'curriculum' && !showAll) {
      const newViewed = new Set(viewedWords);
      newViewed.add(word.en);
      setViewedWords(newViewed);
      if (newViewed.size >= words.length && words.length > 0 && !spellingPrompt && !showSpelling) {
        setTimeout(() => setSpellingPrompt(true), 800);
      }
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-up"
  }, spellingPrompt && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center px-4",
    style: {
      background: 'rgba(61,46,61,0.5)',
      backdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-3xl p-7 shadow-2xl bounce-in",
    style: {
      background: '#FAF3F3'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-4xl text-center mb-3"
  }, "\u270D\uFE0F"), /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold text-center mb-2",
    style: {
      color: '#3D2E3D'
    }
  }, "\u4ECA\u65E5\u5355\u8BCD\u5B66\u5B8C\u5566\uFF01"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-center mb-6",
    style: {
      color: '#9B8FA0'
    }
  }, "\u8981\u8FDB\u884C", /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: '#745B72'
    }
  }, "\u62FC\u5199\u7EC3\u4E60"), "\u6765\u5DE9\u56FA\u4ECA\u5929\u5B66\u7684\u5355\u8BCD\u5417\uFF1F"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSpellingPrompt(false),
    className: "flex-1 py-3 rounded-2xl font-medium text-sm",
    style: {
      background: '#F5EEEE',
      color: '#9B8FA0'
    }
  }, "\u7A0D\u540E\u518D\u8BF4"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSpellingPrompt(false);
      setShowSpelling(true);
    },
    className: "flex-1 py-3 rounded-2xl font-bold text-white text-sm shadow-md",
    style: {
      background: 'linear-gradient(135deg,#745B72,#5C7995)'
    }
  }, "\u5F00\u59CB\u62FC\u5199 \u270D\uFE0F")))), showSpelling && /*#__PURE__*/React.createElement(SpellingPractice, {
    words: words,
    onClose: () => setShowSpelling(false),
    addXP: addXP
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMode('curriculum');
      setShowFlip(false);
    },
    className: `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${mode === 'curriculum' ? 'text-white shadow-md' : 'bg-white'}`,
    style: mode === 'curriculum' ? {
      background: 'linear-gradient(135deg, #745B72, #5C7995)',
      color: '#FAF3F3'
    } : {
      color: '#9B8FA0'
    }
  }, "\uD83D\uDCDA \u8BFE\u7A0B\u6807\u51C6\u8BCD\u5E93"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMode('custom');
      setShowFlip(false);
    },
    className: `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${mode === 'custom' ? 'text-white shadow-md' : 'bg-white'}`,
    style: mode === 'custom' ? {
      background: 'linear-gradient(135deg, #5C7995, #AAABB9)',
      color: '#fff'
    } : {
      color: '#9B8FA0'
    }
  }, "\u270F\uFE0F \u6211\u7684\u5355\u8BCD")), mode === 'curriculum' && /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowGradeMenu(v => !v),
    className: "w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white shadow-card font-medium text-sm",
    style: {
      color: '#3D2E3D'
    }
  }, /*#__PURE__*/React.createElement("span", null, currentGradeInfo.emoji, " ", currentGradeInfo.label), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: '#9B8FA0'
    }
  }, showGradeMenu ? '▲ 收起' : '▼ 选择年级')), showGradeMenu && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 bg-white rounded-2xl shadow-card p-3 grid grid-cols-3 gap-2"
  }, CURRICULUM_BANKS.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.key,
    onClick: () => {
      setGradeKey(b.key);
      setShowGradeMenu(false);
      setShowAll(false);
      setShowFlip(false);
      setViewedWords(new Set());
      setSpellingPrompt(false);
    },
    className: "py-2 px-1 rounded-xl text-xs font-medium transition-all text-center",
    style: gradeKey === b.key ? {
      background: 'linear-gradient(135deg, #745B72, #5C7995)',
      color: '#FAF3F3'
    } : {
      background: '#F5EEEE',
      color: '#3D2E3D'
    }
  }, b.emoji, /*#__PURE__*/React.createElement("br", null), b.label)))), mode === 'curriculum' && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between rounded-2xl p-3",
    style: {
      background: 'rgba(230,188,188,0.18)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, taskComplete ? '✅' : '📅'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold",
    style: {
      color: '#3D2E3D'
    }
  }, loading ? '加载中…' : taskComplete ? '今日任务已完成！' : `今日单词 · ${currentGradeInfo.label}`), /*#__PURE__*/React.createElement("p", {
    className: "text-xs",
    style: {
      color: '#9B8FA0'
    }
  }, loading ? '' : taskComplete ? '明天将更新新单词' : `共 ${allWords.length} 词，每日${20 + ((dailyLogs[getTodayStr()] || {}).extraLimit || 0)}个`))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAll(v => !v),
    className: "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
    style: showAll ? {
      background: '#5C7995',
      color: '#fff'
    } : {
      background: '#fff',
      color: '#745B72',
      border: '1px solid #E6BCBC'
    }
  }, showAll ? '📅 今日单词' : '📚 全部单词')), taskComplete && !showAll && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 p-3 rounded-2xl bg-white shadow-sm border flex flex-col items-center",
    style: {
      borderColor: '#F5EEEE'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold mb-2",
    style: {
      color: '#745B72'
    }
  }, "\u60F3\u8981\u7EE7\u7EED\u6311\u6218\u5417\uFF1F\u9009\u62E9\u52A0\u91CF\u5B66\u4E60\uFF1A"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, [10, 15, 20].map(amount => /*#__PURE__*/React.createElement("button", {
    key: amount,
    onClick: () => {
      if (updateTodayLog) {
        updateTodayLog(log => ({
          ...log,
          extraLimit: (log.extraLimit || 0) + amount
        }));
      }
    },
    className: "px-3 py-1 rounded-full text-xs font-medium bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 border border-gray-200"
  }, "+", amount, " \u8BCD"))))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16",
    style: {
      color: '#9B8FA0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-4xl mb-3 animate-spin"
  }, "\u23F3"), /*#__PURE__*/React.createElement("p", null, "\u6B63\u5728\u52A0\u8F7D\u8BCD\u6C47\u2026")) : words.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16",
    style: {
      color: '#9B8FA0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-3"
  }, "\uD83D\uDCED"), /*#__PURE__*/React.createElement("p", null, mode === 'custom' ? '还没有自定义单词哦，去成就馆添加吧！' : '暂无词汇数据')) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "word-grid grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6"
  }, words.map((word, i) => /*#__PURE__*/React.createElement("div", {
    key: word.en + i,
    style: {
      animationDelay: i * 0.04 + 's'
    },
    className: "bounce-in-sm"
  }, /*#__PURE__*/React.createElement(WordCard, {
    word: word,
    onLearn: onLearnWord,
    onOpenDetail: handleOpenDetail,
    addXP: addXP,
    updatePlayer: updatePlayer
  })))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-3xl p-5 mb-2",
    style: {
      background: 'linear-gradient(135deg, #745B72, #8A6888)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-white text-lg"
  }, "\uD83E\uDDE9 \u7FFB\u724C\u914D\u5BF9\u6311\u6218"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-0.5",
    style: {
      color: '#E6BCBC'
    }
  }, "\u5B8C\u6210\u540E\u83B7\u5F97 +20 XP\uFF01")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowFlip(v => !v),
    className: "px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md",
    style: {
      background: '#5C7995',
      color: '#FAF3F3'
    }
  }, showFlip ? '收起游戏' : '开始游戏 🎮')), showFlip && words.length >= 6 && /*#__PURE__*/React.createElement(FlipGame, {
    words: words,
    onComplete: () => {},
    addXP: addXP
  }), showFlip && words.length < 6 && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 text-sm",
    style: {
      color: '#E6BCBC'
    }
  }, "\u9700\u8981\u81F3\u5C11 6 \u4E2A\u5355\u8BCD\u624D\u80FD\u5F00\u59CB\u7FFB\u724C\u6E38\u620F\u54E6\uFF5E")), isMiddleOrHigh && mode === 'curriculum' && /*#__PURE__*/React.createElement("div", {
    className: "rounded-3xl p-5 mt-3",
    style: {
      background: 'linear-gradient(135deg,#5C7995,#8A9BB5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-white text-lg"
  }, "\u270D\uFE0F \u62FC\u5199\u7EC3\u4E60"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-0.5",
    style: {
      color: '#E6BCBC'
    }
  }, "\u62FC\u5BF9\u4E00\u8BCD\u5F97 +3 XP")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowSpelling(true),
    className: "px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md",
    style: {
      background: '#FAF3F3',
      color: '#745B72'
    }
  }, "\u5F00\u59CB\u62FC\u5199 \u270D\uFE0F")))));
};

// =============================================
// Tab2: 句子任务
// =============================================
const SentenceCard = ({
  sentence,
  idx
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [shake, setShake] = useState(false);
  const words = sentence.en.split(' ');

  // 随机打乱选项，避免正确答案总是在第一个
  const shuffledOptions = useMemo(() => shuffle(sentence.options), [sentence.options]);
  const handleSpeak = () => {
    setSpeaking(true);
    speak(sentence.en);
    setTimeout(() => setSpeaking(false), 2500);
  };
  const handleAnswer = opt => {
    setAnswer(opt);
    const correct = opt === sentence.blank;
    playSound(correct ? 'correct' : 'wrong');
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-5 shadow-card mb-4 bounce-in",
    style: {
      animationDelay: idx * 0.07 + 's'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-3 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-1 self-stretch rounded-full flex-shrink-0",
    style: {
      background: 'linear-gradient(180deg, #5C7995, #D49DAA)',
      minHeight: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-base font-semibold text-quest-dark leading-relaxed"
  }, words.map((w, i) => {
    const clean = w.replace(/[.,!?]/, '');
    if (clean === sentence.blank) {
      return /*#__PURE__*/React.createElement("span", {
        key: i
      }, answer ? /*#__PURE__*/React.createElement("span", {
        className: `px-1.5 py-0.5 rounded font-bold ${answer === sentence.blank ? 'bg-quest-green text-white' : 'bg-quest-coral text-white'}`
      }, answer) : /*#__PURE__*/React.createElement("span", {
        className: "px-3 py-0.5 rounded border-b-2 border-quest-orange text-quest-orange font-bold bg-orange-50"
      }, "____"), w.slice(clean.length), ' ');
    }
    return /*#__PURE__*/React.createElement("span", {
      key: i
    }, w, " ");
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-quest-muted mt-1.5"
  }, sentence.zh)), /*#__PURE__*/React.createElement("button", {
    onClick: handleSpeak,
    className: `flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${speaking ? 'bg-quest-teal text-white scale-90' : 'bg-quest-mint text-quest-teal hover:bg-quest-teal hover:text-white'}`
  }, "\uD83D\uDD0A")), /*#__PURE__*/React.createElement("div", {
    className: `grid grid-cols-2 gap-2 mt-3 ${shake ? 'shake' : ''}`
  }, shuffledOptions.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt,
    onClick: () => handleAnswer(opt),
    disabled: !!answer,
    className: `option-btn py-2.5 px-3 rounded-2xl text-sm font-medium bg-gray-50 text-quest-dark
                            ${answer === opt && opt === sentence.blank ? 'correct correct-bounce' : ''}
                            ${answer === opt && opt !== sentence.blank ? 'wrong' : ''}
                            ${answer && opt === sentence.blank && answer !== opt ? 'reveal' : ''}
                            disabled:cursor-default`
  }, opt))), answer && /*#__PURE__*/React.createElement("div", {
    className: `mt-3 text-sm rounded-2xl px-4 py-2 font-medium ${answer === sentence.blank ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-quest-orange'}`
  }, answer === sentence.blank ? '✅ 太棒了！答对了！' : `💡 正确答案是：${sentence.blank}，加油！`));
};
const SentenceQuest = () => {
  const [level, setLevel] = useState('easy');
  const filtered = useMemo(() => SENTENCES.filter(s => s.level === level), [level]);
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 mb-5"
  }, [{
    k: 'easy',
    l: '简单句',
    e: '🐣'
  }, {
    k: 'medium',
    l: '进阶句',
    e: '🦅'
  }].map(b => /*#__PURE__*/React.createElement("button", {
    key: b.k,
    onClick: () => setLevel(b.k),
    className: `flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${level === b.k ? 'text-white shadow-md' : 'bg-white text-quest-muted hover:bg-quest-mint'}`,
    style: level === b.k ? {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    } : {}
  }, b.e, " ", b.l))), filtered.map((s, i) => /*#__PURE__*/React.createElement(SentenceCard, {
    key: s.en,
    sentence: s,
    idx: i
  })));
};

// =============================================
// Tab3: 挑战模式
// =============================================
const ChallengeMode = ({
  allWords,
  addXP,
  onPerfect
}) => {
  const [phase, setPhase] = useState('intro');
  const [quiz, setQuiz] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [answers, setAnswers] = useState([]);
  const encMap = {
    zh2en: '看中文选英文',
    emoji2en: '看图猜单词',
    en2zh: '看英文选中文'
  };

  // 随机生成题目
  const generateQuiz = useCallback(words => {
    if (words.length < 4) return [];
    const types = ['en2zh', 'zh2en', 'emoji2en'];
    const list = [];
    const pool = [...words];

    // 辅助函数：洗牌算法打乱数组
    const shuffleOptions = arr => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };
    for (let i = 0; i < 5; i++) {
      const word = pool[Math.floor(Math.random() * pool.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const others = pool.filter(w => w.en !== word.en).sort(() => 0.5 - Math.random()).slice(0, 3);
      let q = {
        type,
        word,
        answer: '',
        options: []
      };
      if (type === 'en2zh') {
        q.question = word.en;
        q.answer = word.zh;
        q.options = shuffleOptions([word.zh, ...others.map(w => w.zh)]);
      } else if (type === 'zh2en') {
        q.question = word.zh;
        q.answer = word.en;
        q.options = shuffleOptions([word.en, ...others.map(w => w.en)]);
      } else {
        q.question = word.emoji;
        q.answer = word.en;
        q.options = shuffleOptions([word.en, ...others.map(w => w.en)]);
      }
      list.push(q);
    }
    return list;
  }, []);
  const startQuiz = () => {
    const fallback = [...WORD_BANKS.primary1, ...WORD_BANKS.primary2];
    const q = generateQuiz(allWords.length >= 5 ? allWords : fallback);
    setQuiz(q);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setPhase('playing');
  };
  const handleSelect = opt => {
    if (selected) return;
    setSelected(opt);
    const q = quiz[current];
    const correct = opt === q.answer;
    playSound(correct ? 'correct' : 'wrong');
    if (correct) {
      addXP(10);
      setScore(s => s + 1);
    }
    setAnswers(prev => [...prev, correct]);
    if (current < 4) {
      setTimeout(() => {
        setCurrent(c => c + 1);
        setSelected(null);
      }, 1200);
    } else {
      setTimeout(() => {
        setPhase('result');
        const finalScore = score + (correct ? 1 : 0);
        if (finalScore === 5) {
          setCelebrate(true);
          onPerfect();
        }
      }, 1200);
    }
  };
  const finalScore = answers.filter(Boolean).length;
  const stars = finalScore >= 5 ? 3 : finalScore >= 3 ? 2 : 1;
  if (phase === 'intro') return /*#__PURE__*/React.createElement("div", {
    className: "slide-up flex flex-col items-center justify-center min-h-[60vh] text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-6xl mb-4 bounce-in"
  }, "\u2694\uFE0F"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-quest-dark mb-2"
  }, "\u6311\u6218\u6A21\u5F0F"), /*#__PURE__*/React.createElement("p", {
    className: "text-quest-muted mb-8 max-w-xs"
  }, "5 \u9898\u95EF\u5173\uFF0C\u7B54\u5BF9\u5F97 XP\uFF0C\u5168\u5BF9\u89E3\u9501\u5FBD\u7AE0\uFF01\u6BCF\u6B21\u90FD\u662F\u5168\u65B0\u6311\u6218\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-4 mb-8"
  }, [['zh2en', '👁️', '看中选英'], ['emoji2en', '🖼️', '看图猜词'], ['en2zh', '🔤', '看英选中']].map(([k, e, l]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "bg-white rounded-2xl p-3 shadow-card text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl mb-1"
  }, e), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-quest-muted font-medium"
  }, l)))), /*#__PURE__*/React.createElement("button", {
    onClick: startQuiz,
    className: "px-10 py-4 rounded-full text-white font-bold text-lg shadow-glow-orange hover:scale-105 transition-all",
    style: {
      background: 'linear-gradient(135deg, #5C7995, #745B72)'
    }
  }, "\u5F00\u59CB\u6311\u6218 \uD83D\uDE80"));
  if (phase === 'result') return /*#__PURE__*/React.createElement("div", {
    className: "slide-up flex flex-col items-center justify-center min-h-[60vh] text-center"
  }, celebrate && /*#__PURE__*/React.createElement(CelebrationEffect, {
    onDone: () => setCelebrate(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-5xl mb-4"
  }, [1, 2, 3].map(s => /*#__PURE__*/React.createElement("span", {
    key: s,
    className: `star-pop inline-block mr-1`,
    style: {
      animationDelay: s * 0.2 + 's',
      filter: s <= stars ? 'none' : 'grayscale(1) opacity(0.3)'
    }
  }, "\u2B50"))), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-quest-dark mb-1"
  }, finalScore === 5 ? '完美！太厉害了！' : finalScore >= 3 ? '很不错！继续加油！' : '没关系，再来一次！'), /*#__PURE__*/React.createElement("p", {
    className: "text-quest-muted mb-2"
  }, "\u7B54\u5BF9 ", finalScore, " / 5 \u9898"), /*#__PURE__*/React.createElement("p", {
    className: "text-quest-orange font-bold mb-8"
  }, "+", finalScore * 10, " XP \u5DF2\u83B7\u5F97\uFF01"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4"
  }, answers.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${a ? 'bg-quest-green' : 'bg-quest-coral'}`
  }, a ? '✓' : '✗'))), /*#__PURE__*/React.createElement("button", {
    onClick: startQuiz,
    className: "mt-8 px-8 py-3 rounded-full text-white font-bold shadow-md hover:scale-105 transition-all",
    style: {
      background: 'linear-gradient(135deg, #5C7995, #745B72)'
    }
  }, "\u518D\u6765\u4E00\u5173 \uD83D\uDD04"));
  const q = quiz[current];
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center gap-3 mb-6"
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `quiz-dot w-3 h-3 rounded-full ${i < current ? 'done' : i === current ? 'current' : 'pending bg-gray-200'}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-3xl p-6 mb-5 text-center",
    style: {
      background: 'linear-gradient(135deg, #745B72, #8A6888)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs mb-3 font-medium tracking-wider uppercase",
    style: {
      color: '#E6BCBC'
    }
  }, encMap[q.type]), q.type === 'emoji2en' ? /*#__PURE__*/React.createElement("div", {
    className: "text-7xl mb-2"
  }, q.question) : /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-white mb-2"
  }, q.question), q.type === 'emoji2en' && /*#__PURE__*/React.createElement("button", {
    onClick: () => speak(q.word.en),
    className: "mt-1 text-xs hover:text-white flex items-center gap-1 mx-auto",
    style: {
      color: '#E6BCBC'
    }
  }, "\uD83D\uDD0A \u542C\u53D1\u97F3"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm mt-1",
    style: {
      color: '#E6BCBC'
    }
  }, "\u7B2C ", current + 1, " / 5 \u9898")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, q.options.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt,
    onClick: () => handleSelect(opt),
    disabled: !!selected,
    className: `option-btn py-4 px-4 rounded-2xl text-sm font-bold bg-white text-quest-dark shadow-card
                            ${selected === opt && opt === q.answer ? 'correct correct-bounce' : ''}
                            ${selected === opt && opt !== q.answer ? 'wrong shake' : ''}
                            ${selected && opt === q.answer && selected !== opt ? 'reveal' : ''}
                            disabled:cursor-default`
  }, opt))), selected && /*#__PURE__*/React.createElement("div", {
    className: `mt-4 text-sm rounded-2xl px-4 py-3 text-center font-medium bounce-in-sm ${selected === q.answer ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-quest-orange'}`
  }, selected === q.answer ? '🎉 答对了！+10 XP' : ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]));
};

// =============================================
// Tab4: 成就馆
// =============================================
const AchievementHub = ({
  playerData,
  badges,
  customWords,
  onAddWord,
  onDeleteWord,
  addXP
}) => {
  const [newWord, setNewWord] = useState({
    en: '',
    zh: '',
    emoji: '',
    partOfSpeech: 'noun',
    pronunciation: '',
    example: '',
    category: 'general'
  });
  const [adding, setAdding] = useState(false);
  const {
    level
  } = calcLevel(playerData.xp);
  const correctRate = playerData.totalAnswers > 0 ? Math.round(playerData.correctAnswers / playerData.totalAnswers * 100) : 0;
  const handleAdd = () => {
    if (!newWord.en.trim() || !newWord.zh.trim()) return;
    const word = {
      en: newWord.en.trim().toLowerCase(),
      zh: newWord.zh.trim(),
      emoji: newWord.emoji.trim() || '📝',
      partOfSpeech: newWord.partOfSpeech,
      pronunciation: newWord.pronunciation.trim() || newWord.en.trim().toLowerCase(),
      example: newWord.example.trim() || `${newWord.en} is a new word I learned.`,
      category: newWord.category,
      sentence: `${newWord.en} is a new word I learned.`
    };
    onAddWord(word);
    addXP(5);
    setNewWord({
      en: '',
      zh: '',
      emoji: '',
      partOfSpeech: 'noun',
      pronunciation: '',
      example: '',
      category: 'general'
    });
    setAdding(false);
  };
  const handleExport = () => {
    const dataStr = JSON.stringify(customWords, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `englishquest_words_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  const handleImport = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          imported.forEach(word => {
            const validWord = {
              en: word.en || '',
              zh: word.zh || '',
              emoji: word.emoji || '📝',
              partOfSpeech: word.partOfSpeech || 'noun',
              pronunciation: word.pronunciation || word.en || '',
              example: word.example || `${word.en || ''} is a new word I learned.`,
              category: word.category || 'general',
              sentence: word.sentence || `${word.en || ''} is a new word I learned.`
            };
            if (validWord.en && validWord.zh) {
              onAddWord(validWord);
            }
          });
          addXP(imported.length * 2); // 奖励XP
          alert(`成功导入 ${imported.length} 个单词！`);
        } else {
          alert('导入失败：文件格式不正确');
        }
      } catch (err) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-up space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-3xl p-5 text-white",
    style: {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm",
    style: {
      color: '#E6BCBC'
    }
  }, "\u4ECA\u65E5\u5B66\u4E60\u6982\u89C8"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-lg"
  }, new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold"
  }, playerData.streak), /*#__PURE__*/React.createElement("p", {
    className: "text-xs flex items-center gap-1 justify-end",
    style: {
      color: '#E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flame"
  }, "\uD83D\uDD25"), "\u8FDE\u7EED\u6253\u5361"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, [{
    label: '已学单词',
    value: playerData.totalWordsLearned,
    icon: '📚'
  }, {
    label: '答题正确率',
    value: correctRate + '%',
    icon: '🎯'
  }, {
    label: '当前等级',
    value: 'Lv.' + level,
    icon: '⭐'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    className: "bg-white/15 rounded-2xl p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl mb-1"
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-lg"
  }, s.value), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: '#E6BCBC'
    }
  }, s.label))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-5 shadow-card"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-quest-dark text-base mb-4 flex items-center gap-2"
  }, "\uD83C\uDFC5 \u6210\u5C31\u5FBD\u7AE0"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-3"
  }, BADGES.map(badge => {
    const unlocked = badges.includes(badge.id);
    return /*#__PURE__*/React.createElement("div", {
      key: badge.id,
      title: unlocked ? '已解锁！' : `解锁条件：${badge.desc}`,
      className: `rounded-2xl p-3 text-center transition-all ${unlocked ? 'bg-quest-lavender shadow-sm' : 'bg-gray-50 badge-locked'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: `text-3xl mb-1 ${unlocked ? '' : 'grayscale'}`
    }, badge.emoji), /*#__PURE__*/React.createElement("div", {
      className: `font-bold text-xs ${unlocked ? 'text-quest-purple' : 'text-gray-400'}`
    }, badge.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-gray-400 mt-0.5"
    }, badge.desc), unlocked && /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-xs text-quest-teal font-medium"
    }, "\u2713 \u5DF2\u89E3\u9501"));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-5 shadow-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-quest-dark text-base flex items-center gap-2"
  }, "\u270F\uFE0F \u6211\u7684\u5355\u8BCD\u672C"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleExport,
    className: "px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105",
    style: {
      background: 'linear-gradient(135deg, #8A6888, #745B72)'
    }
  }, "\uD83D\uDCE4 \u5BFC\u51FA"), /*#__PURE__*/React.createElement("label", {
    className: "px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105 cursor-pointer",
    style: {
      background: 'linear-gradient(135deg, #AAABB9, #8A9BB5)'
    }
  }, "\uD83D\uDCE5 \u5BFC\u5165", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json",
    onChange: handleImport,
    className: "hidden"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdding(v => !v),
    className: "px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105",
    style: {
      background: 'linear-gradient(135deg, #5C7995, #D49DAA)'
    }
  }, adding ? '取消' : '+ 添加'))), adding && /*#__PURE__*/React.createElement("div", {
    className: "bounce-in-sm bg-quest-lavender rounded-2xl p-4 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("input", {
    value: newWord.en,
    onChange: e => setNewWord(p => ({
      ...p,
      en: e.target.value
    })),
    placeholder: "\u82F1\u6587 (apple)",
    className: "col-span-2 px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }), /*#__PURE__*/React.createElement("input", {
    value: newWord.zh,
    onChange: e => setNewWord(p => ({
      ...p,
      zh: e.target.value
    })),
    placeholder: "\u4E2D\u6587 (\u82F9\u679C)",
    className: "col-span-2 px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }), /*#__PURE__*/React.createElement("input", {
    value: newWord.emoji,
    onChange: e => setNewWord(p => ({
      ...p,
      emoji: e.target.value
    })),
    placeholder: "\u8868\u60C5 (\uD83C\uDF4E)",
    className: "px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }), /*#__PURE__*/React.createElement("select", {
    value: newWord.partOfSpeech,
    onChange: e => setNewWord(p => ({
      ...p,
      partOfSpeech: e.target.value
    })),
    className: "px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }, /*#__PURE__*/React.createElement("option", {
    value: "noun"
  }, "\u540D\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "verb"
  }, "\u52A8\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "adjective"
  }, "\u5F62\u5BB9\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "adverb"
  }, "\u526F\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "preposition"
  }, "\u4ECB\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "conjunction"
  }, "\u8FDE\u8BCD"), /*#__PURE__*/React.createElement("option", {
    value: "other"
  }, "\u5176\u4ED6")), /*#__PURE__*/React.createElement("input", {
    value: newWord.pronunciation,
    onChange: e => setNewWord(p => ({
      ...p,
      pronunciation: e.target.value
    })),
    placeholder: "\u97F3\u6807 (\xE6pl)",
    className: "px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }), /*#__PURE__*/React.createElement("select", {
    value: newWord.category,
    onChange: e => setNewWord(p => ({
      ...p,
      category: e.target.value
    })),
    className: "px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  }, /*#__PURE__*/React.createElement("option", {
    value: "general"
  }, "\u901A\u7528"), /*#__PURE__*/React.createElement("option", {
    value: "food"
  }, "\u98DF\u7269"), /*#__PURE__*/React.createElement("option", {
    value: "animal"
  }, "\u52A8\u7269"), /*#__PURE__*/React.createElement("option", {
    value: "family"
  }, "\u5BB6\u5EAD"), /*#__PURE__*/React.createElement("option", {
    value: "school"
  }, "\u5B66\u6821"), /*#__PURE__*/React.createElement("option", {
    value: "sports"
  }, "\u8FD0\u52A8"), /*#__PURE__*/React.createElement("option", {
    value: "travel"
  }, "\u65C5\u884C")), /*#__PURE__*/React.createElement("input", {
    value: newWord.example,
    onChange: e => setNewWord(p => ({
      ...p,
      example: e.target.value
    })),
    placeholder: "\u4F8B\u53E5 (I eat an apple every day.)",
    className: "col-span-2 px-3 py-2 rounded-xl border border-white text-sm bg-white outline-none focus:border-quest-orange"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleAdd,
    className: "w-full py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all",
    style: {
      background: 'linear-gradient(135deg, #745B72, #5C7995)'
    }
  }, "\u4FDD\u5B58\u5355\u8BCD (+5 XP)")), customWords.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-quest-muted py-6 text-sm"
  }, "\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u5355\u8BCD\uFF0C\u5FEB\u53BB\u6DFB\u52A0\u7B2C\u4E00\u4E2A\u5427\uFF01") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, customWords.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w.en + i,
    className: "bg-gray-50 rounded-2xl p-3 hover:bg-gray-100 transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl"
  }, w.emoji), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-quest-dark text-sm"
  }, w.en), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-purple bg-quest-lavender px-1.5 py-0.5 rounded-full"
  }, w.partOfSpeech), w.category && w.category !== 'general' && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-teal bg-mint/50 px-1.5 py-0.5 rounded-full"
  }, w.category)), /*#__PURE__*/React.createElement("div", {
    className: "text-quest-muted text-xs mb-1"
  }, w.zh), w.pronunciation && w.pronunciation !== w.en && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-quest-coral mb-1"
  }, "/", w.pronunciation, "/"), w.example && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-quest-orange italic mb-1"
  }, "\"", w.example, "\"")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => speak(w.en),
    className: "text-quest-teal hover:scale-110 transition-all text-sm",
    title: "\u6717\u8BFB"
  }, "\uD83D\uDD0A"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onDeleteWord(i),
    className: "text-quest-coral hover:scale-110 transition-all text-lg leading-none",
    title: "\u5220\u9664"
  }, "\xD7"))))))));
};

// =============================================
// Tab5: 学习日历
// =============================================
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const LearningCalendar = ({
  dailyLogs
}) => {
  const today = new Date();
  const todayStr = getTodayStr();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(null); // dateStr or null

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };
  const monthLabel = `${viewYear} 年 ${viewMonth + 1} 月`;

  // 本月统计
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthEntries = Object.entries(dailyLogs).filter(([d]) => d.startsWith(monthPrefix));
  const monthCheckedDays = monthEntries.filter(([, v]) => v.checked).length;
  const monthXP = monthEntries.reduce((sum, [, v]) => sum + (v.xp || 0), 0);
  const monthWords = monthEntries.reduce((sum, [, v]) => sum + (v.words || 0), 0);

  // 当前连续打卡（从今天往前）
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (dailyLogs[ds]?.checked) streak++;else if (i > 0) break; // 今天未打卡允许继续，但昨天断了就停
  }
  const selectedLog = selectedDay ? dailyLogs[selectedDay] || null : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-up space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-3xl p-5 text-white",
    style: {
      background: 'linear-gradient(135deg, #745B72, #8A6888)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs",
    style: {
      color: '#E6BCBC'
    }
  }, "\u672C\u6708\u5B66\u4E60\u6982\u89C8"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-base"
  }, monthLabel)), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-bold"
  }, streak), /*#__PURE__*/React.createElement("p", {
    className: "text-xs flex items-center gap-1 justify-end",
    style: {
      color: '#E6BCBC'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flame"
  }, "\uD83D\uDD25"), "\u8FDE\u7EED\u6253\u5361"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, [{
    icon: '✅',
    val: monthCheckedDays + ' 天',
    label: '打卡天数'
  }, {
    icon: '⭐',
    val: '+' + monthXP + ' XP',
    label: '本月获得'
  }, {
    icon: '📚',
    val: monthWords + ' 词',
    label: '学习单词'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    className: "bg-white/15 rounded-2xl p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg mb-0.5"
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-sm"
  }, s.val), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: '#E6BCBC'
    }
  }, s.label))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-4 shadow-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevMonth,
    className: "w-8 h-8 rounded-full bg-quest-lavender text-quest-purple flex items-center justify-center font-bold text-base hover:bg-quest-orange hover:text-white transition-all"
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-quest-dark text-base"
  }, monthLabel), /*#__PURE__*/React.createElement("button", {
    onClick: nextMonth,
    disabled: viewYear === today.getFullYear() && viewMonth === today.getMonth(),
    className: "w-8 h-8 rounded-full bg-quest-lavender text-quest-purple flex items-center justify-center font-bold text-base hover:bg-quest-orange hover:text-white transition-all disabled:opacity-30 disabled:cursor-default"
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 mb-2"
  }, WEEK_LABELS.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w,
    className: `text-center text-xs font-bold pb-1 ${i === 0 ? 'text-quest-coral' : i === 6 ? 'text-quest-teal' : 'text-quest-muted'}`
  }, w))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-1"
  }, Array.from({
    length: firstDay
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: 'e' + i
  })), Array.from({
    length: daysInMonth
  }, (_, i) => i + 1).map(day => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = dailyLogs[dateStr];
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isChecked = log?.checked;
    const hasData = log && (log.xp > 0 || log.words > 0);
    const isSelected = selectedDay === dateStr;
    const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: day,
      className: `cal-day
                                    ${isChecked ? 'checked' : hasData ? 'has-data' : ''}
                                    ${isToday ? 'today' : ''}
                                    ${isFuture ? 'future' : ''}
                                    ${isSelected ? 'ring-2 ring-quest-orange ring-offset-1' : ''}
                                `,
      style: !isChecked && !hasData ? {
        background: '#F5EEEE'
      } : {},
      onClick: () => !isFuture && setSelectedDay(isSelected ? null : dateStr)
    }, /*#__PURE__*/React.createElement("span", {
      className: `cal-day-num ${isWeekend && !isChecked ? new Date(dateStr).getDay() === 0 ? 'text-quest-coral' : 'text-quest-teal' : isChecked ? 'text-white' : 'text-quest-dark'}`
    }, day), isChecked && /*#__PURE__*/React.createElement("span", {
      className: "cal-day-dot bg-white/70"
    }), !isChecked && hasData && /*#__PURE__*/React.createElement("span", {
      className: "cal-day-dot",
      style: {
        background: '#5C7995'
      }
    }), isChecked && log?.xp > 0 && /*#__PURE__*/React.createElement("span", {
      className: "cal-day-xp text-white/80"
    }, "+", log.xp));
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap"
  }, [{
    color: 'linear-gradient(135deg,#745B72,#5C7995)',
    label: '已打卡'
  }, {
    color: 'linear-gradient(135deg,#E6BCBC,#D49DAA)',
    label: '有记录',
    border: '1px solid #D49DAA'
  }, {
    color: '#F5EEEE',
    label: '未学习',
    border: '1px solid #E6BCBC'
  }].map(l => /*#__PURE__*/React.createElement("div", {
    key: l.label,
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-md flex-shrink-0",
    style: {
      background: l.color,
      border: l.border
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-quest-muted"
  }, l.label))))), selectedDay && /*#__PURE__*/React.createElement("div", {
    className: "day-detail-modal bg-white rounded-3xl p-5 shadow-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-quest-muted"
  }, selectedDay), /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-quest-dark text-base"
  }, selectedLog?.checked ? '✅ 已打卡' : '📋 学习记录')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedDay(null),
    className: "text-quest-muted text-2xl leading-none hover:text-quest-coral"
  }, "\xD7")), selectedLog ? /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, [{
    icon: '⭐',
    val: '+' + (selectedLog.xp || 0) + ' XP',
    label: '获得经验'
  }, {
    icon: '📚',
    val: (selectedLog.words || 0) + ' 词',
    label: '学习单词'
  }, {
    icon: '🎯',
    val: (selectedLog.correct || 0) + ' / ' + (selectedLog.answers || 0),
    label: '答题正确'
  }, {
    icon: '⏱️',
    val: selectedLog.minutes ? selectedLog.minutes + ' 分钟' : '—',
    label: '学习时长'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    className: "bg-quest-lavender rounded-2xl p-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xl mb-1"
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-quest-dark text-sm"
  }, s.val), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-quest-muted"
  }, s.label)))) : /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6 text-quest-muted"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDE34"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u8FD9\u5929\u6CA1\u6709\u5B66\u4E60\u8BB0\u5F55"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1 text-quest-orange"
  }, "\u4ECA\u5929\u53BB\u5B66\u4E60\uFF0C\u660E\u5929\u770B\u5230\u8FDB\u6B65\uFF01"))));
};

// =============================================
// 根组件 App
// =============================================
const App = () => {
  const [activeTab, setActiveTab] = useState('garden');
  const [playerData, setPlayerData] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    lastCheckIn: '',
    totalWordsLearned: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    flipGamesCompleted: 0,
    perfectQuizzes: 0,
    goodPronunciations: 0
  });
  const [badges, setBadges] = useState([]);
  const [customWords, setCustomWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [accentPreference, setAccentPreference] = useState('us');
  const [user, setUser] = useState(null); // { id, email, username }
  const [showLogin, setShowLogin] = useState(false);
  // dailyLogs: { [dateStr]: { checked, xp, words, correct, answers, minutes } }
  const [dailyLogs, setDailyLogs] = useState({});
  const [wordProgress, setWordProgress] = useState({}); // Ebbinghaus progress
  const [wordDetailPage, setWordDetailPage] = useState(null); // 当前查看的单词详情
  const [petEvent, setPetEvent] = useState(null); // 触发宠物动画的事件
  const [showBreakGame, setShowBreakGame] = useState(false); // 显示休息游戏
  const sessionStartRef = useRef(Date.now());

  // ---- Supabase 认证状态监听 ----
  useEffect(() => {
    supabase.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
      if (session?.user) {
        const u = session.user;
        // 检查是否为社交登录用户
        const provider = u.app_metadata?.provider;
        const isSocialLogin = provider && provider !== 'email';
        if (isSocialLogin && window.WheatSpaceAuth && window.WheatSpaceAuth.processSocialUser) {
          try {
            const result = await window.WheatSpaceAuth.processSocialUser(session);
            if (result.success && result.user) {
              const displayName = result.user.nickname || result.user.full_name || u.user_metadata?.nickname || u.email?.split('@')[0] || 'User';
              setUser({
                id: u.id,
                email: u.email,
                username: displayName
              });
              return;
            }
          } catch (err) {
            console.error('社交用户处理失败:', err);
          }
        }
        // 默认处理
        const displayName = u.user_metadata?.nickname || u.email?.split('@')[0] || 'User';
        setUser({
          id: u.id,
          email: u.email,
          username: displayName
        });
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        // 检查是否为社交登录用户
        const provider = u.app_metadata?.provider;
        const isSocialLogin = provider && provider !== 'email';
        if (isSocialLogin && window.WheatSpaceAuth && window.WheatSpaceAuth.processSocialUser) {
          try {
            const result = await window.WheatSpaceAuth.processSocialUser(session);
            if (result.success && result.user) {
              // 使用同步后的用户数据
              const displayName = result.user.nickname || result.user.full_name || u.user_metadata?.nickname || u.email?.split('@')[0] || 'User';
              setUser({
                id: u.id,
                email: u.email,
                username: displayName
              });
              return;
            }
          } catch (err) {
            console.error('社交用户处理失败:', err);
          }
        }
        // 默认处理（邮箱登录或社交登录处理失败）
        const displayName = u.user_metadata?.nickname || u.email?.split('@')[0] || 'User';
        setUser({
          id: u.id,
          email: u.email,
          username: displayName
        });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- 初始化：从 localStorage 读取本地数据 ----
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const pd = localStorage.getItem('eq_player');
        if (pd) setPlayerData(JSON.parse(pd) || {
          level: 1,
          xp: 0,
          coins: 0
        });
      } catch (e) {}
      try {
        const bd = localStorage.getItem('eq_badges');
        if (bd) setBadges(JSON.parse(bd) || []);
      } catch (e) {}
      try {
        const cw = localStorage.getItem('eq_custom_words');
        if (cw) setCustomWords(JSON.parse(cw) || []);
      } catch (e) {}
      try {
        const ac = localStorage.getItem('eq_accent');
        if (ac) setAccentPreference(ac);
      } catch (e) {}
      try {
        const dl = localStorage.getItem('eq_daily_logs');
        if (dl) setDailyLogs(JSON.parse(dl) || {});
      } catch (e) {}
      try {
        const wp = localStorage.getItem('eq_word_progress');
        if (wp) setWordProgress(JSON.parse(wp) || {});
      } catch (e) {}

      // 打卡逻辑
      const today = getTodayStr();
      setPlayerData(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let streak = prev.streak;
        if (prev.lastCheckIn === yesterday) streak += 1;else if (prev.lastCheckIn !== today) streak = 1;
        const updated = {
          ...prev,
          lastCheckIn: today,
          streak
        };
        localStorage.setItem('eq_player', JSON.stringify(updated));
        return updated;
      });

      // 写入今日打卡标记
      setDailyLogs(prev => {
        const next = {
          ...prev
        };
        if (!next[today]) next[today] = {
          checked: true,
          xp: 0,
          words: 0,
          correct: 0,
          answers: 0,
          minutes: 0
        };else next[today] = {
          ...next[today],
          checked: true
        };
        localStorage.setItem('eq_daily_logs', JSON.stringify(next));
        return next;
      });
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ---- 持久化本地数据 ----
  useEffect(() => {
    if (!isLoading) localStorage.setItem('eq_badges', JSON.stringify(badges));
  }, [badges, isLoading]);
  useEffect(() => {
    if (!isLoading) localStorage.setItem('eq_custom_words', JSON.stringify(customWords));
  }, [customWords, isLoading]);
  useEffect(() => {
    if (!isLoading) localStorage.setItem('eq_accent', accentPreference);
  }, [accentPreference, isLoading]);
  useEffect(() => {
    if (!isLoading) localStorage.setItem('eq_daily_logs', JSON.stringify(dailyLogs));
  }, [dailyLogs, isLoading]);
  useEffect(() => {
    if (!isLoading) localStorage.setItem('eq_word_progress', JSON.stringify(wordProgress));
  }, [wordProgress, isLoading]);

  // ---- 更新每日日志的辅助函数 ----
  const updateTodayLog = useCallback(patchFn => {
    const today = getTodayStr();
    setDailyLogs(prev => {
      const existing = prev[today] || {
        checked: true,
        xp: 0,
        words: 0,
        correct: 0,
        answers: 0,
        minutes: 0
      };
      const next = {
        ...prev,
        [today]: patchFn(existing)
      };
      localStorage.setItem('eq_daily_logs', JSON.stringify(next));
      return next;
    });
  }, []);

  // ---- 会话埋点：记录用户会话 ----
  useEffect(() => {
    if (!user) return;
    sessionStartRef.current = Date.now();
    // 记录会话开始
    supabase.from('user_sessions').insert({
      user_id: user.id
    }).then(() => {});
    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      trackEvent(user.id, 'session_end', {
        duration_seconds: duration
      }, duration);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user?.id]);

  // ---- 登录成功回调 ----
  const handleLoginSuccess = useCallback(userInfo => {
    setUser(userInfo);
    trackEvent(userInfo.id, 'login', {
      email: userInfo.email
    });
  }, []);

  // ---- 登出 ----
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ---- 徽章检查 ----
  const checkBadges = useCallback((pd, cw) => {
    const newBadges = BADGES.filter(b => !badges.includes(b.id) && b.condition(pd, cw)).map(b => b.id);
    if (newBadges.length > 0) setBadges(prev => [...prev, ...newBadges]);
  }, [badges]);
  const updatePlayer = useCallback(updater => {
    setPlayerData(prev => {
      const next = updater(prev);
      localStorage.setItem('eq_player', JSON.stringify(next));
      return next;
    });
  }, []);
  const addXP = useCallback(amount => {
    updatePlayer(prev => {
      const oldLevel = calcLevel(prev.xp).level;
      const next = {
        ...prev,
        xp: prev.xp + amount
      };
      if (calcLevel(next.xp).level > oldLevel) setCelebrate(true);
      return next;
    });
    updateTodayLog(log => ({
      ...log,
      xp: (log.xp || 0) + amount
    }));
    // 触发宠物动画
    setPetEvent({
      type: 'learn',
      ts: Date.now()
    });
  }, [updatePlayer, updateTodayLog]);
  const onLearnWord = useCallback(en => {
    if (learnedWords.has(en)) return;
    setLearnedWords(prev => {
      const s = new Set(prev);
      s.add(en);
      return s;
    });
    updatePlayer(prev => {
      const next = {
        ...prev,
        totalWordsLearned: prev.totalWordsLearned + 1
      };
      checkBadges(next, customWords);
      return next;
    });
    addXP(2);
    updateTodayLog(log => ({
      ...log,
      words: (log.words || 0) + 1
    }));
    if (user) trackEvent(user.id, 'learn_word', {
      word: en
    });
  }, [learnedWords, addXP, updatePlayer, checkBadges, customWords, user, updateTodayLog]);
  const onPerfect = useCallback(() => {
    updatePlayer(prev => ({
      ...prev,
      perfectQuizzes: prev.perfectQuizzes + 1
    }));
    checkBadges(playerData, customWords);
    if (user) trackEvent(user.id, 'quiz_perfect', {});
  }, [updatePlayer, playerData, customWords, checkBadges, user]);
  const addCustomWord = useCallback(word => {
    setCustomWords(prev => {
      const next = [...prev, word];
      setTimeout(() => checkBadges(playerData, next), 0);
      return next;
    });
    updatePlayer(prev => ({
      ...prev,
      totalWordsLearned: prev.totalWordsLearned + 1
    }));
    if (user) trackEvent(user.id, 'add_custom_word', {
      word: word.en
    });
  }, [checkBadges, playerData, updatePlayer, user]);
  const deleteCustomWord = useCallback(idx => {
    setCustomWords(prev => prev.filter((_, i) => i !== idx));
  }, []);
  const allWords = useMemo(() => [...WORD_BANKS.primary1, ...WORD_BANKS.primary2, ...WORD_BANKS.junior, ...customWords], [customWords]);
  // 课程标准词库全量词（用于挑战模式兜底）
  const [curriculumAllWords, setCurriculumAllWords] = React.useState([]);
  React.useEffect(() => {
    fetch('./vocabulary.json').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      setCurriculumAllWords(data.map(w => ({
        en: w.word,
        zh: w.zh,
        emoji: w.emoji || '📖',
        sentence: w.sentence,
        tip: w.tip || ''
      })));
    }).catch(() => {});
  }, []);
  const challengeWords = useMemo(() => curriculumAllWords.length >= 5 ? curriculumAllWords : allWords, [curriculumAllWords, allWords]);
  if (isLoading) return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center justify-center min-h-screen",
    style: {
      background: 'linear-gradient(160deg, #FAF3F3, #F0E8F0, #EAE8F0)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-4",
    style: {
      animation: 'spin360 1.5s linear infinite',
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "64",
    height: "64",
    viewBox: "0 0 512 512",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M80 300 Q80 120 256 80 Q432 120 432 300 Z",
    fill: "#745B72"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "256",
    cy: "298",
    rx: "176",
    ry: "28",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "232",
    y: "240",
    width: "48",
    height: "62",
    rx: "24",
    fill: "#FAF3F3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M200 148 Q170 80 230 40",
    stroke: "#D49DAA",
    strokeWidth: "9",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "230",
    cy: "40",
    rx: "10",
    ry: "16",
    transform: "rotate(-20 230 40)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "252",
    cy: "52",
    rx: "10",
    ry: "16",
    transform: "rotate(5 252 52)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "268",
    cy: "74",
    rx: "9",
    ry: "15",
    transform: "rotate(20 268 74)",
    fill: "#5C7995"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "276",
    cy: "100",
    rx: "8",
    ry: "14",
    transform: "rotate(35 276 100)",
    fill: "#AAABB9"
  }))), /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold mt-2",
    style: {
      color: '#745B72'
    }
  }, "WheatSpace"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1",
    style: {
      color: '#9B8FA0'
    }
  }, "\u6B63\u5728\u52A0\u8F7D\u82F1\u8BED\u95EF\u5173\u4E50\u56ED..."));
  const tabContent = {
    garden: /*#__PURE__*/React.createElement(WordGarden, {
      playerData: playerData,
      addXP: addXP,
      onLearnWord: onLearnWord,
      customWords: customWords,
      dailyLogs: dailyLogs,
      onOpenWordDetail: setWordDetailPage,
      updatePlayer: updatePlayer,
      updateTodayLog: updateTodayLog,
      wordProgress: wordProgress
    }),
    sentence: /*#__PURE__*/React.createElement(SentenceQuest, null),
    challenge: /*#__PURE__*/React.createElement(ChallengeMode, {
      allWords: challengeWords,
      addXP: addXP,
      onPerfect: onPerfect
    }),
    calendar: /*#__PURE__*/React.createElement(LearningCalendar, {
      dailyLogs: dailyLogs
    }),
    achievement: /*#__PURE__*/React.createElement(AchievementHub, {
      playerData: playerData,
      badges: badges,
      customWords: customWords,
      onAddWord: addCustomWord,
      onDeleteWord: deleteCustomWord,
      addXP: addXP
    })
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen",
    style: {
      background: 'linear-gradient(160deg, #FAF3F3 0%, #F0E8F0 45%, #EAE8F0 100%)'
    }
  }, celebrate && /*#__PURE__*/React.createElement(CelebrationEffect, {
    onDone: () => setCelebrate(false)
  }), wordDetailPage && /*#__PURE__*/React.createElement(WordDetailPage, {
    word: wordDetailPage,
    onBack: () => setWordDetailPage(null),
    onLearn: onLearnWord
  }), /*#__PURE__*/React.createElement(Header, {
    playerData: playerData,
    user: user,
    onLogout: handleLogout,
    accentPreference: accentPreference,
    onAccentChange: setAccentPreference,
    onOpenSettings: () => setShowLogin(true)
  }), /*#__PURE__*/React.createElement(LoginModal, {
    visible: showLogin,
    onClose: () => setShowLogin(false),
    onLoginSuccess: handleLoginSuccess
  }), /*#__PURE__*/React.createElement("main", {
    className: "main-content max-w-3xl mx-auto px-4 pt-20 pb-24 sm:pt-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }, (() => {
    const tab = TAB_LIST.find(t => t.id === activeTab);
    return /*#__PURE__*/React.createElement("div", {
      key: activeTab,
      className: "bounce-in-sm flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-2xl"
    }, tab.emoji), /*#__PURE__*/React.createElement("h2", {
      className: "text-xl font-bold text-quest-dark"
    }, tab.label));
  })()), tabContent[activeTab]), /*#__PURE__*/React.createElement(TabNav, {
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), /*#__PURE__*/React.createElement(VirtualPet, {
    event: petEvent
  }), /*#__PURE__*/React.createElement(PomodoroTimer, {
    sessionActive: !isLoading && !wordDetailPage && !showBreakGame,
    onBreakTime: () => setShowBreakGame(true)
  }), showBreakGame && /*#__PURE__*/React.createElement(BreakGame, {
    onClose: () => setShowBreakGame(false),
    onComplete: () => {
      setShowBreakGame(false);
      setPetEvent({
        type: 'perfect',
        ts: Date.now()
      });
    }
  }));
};
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 20,
          color: 'red'
        }
      }, /*#__PURE__*/React.createElement("h1", null, "Something went wrong."), /*#__PURE__*/React.createElement("pre", null, this.state.error.toString()));
    }
    return this.props.children;
  }
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));