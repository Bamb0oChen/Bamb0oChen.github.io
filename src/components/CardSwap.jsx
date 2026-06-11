import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export const Card = forwardRef(({ customClass, ...rest }, ref) => (
    <div ref={ref} {...rest} className={`swap-card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (index, distX, distY, total) => ({
    x: index * distX,
    y: -index * distY,
    z: -index * distX * 1.5,
    zIndex: total - index
});

const placeNow = (el, slot, skew) => {
    if (!el) return;
    gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
    });
};

export default function CardSwap({
    width = 500,
    height = 400,
    cardDistance = 60,
    verticalDistance = 70,
    delay = 5000,
    pauseOnHover = false,
    onCardClick,
    skewAmount = 6,
    easing = 'elastic',
    children
}) {
    const config = easing === 'elastic'
        ? {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05
        }
        : {
            ease: 'power1.inOut',
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2
        };

    const childArr = useMemo(() => Children.toArray(children), [children]);
    const refs = useMemo(() => childArr.map(() => React.createRef()), [childArr.length]);
    const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
    const tlRef = useRef(null);
    const intervalRef = useRef();
    const container = useRef(null);
    const visibleRef = useRef(false);

    useEffect(() => {
        const total = refs.length;
        refs.forEach((ref, index) => placeNow(ref.current, makeSlot(index, cardDistance, verticalDistance, total), skewAmount));

        const swap = () => {
            if (order.current.length < 2) return;
            const [front, ...rest] = order.current;
            const elFront = refs[front].current;
            const tl = gsap.timeline();
            tlRef.current = tl;

            tl.to(elFront, {
                y: '+=500',
                duration: config.durDrop,
                ease: config.ease
            });

            tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
            rest.forEach((idx, index) => {
                const el = refs[idx].current;
                const slot = makeSlot(index, cardDistance, verticalDistance, refs.length);
                tl.set(el, { zIndex: slot.zIndex }, 'promote');
                tl.to(el, {
                    x: slot.x,
                    y: slot.y,
                    z: slot.z,
                    duration: config.durMove,
                    ease: config.ease
                }, `promote+=${index * 0.15}`);
            });

            const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
            tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
            tl.call(() => {
                gsap.set(elFront, { zIndex: backSlot.zIndex });
            }, undefined, 'return');
            tl.to(elFront, {
                x: backSlot.x,
                y: backSlot.y,
                z: backSlot.z,
                duration: config.durReturn,
                ease: config.ease
            }, 'return');
            tl.call(() => {
                order.current = [...rest, front];
            });
        };

        const start = () => {
            if (!visibleRef.current || document.hidden) return;
            window.clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(swap, delay);
        };
        const pause = () => {
            tlRef.current?.pause();
            window.clearInterval(intervalRef.current);
        };
        const resume = () => {
            if (!visibleRef.current || document.hidden) return;
            tlRef.current?.play();
            start();
        };

        const node = container.current;
        let observer = null;
        if (node && 'IntersectionObserver' in window) {
            observer = new IntersectionObserver(entries => {
                visibleRef.current = entries.some(entry => entry.isIntersecting);
                if (visibleRef.current) {
                    if (!tlRef.current) swap();
                    resume();
                } else {
                    pause();
                }
            }, { rootMargin: '240px 0px' });
            observer.observe(node);
        } else {
            visibleRef.current = true;
            swap();
            start();
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                pause();
            } else {
                resume();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (pauseOnHover && node) {
            node.addEventListener('mouseenter', pause);
            node.addEventListener('mouseleave', resume);
        }

        return () => {
            window.clearInterval(intervalRef.current);
            tlRef.current?.kill();
            observer?.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (pauseOnHover && node) {
                node.removeEventListener('mouseenter', pause);
                node.removeEventListener('mouseleave', resume);
            }
        };
    }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs, config.durDrop, config.durMove, config.durReturn, config.ease, config.promoteOverlap, config.returnDelay]);

    const rendered = childArr.map((child, index) => isValidElement(child)
        ? cloneElement(child, {
            key: index,
            ref: refs[index],
            style: { width, height, ...(child.props.style ?? {}) },
            onClick: event => {
                child.props.onClick?.(event);
                onCardClick?.(index);
            }
        })
        : child);

    return (
        <div ref={container} className="card-swap-container" style={{ width, height }}>
            {rendered}
        </div>
    );
}
