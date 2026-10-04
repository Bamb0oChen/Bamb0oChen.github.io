import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, 'public', 'photos', 'lighttrace-published');
const manifestPath = path.join(outputDir, 'manifest.json');
const baseUrl = process.env.IMMICH_BASE_URL?.replace(/\/$/, '');
const apiKey = process.env.IMMICH_API_KEY;
const publishFavorites = process.env.IMMICH_PUBLISH_FAVORITES === 'YES';

if (!baseUrl || !apiKey || !publishFavorites) {
    throw new Error('Set IMMICH_BASE_URL, IMMICH_API_KEY and IMMICH_PUBLISH_FAVORITES=YES in the local environment. Favorites will be published publicly.');
}

const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
const headers = { 'x-api-key': apiKey };
async function request(resource, options = {}) {
    const response = await fetch(`${apiBase}${resource}`, { ...options, headers: { ...headers, ...options.headers } });
    if (!response.ok) throw new Error(`Immich request failed: ${resource.split('?')[0]} returned ${response.status}`);
    return response;
}

const assets = [];
const seen = new Set();
const pageSize = 500;
for (let page = 1; page <= 10000; page += 1) {
    const response = await request('/search/metadata', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isFavorite: true, type: 'IMAGE', withExif: true, withDeleted: false, page, size: pageSize })
    });
    const result = (await response.json()).assets;
    if (!result || !Array.isArray(result.items) || !Number.isInteger(result.total)) {
        throw new Error('Immich returned an unexpected favorites search result. Nothing was published.');
    }
    for (const asset of result.items) {
        if (!asset.isFavorite || asset.type !== 'IMAGE' || seen.has(asset.id)) {
            throw new Error('Immich favorites changed or search pages overlapped. Nothing was published. Retry the export.');
        }
        seen.add(asset.id);
        assets.push(asset);
    }
    if (assets.length === result.total) break;
    if (result.items.length === 0 || assets.length > result.total || page === 10000) {
        throw new Error('Immich returned an incomplete favorites list. Nothing was published.');
    }
}
const previous = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"photos":[]}'));
if (assets.length === 0 && process.env.IMMICH_ALLOW_EMPTY_FAVORITES !== 'YES') {
    throw new Error('Immich returned zero favorite images. Export stopped to avoid clearing published photos.');
}
const photos = [];
await mkdir(outputDir, { recursive: true });
const stagingDir = await mkdtemp(path.join(outputDir, '.staging-'));

try {
for (const asset of assets) {
    if (!/^[0-9a-f-]{36}$/i.test(asset.id)) throw new Error('Immich returned an unexpected asset ID.');
    const latitude = asset.exifInfo?.latitude;
    const longitude = asset.exifInfo?.longitude;
    const hasGps = typeof latitude === 'number' && typeof longitude === 'number'
        && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    const response = await request(`/assets/${encodeURIComponent(asset.id)}/thumbnail?size=thumbnail`);
    const contentType = response.headers.get('content-type')?.split(';')[0];
    if (!['image/jpeg', 'image/webp'].includes(contentType)) throw new Error('Immich thumbnail must be JPEG or WebP.');
    const filename = `${asset.id}.${contentType === 'image/webp' ? 'webp' : 'jpg'}`;
    const destination = path.join(stagingDir, filename);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10_000_000) throw new Error('Immich returned a thumbnail larger than 10 MB.');
    await writeFile(destination, bytes);
    // fileCreatedAt is the absolute capture time; localDateTime is for display in the camera's local time.
    const capturedAt = asset.fileCreatedAt || asset.localDateTime || '';
    const takenAt = asset.localDateTime || asset.fileCreatedAt || '';
    const date = takenAt.slice(0, 10);
    photos.push({
        id: asset.id,
        src: `photos/lighttrace-published/${filename}`,
        title: asset.description?.trim().slice(0, 80) || '',
        date,
        capturedAt,
        takenAt,
        latitude: hasGps ? latitude : null,
        longitude: hasGps ? longitude : null
    });
}

photos.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || a.id.localeCompare(b.id));
const nextManifest = { photos };
for (const photo of photos) {
    const filename = path.basename(photo.src);
    await rename(path.join(stagingDir, filename), path.join(outputDir, filename));
}
await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(nextManifest, null, 2)}\n`);
await rename(`${manifestPath}.tmp`, manifestPath);

// Only remove files previously listed in this generated manifest; never scan or clear the directory.
const keep = new Set(photos.map(photo => path.basename(photo.src)));
for (const photo of previous.photos || []) {
    const filename = path.basename(photo.src || '');
    if (/^[0-9a-f-]{36}\.(jpg|webp)$/i.test(filename) && !keep.has(filename)) {
        await rm(path.join(outputDir, filename), { force: true });
    }
}
console.log(`Exported ${photos.length} favorite photos (${photos.filter(photo => photo.latitude !== null).length} with GPS).`);
} finally {
    if (path.dirname(stagingDir) !== outputDir || !path.basename(stagingDir).startsWith('.staging-')) {
        throw new Error('Refusing to clean an unexpected staging directory.');
    }
    await rm(stagingDir, { recursive: true, force: true });
}
