// map/map.js
// Глобус із 8 хотспотами — по одному на стадію.
//
// Хотспоти малюються з коду, а не зашиті в HTML: їхній вигляд залежить
// від прогресу (заблокована / доступна / зірки / бос переможений).
//
// Тему (градієнтний фон) тут більше не чіпаємо — це робить shared/main.js
// через свій onSnapshot. Раніше map.js читав кольори з localStorage, куди
// їх ніхто не писав, тож фон на карті просто не працював.

import { summarizeAllStages } from '../core/rules.js';
import { subscribeProgress, getLocalProgress } from '../core/progressStore.js';

// Точки на поверхні глобуса (формат model-viewer: меш, приміт., 3 вершини
// трикутника + барицентричні ваги). Задані вручну в редакторі model-viewer;
// підправити розташування можна там само.
const SURFACES = [
    '0 1 235 363 230 0.007 0.882 0.111',
    '0 3 3807 3822 3824 1.825 -5.213 4.388',
    '0 1 181 178 383 1.458 -0.146 -0.312',
    '0 2 38 33 60 0.188 0.153 0.660',
    '0 1 217 389 211 0.290 0.609 0.101',
    '0 1 438 444 431 0.713 -0.150 0.438',
    '0 1 321 292 299 0.858 0.737 -0.595',
    '0 1 181 178 383 0.34 0.33 0.33'
];

const modelViewer = document.querySelector('model-viewer');

function goToStage(stage) {
    window.location.href = `../stage/stage.html?stage=${stage}`;
}

// Визначає вигляд однієї точки за станом стадії.
function hotspotLook(info) {
    if (info.bossDefeated) return { cls: 'done',       dot: info.stage, badge: '🏆' };
    if (!info.unlocked)    return { cls: 'locked',     dot: '🔒',       badge: '' };
    if (info.bossUnlocked) return { cls: 'boss-ready', dot: info.stage, badge: '⚔' };
    return { cls: 'available', dot: info.stage, badge: `★${info.earnedStars}` };
}

function renderHotspots(progress) {
    // Прибираємо попередні перед перемальовуванням (прогрес міг оновитись).
    modelViewer.querySelectorAll('.hs').forEach((el) => el.remove());

    summarizeAllStages(progress).forEach((info, i) => {
        const look = hotspotLook(info);

        const btn = document.createElement('button');
        btn.className = `hs ${look.cls}`;
        btn.slot = `hotspot-stage-${info.stage}`;
        btn.dataset.surface = SURFACES[i];
        btn.dataset.visibilityAttribute = 'visible';   // ховати точки на зворотному боці глобуса

        btn.innerHTML =
            `<span class="hs-dot">${look.dot}</span>` +
            (look.badge ? `<span class="hs-badge">${look.badge}</span>` : '');

        // Заблоковану стадію теж пускаємо — екран стадії сам покаже,
        // що вона закрита, і чому.
        btn.addEventListener('click', () => goToStage(info.stage));

        modelViewer.appendChild(btn);
    });
}

// Одразу малюємо з наявним кешованим прогресом, а далі
// підписуємось на живий прогрес — точки на глобусі завжди відображають
// поточний стан і оновлюються самі (як і екран стадії).
const cachedUid = (typeof localStorage !== 'undefined' && localStorage.getItem('istoriya_last_uid')) || null;
const initialProgress = getLocalProgress(cachedUid) || getLocalProgress('guest') || null;
renderHotspots(initialProgress);

if (window.limboReady) {
    window.limboReady.then((r) => {
        const uid = r?.uid ?? cachedUid;
        if (!uid) {
            renderHotspots(r?.progress ?? initialProgress);
            return;
        }
        subscribeProgress(uid, (progress) => renderHotspots(progress));
    });
}
