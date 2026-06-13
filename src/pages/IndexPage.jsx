import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CHANGELOG,
    CONTENT_ARTICLES,
    FEATURED_LIGHTTRACE,
    FOCUS_VIDEO_LIBRARY,
    FRIEND_LINKS,
    SITE_STATUS
} from '../data/siteData';
import { startStarfield } from '../utils/starfield';
import DomeGallery from '../components/DomeGallery';
import CardSwap, { Card } from '../components/CardSwap';
import ChromaGrid from '../components/ChromaGrid';
import BorderGlow from '../components/BorderGlow';
import '../styles/index-page.css';

const NOTES_BASE_URL = 'https://bamb0ochen.github.io/notes/';
const NOTES_SEARCH_INDEX_URL = `${NOTES_BASE_URL}search/search_index.json`;
const SEARCH_LIMIT = 20;
const AGENT_CONTEXT_LIMIT = 8;
const AGENT_CONFIG_URL = 'agent-config.json';
const EDGE_COUNT = 2;
const VISIBLE_COUNT = 6;
const DEFAULT_VIDEO_FALLBACK_COVER = 'photos/optimized/photo3.webp';
const CHANGELOG_DOC_URL = 'docs/changelog.html';
const ModelViewer = lazy(() => import('../components/ModelViewer'));
const DEFAULT_AGENT_MESSAGE = {
    role: 'assistant',
    content: '你好，我是 Chen.のhomepage Agent。可以问我主页内容、光影、视频，也可以基于笔记库帮你找线索。'
};
const SERVER_SERVICES = [
    {
        id: 'qb',
        configKey: 'qb',
        label: 'Torrent',
        title: 'qBittorrent',
        description: '下载队列、种子任务与速度面板。',
        status: 'Private',
        illustration: 'qb'
    },
    {
        id: 'immich',
        configKey: 'immich',
        label: 'Photos',
        title: 'Immich',
        description: '相册备份、人物时间线与照片回忆。',
        status: 'Private',
        illustration: 'immich'
    },
    {
        id: 'nginx',
        configKey: 'nginx',
        label: 'Gateway',
        title: 'Nginx',
        description: '反向代理入口、服务主页与站点调度。',
        status: 'Private',
        illustration: 'nginx'
    }
];

const biliCoverCache = new Map();
const coverReachabilityCache = new Map();

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

function searchItems(items, query) {
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

function normalizeNotesDocs(result) {
    const docs = Array.isArray(result?.docs) ? result.docs : [];
    return docs.map((doc, index) => {
        const text = stripHtml(doc.text || '');
        return {
            id: `note-${index}-${doc.location || ''}`,
            title: doc.title || 'Untitled note',
            description: text.slice(0, 160),
            body: text,
            url: normalizeNotesUrl(doc.location)
        };
    });
}

function fetchNotesDocuments() {
    return fetch(NOTES_SEARCH_INDEX_URL)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load notes index');
            return response.json();
        })
        .then(normalizeNotesDocs);
}

function normalizeSecureCoverUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (raw.startsWith('//')) return `https:${raw}`;
    return raw.replace(/^http:\/\//i, 'https://');
}

function extractBvid(value) {
    const match = String(value || '').match(/BV[0-9A-Za-z]{10}/);
    return match ? match[0] : '';
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
    return fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`)
        .then(response => response.ok ? response.json() : null)
        .then(result => {
            const coverRaw = result && result.data && result.data.pic ? result.data.pic : '';
            const cover = normalizeSecureCoverUrl(coverRaw);
            biliCoverCache.set(bvid, cover);
            return cover;
        })
        .catch(() => '');
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

function resolveFallbackCover(videoItem) {
    const candidates = [videoItem && videoItem.fallbackCover, videoItem && videoItem.cover, DEFAULT_VIDEO_FALLBACK_COVER];
    for (const candidate of candidates) {
        const normalized = normalizeSecureCoverUrl(candidate || '');
        if (normalized) return normalized;
    }
    return '';
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

function pickRandomPhotos(source, count, exclude = []) {
    const pool = source.filter(photo => !exclude.includes(photo));
    const result = [];
    for (let i = 0; i < count; i += 1) {
        if (!pool.length) break;
        const index = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(index, 1)[0]);
    }
    return result;
}

function withIdKeys(photos) {
    return photos.map((photo, idx) => ({
        ...photo,
        idKey: `${photo.fileName || photo.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
    }));
}

export default function IndexPage() {
    const featuredContainer = useRef(null);
    const photoStripRef = useRef(null);
    const photoRefs = useRef([]);
    const fluidCanvas = useRef(null);
    const starfieldCanvas = useRef(null);
    const videoSectionRef = useRef(null);
    const searchInput = useRef(null);
    const agentInputRef = useRef(null);
    const agentMessagesRef = useRef([DEFAULT_AGENT_MESSAGE]);
    const giscusContainer = useRef(null);
    const activeIndexRef = useRef(-1);
    const stripStepRef = useRef(0);
    const hoverRef = useRef(false);
    const heroScrollProgressRef = useRef(0);
    const heroOpacityRef = useRef(1);
    const videoCoversLoadedRef = useRef(false);
    const remoteDocsPromiseRef = useRef(null);
    const runtimeConfigPromiseRef = useRef(null);

    const [featuredPhotos, setFeaturedPhotos] = useState([]);
    const [displayPhotos, setDisplayPhotos] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [photoMoveStyles, setPhotoMoveStyles] = useState([]);
    const [photoCardStyles, setPhotoCardStyles] = useState([]);
    const [isHoveringPhotos, setIsHoveringPhotos] = useState(false);
    const [stripOffset, setStripOffset] = useState(0);
    const [stripTransition, setStripTransition] = useState(true);
    const [headerOpacity, setHeaderOpacity] = useState(1);
    const [heroOpacity, setHeroOpacity] = useState(1);
    const [heroScrollProgress, setHeroScrollProgress] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [selectedArticleTag, setSelectedArticleTag] = useState('全部');
    const [focusVideos, setFocusVideos] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAgentClosing, setIsAgentClosing] = useState(false);
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [agentInput, setAgentInput] = useState('');
    const [agentMessages, setAgentMessages] = useState([DEFAULT_AGENT_MESSAGE]);
    const [agentLoading, setAgentLoading] = useState(false);
    const [agentError, setAgentError] = useState('');
    const [runtimeConfig, setRuntimeConfig] = useState(null);
    const [runtimeConfigLoaded, setRuntimeConfigLoaded] = useState(false);
    const [remoteDocs, setRemoteDocs] = useState([]);
    const [remoteLoading, setRemoteLoading] = useState(false);
    const [remoteError, setRemoteError] = useState(false);
    const [giscusFailed, setGiscusFailed] = useState(false);
    const [heroTiltX, setHeroTiltX] = useState(0);
    const [heroTiltY, setHeroTiltY] = useState(0);

    const heroTarget = useRef({ x: 0, y: 0 });
    const heroTilt = useRef({ x: 0, y: 0 });
    const heroTiltRafRef = useRef(null);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        agentMessagesRef.current = agentMessages;
    }, [agentMessages]);

    useEffect(() => {
        hoverRef.current = isHoveringPhotos;
    }, [isHoveringPhotos]);

    useEffect(() => {
        heroScrollProgressRef.current = heroScrollProgress;
    }, [heroScrollProgress]);

    const heroDepthStyle = useMemo(() => {
        const progress = heroScrollProgress;
        const eased = 1 - Math.pow(1 - progress, 2.2);
        const layoutLift = 1 - Math.pow(1 - progress, 1.25);
        return {
            opacity: heroOpacity,
            transform: `perspective(1200px) translateY(${-eased * 120}px) translateZ(${-eased * 240}px) scale(${1 - eased * 0.18})`,
            filter: `blur(${eased * 8}px) saturate(${1 - eased * 0.28}) brightness(${1 - eased * 0.22})`,
            marginBottom: `-${(layoutLift * 48).toFixed(2)}vh`,
            pointerEvents: progress > 0.82 ? 'none' : 'auto'
        };
    }, [heroOpacity, heroScrollProgress]);

    const heroTiltStyle = useMemo(() => ({
        transform: `perspective(900px) rotateX(${heroTiltX}deg) rotateY(${heroTiltY}deg)`
    }), [heroTiltX, heroTiltY]);

    const articleTags = useMemo(() => {
        const tags = new Set(['全部']);
        CONTENT_ARTICLES.forEach(article => (article.tags || []).forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, []);

    const filteredArticles = useMemo(() => {
        if (selectedArticleTag === '全部') return CONTENT_ARTICLES.filter(article => article.featured);
        return CONTENT_ARTICLES.filter(article => article.featured && (article.tags || []).includes(selectedArticleTag));
    }, [selectedArticleTag]);

    const recentFeed = useMemo(() => {
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
    }, []);

    const chromaArticleItems = useMemo(() => {
        const palettes = [
            { border: '#5cd5c4', gradient: 'linear-gradient(145deg, rgba(92, 213, 196, 0.42), #05070a 70%)' },
            { border: '#f4a261', gradient: 'linear-gradient(160deg, rgba(244, 162, 97, 0.42), #05070a 72%)' },
            { border: '#8ec5ff', gradient: 'linear-gradient(180deg, rgba(92, 146, 220, 0.45), #05070a 72%)' },
            { border: '#c7f464', gradient: 'linear-gradient(210deg, rgba(128, 190, 86, 0.38), #05070a 74%)' },
            { border: '#ff6b8a', gradient: 'linear-gradient(165deg, rgba(255, 107, 138, 0.38), #05070a 74%)' },
            { border: '#b8a1ff', gradient: 'linear-gradient(195deg, rgba(142, 123, 255, 0.42), #05070a 72%)' }
        ];
        return filteredArticles.map((article, index) => {
            const palette = palettes[index % palettes.length];
            return {
                image: article.image,
                title: article.title,
                subtitle: article.description,
                handle: article.comment,
                location: (article.tags || []).slice(0, 3).join(' / '),
                borderColor: palette.border,
                gradient: palette.gradient,
                url: article.link
            };
        });
    }, [filteredArticles]);

    const localSearchIndex = useMemo(() => {
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
        const statusItems = [{
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
        }];
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
    }, []);

    const localResults = useMemo(() => searchItems(localSearchIndex, searchQuery), [localSearchIndex, searchQuery]);
    const remoteResults = useMemo(() => searchItems(remoteDocs, searchQuery), [remoteDocs, searchQuery]);
    const stripStyle = useMemo(() => ({
        transform: `translateX(${stripOffset}px)`,
        transition: stripTransition ? 'transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none'
    }), [stripOffset, stripTransition]);

    const updatePhotoStyles = useCallback((isActive = activeIndexRef.current !== -1) => {
        const strip = photoStripRef.current;
        if (!strip) return;
        const stripRect = strip.getBoundingClientRect();
        const stripCenterX = stripRect.left + stripRect.width / 2;
        const stripCenterY = stripRect.top + stripRect.height / 2;
        const active = activeIndexRef.current;

        setPhotoMoveStyles(displayPhotos.map((_, idx) => {
            const el = photoRefs.current[idx];
            if (!el) return {};
            if (idx === active && isActive) {
                const rect = el.getBoundingClientRect();
                const itemCenterX = rect.left + rect.width / 2;
                const itemCenterY = rect.top + rect.height / 2;
                return {
                    transform: `translate(${stripCenterX - itemCenterX}px, ${stripCenterY - itemCenterY}px) perspective(900px) rotateY(0deg)`,
                    zIndex: 12
                };
            }
            if (isActive) {
                const dir = idx < active ? 1 : -1;
                return { transform: `translate(0px, 0px) perspective(900px) rotateY(${dir * 40}deg)`, zIndex: 1 };
            }
            return { transform: 'translate(0px, 0px) perspective(900px) rotateY(0deg)', zIndex: 1 };
        }));

        setPhotoCardStyles(displayPhotos.map((_, idx) => {
            if (idx === active && isActive) return { transform: 'scale(1.38)' };
            if (isActive) return { transform: 'scale(0.86)' };
            return { transform: 'scale(1)' };
        }));
    }, [displayPhotos]);

    const updateStripStep = useCallback(() => {
        const strip = photoStripRef.current;
        if (!strip) return;
        const first = strip.querySelector('.photo-square');
        if (!first) return;
        const rect = first.getBoundingClientRect();
        const styles = window.getComputedStyle(strip);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        stripStepRef.current = rect.width + gap;
    }, []);

    const renderFeaturedPhotos = useCallback(() => {
        const container = featuredContainer.current;
        const width = container ? container.clientWidth : window.innerWidth;
        const limit = width <= 400 ? 8 : width <= 700 ? 12 : width <= 900 ? 16 : 20;
        const photos = getFeaturedPhotos(limit);
        setFeaturedPhotos(photos);
        setDisplayPhotos([]);
    }, []);

    const isEdgePhoto = useCallback(index => index < EDGE_COUNT || index >= displayPhotos.length - EDGE_COUNT, [displayPhotos.length]);

    function refreshSidePhotos(centerIndex) {
        const active = displayPhotos[centerIndex];
        const newPhotos = pickRandomPhotos(featuredPhotos, displayPhotos.length - 1, [active]);
        let cursor = 0;
        setDisplayPhotos(displayPhotos.map((photo, idx) => {
            if (idx === centerIndex) return photo;
            const replacement = newPhotos[cursor] || photo;
            cursor += 1;
            return {
                ...replacement,
                idKey: `${replacement.fileName || replacement.data}-${idx}-${Math.random().toString(36).slice(2, 7)}`
            };
        }));
        window.setTimeout(() => updatePhotoStyles(true), 0);
    }

    function activatePhoto(index) {
        hoverRef.current = true;
        activeIndexRef.current = index;
        setIsHoveringPhotos(true);
        setActiveIndex(index);
        window.setTimeout(() => updatePhotoStyles(true), 0);
        refreshSidePhotos(index);
    }

    function resetActivePhoto() {
        hoverRef.current = false;
        activeIndexRef.current = -1;
        setIsHoveringPhotos(false);
        setActiveIndex(-1);
        window.setTimeout(() => updatePhotoStyles(false), 0);
    }

    function goGallery(photo) {
        const id = photo && (photo.id || photo.fileName);
        window.location.href = id ? `gallery.html#photo=${encodeURIComponent(id)}` : 'gallery.html';
    }

    const loadRuntimeConfig = useCallback(() => {
        if (runtimeConfigLoaded) return Promise.resolve(runtimeConfig);
        if (runtimeConfigPromiseRef.current) return runtimeConfigPromiseRef.current;

        runtimeConfigPromiseRef.current = fetch(AGENT_CONFIG_URL, { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .catch(() => null)
            .then(config => {
                setRuntimeConfig(config);
                setRuntimeConfigLoaded(true);
                return config;
            })
            .finally(() => {
                runtimeConfigPromiseRef.current = null;
            });

        return runtimeConfigPromiseRef.current;
    }, [runtimeConfig, runtimeConfigLoaded]);

    function getServiceHref(service) {
        const serviceLinks = runtimeConfig?.services || runtimeConfig?.homelab || {};
        return String(serviceLinks[service.configKey] || '').trim();
    }

    const loadRemoteSearchIndex = useCallback(() => {
        if (remoteDocs.length || remoteLoading) return;
        setRemoteLoading(true);
        setRemoteError(false);
        fetch(NOTES_SEARCH_INDEX_URL)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load notes index');
                return response.json();
            })
            .then(result => {
                const docs = Array.isArray(result.docs) ? result.docs : [];
                setRemoteDocs(docs.map((doc, index) => {
                    const text = stripHtml(doc.text || '');
                    return {
                        id: `note-${index}-${doc.location || ''}`,
                        title: doc.title || '未命名笔记',
                        description: text.slice(0, 120),
                        body: text,
                        url: normalizeNotesUrl(doc.location)
                    };
                }));
            })
            .catch(() => setRemoteError(true))
            .finally(() => setRemoteLoading(false));
    }, [remoteDocs.length, remoteLoading]);

    function openSearch() {
        setIsAgentClosing(false);
        setIsSearchOpen(true);
    }

    function closeSearch() {
        setIsAgentClosing(true);
        window.setTimeout(() => {
            setIsSearchOpen(false);
            setIsAgentClosing(false);
        }, 260);
    }

    function navigateWithTransition(event, href) {
        if (!href) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (isPageTransitioning) return;

        setIsPageTransitioning(true);
        window.setTimeout(() => {
            window.location.href = href;
        }, 180);
    }

    function extractAgentReply(result) {
        return result?.reply
            || result?.content
            || result?.message
            || result?.choices?.[0]?.message?.content
            || result?.choices?.[0]?.text
            || '';
    }

    async function getAgentContext(query) {
        let docs = remoteDocs;
        if (!docs.length) {
            try {
                setRemoteLoading(true);
                setRemoteError(false);
                docs = await fetchNotesDocuments();
                setRemoteDocs(docs);
            } catch (error) {
                setRemoteError(true);
                docs = [];
            } finally {
                setRemoteLoading(false);
            }
        }

        const localContext = searchItems(localSearchIndex, query).map(item => ({
            source: 'homepage',
            type: item.type,
            title: item.title,
            description: item.description,
            url: item.url,
            body: item.body
        }));
        const notesContext = searchItems(docs, query).map(item => ({
            source: 'notes',
            type: '笔记',
            title: item.title,
            description: item.description,
            url: item.url,
            body: item.body
        }));

        return [...notesContext, ...localContext].slice(0, AGENT_CONTEXT_LIMIT);
    }

    function buildFallbackAgentReply(query, context) {
        if (!context.length) {
            return `我已经检索了主页与笔记索引，但暂时没有找到和「${query}」直接相关的内容。你可以换一个更具体的关键词，或稍后配置 Agent API endpoint 让模型做更宽松的语义理解。`;
        }

        const lines = context.slice(0, 5).map((item, index) => {
            const text = item.description || item.body || '';
            return `${index + 1}. ${item.title}：${text.slice(0, 90)}${text.length > 90 ? '...' : ''}`;
        });
        return `我先从笔记库和主页里找到了这些线索：\n\n${lines.join('\n')}\n\nAPI endpoint 配好后，我会把这些召回片段作为上下文交给模型，回答会更像真正的知识库 Agent。`;
    }

    async function submitAgentMessage(event) {
        event.preventDefault();
        const prompt = agentInput.trim();
        if (!prompt || agentLoading) return;

        setAgentInput('');
        setAgentError('');
        const nextMessages = [...agentMessagesRef.current, { role: 'user', content: prompt }];
        setAgentMessages(nextMessages);
        setAgentLoading(true);

        try {
            const [config, context] = await Promise.all([
                loadRuntimeConfig(),
                getAgentContext(prompt)
            ]);
            const agentConfig = config?.agent || {};
            const endpoint = String(agentConfig.endpoint || config?.agentEndpoint || '').trim();

            if (!endpoint) {
                setAgentMessages(messages => [...messages, {
                    role: 'assistant',
                    content: buildFallbackAgentReply(prompt, context),
                    context
                }]);
                return;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(agentConfig.headers || {})
                },
                body: JSON.stringify({
                    query: prompt,
                    messages: nextMessages,
                    context,
                    options: agentConfig.options || {},
                    source: 'chen-homepage-agent'
                })
            });

            if (!response.ok) throw new Error(`Agent API failed: ${response.status}`);
            const result = await response.json();
            const reply = extractAgentReply(result) || buildFallbackAgentReply(prompt, context);
            setAgentMessages(messages => [...messages, { role: 'assistant', content: reply, context }]);
        } catch (error) {
            setAgentError('Agent 暂时没有连上 API，已保留你的问题。');
            const context = await getAgentContext(prompt);
            setAgentMessages(messages => [...messages, {
                role: 'assistant',
                content: buildFallbackAgentReply(prompt, context),
                context
            }]);
        } finally {
            setAgentLoading(false);
        }
    }

    function loadVideoCovers(videos) {
        if (videoCoversLoadedRef.current) return;
        videoCoversLoadedRef.current = true;
        videos.forEach(video => {
            loadBilibiliCover(video.bvid)
                .then(validateCoverUrl)
                .then(crawledCover => crawledCover || validateCoverUrl(resolveFallbackCover(video)))
                .then(coverUrl => {
                    if (coverUrl) {
                        setFocusVideos(items => items.map(item => item.id === video.id ? { ...item, coverUrl } : item));
                    }
                })
                .catch(() => {});
        });
    }

    function buildFocusVideos() {
        const videos = Array.isArray(FOCUS_VIDEO_LIBRARY)
            ? FOCUS_VIDEO_LIBRARY.filter(item => item && (item.link || item.bvid))
            : [];
        const nextVideos = videos.map(videoItem => {
            const biliInfo = resolveBilibiliInfo(videoItem);
            if (!biliInfo) return null;
            return {
                ...videoItem,
                bvid: biliInfo.bvid,
                openUrl: biliInfo.openUrl,
                embedUrl: biliInfo.embedUrl,
                coverUrl: resolveFallbackCover(videoItem),
                isPreviewing: false
            };
        }).filter(Boolean);
        setFocusVideos(nextVideos);
        return nextVideos;
    }

    function handleVideoEnter(video) {
        setFocusVideos(items => items.map(item => item.id === video.id ? { ...item, isPreviewing: true } : item));
    }

    function handleVideoLeave(video) {
        setFocusVideos(items => items.map(item => item.id === video.id ? { ...item, isPreviewing: false } : item));
    }

    function startHeroTiltLoop() {
        if (heroTiltRafRef.current) return;
        const tickTilt = () => {
            const ease = 0.08;
            const dx = heroTarget.current.x - heroTilt.current.x;
            const dy = heroTarget.current.y - heroTilt.current.y;
            const done = Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01;
            heroTilt.current = {
                x: done ? heroTarget.current.x : heroTilt.current.x + dx * ease,
                y: done ? heroTarget.current.y : heroTilt.current.y + dy * ease
            };
            setHeroTiltX(current => Math.abs(current - heroTilt.current.x) > 0.01 ? heroTilt.current.x : current);
            setHeroTiltY(current => Math.abs(current - heroTilt.current.y) > 0.01 ? heroTilt.current.y : current);
            if (done) {
                heroTiltRafRef.current = null;
                return;
            }
            heroTiltRafRef.current = window.requestAnimationFrame(tickTilt);
        };
        heroTiltRafRef.current = window.requestAnimationFrame(tickTilt);
    }

    function updateHeaderHeroOpacity() {
        const progress = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.68)));
        const eased = 1 - Math.pow(1 - progress, 1.8);
        const nextOpacity = Math.max(0, 1 - eased);
        heroScrollProgressRef.current = progress;
        heroOpacityRef.current = nextOpacity;
        setHeroScrollProgress(current => Math.abs(current - progress) > 0.004 ? progress : current);
        setHeroOpacity(current => Math.abs(current - nextOpacity) > 0.004 ? nextOpacity : current);
    }

    function handleHeroTilt(event) {
        const currentTarget = event.currentTarget;
        if (!currentTarget || typeof currentTarget.getBoundingClientRect !== 'function') return;
        const rect = currentTarget.getBoundingClientRect();
        const viewportX = Math.max(0, Math.min(1, (event.clientX - rect.left) / (rect.width || 1)));
        const viewportY = Math.max(0, Math.min(1, (event.clientY - rect.top) / (rect.height || 1)));
        const maxTilt = 6;
        heroTarget.current = {
            y: Math.max(-maxTilt, Math.min(maxTilt, (viewportX - 0.5) * 2 * maxTilt)),
            x: Math.max(-maxTilt, Math.min(maxTilt, -(viewportY - 0.5) * 2 * maxTilt))
        };
        startHeroTiltLoop();
    }

    function resetHeroTilt() {
        heroTarget.current = { x: 0, y: 0 };
        startHeroTiltLoop();
    }

    useEffect(() => {
        document.body.style.overflow = isSearchOpen ? 'hidden' : '';
        if (isSearchOpen) {
            window.setTimeout(() => agentInputRef.current && agentInputRef.current.focus(), 0);
            loadRuntimeConfig();
            loadRemoteSearchIndex();
        }
        return () => {
            if (!isSearchOpen) document.body.style.overflow = '';
        };
    }, [isSearchOpen, loadRemoteSearchIndex, loadRuntimeConfig]);

    useEffect(() => {
        loadRuntimeConfig();
        renderFeaturedPhotos();
        const initialVideos = buildFocusVideos();
        updateHeaderHeroOpacity();

        const cleanupStarfield = startStarfield(starfieldCanvas.current, 'star');
        let cleanupHeroFluid = null;
        let mounted = true;
        import('../utils/fluidHero')
            .then(({ startHeroFluid }) => {
                if (!mounted) return;
                cleanupHeroFluid = startHeroFluid(fluidCanvas.current, {
                    getOpacity: () => Math.max(0, 1 - heroScrollProgressRef.current * 1.35)
                });
            })
            .catch(() => {
                cleanupHeroFluid = null;
            });

        let typedTimer = null;
        const phrases = ['Bamb0oChen の空间', 'ZJUer / CS Learner', 'Counter-Strike & CS', 'Coffee & Pingpong', 'Koala@ZJU / X-Lab@ZJU'];
        let pi = 0;
        let ci = 0;
        let deleting = false;
        const tickTyping = () => {
            const full = phrases[pi];
            if (!deleting) {
                ci += 1;
                setTypedText(full.slice(0, ci));
                if (ci === full.length) {
                    deleting = true;
                    typedTimer = window.setTimeout(tickTyping, 1200);
                    return;
                }
            } else {
                ci -= 1;
                setTypedText(full.slice(0, ci));
                if (ci === 0) {
                    deleting = false;
                    pi = (pi + 1) % phrases.length;
                }
            }
            typedTimer = window.setTimeout(tickTyping, deleting ? 50 : 90);
        };
        typedTimer = window.setTimeout(tickTyping, 400);

        let resizeTimer = null;
        let scrollRaf = null;
        const resizeHandler = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                renderFeaturedPhotos();
                updatePhotoStyles(activeIndexRef.current !== -1);
                updateStripStep();
            }, 150);
        };
        const scrollHandler = () => {
            if (scrollRaf) return;
            scrollRaf = window.requestAnimationFrame(() => {
                scrollRaf = null;
                updateHeaderHeroOpacity();
            });
        };
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('scroll', scrollHandler, { passive: true });

        let videoObserver = null;
        if ('IntersectionObserver' in window && videoSectionRef.current) {
            videoObserver = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    loadVideoCovers(initialVideos);
                    videoObserver.disconnect();
                    videoObserver = null;
                }
            }, { rootMargin: '360px 0px' });
            videoObserver.observe(videoSectionRef.current);
        } else {
            window.setTimeout(() => loadVideoCovers(initialVideos), 1600);
        }

        let giscusFailTimer = null;
        let giscusObserver = null;
        let giscusLoaded = false;
        const loadGiscus = () => {
            if (giscusLoaded || !giscusContainer.current) return;
            giscusLoaded = true;
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
            script.onerror = () => setGiscusFailed(true);
            script.onload = () => {
                window.clearTimeout(giscusFailTimer);
                setGiscusFailed(false);
            };
            giscusContainer.current.appendChild(script);
            giscusFailTimer = window.setTimeout(() => {
                const iframe = giscusContainer.current && giscusContainer.current.querySelector('iframe');
                if (!iframe) setGiscusFailed(true);
            }, 8000);
        };

        if (giscusContainer.current) {
            if ('IntersectionObserver' in window) {
                giscusObserver = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        loadGiscus();
                        giscusObserver.disconnect();
                        giscusObserver = null;
                    }
                }, { rootMargin: '420px 0px' });
                giscusObserver.observe(giscusContainer.current);
            } else {
                window.setTimeout(loadGiscus, 2200);
            }
        }

        return () => {
            mounted = false;
            window.clearTimeout(typedTimer);
            window.clearTimeout(resizeTimer);
            window.clearTimeout(giscusFailTimer);
            if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
            if (videoObserver) videoObserver.disconnect();
            if (giscusObserver) giscusObserver.disconnect();
            if (cleanupStarfield) cleanupStarfield();
            if (cleanupHeroFluid) cleanupHeroFluid();
            if (heroTiltRafRef.current) window.cancelAnimationFrame(heroTiltRafRef.current);
            document.body.style.overflow = '';
            window.removeEventListener('resize', resizeHandler);
            window.removeEventListener('scroll', scrollHandler);
        };
    }, []);

    useEffect(() => {
        window.setTimeout(() => {
            updatePhotoStyles(activeIndexRef.current !== -1);
            updateStripStep();
        }, 0);
    }, [displayPhotos, updatePhotoStyles, updateStripStep]);

    useEffect(() => {
        if (!displayPhotos.length) return undefined;
        const timer = window.setInterval(() => {
            if (hoverRef.current || !stripStepRef.current) return;
            setStripTransition(true);
            setStripOffset(-stripStepRef.current);
            window.setTimeout(() => {
                setDisplayPhotos(items => withIdKeys(items.slice(1).concat(items[0])));
                setStripTransition(false);
                setStripOffset(0);
                window.setTimeout(() => setStripTransition(true), 16);
            }, 620);
        }, 2200);
        return () => window.clearInterval(timer);
    }, [displayPhotos.length]);

    return (
        <div>
            <canvas ref={starfieldCanvas} id="starfield" className="starfield-canvas" aria-hidden="true"></canvas>
            <canvas ref={fluidCanvas} className="hero-fluid-canvas" aria-hidden="true"></canvas>

            <header id="header" style={{ opacity: headerOpacity }}>
                <div className="site-header-inner">
                    <div className="site-brand">Chen.のhomepage</div>
                    <nav className="site-nav" aria-label="主导航">
                        <button className={`nav-btn nav-btn-button ${isSearchOpen ? 'is-active' : ''}`} type="button" onClick={openSearch}>Agent</button>
                        <a href="gallery.html" className="nav-btn" onClick={event => navigateWithTransition(event, 'gallery.html')}>光影留痕</a>
                        <a href={CHANGELOG_DOC_URL} className="nav-btn" onClick={event => navigateWithTransition(event, CHANGELOG_DOC_URL)}>更新日志</a>
                        <a href="https://Bamb0oChen.github.io/notes/" className="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                    </nav>
                </div>
            </header>

            <section className="hero" style={heroDepthStyle}>
                <div className="hero-tilt" style={heroTiltStyle} onMouseMove={handleHeroTilt} onMouseLeave={resetHeroTilt}>
                    <div className="hero-shell">
                        <div className="hero-content">
                            <h1 className="greeting">欢迎来到 Chen.のhomepage</h1>
                            <div className="typed-wrapper">
                                <span className="typed-text">{typedText}</span>
                                <span className="cursor" aria-hidden="true"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content compact-section server-nav-section" aria-labelledby="server-nav-title">
                <div className="server-nav-shell">
                    <div className="server-nav-copy">
                        <p className="section-kicker">Homelab</p>
                        <h2 id="server-nav-title">Private Dock</h2>
                        <p className="server-private-note">服务入口由运行时配置接管，页面不暴露节点地址、端口或内部路径。</p>
                        <p className="server-legacy-note" aria-hidden="true"></p>
                    </div>
                    <div className="server-service-grid">
                        {SERVER_SERVICES.map(service => {
                            const serviceHref = getServiceHref(service);
                            return (
                            <a key={service.id} className={`server-service-card server-service-card--${service.illustration} ${serviceHref ? '' : 'is-disabled'}`} href={serviceHref || undefined} target={serviceHref ? '_blank' : undefined} rel={serviceHref ? 'noopener noreferrer' : undefined} aria-disabled={!serviceHref} onClick={event => !serviceHref && event.preventDefault()}>
                                <div className="server-card-topline">
                                    <span>{service.label}</span>
                                    <span>{service.status}</span>
                                </div>
                                <div className="server-illustration" aria-hidden="true">
                                    <span className="server-ill-main"></span>
                                    <span className="server-ill-accent"></span>
                                    <span className="server-ill-dot"></span>
                                </div>
                                <div className="server-card-content">
                                    <h3>{service.title}</h3>
                                    <p>{service.description}</p>
                                    <span className="server-card-link">{serviceHref ? 'Open private route' : 'Configure route'}</span>
                                </div>
                            </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="content" ref={featuredContainer}>
                <div className="section-heading"><p className="section-kicker">Lighttrace</p><h2>精选光影</h2></div>
                <div className="photo-container">
                    {featuredPhotos.length === 0 ? (
                        <div className="empty-state">暂无光影留痕，<a href="gallery.html">去上传</a></div>
                    ) : (
                        <div className="dome-gallery-wrap">
                            <DomeGallery
                                images={featuredPhotos.map(photo => ({
                                    src: photo.data,
                                    alt: photo.title || photo.fileName || '光影留痕'
                                }))}
                                minRadius={650}
                                maxVerticalRotationDeg={20}
                                segments={26}
                                dragDampening={2.6}
                                grayscale={false}
                            />
                        </div>
                    )}
                </div>
            </section>

            <section className="content">
                <div className="section-heading"><p className="section-kicker">Writing</p><h2>妙笔生花</h2></div>
                <div className="filter-row" aria-label="文章分类筛选">
                    {articleTags.map(tag => (
                        <button key={tag} type="button" className={`filter-chip ${selectedArticleTag === tag ? 'active' : ''}`} onClick={() => setSelectedArticleTag(tag)}>
                            <span>{tag}</span>
                        </button>
                    ))}
                </div>
                <div
                    className="writing-chroma-wrap"
                    style={{ '--writing-rows': Math.max(1, Math.ceil(chromaArticleItems.length / 3)) }}
                >
                    <ChromaGrid
                        items={chromaArticleItems}
                        radius={300}
                        columns={3}
                        rows={2}
                        damping={0.45}
                        fadeOut={0.6}
                        ease="power3.out"
                    />
                </div>
            </section>

            <section className="content" ref={videoSectionRef}>
                <div className="video-showcase">
                    <div className="video-copy">
                        <p className="section-kicker">Video</p>
                        <h2>用心做视频</h2>
                        <p>把旅行、城市与片刻情绪剪成可以回访的时间切片。右侧卡组会自动轮换，点击任意一张直接打开 B 站。</p>
                        <div className="video-actions">
                            <a href={focusVideos[0]?.openUrl || 'https://www.bilibili.com/'} target="_blank" rel="noopener noreferrer">打开最新视频</a>
                            <a href="https://space.bilibili.com/" target="_blank" rel="noopener noreferrer">Bilibili</a>
                        </div>
                    </div>
                    <div className="video-swap-stage">
                        {focusVideos.length === 0 ? (
                            <div className="empty-state">暂无视频，请在 src/data/siteData.js 的 FOCUS_VIDEO_LIBRARY 中添加 B 站 link/bvid 条目。</div>
                        ) : (
                            <CardSwap
                                width={560}
                                height={390}
                                cardDistance={78}
                                verticalDistance={88}
                                delay={5000}
                                pauseOnHover={false}
                                skewAmount={5}
                                easing="elastic"
                                onCardClick={index => {
                                    const video = focusVideos[index % focusVideos.length];
                                    if (video?.openUrl) window.open(video.openUrl, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                {focusVideos.map(video => (
                                    <Card key={video.id} customClass="video-swap-card">
                                        <div className="video-swap-cover" style={video.coverUrl ? { backgroundImage: `url('${video.coverUrl}')` } : {}}>
                                            {!video.coverUrl && <div className="video-swap-cover-fallback">{video.title || '未命名视频'}</div>}
                                            <span>Bilibili</span>
                                        </div>
                                        <div className="video-swap-body">
                                            <div className="tag-line"><span>{video.comment || '视频'}</span></div>
                                            <h3>{video.title || '未命名视频'}</h3>
                                            <p>{video.description || '专注记录'}</p>
                                            <div className="article-comment">{video.comment || '点击打开'}</div>
                                        </div>
                                    </Card>
                                ))}
                                {focusVideos.length === 1 && (
                                    <Card customClass="video-swap-card">
                                        <div className="video-swap-cover" style={focusVideos[0].coverUrl ? { backgroundImage: `url('${focusVideos[0].coverUrl}')` } : {}}>
                                            {!focusVideos[0].coverUrl && <div className="video-swap-cover-fallback">{focusVideos[0].title || '未命名视频'}</div>}
                                            <span>Bilibili</span>
                                        </div>
                                        <div className="video-swap-body">
                                            <div className="tag-line"><span>精选</span></div>
                                            <h3>{focusVideos[0].title || '未命名视频'}</h3>
                                            <p>{focusVideos[0].description || '专注记录'}</p>
                                            <div className="article-comment">再次回看</div>
                                        </div>
                                    </Card>
                                )}
                                {focusVideos.length < 3 && focusVideos.map(video => (
                                    <Card key={`${video.id}-echo`} customClass="video-swap-card">
                                        <div className="video-swap-cover" style={video.coverUrl ? { backgroundImage: `url('${video.coverUrl}')` } : {}}>
                                            {!video.coverUrl && <div className="video-swap-cover-fallback">{video.title || '未命名视频'}</div>}
                                            <span>Bilibili</span>
                                        </div>
                                        <div className="video-swap-body">
                                            <div className="tag-line"><span>{video.comment || '视频'}</span></div>
                                            <h3>{video.title || '未命名视频'}</h3>
                                            <p>{video.description || '专注记录'}</p>
                                            <div className="article-comment">轮换卡片</div>
                                        </div>
                                    </Card>
                                ))}
                            </CardSwap>
                        )}
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="section-heading"><p className="section-kicker">Music</p><h2>曲苑天地</h2></div>
                <div className="music-feature-layout">
                    <BorderGlow
                        className="music-board-wrap music-border-glow"
                        edgeSensitivity={28}
                        glowColor="184 82 72"
                        backgroundColor="rgba(6, 16, 26, 0.72)"
                        borderRadius={24}
                        glowRadius={46}
                        glowIntensity={1.15}
                        coneSpread={24}
                        animated
                        colors={['#5cd5c4', '#8ec5ff', '#f4a261']}
                        fillOpacity={0.32}
                    >
                        <p className="music-board-desc">嵌入 Apple Music 收藏歌单，歌单内容更新后这里会自动同步。</p>
                        <div className="music-embed">
                            <iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameBorder="0" width="100%" height="450" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/cn/playlist/favorite-songs/pl.u-aeUR5YapmR" loading="lazy"></iframe>
                        </div>
                    </BorderGlow>
                    <div className="music-model-card" aria-label="可旋转留声机模型">
                        <Suspense fallback={<div className="model-viewer model-viewer-placeholder">Preparing model</div>}>
                            <ModelViewer
                                url="models/gramophone/Gramophone.fbx"
                                height="clamp(500px, 48vw, 620px)"
                                defaultZoom={3.86}
                                modelScale={3.02}
                                modelXOffset={0.12}
                                modelYOffset={-0.04}
                                minZoomDistance={2.8}
                                maxZoomDistance={6}
                                autoRotate
                                autoRotateSpeed={0.55}
                                enableManualZoom={false}
                                environmentPreset="warehouse"
                            />
                        </Suspense>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="section-heading"><p className="section-kicker">Friends</p><h2>缘分天空</h2></div>
                <div className="articles-grid friend-grid" aria-label="友链列表">
                    {FRIEND_LINKS.map(friend => (
                        <a key={friend.id} className="article-card friend-card" href={friend.url} target="_blank" rel="noopener noreferrer" aria-label={`访问 ${friend.name}`}>
                            <div className="article-content friend-content">
                                <img src={friend.avatar} alt={friend.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                                <div><h3>{friend.name}</h3><p>{friend.description}</p><div className="article-comment">{friend.note}</div></div>
                            </div>
                        </a>
                    ))}
                    <a className="article-card friend-card apply-card" href="#guestbook"><div className="article-content"><h3>友链申请</h3><p>在留言区留下站点名、链接、头像和一句介绍。</p><div className="article-comment">欢迎来串门</div></div></a>
                </div>
            </section>

            <section id="guestbook" className="content">
                <div className="section-heading"><p className="section-kicker">Guestbook</p><h2>访客留言</h2></div>
                <div className="guestbook-panel">
                    <div ref={giscusContainer}></div>
                    {giscusFailed && (
                        <div className="giscus-fallback">
                            留言组件暂时没有加载成功，可以前往 <a href="https://github.com/Bamb0oChen/notes/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions</a> 或 <a href="https://Bamb0oChen.github.io/notes/" target="_blank" rel="noopener noreferrer">笔记站</a> 找到我。
                        </div>
                    )}
                </div>
            </section>

            {isSearchOpen && (
                <div className={`agent-overlay ${isAgentClosing ? 'is-closing' : 'is-open'}`} onClick={event => event.target === event.currentTarget && closeSearch()}>
                    <section className="agent-panel" role="dialog" aria-modal="true" aria-label="Homepage Agent">
                        <div className="search-header">
                            <div><p className="section-kicker">Agent</p><h2>Chen.のhomepage Agent</h2></div>
                            <button className="search-close" type="button" onClick={closeSearch}>×</button>
                        </div>
                        <div className="agent-layout">
                            <aside className="agent-sidebar">
                                <div>
                                    <p className="section-kicker">Agent</p>
                                    <h2>Notes Copilot</h2>
                                    <p>以主页内容和 notes 搜索索引为上下文。API 端点从运行时配置读取，不写入仓库。</p>
                                </div>
                                <div className="agent-source-stack">
                                    <span>{remoteLoading ? 'Index loading' : remoteError ? 'Notes fallback' : 'Notes ready'}</span>
                                    <span>{runtimeConfig?.agent?.endpoint || runtimeConfig?.agentEndpoint ? 'API connected' : 'API not configured'}</span>
                                    <span>{remoteDocs.length || 0} note chunks</span>
                                </div>
                            </aside>
                            <div className="agent-chat">
                                <div className="agent-messages">
                                    {agentMessages.map((message, index) => (
                                        <div key={`${message.role}-${index}`} className={`agent-message agent-message--${message.role}`}>
                                            <div className="agent-message-role">{message.role === 'user' ? 'You' : 'Agent'}</div>
                                            <p>{message.content}</p>
                                            {message.context?.length > 0 && (
                                                <div className="agent-citations">
                                                    {message.context.slice(0, 3).map(item => (
                                                        <a key={`${item.source}-${item.url}-${item.title}`} href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {agentLoading && (
                                        <div className="agent-message agent-message--assistant is-loading">
                                            <div className="agent-message-role">Agent</div>
                                            <p>正在检索笔记并组织回答...</p>
                                        </div>
                                    )}
                                </div>
                                {agentError && <div className="agent-error">{agentError}</div>}
                                <form className="agent-composer" onSubmit={submitAgentMessage}>
                                    <textarea ref={agentInputRef} value={agentInput} onChange={event => setAgentInput(event.target.value)} placeholder="问问笔记库，比如：线性代数里我写过什么？" rows={1} onKeyDown={event => {
                                        if (event.key === 'Escape') closeSearch();
                                        if (event.key === 'Enter' && !event.shiftKey) submitAgentMessage(event);
                                    }} />
                                    <button type="submit" disabled={!agentInput.trim() || agentLoading}>Send</button>
                                </form>
                            </div>
                        </div>
                        <input ref={searchInput} value={searchQuery} onChange={event => setSearchQuery(event.target.value.trimStart())} className="search-input legacy-search-control" type="search" placeholder="试试 NLP、线性代数、游乐园..." onKeyDown={event => event.key === 'Escape' && closeSearch()} />
                        <div className="search-meta">
                            {remoteLoading ? <span>正在载入笔记索引...</span> : remoteError ? <span>远程笔记索引暂不可用，当前仅显示主页结果。</span> : <span>结果来自主页内容与 notes 搜索索引。</span>}
                        </div>
                        <div className="search-results">
                            <div className="search-group">
                                <h3>主页</h3>
                                {localResults.map(result => <a key={result.id} className="search-result" href={result.url} target={result.external ? '_blank' : undefined} rel={result.external ? 'noopener noreferrer' : undefined}><span>{result.type}</span><strong>{result.title}</strong><p>{result.description}</p></a>)}
                                {searchQuery && localResults.length === 0 && <p className="empty-result">没有匹配的主页内容。</p>}
                            </div>
                            <div className="search-group">
                                <h3>笔记</h3>
                                {remoteResults.map(result => <a key={result.id} className="search-result" href={result.url} target="_blank" rel="noopener noreferrer"><span>笔记</span><strong>{result.title}</strong><p>{result.description}</p></a>)}
                                {searchQuery && remoteResults.length === 0 && <p className="empty-result">没有匹配的笔记内容。</p>}
                            </div>
                        </div>
                    </section>
                </div>
            )}
            {isPageTransitioning && (
                <div className="page-transition-overlay" aria-hidden="true">
                    <div className="page-transition-pill">Chen.のhomepage</div>
                </div>
            )}
        </div>
    );
}
