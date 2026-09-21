import * as THREE from 'three';

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform float uOpacity;
uniform float uAspect;
uniform float uPointerStrength;
uniform vec2 uPointer;
uniform vec2 uVelocity;
varying vec2 vUv;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.86, -0.5, 0.5, 0.86);
    for (int i = 0; i < 5; i++) {
        value += amp * noise(p);
        p = rot * p * 2.02 + 11.7;
        amp *= 0.5;
    }
    return value;
}

vec2 swirl(vec2 p, vec2 center, float amount) {
    vec2 d = p - center;
    d.x *= uAspect;
    float dist = length(d);
    float falloff = exp(-dist * 4.2);
    float angle = amount * falloff;
    float s = sin(angle);
    float c = cos(angle);
    mat2 r = mat2(c, -s, s, c);
    d = r * d;
    d.x /= uAspect;
    return center + d;
}

void main() {
    vec2 uv = vUv;
    vec2 p = uv;
    vec2 pointer = vec2(uPointer.x, 1.0 - uPointer.y);
    float speed = clamp(length(uVelocity) * 7.0, 0.0, 1.0);
    float strength = uPointerStrength * (0.38 + speed * 0.62);

    p = swirl(p, pointer, 0.35 * strength);
    vec2 q = p - 0.5;
    q.x *= uAspect;

    float t = uTime * 0.045;
    vec3 light = vec3(0.0);
    // Integrate light above a folded emitting edge, never radially outwards.
    // Positive UV y is up. Sampling below each pixel creates rising curtains.
    for (int i = 0; i < 18; i++) {
        float rise = float(i) / 17.0;
        vec2 source = q - vec2(0.0, rise * 0.34);
        source.x -= rise * 0.045 * sin(q.y * 5.0 + t * 0.5);
        vec2 crown = vec2(source.x / max(uAspect * 0.43, 0.36), (source.y + 0.11) / 0.34);
        crown.x += 0.10 * sin(crown.y * 2.4 + t * 0.7);
        crown.y += 0.07 * sin(crown.x * 2.8 - t * 0.5);
        float angle = atan(crown.y, crown.x);
        float radius = length(crown);
        float opening = smoothstep(-0.92, -0.38, sin(angle));
        vec2 angular = vec2(cos(angle), sin(angle));
        float fold = noise(angular * 4.5 + vec2(t * 0.25, t * 0.1));
        float rim = 0.91
            + sin(angle * 3.0 + t * 0.6) * 0.13
            + sin(angle * 5.0 - t * 0.4) * 0.035
            + sin(angle * 13.0 + fold * 4.0 + t) * 0.025
            + (fold - 0.5) * 0.12;
        float distanceToRim = radius - rim;
        float width = 0.025 + rise * 0.055;
        float edge = exp(-pow(distanceToRim / width, 2.0));
        float glow = exp(-pow(distanceToRim / 0.16, 2.0));
        float silk = noise(angular * 105.0 + t * 0.18);
        float fineSilk = noise(angular * 235.0 - t * 0.12);
        float modulation = 0.25 + silk * 0.55 + fineSilk * 0.20;
        float upwardFlow = 0.8 + 0.2 * sin(rise * 15.0 - t * 3.5 + fold * 6.0);
        float intensity = (0.60 + 0.40 * sin(angle * 2.0 + t * 0.45)) * exp(-rise * 3.8);
        vec3 tint = mix(vec3(0.43, 0.90, 0.48), vec3(0.13, 0.47, 0.42), rise);
        light += (tint * edge * modulation * upwardFlow * 0.34
            + vec3(0.08, 0.28, 0.16) * glow * 0.035) * intensity * opening;
    }
    float edgeFade = smoothstep(0.0, 0.07, uv.x) * (1.0 - smoothstep(0.93, 1.0, uv.x));
    float verticalFade = smoothstep(0.0, 0.10, uv.y) * (1.0 - smoothstep(0.93, 1.0, uv.y));
    gl_FragColor = vec4(light, edgeFade * verticalFade * uOpacity * 0.85);
}
`;

export function startHeroFluid(canvas, options = {}) {
    if (!canvas || typeof window === 'undefined') return () => {};
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return () => {};

    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uAspect: { value: 1 },
        uPointerStrength: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.48) },
        uVelocity: { value: new THREE.Vector2(0, 0) }
    };
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let rafId = null;
    let idleTimer = null;
    let active = false;
    let pageVisible = !document.hidden;
    let lastTime = performance.now();
    const targetPointer = new THREE.Vector2(0.5, 0.48);
    const targetVelocity = new THREE.Vector2(0, 0);
    const previousPointer = new THREE.Vector2(0.5, 0.48);

    function resize() {
        const width = window.innerWidth || canvas.clientWidth || 1;
        const height = Math.max(window.innerHeight || canvas.clientHeight || 1, 1);
        renderer.setSize(width, height, false);
        uniforms.uAspect.value = width / height;
    }

    function handlePointerMove(event) {
        const x = event.clientX / Math.max(window.innerWidth || 1, 1);
        const y = event.clientY / Math.max(window.innerHeight || 1, 1);
        targetPointer.set(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
        targetVelocity.subVectors(targetPointer, previousPointer);
        previousPointer.copy(targetPointer);
        active = true;
    }

    function handlePointerLeave() {
        active = false;
    }

    function animate(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        const scrollOpacity = typeof options.getOpacity === 'function' ? options.getOpacity() : 1;
        const nearlyHidden = scrollOpacity < 0.03 && uniforms.uOpacity.value < 0.04 && !active;

        if (!pageVisible || nearlyHidden) {
            idleTimer = window.setTimeout(() => {
                lastTime = performance.now();
                rafId = requestAnimationFrame(animate);
            }, pageVisible ? 220 : 800);
            return;
        }

        uniforms.uTime.value = now / 1000;
        uniforms.uPointer.value.lerp(targetPointer, 1 - Math.pow(0.04, dt));
        uniforms.uVelocity.value.lerp(targetVelocity, active ? 0.18 : 0.08);
        uniforms.uPointerStrength.value += ((active ? 1 : 0) - uniforms.uPointerStrength.value) * (1 - Math.pow(0.08, dt));
        targetVelocity.multiplyScalar(0.92);
        uniforms.uOpacity.value += (scrollOpacity - uniforms.uOpacity.value) * 0.08;
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(animate);
    }

    function handleVisibilityChange() {
        pageVisible = !document.hidden;
        if (pageVisible && !rafId) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(animate);
        }
        handlePointerLeave();
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resize();
    rafId = requestAnimationFrame(animate);

    return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (idleTimer) window.clearTimeout(idleTimer);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
}
