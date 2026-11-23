const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const [width, height] of [[320, 568], [390, 844], [430, 932], [558, 1030], [768, 1024], [1440, 1000]]) {
            const page = await browser.newPage({ viewport: { width, height }, isMobile: width <= 768, hasTouch: width <= 768 });
            await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
            await page.goto(process.env.HOME_TEST_URL || 'http://127.0.0.1:5190/', { waitUntil: 'domcontentloaded' });
            const intro = page.locator('.homepage-intro');
            await intro.getByRole('heading', { level: 1 }).waitFor();
            const firstScreen = await page.evaluate(() => {
                const introSection = document.querySelector('.homepage-intro');
                const text = introSection.querySelector('h1').getBoundingClientRect();
                return {
                    textOnly: introSection.children.length === 1,
                    centered: Math.abs(text.left + text.width / 2 - innerWidth / 2) <= 1 &&
                        Math.abs(text.top + text.height / 2 - innerHeight / 2) <= 1,
                    singleLine: text.height <= parseFloat(getComputedStyle(introSection.querySelector('h1')).lineHeight) + 1,
                    headerTop: document.querySelector('#header').getBoundingClientRect().top,
                    projectsTop: document.querySelector('#projects').getBoundingClientRect().top,
                };
            });
            assert.ok(firstScreen.textOnly && firstScreen.centered && firstScreen.singleLine, `${width}: expected one centered line`);
            assert.ok(firstScreen.headerTop >= height - 1, `${width}: navigation visible on first screen`);
            assert.ok(firstScreen.projectsTop >= height - 1, `${width}: projects visible on first screen`);
            await page.screenshot({ path: join(tmpdir(), `homepage-mobile-${width}.png`) });
            await page.evaluate(() => window.scrollTo(0, innerHeight + 200));
            await page.waitForFunction(() => document.querySelector('#header').getBoundingClientRect().top >= 0 &&
                document.querySelector('#header').getBoundingClientRect().top < 24);

            const layout = await page.evaluate(() => {
                const box = selector => {
                    const r = document.querySelector(selector).getBoundingClientRect();
                    return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
                };
                return {
                    header: box('#header'), dock: box('.private-dock-toggle'), nav: [...document.querySelectorAll('.site-nav .nav-btn')].map(el => {
                        const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, height: r.height };
                    }),
                    overflow: document.documentElement.scrollWidth > innerWidth,
                };
            });
            assert.equal(layout.overflow, false, `${width}: horizontal overflow`);
            if (width <= 768) {
                for (const item of layout.nav) {
                    assert.ok(item.y >= layout.dock.bottom, `${width}: nav overlaps Dock`);
                    assert.ok(item.height >= 44 && item.bottom <= layout.header.bottom, `${width}: invalid tap target`);
                }
                assert.ok(layout.nav.every(item => item.y === layout.nav[0].y), `${width}: nav wraps`);
            } else assert.ok(layout.header.height < 70, 'desktop navigation height changed');
            await page.locator('.private-dock-toggle').click();
            await page.waitForTimeout(800);
            await page.locator('#private-bar-panel').waitFor({ state: 'visible' });
            assert.equal(await page.locator('.private-dock-toggle').getAttribute('aria-expanded'), 'true');
            await page.locator('.private-dock-toggle').click();
            await page.waitForTimeout(850);
            await page.getByRole('button', { name: 'Agent', exact: true }).click();
            await page.locator('.agent-overlay').waitFor({ state: 'visible' });
            await page.locator('.search-close').click();
            console.log(`PASS ${width}x${height}: layout, tap targets, Dock, Agent`);
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
