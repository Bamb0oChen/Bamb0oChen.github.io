import { useEffect, useRef, useState } from 'react';
import HeaderGlassLens from './HeaderGlassLens';
import { fetchSiteConfig } from '../utils/siteRuntimeConfig';
import './SiteHeader.css';

export const NOTES_NAV_ICON = 'https://bamb0ochen.com/notes/assets/images/patchouli-coding-white-outline.png';

const SERVER_SERVICES = [
    {
        id: 'qb',
        configKey: 'qb',
        label: 'Torrent',
        title: 'qBittorrent',
        description: '下载队列、种子任务与速度面板。',
        status: 'Private',
        illustration: 'qb'
    },
    {
        id: 'immich',
        configKey: 'immich',
        label: 'Photos',
        title: 'Immich',
        description: '相册备份、人物时间线与照片回忆。',
        status: 'Private',
        illustration: 'immich'
    },
    {
        id: 'nginx',
        configKey: 'nginx',
        label: 'Gateway',
        title: 'Nginx',
        description: '反向代理入口、服务主页与站点调度。',
        status: 'Private',
        illustration: 'nginx'
    }
];

export default function SiteHeader({ className = '', opacity = 1, activePage = 'home', linkPrefix = '', onAgentClick, agentActive = false, onNavigate, runtimeConfig }) {
    const headerRef = useRef(null);
    const dockToggleRef = useRef(null);
    const [dockOpen, setDockOpen] = useState(false);
    const [dockConfig, setDockConfig] = useState(undefined);

    useEffect(() => {
        if (!dockOpen) return;
        function closeOnEscape(event) {
            if (event.key !== 'Escape') return;
            setDockOpen(false);
            dockToggleRef.current?.focus();
        }
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [dockOpen]);

    useEffect(() => {
        if (!dockOpen || runtimeConfig !== undefined || dockConfig !== undefined) return;
        let active = true;
        fetchSiteConfig(linkPrefix + 'agent-config.json').then(config => {
            if (active) setDockConfig(config);
        });
        return () => { active = false; };
    }, [dockOpen, runtimeConfig, dockConfig, linkPrefix]);

    const config = runtimeConfig === undefined ? dockConfig : runtimeConfig;
    const serviceLinks = config?.services || config?.homelab || {};

    const navigate = (event, href) => onNavigate?.(event, href);
    const pageHref = path => `${linkPrefix}${path}`;
    return (
        <>
            <button className={`private-bar-backdrop ${dockOpen ? 'is-visible' : ''}`} type="button"
                aria-label="关闭 Private Bar" tabIndex={-1} aria-hidden={!dockOpen}
                onClick={() => setDockOpen(false)} />
            <HeaderGlassLens headerRef={headerRef} />
            <header ref={headerRef} id="header" className={`site-header ${className}${dockOpen ? ' is-private-open' : ''}`} style={{ opacity }}>
                <div className="site-header-inner">
                    <div className="site-brand">{activePage === 'home' ? 'Chen.のhomepage' : <a href={pageHref('index.html')} onClick={event => navigate(event, pageHref('index.html'))}>Chen.のhomepage</a>}</div>
                    <button ref={dockToggleRef} className={`private-dock-toggle ${dockOpen ? 'is-active' : ''}`} type="button"
                        aria-expanded={dockOpen} aria-controls="private-bar-panel" onClick={() => setDockOpen(open => !open)}>
                        <span>{dockOpen ? 'Private Bar' : 'Private Dock'}</span><span aria-hidden="true">{dockOpen ? '×' : '⌄'}</span>
                    </button>
                    <nav className="site-nav" aria-label="主导航">
                        {onAgentClick ? (
                            <button className={`nav-btn nav-btn-button nav-icon-btn ${agentActive ? 'is-active' : ''}`} type="button" aria-label="Agent" title="Agent" onClick={onAgentClick}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 3v3M9 3h6M8 13h.01M16 13h.01M9 17h6"/></svg>
                            </button>
                        ) : (
                            <a href={pageHref('index.html#agent')} className="nav-btn nav-icon-btn" aria-label="Agent" title="Agent" onClick={event => navigate(event, pageHref('index.html#agent'))}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 3v3M9 3h6M8 13h.01M16 13h.01M9 17h6"/></svg>
                            </a>
                        )}
                        <a href={pageHref('gallery.html')} className={`nav-btn nav-icon-btn ${activePage === 'gallery' ? 'is-active' : ''}`} aria-current={activePage === 'gallery' ? 'page' : undefined} aria-label="光影留痕" title="光影留痕" onClick={event => navigate(event, pageHref('gallery.html'))}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h4l2-2h4l2 2h4v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
                        </a>
                        <a href={pageHref('docs/changelog.html')} className={`nav-btn nav-icon-btn ${activePage === 'changelog' ? 'is-active' : ''}`} aria-current={activePage === 'changelog' ? 'page' : undefined} aria-label="更新日志" title="更新日志" onClick={event => navigate(event, pageHref('docs/changelog.html'))}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/></svg>
                        </a>
                        <a href="https://bamb0ochen.com/notes/" className="nav-btn nav-icon-btn" target="_blank" rel="noopener noreferrer" aria-label="大图书馆" title="大图书馆">
                            <img src={NOTES_NAV_ICON} alt="" aria-hidden="true" />
                        </a>
                    </nav>
                </div>
                <div id="private-bar-panel" className="private-bar-panel" aria-hidden={!dockOpen}>
                    <div className="private-bar-heading">
                        <div><p className="section-kicker">Homelab</p><h2>Private Bar</h2></div>
                        <p>服务入口由运行时配置接管，不在页面暴露内部地址。</p>
                    </div>
                    <div className="server-service-grid">
                        {SERVER_SERVICES.map(service => {
                            const serviceHref = String(serviceLinks[service.configKey] || '').trim();
                            return (
                                <a key={service.id} className={`server-service-card server-service-card--${service.illustration} ${serviceHref ? '' : 'is-disabled'}`} href={serviceHref || undefined} target={serviceHref ? '_blank' : undefined} rel={serviceHref ? 'noopener noreferrer' : undefined} aria-disabled={!serviceHref} tabIndex={dockOpen && serviceHref ? 0 : -1} onClick={event => !serviceHref && event.preventDefault()}>
                                    <div className="server-card-topline"><span>{service.label}</span><span>{service.status}</span></div>
                                    <div className="server-illustration" aria-hidden="true"><span className="server-ill-main"></span><span className="server-ill-accent"></span><span className="server-ill-dot"></span></div>
                                    <div className="server-card-content"><h3>{service.title}</h3><p>{service.description}</p><span className="server-card-link">{serviceHref ? 'Open private route' : 'Configure route'}</span></div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </header>
        </>
    );
}
