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
            await page.locator('.homepage-intro h1').waitFor();
            const projects = page.locator('#projects');
            const stage = projects.locator('.ps-stage');
            const metrics = await projects.evaluate(section => {
                const stage = section.querySelector('.ps-stage');
                const top = parseFloat(getComputedStyle(stage).top);
                return {
                    top,
                    start: window.scrollY + section.getBoundingClientRect().top - top,
                    step: (section.offsetHeight - stage.offsetHeight) / 5,
                };
            });
            const names = ['InfoHub', '夏隙百日', 'ColorPal', 'Learn Claude Code', 'Agent4Study', 'Notes'];
            const positions = [0, 1, 2, 3, 4, 5, 4, 0];
            for (const index of positions) {
                await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), metrics.start + metrics.step * index);
                const current = projects.getByRole('button', { name: names[index], exact: true });
                await page.waitForFunction(name => document.querySelector('.ps-pagination [aria-current]')?.ariaLabel === name, names[index]);
                assert.equal(await current.getAttribute('aria-current'), 'true');
                const row = projects.locator('.ps-row').nth(index);
                const geometry = await row.evaluate(article => {
                    const rect = article.getBoundingClientRect();
                    const stage = article.closest('.ps-stage');
                    const view = article.closest('.ps-window').getBoundingClientRect();
                    const media = article.querySelector('.ps-figure').getBoundingClientRect();
                    return { x: rect.left - view.left, width: rect.width, viewWidth: view.width,
                        left: media.left, right: media.right, screen: document.documentElement.clientWidth,
                        top: stage.getBoundingClientRect().top, height: media.height, inert: article.inert };
                });
                assert.ok(Math.abs(geometry.x) < 1 && geometry.width === geometry.viewWidth);
                assert.ok(Math.abs(geometry.top - metrics.top) < 2 && geometry.height > 160);
                assert.ok(Math.abs(geometry.left) < 1 && Math.abs(geometry.right - geometry.screen) < 1);
                assert.equal(geometry.inert, false);
                assert.ok((await row.getByRole('link', { name: names[index], exact: true }).getAttribute('href')).includes('github.com'));
            }
            await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), metrics.start + metrics.step * 0.5);
            await page.waitForFunction(() => parseFloat(document.querySelector('.ps-track').style.getPropertyValue('--ps-shift')) < -30);
            const offset = await projects.locator('.ps-track').evaluate(element => parseFloat(element.style.getPropertyValue('--ps-shift')));
            assert.ok(offset > -70 && offset < -30, 'scroll must move the image track continuously');
            await page.waitForFunction(({ start, step }) => {
                const position = (window.scrollY - start) / step;
                return Math.abs(position - Math.round(position)) < 0.004;
            }, metrics);
            await projects.getByRole('button', { name: 'Notes', exact: true }).click();
            await page.waitForFunction(() => document.querySelector('.ps-pagination [aria-current]')?.ariaLabel === 'Notes');
            await page.waitForFunction(() => parseFloat(document.querySelector('.ps-track').style.getPropertyValue('--ps-shift')) <= -499);
            assert.equal(await projects.locator('.ps-row[inert]').count(), 5);
            await stage.screenshot({ path: join(tmpdir(), `homepage-project-${width}.png`) });
            if (width === 1440 || width === 390) {
                const waitForProject = index => page.waitForFunction(({ index, start, step }) => {
                    const track = document.querySelector('.ps-track');
                    const offset = parseFloat(track.style.getPropertyValue('--ps-shift'));
                    return Math.abs(offset + index * 100) < 0.01 &&
                        Math.abs(window.scrollY - start - index * step) <= 2;
                }, { ...metrics, index }, { timeout: 5000 });
                const scrollToProject = index => page.evaluate(top => {
                    window.scrollTo({ top, behavior: 'instant' });
                }, metrics.start + metrics.step * index);
                if (width === 1440) {
                    await page.mouse.move(width / 2, 490);
                    await page.mouse.wheel(0, 75);
                    await page.waitForFunction(end => window.scrollY > end + 10, metrics.start + 5 * metrics.step);
                    await scrollToProject(0);
                    await waitForProject(0);

                    // A short wheel impulse advances, while its momentum stays on that frame.
                    for (const delta of [3, 8, 19, 25, 15, 7, 2]) await page.mouse.wheel(0, delta);
                    await waitForProject(1);
                    await page.mouse.wheel(0, 3);
                    await waitForProject(2);

                    // Reverse before the next transition finishes.
                    await page.mouse.wheel(0, 50);
                    await page.waitForFunction(({ start, step }) => window.scrollY > start + 2.15 * step, metrics);
                    await page.mouse.wheel(0, -55);
                    await waitForProject(2);

                    await scrollToProject(0);
                    await waitForProject(0);
                    await page.waitForTimeout(160);
                    await page.mouse.wheel(0, -90);
                    await page.waitForFunction(start => window.scrollY < start - 10, metrics.start);
                } else {
                    await scrollToProject(0);
                    await waitForProject(0);
                    const touch = await page.context().newCDPSession(page);
                    const swipe = async (from, to) => {
                        await touch.send('Input.dispatchTouchEvent', {
                            type: 'touchStart', touchPoints: [{ x: width / 2, y: from }],
                        });
                        for (let step = 1; step <= 12; step++) {
                            await touch.send('Input.dispatchTouchEvent', {
                                type: 'touchMove', touchPoints: [{ x: width / 2, y: from + (to - from) * step / 12 }],
                            });
                        }
                        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    };
                    await swipe(630, 460);
                    await waitForProject(1);
                    await swipe(460, 630);
                    await waitForProject(0);
                    await touch.detach();
                }
            }
            await page.locator('.lighttrace-section').scrollIntoViewIfNeeded();
            await page.waitForTimeout(800);
            const gallery = await page.locator('.dome-gallery-wrap').boundingBox();
            assert.ok(gallery.width <= width);
            const sources = await page.locator('.dg-item-image img').evaluateAll(images => images.map(image => image.src));
            assert.ok(sources.length > 0);
            assert.equal(new Set(sources).size, sources.length, 'Each photo should appear on the sphere once');
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
            console.log(`PASS ${width}: horizontal projects, gallery sizing and interaction, article columns`);
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
