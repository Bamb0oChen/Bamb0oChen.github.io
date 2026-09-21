// Mechanical adaptation of the upstream renderer; preserves its MIT header.
const fs = require('node:fs');
let source = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n');
const header = source.slice(0, source.indexOf("'use strict';"));
source = source.slice(source.indexOf("'use strict';") + 13);
source = source.replace("const canvas = document.getElementById('background');", '');
source = source.slice(0, source.indexOf('document.addEventListener("mousedown"'));
source = source.replace(/window.addEventListener\('touchend',[\s\S]*?(?=function updatePointerDownData)/, '');
source = source.replace(/const changeColor = [\s\S]*?(?=function update\(first\))/, 'let animationID = null;\n');
source = source.replace("createTextureAsync('assets/background.png')", "createTextureAsync(new URL('../../assets/fluid-dither.png', import.meta.url).href)");
source = source.replace('image.onload = () => {', 'image.onload = () => {\n if (disposed) return;');
source = source.replace('let pixelRatio = window.devicePixelRatio || 1;', 'let pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile() ? 1 : 1.5);');
source = source.replace('function update(first) {', `function update() {
    if (disposed) return;
    const targetOpacity = Math.max(0, Math.min(1, options.getOpacity?.() ?? 1));
    const fadeDelta = Math.min((performance.now() - fadeTime) / 1000, 0.25);
    fadeTime = performance.now();
    opacity += (targetOpacity - opacity) * (1 - Math.exp(-8 * fadeDelta));
    canvas.style.opacity = String(opacity * baseOpacity);
    if (document.hidden || opacity < 0.01) {
        lastUpdateTime = Date.now();
        idleTimer = setTimeout(() => { animationID = requestAnimationFrame(update); }, 200);
        return;
    }`);
source = source.replace("let gl = canvas.getContext('webgl2', params);", "let gl = canvas.getContext('webgl2', params);");
source = source.replace('let halfFloat;', `if (!gl) throw new Error('WebGL unavailable');
    gl = trackContext(gl);
    let halfFloat;`);
source = source.replace('halfFloat = gl.getExtension(\'OES_texture_half_float\');', "halfFloat = gl.getExtension('OES_texture_half_float');\n if (!halfFloat) throw new Error('Half-float textures unavailable');");
const prefix = `
export function startHeroFluid(canvas, options = {}) {
 if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
 let disposed = false, idleTimer = null, opacity = 1, fadeTime = performance.now();
 const baseOpacity = Number(getComputedStyle(canvas).opacity) || 1;
 const resources = new Map();
 const removers = [];
 function trackContext(context) {
   return new Proxy(context, { get(target, key) {
     const value = target[key];
     if (typeof value !== 'function') return value;
     if (/^create(Texture|Framebuffer|Buffer|Shader|Program)$/.test(key)) return (...args) => {
       const resource = value.apply(target, args);
       resources.set(resource, () => target[key.replace('create', 'delete')](resource));
       return resource;
     };
     if (/^delete(Texture|Framebuffer|Buffer|Shader|Program)$/.test(key)) return resource => {
       resources.delete(resource); return value.call(target, resource);
     };
     return value.bind(target);
   }});
 }
 function listen(target, event, callback) {
   target.addEventListener(event, callback, { passive: true });
   removers.push(() => target.removeEventListener(event, callback));
 }
 const config = {
   SIM_RESOLUTION: 128, DYE_RESOLUTION: 1024, DENSITY_DISSIPATION: 1,
   VELOCITY_DISSIPATION: 0.2, PRESSURE: 0.8, PRESSURE_ITERATIONS: 20,
   CURL: 30, SPLAT_RADIUS: 0.25, SPLAT_FORCE: 6000, SHADING: true,
   COLORFUL: true, COLOR_UPDATE_SPEED: 10, PAUSED: false,
   BACK_COLOR: {r:0,g:0,b:0}, TRANSPARENT: false,
   BLOOM: true, BLOOM_ITERATIONS: 8, BLOOM_RESOLUTION: 256,
   BLOOM_INTENSITY: 0.4, BLOOM_THRESHOLD: 0.8, BLOOM_SOFT_KNEE: 0.7,
   SUNRAYS: true, SUNRAYS_RESOLUTION: 196, SUNRAYS_WEIGHT: 1
 };
`;
const suffix = `
function movePointer(event) {
 if ((options.getOpacity?.() ?? 1) < 0.03 || document.hidden) return;
 const rect = canvas.getBoundingClientRect();
 const x = scaleByPixelRatio(event.clientX - rect.left);
 const y = scaleByPixelRatio(event.clientY - rect.top);
 const pointer = pointers[0];
 if (!pointer.down) updatePointerDownData(pointer, -1, x, y);
 else updatePointerMoveData(pointer, x, y);
}
listen(window, 'pointermove', movePointer);
listen(window, 'pointerdown', movePointer);
listen(window, 'pointerup', event => { if (event.pointerType !== 'mouse') updatePointerUpData(pointers[0]); });
listen(window, 'blur', () => updatePointerUpData(pointers[0]));
listen(document, 'visibilitychange', () => updatePointerUpData(pointers[0]));
updateKeywords();
initFramebuffers();
multipleSplats(10);
update();
return () => {
 disposed = true;
 cancelAnimationFrame(animationID);
 clearTimeout(idleTimer);
 removers.forEach(remove => remove());
 resources.forEach(release => release());
 resources.clear();
 canvas.style.opacity = '';
};
}
`;
fs.mkdirSync('src/utils/vendor', {recursive:true});
fs.writeFileSync('src/utils/vendor/homepageFluid.js', header + prefix + source + suffix);
