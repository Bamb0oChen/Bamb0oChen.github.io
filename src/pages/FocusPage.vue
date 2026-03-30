<template>
    <div>
        <header id="header">
            <div style="display:flex; align-items:center; gap:12px; width:100%; max-width:1100px; justify-content:space-between;">
                <div style="font-weight:bold; font-size:18px;">Chen.のhomepage</div>
                <div>
                    <a href="index.html" class="nav-btn">返回首页</a>
                    <a href="records.html" class="nav-btn">进入记录页</a>
                    <a href="https://yanzhuchen0901.github.io/notes/" class="nav-btn" target="_blank" rel="noopener noreferrer">笔记</a>
                </div>
            </div>
        </header>

        <section class="hero focus-hero">
            <div class="focus-overlay"></div>

            <div class="focus-button-wrapper">
                <div class="focus-timer-display" :class="{ active: isTimerActive }">
                    <div class="timer-text">{{ timerText }}</div>
                </div>

                <button class="focus-btn" :class="{ active: isTimerActive, timing: isTimerRunning }" @click="toggleFocusTimer">
                    <span class="btn-text">开始你的专注之旅</span>
                </button>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { getRecord, saveRecordData } from '../data/siteData';

const focusSeconds = ref(0);
const isTimerRunning = ref(false);
const isTimerActive = ref(false);
const currentFocusTask = ref('');
let focusTimer = null;

const timerText = computed(() => {
    const minutes = Math.floor(focusSeconds.value / 60);
    const seconds = focusSeconds.value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

function startOrResumeFocusTimer() {
    if (isTimerRunning.value) return;

    isTimerRunning.value = true;
    focusTimer = setInterval(() => {
        focusSeconds.value += 1;
    }, 1000);
}

function pauseFocusTimer() {
    if (focusTimer) {
        clearInterval(focusTimer);
    }
    isTimerRunning.value = false;
}

function resetFocusTimer() {
    if (focusTimer) {
        clearInterval(focusTimer);
    }

    focusSeconds.value = 0;
    isTimerRunning.value = false;
    isTimerActive.value = false;
}

function completeFocusSession() {
    const duration = Math.round(focusSeconds.value / 60);

    if (duration === 0) {
        alert('最少需要专注1分钟才能记录');
        resetFocusTimer();
        return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const record = getRecord(dateStr);
    if (!record.focus_sessions) {
        record.focus_sessions = [];
    }

    record.focus_sessions.push({
        task: currentFocusTask.value,
        duration: duration,
        timestamp: new Date().toLocaleTimeString()
    });

    saveRecordData(dateStr, record);

    alert(`✅ 专注完成！\n任务：${currentFocusTask.value}\n时长：${duration}分钟\n📁 记录已保存到今日记录`);

    resetFocusTimer();
}

function toggleFocusTimer() {
    if (!isTimerActive.value) {
        const taskInput = prompt('输入本次专注的任务：', '工作专注');
        if (taskInput === null) return;

        currentFocusTask.value = taskInput || '专注工作';
        focusSeconds.value = 0;
        isTimerActive.value = true;

        startOrResumeFocusTimer();
    } else if (isTimerRunning.value) {
        pauseFocusTimer();
        completeFocusSession();
    }
}

function handleKeydown(e) {
    if (e.key === 'Escape' && isTimerActive.value) {
        if (confirm('确定要退出计时吗？')) {
            resetFocusTimer();
        }
    }
}

window.addEventListener('keydown', handleKeydown);

onBeforeUnmount(() => {
    if (focusTimer) {
        clearInterval(focusTimer);
    }
    window.removeEventListener('keydown', handleKeydown);
});
</script>
