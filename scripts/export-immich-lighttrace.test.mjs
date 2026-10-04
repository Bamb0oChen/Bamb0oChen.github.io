import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(new URL('./export-immich-lighttrace.mjs', import.meta.url));
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];

test('exports paginated Immich favorites with capture times and GPS', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'lighttrace-test-'));
    const targetScript = path.join(root, 'scripts', 'export-immich-lighttrace.mjs');
    await mkdir(path.dirname(targetScript), { recursive: true });
    await copyFile(scriptPath, targetScript);
    const server = createServer(async (request, response) => {
        assert.equal(request.headers['x-api-key'], 'test-key');
        if (request.url === '/api/search/metadata') {
            let body = '';
            for await (const part of request) body += part;
            const query = JSON.parse(body);
            assert.equal(query.isFavorite, true);
            assert.equal(query.withExif, true);
            const index = query.page - 1;
            const asset = {
                id: ids[index], type: 'IMAGE', isFavorite: true,
                description: `Photo ${index + 1}`,
                fileCreatedAt: `2026-10-0${index + 1}T03:00:00Z`,
                localDateTime: `2026-10-0${index + 1}T11:00:00Z`,
                exifInfo: { latitude: 30 + index, longitude: 120 + index }
            };
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ assets: { items: [asset], total: 2 } }));
            return;
        }
        if (ids.some(id => request.url?.startsWith(`/api/assets/${id}/thumbnail`))) {
            response.setHeader('content-type', 'image/jpeg');
            response.end(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
            return;
        }
        response.statusCode = 404;
        response.end();
    });
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        await execFileAsync(process.execPath, [targetScript], {
            env: {
                ...process.env,
                IMMICH_BASE_URL: `http://127.0.0.1:${address.port}`,
                IMMICH_API_KEY: 'test-key',
                IMMICH_PUBLISH_FAVORITES: 'YES'
            }
        });
        const manifest = JSON.parse(await readFile(path.join(root, 'public', 'photos', 'lighttrace-published', 'manifest.json'), 'utf8'));
        assert.deepEqual(manifest.photos.map(photo => photo.id), [ids[1], ids[0]]);
        assert.equal(manifest.photos[0].latitude, 31);
        assert.equal(manifest.photos[0].takenAt, '2026-10-02T11:00:00Z');
    } finally {
        await new Promise(resolve => server.close(resolve));
        if (path.dirname(root) === tmpdir() && path.basename(root).startsWith('lighttrace-test-')) {
            await rm(root, { recursive: true, force: true });
        }
    }
});
