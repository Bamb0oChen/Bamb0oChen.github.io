import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SiteHeader from './components/SiteHeader';
import { createVirtualFs, displayPath, HOME, runVirtualCommand, saveVirtualFile } from './utils/virtualTerminal';

const CHANGELOG = [
    ['2026-09-12', '笔记排版与字体更新', [
        '笔记站统一使用 Inter、思源黑体和 JetBrains Mono，字体随站点托管，中文按需分片加载。',
        '调整正文行距与标题层级，优化深浅主题下的引用和表格样式；代码块增加背景、边框和复制按钮，关闭代码连字。',
        '补充提示框、折叠块和任务列表支持，修复笔记链接与页内跳转；未完成的空白页暂不发布，保留原文内容。'
    ]],
    ['2026-03-14', '首页调整', ['加了友链；音乐换成 Apple Music 歌单；调整精选照片的排版。']],
    ['2026-03-01', '视频封面', ['先读取视频封面，取不到时使用备用图片。']],
    ['2026-02-28', '视频改用 B 站链接', ['首页加了视频卡片和悬浮预览，不再存放本地大视频文件。']],
    ['2026-02-13', '新增照片页', ['可以打开照片查看，并添加评注。']],
    ['2026-02-10', '新增文章列表', ['把几篇文章放到首页，以卡片展示。']],
    ['2026-02-08', '调整首页导航', ['去掉标签页，重新整理导航。']],
    ['2026-02-05', '样式修正', ['修了移动端布局和深色主题的样式。']]
];

const LOG_TEXT = CHANGELOG.map(([date, title, details]) => `${date}  ${title}\n${details.map(line => `  ${line}`).join('\n')}`).join('\n\n');

function ChangelogTerminal() {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState([]);
    const [viewer, setViewer] = useState(null);
    const [editorText, setEditorText] = useState('');
    const [fs, setFs] = useState(() => createVirtualFs(LOG_TEXT));
    const [warningOpen, setWarningOpen] = useState(false);
    const [cwd, setCwd] = useState(HOME);
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(null);
    const inputRef = useRef(null);
    const endRef = useRef(null);
    const startedAt = useRef(Date.now());

    useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [history]);

    function submit(event) {
        event.preventDefault();
        const value = command.trim();
        if (!value) return;
        const result = runVirtualCommand(value, { cwd, history: [...commandHistory, value], logText: LOG_TEXT, startedAt: startedAt.current, fs });
        if (result.clear) setHistory([]);
        else setHistory(previous => [...previous, { command: value, output: result.output, cwd: displayPath(cwd), error: result.error }]);
        setCommandHistory(previous => [...previous, value]);
        setHistoryIndex(null);
        setCommand('');
        setCwd(result.cwd);
        if (result.fs) setFs(result.fs);
        if (result.viewer) { setViewer(result.viewer); setEditorText(result.viewer.text); }
        if (result.blocked) setWarningOpen(true);
    }

    function saveEditor() {
        if (!viewer?.writable) { setWarningOpen(true); return; }
        const result = saveVirtualFile(fs, viewer.absolutePath, editorText);
        if (result.blocked) { setWarningOpen(true); return; }
        setFs(result.fs);
        setHistory(previous => [...previous, { command: `[saved ${viewer.path}]`, output: '', cwd: displayPath(cwd) }]);
    }

    function viewerKeydown(event) {
        if (event.key === 'Escape' || (event.key === 'q' && !viewer?.writable) || (event.ctrlKey && event.key.toLowerCase() === 'x')) {
            event.preventDefault();
            setViewer(null);
            inputRef.current?.focus();
        } else if (event.ctrlKey && event.key.toLowerCase() === 'o') {
            event.preventDefault();
            saveEditor();
        }
    }

    function inputKeydown(event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        if (!commandHistory.length) return;
        const next = event.key === 'ArrowUp'
            ? historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
            : historyIndex === null ? null : historyIndex + 1 >= commandHistory.length ? null : historyIndex + 1;
        setHistoryIndex(next);
        setCommand(next === null ? '' : commandHistory[next]);
    }

    return (
        <section className="terminal" aria-label="更新日志终端" onClick={() => !viewer && inputRef.current?.focus()}>
            <div className="terminal-bar" aria-hidden="true"><span className="terminal-dots"><i /><i /><i /></span><span className="terminal-title">changelog.log — terminal</span></div>
            <div className="terminal-body">
                <div role="log" aria-live="polite">
                    {history.map((item, index) => <div key={index}>
                        <p className="terminal-line terminal-command"><span className="terminal-prompt">visitor@homepage:{item.cwd}$ </span>{item.command}</p>
                        {item.output && <pre className={`terminal-log ${item.error ? 'terminal-error' : ''}`}>{item.output}</pre>}
                    </div>)}
                </div>
                <form className="terminal-input-row" onSubmit={submit}>
                    <label className="terminal-prompt" htmlFor="terminal-command">visitor@homepage:{displayPath(cwd)}$</label>
                    <input id="terminal-command" className="terminal-input" ref={inputRef} value={command} onChange={event => { setCommand(event.target.value); setHistoryIndex(null); }} onKeyDown={inputKeydown} autoComplete="off" spellCheck="false" aria-label="终端命令" />
                </form>
                <div ref={endRef} />
            </div>
            {viewer && <div className="terminal-overlay" role="dialog" aria-modal="true" aria-label={`${viewer.name} ${viewer.path || ''}`} onKeyDown={viewerKeydown}>
                <div className="nano-header">{viewer.name} · {viewer.path || 'virtual process'} <span>[{viewer.writable ? '仅当前页面可编辑' : '只读模拟'}]</span></div>
                <textarea className="nano-content" value={editorText} onChange={event => setEditorText(event.target.value)} readOnly={!viewer.writable} aria-label="虚拟文件内容" autoFocus />
                <div className="nano-footer">{['nano', 'vim', 'vi'].includes(viewer.name) && <button type="button" onClick={saveEditor}>^O 写入</button>}<button type="button" onClick={() => { setViewer(null); inputRef.current?.focus(); }}>退出 Esc / q</button></div>
            </div>}
            {warningOpen && <div className="terminal-warning-backdrop" role="presentation" onClick={() => setWarningOpen(false)}>
                <div className="terminal-warning" role="alertdialog" aria-modal="true" aria-label="禁止修改" onClick={event => event.stopPropagation()}>
                    <pre aria-hidden="true">{'  /\\_/\\\n ( •_• )\n / >📁'}</pre>
                    <strong>What RU doing!</strong>
                    <p>只能修改 test/；真实系统命令不会执行。</p>
                    <button type="button" onClick={() => { setWarningOpen(false); if (!viewer) inputRef.current?.focus(); }}>知道了</button>
                </div>
            </div>}
        </section>
    );
}

createRoot(document.getElementById('header-root')).render(
    <SiteHeader activePage="changelog" linkPrefix="../" />
);

createRoot(document.getElementById('terminal-root')).render(<ChangelogTerminal />);
