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

    p = swirl(p, pointer, 5.8 * strength);
    vec2 q = p - 0.5;
    q.x *= uAspect;

    float t = uTime * 0.08;
    float fieldA = fbm(q * 2.1 + vec2(t * 1.2, -t * 0.65));
    float fieldB = fbm(q * 3.7 - vec2(t * 0.8, t * 1.05) + fieldA);
    float ribbons = sin((q.x + fieldB * 0.78) * 8.8 + t * 10.5) * 0.5 + 0.5;
    float curtains = pow(smoothstep(0.18, 0.9, sin((q.x * 3.2 + fieldA * 2.8 + t * 3.6)) * 0.5 + 0.5), 1.7);
    float veil = pow(smoothstep(0.62, 1.0, sin(q.x * 14.0 + fieldB * 5.0 - t * 7.4) * 0.5 + 0.5), 3.2);
    float wave = smoothstep(0.18, 0.9, fieldA * 0.76 + fieldB * 0.48 + ribbons * 0.38 + curtains * 0.34);

    vec2 pd = uv - pointer;
    pd.x *= uAspect;
    float wake = exp(-dot(pd, pd) * 18.0) * strength;
    float caustic = smoothstep(0.08, 0.84, wave + veil * 0.36 + wake * 1.25);

    vec3 ink = vec3(0.015, 0.07, 0.12);
    vec3 cyan = vec3(0.08, 0.82, 0.74);
    vec3 blue = vec3(0.10, 0.34, 0.78);
    vec3 violet = vec3(0.38, 0.22, 0.74);
    vec3 amber = vec3(0.96, 0.48, 0.18);
    vec3 color = mix(ink, blue, caustic * 0.62);
    color = mix(color, cyan, smoothstep(0.46, 1.0, fieldB + curtains * 0.55 + veil * 0.4) * 0.82);
    color = mix(color, violet, smoothstep(0.62, 1.0, fieldA + ribbons * 0.42) * 0.32);
    color = mix(color, amber, wake * 0.48 + smoothstep(0.9, 1.0, ribbons) * 0.18);

    float verticalGlow = smoothstep(0.78, 0.08, abs(q.y + 0.06));
    float vignette = smoothstep(1.05, 0.18, length(q));
    float alpha = (0.16 + caustic * 0.62 + curtains * 0.2 + veil * 0.34 + wake * 0.54) * verticalGlow * vignette * uOpacity;
    gl_FragColor = vec4(color, alpha);
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
