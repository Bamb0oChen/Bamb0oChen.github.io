<template>
    <div>
        <canvas ref="starfieldCanvas" id="starfield" class="starfield-canvas" aria-hidden="true"></canvas>

        <header id="header" :style="{ opacity: headerOpacity }">
            <div class="site-header-inner">
                <div class="site-brand">Chen.のhomepage</div>
                <nav class="site-nav" aria-label="主导航">
                    <button class="nav-btn nav-btn-button" type="button" @click="openSearch">搜索</button>
                    <a href="gallery.html" class="nav-btn">光影留痕</a>
                    <a href="#guestbook" class="nav-btn">留言</a>
                    <a href="https://Bamb0oChen.github.io/notes/" class="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                </nav>
            </div>
        </header>

        <section class="hero" :style="heroDepthStyle">
            <div class="hero-tilt" :style="heroTiltStyle" @mousemove="handleHeroTilt" @mouseleave="resetHeroTilt">
                <div class="hero-shell">
                    <div class="hero-content">
                        <h1 class="greeting">欢迎来到 Chen.のhomepage</h1>
                        <div class="typed-wrapper">
                            <span class="typed-text">{{ typedText }}</span>
                            <span class="cursor" aria-hidden="true"></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="content compact-section">
            <div class="status-panel">
                <div class="status-intro">
                    <p class="section-kicker">Now</p>
                    <h2>最近状态</h2>
                    <p>{{ SITE_STATUS.motto }}</p>
                </div>
                <div class="status-grid">
                    <div class="status-card">
                        <span>当前专注</span>
                        <strong v-for="item in SITE_STATUS.currentFocus" :key="item">{{ item }}</strong>
                    </div>
                    <div class="status-card">
                        <span>正在学习</span>
                        <strong v-for="item in SITE_STATUS.learning" :key="item">{{ item }}</strong>
                    </div>
                    <div class="status-card">
                        <span>最近输入</span>
                        <strong v-for="item in statusInputs" :key="item">{{ item }}</strong>
                    </div>
                    <div class="status-card">
                        <span>近期项目</span>
                        <strong v-for="item in SITE_STATUS.projects" :key="item">{{ item }}</strong>
                    </div>
                </div>
            </div>
        </section>

        <section class="content compact-section">
            <div class="section-heading">
                <p class="section-kicker">Updates</p>
                <h2>最近创作流</h2>
            </div>
            <div class="creation-feed">
                <a
                    v-for="item in recentFeed"
                    :key="item.id"
                    class="feed-item"
                    :href="item.link"
                    :target="item.external ? '_blank' : null"
                    :rel="item.external ? 'noopener noreferrer' : null"
                >
                    <span class="feed-type">{{ item.typeLabel }}</span>
                    <div>
                        <time>{{ item.date || '持续更新' }}</time>
                        <h3>{{ item.title }}</h3>
                        <p>{{ item.description }}</p>
                    </div>
                </a>
            </div>
        </section>

        <section class="content">
            <div class="section-heading">
                <p class="section-kicker">Lighttrace</p>
                <h2>精选光影</h2>
            </div>
            <div class="photo-container">
                <div v-if="featuredPhotos.length === 0" class="empty-state">
                    暂无光影留痕，<a href="gallery.html">去上传</a>
                </div>
                <div
                    v-else
                    ref="photoStripRef"
                    class="photo-strip"
                    :class="{ 'is-hovering': isHoveringPhotos }"
                    :style="stripStyle"
                    @mouseleave="resetActivePhoto"
                >
                    <button
                        v-for="(photo, index) in displayPhotos"
                        :key="photo.idKey"
                        type="button"
                        class="photo-square"
                        :class="{ active: index === activeIndex, edge: isEdgePhoto(index) }"
                        :style="photoMoveStyles[index]"
                        :ref="el => setPhotoRef(el, index)"
                        @mouseenter="activatePhoto(index)"
                        @click="goGallery(photo)"
                    >
                        <span class="photo-card" :style="photoCardStyles[index]">
                            <img :src="photo.data" :alt="photo.title || photo.fileName || '光影留痕'" :title="photo.title || photo.fileName || ''" />
                            <span v-if="isEdgePhoto(index)" class="edge-mask"></span>
                        </span>
                    </button>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="section-heading">
                <p class="section-kicker">Writing</p>
                <h2>妙笔生花</h2>
            </div>
            <div class="filter-row" aria-label="文章分类筛选">
                <button
                    v-for="tag in articleTags"
                    :key="tag"
                    type="button"
                    class="filter-chip"
                    :class="{ active: selectedArticleTag === tag }"
                    @click="selectedArticleTag = tag"
                >
                    {{ tag }}
                </button>
            </div>
            <div class="articles-grid">
                <a
                    v-for="article in filteredArticles"
                    :key="article.id"
                    class="article-card"
                    :href="article.link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div class="article-image">
                        <img :src="article.image" :alt="article.title" loading="lazy" />
                    </div>
                    <div class="article-content">
                        <div class="tag-line">
                            <span v-for="tag in article.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
                        </div>
                        <h3>{{ article.title }}</h3>
                        <p>{{ article.description }}</p>
                        <div class="article-comment">{{ article.comment }}</div>
                    </div>
                </a>
            </div>
        </section>

        <section class="content">
            <div class="section-heading">
                <p class="section-kicker">Video</p>
                <h2>用心做视频</h2>
            </div>
            <div class="articles-grid">
                <div v-if="focusVideos.length === 0" class="empty-state">
                    暂无视频，请在 src/data/siteData.js 的 FOCUS_VIDEO_LIBRARY 中添加 B 站 link/bvid 条目。
                </div>
                <a
                    v-for="video in focusVideos"
                    :key="video.id"
                    class="article-card"
                    :class="{ 'has-cover': !!video.coverUrl, 'is-previewing': video.isPreviewing }"
                    :href="video.openUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @mouseenter="handleVideoEnter(video)"
                    @mouseleave="handleVideoLeave(video)"
                >
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
                        <div class="tag-line"><span>{{ video.comment || '视频' }}</span></div>
                        <h3>{{ video.title || '未命名视频' }}</h3>
                        <p>{{ video.description || '专注记录' }}</p>
                        <div class="article-comment">{{ video.comment || '' }}</div>
                    </div>
                </a>
            </div>
        </section>

        <section class="content">
            <div class="section-heading">
                <p class="section-kicker">Music</p>
                <h2>曲苑天地</h2>
            </div>
            <div class="music-board-wrap">
                <p class="music-board-desc">嵌入 Apple Music 收藏歌单，歌单内容更新后这里会自动同步。</p>
                <div class="music-embed">
                    <iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="450"
                        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                        src="https://embed.music.apple.com/cn/playlist/favorite-songs/pl.u-aeUR5YapmR" loading="lazy"></iframe>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="section-heading">
                <p class="section-kicker">Friends</p>
                <h2>缘分天空</h2>
            </div>
            <div class="articles-grid friend-grid" aria-label="友链列表">
                <a
                    v-for="friend in FRIEND_LINKS"
                    :key="friend.id"
                    class="article-card friend-card"
                    :href="friend.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :aria-label="`访问 ${friend.name}`"
                >
                    <div class="article-content friend-content">
                        <img :src="friend.avatar" :alt="friend.name" loading="lazy" referrerpolicy="no-referrer" />
                        <div>
                            <h3>{{ friend.name }}</h3>
                            <p>{{ friend.description }}</p>
                            <div class="article-comment">{{ friend.note }}</div>
                        </div>
                    </div>
                </a>
                <a class="article-card friend-card apply-card" href="#guestbook">
                    <div class="article-content">
                        <h3>友链申请</h3>
                        <p>在留言区留下站点名、链接、头像和一句介绍。</p>
                        <div class="article-comment">欢迎来串门</div>
                    </div>
                </a>
            </div>
        </section>

        <section id="guestbook" class="content">
            <div class="section-heading">
                <p class="section-kicker">Guestbook</p>
                <h2>访客留言</h2>
            </div>
            <div class="guestbook-panel">
                <div ref="giscusContainer"></div>
                <div v-if="giscusFailed" class="giscus-fallback">
                    留言组件暂时没有加载成功，可以前往
                    <a href="https://github.com/Bamb0oChen/notes/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions</a>
                    或
                    <a href="https://Bamb0oChen.github.io/notes/" target="_blank" rel="noopener noreferrer">笔记站</a>
                    找到我。
                </div>
            </div>
        </section>

        <div v-if="isSearchOpen" class="search-overlay" @click.self="closeSearch">
            <section class="search-panel" role="dialog" aria-modal="true" aria-label="站内搜索">
                <div class="search-header">
                    <div>
                        <p class="section-kicker">Search</p>
                        <h2>搜索主页与笔记</h2>
                    </div>
                    <button class="search-close" type="button" @click="closeSearch">×</button>
                </div>
                <input
                    ref="searchInput"
                    v-model.trim="searchQuery"
                    class="search-input"
                    type="search"
                    placeholder="试试 NLP、线性代数、游乐园..."
                    @keydown.esc="closeSearch"
                />
                <div class="search-meta">
                    <span v-if="remoteLoading">正在载入笔记索引...</span>
                    <span v-else-if="remoteError">远程笔记索引暂不可用，当前仅显示主页结果。</span>
                    <span v-else>结果来自主页内容与 notes 搜索索引。</span>
                </div>
                <div class="search-results">
                    <div class="search-group">
                        <h3>主页</h3>
                        <a v-for="result in localResults" :key="result.id" class="search-result" :href="result.url" :target="result.external ? '_blank' : null" :rel="result.external ? 'noopener noreferrer' : null">
                            <span>{{ result.type }}</span>
                            <strong>{{ result.title }}</strong>
                            <p>{{ result.description }}</p>
                        </a>
                        <p v-if="searchQuery && localResults.length === 0" class="empty-result">没有匹配的主页内容。</p>
                    </div>
                    <div class="search-group">
                        <h3>笔记</h3>
                        <a v-for="result in remoteResults" :key="result.id" class="search-result" :href="result.url" target="_blank" rel="noopener noreferrer">
                            <span>笔记</span>
                            <strong>{{ result.title }}</strong>
                            <p>{{ result.description }}</p>
                        </a>
                        <p v-if="searchQuery && remoteResults.length === 0" class="empty-result">没有匹配的笔记内容。</p>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
    CHANGELOG,
    CONTENT_ARTICLES,
    FEATURED_LIGHTTRACE,
    FOCUS_VIDEO_LIBRARY,
    FRIEND_LINKS,
    SITE_STATUS
} from '../data/siteData';
import { startStarfield } from '../utils/starfield';

const NOTES_BASE_URL = 'https://bamb0ochen.github.io/notes/';
const NOTES_SEARCH_INDEX_URL = `${NOTES_BASE_URL}search/search_index.json`;
const SEARCH_LIMIT = 20;

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
const headerOpacity = ref(1);
const heroOpacity = ref(1);
const heroScrollProgress = ref(0);
const typedText = ref('');
const starfieldCanvas = ref(null);
const selectedArticleTag = ref('全部');
const focusVideos = ref([]);
const isSearchOpen = ref(false);
const searchInput = ref(null);
const searchQuery = ref('');
const remoteDocs = ref([]);
const remoteLoading = ref(false);
const remoteError = ref(false);
const giscusContainer = ref(null);
const giscusFailed = ref(false);

const heroTiltX = ref(0);
const heroTiltY = ref(0);
const heroTargetX = ref(0);
const heroTargetY = ref(0);
let heroTiltRaf = null;
let resizeTimer = null;
let resizeHandler = null;
let typedTimer = null;
let cleanupStarfield = null;
let autoPlayTimer = null;
let giscusFailTimer = null;

const biliCoverCache = new Map();
const coverReachabilityCache = new Map();
const DEFAULT_VIDEO_FALLBACK_COVER = 'photos/photo3.jpg';
const CHANGELOG_DOC_URL = 'docs/changelog.html';

const heroDepthStyle = computed(() => {
    const progress = heroScrollProgress.value;
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const layoutLift = 1 - Math.pow(1 - progress, 1.25);
    return {
        opacity: heroOpacity.value,
        transform: `perspective(1200px) translateY(${-eased * 120}px) translateZ(${-eased * 240}px) scale(${1 - eased * 0.18})`,
        filter: `blur(${eased * 8}px) saturate(${1 - eased * 0.28}) brightness(${1 - eased * 0.22})`,
        marginBottom: `-${(layoutLift * 48).toFixed(2)}vh`,
        pointerEvents: progress > 0.82 ? 'none' : 'auto'
    };
});

const heroTiltStyle = computed(() => ({
    transform: `perspective(900px) rotateX(${heroTiltX.value}deg) rotateY(${heroTiltY.value}deg)`
}));

const statusInputs = computed(() => [
    ...(SITE_STATUS.reading || []).slice(0, 2),
    ...(SITE_STATUS.listening || []).slice(0, 1)
]);

const articleTags = computed(() => {
    const tags = new Set(['全部']);
    CONTENT_ARTICLES.forEach(article => (article.tags || []).forEach(tag => tags.add(tag)));
    return Array.from(tags);
});

const filteredArticles = computed(() => {
    if (selectedArticleTag.value === '全部') return CONTENT_ARTICLES.filter(article => article.featured);
    return CONTENT_ARTICLES.filter(article => article.featured && (article.tags || []).includes(selectedArticleTag.value));
});

const recentFeed = computed(() => {
    const articleItems = CONTENT_ARTICLES.map(article => ({
        id: `article-${article.id}`,
        typeLabel: '文章',
        title: article.title,
        description: article.description,
        date: article.date,
        link: article.link,
        external: true
    }));

    const videoItems = FOCUS_VIDEO_LIBRARY.map(video => ({
        id: `video-${video.id}`,
        typeLabel: '视频',
        title: video.title,
        description: video.description,
        date: video.date || '2026-02-28',
        link: video.link,
        external: true
    }));

    const photoItems = FEATURED_LIGHTTRACE.slice(0, 6).map(photo => ({
        id: `photo-${photo.id}`,
        typeLabel: '光影',
        title: photo.title || photo.id,
        description: photo.comment || '光影留痕中的一帧。',
        date: photo.date || '2026-02-13',
        link: `gallery.html#photo=${encodeURIComponent(photo.id || '')}`,
        external: false
    }));

    const logItems = CHANGELOG.map(log => ({
        id: `log-${log.date}-${log.title}`,
        typeLabel: '文档',
        title: log.title,
        description: log.description,
        date: log.date,
        link: getChangelogDocLink(log),
        external: false
    }));

    return [...articleItems, ...videoItems, ...photoItems, ...logItems]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, 8);
});

const localSearchIndex = computed(() => {
    const articleItems = CONTENT_ARTICLES.map(article => ({
        id: `article-${article.id}`,
        type: '文章',
        title: article.title,
        description: article.description,
        body: [article.comment, ...(article.tags || [])].join(' '),
        url: article.link,
        external: true
    }));

    const videoItems = FOCUS_VIDEO_LIBRARY.map(video => ({
        id: `video-${video.id}`,
        type: '视频',
        title: video.title,
        description: video.description,
        body: [video.comment, video.bvid].join(' '),
        url: video.link,
        external: true
    }));

    const photoItems = FEATURED_LIGHTTRACE.map(photo => ({
        id: `photo-${photo.id}`,
        type: '光影',
        title: photo.title || photo.id,
        description: photo.comment || '',
        body: [photo.location, photo.device, ...(photo.tags || [])].join(' '),
        url: `gallery.html#photo=${encodeURIComponent(photo.id || '')}`,
        external: false
    }));

    const statusItems = [
        {
            id: 'status-now',
            type: '状态',
            title: '最近状态',
            description: SITE_STATUS.motto,
            body: [
                ...(SITE_STATUS.currentFocus || []),
                ...(SITE_STATUS.learning || []),
                ...(SITE_STATUS.reading || []),
                ...(SITE_STATUS.listening || []),
                ...(SITE_STATUS.projects || [])
            ].join(' '),
            url: '#',
            external: false
        }
    ];

    const friendItems = FRIEND_LINKS.map(friend => ({
        id: `friend-${friend.id}`,
        type: '友链',
        title: friend.name,
        description: friend.description,
        body: friend.note,
        url: friend.url,
        external: true
    }));

    const logItems = CHANGELOG.map(log => ({
        id: `log-${log.date}-${log.title}`,
        type: '文档',
        title: log.title,
        description: log.description,
        body: log.date,
        url: getChangelogDocLink(log),
        external: false
    }));

    return [...articleItems, ...videoItems, ...photoItems, ...statusItems, ...friendItems, ...logItems];
});

const localResults = computed(() => searchLocalItems(localSearchIndex.value, searchQuery.value));
const remoteResults = computed(() => searchRemoteItems(remoteDocs.value, searchQuery.value));

const stripStyle = computed(() => ({
    transform: `translateX(${stripOffset.value}px)`,
    transition: stripTransition.value ? 'transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none'
}));

watch(isSearchOpen, async isOpen => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
        await nextTick();
        searchInput.value && searchInput.value.focus();
        loadRemoteSearchIndex();
    }
});

function normalizeSearchText(value) {
    return String(value || '').toLowerCase();
}

function stripHtml(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return div.textContent || div.innerText || '';
}

function getChangelogDocLink(log) {
    const date = log && log.date ? String(log.date) : '';
    return date ? `${CHANGELOG_DOC_URL}#${date}` : CHANGELOG_DOC_URL;
}

function scoreItem(item, query) {
    const q = normalizeSearchText(query);
    if (!q) return 0;
    const title = normalizeSearchText(item.title);
    const description = normalizeSearchText(item.description);
    const body = normalizeSearchText(item.body);
    let score = 0;
    if (title.includes(q)) score += 8;
    if (description.includes(q)) score += 4;
    if (body.includes(q)) score += 2;
    return score;
}

function searchLocalItems(items, query) {
    if (!query) return [];
    return items
        .map(item => ({ ...item, score: scoreItem(item, query) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_LIMIT);
}

function searchRemoteItems(items, query) {
    if (!query) return [];
    return items
        .map(item => ({ ...item, score: scoreItem(item, query) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_LIMIT);
}

function normalizeNotesUrl(location) {
    const cleanLocation = String(location || '').replace(/^\//, '');
    return new URL(cleanLocation, NOTES_BASE_URL).toString();
}

function loadRemoteSearchIndex() {
    if (remoteDocs.value.length || remoteLoading.value) return;
    remoteLoading.value = true;
    remoteError.value = false;
    fetch(NOTES_SEARCH_INDEX_URL)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load notes index');
            return response.json();
        })
        .then(result => {
            const docs = Array.isArray(result.docs) ? result.docs : [];
            remoteDocs.value = docs.map((doc, index) => {
                const text = stripHtml(doc.text || '');
                return {
                    id: `note-${index}-${doc.location || ''}`,
                    title: doc.title || '未命名笔记',
                    description: text.slice(0, 120),
                    body: text,
                    url: normalizeNotesUrl(doc.location)
                };
            });
        })
        .catch(() => {
            remoteError.value = true;
        })
        .finally(() => {
            remoteLoading.value = false;
        });
}

function openSearch() {
    isSearchOpen.value = true;
}

function closeSearch() {
    isSearchOpen.value = false;
}

function goGallery(photo) {
    const id = photo && (photo.id || photo.fileName);
    window.location.href = id ? `gallery.html#photo=${encodeURIComponent(id)}` : 'gallery.html';
}

function getFeaturedPhotos(limit) {
    const maxCount = limit || 10;
    const featured = Array.isArray(FEATURED_LIGHTTRACE) ? FEATURED_LIGHTTRACE : [];
    if (featured.length > 0) {
        return featured.slice(0, maxCount).map(item => ({
            id: item.id || item.src,
            data: item.src,
            comment: item.comment || '',
            fileName: item.id || item.src || '',
            title: item.title || item.id || '',
            date: item.date || '',
            tags: item.tags || []
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
    if (width <= 400) return 8;
    if (width <= 700) return 12;
    if (width <= 900) return 16;
    return 20;
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
    if (el) photoRefs.value[index] = el;
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
        if (idx === centerIndex) return photo;
        const replacement = newPhotos[cursor] || photo;
        cursor += 1;
        return {
            ...replacement,
            idKey: `${replacement.fileName || replacement.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
        };
    });
    nextTick(() => updatePhotoStyles(true));
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
            return {
                transform: `translate(${stripCenterX - itemCenterX}px, ${stripCenterY - itemCenterY}px) perspective(900px) rotateY(0deg)`,
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
        if (idx === activeIndex.value && isActive) return { transform: 'scale(1.38)' };
        if (isActive) return { transform: 'scale(0.86)' };
        return { transform: 'scale(1)' };
    });
}

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
    if (biliCoverCache.has(bvid)) return Promise.resolve(biliCoverCache.get(bvid));

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
    const candidates = [videoItem && videoItem.fallbackCover, videoItem && videoItem.cover, DEFAULT_VIDEO_FALLBACK_COVER];
    for (const candidate of candidates) {
        const normalized = normalizeSecureCoverUrl(candidate || '');
        if (normalized) return normalized;
    }
    return '';
}

function validateCoverUrl(url) {
    const target = normalizeSecureCoverUrl(url || '');
    if (!target) return Promise.resolve('');
    if (coverReachabilityCache.has(target)) return Promise.resolve(coverReachabilityCache.get(target));

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
        .then(crawledCover => crawledCover || validateCoverUrl(fallbackCover))
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
            if (coverUrl) video.coverUrl = coverUrl;
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
    const progress = Math.max(0, Math.min(1, scrollY / (windowH * 0.68)));
    const eased = 1 - Math.pow(1 - progress, 1.8);
    heroScrollProgress.value = progress;
    heroOpacity.value = Math.max(0, 1 - eased);
    headerOpacity.value = 1;
}

function startTyping() {
    const phrases = ['Bamb0oChen の空间', 'ZJUer / CS Learner', 'Counter-Strike & CS', 'Coffee & Pingpong', 'Koala@ZJU / X-Lab@ZJU'];
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
    heroTargetY.value = Math.max(-maxTilt, Math.min(maxTilt, (viewportX - 0.5) * 2 * maxTilt));
    heroTargetX.value = Math.max(-maxTilt, Math.min(maxTilt, -(viewportY - 0.5) * 2 * maxTilt));
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

function mountGiscus() {
    if (!giscusContainer.value) return;
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', 'Bamb0oChen/notes');
    script.setAttribute('data-repo-id', 'R_kgDORKPyfQ');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'DIC_kwDORKPyfc4C7H9I');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'zh-CN');
    script.onerror = () => {
        giscusFailed.value = true;
    };
    script.onload = () => {
        window.clearTimeout(giscusFailTimer);
        giscusFailed.value = false;
    };
    giscusContainer.value.appendChild(script);
    giscusFailTimer = window.setTimeout(() => {
        const iframe = giscusContainer.value && giscusContainer.value.querySelector('iframe');
        if (!iframe) giscusFailed.value = true;
    }, 8000);
}

onMounted(async () => {
    await nextTick();
    renderFeaturedPhotos();
    buildFocusVideos();
    updateHeaderHeroOpacity();
    startTyping();
    mountGiscus();

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
    if (typedTimer) clearTimeout(typedTimer);
    if (cleanupStarfield) cleanupStarfield();
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    if (heroTiltRaf) cancelAnimationFrame(heroTiltRaf);
    if (giscusFailTimer) clearTimeout(giscusFailTimer);
    document.body.style.overflow = '';
    window.removeEventListener('scroll', updateHeaderHeroOpacity);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
});
</script>

<style scoped>
.site-header-inner {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 1240px;
    justify-content: space-between;
    padding: 0 30px;
}

.site-brand {
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.92);
}

.site-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.nav-btn-button {
    font: inherit;
}

.hero-tilt {
    display: inline-block;
    padding: 1px;
    border-radius: 36px;
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05) 44%, rgba(255, 255, 255, 0.16) 100%),
        rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow:
        0 32px 90px rgba(0, 0, 0, 0.48),
        0 12px 34px rgba(32, 95, 160, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.32);
    transition: transform 0.2s ease;
    transform-style: preserve-3d;
    will-change: transform;
}

.hero-shell {
    width: min(1100px, 92vw);
    height: min(560px, 70vh);
    border-radius: 35px;
    overflow: hidden;
    background: url("/static/hero.jpg") center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -70px 110px rgba(0, 0, 0, 0.26),
        inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    position: relative;
}

.hero-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.08), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.01), rgba(0, 22, 45, 0.24));
}

.hero-shell::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 34px;
    pointer-events: none;
    box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.09),
        inset 0 22px 38px rgba(255, 255, 255, 0.045);
}

.hero {
    background: none;
    overflow: hidden;
    transform-origin: center 38%;
    transform-style: preserve-3d;
    will-change: transform, opacity, filter;
}

.hero-tilt .hero-content {
    transform: translateZ(0);
    backdrop-filter: saturate(165%) blur(22px);
    -webkit-backdrop-filter: saturate(165%) blur(22px);
    background:
        radial-gradient(circle at 22% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(13, 23, 34, 0.54), rgba(8, 16, 26, 0.32));
    border-radius: 28px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    position: relative;
    z-index: 1;
    max-width: min(760px, 82vw);
    box-shadow:
        0 22px 64px rgba(0, 0, 0, 0.34),
        0 8px 24px rgba(28, 75, 125, 0.09),
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05);
    overflow: hidden;
}

.hero-tilt .hero-content::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 27px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 42%);
    pointer-events: none;
}

.hero-tilt .hero-content::after {
    content: '';
    position: absolute;
    left: 12%;
    right: 12%;
    top: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
    pointer-events: none;
}

.hero .greeting {
    font-size: clamp(17px, 2vw, 25px);
    font-weight: 650;
    letter-spacing: 0.01em;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 1;
}

.typed-wrapper {
    display: flex;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    white-space: normal;
    font-size: clamp(34px, 4.8vw, 58px);
    line-height: 1.18;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
    font-weight: 700;
    position: relative;
    z-index: 1;
}

.typed-text {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: normal;
}

.cursor {
    flex: 0 0 2px;
}

.section-heading {
    max-width: 1100px;
    margin: 0 auto 28px;
    text-align: center;
}

.section-heading h2,
.status-intro h2 {
    margin: 0;
    color: white;
    font-size: clamp(30px, 4vw, 48px);
    font-weight: 720;
    letter-spacing: 0;
}

.section-kicker {
    margin: 0 0 8px;
    color: rgba(255, 255, 255, 0.48);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.compact-section {
    padding-top: 64px;
    padding-bottom: 64px;
}

.status-panel {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.7fr);
    gap: 22px;
    align-items: stretch;
}

.status-intro,
.status-card,
.feed-item,
.guestbook-panel,
.search-panel {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.11), transparent 30%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.082), rgba(255, 255, 255, 0.038));
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 20px;
    backdrop-filter: saturate(145%) blur(16px);
    -webkit-backdrop-filter: saturate(145%) blur(16px);
    box-shadow:
        0 20px 56px rgba(0, 0, 0, 0.26),
        0 8px 22px rgba(28, 76, 124, 0.055),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(255, 255, 255, 0.035);
    transition:
        transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1),
        border-color 0.36s ease,
        background 0.36s ease,
        box-shadow 0.36s ease;
    will-change: transform;
}

.status-intro::before,
.status-card::before,
.feed-item::before,
.guestbook-panel::before,
.search-panel::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.095), transparent 38%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 46%);
    pointer-events: none;
    z-index: 0;
}

.status-intro > *,
.status-card > *,
.feed-item > *,
.guestbook-panel > *,
.search-panel > * {
    position: relative;
    z-index: 1;
}

.status-intro::after,
.status-card::after,
.feed-item::after {
    content: '';
    position: absolute;
    left: 16%;
    right: 16%;
    top: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
    opacity: 0.5;
    pointer-events: none;
    z-index: 2;
}

.status-intro:hover,
.status-card:hover,
.feed-item:hover {
    transform: translateY(-8px) scale(1.035);
    border-color: rgba(255, 255, 255, 0.24);
    background:
        radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.16), transparent 32%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.048));
    box-shadow:
        0 28px 72px rgba(0, 0, 0, 0.34),
        0 12px 32px rgba(38, 112, 190, 0.085),
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05);
    z-index: 3;
}

.status-intro {
    padding: 24px;
}

.status-intro p:last-child {
    color: rgba(255, 255, 255, 0.72);
    line-height: 1.7;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.status-card {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.status-card span,
.feed-type,
.search-result span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
}

.status-card strong {
    color: rgba(255, 255, 255, 0.92);
    font-size: 14px;
    line-height: 1.4;
}

.creation-feed {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
}

.feed-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    padding: 16px;
    color: inherit;
    text-decoration: none;
}

.feed-item:hover {
    color: inherit;
}

.feed-item time {
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
}

.feed-item h3 {
    margin: 6px 0 8px;
    font-size: 16px;
}

.feed-item p {
    margin: 0;
    color: rgba(255, 255, 255, 0.66);
    font-size: 13px;
    line-height: 1.5;
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
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.34);
    transition: transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.75s ease, border-color 0.75s ease;
    cursor: pointer;
    -webkit-box-reflect: below 6px linear-gradient(transparent, rgba(0, 0, 0, 0.35));
    transform-style: preserve-3d;
    padding: 0;
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
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
}

.empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.55);
    padding: 36px;
    grid-column: 1 / -1;
}

.empty-state a {
    color: #ffa500;
}

.filter-row {
    max-width: 1100px;
    margin: 0 auto 18px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}

.filter-chip {
    position: relative;
    overflow: hidden;
    z-index: 0;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.035));
    color: rgba(255, 255, 255, 0.82);
    border-radius: 999px;
    padding: 8px 13px;
    cursor: pointer;
    transition:
        color 0.32s ease,
        border-color 0.32s ease,
        background 0.32s ease,
        box-shadow 0.32s ease,
        transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.filter-chip::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
        radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.42), transparent 38%),
        linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.28) 46%, rgba(255, 255, 255, 0.08));
    opacity: 0;
    transform: translateX(-18%) scaleX(0.82);
    transition:
        opacity 0.38s ease,
        transform 0.48s cubic-bezier(0.2, 0.8, 0.2, 1);
    pointer-events: none;
}

.filter-chip::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 54%);
    opacity: 0.45;
    pointer-events: none;
}

.filter-chip {
    isolation: isolate;
}

.filter-chip > * {
    position: relative;
    z-index: 1;
}

.filter-chip.active,
.filter-chip:hover {
    color: rgba(255, 255, 255, 0.96);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.055));
    border-color: rgba(255, 255, 255, 0.34);
    box-shadow:
        0 12px 34px rgba(0, 0, 0, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
    transform: translateY(-1px);
}

.filter-chip.active::before,
.filter-chip:hover::before {
    opacity: 0.28;
    transform: translateX(0) scaleX(1);
}

.filter-chip.active {
    color: rgba(255, 255, 255, 0.98);
    border-color: rgba(255, 255, 255, 0.42);
}

.filter-chip.active::before {
    opacity: 0.36;
}

.tag-line {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.tag-line span {
    color: rgba(255, 255, 255, 0.72);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 11px;
}

.music-embed {
    max-width: 660px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.35);
}

.music-embed iframe {
    width: 100%;
    overflow: hidden;
    filter: invert(1) hue-rotate(180deg) saturate(0.9) contrast(0.92) brightness(0.9);
    opacity: 0.92;
}

.friend-grid {
    align-items: stretch;
}

.friend-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.friend-content img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex: 0 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.friend-content h3,
.friend-content p {
    margin-top: 0;
}

.apply-card {
    text-decoration: none;
    color: inherit;
}

.guestbook-panel {
    max-width: 980px;
    margin: 0 auto;
    padding: 18px;
}

.giscus-fallback {
    padding: 18px;
    color: rgba(255, 255, 255, 0.72);
    line-height: 1.6;
}

.giscus-fallback a {
    color: #ffa500;
}

.search-overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(10px);
    padding: 24px;
    overflow-y: auto;
}

.search-panel {
    max-width: 980px;
    margin: 5vh auto;
    padding: 22px;
    color: white;
}

.search-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.search-header h2 {
    margin: 0 0 18px;
}

.search-close {
    border: 0;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 8px;
    width: 38px;
    height: 38px;
    font-size: 26px;
    cursor: pointer;
}

.search-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(0, 0, 0, 0.32);
    color: white;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 16px;
    outline: none;
}

.search-input:focus {
    border-color: rgba(255, 255, 255, 0.55);
}

.search-meta {
    margin: 12px 0 20px;
    color: rgba(255, 255, 255, 0.58);
    font-size: 13px;
}

.search-results {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.search-group h3 {
    margin: 0 0 12px;
}

.search-result {
    display: block;
    padding: 14px;
    margin-bottom: 10px;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-result:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.08);
}

.search-result strong {
    display: block;
    margin: 6px 0;
}

.search-result p,
.empty-result {
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
    font-size: 13px;
    line-height: 1.5;
}

@media (max-width: 900px) {
    .status-panel,
    .search-results {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .site-header-inner {
        flex-wrap: wrap;
        padding: 0 16px;
        gap: 10px;
    }
    .site-brand,
    .site-nav {
        width: 100%;
    }
    .site-nav {
        justify-content: stretch;
    }
    .site-nav .nav-btn {
        flex: 1;
        text-align: center;
    }
    .hero-tilt {
        transform: none !important;
        width: calc(100vw - 18px);
        box-sizing: border-box;
        padding: 6px;
    }
    .hero-shell {
        width: 100%;
        height: min(560px, 62vh);
        box-sizing: border-box;
    }
    .hero {
        padding-top: 96px;
    }
    .hero-tilt .hero-content {
        max-width: calc(100% - 28px);
        padding: 24px 14px;
    }
    .typed-wrapper {
        font-size: clamp(18px, 5.8vw, 24px);
        gap: 4px;
    }
    .hero .greeting {
        font-size: 18px;
    }
    .photo-strip {
        flex-wrap: nowrap;
        justify-content: flex-start;
        overflow-x: auto;
        width: 100%;
        padding: 12px 14px;
        scroll-snap-type: x mandatory;
    }
    .photo-square {
        width: 170px;
        height: 170px;
        flex: 0 0 auto;
        scroll-snap-align: center;
        -webkit-box-reflect: unset;
    }
    .status-grid {
        grid-template-columns: 1fr;
    }
    .search-overlay {
        padding: 10px;
    }
    .search-panel {
        margin: 2vh auto;
        padding: 16px;
    }
}
</style>
