import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLighttraceLibrary } from '../data/siteData';

const GALLERY_KEY = 'gallery_images_v1';
const MAX_IMAGES = 25;
const PAGE_SIZE = 25;

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
        location: item.location || '',
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
    const [images, setImages] = useState(() => (useLocalLibrary ? loadLocalLibrary() : loadImages()));
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    const totalPages = useMemo(() => {
        if (!useLocalLibrary) return 1;
        return Math.max(1, Math.ceil(images.length / PAGE_SIZE));
    }, [images.length]);

    const pagedImages = useMemo(() => {
        if (!useLocalLibrary) return images;
        const page = Math.min(currentPage, totalPages);
        const start = (page - 1) * PAGE_SIZE;
        return images.slice(start, start + PAGE_SIZE);
    }, [currentPage, images, totalPages]);

    const modalImageIndex = useMemo(() => {
        if (!modalImage) return -1;
        return images.findIndex(img => img.id === modalImage.id);
    }, [images, modalImage]);

    const previousImage = modalImageIndex <= 0 ? null : images[modalImageIndex - 1];
    const nextImage = modalImageIndex < 0 || modalImageIndex >= images.length - 1 ? null : images[modalImageIndex + 1];
    const showEmpty = pagedImages.length === 0;
    const showPagination = useLocalLibrary && totalPages > 1;

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
        const targetIndex = images.findIndex(img => img.id === targetId || img.fileName === targetId);
        if (targetIndex < 0) return;
        setCurrentPage(Math.floor(targetIndex / PAGE_SIZE) + 1);
        openModal(images[targetIndex], true);
    }, [images, openModal]);

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
        <div>
            <header id="header" style={{ opacity: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 1100, justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                        <a href="index.html" style={{ color: 'white', textDecoration: 'none' }}>Chen.のhomepage</a>
                    </div>
                    <div>
                        <a href="gallery.html" className="nav-btn" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>光影留痕</a>
                        <a href="https://Bamb0oChen.github.io/notes/" className="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                    </div>
                </div>
            </header>

            <div className="gallery-container">
                <div className="gallery-header">
                    <h1>光影留痕</h1>
                    <p>记录生活中的精彩瞬间</p>
                </div>
                <div id="localLibraryHint" className="gallery-hint">{localLibraryHint}</div>

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
                                        {modalImage?.date && <span>{modalImage.date}</span>}
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
