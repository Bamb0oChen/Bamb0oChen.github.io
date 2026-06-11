// LocalStorage 数据管理与站点数据

// 光影留痕 - 本地图片库配置
// 说明:
// 1) 将图片放入 photos/lighttrace/ 目录，命名为 img0001.jpg 之类
// 2) 选择 "手动清单" 或 "自动清单"
// 3) featured 为 true 的图片会出现在首页精选
// 4) 若清单为空，将回退到浏览器 localStorage 模式

// 手动清单（可选）
export const LIGHTTRACE_LIBRARY = [
    // Example:
    // { id: 'img0001', src: 'photos/lighttrace/img0001.jpg', comment: 'Sunset glow', featured: true },
];

// 自动清单（可选）
// count: 图片数量（..count），自动生成 img0001.jpg
// featuredIds: 需要精选的图片 id 列表
export const LIGHTTRACE_AUTO = {
    count: 13,
    featuredIds: [
        'img0001', 'img0002', 'img0003', 'img0004',
        'img0005', 'img0006', 'img0007', 'img0008', 'img0009', 'img0010',
        'img0011', 'img0012', 'img0013'
    ],
    meta: {
        img0001: {
            title: 'Lighttrace 001',
            date: '2026-02-13',
            location: '旅途',
            device: 'Camera',
            tags: ['光影', '旅行'],
            comment: '把路上的光先收好。'
        },
        img0002: { title: 'Lighttrace 002', date: '2026-02-13', tags: ['光影'], comment: '日常里偶然亮起的一帧。' },
        img0003: { title: 'Lighttrace 003', date: '2026-02-13', tags: ['光影'], comment: '一些颜色会替记忆发声。' },
        img0004: { title: 'Lighttrace 004', date: '2026-02-13', tags: ['旅行'], comment: '走过以后，风景才慢慢显影。' },
        img0005: { title: 'Lighttrace 005', date: '2026-02-13', tags: ['生活'], comment: '生活的截面。' },
        img0006: { title: 'Lighttrace 006', date: '2026-02-13', tags: ['光影'], comment: '明暗之间有温度。' },
        img0007: { title: 'Lighttrace 007', date: '2026-02-13', tags: ['旅行'], comment: '在移动中保存一小段安静。' },
        img0008: { title: 'Lighttrace 008', date: '2026-02-13', tags: ['生活'], comment: '日常也值得被认真看见。' },
        img0009: { title: 'Lighttrace 009', date: '2026-02-13', tags: ['光影'], comment: '把时间折进一张照片里。' },
        img0010: { title: 'Lighttrace 010', date: '2026-02-13', tags: ['旅行'], comment: '下一站之前的停顿。' },
        img0011: { title: 'Lighttrace 011', date: '2026-02-13', tags: ['光影'], comment: '一点点亮，一点点远。' },
        img0012: { title: 'Lighttrace 012', date: '2026-02-13', tags: ['生活'], comment: '心情在画面边缘慢慢展开。' },
        img0013: { title: 'Lighttrace 013', date: '2026-02-13', tags: ['旅行'], comment: '这一刻被留了下来。' }
    }
};

export function buildAutoLibrary(config) {
    if (!config || !config.count || config.count < 1) return [];
    const featuredSet = new Set(config.featuredIds || []);
    const items = [];
    for (let i = 1; i <= config.count; i++) {
        const id = `img${String(i).padStart(4, '0')}`;
        const meta = (config.meta && config.meta[id]) || {};
        items.push({
            id,
            src: `photos/lighttrace/${id}.jpg`,
            comment: meta.comment || '',
            featured: featuredSet.has(id),
            title: meta.title || id,
            date: meta.date || '',
            location: meta.location || '',
            device: meta.device || '',
            tags: meta.tags || []
        });
    }
    return items;
}

export function getLighttraceLibrary() {
    if (Array.isArray(LIGHTTRACE_LIBRARY) && LIGHTTRACE_LIBRARY.length > 0) {
        return LIGHTTRACE_LIBRARY;
    }
    return buildAutoLibrary(LIGHTTRACE_AUTO);
}

export const FEATURED_LIGHTTRACE = getLighttraceLibrary().filter(item => item && item.featured);

export const CONTENT_ARTICLES = [
    {
        id: 'article-python-advanced',
        title: 'python进阶讲义',
        description: '基于 Gemini 生成的一份 py 进阶讲义，主要针对 CS61A 的学习者',
        image: 'photos/photo1.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6/UCB%20CS61A/python%E5%9F%BA%E7%A1%80/',
        comment: '学习天地',
        tags: ['学习天地', '编程技术', 'Python'],
        date: '2026-02-10',
        featured: true,
        pinned: true
    },
    {
        id: 'article-amusement-park',
        title: '我们为什么要去游乐园',
        description: '记录于高中去游乐园后的返程',
        image: 'photos/optimized/photo2.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E4%B8%BA%E4%BB%80%E4%B9%88%E6%88%91%E4%BB%AC%E8%A6%81%E5%8E%BB%E6%B8%B8%E4%B9%90%E5%9B%AD/',
        comment: '感性空间',
        tags: ['感性空间', '随笔'],
        date: '2026-02-10',
        featured: true,
        pinned: false
    },
    {
        id: 'article-cet6',
        title: 'CET-6正课笔记',
        description: '记录六级正课的听力、阅读、写作笔记，持续更新中',
        image: 'photos/optimized/photo3.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E8%8B%B1%E6%96%87%E5%AD%A6%E4%B9%A0/CET-6/%E7%B4%A2%E5%BC%95/',
        comment: '学习天地',
        tags: ['学习天地', '英语'],
        date: '2026-02-14',
        featured: true,
        pinned: false
    },
    {
        id: 'article-hoshizora',
        title: '星空列车与白的旅行测评',
        description: '很久没因为一个艺术作品而体会过眼泪决堤了，不过我想这就是一款好的 gal 该做的。',
        image: 'photos/optimized/photo4.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%89%B9%E5%88%A4%E6%80%A7%E6%B8%B8%E7%8E%A9/%E6%98%9F%E7%A9%BA%E5%88%97%E8%BD%A6%E4%B8%8E%E7%99%BD%E7%9A%84%E6%97%85%E8%A1%8C%E6%89%B9%E5%88%A4%E6%80%A7%E6%B8%B8%E7%8E%A9%E4%BD%93%E9%AA%8C/',
        comment: '感性空间',
        tags: ['感性空间', '游戏', '测评'],
        date: '2026-02-18',
        featured: true,
        pinned: false
    },
    {
        id: 'article-love-letter',
        title: '“お元気ですか？”——泡沫经济与物哀美学',
        description: '情书真的是一部很好的电影',
        image: 'photos/optimized/photo5.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E2%80%9C%E3%81%8A%E5%85%83%E6%B0%97%E3%81%A7%E3%81%99%E3%81%8B%EF%BC%9F%E2%80%9D%E2%80%94%E2%80%94%E6%B3%A1%E6%B2%AB%E7%BB%8F%E6%B5%8E%E4%B8%8E%E7%89%A9%E5%93%80%E7%BE%8E%E5%AD%A6/',
        comment: '感性空间',
        tags: ['感性空间', '电影'],
        date: '2026-02-20',
        featured: true,
        pinned: false
    },
    {
        id: 'article-nlp-history',
        title: 'NLP的发展历史，我们怎么让AI读懂我们',
        description: '纵观发展史，NLP 是 AI 发展中不可或缺的一部分',
        image: 'photos/photo6.png',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%8A%80%E6%9C%AF%E6%9D%82%E8%B0%88/NLP%E7%9A%84%E5%8E%86%E5%8F%B2%EF%BC%8C%E6%88%91%E4%BB%AC%E6%80%8E%E4%B9%88%E8%AE%A9%E7%94%B5%E8%84%91%E2%80%9C%E8%AF%BB%E6%87%82%E2%80%9D%E6%88%91%E4%BB%AC/',
        comment: '编程技术',
        tags: ['编程技术', 'AI', 'NLP'],
        date: '2026-02-27',
        featured: true,
        pinned: true
    },
    {
        id: 'article-2025-summary',
        title: '2025年终总结',
        description: '虽然有自吹自擂之嫌，但是回望过去的一年，我还是想分享“他”的故事',
        image: 'photos/photo7.jpg',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E5%B9%B4%E7%BB%88%E6%80%BB%E7%BB%93/2025%E5%B9%B4%E7%BB%88%E6%80%BB%E7%BB%93/',
        comment: '一路走来',
        tags: ['一路走来', '年终总结'],
        date: '2026-03-01',
        featured: true,
        pinned: false
    },
    {
        id: 'article-rain-day',
        title: '那天下雨了',
        description: '如果再回到那一个下雨天',
        image: 'photos/optimized/photo8.webp',
        link: 'https://bamb0ochen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E9%82%A3%E5%A4%A9%E4%B8%8B%E9%9B%A8%E4%BA%86/',
        comment: '感性空间',
        tags: ['感性空间', '随笔'],
        date: '2026-03-02',
        featured: true,
        pinned: false
    }
];

export const CHANGELOG = [
    {
        date: '2026-03-14',
        title: '首页模块与响应式优化',
        description: '新增友链板块；曲苑天地改为 Apple Music 歌单嵌入；优化精选光影布局。'
    },
    {
        date: '2026-03-01',
        title: '视频封面与预览样式优化',
        description: '重写视频封面读取逻辑为优先爬取、失败回退备用图，并降低视觉干扰。'
    },
    {
        date: '2026-02-28',
        title: '用心做视频接入 B 站外链',
        description: '首页新增视频卡片、封面展示与悬浮预览，移除本地大视频依赖。'
    },
    {
        date: '2026-02-13',
        title: '新增光影留痕画廊',
        description: '支持图片查看与评注功能，逐步沉淀为作品集。'
    },
    {
        date: '2026-02-10',
        title: '妙笔生花模块上线',
        description: '精选文章卡片化展示，支持响应式布局。'
    },
    {
        date: '2026-02-08',
        title: '主页大改版',
        description: '移除标签页功能，重构导航菜单结构。'
    },
    {
        date: '2026-02-05',
        title: '修复样式兼容性问题',
        description: '改进移动端适配、优化深色主题。'
    }
];

export const SITE_STATUS = {
    currentFocus: ['整理课程笔记', '打磨个人主页', '持续学习 AI / NLP'],
    learning: ['CS61A / CS61B', 'Stanford CS224n', 'Vue 3 与静态站工程化'],
    reading: ['Outliers', '技术博客与课程讲义'],
    listening: ['Apple Music 收藏歌单', '旅行视频配乐'],
    projects: ['Koala@ZJU', 'X-Lab@ZJU', '个人知识库'],
    motto: '大学当然可以为了自己而活。'
};

export const FRIEND_LINKS = [
    {
        id: 'hubery-notebook',
        name: "hubery's notebook",
        url: 'https://hubery258.github.io/notebook/',
        avatar: 'https://s41.ax1x.com/2026/03/14/peEfnTx.jpg',
        description: "C'est la vie",
        note: 'https://hubery258.github.io/dreamland-hubery/'
    }
];

// 专心做视频 - 视频库配置（B 站外链）
// 说明:
// 1) 使用 link/bvid（B 站）
// 2) 在下方清单中维护卡片信息，首页会自动渲染
// 3) cover 建议填写 https 地址，避免混合内容拦截
export const FOCUS_VIDEO_LIBRARY = [{
        id: 'vid0001',
        title: 'Everywhere I Go - My Vacation Record',
        description: '从北京/沈阳-哈尔滨-昆明-普洱-西双版纳，或许你想看看我的故事',
        platform: 'bilibili',
        bvid: 'BV1QAAhzaEA8',
        link: 'https://www.bilibili.com/video/BV1QAAhzaEA8/',
        cover: 'https://i0.hdslb.com/bfs/archive/7dc8ef49e006b7568859d6def92ce8d58dcf96b6.jpg',
        comment: '行者无疆'
    },
    {
        id: 'vid0002',
        title: '景德镇故事',
        description: '关于我在景德镇的故事',
        platform: 'bilibili',
        bvid: 'BV1DdY1z7E7M',
        link: 'https://www.bilibili.com/video/BV1DdY1z7E7M/',
        cover: 'https://i0.hdslb.com/bfs/archive/7cc7b30bd4f0c6af6e5d1f6f886532880b502441.jpg',
        comment: '行者无疆'
    }
];

// 曲苑天地 - 常听歌 / 收藏歌单（表格数据源）
// 说明:
// - 首页会读取 MUSIC_FAVORITES 渲染歌曲表格
// - Apple Music 的网页端在浏览器端通常会遇到 CORS 限制；
//   使用“分享歌单”公开链接，导出后粘贴到这里
export const MUSIC_FAVORITES = [
    // Example:
    // {
    //   title: 'Midnight City',
    //   artist: 'M83',
    //   album: "Hurry Up, We're Dreaming",
    //   addedAt: '2026-03-02',
    //   appleMusicUrl: 'https://music.apple.com/cn/song/midnight-city/429200412'
    // }
];

// AI 功能配置接口
// 重要: 静态前端不要直接写入 OpenAI/API 密钥。这里的 endpoint 应指向你自己的
// serverless function / worker / 后端代理，由代理读取密钥并调用模型。
export const AI_FEATURE_CONFIG = {
    planSuggestions: {
        enabled: false,
        endpoint: '',
        method: 'POST',
        headers: {},
        model: 'gpt-4.1-mini',
        timeoutMs: 12000,
        maxSuggestions: 5
    }
};

export function buildPlanSuggestionPayload(record, config = AI_FEATURE_CONFIG.planSuggestions) {
    return {
        feature: 'daily-plan-suggestions',
        model: config.model,
        maxSuggestions: config.maxSuggestions,
        record: {
            date: record.date || '',
            keywords: record.keywords || [],
            todayDone: record.todayDone || record.today_done || '',
            tomorrowPlan: record.tomorrowPlan || record.tomorrow_plan || [],
            insights: record.insights || '',
            todos: record.todos || []
        }
    };
}

export async function requestAIPlanSuggestions(record, config = AI_FEATURE_CONFIG.planSuggestions) {
    if (!config || !config.enabled || !config.endpoint) {
        return [];
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs || 12000);

    try {
        const response = await fetch(config.endpoint, {
            method: config.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.headers || {})
            },
            body: JSON.stringify(buildPlanSuggestionPayload(record, config)),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`AI suggestion endpoint failed: ${response.status}`);
        }

        const result = await response.json();
        const suggestions = Array.isArray(result) ? result : result.suggestions;
        return Array.isArray(suggestions)
            ? suggestions.map(item => String(item).trim()).filter(Boolean).slice(0, config.maxSuggestions || 5)
            : [];
    } finally {
        window.clearTimeout(timeout);
    }
}

export const RECORDS_PREFIX = 'daily_record_';

/**
 * 获取指定日期的记录
 */
export function getRecord(dateStr) {
    const key = RECORDS_PREFIX + dateStr;
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse record:', e);
        }
    }

    return {
        date: dateStr,
        keywords: [],
        today_done: '',
        tomorrow_plan: [],
        insights: '',
        todos: []
    };
}

/**
 * 保存指定日期的记录
 */
export function saveRecordData(dateStr, data) {
    const key = RECORDS_PREFIX + dateStr;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save record:', e);
        alert('⚠ 保存失败：浏览器存储空间不足');
    }
}

/**
 * 导出所有记录为 JSON（备份功能）
 */
export function exportAllRecordsAsJSON() {
    const allRecords = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(RECORDS_PREFIX)) {
            const dateStr = key.substring(RECORDS_PREFIX.length);
            allRecords[dateStr] = JSON.parse(localStorage.getItem(key));
        }
    }

    const blob = new Blob([JSON.stringify(allRecords, null, 2)], {
        type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_records_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入记录（恢复备份功能）
 */
export function importRecordsFromJSON(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            let count = 0;

            for (const [dateStr, record] of Object.entries(data)) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    saveRecordData(dateStr, record);
                    count++;
                }
            }

            alert(`✅ 成功导入 ${count} 条记录！`);
            window.location.reload();
        } catch (e) {
            alert('❌ 导入失败：文件格式错误或无法解析');
            console.error('Import error:', e);
        }
    };

    reader.readAsText(file);
}

/**
 * 清除所有数据（谨慎使用）
 */
export function clearAllData() {
    if (confirm('⚠ 确定要清除所有数据吗？此操作无法撤销！')) {
        const keysToDelete = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(RECORDS_PREFIX)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => localStorage.removeItem(key));
        alert('✅ 已清除所有数据');
        window.location.reload();
    }
}
