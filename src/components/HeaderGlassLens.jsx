import { useEffect, useRef } from 'react';

const isolateRed = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const isolateGreen = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
const isolateBlue = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';

function makeEdgeMap(canvas, width, height, radius) {
    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);
    const context = canvas.getContext('2d');
    if (!context) return null;

    const pixels = context.createImageData(canvas.width, canvas.height);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const bevel = 9;
    for (let row = 0; row < canvas.height; row++) {
        for (let column = 0; column < canvas.width; column++) {
            const x = column + 0.5 - halfWidth;
            const y = row + 0.5 - halfHeight;
            const qx = Math.abs(x) - halfWidth + radius;
            const qy = Math.abs(y) - halfHeight + radius;
            const outsideX = Math.max(0, qx);
            const outsideY = Math.max(0, qy);
            const corner = Math.hypot(outsideX, outsideY);
            const depth = radius - corner - Math.min(Math.max(qx, qy), 0);
            const offset = 4 * (row * canvas.width + column);
            let dx = 0;
            let dy = 0;
            if (depth > 0 && depth < bevel) {
                const strength = Math.sin(Math.PI * depth / bevel) * 0.94;
                dx = Math.sign(x) * strength * (corner ? outsideX / corner : Number(qx > qy));
                dy = Math.sign(y) * strength * (corner ? outsideY / corner : Number(qy >= qx));
            }
            pixels.data[offset] = Math.round(128 + 127 * dx);
            pixels.data[offset + 1] = Math.round(128 + 127 * dy);
            pixels.data[offset + 3] = 255;
        }
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL();
}

export default function HeaderGlassLens({ headerRef }) {
    const imageRef = useRef(null);

    useEffect(() => {
        const header = headerRef.current;
        const image = imageRef.current;
        if (!header || !image || !CSS.supports('backdrop-filter', 'url(#site-header-glass-lens)')) return;
        const canvas = document.createElement('canvas');
        let lastSize;

        function update() {
            const { width, height } = header.getBoundingClientRect();
            if (!width || height > 110) return;
            const radius = parseFloat(getComputedStyle(header).borderTopLeftRadius);
            const size = `${width}:${height}:${radius}`;
            if (lastSize === size) return;
            lastSize = size;
            const map = makeEdgeMap(canvas, width, height, radius);
            if (!map) return;
            image.setAttribute('href', map);
            header.dataset.glassLens = 'true';
        }

        const resize = new ResizeObserver(update);
        resize.observe(header);
        return () => {
            resize.disconnect();
            delete header.dataset.glassLens;
        };
    }, [headerRef]);

    return (
        <svg className="site-glass-definitions" width="0" height="0" aria-hidden="true">
            <filter id="site-header-glass-lens" x="0%" y="0%" width="100%" height="100%"
                colorInterpolationFilters="sRGB">
                <feImage ref={imageRef} result="edge" preserveAspectRatio="none" />
                <feDisplacementMap in="SourceGraphic" in2="edge" scale="17" xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix values={isolateRed} result="red" />
                <feDisplacementMap in="SourceGraphic" in2="edge" scale="15" xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix values={isolateGreen} result="green" />
                <feDisplacementMap in="SourceGraphic" in2="edge" scale="13" xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix values={isolateBlue} result="blue" />
                <feBlend in="red" in2="green" mode="screen" result="redGreen" />
                <feBlend in="redGreen" in2="blue" mode="screen" />
            </filter>
        </svg>
    );
}
