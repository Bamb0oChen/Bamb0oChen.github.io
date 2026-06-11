import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './ChromaGrid.css';

export default function ChromaGrid({
    items,
    className = '',
    radius = 300,
    columns = 3,
    rows = 2,
    damping = 0.45,
    fadeOut = 0.6,
    ease = 'power3.out'
}) {
    const rootRef = useRef(null);
    const fadeRef = useRef(null);
    const setX = useRef(null);
    const setY = useRef(null);
    const pos = useRef({ x: 0, y: 0 });
    const data = items?.length ? items : [];

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return undefined;
        setX.current = gsap.quickSetter(el, '--x', 'px');
        setY.current = gsap.quickSetter(el, '--y', 'px');
        const { width, height } = el.getBoundingClientRect();
        pos.current = { x: width / 2, y: height / 2 };
        setX.current(pos.current.x);
        setY.current(pos.current.y);
        return () => {
            gsap.killTweensOf(pos.current);
        };
    }, []);

    const moveTo = (x, y) => {
        gsap.to(pos.current, {
            x,
            y,
            duration: damping,
            ease,
            onUpdate: () => {
                setX.current?.(pos.current.x);
                setY.current?.(pos.current.y);
            },
            overwrite: true
        });
    };

    const handleMove = event => {
        const rect = rootRef.current.getBoundingClientRect();
        moveTo(event.clientX - rect.left, event.clientY - rect.top);
        gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
    };

    const handleLeave = () => {
        gsap.to(fadeRef.current, {
            opacity: 1,
            duration: fadeOut,
            overwrite: true
        });
    };

    const handleCardClick = url => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCardMove = event => {
        const card = event.currentTarget;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    };

    return (
        <div
            ref={rootRef}
            className={`chroma-grid ${className}`}
            style={{
                '--r': `${radius}px`,
                '--cols': columns,
                '--rows': rows
            }}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
        >
            {data.map((item, index) => (
                <article
                    key={`${item.title}-${index}`}
                    className="chroma-card"
                    onMouseMove={handleCardMove}
                    onClick={() => handleCardClick(item.url)}
                    style={{
                        '--card-border': item.borderColor || 'transparent',
                        '--card-gradient': item.gradient,
                        cursor: item.url ? 'pointer' : 'default'
                    }}
                >
                    <div className="chroma-img-wrapper">
                        <img src={item.image} alt={item.title} loading="lazy" />
                    </div>
                    <footer className="chroma-info">
                        <h3 className="name">{item.title}</h3>
                        {item.handle && <span className="handle">{item.handle}</span>}
                        <p className="role">{item.subtitle}</p>
                        {item.location && <span className="location">{item.location}</span>}
                    </footer>
                </article>
            ))}
            <div className="chroma-overlay" />
            <div ref={fadeRef} className="chroma-fade" />
        </div>
    );
}
