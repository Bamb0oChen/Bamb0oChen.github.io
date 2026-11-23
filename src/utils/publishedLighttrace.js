export async function loadPublishedLighttrace(signal) {
    const url = new URL('photos/lighttrace-published/manifest.json', window.location.href);
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const manifest = await response.json();
    if (!Array.isArray(manifest?.photos)) throw new Error('Invalid Lighttrace manifest');
    return manifest.photos.filter(photo => typeof photo?.src === 'string' && photo.src);
}
