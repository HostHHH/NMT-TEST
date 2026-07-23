// game/bonus.js
// Нараховує бонусні зірки за активний час у міні-грі.
//
// game.js — класичний скрипт і не вміє import, тож він лише виставляє
// прапорець window.__gameActive (true під час гри). Цей модуль його читає.
//
// Курс і денний ліміт живуть у config.js, а перетворення часу в зірки —
// у recordPlaytime (progressStore.js). Тут лише лічильник і скидання.

import { recordPlaytime } from '../core/progressStore.js';
import { BONUS } from '../core/config.js';

let uid = null;
let pendingSeconds = 0;

if (window.limboReady) {
    window.limboReady.then((r) => { uid = r?.uid ?? null; });
}

// +1 за кожну секунду активної гри. Пауза, коли вкладка неактивна —
// щоб залишена у фоні гра не накручувала час.
setInterval(() => {
    if (window.__gameActive && !document.hidden) pendingSeconds++;
}, 1000);

// Раз на хвилину скидаємо накопичене у Firestore одним записом.
setInterval(flush, BONUS.HEARTBEAT_MS);

async function flush() {
    if (!uid || pendingSeconds === 0) return;

    const secs = pendingSeconds;
    pendingSeconds = 0;

    try {
        const res = await recordPlaytime(uid, secs);
        if (res.starsGranted > 0) toast(`+${res.starsGranted} ★ бонус`);
    } catch (error) {
        console.error('Не вдалося зарахувати час гри:', error);
        pendingSeconds += secs;   // повернемо, спробуємо наступного разу
    }
}

// Проста спливашка: єдиний спосіб для гравця дізнатися, що зірка нарахована.
function toast(text) {
    const el = document.createElement('div');
    el.className = 'bonus-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}
