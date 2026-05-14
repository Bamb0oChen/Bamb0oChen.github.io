<template>
    <div>
        <header id="header">
            <div style="display:flex; align-items:center; gap:12px; width:100%; max-width:1100px; justify-content:space-between;">
                <div style="font-weight:bold; font-size:18px;">Chen.のhomepage</div>
                <div>
                    <a href="index.html" class="nav-btn">返回首页</a>
                    <a href="https://Bamb0oChen.github.io/notes/" class="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                </div>
            </div>
        </header>

        <section class="hero">
            <h1>📝 每日记录（独立页面）</h1>
        </section>

        <div class="daily-record-container">
            <div class="date-display">
                <span>{{ currentDateText }}</span>
                <button class="btn btn-warning" @click="goToToday">📅 今天</button>
                <button class="btn btn-primary" @click="previousDay">⟶ 前一天</button>
                <button class="btn btn-primary" @click="nextDay">后一天 ⟶</button>
            </div>

            <div class="btn-group">
                <button class="btn btn-success" @click="saveRecord">💾 保存</button>
                <button class="btn btn-primary" @click="exportRecord">📜 导出纯文本</button>
            </div>

            <div class="section-title">🏷️ 关键词（可选）</div>
            <div class="input-group">
                <input type="text" v-model.trim="keywordInput" placeholder="输入关键词，按回车添加" @keypress.enter.prevent="addKeyword">
                <button class="btn btn-primary" @click="addKeyword">添加</button>
            </div>
            <div class="keywords-container">
                <div v-for="(keyword, index) in keywords" :key="keyword + index" class="keyword-tag">
                    {{ keyword }} <button @click="removeKeyword(index)">✖</button>
                </div>
            </div>

            <div class="section-title">✅ 今天做了什么</div>
            <textarea v-model="todayDone" placeholder="记录今天完成的事项.."></textarea>

            <div class="section-title">📝 明天打算做</div>
            <div class="input-group">
                <input type="text" v-model.trim="tomorrowInput" placeholder="输入明天的计划，按回车添加" @keypress.enter.prevent="addTomorrowPlan">
                <button class="btn btn-primary" @click="addTomorrowPlan">添加</button>
                <button class="btn btn-primary" @click="suggestPlans">🤖 AI建议</button>
            </div>
            <ul class="tomorrow-list">
                <li v-for="(plan, index) in tomorrowPlans" :key="plan + index" class="tomorrow-item">
                    <div class="tomorrow-text">{{ plan }}</div>
                    <button class="btn-remove" @click="removeTomorrowPlan(index)">删除</button>
                </li>
            </ul>
            <div class="ai-suggestions" v-if="showSuggestions">
                <h4>AI建议的明天计划：</h4>
                <ul class="ai-suggestions-list">
                    <li v-for="(suggestion, index) in aiSuggestions" :key="suggestion + index">
                        <span @click="applySuggestion(suggestion)" style="cursor:pointer; color:#28a745; font-weight:bold;">{{ suggestion }}</span>
                    </li>
                </ul>
            </div>

            <div class="section-title">🧾 待办清单 (To-Do List)</div>
            <div class="input-group">
                <input type="text" v-model.trim="todoInput" placeholder="添加待办项目" @keypress.enter.prevent="addTodo">
                <button class="btn btn-primary" @click="addTodo">添加</button>
            </div>
            <ul class="todo-list">
                <li v-for="(todo, index) in todos" :key="todo.text + index" class="todo-item" :class="{ completed: todo.completed }">
                    <input type="checkbox" v-model="todo.completed" />
                    <div class="todo-text">{{ todo.text }}</div>
                    <button class="btn-remove" @click="removeTodo(index)">删除</button>
                </li>
            </ul>

            <div class="section-title">📎 感悟（可选）</div>
            <textarea v-model="insights" placeholder="记录今天的感悟、思考或反思.."></textarea>

            <div class="btn-group" style="margin-top: 30px;">
                <button class="btn btn-success" @click="saveRecord">💾 保存所有修改</button>
                <button class="btn btn-primary" @click="exportRecord">📜 导出为纯文本</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getRecord, saveRecordData } from '../data/siteData';

const currentDate = ref(new Date());
const keywordInput = ref('');
const tomorrowInput = ref('');
const todoInput = ref('');
const todayDone = ref('');
const insights = ref('');
const keywords = ref([]);
const tomorrowPlans = ref([]);
const todos = ref([]);
const aiSuggestions = ref([]);
const showSuggestions = ref(false);

const currentDateText = computed(() => {
    const dateStr = getDateString();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDate.value.getDay()];
    return `📅 ${dateStr} (${weekday})`;
});

function getDateString() {
    const year = currentDate.value.getFullYear();
    const month = String(currentDate.value.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadRecord() {
    const dateStr = getDateString();
    const data = getRecord(dateStr);

    keywords.value = [...(data.keywords || [])];
    todayDone.value = data.today_done || '';
    insights.value = data.insights || '';
    tomorrowPlans.value = [...(data.tomorrow_plan || [])];
    todos.value = (data.todos || []).map(todo => ({ ...todo }));
}

function goToToday() {
    currentDate.value = new Date();
    loadRecord();
}

function previousDay() {
    const nextDate = new Date(currentDate.value);
    nextDate.setDate(nextDate.getDate() - 1);
    currentDate.value = nextDate;
    loadRecord();
}

function nextDay() {
    const nextDate = new Date(currentDate.value);
    nextDate.setDate(nextDate.getDate() + 1);
    currentDate.value = nextDate;
    loadRecord();
}

function saveRecord() {
    const dateStr = getDateString();
    const data = {
        date: dateStr,
        keywords: keywords.value,
        today_done: todayDone.value,
        tomorrow_plan: tomorrowPlans.value,
        insights: insights.value,
        todos: todos.value
    };

    saveRecordData(dateStr, data);
    alert('✅ 保存成功！');
}

function addKeyword() {
    if (keywordInput.value.trim()) {
        keywords.value.push(keywordInput.value.trim());
        keywordInput.value = '';
    }
}

function removeKeyword(index) {
    keywords.value.splice(index, 1);
}

function addTomorrowPlan() {
    if (tomorrowInput.value.trim()) {
        tomorrowPlans.value.push(tomorrowInput.value.trim());
        tomorrowInput.value = '';
    }
}

function removeTomorrowPlan(index) {
    tomorrowPlans.value.splice(index, 1);
}

function suggestPlans() {
    if (!todayDone.value.trim()) {
        alert('请先填写今天做了什么，AI才能给出建议！');
        return;
    }

    aiSuggestions.value = generatePlanSuggestions(todayDone.value);
    showSuggestions.value = true;
}

function applySuggestion(text) {
    tomorrowPlans.value.push(text);
    showSuggestions.value = false;
}

function addTodo() {
    if (todoInput.value.trim()) {
        todos.value.push({ text: todoInput.value.trim(), completed: false });
        todoInput.value = '';
    }
}

function removeTodo(index) {
    todos.value.splice(index, 1);
}

function generatePlanSuggestions(todayDoneText) {
    const suggestions = [];

    if (todayDoneText.includes('会议') || todayDoneText.includes('讨论')) {
        suggestions.push('整理会议要点和行动项');
    }
    if (todayDoneText.includes('代码') || todayDoneText.includes('开发')) {
        suggestions.push('复审代码并完成单元测试');
    }
    if (todayDoneText.includes('学习')) {
        suggestions.push('复习今天学习的内容');
    }
    if (todayDoneText.includes('阅读')) {
        suggestions.push('总结阅读笔记');
    }

    suggestions.push('计划明天的重点任务');
    suggestions.push('检查邮件和待办事项');
    suggestions.push('准备明天的会议');

    return suggestions.slice(0, 5);
}

function exportRecord() {
    const dateStr = getDateString();
    const data = getRecord(dateStr);

    let text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 每日记录 - ${data.date}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (data.keywords && data.keywords.length > 0) {
        text += `🏷️ 关键词: ${data.keywords.join(', ')}\n\n`;
    }

    text += `✅ 今天做了什么\n${data.today_done || ''}\n\n📝 明天打算做\n`;

    (data.tomorrow_plan || []).forEach((plan, i) => {
        text += `  ${i + 1}. ${plan}\n`;
    });

    if (data.insights) {
        text += `\n📎 感悟:\n${data.insights}\n`;
    }

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

goToToday();
</script>
