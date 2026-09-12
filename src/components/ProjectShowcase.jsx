import { useEffect, useRef, useState } from 'react';
import { featuredProjects } from '../data/featuredProjects';
import '../styles/project-showcase.css';

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

function ProjectRow({ project, index, reducedMotion, pageVisible }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [seen, setSeen] = useState(false);
    const [step, setStep] = useState(0);
    useEffect(() => {
        if (!('IntersectionObserver' in window)) { setVisible(true); setSeen(true); return; }
        const observer = new IntersectionObserver(([entry]) => {
            setVisible(entry.isIntersecting);
            if (entry.isIntersecting) setSeen(true);
        }, { threshold: 0.15 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    const playing = visible && pageVisible && !reducedMotion;
    useEffect(() => {
        if (!playing) return;
        const timer = window.setInterval(() => setStep(current => (current + 1) % project.steps.length), 2200);
        return () => window.clearInterval(timer);
    }, [playing, project.steps.length]);
    return (
        <article ref={ref} className={`ps-row ${seen ? 'ps-seen' : ''}`} style={{ '--ps-accent': project.color }} aria-labelledby={`project-${project.id}`}>
            <figure className="ps-figure" aria-label={`${project.name}：${project.caption}`}>
                <div className={`ps-preview ps-${project.id} ${playing ? 'ps-playing' : ''}`} data-step={reducedMotion ? 3 : step} aria-hidden="true"><ProjectPreview kind={project.id} step={reducedMotion ? 3 : step} /></div>
            </figure>
            <div className="ps-copy"><p className="ps-category"><span>{String(index + 1).padStart(2, '0')}</span>{project.category}</p><h3 id={`project-${project.id}`}><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3><ul className="ps-tags">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></div>
        </article>
    );
}

export default function ProjectShowcase() {
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [pageVisible, setPageVisible] = useState(() => !document.hidden);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotion = () => setReducedMotion(media.matches);
        const updateVisibility = () => setPageVisible(!document.hidden);
        media.addEventListener('change', updateMotion);
        document.addEventListener('visibilitychange', updateVisibility);
        return () => { media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility); };
    }, []);
    return <section id="projects" className="ps-section" aria-labelledby="projects-title"><div className="ps-heading"><div><p>SELECTED PROJECTS</p><h2 id="projects-title">精选项目</h2></div></div><div className="ps-grid">{featuredProjects.map((project, index) => <ProjectRow key={project.id} project={project} index={index} reducedMotion={reducedMotion} pageVisible={pageVisible} />)}</div></section>;
}
