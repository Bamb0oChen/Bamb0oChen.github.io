const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function distanceKm(a, b) {
    const toRad = degree => degree * Math.PI / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const value = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(value)));
}

export function buildPhotoRoute(images) {
    const stops = images
        .filter(image => image.latitude !== null && image.longitude !== null)
        .map(image => ({ ...image, timestamp: Date.parse(image.capturedAt || '') }))
        .filter(image => Number.isFinite(image.timestamp))
        .sort((a, b) => a.timestamp - b.timestamp || String(a.id).localeCompare(String(b.id)));
    const legs = stops.slice(1).map((stop, index) => {
        const previous = stops[index];
        const gapMs = stop.timestamp - previous.timestamp;
        const spanKm = distanceKm(previous, stop);
        return { from: previous, to: stop, inferredJump: gapMs > ONE_DAY_MS || spanKm > 100 };
    });
    return { stops, legs };
}
