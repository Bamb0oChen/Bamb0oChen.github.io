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
    // Bend the entire curtain coordinate system, including its fine rays.
    for (int i = 0; i < 2; i++) {
        float layer = float(i);
        float x = q.x + layer * 0.23
            + sin(q.y * 4.5 + t * 0.65 + layer) * 0.22;
        float fold = fbm(vec2(x * 1.65 + t * 0.3, layer * 3.7 + t * 0.16));
        float arc = -0.12 + layer * 0.17
            + sin(x * 3.8 + t * 0.7 + layer * 1.4) * 0.29
            + (fold - 0.5) * 0.12
            + sin(x * 7.0 - t * 0.4) * 0.045;
        float h = q.y - arc;
        float rayHeight = 0.26 + fold * 0.30;
        float curtain = smoothstep(-0.075, 0.04, h)
            * exp(-max(h, 0.0) / rayHeight * 3.5);
        float edge = exp(-pow(h / 0.035, 2.0));
        float rayX = x * 110.0 + fold * 12.0 + sin(h * 5.0 + t) * 9.0;
        float rays = 0.62 + 0.38 * noise(vec2(rayX - t * 0.5, layer * 7.0 + t * 0.1));
        float detail = 0.85 + 0.15 * noise(vec2(rayX * 2.6, h * 2.5 + t * 0.12));
        float spread = exp(-pow(h / 0.22, 2.0)) * 0.12;
        vec3 green = vec3(0.16, 0.76, 0.49);
        vec3 teal = vec3(0.10, 0.57, 0.72);
        vec3 violet = vec3(0.38, 0.23, 0.65);
        vec3 base = mix(green, teal, layer * 0.28);
        vec3 tint = mix(base, violet, smoothstep(0.08, 0.38, h) * 0.65);
        float curtainVariation = 0.35 + 0.65 * smoothstep(0.2, 0.75,
            noise(vec2(x * 2.0 + layer * 4.0, t * 0.25)));
        light += (tint * (curtain * rays * detail * 0.70 + spread)
            + mix(base, vec3(0.65, 0.95, 0.79), 0.4) * edge * 0.30)
            * curtainVariation * (1.0 - layer * 0.18);
    }
    float edgeFade = smoothstep(0.0, 0.16, uv.x) * (1.0 - smoothstep(0.84, 1.0, uv.x));
    float verticalFade = smoothstep(0.0, 0.18, uv.y) * (1.0 - smoothstep(0.80, 1.0, uv.y));
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
