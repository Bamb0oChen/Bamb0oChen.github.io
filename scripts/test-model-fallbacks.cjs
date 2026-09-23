// Run against `npm run preview -- --host 127.0.0.1 --port 5180` after building.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
    const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
    const base = process.env.MODEL_TEST_URL || 'http://127.0.0.1:5180/';
    try {
        for (const scenario of ['normal', 'hdr-failure', 'model-failure', 'chunk-failure']) {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            const uncaught = [], fallbackLogs = [], externalHDR = [];
            let blocked = 0, hdrStatus = null;
            page.on('pageerror', error => uncaught.push(error.message));
            page.on('console', message => {
                if (message.text().startsWith('[ModelViewer]')) fallbackLogs.push(message.text());
            });
            page.on('request', request => {
                if (request.url().includes('raw.githack.com')) externalHDR.push(request.url());
            });
            page.on('response', response => {
                if (response.url().endsWith('.hdr')) hdrStatus = response.status();
            });
            if (scenario !== 'normal') {
                const pattern = scenario === 'hdr-failure' ? '**/*.hdr'
                    : scenario === 'model-failure' ? '**/Gramophone.fbx' : '**/assets/ModelViewer-*.js';
                await page.route(pattern, route => { blocked++; return route.abort('connectionrefused'); });
            }
            await page.goto(base, { waitUntil: 'domcontentloaded' });
            await page.locator('.music-model-card').scrollIntoViewIfNeeded();
            if (scenario === 'chunk-failure') {
                await page.locator('.music-model-unavailable').waitFor({ timeout: 30000 });
            } else {
                await page.locator('.music-model-card canvas').waitFor({ timeout: 30000 });
                await page.waitForFunction(() => !document.querySelector('.music-model-card .model-loader'), { timeout: 30000 });
            }
            // Allow async loaders/error propagation and several animation frames to settle.
            await page.waitForTimeout(3000);
            assert.ok(await page.locator('#app').evaluate(element => element.children.length > 0), scenario + ': homepage unmounted');
            assert.ok(await page.locator('.music-embed iframe').count(), scenario + ': other content lost');
            assert.deepEqual(externalHDR, [], scenario + ': still depends on HDR CDN');
            // R3F 9.6 calls reportError even for errors caught by a child boundary.
            // Only that specific model-loader diagnostic is expected; never suppress it globally.
            if (scenario === 'model-failure') {
                assert.ok(uncaught.every(message => message.includes('Could not load models/gramophone/Gramophone.fbx')));
            } else assert.deepEqual(uncaught, [], scenario + ': uncaught exception');
            if (scenario === 'normal') {
                assert.equal(hdrStatus, 200);
                assert.deepEqual(fallbackLogs, []);
            } else {
                assert.ok(blocked > 0, 'failure injection did not run');
                const expected = scenario === 'hdr-failure' ? 'Environment' : scenario === 'model-failure' ? 'Model asset' : 'Model viewer';
                assert.ok(fallbackLogs.some(line => line.includes(expected)), 'missing boundary: ' + expected);
            }
            await page.locator('.music-model-card').screenshot({ path: join(tmpdir(), `model-${scenario}.png`) });
            console.log(`PASS ${scenario}: page retained, fallback verified, no HDR CDN request (${uncaught.length} renderer-reported caught errors)`);
            await page.close();
        }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exit(1); });
