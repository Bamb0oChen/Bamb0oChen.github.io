import { glassStudio, rasterizeHeading } from './glassWordmark.js';

const palette = [
    [0.08, 0.72, 1.0],
    [0.64, 0.10, 1.0],
    [1.0, 0.13, 0.55],
    [1.0, 0.61, 0.12],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const smoothstep = (from, to, value) => {
    const t = clamp((value - from) / (to - from), 0, 1);
    return t * t * (3 - 2 * t);
};

function createFlowField(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const frame = context.createImageData(width, height);

    const size = width * height;
    const makeFields = count => Array.from({ length: count }, () => new Float32Array(size));
    let [u, v, red, green, blue] = makeFields(5);
    let [nextU, nextV, nextRed, nextGreen, nextBlue] = makeFields(5);
    const divergence = new Float32Array(size);
    let [pressure, nextPressure] = makeFields(2);

    function splat(x, y, dx, dy, color, strength, radius) {
        const x0 = clamp(Math.floor(x - radius), 0, width - 1);
        const y0 = clamp(Math.floor(y - radius), 0, height - 1);
        const x1 = clamp(Math.ceil(x + radius), 0, width - 1);
        const y1 = clamp(Math.ceil(y + radius), 0, height - 1);
        for (let row = y0; row <= y1; row++) {
            for (let column = x0; column <= x1; column++) {
                const rx = (column - x) / radius;
                const ry = (row - y) / radius;
                const radiusSquared = rx * rx + ry * ry;
                if (radiusSquared >= 1) continue;
                const weight = Math.exp(-3 * radiusSquared) * (1 - radiusSquared) ** 2;
                const i = row * width + column;
                u[i] += (dx - 32 * ry) * weight;
                v[i] += (dy + 32 * rx) * weight;
                red[i] = Math.min(1.4, red[i] + color[0] * strength * weight);
                green[i] = Math.min(1.4, green[i] + color[1] * strength * weight);
                blue[i] = Math.min(1.4, blue[i] + color[2] * strength * weight);
            }
        }
    }

    function advect(dt) {
        const velocityDecay = Math.exp(-1.2 * dt);
        const dyeDecay = Math.exp(-0.8 * dt);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                const sx = clamp(x - u[i] * dt, 0, width - 1.001);
                const sy = clamp(y - v[i] * dt, 0, height - 1.001);
                const x0 = Math.floor(sx);
                const y0 = Math.floor(sy);
                const a = y0 * width + x0;
                const fx = sx - x0;
                const fy = sy - y0;
                const interpolate = field => mix(mix(field[a], field[a + 1], fx),
                    mix(field[a + width], field[a + width + 1], fx), fy);
                nextU[i] = interpolate(u) * velocityDecay;
                nextV[i] = interpolate(v) * velocityDecay;
                nextRed[i] = interpolate(red) * dyeDecay;
                nextGreen[i] = interpolate(green) * dyeDecay;
                nextBlue[i] = interpolate(blue) * dyeDecay;
            }
        }
        [u, nextU] = [nextU, u];
        [v, nextV] = [nextV, v];
        [red, nextRed] = [nextRed, red];
        [green, nextGreen] = [nextGreen, green];
        [blue, nextBlue] = [nextBlue, blue];
    }

    function project() {
        pressure.fill(0);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = y * width + x;
                divergence[i] = 0.5 * (u[i + 1] - u[i - 1] + v[i + width] - v[i - width]);
            }
        }
        for (let pass = 0; pass < 6; pass++) {
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const i = y * width + x;
                    nextPressure[i] = (pressure[i - 1] + pressure[i + 1] +
                        pressure[i - width] + pressure[i + width] - divergence[i]) * 0.25;
                }
            }
            [pressure, nextPressure] = [nextPressure, pressure];
        }
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = y * width + x;
                u[i] -= 0.5 * (pressure[i + 1] - pressure[i - 1]);
                v[i] -= 0.5 * (pressure[i + width] - pressure[i - width]);
            }
        }
    }

    return {
        canvas,
        frame,
        splat,
        step(dt) {
            advect(dt);
            project();
            const pixels = frame.data;
            for (let i = 0; i < size; i++) {
                const channel = i * 4;
                pixels[channel] = Math.sqrt(red[i]) * 238;
                pixels[channel + 1] = Math.sqrt(green[i]) * 238;
                pixels[channel + 2] = Math.sqrt(blue[i]) * 238;
                pixels[channel + 3] = 255;
            }
            context.putImageData(frame, 0, 0);
        },
    };
}

function sampleChannel(frame, x, y, channel) {
    const { width, height, data } = frame;
    x = clamp(x, 0, width - 1.001);
    y = clamp(y, 0, height - 1.001);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const i = 4 * (y0 * width + x0) + channel;
    const row = 4 * width;
    return mix(mix(data[i], data[i + 4], x - x0), mix(data[i + row], data[i + row + 4], x - x0), y - y0);
}

function createCanvasLens(heading, bounds, density) {
    const outline = rasterizeHeading(heading, bounds, density);
    if (!outline) return null;
    const { width, height, shape, bevel: thickness, padding } = outline;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const image = context.createImageData(width, height);
    const samples = [];
    for (let offset = 0; offset < shape.length; offset += 4) {
        const coverage = shape[offset + 3];
        if (!coverage) continue;
        image.data[offset + 3] = coverage;
        const distance = shape[offset] * 24 / 255 - 12;
        const nx = (shape[offset + 1] - 128) / 127;
        const ny = (shape[offset + 2] - 128) / 127;
        const bevel = 1 - smoothstep(0, thickness, distance);
        const rim = smoothstep(0.15, 0.86, bevel);
        const slope = bevel * 2.5;
        const normalZ = 1 / Math.hypot(nx * slope, ny * slope, 1);
        const eta = 1 / 1.47;
        const refraction = (Math.sqrt(1 - eta * eta * (1 - normalZ * normalZ)) - eta * normalZ) *
            normalZ * slope * (7 + 2.6 * thickness);
        const separation = (1.6 + 0.46 * thickness) * rim;
        const facing = -0.55 * nx + 0.835 * ny;
        const glint = 0.29 * Math.max(0, facing) ** 4 * bevel ** 1.45 +
            0.10 * Math.max(0, -facing) ** 5 * bevel ** 1.9 + 0.018 * bevel;
        const fresnel = 0.41 * (0.04 + 0.96 * (1 - normalZ) ** 3);
        const spectralSide = smoothstep(-0.7, 0.7, 0.84 * nx - 0.54 * ny);
        const column = offset / 4 % width;
        const row = Math.floor(offset / 4 / width);
        const ceiling = 1 - smoothstep(0.12, 0.94, row / height);
        const bandOffset = (row / height - (0.27 + 0.07 * column / width)) / 0.25;
        const highlightBand = Math.exp(-bandOffset * bandOffset);
        const studio = glassStudio.floor.map((floor, channel) =>
            255 * (mix(floor, glassStudio.ceiling[channel], ceiling) + glassStudio.sheen[channel] * highlightBand));
        samples.push({
            index: offset, x: column / density, y: row / density,
            dx: nx * refraction, dy: -ny * refraction,
            splitX: nx * separation, splitY: -ny * separation,
            glint, fresnel, studio,
            spectralSide, rim: rim ** 3 * Math.hypot(nx, ny),
        });
    }
    const edge = glassStudio.key.map(channel => 255 * channel);
    const spectrum = [[46, 255], [148, 94], [255, 54]];
    const transmission = new Float32Array(3);

    return {
        render(target, frame, left, top, cssWidth, cssHeight, opacity) {
            left -= padding;
            top -= padding;
            const scaleX = frame.width / cssWidth;
            const scaleY = frame.height / cssHeight;
            for (const point of samples) {
                const x = left + point.x;
                const y = top + point.y;
                for (let channel = 0; channel < 3; channel++) {
                    const shift = 1 - channel;
                    transmission[channel] = sampleChannel(frame,
                        (x + point.dx + shift * point.splitX) * scaleX,
                        (y + point.dy + shift * point.splitY) * scaleY, channel) * opacity;
                }
                const sceneLight = Math.max(transmission[0], transmission[1], transmission[2]) / 255;
                const illumination = smoothstep(0.08, 0.66, sceneLight);
                const transmissionWeight = mix(0.09, 0.57, illumination);
                for (let channel = 0; channel < 3; channel++) {
                    const reflected = sampleChannel(frame,
                        (x - point.dx * 1.2) * scaleX, (y - point.dy * 1.2) * scaleY, channel) * opacity;
                    const body = mix(point.studio[channel], transmission[channel], transmissionWeight);
                    const reflection = mix(edge[channel], reflected, illumination * 0.62);
                    const glass = mix(body, reflection, point.fresnel);
                    const iridescence = mix(...spectrum[channel], point.spectralSide) * point.rim *
                        (0.016 + 0.13 * illumination);
                    image.data[point.index + channel] = mix(glass, edge[channel], point.glint) + iridescence;
                }
            }
            context.putImageData(image, 0, 0);
            target.drawImage(canvas, left, top, width / density, height / density);
        },
    };
}

export function startCanvasFluid(canvas, { glassHeading, getOpacity }) {
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const baseOpacity = Number(getComputedStyle(canvas).opacity) || 1;
    const usesGlass = glassHeading && !window.matchMedia('(forced-colors: active)').matches;
    let flow;
    let lens;
    let lensWidth;
    let lensHeight;
    let cssWidth = 0;
    let cssHeight = 0;
    let density = 1;
    let animation;
    let last = 0;
    let lastAmbient = 0;
    let pointer;
    let opacity = 1;

    canvas.hidden = false;
    canvas.style.opacity = '1';

    function resize() {
        if (cssWidth === canvas.clientWidth && cssHeight === canvas.clientHeight) return;
        cssWidth = canvas.clientWidth;
        cssHeight = canvas.clientHeight;
        if (!cssWidth || !cssHeight) return;
        density = clamp(window.devicePixelRatio || 1, 1.25, 2);
        canvas.width = Math.round(cssWidth * density);
        canvas.height = Math.round(cssHeight * density);
        context.setTransform(canvas.width / cssWidth, 0, 0, canvas.height / cssHeight, 0, 0);
        const scale = 152 / Math.max(cssWidth, cssHeight);
        flow = createFlowField(Math.max(30, Math.round(cssWidth * scale)),
            Math.max(30, Math.round(cssHeight * scale)));
        if (!flow) return;
        flow.splat(flow.canvas.width * 0.26, flow.canvas.height * 0.34, 16, 4, palette[0], 0.8, 14);
        flow.splat(flow.canvas.width * 0.76, flow.canvas.height * 0.44, -14, 8, palette[1], 0.7, 16);
        flow.splat(flow.canvas.width * 0.57, flow.canvas.height * 0.63, 9, -13, palette[2], 0.45, 13);
        lens = null;
        pointer = undefined;
    }

    function move(event) {
        if (!flow || getOpacity() < 0.03 || document.hidden) return;
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * flow.canvas.width / rect.width;
        const y = (event.clientY - rect.top) * flow.canvas.height / rect.height;
        const dx = pointer ? clamp(x - pointer.x, -8, 8) : 0;
        const dy = pointer ? clamp(y - pointer.y, -8, 8) : 0;
        pointer = { x, y };
        const color = palette[Math.floor(performance.now() / 800) % palette.length];
        flow.splat(x, y, dx * 9, dy * 9, color, 0.35, 6);
    }

    function frame(now) {
        animation = requestAnimationFrame(frame);
        if (document.hidden || now - last < 30) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        resize();
        if (!flow) return;
        const bounds = usesGlass ? glassHeading.getBoundingClientRect() : null;
        const wordmarkVisible = bounds && bounds.width > 0 && bounds.bottom > 0 && bounds.top < cssHeight;
        opacity = mix(opacity, getOpacity(), 1 - Math.exp(-8 * dt));
        context.clearRect(0, 0, cssWidth, cssHeight);
        if (opacity < 0.01 && !wordmarkVisible) return;

        if (now - lastAmbient > 1400 && opacity > 0.4) {
            lastAmbient = now;
            const turn = now / 2200;
            const color = palette[Math.floor(turn) % palette.length];
            flow.splat(flow.canvas.width * (0.49 + 0.24 * Math.cos(turn)),
                flow.canvas.height * (0.49 + 0.20 * Math.sin(turn)), 5, -6, color, 0.33, 12);
        }
        flow.step(dt);
        context.globalAlpha = opacity * baseOpacity;
        context.drawImage(flow.canvas, 0, 0, cssWidth, cssHeight);
        context.globalAlpha = 1;

        if (wordmarkVisible) {
            if (!lens || bounds.width !== lensWidth || bounds.height !== lensHeight) {
                lens = createCanvasLens(glassHeading, bounds, density);
                lensWidth = bounds.width;
                lensHeight = bounds.height;
            }
            if (lens) {
                lens.render(context, flow.frame, bounds.left, bounds.top, cssWidth, cssHeight, opacity * baseOpacity);
                if (!glassHeading.dataset.liquidGlass) glassHeading.dataset.liquidGlass = 'ready';
            }
        }
        if (!canvas.dataset.fluidRenderer) canvas.dataset.fluidRenderer = 'canvas2d';
    }

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    animation = requestAnimationFrame(frame);
    return () => {
        cancelAnimationFrame(animation);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerdown', move);
        canvas.hidden = true;
        canvas.style.opacity = '';
        delete canvas.dataset.fluidRenderer;
        if (glassHeading) delete glassHeading.dataset.liquidGlass;
    };
}
