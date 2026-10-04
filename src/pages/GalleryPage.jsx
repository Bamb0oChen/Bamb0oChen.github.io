import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLighttraceLibrary } from '../data/siteData';
import LighttraceMap from '../components/LighttraceMap';
import { startStarfield } from '../utils/starfield';

const GALLERY_KEY = 'gallery_images_v1';
const MAX_IMAGES = 25;
const PAGE_SIZE = 25;
const CHANGELOG_DOC_URL = 'docs/changelog.html';

function navigateWithTransition(event, href) {
    if (!href) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    document.documentElement.classList.add('is-page-transitioning');
    window.setTimeout(() => {
        window.location.href = href;
    }, 180);
}

const localLibrary = getLighttraceLibrary();
const useLocalLibrary = localLibrary.length > 0;
const localLibraryHint = useLocalLibrary
    ? '当前为本地图库模式：请将图片放入 photos/lighttrace/ 并在 src/data/siteData.js 中配置。'
    : '';

function normalizeImage(item) {
    const src = item.src || item.file || item.data;
    return {
        id: item.id || src,
        data: src,
        title: item.title || item.fileName || item.id || src,
        comment: item.comment || '',
        createdAt: item.createdAt || item.date || '',
        date: item.date || item.createdAt || '',
        capturedAt: item.capturedAt || '',
        takenAt: item.takenAt || '',
        location: item.location || '',
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        device: item.device || '',
        tags: item.tags || [],
        fileName: item.fileName || item.id || src
    };
}

function loadLocalLibrary() {
    return localLibrary.filter(item => item && (item.src || item.file)).map(normalizeImage);
}

function loadImages() {
    try {
        const stored = localStorage.getItem(GALLERY_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return parsed.map(normalizeImage);
    } catch (e) {
        console.error('Failed to load images:', e);
        return [];
    }
}

function saveImages(images) {
    try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    } catch (e) {
        console.error('Failed to save images:', e);
        alert('保存失败：浏览器存储空间不足\n建议清除部分图片或清空浏览器缓存');
    }
}

export default function GalleryPage() {
    const starfieldCanvas = useRef(null);
    const [images, setImages] = useState(() => (useLocalLibrary ? loadLocalLibrary() : loadImages()));
    const [publishedImages, setPublishedImages] = useState(null);
    const [view, setView] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    const galleryImages = publishedImages?.length ? publishedImages : images;
    const hasPublishedMap = Boolean(publishedImages?.some(image => image.latitude !== null && image.longitude !== null));
    const mapImages = useMemo(() => galleryImages.filter(image => image.latitude !== null && image.longitude !== null), [galleryImages]);

    useEffect(() => {
        let active = true;
        fetch(new URL('photos/lighttrace-published/manifest.json', window.location.href))
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(manifest => {
                if (!active || !Array.isArray(manifest.photos)) return;
                const photos = manifest.photos.map(normalizeImage);
                setPublishedImages(photos);
                if (photos.some(image => image.latitude !== null && image.longitude !== null)) setView('map');
            })
            .catch(error => console.warn('Published Lighttrace album is unavailable:', error));
        return () => { active = false; };
    }, []);

    const totalPages = useMemo(() => {
        if (!useLocalLibrary) return 1;
        return Math.max(1, Math.ceil(galleryImages.length / PAGE_SIZE));
    }, [galleryImages.length]);

    const pagedImages = useMemo(() => {
        if (!useLocalLibrary) return galleryImages;
        const page = Math.min(currentPage, totalPages);
        const start = (page - 1) * PAGE_SIZE;
        return galleryImages.slice(start, start + PAGE_SIZE);
    }, [currentPage, galleryImages, totalPages]);

    const modalImageIndex = useMemo(() => {
        if (!modalImage) return -1;
        return galleryImages.findIndex(img => img.id === modalImage.id);
    }, [galleryImages, modalImage]);

    const previousImage = modalImageIndex <= 0 ? null : galleryImages[modalImageIndex - 1];
    const nextImage = modalImageIndex < 0 || modalImageIndex >= galleryImages.length - 1 ? null : galleryImages[modalImageIndex + 1];
    const showEmpty = pagedImages.length === 0;
    const showPagination = useLocalLibrary && totalPages > 1;

    useEffect(() => {
        const cleanupStarfield = startStarfield(starfieldCanvas.current, 'star');
        return () => cleanupStarfield?.();
    }, []);

    const updateHashForImage = useCallback(image => {
        if (!image || !image.id) return;
        history.replaceState(null, '', `#photo=${encodeURIComponent(image.id)}`);
    }, []);

    const openModal = useCallback((image, fromNav = false) => {
        if (!image) return;
        setModalImage(image);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
        if (!fromNav || image.id) updateHashForImage(image);
    }, [updateHashForImage]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        document.body.style.overflow = 'auto';
        setModalImage(null);
        if (location.hash.startsWith('#photo=')) {
            history.replaceState(null, '', location.pathname + location.search);
        }
    }, []);

    const openImageFromHash = useCallback(() => {
        const params = new URLSearchParams(location.hash.replace(/^#/, ''));
        const targetId = params.get('photo');
        if (!targetId) return;
        const targetIndex = galleryImages.findIndex(img => img.id === targetId || img.fileName === targetId);
        if (targetIndex < 0) return;
        setCurrentPage(Math.floor(targetIndex / PAGE_SIZE) + 1);
        openModal(galleryImages[targetIndex], true);
    }, [galleryImages, openModal]);

    useEffect(() => {
        openImageFromHash();
        window.addEventListener('hashchange', openImageFromHash);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('hashchange', openImageFromHash);
        };
    }, [openImageFromHash]);

    useEffect(() => {
        const handleKeydown = event => {
            if (!isModalOpen) return;
            if (event.key === 'Escape') closeModal();
            if (event.key === 'ArrowLeft' && previousImage) openModal(previousImage, true);
            if (event.key === 'ArrowRight' && nextImage) openModal(nextImage, true);
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [closeModal, isModalOpen, nextImage, openModal, previousImage]);

    const displayCells = useMemo(() => {
        const cells = [];
        const cellCount = useLocalLibrary ? pagedImages.length : MAX_IMAGES;
        for (let i = 0; i < cellCount; i += 1) {
            if (i < pagedImages.length) {
                const img = pagedImages[i];
                cells.push({ key: img.id || i, type: 'image', ...img });
            } else {
                cells.push({ key: `placeholder-${i}`, type: 'placeholder' });
            }
        }
        return cells;
    }, [pagedImages]);

    function deleteImage() {
        if (!modalImage) return;
        if (!confirm('确定要删除这张图片吗？')) return;
        const nextImages = images.filter(img => img.id !== modalImage.id);
        setImages(nextImages);
        saveImages(nextImages);
        closeModal();
    }

    function editComment() {
        if (!modalImage) return;
        const newComment = prompt('编辑评注（最多100字）:', modalImage.comment || '');
        if (newComment === null) return;
        const trimmedComment = newComment.trim().slice(0, 100);
        const nextImages = images.map(img => img.id === modalImage.id ? { ...img, comment: trimmedComment } : img);
        setImages(nextImages);
        setModalImage({ ...modalImage, comment: trimmedComment });
        saveImages(nextImages);
    }

    function goToPage(page) {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }

    return (
        <div className="gallery-page-shell">
            <canvas ref={starfieldCanvas} id="starfield" className="starfield-canvas" aria-hidden="true"></canvas>
            <header id="header" style={{ opacity: 1 }}>
                <div className="site-header-inner">
                    <div className="site-brand">
                        <a href="index.html">Chen.のhomepage</a>
                    </div>
                    <div className="site-nav">
                        <a href="index.html" className="nav-btn" onClick={event => navigateWithTransition(event, 'index.html')}>主页</a>
                        <a href="gallery.html" className="nav-btn is-active">光影留痕</a>
                        <a href={CHANGELOG_DOC_URL} className="nav-btn" onClick={event => navigateWithTransition(event, CHANGELOG_DOC_URL)}>更新日志</a>
                        <a href="https://Bamb0oChen.github.io/notes/" className="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                    </div>
                </div>
            </header>

            <div className="gallery-container">
                <div className="gallery-header">
                    <h1>光影留痕</h1>
                    <p>记录生活中的精彩瞬间</p>
                </div>
                <div className="gallery-view-switch" role="group" aria-label="光影留痕浏览方式">
                    <button type="button" className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}>地图</button>
                    <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}>全部照片</button>
                </div>
                {view === 'map' ? (
                    hasPublishedMap ? (
                        <div className="lighttrace-map-wrap">
                            <LighttraceMap images={mapImages} onSelect={openModal} />
                            <p>按拍摄时间连接 {mapImages.length} 张有 GPS 的 Immich 收藏照片；虚线代表时间或距离跨度较大的两站。连线不等于实际行驶路线。其他照片请切换到“全部照片”。</p>
                        </div>
                    ) : <div className="gallery-empty"><p>地图还没有公开照片。请先从 NAS 导出带 GPS 的 Immich 收藏照片。</p></div>
                ) : <>
                {!publishedImages?.length && <div id="localLibraryHint" className="gallery-hint">{localLibraryHint}</div>}

                <div className="gallery-grid">
                    {displayCells.map(cell => (
                        <button key={cell.key} className="gallery-cell" type="button" onClick={() => cell.type === 'image' && openModal(cell)}>
                            {cell.type === 'image' ? (
                                <>
                                    <img src={cell.data} alt={cell.title || cell.fileName} className="gallery-image" loading="lazy" decoding="async" />
                                    {(cell.title || cell.comment) && (
                                        <div className="gallery-comment" title={cell.comment || cell.title}>
                                            {cell.title || cell.comment}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="gallery-placeholder">+</div>
                            )}
                        </button>
                    ))}
                </div>

                {showEmpty && <div className="gallery-empty"><p>暂无图片，点击 "上传图片" 开始</p></div>}

                {showPagination && (
                    <div className="gallery-pagination">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>上一页</button>
                        <span>第 {currentPage} / {totalPages} 页</span>
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>下一页</button>
                    </div>
                )}
                </>}
            </div>

            {isModalOpen && (
                <div className="modal" onClick={event => event.target === event.currentTarget && closeModal()}>
                    <div className="modal-content photo-detail-modal">
                        <button className="modal-close" type="button" aria-label="关闭" onClick={closeModal}>&times;</button>
                        <div className="modal-body">
                            <div className="detail-image-wrap">
                                <img src={modalImage?.data} alt={modalImage?.title || modalImage?.fileName || ''} decoding="async" />
                            </div>
                            <div className="modal-info">
                                <div>
                                    <div className="detail-kicker">Lighttrace</div>
                                    <h2 className="detail-title">{modalImage?.title || modalImage?.fileName || '未命名光影'}</h2>
                                    <div className="detail-meta">
                                        {(modalImage?.takenAt || modalImage?.date) && <span>{modalImage.takenAt ? modalImage.takenAt.slice(0, 16).replace('T', ' ') : modalImage.date}</span>}
                                        {modalImage?.location && <span>{modalImage.location}</span>}
                                        {modalImage?.device && <span>{modalImage.device}</span>}
                                    </div>
                                    {!!modalImage?.tags?.length && (
                                        <div className="detail-tags">
                                            {modalImage.tags.map(tag => <span key={tag}>{tag}</span>)}
                                        </div>
                                    )}
                                    {modalImage?.comment ? <div className="modal-comment">{modalImage.comment}</div> : <div className="modal-comment muted">暂无评注</div>}
                                </div>
                                <div className="modal-actions">
                                    <div className="detail-nav">
                                        <button className="modal-btn" type="button" disabled={!previousImage} onClick={() => openModal(previousImage, true)}>上一张</button>
                                        <button className="modal-btn" type="button" disabled={!nextImage} onClick={() => openModal(nextImage, true)}>下一张</button>
                                    </div>
                                    {!useLocalLibrary && <button className="modal-btn delete-btn" type="button" onClick={deleteImage}>删除</button>}
                                    {!useLocalLibrary && <button className="modal-btn edit-btn" type="button" onClick={editComment}>编辑评注</button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
