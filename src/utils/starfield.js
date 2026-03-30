export function startStarfield(canvas, particleType = 'heart', container = null) {
    if (!canvas) return () => {};

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return () => {};

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let dpr = 1;

    const stars = [];
    const config = {
        spawnRate: 26,
        speedMin: 40,
        speedMax: 80,
        maxStars: 120,
        spawnRadiusFactor: 0.5,
        margin: 0
    };

    let lastTime = performance.now();
    let rafId = null;

    function resizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        if (container) {
            const rect = container.getBoundingClientRect();
            width = rect.width || 0;
            height = rect.height || 0;
        } else {
            width = window.innerWidth || 0;
            height = window.innerHeight || 0;
        }
        centerX = width / 2;
        centerY = height / 2;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnStar() {
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        const maxRadius = Math.min(width, height) * config.spawnRadiusFactor;
        const radius = Math.sqrt(Math.random()) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const size = 0.5 + Math.random() * 0.9;
        stars.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            alpha: 0.3 + Math.random() * 0.45
        });
    }

    function update(dt) {
        const spawnTotal = config.spawnRate * dt;
        const spawnCount = Math.floor(spawnTotal);
        for (let i = 0; i < spawnCount; i++) {
            spawnStar();
        }
        if (Math.random() < spawnTotal - spawnCount) {
            spawnStar();
        }

        for (let i = stars.length - 1; i >= 0; i--) {
            const star = stars[i];
            star.x += star.vx * dt;
            star.y += star.vy * dt;

            if (
                star.x < -config.margin ||
                star.x > width + config.margin ||
                star.y < -config.margin ||
                star.y > height + config.margin
            ) {
                stars.splice(i, 1);
            }
        }

        if (stars.length > config.maxStars) {
            stars.splice(0, stars.length - config.maxStars);
        }
    }

    function drawHeart(x, y, size, alpha) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        const s = size;

        const topY = y - s * 0.6;
        const leftControlX = x - s * 0.8;
        const rightControlX = x + s * 0.8;
        const pointY = y + s * 0.6;

        ctx.moveTo(x, topY);

        ctx.bezierCurveTo(
            leftControlX - s * 0.5, topY - s * 0.3,
            leftControlX - s * 0.3, y,
            x - s * 0.3, y + s * 0.3
        );

        ctx.lineTo(x, pointY);
        ctx.lineTo(x + s * 0.3, y + s * 0.3);

        ctx.bezierCurveTo(
            rightControlX + s * 0.3, y,
            rightControlX + s * 0.5, topY - s * 0.3,
            x, topY
        );

        ctx.fill();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];

            if (particleType === 'heart') {
                drawHeart(star.x, star.y, star.size, star.alpha);
            } else if (particleType === 'star') {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function animate(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        update(dt);
        draw();
        rafId = requestAnimationFrame(animate);
    }

    function onVisibilityChange() {
        if (document.hidden) {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        } else if (!rafId) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(animate);
        }
    }

    const onResize = () => {
        resizeCanvas();
        canvas.style.opacity = '1';
    };

    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    resizeCanvas();
    canvas.style.opacity = '1';
    rafId = requestAnimationFrame(animate);

    return () => {
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('resize', onResize);
    };
}
