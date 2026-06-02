<template>
    <div>
        <canvas ref="starfieldCanvas" id="starfield" class="starfield-canvas" aria-hidden="true"></canvas>

        <header id="header" :style="{ opacity: headerOpacity }">
            <div style="display:flex; align-items:center; gap:12px; width:100%; max-width:1100px; justify-content:space-between;">
                <div style="font-weight:bold; font-size:18px;">Chen.のhomepage</div>
                <div>
                    <a href="gallery.html" class="nav-btn">光影留痕</a>
                    <a href="https://Bamb0oChen.github.io/notes/" class="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                </div>
            </div>
        </header>

        <section class="hero" :style="{ opacity: heroOpacity }">
            <div class="hero-tilt" :style="heroTiltStyle" @mousemove="handleHeroTilt" @mouseleave="resetHeroTilt">
                <div class="hero-shell">
                    <div class="hero-content">
                        <h1 class="greeting">✨欢迎来到Chen.のhomepage🧤</h1>
                        <div class="typed-wrapper">
                            <span class="typed-text">{{ typedText }}</span>
                            <span class="cursor" aria-hidden="true"></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 精选光影留痕 - 横向滚动 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">精选光影</h2>
            <div class="photo-container">
                <div v-if="featuredPhotos.length === 0" style="text-align:center; color:rgba(255,255,255,0.5); padding:40px;">
                    暂无光影留痕，<a href="gallery.html" style="color:#ffa500;">去上传</a>
                </div>
                <div
                    v-else
                    ref="photoStripRef"
                    class="photo-strip"
                    :class="{ 'is-hovering': isHoveringPhotos }"
                    :style="stripStyle"
                    @mouseleave="resetActivePhoto"
                >
                    <div
                        v-for="(photo, index) in displayPhotos"
                        :key="photo.idKey"
                        class="photo-square"
                        :class="{ active: index === activeIndex, edge: isEdgePhoto(index) }"
                        :style="photoMoveStyles[index]"
                        :ref="el => setPhotoRef(el, index)"
                        @mouseenter="activatePhoto(index)"
                        @click="goGallery"
                    >
                        <div class="photo-card" :style="photoCardStyles[index]">
                            <img :src="photo.data" alt="" :title="photo.fileName || ''" />
                            <div v-if="isEdgePhoto(index)" class="edge-mask"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 妙笔生花 - 精选文章 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">妙笔生花</h2>
            <div class="articles-grid">
                <div v-for="article in articles" :key="article.id" class="article-card" style="cursor: pointer;" @click="openLink(article.link)">
                    <div class="article-image">
                        <img :src="article.image" :alt="article.title" />
                    </div>
                    <div class="article-content">
                        <h3>{{ article.title }}</h3>
                        <p>{{ article.description }}</p>
                        <div class="article-comment">{{ article.comment }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 用心做视频 - B站外链卡片 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">用心做视频</h2>
            <div class="articles-grid">
                <div v-if="focusVideos.length === 0" style="text-align:center; color:rgba(255,255,255,0.5); padding:30px; grid-column:1/-1;">
                    暂无视频，请在 src/data/siteData.js 的 FOCUS_VIDEO_LIBRARY 中添加 B 站 link/bvid 条目。
                </div>
                <div v-for="video in focusVideos" :key="video.id" class="article-card" :class="{ 'has-cover': !!video.coverUrl, 'is-previewing': video.isPreviewing }"
                    style="cursor: pointer;" @mouseenter="handleVideoEnter(video)" @mouseleave="handleVideoLeave(video)" @click="openLink(video.openUrl)">
                    <div class="article-image">
                        <div class="bili-preview-shell">
                            <div class="bili-preview-cover" :style="video.coverUrl ? { backgroundImage: `url('${video.coverUrl}')` } : {}"></div>
                            <div class="bili-preview-placeholder">
                                <div class="bili-preview-title">{{ video.title || '未命名视频' }}</div>
                                <div class="bili-preview-hint">悬停预览 / 点击打开</div>
                            </div>
                            <div class="bili-preview-player">
                                <iframe v-if="video.isPreviewing" :src="video.embedUrl" :title="video.title || video.bvid" frameborder="0" allowfullscreen="true"
                                    referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture"></iframe>
                            </div>
                            <span class="bili-badge">Bilibili</span>
                        </div>
                    </div>
                    <div class="article-content">
                        <h3>{{ video.title || '未命名视频' }}</h3>
                        <p>{{ video.description || '专注记录' }}</p>
                        <div class="article-comment">{{ video.comment || '' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 曲苑天地 - Apple Music 常听歌 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">曲苑天地</h2>
            <div class="music-board-wrap">
                <p class="music-board-desc">嵌入 Apple Music 收藏歌单，歌单内容更新后这里会自动同步。</p>
                <div style="max-width:660px; margin:0 auto; overflow:hidden; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35);">
                    <iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="450" style="width:100%; overflow:hidden; filter: invert(1) hue-rotate(180deg) saturate(0.9) contrast(0.92) brightness(0.9); opacity:0.92;"
                        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                        src="https://embed.music.apple.com/cn/playlist/favorite-songs/pl.u-aeUR5YapmR" loading="lazy"></iframe>
                </div>
            </div>
        </div>

        <!-- 更新日志 - 时间线 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">更新日志</h2>
            <div class="changelog-timeline">
                <div class="timeline">
                    <div v-for="(log, index) in changelog" :key="log.date + index" class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">{{ log.date }}</div>
                            <div class="timeline-title">{{ log.title }}</div>
                            <div class="timeline-description">{{ log.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 缘分天空 - 友链 -->
        <div class="content">
            <h2 style="color:white; text-align:center; margin-top:30px;">缘分天空</h2>
            <div class="articles-grid" aria-label="友链列表">
                <a class="article-card" href="https://hubery258.github.io/notebook/" target="_blank" rel="noopener noreferrer" aria-label="访问 hubery's notebook" style="text-decoration:none; color:inherit;">
                    <div class="article-content" style="display:flex; align-items:center; gap:16px;">
                        <img src="https://s41.ax1x.com/2026/03/14/peEfnTx.jpg" alt="hubery's notebook" style="width:56px; height:56px; border-radius:50%; object-fit:cover; flex:0 0 auto; border:1px solid rgba(255,255,255,0.12);" loading="lazy" referrerpolicy="no-referrer" />
                        <div style="min-width:0; flex:1;">
                            <h3 style="margin:0 0 8px 0;">hubery's notebook</h3>
                            <p style="min-height:0; margin:0;">C'est la vie</p>
                            <div class="article-comment" style="margin-top:12px;">https://hubery258.github.io/dreamland-hubery/</div>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref } from 'vue';
import { FEATURED_LIGHTTRACE, FOCUS_VIDEO_LIBRARY } from '../data/siteData';
import { startStarfield } from '../utils/starfield';

const featuredContainer = ref(null);
const featuredPhotos = ref([]);
const displayPhotos = ref([]);
const activeIndex = ref(-1);
const photoMoveStyles = ref([]);
const photoCardStyles = ref([]);
const photoStripRef = ref(null);
const photoRefs = ref([]);
const isHoveringPhotos = ref(false);
const stripOffset = ref(0);
const stripTransition = ref(true);
const stripStep = ref(0);
const EDGE_COUNT = 2;
const VISIBLE_COUNT = 6;
const headerOpacity = ref(0);
const heroOpacity = ref(1);
const typedText = ref('');
const starfieldCanvas = ref(null);

const heroTiltX = ref(0);
const heroTiltY = ref(0);
const heroTargetX = ref(0);
const heroTargetY = ref(0);
let heroTiltRaf = null;

const heroTiltStyle = computed(() => ({
    transform: `perspective(900px) rotateX(${heroTiltX.value}deg) rotateY(${heroTiltY.value}deg)`
}));

const articles = [
    {
        id: 1,
        title: 'python进阶讲义',
        description: '基于Gemini生成的一份py进阶讲义，主要针对CS61A的学习者',
        image: 'photos/photo1.webp',
        link: 'https://Bamb0oChen.github.io/notes/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6/UCB%20CS61A/python%E5%9F%BA%E7%A1%80/',
        comment: '学习天地'
    },
    {
        id: 2,
        title: '我们为什么要去游乐园',
        description: '记录于高中去游乐园后的返程',
        image: 'photos/photo2.png',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E4%B8%BA%E4%BB%80%E4%B9%88%E6%88%91%E4%BB%AC%E8%A6%81%E5%8E%BB%E6%B8%B8%E4%B9%90%E5%9B%AD/',
        comment: '感性空间'
    },
    {
        id: 3,
        title: 'CET-6正课笔记',
        description: '记录六级正课的听力、阅读、写作笔记，持续更新中',
        image: 'photos/photo3.jpg',
        link: 'https://Bamb0oChen.github.io/notes/%E8%8B%B1%E6%96%87%E5%AD%A6%E4%B9%A0/CET-6/%E7%B4%A2%E5%BC%95/',
        comment: '学习天地'
    },
    {
        id: 4,
        title: '星空列车与白的旅行测评',
        description: '很久没因为一个艺术作品而体会过眼泪决堤了，不过我想这就是一款好的gal该做的，让玩家在有限的时间里，亲身体会一段别人的故事。',
        image: 'photos/photo4.png',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%89%B9%E5%88%A4%E6%80%A7%E6%B8%B8%E7%8E%A9/%E6%98%9F%E7%A9%BA%E5%88%97%E8%BD%A6%E4%B8%8E%E7%99%BD%E7%9A%84%E6%97%85%E8%A1%8C%E6%89%B9%E5%88%A4%E6%80%A7%E6%B8%B8%E7%8E%A9%E4%BD%93%E9%AA%8C/',
        comment: '感性空间'
    },
    {
        id: 5,
        title: '“お元気ですか？”——泡沫经济与物哀美学',
        description: '情书真的是一部很好的电影',
        image: 'photos/photo5.png',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E2%80%9C%E3%81%8A%E5%85%83%E6%B0%97%E3%81%A7%E3%81%99%E3%81%8B%EF%BC%9F%E2%80%9D%E2%80%94%E2%80%94%E6%B3%A1%E6%B2%AB%E7%BB%8F%E6%B5%8E%E4%B8%8E%E7%89%A9%E5%93%80%E7%BE%8E%E5%AD%A6/',
        comment: '感性空间'
    },
    {
        id: 6,
        title: 'NLP的发展历史，我们怎么让AI读懂我们',
        description: '纵观发展史，NLP是AI发展中不可或缺的一部分',
        image: 'photos/photo6.png',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%8A%80%E6%9C%AF%E6%9D%82%E8%B0%88/NLP%E7%9A%84%E5%8E%86%E5%8F%B2%EF%BC%8C%E6%88%91%E4%BB%AC%E6%80%8E%E4%B9%88%E8%AE%A9%E7%94%B5%E8%84%91%E2%80%9C%E8%AF%BB%E6%87%82%E2%80%9D%E6%88%91%E4%BB%AC/',
        comment: '编程技术'
    },
    {
        id: 7,
        title: '2025年终总结',
        description: '虽然有自吹自擂之嫌，但是回望过去的一年，我还是想分享“他”的故事',
        image: 'photos/photo7.jpg',
        link: 'https://Bamb0oChen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E5%B9%B4%E7%BB%88%E6%80%BB%E7%BB%93/2025%E5%B9%B4%E7%BB%88%E6%80%BB%E7%BB%93/',
        comment: '一路走来'
    },
    {
        id: 8,
        title: '那天下雨了',
        description: '如果再回到那一个下雨天',
        image: 'photos/photo8.png',
        link: 'https://bamb0ochen.github.io/notes/%E6%9D%82%E8%B0%88%E6%96%87%E7%AB%A0/%E6%96%87%E5%AD%A6%E6%84%9F%E6%82%9F/%E9%82%A3%E5%A4%A9%E4%B8%8B%E9%9B%A8%E4%BA%86/',
        comment: '感性空间'
    }
];

const changelog = [
    {
        date: '2026-03-14',
        title: '首页模块与响应式优化',
        description: '新增‘缘分天空’友链板块；‘曲苑天地’改为 Apple Music 歌单嵌入并做深色/透明适配；优化‘精选光影’布局为居中对称，按 900/700/400 断点逐级调整为 5/4/3/2 列且保持两行，并拉开上下行间距。'
    },
    {
        date: '2026-03-01',
        title: '视频封面与预览样式优化',
        description: '重写视频封面读取逻辑为优先爬取、失败回退备用图，并移除悬浮预览文案以降低视觉干扰'
    },
    {
        date: '2026-02-28',
        title: '用心做视频接入 B 站外链',
        description: '首页新增视频卡片、封面展示与悬浮预览，移除本地大视频依赖'
    },
    {
        date: '2026-02-13',
        title: '新增光影留痕画廊',
        description: '支持图片上传、查看、评注功能，完整的前端实现'
    },
    {
        date: '2026-02-10',
        title: '妙笔生花模块上线',
        description: '精选文章卡片化展示，支持响应式布局'
    },
    {
        date: '2026-02-08',
        title: '主页大改版',
        description: '移除标签页功能，重构导航菜单结构'
    },
    {
        date: '2026-02-05',
        title: '修复样式兼容性问题',
        description: '改进移动端适配、优化深色主题'
    }
];

const focusVideos = ref([]);
const biliCoverCache = new Map();
const coverReachabilityCache = new Map();
const DEFAULT_VIDEO_FALLBACK_COVER = 'photos/photo3.jpg';

let resizeTimer = null;
let resizeHandler = null;
let typedTimer = null;
let cleanupStarfield = null;
let autoPlayTimer = null;

function openLink(url) {
    if (!url) return;
    window.open(url, '_blank');
}

function goGallery() {
    window.location.href = 'gallery.html';
}

function getFeaturedPhotos(limit) {
    const maxCount = limit || 10;
    const featured = Array.isArray(FEATURED_LIGHTTRACE) ? FEATURED_LIGHTTRACE : [];
    if (featured.length > 0) {
        return featured.slice(0, maxCount).map(item => ({
            data: item.src,
            comment: item.comment || '',
            fileName: item.id || item.src || ''
        }));
    }

    try {
        const stored = localStorage.getItem('gallery_images_v1');
        const images = stored ? JSON.parse(stored) : [];
        return images.slice(0, maxCount);
    } catch (e) {
        return [];
    }
}

function getFeaturedPhotoLimit() {
    const container = featuredContainer.value;
    if (!container) return 12;
    const width = container.clientWidth || window.innerWidth || 0;
    if (!width) return 12;

    let columns = 5;
    if (width <= 400) {
        columns = 2;
    } else if (width <= 700) {
        columns = 3;
    } else if (width <= 900) {
        columns = 4;
    }

    return Math.max(12, columns * 4);
}

function renderFeaturedPhotos() {
    const limit = getFeaturedPhotoLimit();
    featuredPhotos.value = getFeaturedPhotos(limit);
    initDisplayPhotos();
}

function initDisplayPhotos() {
    const source = featuredPhotos.value;
    if (!source.length) {
        displayPhotos.value = [];
        photoMoveStyles.value = [];
        photoCardStyles.value = [];
        return;
    }

    const count = Math.min(VISIBLE_COUNT + EDGE_COUNT * 2, source.length);
    const picks = pickRandomPhotos(count, []);
    displayPhotos.value = picks.map((photo, idx) => ({
        ...photo,
        idKey: `${photo.fileName || photo.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
    }));
    nextTick(() => {
        updatePhotoStyles();
        updateStripStep();
    });
    startAutoPlay();
}

function pickRandomPhotos(count, exclude) {
    const pool = featuredPhotos.value.filter(p => !exclude.includes(p));
    const result = [];
    for (let i = 0; i < count; i++) {
        if (!pool.length) break;
        const index = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(index, 1)[0]);
    }
    return result;
}

function setPhotoRef(el, index) {
    if (el) {
        photoRefs.value[index] = el;
    }
}

function activatePhoto(index) {
    isHoveringPhotos.value = true;
    activeIndex.value = index;
    updatePhotoStyles(true);
    refreshSidePhotos(index);
}

function resetActivePhoto() {
    isHoveringPhotos.value = false;
    activeIndex.value = -1;
    updatePhotoStyles(false);
}

function refreshSidePhotos(centerIndex) {
    const active = displayPhotos.value[centerIndex];
    const exclude = [active];
    const newPhotos = pickRandomPhotos(displayPhotos.value.length - 1, exclude);
    let cursor = 0;
    displayPhotos.value = displayPhotos.value.map((photo, idx) => {
        if (idx === centerIndex) {
            return photo;
        }
        const replacement = newPhotos[cursor] || photo;
        cursor += 1;
        return {
            ...replacement,
            idKey: `${replacement.fileName || replacement.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
        };
    });
    nextTick(() => {
        updatePhotoStyles(true);
    });
}

function updatePhotoStyles(isActive) {
    const strip = photoStripRef.value;
    if (!strip) return;

    const stripRect = strip.getBoundingClientRect();
    const stripCenterX = stripRect.left + stripRect.width / 2;
    const stripCenterY = stripRect.top + stripRect.height / 2;

    photoMoveStyles.value = displayPhotos.value.map((_, idx) => {
        const el = photoRefs.value[idx];
        if (!el) return {};
        if (idx === activeIndex.value && isActive) {
            const rect = el.getBoundingClientRect();
            const itemCenterX = rect.left + rect.width / 2;
            const itemCenterY = rect.top + rect.height / 2;
            const dx = stripCenterX - itemCenterX;
            const dy = stripCenterY - itemCenterY;
            return {
                transform: `translate(${dx}px, ${dy}px) perspective(900px) rotateY(0deg)`,
                zIndex: 12
            };
        }

        if (isActive) {
            const dir = idx < activeIndex.value ? 1 : -1;
            return {
                transform: `translate(0px, 0px) perspective(900px) rotateY(${dir * 40}deg)`,
                zIndex: 1
            };
        }

        return {
            transform: 'translate(0px, 0px) perspective(900px) rotateY(0deg)',
            zIndex: 1
        };
    });

    photoCardStyles.value = displayPhotos.value.map((_, idx) => {
        if (idx === activeIndex.value && isActive) {
            return {
                transform: 'scale(1.38)'
            };
        }
        if (isActive) {
            const dir = idx < activeIndex.value ? 1 : -1;
            return {
                transform: `scale(0.86)`
            };
        }
        return {
            transform: 'scale(1)'
        };
    });
}

const stripStyle = computed(() => ({
    transform: `translateX(${stripOffset.value}px)`,
    transition: stripTransition.value ? 'transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none'
}));

function updateStripStep() {
    const strip = photoStripRef.value;
    if (!strip) return;
    const first = strip.querySelector('.photo-square');
    if (!first) return;
    const rect = first.getBoundingClientRect();
    const styles = window.getComputedStyle(strip);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    stripStep.value = rect.width + gap;
}

function isEdgePhoto(index) {
    return index < EDGE_COUNT || index >= displayPhotos.value.length - EDGE_COUNT;
}

function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
        if (isHoveringPhotos.value || !displayPhotos.value.length) return;
        const step = stripStep.value || 0;
        if (!step) return;
        stripTransition.value = true;
        stripOffset.value = -step;
        setTimeout(() => {
            const next = displayPhotos.value.slice(1).concat(displayPhotos.value[0]);
            displayPhotos.value = next.map((photo, idx) => ({
                ...photo,
                idKey: `${photo.fileName || photo.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
            }));
            stripTransition.value = false;
            stripOffset.value = 0;
            nextTick(() => {
                updatePhotoStyles(false);
                updateStripStep();
                requestAnimationFrame(() => {
                    stripTransition.value = true;
                });
            });
        }, 620);
    }, 2200);
}

function getFocusVideos() {
    if (Array.isArray(FOCUS_VIDEO_LIBRARY)) {
        return FOCUS_VIDEO_LIBRARY.filter(item => item && (item.link || item.bvid));
    }
    return [];
}

function extractBvid(value) {
    const match = String(value || '').match(/BV[0-9A-Za-z]{10}/);
    return match ? match[0] : '';
}

function normalizeSecureCoverUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (raw.startsWith('//')) return `https:${raw}`;
    return raw.replace(/^http:\/\//i, 'https://');
}

function resolveBilibiliInfo(videoItem) {
    const bvid = videoItem.bvid || extractBvid(videoItem.link);
    if (!bvid) return null;

    return {
        bvid,
        openUrl: videoItem.link || `https://www.bilibili.com/video/${bvid}/`,
        embedUrl: `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=1&autoplay=1&muted=1&danmaku=0`
    };
}

function loadBilibiliCover(bvid) {
    if (!bvid) return Promise.resolve('');
    if (biliCoverCache.has(bvid)) {
        return Promise.resolve(biliCoverCache.get(bvid));
    }

    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`;
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) return null;
            return response.json();
        })
        .then(result => {
            const coverRaw = result && result.data && result.data.pic ? result.data.pic : '';
            const cover = normalizeSecureCoverUrl(coverRaw);
            biliCoverCache.set(bvid, cover);
            return cover;
        })
        .catch(() => '');
}

function resolveFallbackCover(videoItem) {
    const candidates = [
        videoItem && videoItem.fallbackCover,
        videoItem && videoItem.cover,
        DEFAULT_VIDEO_FALLBACK_COVER
    ];

    for (const candidate of candidates) {
        const normalized = normalizeSecureCoverUrl(candidate || '');
        if (normalized) return normalized;
    }

    return '';
}

function validateCoverUrl(url) {
    const target = normalizeSecureCoverUrl(url || '');
    if (!target) return Promise.resolve('');

    if (coverReachabilityCache.has(target)) {
        return Promise.resolve(coverReachabilityCache.get(target));
    }

    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
            coverReachabilityCache.set(target, target);
            resolve(target);
        };

        image.onerror = () => {
            coverReachabilityCache.set(target, '');
            resolve('');
        };

        image.referrerPolicy = 'no-referrer';
        image.src = target;
    });
}

function resolveVideoCover(videoItem, biliInfo) {
    const fallbackCover = resolveFallbackCover(videoItem);

    return loadBilibiliCover(biliInfo && biliInfo.bvid)
        .then(validateCoverUrl)
        .then(crawledCover => {
            if (crawledCover) return crawledCover;
            return validateCoverUrl(fallbackCover);
        })
        .catch(() => validateCoverUrl(fallbackCover));
}

function buildFocusVideos() {
    const videos = getFocusVideos();
    focusVideos.value = videos.map(videoItem => {
        const biliInfo = resolveBilibiliInfo(videoItem);
        if (!biliInfo) return null;
        return {
            ...videoItem,
            bvid: biliInfo.bvid,
            openUrl: biliInfo.openUrl,
            embedUrl: biliInfo.embedUrl,
            coverUrl: '',
            isPreviewing: false
        };
    }).filter(Boolean);

    focusVideos.value.forEach(video => {
        resolveVideoCover(video, video).then(coverUrl => {
            if (coverUrl) {
                video.coverUrl = coverUrl;
            }
        });
    });
}

function handleVideoEnter(video) {
    video.isPreviewing = true;
}

function handleVideoLeave(video) {
    video.isPreviewing = false;
}

function updateHeaderHeroOpacity() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    heroOpacity.value = Math.max(0, 1 - scrollY / windowH);
    headerOpacity.value = Math.min(1, Math.max(0, (scrollY - windowH / 2) / (windowH / 2)));
}

function startTyping() {
    const phrases = ['欢迎来到Bamb0ochenの空間', 'Bambooooooooooooo Chen🎍', '📖ZJUer', '💻CS Learner', 'both conter strike & computer science', 'Coffee☕ & Pingpong🏓 Lover', 'Billiards experienced🎱', 'Member of Koala@ZJU & Xlab@ZJU'];
    let pi = 0;
    let ci = 0;
    let deleting = false;
    const typeSpeed = 90;
    const deleteSpeed = 50;
    const pause = 1200;

    function tick() {
        const full = phrases[pi];
        if (!deleting) {
            ci++;
            typedText.value = full.slice(0, ci);
            if (ci === full.length) {
                deleting = true;
                typedTimer = setTimeout(tick, pause);
                return;
            }
        } else {
            ci--;
            typedText.value = full.slice(0, ci);
            if (ci === 0) {
                deleting = false;
                pi = (pi + 1) % phrases.length;
            }
        }
        typedTimer = setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
    }

    typedTimer = setTimeout(tick, 400);
}

function handleHeroTilt(event) {
    const currentTarget = event.currentTarget;
    if (!currentTarget || typeof currentTarget.getBoundingClientRect !== 'function') return;

    const rect = currentTarget.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / (rect.width || 1);
    const localY = (event.clientY - rect.top) / (rect.height || 1);
    const viewportX = Math.max(0, Math.min(1, localX));
    const viewportY = Math.max(0, Math.min(1, localY));
    const maxTilt = 6;
    const percentX = (viewportX - 0.5) * 2;
    const percentY = (viewportY - 0.5) * 2;
    heroTargetY.value = Math.max(-maxTilt, Math.min(maxTilt, percentX * maxTilt));
    heroTargetX.value = Math.max(-maxTilt, Math.min(maxTilt, -percentY * maxTilt));
    startHeroTiltRaf();
}

function resetHeroTilt() {
    heroTargetX.value = 0;
    heroTargetY.value = 0;
    startHeroTiltRaf();
}

function startHeroTiltRaf() {
    if (heroTiltRaf) return;
    const ease = 0.08;
    const tick = () => {
        const dx = heroTargetX.value - heroTiltX.value;
        const dy = heroTargetY.value - heroTiltY.value;
        heroTiltX.value += dx * ease;
        heroTiltY.value += dy * ease;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            heroTiltX.value = heroTargetX.value;
            heroTiltY.value = heroTargetY.value;
            heroTiltRaf = null;
            return;
        }
        heroTiltRaf = requestAnimationFrame(tick);
    };
    heroTiltRaf = requestAnimationFrame(tick);
}


onMounted(async () => {
    await nextTick();
    renderFeaturedPhotos();
    buildFocusVideos();
    updateHeaderHeroOpacity();
    startTyping();

    cleanupStarfield = startStarfield(starfieldCanvas.value, 'star');

    resizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderFeaturedPhotos();
            updatePhotoStyles(activeIndex.value !== -1);
            updateStripStep();
        }, 150);
    };
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', updateHeaderHeroOpacity, { passive: true });
});

onBeforeUnmount(() => {
    if (typedTimer) {
        clearTimeout(typedTimer);
    }
    if (cleanupStarfield) {
        cleanupStarfield();
    }
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
    }
    if (heroTiltRaf) {
        cancelAnimationFrame(heroTiltRaf);
    }
    window.removeEventListener('scroll', updateHeaderHeroOpacity);
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
    }
});
</script>

<style scoped>
.hero-tilt {
    display: inline-block;
    padding: 8px;
    border-radius: 30px;
    background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.5);
    transition: transform 0.2s ease;
    transform-style: preserve-3d;
    will-change: transform;
}

.hero-shell {
    width: min(1100px, 92vw);
    height: min(560px, 70vh);
    border-radius: 26px;
    overflow: hidden;
    background: url("/static/hero.jpg") center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    position: relative;
}

.hero {
    background: none;
    overflow: hidden;
}

.hero-tilt .hero-content {
    transform: translateZ(0);
    backdrop-filter: blur(6px);
    background: rgba(0, 0, 0, 0.35);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    position: relative;
    z-index: 1;
}

.photo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: visible;
}

.photo-strip {
    position: relative;
    display: flex;
    gap: 18px;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    width: fit-content;
    max-width: none;
    padding: 10px 0;
    overflow: visible;
    perspective: 1200px;
}

.photo-square {
    width: 240px;
    height: 240px;
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    transition: transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.75s ease, border-color 0.75s ease;
    cursor: pointer;
    -webkit-box-reflect: below 6px linear-gradient(transparent, rgba(0, 0, 0, 0.35));
    transform-style: preserve-3d;
}

.photo-card {
    position: absolute;
    inset: 0;
    transition: transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1);
    transform-style: preserve-3d;
    will-change: transform;
}

.edge-mask {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.55) 100%);
    pointer-events: none;
}

.photo-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.photo-square.active {
    border-color: rgba(255, 165, 0, 0.65);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
}


@media (max-width: 768px) {
    .featured-tilt {
        transform: none !important;
    }
    .hero-tilt {
        transform: none !important;
    }
    .photo-strip {
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
    }
    .photo-square {
        width: 190px;
        height: 190px;
        -webkit-box-reflect: unset;
    }
}
</style>
