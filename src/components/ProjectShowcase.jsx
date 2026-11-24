import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featuredProjects } from '../data/featuredProjects';
import '../styles/project-showcase.css';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function ProjectPreview({ kind, step }) {
    if (kind === 'infohub') return (
        <div className="ps-hub">
            <div className="ps-source-stack"><span>校园通知 <i /></span><span>RSS 订阅 <i /></span><span>公开信息 <i /></span></div>
            <div className="ps-transfer">→</div>
            <div className="ps-mail"><small>InfoHub / 收件预览</small><strong>校园 · 本周摘要</strong><p>公开讲座通知</p><div className="ps-line" /><div className="ps-line short" /><div className={`ps-calendar ${step >= 3 ? 'shown' : ''}`}><b>18</b><span>示例讲座<br /><small>9 月 · 14:00</small></span></div></div>
        </div>
    );
    if (kind === 'xiaxi') return (
        <div className="ps-story">
            <div className="ps-story-sun" /><div className="ps-story-windows" />
            <span className="ps-story-name">夏隙百日<small>A SUMMER STORY</small></span>
            <div className="ps-story-path"><span className={step >= 1 ? 'selected' : ''}>日常</span><i /><span className={step >= 2 ? 'selected' : ''}>选择</span><i /><span className={step >= 3 ? 'selected' : ''}>继续</span></div>
            <div className="ps-story-page"><small>CHAPTER {String(step + 1).padStart(2, '0')}</small><div className="ps-line" /><div className="ps-line short" /></div>
        </div>
    );
    if (kind === 'colorpal') return (
        <div className="ps-color">
            <div className="ps-color-photo"><div className="ps-color-sun" /><div className="ps-color-hill" /><span className="ps-scan" /></div>
            <div className="ps-palette">{['#ed927a', '#efc77b', '#a5ceaa', '#819dc3'].map(color => <i key={color} style={{ background: color }} />)}</div>
            <div className={`ps-pet ${step >= 3 ? 'happy' : ''}`}><div className="ps-pet-face">•‿•</div><span>小彩</span><div className="ps-energy"><i /></div></div>
        </div>
    );
    if (kind === 'claude') return (
        <div className="ps-terminal">
            <div className="ps-terminal-top"><i /><i /><i /><span>agent_loop.py</span></div>
            <p><em>$</em> understand the agent loop</p>
            <div className="ps-loop">{['任务', '模型', '工具', '结果'].map((label, i) => <span className={i === step ? 'selected' : ''} key={label}>{label}{i < 3 && <b>→</b>}</span>)}</div>
            <code>{['messages.append(task)', 'response = model(messages)', 'result = execute(tool_call)', 'messages.append(result)'][step]}</code>
            <div className="ps-terminal-output"><span>›</span> {['等待模型响应', 'tool_use → read_file', 'tool_result → context', 'continue → next iteration'][step]}<i /></div>
        </div>
    );
    if (kind === 'study') return (
        <div className="ps-study">
            <div className="ps-books"><span>教材 A</span><span>教材 B</span></div>
            <svg viewBox="0 0 400 170" className="ps-graph">
                <g className={step >= 1 ? 'connected' : ''} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M70 45L180 50L300 30M70 45L140 130L260 130L300 30M180 50L260 130M180 50L140 130M300 30L350 105" /></g>
                {[[70,45,'教材'],[180,50,'章节'],[300,30,'章节'],[140,130,'概念'],[260,130,'概念'],[350,105,'概念']].map(([x,y,label],i) => <g key={i} className={step >= 2 && [1,3,4].includes(i) ? 'highlight' : ''}><circle cx={x} cy={y} r="22" /><text x={x} y={y + 4} textAnchor="middle">{label}</text></g>)}
            </svg>
            <div className="ps-answer">{step >= 3 ? '回答依据 → 示例教材 · 第二章 §2.1' : '教材 → 章节 → 知识点'}</div>
        </div>
    );
    return (
        <div className="ps-notebook">
            <aside><b>学习笔记</b>{['计算机科学', '数学基础', '语言学习'].map((item, i) => <span key={item} className={i === 0 && step >= 1 ? 'selected' : ''}>{item}</span>)}</aside>
            <div className="ps-note-page"><small>计算机科学 / CSAPP</small><strong>理解一条指令</strong><div className="ps-line" /><div className="ps-line short" /><code className={step >= 2 ? 'selected' : ''}>movq (%rdi), %rax</code><p className={step >= 3 ? 'selected' : ''}>地址 → 内存 → 寄存器</p></div>
        </div>
    );
}

function ProjectRow({ project, active, reducedMotion, pageVisible, interactive }) {
    const [step, setStep] = useState(0);
    const frameCount = project.screenshots?.length || project.steps.length;
    useEffect(() => {
        if (!active || !pageVisible || reducedMotion || frameCount < 2) return;
        const timer = window.setInterval(() => setStep(current => (current + 1) % frameCount),
            project.screenshots ? 5000 : 2200);
        return () => window.clearInterval(timer);
    }, [active, pageVisible, reducedMotion, frameCount, project.screenshots]);

    const frame = reducedMotion ? 0 : step;
    return (
        <article className="ps-row" id={`project-panel-${project.id}`}
            style={{ '--ps-accent': project.color }} aria-labelledby={`project-${project.id}`} inert={!interactive}>
            <figure className="ps-figure" aria-label={`${project.name}：${project.caption}`}>
                <div className={`ps-preview ps-preview--${project.id}`} data-step={frame} aria-hidden="true">
                    {project.screenshots ? project.screenshots.map((src, imageIndex) => {
                        const selected = imageIndex === frame;
                        const activeClass = selected ? 'is-active' : '';
                        const image = (
                            <img key={src} src={src} alt="" loading={active && selected ? 'eager' : 'lazy'}
                                decoding="async" className={`ps-screenshot ${activeClass}`} />
                        );
                        if (project.id !== 'colorpal' || imageIndex !== 0) return image;
                        return (
                            <div key={src} className={`ps-portrait-frame ${activeClass}`}>
                                <img src={src} alt="" loading="lazy" decoding="async" className="ps-portrait-backdrop" />
                                {image}
                            </div>
                        );
                    }) : <ProjectPreview kind={project.id} step={frame} />}
                </div>
                <figcaption className="ps-copy">
                    <h3 id={`project-${project.id}`}><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
                </figcaption>
            </figure>
        </article>
    );
}

const slideCount = featuredProjects.length;
const stillMedia = '(prefers-reduced-motion: reduce), (max-height: 420px)';

export default function ProjectShowcase() {
    const sectionRef = useRef(null);
    const stageRef = useRef(null);
    const trackRef = useRef(null);
    const activeRef = useRef(0);
    const goToProjectRef = useRef(null);
    const [active, setActive] = useState(0);
    const [still, setStill] = useState(() => window.matchMedia(stillMedia).matches);
    const [pageVisible, setPageVisible] = useState(() => !document.hidden);
    const [stageVisible, setStageVisible] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(stillMedia);
        const updateMotion = () => setStill(media.matches);
        const updateVisibility = () => setPageVisible(!document.hidden);
        media.addEventListener('change', updateMotion);
        document.addEventListener('visibilitychange', updateVisibility);
        const observer = new IntersectionObserver(([entry]) => setStageVisible(entry.intersectionRatio >= 0.25),
            { threshold: 0.25 });
        observer.observe(stageRef.current);
        return () => {
            media.removeEventListener('change', updateMotion);
            document.removeEventListener('visibilitychange', updateVisibility);
            observer.disconnect();
        };
    }, []);

    useLayoutEffect(() => {
        if (still) return;
        const section = sectionRef.current;
        const stage = stageRef.current;
        const track = trackRef.current;
        const lastIndex = slideCount - 1;
        let destination;
        let transition;

        function update({ progress }) {
            const position = progress * lastIndex;
            const current = Math.round(position);
            const offset = Math.abs(position - current) < 0.003 ? current : position;
            track.style.setProperty('--ps-shift', String(-offset * 100) + '%');
            if (current !== activeRef.current) {
                activeRef.current = current;
                setActive(current);
            }
        }

        const trigger = ScrollTrigger.create({
            trigger: section,
            start: () => 'top ' + getComputedStyle(stage).top,
            end: () => '+=' + (section.offsetHeight - stage.offsetHeight),
            onUpdate: update,
            onRefresh: update,
            snap: {
                snapTo: progress => transition ? progress : Math.round(progress * lastIndex) / lastIndex,
                inertia: false,
                delay: 0.15,
                duration: { min: 0.22, max: 0.42 },
                ease: 'power2.out',
            },
        });

        function goToProject(index) {
            transition?.kill();
            const snapTween = trigger.getTween(true);
            if (snapTween) snapTween.kill();
            destination = index;
            const top = trigger.start + (trigger.end - trigger.start) * index / lastIndex;
            transition = gsap.to(window, {
                scrollTo: { y: Math.round(top), autoKill: true },
                duration: 0.48,
                ease: 'power2.inOut',
                onComplete: clearTransition,
                onInterrupt: clearTransition,
            });
        }

        function clearTransition() {
            transition = undefined;
            destination = undefined;
        }

        function nextProject(direction, distance = 0) {
            const y = trigger.scroll();
            if (y < trigger.start - 2) {
                return direction > 0 && y + distance >= trigger.start ? 0 : undefined;
            }
            if (y > trigger.end + 2) {
                return direction < 0 && y - distance <= trigger.end ? lastIndex : undefined;
            }

            const next = (destination ?? activeRef.current) + direction;
            return next >= 0 && next <= lastIndex ? next : undefined;
        }

        function ignoreInput(event) {
            return event.ctrlKey || event.metaKey || event.target.closest?.(
                '.agent-overlay, #private-bar-panel, dialog[open], input, textarea, select, [contenteditable="true"]'
            );
        }

        let wheelDirection = 0;
        let previousWheelTime = -Infinity;
        let reverseDistance = 0;

        function onWheel(event) {
            if (!event.cancelable || ignoreInput(event) || event.shiftKey || !event.deltaY ||
                Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            const direction = Math.sign(event.deltaY);
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
            const distance = Math.abs(event.deltaY) * unit;
            if (event.timeStamp - previousWheelTime > 150) {
                wheelDirection = 0;
                reverseDistance = 0;
            }

            const next = nextProject(direction, distance);
            if (next === undefined && direction !== wheelDirection && !transition) return;
            event.preventDefault();
            previousWheelTime = event.timeStamp;
            if (direction === wheelDirection) {
                reverseDistance = 0;
                return;
            }

            // Suppress momentum from the same swipe and allow a deliberate reversal.
            if (wheelDirection) {
                reverseDistance += distance;
                if (reverseDistance < 20) return;
            }

            wheelDirection = direction;
            reverseDistance = 0;
            if (next !== undefined) goToProject(next);
        }

        let touchStart;
        let touchHandled = false;

        function resetTouch() {
            touchStart = undefined;
            touchHandled = false;
        }

        function onTouchStart(event) {
            resetTouch();
            if (event.touches.length !== 1 || ignoreInput(event)) return;
            const y = trigger.scroll();
            if (y < trigger.start - 2 || y > trigger.end + 2) return;
            touchStart = event.touches[0];
        }

        function onTouchMove(event) {
            if (!touchStart || !event.cancelable || event.touches.length !== 1) return;
            if (touchHandled) {
                event.preventDefault();
                return;
            }

            const touch = event.touches[0];
            const movement = touchStart.clientY - touch.clientY;
            const sideways = touchStart.clientX - touch.clientX;
            if (!movement || Math.abs(sideways) > Math.abs(movement)) return;

            const next = nextProject(Math.sign(movement));
            if (next === undefined) {
                resetTouch();
                return;
            }
            event.preventDefault();
            if (Math.abs(movement) < 28) return;

            touchHandled = true;
            goToProject(next);
        }

        function onKeyDown(event) {
            if (event.defaultPrevented || ignoreInput(event) || event.altKey ||
                event.target.closest?.('button, a')) return;
            const key = event.key === ' ' ? (event.shiftKey ? 'PageUp' : 'PageDown') : event.key;
            if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(key)) return;

            const direction = key === 'ArrowDown' || key === 'PageDown' ? 1 : -1;
            const next = nextProject(direction);
            if (next === undefined) return;

            event.preventDefault();
            if (!event.repeat) goToProject(next);
        }

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', resetTouch);
        window.addEventListener('touchcancel', resetTouch);
        window.addEventListener('keydown', onKeyDown);

        goToProjectRef.current = goToProject;
        const resize = new ResizeObserver(() => trigger.refresh());
        resize.observe(stage);
        return () => {
            goToProjectRef.current = null;
            resize.disconnect();
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', resetTouch);
            window.removeEventListener('touchcancel', resetTouch);
            window.removeEventListener('keydown', onKeyDown);
            transition?.kill();
            trigger.kill();
            track.style.removeProperty('--ps-shift');
        };
    }, [still]);

    return (
        <section ref={sectionRef} id="projects" className={`ps-section ${still ? 'ps-section--still' : ''}`}
            aria-labelledby="projects-title" style={{ '--ps-transition-count': slideCount - 1 }}>
            <div ref={stageRef} className="ps-stage">
                <div className="ps-heading">
                    <h2 id="projects-title">Project</h2>
                    {!still && (
                        <nav className="ps-pagination" aria-label="切换项目">
                            {featuredProjects.map((project, index) => (
                                <button key={project.id} type="button" aria-label={project.name}
                                    title={project.name} aria-current={index === active ? 'true' : undefined}
                                    aria-controls={`project-panel-${project.id}`}
                                    onClick={() => goToProjectRef.current?.(index)} />
                            ))}
                        </nav>
                    )}
                </div>
                <div className="ps-window">
                    <div ref={trackRef} className="ps-track">
                        {featuredProjects.map((project, index) => (
                            <ProjectRow key={project.id} project={project} active={!still && stageVisible && index === active}
                                reducedMotion={still} pageVisible={pageVisible} interactive={still || index === active} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
