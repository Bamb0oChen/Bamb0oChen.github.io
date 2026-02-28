// LocalStorage 数据管理

// 光影留痕 - 本地图片库配置
// 说明:
// 1) 将图片放入 photos/lighttrace/ 目录，命名为 img0001.jpg 之类
// 2) 选择 "手动清单" 或 "自动清单"
// 3) featured 为 true 的图片会出现在首页精选
// 4) 若清单为空，将回退到浏览器 localStorage 模式

// 手动清单（可选）
window.LIGHTTRACE_LIBRARY = [
    // Example:
    // { id: 'img0001', src: 'photos/lighttrace/img0001.jpg', comment: 'Sunset glow', featured: true },
];

// 自动清单（可选）
// count: 图片数量（1..count），自动生成 img0001.jpg
// featuredIds: 需要精选的图片 id 列表
window.LIGHTTRACE_AUTO = {
    count: 13,
    featuredIds: ['img0001', 'img0002', 'img0003', 'img0004',
        'img0005', 'img0006', 'img0007', 'img0008', 'img0009', 'img0010',
        'img0011', 'img0012', 'img0013'
    ]
};

function buildAutoLibrary(config) {
    if (!config || !config.count || config.count < 1) return [];
    const featuredSet = new Set(config.featuredIds || []);
    const items = [];
    for (let i = 1; i <= config.count; i++) {
        const id = `img${String(i).padStart(4, '0')}`;
        items.push({
            id,
            src: `photos/lighttrace/${id}.jpg`,
            comment: '',
            featured: featuredSet.has(id)
        });
    }
    return items;
}

const autoLibrary = buildAutoLibrary(window.LIGHTTRACE_AUTO);
if (!window.LIGHTTRACE_LIBRARY || window.LIGHTTRACE_LIBRARY.length === 0) {
    window.LIGHTTRACE_LIBRARY = autoLibrary;
}

window.FEATURED_LIGHTTRACE = (window.LIGHTTRACE_LIBRARY || []).filter(item => item && item.featured);

// 专心做视频 - 视频库配置（B站外链）
// 说明:
// 1) 使用 link/bvid（B 站）
// 2) 在下方清单中维护卡片信息，首页会自动渲染
// 3) cover 建议填写 https 地址，避免混合内容拦截
window.FOCUS_VIDEO_LIBRARY = [{
        id: 'vid0001',
        title: 'Everywhere I Go - My Vacation Record',
        description: '从北京-沈阳-哈尔滨-昆明-普洱-西双版纳，或许你想看看我的故事',
        platform: 'bilibili',
        bvid: 'BV1QAAhzaEA8',
        link: 'https://www.bilibili.com/video/BV1QAAhzaEA8/',
        cover: 'https://i0.hdslb.com/bfs/archive/7dc8ef49e006b7568859d6def92ce8d58dcf96b6.jpg',
        comment: '行者无疆'
    },
    {
        id: 'vid0002',
        title: '景の故事',
        description: '关于我在景德镇的故事',
        platform: 'bilibili',
        bvid: 'BV1DdY1z7E7M',
        link: 'https://www.bilibili.com/video/BV1DdY1z7E7M/',
        cover: 'https://i0.hdslb.com/bfs/archive/7cc7b30bd4f0c6af6e5d1f6f886532880b502441.jpg',
        comment: '行者无疆'
    }
];

const RECORDS_PREFIX = 'daily_record_';

/**
 * 获取指定日期的记录
 */
function getRecord(dateStr) {
    const key = RECORDS_PREFIX + dateStr;
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse record:', e);
        }
    }

    // 返回默认记录
    return {
        date: dateStr,
        keywords: [],
        today_done: '',
        tomorrow_plan: [],
        insights: '',
        todos: [],
        focus_sessions: []
    };
}

/**
 * 保存指定日期的记录
 */
function saveRecordData(dateStr, data) {
    const key = RECORDS_PREFIX + dateStr;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save record:', e);
        alert('⚠️ 保存失败：浏览器存储空间不足');
    }
}

/**
 * 获取热图数据（所有有记录的日期及其记录数）
 */
function getHeatmapData() {
    const counts = {};

    // 遍历所有localStorage key
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // 检查是否是记录key
        if (key && key.startsWith(RECORDS_PREFIX)) {
            const dateStr = key.substring(RECORDS_PREFIX.length);

            // 验证日期格式 (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));

                    // 计算该日期有多少条数据（非空字段数）
                    let count = 0;
                    if (data.keywords && data.keywords.length > 0) count++;
                    if (data.today_done && data.today_done.trim()) count++;
                    if (data.tomorrow_plan && data.tomorrow_plan.length > 0) count++;
                    if (data.insights && data.insights.trim()) count++;
                    if (data.todos && data.todos.length > 0) count++;
                    if (data.focus_sessions && data.focus_sessions.length > 0) count++;

                    if (count > 0) {
                        counts[dateStr] = count;
                    }
                } catch (e) {
                    console.error('Failed to parse heatmap data:', e);
                }
            }
        }
    }

    return counts;
}

/**
 * 导出所有记录为JSON（备份功能）
 */
function exportAllRecordsAsJSON() {
    const allRecords = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith(RECORDS_PREFIX)) {
            const dateStr = key.substring(RECORDS_PREFIX.length);
            allRecords[dateStr] = JSON.parse(localStorage.getItem(key));
        }
    }

    const blob = new Blob([JSON.stringify(allRecords, null, 2)], { type: 'application/json;charset=utf-8' });
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
 * 从JSON文件导入记录（恢复备份功能）
 */
function importRecordsFromJSON(file) {
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
function clearAllData() {
    if (confirm('⚠️ 确定要清除所有数据吗？此操作无法撤销！')) {
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