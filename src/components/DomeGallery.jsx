import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const DEFAULT_IMAGES = [
    { src: 'https://picsum.photos/600/800?grayscale', alt: 'Lighttrace' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const wrapAngleSigned = deg => {
    const angle = (((deg + 180) % 360) + 360) % 360;
    return angle - 180;
};

function buildItems(pool, segments) {
    const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];
    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs;
        return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const normalizedImages = (pool.length ? pool : DEFAULT_IMAGES).map(image => {
        if (typeof image === 'string') return { src: image, alt: '' };
        return { src: image.src || '', alt: image.alt || '' };
    });

    const usedImages = Array.from({ length: coords.length }, (_, index) => normalizedImages[index % normalizedImages.length]);
    for (let i = 1; i < usedImages.length; i += 1) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j += 1) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const temp = usedImages[i];
                    usedImages[i] = usedImages[j];
                    usedImages[j] = temp;
                    break;
                }
            }
        }
    }

    return coords.map((coord, index) => ({
        ...coord,
        src: usedImages[index].src,
        alt: usedImages[index].alt
    }));
}

export default function DomeGallery({
    images = DEFAULT_IMAGES,
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#120F17',
    maxVerticalRotationDeg = 5,
    dragSensitivity = 20,
    enlargeTransitionMs = 300,
    segments = 35,
    dragDampening = 2,
    openedImageWidth = '250px',
    openedImageHeight = '350px',
    imageBorderRadius = '30px',
    openedImageBorderRadius = '30px',
    grayscale = true
}) {
    const rootRef = useRef(null);
    const sphereRef = useRef(null);
    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const movedRef = useRef(false);
    const inertiaRef = useRef(null);
    const [openedImage, setOpenedImage] = useState(null);

    const items = useMemo(() => buildItems(images, segments), [images, segments]);

    const applyTransform = useCallback((xDeg, yDeg) => {
        const el = sphereRef.current;
        if (el) {
            el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
        }
    }, []);

    const stopInertia = useCallback(() => {
        if (inertiaRef.current) {
            cancelAnimationFrame(inertiaRef.current);
            inertiaRef.current = null;
        }
    }, []);

    const startInertia = useCallback((vx, vy) => {
        let velocityX = clamp(vx, -1.4, 1.4) * 80;
        let velocityY = clamp(vy, -1.4, 1.4) * 80;
        const dampening = clamp(dragDampening ?? 0.6, 0, 3);
        const friction = 0.92 + Math.min(dampening, 2.8) * 0.02;
        let frames = 0;

        stopInertia();
        const step = () => {
            velocityX *= friction;
            velocityY *= friction;
            if ((Math.abs(velocityX) < 0.02 && Math.abs(velocityY) < 0.02) || frames > 260) {
                inertiaRef.current = null;
                return;
            }
            frames += 1;
            const nextX = clamp(rotationRef.current.x - velocityY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
            const nextY = wrapAngleSigned(rotationRef.current.y + velocityX / 200);
            rotationRef.current = { x: nextX, y: nextY };
            applyTransform(nextX, nextY);
            inertiaRef.current = requestAnimationFrame(step);
        };
        inertiaRef.current = requestAnimationFrame(step);
    }, [applyTransform, dragDampening, maxVerticalRotationDeg, stopInertia]);

    const bind = useGesture({
        onDragStart: () => {
            stopInertia();
            movedRef.current = false;
            startRotRef.current = { ...rotationRef.current };
        },
        onDrag: ({ last, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
            if (Math.abs(mx) + Math.abs(my) > 8) movedRef.current = true;
            const nextX = clamp(startRotRef.current.x - my / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
            const nextY = wrapAngleSigned(startRotRef.current.y + mx / dragSensitivity);
            rotationRef.current = { x: nextX, y: nextY };
            applyTransform(nextX, nextY);
            if (last && movedRef.current) startInertia(vx * dx, vy * dy);
        }
    }, {
        eventOptions: { passive: false }
    });

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        const resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            const width = Math.max(1, rect.width);
            const height = Math.max(1, rect.height);
            const minDim = Math.min(width, height);
            const maxDim = Math.max(width, height);
            const aspect = width / height;
            let basis;
            switch (fitBasis) {
                case 'min':
                    basis = minDim;
                    break;
                case 'max':
                    basis = maxDim;
                    break;
                case 'width':
                    basis = width;
                    break;
                case 'height':
                    basis = height;
                    break;
                default:
                    basis = aspect >= 1.3 ? width : minDim;
            }
            const radius = clamp(Math.min(basis * fit, height * 1.35), minRadius, maxRadius);
            root.style.setProperty('--radius', `${Math.round(radius)}px`);
            root.style.setProperty('--viewer-pad', `${Math.max(8, Math.round(minDim * padFactor))}px`);
            root.style.setProperty('--overlay-blur-color', overlayBlurColor);
            root.style.setProperty('--tile-radius', imageBorderRadius);
            root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
            applyTransform(rotationRef.current.x, rotationRef.current.y);
        });
        resizeObserver.observe(root);
        return () => resizeObserver.disconnect();
    }, [
        applyTransform,
        fit,
        fitBasis,
        grayscale,
        imageBorderRadius,
        maxRadius,
        minRadius,
        openedImageBorderRadius,
        overlayBlurColor,
        padFactor
    ]);

    useEffect(() => {
        document.body.classList.toggle('dg-scroll-lock', !!openedImage);
        return () => document.body.classList.remove('dg-scroll-lock');
    }, [openedImage]);

    useEffect(() => () => stopInertia(), [stopInertia]);

    function handleTileClick(item) {
        if (movedRef.current) {
            movedRef.current = false;
            return;
        }
        setOpenedImage(item);
    }

    return (
        <div
            ref={rootRef}
            className="dg-root"
            style={{
                '--segments-x': segments,
                '--segments-y': segments,
                '--overlay-blur-color': overlayBlurColor,
                '--tile-radius': imageBorderRadius,
                '--enlarge-radius': openedImageBorderRadius,
                '--image-filter': grayscale ? 'grayscale(1)' : 'none'
            }}
        >
            <main className="dg-main" {...bind()}>
                <div className="dg-stage">
                    <div ref={sphereRef} className="dg-sphere">
                        {items.map((item, index) => (
                            <div
                                key={`${item.x},${item.y},${index}`}
                                className="dg-item"
                                style={{
                                    '--offset-x': item.x,
                                    '--offset-y': item.y,
                                    '--item-size-x': item.sizeX,
                                    '--item-size-y': item.sizeY
                                }}
                            >
                                <button
                                    className="dg-item-image"
                                    type="button"
                                    aria-label={item.alt || 'Open image'}
                                    onClick={() => handleTileClick(item)}
                                >
                                    <img src={item.src} draggable={false} alt={item.alt || ''} loading="lazy" decoding="async" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="dg-overlay" />
                <div className="dg-overlay dg-overlay-blur" />
                <div className="dg-edge-fade dg-edge-fade-top" />
                <div className="dg-edge-fade dg-edge-fade-bottom" />
                <div className="dg-viewer">
                    <div className={`dg-scrim ${openedImage ? 'is-visible' : ''}`} onClick={() => setOpenedImage(null)} />
                    {openedImage && (
                        <button
                            className="dg-enlarge"
                            type="button"
                            style={{
                                width: openedImageWidth,
                                height: openedImageHeight,
                                transitionDuration: `${enlargeTransitionMs}ms`
                            }}
                            onClick={() => setOpenedImage(null)}
                            aria-label="Close image"
                        >
                            <img src={openedImage.src} alt={openedImage.alt || ''} />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
