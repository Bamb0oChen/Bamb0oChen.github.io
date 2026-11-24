export const glassStudio = {
    ceiling: [0.80, 0.85, 0.90],
    floor: [0.39, 0.46, 0.53],
    key: [0.96, 0.98, 1.00],
    sheen: [0.110, 0.104, 0.094],
};

const shaderColor = channels => 'vec3(' + channels.map(value => value.toFixed(3)).join(', ') + ')';

export const glassWordmarkShader = `
uniform sampler2D uGlassShape;
uniform vec4 uGlassRect;
uniform vec2 uGlassPixel;
uniform float uGlassBevel;

vec3 glassWordmark(vec2 uv, vec3 background) {
    vec2 fromOrigin = uv - uGlassRect.xy;
    if (any(lessThan(fromOrigin, vec2(0.0))) || any(greaterThanEqual(fromOrigin, uGlassRect.zw)))
        return background;

    vec2 shapeUV = fromOrigin / uGlassRect.zw;
    shapeUV.y = 1.0 - shapeUV.y;
    vec4 shape = texture2D(uGlassShape, shapeUV);
    float distance = shape.r * 24.0 - 12.0;
    float shadow = smoothstep(-5.0, 0.0, distance);
    vec3 surroundings = background * (1.0 - shadow * 0.22);
    if (shape.a < 0.005)
        return surroundings;

    // The shape texture stores signed distance, the smooth outward normal, and coverage.
    vec2 outward = clamp((shape.gb * 255.0 - 128.0) / 127.0, -1.0, 1.0);
    float bevel = 1.0 - smoothstep(0.0, uGlassBevel, max(0.0, distance));
    vec3 normal = normalize(vec3(outward * bevel * 2.5, 1.0));
    vec3 ray = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / 1.47);
    vec2 offset = -ray.xy * (7.0 + 2.6 * uGlassBevel) * uGlassPixel;
    float rim = smoothstep(0.15, 0.86, bevel);
    vec2 dispersion = outward * (1.6 + 0.46 * uGlassBevel) * rim * uGlassPixel;
    vec3 transmission = sceneColor(clamp(uv + offset, 0.0, 1.0), 0.0);
    transmission.r = sceneColor(clamp(uv + offset + dispersion, 0.0, 1.0), 0.0).r;
    transmission.b = sceneColor(clamp(uv + offset - dispersion, 0.0, 1.0), 0.0).b;
    vec3 reflection = clamp(sceneColor(clamp(uv - offset * 1.2, 0.0, 1.0), 0.0), 0.0, 1.0);
    transmission = clamp(transmission, 0.0, 1.0);

    vec2 keyLight = vec2(-0.55, 0.835);
    float glint = pow(max(dot(outward, keyLight), 0.0), 4.0) * pow(bevel, 1.45);
    float counterLight = pow(max(dot(outward, -keyLight), 0.0), 5.0) * pow(bevel, 1.9);
    float fresnel = 0.04 + 0.96 * pow(1.0 - normal.z, 3.0);
    // A large neutral light above the glass remains visible when the fluid settles.
    float ceiling = 1.0 - smoothstep(0.12, 0.94, shapeUV.y);
    float bandOffset = (shapeUV.y - (0.27 + 0.07 * shapeUV.x)) / 0.25;
    float highlightBand = exp(-bandOffset * bandOffset);
    vec3 studio = mix(${shaderColor(glassStudio.floor)}, ${shaderColor(glassStudio.ceiling)}, ceiling) + ${shaderColor(glassStudio.sheen)} * highlightBand;
    vec3 key = ${shaderColor(glassStudio.key)};

    float sceneLight = max(transmission.r, max(transmission.g, transmission.b));
    float illumination = smoothstep(0.08, 0.66, sceneLight);
    float transmissionWeight = mix(0.09, 0.57, illumination);
    vec3 glass = mix(studio, transmission, transmissionWeight);
    glass = mix(glass, mix(key, reflection, illumination * 0.62), fresnel * 0.41);
    glass = mix(glass, key, 0.29 * glint + 0.10 * counterLight + 0.018 * bevel);

    float spectralSide = smoothstep(-0.7, 0.7, dot(outward, vec2(0.84, -0.54)));
    vec3 spectralRim = mix(vec3(0.18, 0.58, 1.0), vec3(1.0, 0.37, 0.21), spectralSide);
    glass += spectralRim * pow(rim, 3.0) * length(outward) * (0.016 + 0.13 * illumination);
    return mix(surroundings, clamp(glass, 0.0, 1.0), shape.a);
}
`;
function distanceTo(coverage, width, height, findInk) {
    const distance = new Float32Array(coverage.length);
    for (let i = 0; i < distance.length; i++) {
        distance[i] = (coverage[i] >= 128) === findInk ? 0 : width + height;
    }

    for (const direction of [1, -1]) {
        const startY = direction === 1 ? 0 : height - 1;
        const startX = direction === 1 ? 0 : width - 1;
        for (let row = 0; row < height; row++) {
            const y = startY + row * direction;
            for (let column = 0; column < width; column++) {
                const x = startX + column * direction;
                const i = y * width + x;
                if (distance[i] === 0) continue;

                let nearest = distance[i];
                if (column > 0) nearest = Math.min(nearest, distance[i - direction] + 1);
                if (row > 0) {
                    const previousRow = i - direction * width;
                    nearest = Math.min(nearest, distance[previousRow] + 1);
                    if (x > 0) nearest = Math.min(nearest, distance[previousRow - 1] + Math.SQRT2);
                    if (x + 1 < width) nearest = Math.min(nearest, distance[previousRow + 1] + Math.SQRT2);
                }
                distance[i] = nearest;
            }
        }
    }
    return distance;
}

const padding = 10;

export function rasterizeHeading(heading, rect, density) {
    const raster = document.createElement('canvas');
    raster.width = Math.ceil((rect.width + 2 * padding) * density);
    raster.height = Math.ceil((rect.height + 2 * padding) * density);
    const context = raster.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    const style = getComputedStyle(heading);
    const size = parseFloat(style.fontSize);
    const text = heading.textContent;
    context.scale(density, density);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.textAlign = 'center';
    if ('textRendering' in context) context.textRendering = 'geometricPrecision';
    if ('letterSpacing' in context) context.letterSpacing = style.letterSpacing;
    const metrics = context.measureText(text);
    // Match the centered DOM line box using the font's baseline metrics.
    const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? size * 0.2;
    context.fillText(text, padding + rect.width / 2, padding + (rect.height + ascent - descent) / 2);

    const { width, height } = raster;
    const pixels = context.getImageData(0, 0, width, height).data;
    const coverage = new Uint8Array(width * height);
    for (let i = 0; i < coverage.length; i++) coverage[i] = pixels[i * 4 + 3];
    const toInk = distanceTo(coverage, width, height, true);
    const toAir = distanceTo(coverage, width, height, false);
    const distance = new Float32Array(coverage.length);
    for (let i = 0; i < coverage.length; i++) {
        const alpha = coverage[i];
        // Partial pixels locate the contour between the centers of adjacent texels.
        const scaledDistance = alpha > 0 && alpha < 255 ? alpha / 255 - 0.5 :
            alpha >= 128 ? toAir[i] - 0.5 : 0.5 - toInk[i];
        distance[i] = scaledDistance / density;
    }

    const shape = new Uint8Array(pixels.length);
    const radius = Math.max(1, Math.round(density * 0.75));
    const gradientScale = density / (8 * radius);
    for (let i = 0; i < coverage.length; i++) {
        const channel = i * 4;
        const encodedDistance = Math.max(0, Math.min(1, (distance[i] + 12) / 24));
        shape[channel] = Math.round(encodedDistance * 255);
        shape[channel + 1] = 128;
        shape[channel + 2] = 128;
        shape[channel + 3] = coverage[i];
        if (!coverage[i]) continue;

        const span = radius * width;
        // Smooth in the perpendicular direction before measuring the slope.
        const x = (
            distance[i - width - radius] - distance[i - width + radius] +
            2 * (distance[i - radius] - distance[i + radius]) +
            distance[i + width - radius] - distance[i + width + radius]
        ) * gradientScale;
        const y = (
            distance[i + span - 1] - distance[i - span - 1] +
            2 * (distance[i + span] - distance[i - span]) +
            distance[i + span + 1] - distance[i - span + 1]
        ) * gradientScale;
        const length = Math.max(1, Math.hypot(x, y));
        shape[channel + 1] = Math.round(128 + 127 * x / length);
        shape[channel + 2] = Math.round(128 + 127 * y / length);
    }
    return { width, height, shape, padding, bevel: Math.max(2.8, Math.min(8, size * 0.08)) };
}

export function createGlassWordmark(gl, canvas, heading) {
    if (!heading || window.matchMedia('(forced-colors: active)').matches) return null;
    const texture = gl.createTexture();
    if (!texture) return null;

    const textureUnit = 4;
    let outline;
    let outlineWidth = 0;
    let outlineHeight = 0;
    let density = 0;
    let active = false;
    const bounds = new Float32Array(4);
    const emptyBounds = new Float32Array(4);

    function upload(rect, nextDensity) {
        outline = rasterizeHeading(heading, rect, nextDensity);
        outlineWidth = rect.width;
        outlineHeight = rect.height;
        density = nextDensity;
        if (!outline) return;

        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, outline.width, outline.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, outline.shape);
    }

    return {
        update() {
            const rect = heading.getBoundingClientRect();
            const viewport = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height || !viewport.width || !viewport.height ||
                rect.bottom <= viewport.top || rect.top >= viewport.bottom) return false;

            const nextDensity = Math.min(3, Math.max(2, (window.devicePixelRatio || 1) * 1.5));
            if (rect.width !== outlineWidth || rect.height !== outlineHeight || nextDensity !== density) {
                upload(rect, nextDensity);
            }
            if (!outline) return false;

            const width = outline.width / density;
            const height = outline.height / density;
            bounds[0] = (rect.left - viewport.left - padding) / viewport.width;
            bounds[1] = (viewport.bottom - rect.top + padding - height) / viewport.height;
            bounds[2] = width / viewport.width;
            bounds[3] = height / viewport.height;
            return true;
        },
        bind(uniforms, visible) {
            gl.uniform4fv(uniforms.uGlassRect, visible ? bounds : emptyBounds);
            if (!visible) return;
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uniforms.uGlassShape, textureUnit);
            gl.uniform2f(uniforms.uGlassPixel, bounds[2] * density / outline.width, bounds[3] * density / outline.height);
            gl.uniform1f(uniforms.uGlassBevel, outline.bevel);
        },
        show() {
            if (active) return;
            active = true;
            heading.dataset.liquidGlass = 'ready';
        },
        hide() {
            active = false;
            delete heading.dataset.liquidGlass;
        },
    };
}
