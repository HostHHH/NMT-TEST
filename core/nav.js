// core/nav.js
// Маршрутизація між сторінками.
//
// Замінює дубльовані goToMap/goToDef, які досі існували у двох копіях —
// у shared/defFunc.js і в shared/main.js.
//
// Дві проблеми старого підходу:
//   1. Шлях будувався перевірками виду pathname.includes('/home/'),
//      розкиданими по файлах. Додати новий екран означало правити
//      кожну таку перевірку.
//   2. Не було способу передати контекст. map.js викликав Level() без
//      аргументів, і сторінка тесту не знала, яку стадію відкривати.
//
// Тут глибина сторінки визначається один раз, а параметри передаються
// через URL (?stage=3&level=2) — їх видно в адресному рядку, вони
// переживають перезавантаження і не залипають між сесіями, як це було б
// із localStorage.
//
// Функції розбору URL чисті: приймають рядок, а не читають window.
// Завдяки цьому модуль імпортується в Node і покритий тестами.

import {
    ROUTES,
    TOTAL_STAGES,
    NORMAL_LEVELS_PER_STAGE,
    BOSS_LEVEL
} from './config.js';

// Теки верхнього рівня беремо з самих маршрутів, щоб не тримати
// другий список, який доведеться синхронізувати вручну.
const KNOWN_DIRS = new Set(
    Object.values(ROUTES).map(route => route.split('/')[0])
);

// ── Чисті функції ────────────────────────────────────────────────────

// Скільки '../' потрібно, щоб дістатися кореня проєкту.
//
// Усі сторінки лежать або в корені, або рівно на один рівень углиб,
// тож достатньо з'ясувати, чи ми всередині відомої теки. Такий спосіб
// не залежить від того, звідки роздається сайт: працює і на
// example.com/home/, і на user.github.io/limbo/home/.
export function resolveRootPrefix(pathname) {
    const segments = String(pathname || '').split('/').filter(Boolean);

    // Сегмент із крапкою — це ім'я файлу, а не тека.
    const dirs = segments.filter(segment => !segment.includes('.'));

    return dirs.some(dir => KNOWN_DIRS.has(dir)) ? '../' : '';
}

// Збирає посилання на сторінку з параметрами запиту.
export function buildUrl(route, params = {}, pathname = '') {
    const prefix = resolveRootPrefix(pathname);

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) search.set(key, String(value));
    }

    const query = search.toString();
    return prefix + route + (query ? '?' + query : '');
}

// Читає ?stage= з рядка запиту. Повертає null, якщо параметра немає
// або він поза межами — сторінка сама вирішує, що робити з null
// (зазвичай відправити на карту).
export function parseStage(search) {
    const raw = new URLSearchParams(search || '').get('stage');
    const value = Number(raw);

    if (raw === null || raw === '' || !Number.isInteger(value)) return null;
    if (value < 1 || value > TOTAL_STAGES) return null;

    return value;
}

// Читає ?level=. Допускає 1..5, де 5 — бос-рівень: розбір навмисно
// ширший за можливості сторінки тесту, щоб посилання на боса теж
// можна було розібрати цією ж функцією.
export function parseLevel(search) {
    const raw = new URLSearchParams(search || '').get('level');
    const value = Number(raw);

    if (raw === null || raw === '' || !Number.isInteger(value)) return null;
    if (value < 1 || value > BOSS_LEVEL) return null;

    return value;
}

// Чи є рівень звичайним (для сторінки тесту), а не боссовим.
export function isNormalLevel(level) {
    return Number.isInteger(level) && level >= 1 && level <= NORMAL_LEVELS_PER_STAGE;
}

// ── Побудова конкретних маршрутів ────────────────────────────────────

export function lobbyUrl(pathname = '') { return buildUrl(ROUTES.LOBBY, {}, pathname); }
export function homeUrl(pathname = '') { return buildUrl(ROUTES.HOME, {}, pathname); }
export function mapUrl(pathname = '') { return buildUrl(ROUTES.MAP, {}, pathname); }
export function gameUrl(pathname = '') { return buildUrl(ROUTES.GAME, {}, pathname); }

export function stageUrl(stage, pathname = '') {
    return buildUrl(ROUTES.STAGE, { stage }, pathname);
}

export function levelUrl(stage, level, pathname = '') {
    return buildUrl(ROUTES.TEST, { stage, level }, pathname);
}

export function bossUrl(stage, pathname = '') {
    return buildUrl(ROUTES.BOSS, { stage }, pathname);
}

// ── Обгортки, що працюють із браузером ───────────────────────────────
//
// Виділені окремо, щоб чисті функції вище лишались придатними для Node.

const hasWindow = typeof window !== 'undefined';

function currentPath() {
    return hasWindow ? window.location.pathname : '';
}

function currentSearch() {
    return hasWindow ? window.location.search : '';
}

function navigate(url) {
    if (hasWindow) window.location.href = url;
    return url;
}

export function goToLobby() { return navigate(lobbyUrl(currentPath())); }
export function goToHome() { return navigate(homeUrl(currentPath())); }
export function goToMap() { return navigate(mapUrl(currentPath())); }
export function goToGame() { return navigate(gameUrl(currentPath())); }
export function goToStage(stage) { return navigate(stageUrl(stage, currentPath())); }
export function goToLevel(stage, level) { return navigate(levelUrl(stage, level, currentPath())); }
export function goToBoss(stage) { return navigate(bossUrl(stage, currentPath())); }

// Поточні параметри сторінки — те, чим користуватимуться екрани Етапу 2+.
export function getStageParam() { return parseStage(currentSearch()); }
export function getLevelParam() { return parseLevel(currentSearch()); }

// ── Сумісність із наявною розміткою ──────────────────────────────────
//
// У home/index.html, map/map.html і game/game.html кнопки меню досі
// прив'язані інлайном: onclick="goToMap()". Такі обробники бачать лише
// глобальну область, а модуль до неї не потрапляє — тому реєструємо
// функції вручну.
//
// Модулі виконуються після класичних скриптів, тож ці присвоєння
// перекривають старі оголошення з shared/defFunc.js.
//
// ⚠️ Тимчасовий місток. На Етапі 2 інлайнові onclick замінюються на
// addEventListener (див. §0.4 плану), після чого defFunc.js видаляється,
// а цей блок разом із ним.
if (hasWindow) {
    window.goToMap = goToMap;
    window.goToDef = goToHome;   // стара назва головної сторінки
    window.goToGame = goToGame;
    window.goToTest = () => goToMap();  // застаріле: тест тепер потребує stage/level
}
