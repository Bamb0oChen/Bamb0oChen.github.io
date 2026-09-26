const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const width of [320, 390, 558, 768, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 1030 }, isMobile: width <= 768, hasTouch: width <= 768 });
            await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
            await page.goto('http://127.0.0.1:5190/', { waitUntil: 'domcontentloaded' });
            await page.locator('.hero-title').waitFor();
            await page.locator('#projects').scrollIntoViewIfNeeded();
            await page.waitForTimeout(800);
            const project = await page.locator('.ps-row').first().boundingBox();
            const copyPosition = await page.locator('.ps-copy').first().evaluate(el => getComputedStyle(el).position);
            if (width <= 768) {
                assert.ok(project.height <= 282);
                assert.equal(copyPosition, 'absolute');
                const copy = await page.locator('.ps-copy').first().boundingBox();
                assert.ok(copy.y >= project.y && copy.y + copy.height <= project.y + project.height + 1);
                await page.locator('.ps-row').first().screenshot({ path: join(tmpdir(), `homepage-project-${width}.png`) });
            } else assert.notEqual(copyPosition, 'absolute');
            await page.locator('.lighttrace-section').scrollIntoViewIfNeeded();
            await page.waitForTimeout(800);
            const gallery = await page.locator('.dome-gallery-wrap').boundingBox();
            assert.ok(gallery.width <= width);
            if (width <= 768) {
                assert.ok(gallery.height <= 420);
                await page.locator('.lighttrace-section').screenshot({ path: join(tmpdir(), `homepage-lighttrace-${width}.png`) });
                // Find a tile whose center is actually visible, then verify opening/closing still works.
                const target = await page.locator('.dg-item-image').evaluateAll(buttons => {
                    for (const el of buttons) {
                        const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
                        if (x > 20 && x < innerWidth - 20 && y > 150 && y < innerHeight - 20 && el.contains(document.elementFromPoint(x, y))) return { x, y };
                    }
                });
                assert.ok(target, 'no visible gallery tile');
                await page.mouse.click(target.x, target.y);
                await page.locator('.dg-enlarge').waitFor({ state: 'visible' });
                await page.locator('.dg-enlarge').click();
                await page.locator('.dg-enlarge').waitFor({ state: 'detached' });
            }
            await page.locator('#writing').scrollIntoViewIfNeeded();
            await page.mouse.move(0, 0);
            await page.waitForTimeout(350);
            const columns = await page.locator('#writing .chroma-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
            assert.equal(columns, width <= 768 ? 2 : 3);
            const cards = page.locator('#writing .chroma-card');
            assert.ok(await cards.count() >= 2);
            const first = await cards.nth(0).boundingBox(), second = await cards.nth(1).boundingBox();
            assert.ok(Math.abs(first.y - second.y) < 1);
            assert.ok(second.x > first.x);
            if (width <= 768) {
                assert.ok(first.height < 450);
                await page.locator('#writing .chroma-grid').screenshot({ path: join(tmpdir(), `homepage-writing-${width}.png`) });
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            console.log(`PASS ${width}: compact projects, gallery sizing and interaction, article columns`);
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
