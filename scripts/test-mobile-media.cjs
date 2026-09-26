const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const width of [320, 390, 494, 768, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 1030 }, hasTouch: width <= 768, isMobile: width <= 768 });
            // Verify a failed third-party player never prevents access to the playlist.
            await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
            await page.goto('http://127.0.0.1:5190/', { waitUntil: 'domcontentloaded' });
            await page.locator('.video-showcase').scrollIntoViewIfNeeded();
            await page.waitForTimeout(600);
            if (width <= 768) {
                assert.equal(await page.locator('.card-swap-container').count(), 0);
                const cards = page.locator('.video-mobile-card');
                assert.ok(await cards.count() > 0);
                assert.ok((await cards.first().getAttribute('href')).startsWith('https://'));
                const first = await cards.first().boundingBox();
                assert.ok(first.width < width && first.height < 600);
                await page.locator('.video-showcase').screenshot({ path: join(tmpdir(), `homepage-video-${width}.png`) });
                await page.locator('.video-mobile-list').evaluate(el => { el.scrollLeft = el.clientWidth; });
                await page.waitForTimeout(400);
                assert.ok(await page.locator('.video-mobile-list').evaluate(el => el.scrollLeft > 0));
            } else {
                assert.equal(await page.locator('.video-mobile-list').count(), 0);
                assert.equal(await page.locator('.card-swap-container').count(), 1);
            }
            await page.locator('.music-feature-layout').scrollIntoViewIfNeeded();
            await page.locator('.music-model-card canvas').waitFor({ timeout: 30000 });
            await page.waitForFunction(() => !document.querySelector('.music-model-card .model-loader'), { timeout: 30000 });
            await page.waitForTimeout(1500);
            const layout = await page.evaluate(() => {
                const box = selector => {
                    const r = document.querySelector(selector).getBoundingClientRect();
                    return { x: r.x, right: r.right, width: r.width, height: r.height };
                };
                return {
                    containers: ['.music-feature-layout', '.music-board-wrap', '.border-glow-inner', '.music-embed', '.music-model-card', '.model-viewer'].map(box),
                    overflow: document.documentElement.scrollWidth > innerWidth,
                };
            });
            assert.equal(layout.overflow, false);
            for (const box of layout.containers) assert.ok(box.x >= -1 && box.right <= width + 1, `${width}: media container exceeds viewport: ${JSON.stringify(box)}`);
            if (width <= 768) {
                assert.ok(layout.containers[1].height < 550, 'excessive player whitespace');
                assert.ok(layout.containers[4].height <= 362, 'oversized model');
                await page.locator('.music-feature-layout').screenshot({ path: join(tmpdir(), `homepage-music-${width}.png`) });
            }
            assert.ok((await page.locator('.music-open-link a').getAttribute('href')).startsWith('https://music.apple.com/'));
            if (width === 494) {
                await page.setViewportSize({ width: 1200, height: 1030 });
                await page.locator('.card-swap-container').waitFor();
                assert.equal(await page.locator('.video-mobile-list').count(), 0);
            }
            console.log(`PASS ${width}: video layout, links, swipe, music bounds, model and player fallback`);
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
