import { useMemo, useState } from 'react';
import { getRecord, requestAIPlanSuggestions, saveRecordData } from '../data/siteData';
import '../styles/records-page.css';

function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getRecordState(date) {
    const data = getRecord(getDateString(date));
    return {
        keywords: [...(data.keywords || [])],
        todayDone: data.today_done || '',
        insights: data.insights || '',
        tomorrowPlans: [...(data.tomorrow_plan || [])],
        todos: (data.todos || []).map(todo => ({ ...todo }))
    };
}

function generatePlanSuggestions(todayDoneText) {
    const suggestions = [];
    if (todayDoneText.includes('会议') || todayDoneText.includes('讨论')) suggestions.push('整理会议要点和行动项');
    if (todayDoneText.includes('代码') || todayDoneText.includes('开发')) suggestions.push('复审代码并完成单元测试');
    if (todayDoneText.includes('学习')) suggestions.push('复习今天学习的内容');
    if (todayDoneText.includes('阅读')) suggestions.push('总结阅读笔记');
    suggestions.push('计划明天的重点任务');
    suggestions.push('检查邮件和待办事项');
    suggestions.push('准备明天的会议');
    return suggestions.slice(0, 5);
}

export default function RecordsPage() {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [recordState, setRecordState] = useState(() => getRecordState(new Date()));
    const [keywordInput, setKeywordInput] = useState('');
    const [tomorrowInput, setTomorrowInput] = useState('');
    const [todoInput, setTodoInput] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionSource, setSuggestionSource] = useState('');

    const currentDateText = useMemo(() => {
        const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDate.getDay()];
        return `📅 ${getDateString(currentDate)} (${weekday})`;
    }, [currentDate]);

    function loadDate(date) {
        setCurrentDate(date);
        setRecordState(getRecordState(date));
        setShowSuggestions(false);
    }

    function goToToday() {
        loadDate(new Date());
    }

    function previousDay() {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() - 1);
        loadDate(nextDate);
    }

    function nextDay() {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        loadDate(nextDate);
    }

    function saveRecord() {
        const dateStr = getDateString(currentDate);
        saveRecordData(dateStr, {
            date: dateStr,
            keywords: recordState.keywords,
            today_done: recordState.todayDone,
            tomorrow_plan: recordState.tomorrowPlans,
            insights: recordState.insights,
            todos: recordState.todos
        });
        alert('✅ 保存成功！');
    }

    function addKeyword() {
        const value = keywordInput.trim();
        if (!value) return;
        setRecordState(state => ({ ...state, keywords: [...state.keywords, value] }));
        setKeywordInput('');
    }

    function addTomorrowPlan() {
        const value = tomorrowInput.trim();
        if (!value) return;
        setRecordState(state => ({ ...state, tomorrowPlans: [...state.tomorrowPlans, value] }));
        setTomorrowInput('');
    }

    function addTodo() {
        const value = todoInput.trim();
        if (!value) return;
        setRecordState(state => ({ ...state, todos: [...state.todos, { text: value, completed: false }] }));
        setTodoInput('');
    }

    async function suggestPlans() {
        if (!recordState.todayDone.trim()) {
            alert('请先填写今天做了什么，AI才能给出建议！');
            return;
        }
        setIsSuggesting(true);
        setSuggestionSource('');
        try {
            const remoteSuggestions = await requestAIPlanSuggestions({
                date: getDateString(currentDate),
                keywords: recordState.keywords,
                todayDone: recordState.todayDone,
                tomorrowPlan: recordState.tomorrowPlans,
                insights: recordState.insights,
                todos: recordState.todos
            });
            if (remoteSuggestions.length > 0) {
                setAiSuggestions(remoteSuggestions);
                setSuggestionSource('来自已配置的 AI 接口');
            } else {
                setAiSuggestions(generatePlanSuggestions(recordState.todayDone));
                setSuggestionSource('当前未启用远程 AI，使用本地规则建议');
            }
        } catch (e) {
            console.error('AI suggestions failed:', e);
            setAiSuggestions(generatePlanSuggestions(recordState.todayDone));
            setSuggestionSource('AI 接口暂不可用，已回退到本地规则建议');
        } finally {
            setShowSuggestions(true);
            setIsSuggesting(false);
        }
    }

    function exportRecord() {
        const dateStr = getDateString(currentDate);
        const data = getRecord(dateStr);
        let text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 每日记录 - ${data.date}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (data.keywords && data.keywords.length > 0) text += `🏷️ 关键词: ${data.keywords.join(', ')}\n\n`;
        text += `✅ 今天做了什么\n${data.today_done || ''}\n\n📝 明天打算做\n`;
        (data.tomorrow_plan || []).forEach((plan, i) => {
            text += `  ${i + 1}. ${plan}\n`;
        });
        if (data.insights) text += `\n📎 感悟:\n${data.insights}\n`;
        text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `record_${dateStr}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <header id="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 1100, justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>Chen.のhomepage</div>
                    <div>
                        <a href="index.html" className="nav-btn">返回首页</a>
                        <a href="https://Bamb0oChen.github.io/notes/" className="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                    </div>
                </div>
            </header>

            <section className="records-hero">
                <h1>📝 每日记录（独立页面）</h1>
            </section>

            <div className="daily-record-container">
                <div className="date-display">
                    <span>{currentDateText}</span>
                    <button className="btn btn-warning" onClick={goToToday}>📅 今天</button>
                    <button className="btn btn-primary" onClick={previousDay}>⟶ 前一天</button>
                    <button className="btn btn-primary" onClick={nextDay}>后一天 ⟶</button>
                </div>

                <div className="btn-group">
                    <button className="btn btn-success" onClick={saveRecord}>💾 保存</button>
                    <button className="btn btn-primary" onClick={exportRecord}>📜 导出纯文本</button>
                </div>

                <div className="section-title">🏷️ 关键词（可选）</div>
                <div className="input-group">
                    <input type="text" value={keywordInput} placeholder="输入关键词，按回车添加" onChange={event => setKeywordInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && (event.preventDefault(), addKeyword())} />
                    <button className="btn btn-primary" onClick={addKeyword}>添加</button>
                </div>
                <div className="keywords-container">
                    {recordState.keywords.map((keyword, index) => (
                        <div key={keyword + index} className="keyword-tag">
                            {keyword} <button onClick={() => setRecordState(state => ({ ...state, keywords: state.keywords.filter((_, i) => i !== index) }))}>✖</button>
                        </div>
                    ))}
                </div>

                <div className="section-title">✅ 今天做了什么</div>
                <textarea value={recordState.todayDone} placeholder="记录今天完成的事项.." onChange={event => setRecordState(state => ({ ...state, todayDone: event.target.value }))}></textarea>

                <div className="section-title">📝 明天打算做</div>
                <div className="input-group">
                    <input type="text" value={tomorrowInput} placeholder="输入明天的计划，按回车添加" onChange={event => setTomorrowInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && (event.preventDefault(), addTomorrowPlan())} />
                    <button className="btn btn-primary" onClick={addTomorrowPlan}>添加</button>
                    <button className="btn btn-primary" onClick={suggestPlans} disabled={isSuggesting}>{isSuggesting ? '生成中...' : '🤖 AI建议'}</button>
                </div>
                <ul className="tomorrow-list">
                    {recordState.tomorrowPlans.map((plan, index) => (
                        <li key={plan + index} className="tomorrow-item">
                            <div className="tomorrow-text">{plan}</div>
                            <button className="btn-remove" onClick={() => setRecordState(state => ({ ...state, tomorrowPlans: state.tomorrowPlans.filter((_, i) => i !== index) }))}>删除</button>
                        </li>
                    ))}
                </ul>
                {showSuggestions && (
                    <div className="ai-suggestions">
                        <h4>AI建议的明天计划：</h4>
                        {suggestionSource && <p className="ai-source">{suggestionSource}</p>}
                        <ul className="ai-suggestions-list">
                            {aiSuggestions.map((suggestion, index) => (
                                <li key={suggestion + index}>
                                    <span onClick={() => {
                                        setRecordState(state => ({ ...state, tomorrowPlans: [...state.tomorrowPlans, suggestion] }));
                                        setShowSuggestions(false);
                                    }} style={{ cursor: 'pointer', color: '#28a745', fontWeight: 'bold' }}>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="section-title">🧾 待办清单 (To-Do List)</div>
                <div className="input-group">
                    <input type="text" value={todoInput} placeholder="添加待办项目" onChange={event => setTodoInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && (event.preventDefault(), addTodo())} />
                    <button className="btn btn-primary" onClick={addTodo}>添加</button>
                </div>
                <ul className="todo-list">
                    {recordState.todos.map((todo, index) => (
                        <li key={todo.text + index} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                            <input type="checkbox" checked={todo.completed} onChange={event => setRecordState(state => ({
                                ...state,
                                todos: state.todos.map((item, i) => i === index ? { ...item, completed: event.target.checked } : item)
                            }))} />
                            <div className="todo-text">{todo.text}</div>
                            <button className="btn-remove" onClick={() => setRecordState(state => ({ ...state, todos: state.todos.filter((_, i) => i !== index) }))}>删除</button>
                        </li>
                    ))}
                </ul>

                <div className="section-title">📎 感悟（可选）</div>
                <textarea value={recordState.insights} placeholder="记录今天的感悟、思考或反思.." onChange={event => setRecordState(state => ({ ...state, insights: event.target.value }))}></textarea>

                <div className="btn-group" style={{ marginTop: 30 }}>
                    <button className="btn btn-success" onClick={saveRecord}>💾 保存所有修改</button>
                    <button className="btn btn-primary" onClick={exportRecord}>📜 导出为纯文本</button>
                </div>
            </div>
        </div>
    );
}
