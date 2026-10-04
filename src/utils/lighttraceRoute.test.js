import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhotoRoute } from './lighttraceRoute.js';

test('orders geotagged photos by capture timestamp and marks long jumps', () => {
    const photos = [
        { id: 'later', capturedAt: '2026-10-02T12:00:00Z', latitude: 30.28, longitude: 120.15 },
        { id: 'missing-gps', capturedAt: '2026-10-01T12:00:00Z', latitude: null, longitude: null },
        { id: 'first', capturedAt: '2026-10-01T09:00:00Z', latitude: 30.27, longitude: 120.14 },
        { id: 'same-day', capturedAt: '2026-10-01T10:00:00Z', latitude: 30.275, longitude: 120.145 },
        { id: 'missing-time', capturedAt: '', latitude: 30.3, longitude: 120.2 }
    ];
    const route = buildPhotoRoute(photos);
    assert.deepEqual(route.stops.map(photo => photo.id), ['first', 'same-day', 'later']);
    assert.equal(route.legs[0].inferredJump, false);
    assert.equal(route.legs[1].inferredJump, true);
});

test('marks a long-distance jump even on the same day', () => {
    const route = buildPhotoRoute([
        { id: 'a', capturedAt: '2026-10-01T09:00:00Z', latitude: 30.27, longitude: 120.14 },
        { id: 'b', capturedAt: '2026-10-01T10:00:00Z', latitude: 31.23, longitude: 121.47 }
    ]);
    assert.equal(route.legs[0].inferredJump, true);
});
