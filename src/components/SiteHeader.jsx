import './SiteHeader.css';

export const NOTES_NAV_ICON = 'https://bamb0ochen.com/notes/assets/images/patchouli-coding-white-outline.png';

export default function SiteHeader({ className = '', opacity = 1, activePage = 'home', linkPrefix = '', onAgentClick, agentActive = false, onNavigate, dockToggle, children }) {
    const navigate = (event, href) => onNavigate?.(event, href);
    const pageHref = path => `${linkPrefix}${path}`;
    return (
        <header id="header" className={className} style={{ opacity }}>
            <div className="site-header-inner">
                <div className="site-brand">{activePage === 'home' ? 'Chen.のhomepage' : <a href={pageHref('index.html')} onClick={event => navigate(event, pageHref('index.html'))}>Chen.のhomepage</a>}</div>
                {dockToggle}
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
            {children}
        </header>
    );
}
