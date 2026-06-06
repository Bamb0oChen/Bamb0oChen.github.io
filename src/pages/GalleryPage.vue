<template>
    <div>
        <header id="header" style="opacity: 1;">
            <div style="display:flex; align-items:center; gap:12px; width:100%; max-width:1100px; justify-content:space-between;">
                <div style="font-weight:bold; font-size:18px;">
                    <a href="index.html" style="color: white; text-decoration: none;">Chen.のhomepage</a>
                </div>
                <div>
                    <a href="gallery.html" class="nav-btn" style="background: rgba(255, 255, 255, 0.2);">光影留痕</a>
                    <a href="https://Bamb0oChen.github.io/notes/" class="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                </div>
            </div>
        </header>

        <div class="gallery-container">
            <div class="gallery-header">
                <h1>光影留痕</h1>
                <p>记录生活中的精彩瞬间</p>
            </div>
            <div id="localLibraryHint" class="gallery-hint">{{ localLibraryHint }}</div>

            <div class="gallery-grid">
                <button v-for="cell in displayCells" :key="cell.key" class="gallery-cell" type="button" @click="cell.onClick">
                    <template v-if="cell.type === 'image'">
                        <img :src="cell.data" :alt="cell.title || cell.fileName" class="gallery-image" />
                        <div v-if="cell.title || cell.comment" class="gallery-comment" :title="cell.comment || cell.title">
                            {{ cell.title || cell.comment }}
                        </div>
                    </template>
                    <template v-else>
                        <div class="gallery-placeholder">+</div>
                    </template>
                </button>
            </div>

            <div v-if="showEmpty" class="gallery-empty">
                <p>暂无图片，点击 "上传图片" 开始</p>
            </div>

            <div class="gallery-pagination" v-if="showPagination">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1">上一页</button>
                <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
                <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages">下一页</button>
            </div>
        </div>

        <div class="modal" v-show="isModalOpen" @click.self="closeModal">
            <div class="modal-content photo-detail-modal">
                <button class="modal-close" type="button" aria-label="关闭" @click="closeModal">&times;</button>
                <div class="modal-body">
                    <div class="detail-image-wrap">
                        <img :src="modalImage?.data" :alt="modalImage?.title || modalImage?.fileName || ''" />
                    </div>
                    <div class="modal-info">
                        <div>
                            <div class="detail-kicker">Lighttrace</div>
                            <h2 class="detail-title">{{ modalImage?.title || modalImage?.fileName || '未命名光影' }}</h2>
                            <div class="detail-meta">
                                <span v-if="modalImage?.date">{{ modalImage.date }}</span>
                                <span v-if="modalImage?.location">{{ modalImage.location }}</span>
                                <span v-if="modalImage?.device">{{ modalImage.device }}</span>
                            </div>
                            <div v-if="modalImage?.tags?.length" class="detail-tags">
                                <span v-for="tag in modalImage.tags" :key="tag">{{ tag }}</span>
                            </div>
                            <div v-if="modalImage?.comment" class="modal-comment">{{ modalImage.comment }}</div>
                            <div v-else class="modal-comment muted">暂无评注</div>
                        </div>
                        <div class="modal-actions">
                            <div class="detail-nav">
                                <button class="modal-btn" type="button" :disabled="!previousImage" @click="openModal(previousImage, true)">上一张</button>
                                <button class="modal-btn" type="button" :disabled="!nextImage" @click="openModal(nextImage, true)">下一张</button>
                            </div>
                            <button v-if="!useLocalLibrary" class="modal-btn delete-btn" type="button" @click="deleteImage">删除</button>
                            <button v-if="!useLocalLibrary" class="modal-btn edit-btn" type="button" @click="editComment">编辑评注</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLighttraceLibrary } from '../data/siteData';

const GALLERY_KEY = 'gallery_images_v1';
const MAX_IMAGES = 25;
const PAGE_SIZE = 25;

const localLibrary = getLighttraceLibrary();
const useLocalLibrary = localLibrary.length > 0;
const localLibraryHint = useLocalLibrary ? '当前为本地图库模式：请将图片放入 photos/lighttrace/ 并在 src/data/siteData.js 中配置。' : '';

const images = ref(useLocalLibrary ? loadLocalLibrary() : loadImages());
const currentPage = ref(1);
const isModalOpen = ref(false);
const modalImage = ref(null);

const modalImageIndex = computed(() => {
    if (!modalImage.value) return -1;
    return images.value.findIndex(img => img.id === modalImage.value.id);
});

const previousImage = computed(() => {
    const index = modalImageIndex.value;
    if (index <= 0) return null;
    return images.value[index - 1];
});

const nextImage = computed(() => {
    const index = modalImageIndex.value;
    if (index < 0 || index >= images.value.length - 1) return null;
    return images.value[index + 1];
});

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

function saveImages() {
    try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(images.value));
    } catch (e) {
        console.error('Failed to save images:', e);
        alert('保存失败：浏览器存储空间不足\n建议清除部分图片或清空浏览器缓存');
    }
}

const totalPages = computed(() => {
    if (!useLocalLibrary) return 1;
    return Math.max(1, Math.ceil(images.value.length / PAGE_SIZE));
});

const pagedImages = computed(() => {
    if (!useLocalLibrary) return images.value;
    const page = Math.min(currentPage.value, totalPages.value);
    const start = (page - 1) * PAGE_SIZE;
    return images.value.slice(start, start + PAGE_SIZE);
});

const displayCells = computed(() => {
    const cells = [];
    const list = pagedImages.value;
    const cellCount = useLocalLibrary ? list.length : MAX_IMAGES;

    for (let i = 0; i < cellCount; i++) {
        if (i < list.length) {
            const img = list[i];
            cells.push({
                key: img.id || i,
                type: 'image',
                ...img,
                onClick: () => openModal(img)
            });
        } else {
            cells.push({
                key: `placeholder-${i}`,
                type: 'placeholder',
                onClick: () => {}
            });
        }
    }

    return cells;
});

const showEmpty = computed(() => pagedImages.value.length === 0);
const showPagination = computed(() => useLocalLibrary && totalPages.value > 1);

function updateHashForImage(image) {
    if (!image || !image.id) return;
    history.replaceState(null, '', `#photo=${encodeURIComponent(image.id)}`);
}

function openModal(image, fromNav = false) {
    if (!image) return;
    modalImage.value = image;
    isModalOpen.value = true;
    document.body.style.overflow = 'hidden';
    if (!fromNav || image.id) updateHashForImage(image);
}

function closeModal() {
    isModalOpen.value = false;
    document.body.style.overflow = 'auto';
    modalImage.value = null;
    if (location.hash.startsWith('#photo=')) {
        history.replaceState(null, '', location.pathname + location.search);
    }
}

function deleteImage() {
    if (!modalImage.value) return;
    if (!confirm('确定要删除这张图片吗？')) return;

    images.value = images.value.filter(img => img.id !== modalImage.value.id);
    saveImages();
    closeModal();
}

function editComment() {
    if (!modalImage.value) return;
    const newComment = prompt('编辑评注（最多 100字）:', modalImage.value.comment || '');
    if (newComment === null) return;

    const trimmedComment = newComment.trim().slice(0, 100);
    modalImage.value.comment = trimmedComment;
    saveImages();
}

function goToPage(page) {
    const next = Math.max(1, Math.min(page, totalPages.value));
    currentPage.value = next;
}

function openImageFromHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const targetId = params.get('photo');
    if (!targetId) return;
    const targetIndex = images.value.findIndex(img => img.id === targetId || img.fileName === targetId);
    if (targetIndex < 0) return;
    currentPage.value = Math.floor(targetIndex / PAGE_SIZE) + 1;
    openModal(images.value[targetIndex], true);
}

function handleKeydown(event) {
    if (!isModalOpen.value) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft' && previousImage.value) openModal(previousImage.value, true);
    if (event.key === 'ArrowRight' && nextImage.value) openModal(nextImage.value, true);
}

onMounted(() => {
    openImageFromHash();
    window.addEventListener('hashchange', openImageFromHash);
    window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
    document.body.style.overflow = 'auto';
    window.removeEventListener('hashchange', openImageFromHash);
    window.removeEventListener('keydown', handleKeydown);
});
</script>
