// ==UserScript==
// @name         Video Site Time Limiter with Settings and Timer
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Limit daily browsing time on video sites with adjustable settings and timer
// @match        *://*.youtube.com/*
// @match        *://*.bilibili.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const storageKey = 'videoSiteTimeLimiter';
    const limitKey = 'videoSiteTimeLimit';
    let startTime;
    let timerInterval;

    function getToday() {
        return new Date().toDateString();
    }

    function getTimeSpent() {
        const data = JSON.parse(localStorage.getItem(storageKey)) || {};
        return data[getToday()] || 0;
    }

    function setTimeSpent(time) {
        const data = JSON.parse(localStorage.getItem(storageKey)) || {};
        data[getToday()] = time;
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    function getLimitMinutes() {
        return JSON.parse(localStorage.getItem(limitKey)) || 60;
    }

    function setLimitMinutes(minutes) {
        localStorage.setItem(limitKey, JSON.stringify(minutes));
    }

    function blockAccess() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => video.pause());

        // Rewrite the body and header
        document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 20%;">今日浏览时间已超过限制，请明天再来！</h1>';
        const header = document.querySelector('header');
        if (header) {
            header.innerHTML = '<h1 style="color: red; text-align: center;">今日浏览时间已超过限制，请明天再来！</h1>';
        }
    }

    function updateTimeSpent() {
        const currentTime = Date.now();
        const timeSpent = getTimeSpent() + (currentTime - startTime);
        if (timeSpent >= getLimitMinutes() * 60 * 1000) {
            blockAccess();
        } else {
            setTimeSpent(timeSpent);
            updateTimerDisplay(getLimitMinutes() * 60 * 1000 - timeSpent);
        }
        startTime = currentTime;
    }

    function updateTimerDisplay(timeRemaining) {
        const minutes = Math.floor(timeRemaining / (60 * 1000));
        const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
        timerDisplay.textContent = `剩余时间: ${minutes}分${seconds}秒`;
    }

    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        panel.style.border = '1px solid black';
        panel.style.padding = '10px';
        panel.style.zIndex = '1000';
        panel.style.borderRadius = '5px';

        const label = document.createElement('label');
        label.textContent = '每日限制时间（分钟）：';
        panel.appendChild(label);

        const input = document.createElement('input');
        input.type = 'number';
        input.value = getLimitMinutes();
        input.style.marginRight = '10px';
        panel.appendChild(input);

        const button = document.createElement('button');
        button.textContent = '保存';
        button.onclick = () => {
            const newLimit = parseInt(input.value, 10);
            const currentTimeSpent = getTimeSpent();
            const newLimitMilliseconds = newLimit * 60 * 1000;

            if (currentTimeSpent >= newLimitMilliseconds) {
                blockAccess();
            } else {
                setLimitMinutes(newLimit);
                updateTimerDisplay(newLimitMilliseconds - currentTimeSpent);
                alert('设置已保存！');
            }
        };
        panel.appendChild(button);

        timerDisplay = document.createElement('div');
        timerDisplay.style.marginTop = '10px';
        panel.appendChild(timerDisplay);

        document.body.appendChild(panel);

        updateTimerDisplay(getLimitMinutes() * 60 * 1000 - getTimeSpent());
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            startTime = Date.now();
            timerInterval = setInterval(updateTimeSpent, 1000);
        } else {
            clearInterval(timerInterval);
            if (startTime) {
                updateTimeSpent();
            }
        }
    }

    function resetTimeSpentIfNeeded() {
        const now = new Date();
        const resetHour = 18;
        const resetMinutes = 0;
        const resetMilliseconds = (resetHour * 60 + resetMinutes) * 60 * 1000;

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const currentMilliseconds = now.getTime() - startOfDay;

        if (currentMilliseconds >= resetMilliseconds) {
            const lastResetDate = JSON.parse(localStorage.getItem('lastResetDate')) || null;
            const todayDate = new Date().toDateString();

            if (lastResetDate !== todayDate) {
                localStorage.setItem(storageKey, JSON.stringify({}));
                localStorage.setItem('lastResetDate', JSON.stringify(todayDate));
            }
        }
    }

    let timerDisplay;

    resetTimeSpentIfNeeded();

    if (getTimeSpent() >= getLimitMinutes() * 60 * 1000) {
        blockAccess();
    } else {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        handleVisibilityChange(); // Initial call to set the timer if the page is already visible
        createSettingsPanel();
    }
})();
