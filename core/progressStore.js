// core/progressStore.js
// Шар доступу до прогресу гравця у Firestore.
//
// Межа відповідальності: цей файл НЕ приймає ігрових рішень. Скільки зірок
// дати, чи відкрився бос, скільки бонусів списати — усе це рахує rules.js.
// Тут лише читання, запис і транзакційна цілісність.
//
// Чому саме так: rules.js імпортує тільки config.js, тож його можна
// прогнати через node:test (109 тестів уже є) і повторно використати в Cloud
// Function. А цей файл імпортує Firebase SDK з CDN, і Node такий імпорт
// виконати не може — тому логіці тут не місце.
//
// Ініціалізація: main.js має один раз викликати initProgressStore(db).
// Свій екземпляр Firebase тут навмисно не створюється, щоб не було
// другого initializeApp.

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import {
    SCHEMA_VERSION,
    TOTAL_STAGES,
    NORMAL_LEVELS_PER_STAGE,
    BOSS_LEVEL
} from './config.js';

import {
    mergeLevelResult,
    calculateStars,
    isBossUnlocked,
    isLevelUnlocked,
    isStageUnlocked,
    computeBonusGrant,
    computeBonusSpend,
    clampPlaytimeDelta,
    getTotalStars,
    generateCertificateCode,
    normalizeCertificateCode,
    createFullProgress
} from './rules.js';

// ── Ініціалізація ────────────────────────────────────────────────────

let db = null;

const STORAGE_PREFIX = 'istoriya_prog_';

export function getLocalProgress(uid) {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + (uid || 'guest'))
            || (uid ? localStorage.getItem(STORAGE_PREFIX + 'guest') : null)
            || localStorage.getItem('istoriya_cached_progress');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setLocalProgress(uid, progress) {
    if (typeof localStorage === 'undefined' || !progress) return;
    try {
        const json = JSON.stringify(progress);
        localStorage.setItem(STORAGE_PREFIX + (uid || 'guest'), json);
        localStorage.setItem('istoriya_cached_progress', json);
        if (uid && uid !== 'guest') {
            localStorage.setItem('istoriya_last_uid', uid);
        }
    } catch (e) {
        console.warn('Помилка запису у localStorage:', e);
    }
}

export function initProgressStore(firestoreDb) {
    db = firestoreDb;
}

function requireDb() {
    if (!db) {
        throw new Error(
            'progressStore: не ініціалізовано. Виклич initProgressStore(db) у main.js ' +
            'до будь-яких операцій із прогресом.'
        );
    }
    return db;
}

function userRef(uid) {
    if (typeof uid !== 'string' || !uid) {
        throw new TypeError('progressStore: uid має бути непорожнім рядком');
    }
    return doc(requireDb(), 'users', uid);
}

// ── Форма документа ──────────────────────────────────────────────────
//
// Зберігаємо ТІЛЬКИ факти. Усе, що можна вивести, не зберігаємо:
//
//   unlocked      → виводиться з bossDefeated попередньої стадії
//   bossUnlocked  → виводиться з суми зірок і порогу
//   earnedStars   → сума зірок рівнів
//
// Причина: збережена копія похідного стану рано чи пізно розсинхронізується
// з джерелом, і тоді неможливо зрозуміти, кому вірити. Плюс збережений
// прапорець "unlocked: true" — це готовий вектор накрутки, а обчислений
// щоразу — ні.
//
// Виняток один: totalStars. Він денормалізований, бо Firestore не вміє
// сортувати за обчисленим значенням, а лідерборду потрібен orderBy.
// Джерело істини — усе одно levels; totalStars перераховується при кожному
// записі результату.

export { createEmptyProgress } from './rules.js';

// Ключ доби у локальному часі гравця ('2026-07-22').
// Передається в rules.computeBonusGrant, щоб та лишалась чистою.
export function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ── Читання ──────────────────────────────────────────────────────────

export async function loadProgress(uid) {
    const snap = await getDoc(userRef(uid));
    if (!snap.exists()) return null;
    return snap.data().progress || null;
}

// Підписка на зміни прогресу. Повертає функцію відписки.
export function subscribeProgress(uid, callback) {
    try {
        return onSnapshot(
            userRef(uid),
            (snap) => {
                if (!snap.exists()) { callback(null); return; }
                const prog = snap.data().progress || null;
                if (prog) setLocalProgress(uid, prog);
                callback(prog);
            },
            (err) => {
                console.warn('[ProgressStore] subscribeProgress помилка підписки Firestore (використовуємо локальний кеш):', err?.message || err);
                const cached = getLocalProgress(uid) || getLocalProgress('guest');
                if (cached) callback(cached);
            }
        );
    } catch (e) {
        console.warn('[ProgressStore] Не вдалося створити підписку Firestore:', e);
        const cached = getLocalProgress(uid) || getLocalProgress('guest');
        if (cached) callback(cached);
        return () => {};
    }
}

// ── Ініціалізація та міграція ────────────────────────────────────────
//
// Викликається після входу. Три випадки:
//   1. Документа немає      → створюємо разом із прогресом
//   2. Документ є без progress → дописуємо (акаунти, створені до Етапу 1)
//   3. Прогрес старої версії  → міграція
//
// Другий випадок — реальний: зараз у базі лежать акаунти лише з
// settings і highScore.

export async function ensureProgress(uid) {
    const cached = getLocalProgress(uid);
    let firestoreDb = null;
    try { firestoreDb = requireDb(); } catch {}

    if (!firestoreDb) {
        const fallback = cached || createEmptyProgress();
        setLocalProgress(uid, fallback);
        return fallback;
    }

    try {
        const ref = userRef(uid);
        const result = await runTransaction(firestoreDb, async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists()) {
                const progress = cached || createEmptyProgress();
                tx.set(ref, {
                    progress,
                    progressCreatedAt: serverTimestamp(),
                    progressUpdatedAt: serverTimestamp()
                }, { merge: true });
                return progress;
            }

            const existing = snap.data().progress;

            if (!existing) {
                const progress = cached || createEmptyProgress();
                tx.set(ref, {
                    progress,
                    progressCreatedAt: serverTimestamp(),
                    progressUpdatedAt: serverTimestamp()
                }, { merge: true });
                return progress;
            }

            const migrated = migrateProgress(existing);
            if (migrated !== existing) {
                tx.set(ref, { progress: migrated, progressUpdatedAt: serverTimestamp() }, { merge: true });
                return migrated;
            }

            return existing;
        });

        setLocalProgress(uid, result);
        return result;
    } catch (err) {
        console.warn('[ProgressStore] ensureProgress помилка Firestore (використовуємо локальний кеш):', err);
        const fallback = cached || createEmptyProgress();
        setLocalProgress(uid, fallback);
        return fallback;
    }
}

// Міграції між версіями схеми. Повертає той самий об'єкт, якщо змін не було.
//
// Наразі версія одна, тож функція лише добудовує відсутні блоки —
// це рятує від часткових документів після обірваного запису.
function migrateProgress(progress) {
    const version = progress.schemaVersion || 0;
    let changed = false;
    const next = { ...progress };

    if (version < 1) {
        next.schemaVersion = SCHEMA_VERSION;
        changed = true;
    }

    const blank = createEmptyProgress();

    for (const key of ['bonus', 'playtime']) {
        if (!next[key]) { next[key] = blank[key]; changed = true; }
    }
    if (!next.stages) { next.stages = blank.stages; changed = true; }
    if (typeof next.totalStars !== 'number') { next.totalStars = 0; changed = true; }
    if (next.certificate === undefined) { next.certificate = null; changed = true; }

    // Добудовуємо стадії, яких бракує.
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        if (!next.stages[stage]) {
            next.stages[stage] = { bossDefeated: false, bonusApplied: 0, levels: {} };
            changed = true;
        }
    }

    return changed ? next : progress;
}

// ── Запис результату рівня ───────────────────────────────────────────
//
// Транзакція обов'язкова: правило "зберігаємо найкраще" — це
// read-modify-write, і без транзакції дві вкладки можуть затерти
// результат одна одної.

export async function saveLevelResult(uid, stage, level, correctCount) {
    if (!Number.isInteger(level) || level < 1 || level > NORMAL_LEVELS_PER_STAGE) {
        throw new RangeError(
            `progressStore: рівень ${level} не є звичайним (1..${NORMAL_LEVELS_PER_STAGE})`
        );
    }

    const effectiveUid = uid || (typeof localStorage !== 'undefined' && localStorage.getItem('istoriya_last_uid')) || 'guest';
    const now = Date.now();

    // Завжди оновлюємо локальний прогрес
    const current = getLocalProgress(effectiveUid) || getLocalProgress('guest') || createEmptyProgress();
    const stageData = current.stages[stage] || { bossDefeated: false, bonusApplied: 0, levels: {} };
    const previous = (stageData.levels && stageData.levels[level]) || null;
    const merged = mergeLevelResult(previous, correctCount, now);

    const nextProgress = {
        ...current,
        stages: {
            ...current.stages,
            [stage]: {
                ...stageData,
                levels: { ...stageData.levels, [level]: merged }
            }
        }
    };
    nextProgress.totalStars = getTotalStars(nextProgress);
    setLocalProgress(effectiveUid, nextProgress);
    setLocalProgress('guest', nextProgress);

    const localResult = {
        starsAwarded: calculateStars(correctCount),
        level: merged,
        improved: merged.stars > (previous?.stars || 0),
        bossUnlocked: isBossUnlocked(stage, nextProgress.stages[stage]),
        progress: nextProgress
    };

    // Спроба синхронізувати з Firestore у фоні, якщо доступно
    if (db && uid && uid !== 'guest') {
        try {
            const ref = userRef(uid);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(ref);
                const progress = migrateProgress((snap.exists() && snap.data().progress) || nextProgress);
                const sData = progress.stages[stage] || { bossDefeated: false, bonusApplied: 0, levels: {} };
                const prevL = (sData.levels && sData.levels[level]) || null;
                const m = mergeLevelResult(prevL, correctCount, now);
                const fsNext = {
                    ...progress,
                    stages: {
                        ...progress.stages,
                        [stage]: { ...sData, levels: { ...sData.levels, [level]: m } }
                    }
                };
                fsNext.totalStars = getTotalStars(fsNext);
                tx.set(ref, { progress: fsNext, progressUpdatedAt: serverTimestamp() }, { merge: true });
            });
        } catch (fsErr) {
            console.warn('[ProgressStore] saveLevelResult помилка синхронізації з Firestore:', fsErr);
        }
    }

    return localResult;
}

// ── Перемога над босом ───────────────────────────────────────────────
//
// Для останньої стадії додатково генерує код підтвердження.
// Код і completedAt зберігаються разом, щоб Cloud Function (Етап 9)
// могла відтворити хеш і звірити його.

export async function saveBossVictory(uid, stage) {
    const completedAt = Date.now();
    const effectiveUid = uid || (typeof localStorage !== 'undefined' && localStorage.getItem('istoriya_last_uid')) || 'guest';

    // 1. Негайно обчислюємо та записуємо локальний стан
    const current = getLocalProgress(effectiveUid) || getLocalProgress('guest') || createEmptyProgress();
    const stageData = current.stages[stage] || { bossDefeated: false, bonusApplied: 0, levels: {} };

    const localNext = {
        ...current,
        stages: {
            ...current.stages,
            [stage]: { ...stageData, bossDefeated: true, bossDefeatedAt: completedAt }
        }
    };

    let certificate = localNext.certificate || null;
    if (stage === TOTAL_STAGES && !certificate) {
        certificate = {
            code: generateCertificateCode(effectiveUid === 'guest' ? 'GUEST-PLAYER' : effectiveUid, completedAt),
            completedAt,
            version: 1
        };
        localNext.certificate = certificate;
    }

    // Зберігаємо локально МИТТЄВО — жодна помилка мережі не перерве гру!
    setLocalProgress(effectiveUid, localNext);
    setLocalProgress('guest', localNext);

    const nextStage = stage < TOTAL_STAGES ? stage + 1 : null;
    const localResult = {
        stage,
        nextStageUnlocked: nextStage && isStageUnlocked(nextStage, localNext) ? nextStage : null,
        gameCompleted: stage === TOTAL_STAGES,
        certificate,
        progress: localNext
    };

    // 2. Спроба транзакційного запису у Firestore (якщо мережа й авторизація активні)
    if (db && uid && uid !== 'guest') {
        try {
            const ref = userRef(uid);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(ref);
                const progress = migrateProgress((snap.exists() && snap.data().progress) || localNext);
                const sData = progress.stages[stage] || { bossDefeated: false, bonusApplied: 0, levels: {} };

                const fsNext = {
                    ...progress,
                    stages: {
                        ...progress.stages,
                        [stage]: { ...sData, bossDefeated: true, bossDefeatedAt: completedAt }
                    }
                };

                if (stage === TOTAL_STAGES && certificate) {
                    fsNext.certificate = certificate;
                    try {
                        const certRef = doc(db, 'certificates', normalizeCertificateCode(certificate.code));
                        tx.set(certRef, {
                            code: certificate.code,
                            uid: uid,
                            completedAt: completedAt,
                            course: 'Повний курс НМТ з історії України (8 стадій)',
                            status: 'verified'
                        });
                    } catch (certErr) {
                        console.warn('[ProgressStore] Помилка запису сертифіката у Firestore:', certErr);
                    }
                }

                tx.set(ref, { progress: fsNext, progressUpdatedAt: serverTimestamp() }, { merge: true });
            });
            console.log(`[ProgressStore] Бос стадії ${stage} успішно синхронізований у Firestore.`);
        } catch (fsErr) {
            console.warn(`[ProgressStore] saveBossVictory помилка Firestore (збережено в локальному сховищі):`, fsErr);
        }
    }

    return localResult;
}

// ── Ігровий час і бонусні зірки ──────────────────────────────────────
//
// Один виклик на heartbeat: додає час і одразу нараховує зірки, якщо
// назбиралось. Так на кожен heartbeat припадає один запис, а не два.
//
// Обмеження чесності: реальний інтервал рахується за клієнтським
// Date.now() відносно збереженого lastHeartbeatAt. Клієнт може збрехати.
// Це свідомо прийнято (рішення C4): денний ліміт у 3 зірки обмежує шкоду,
// а сувора перевірка потребувала б Cloud Function.

export async function recordPlaytime(uid, deltaSeconds) {
    const ref = userRef(uid);
    const nowMs = Date.now();
    const key = todayKey();

    return runTransaction(requireDb(), async (tx) => {
        const snap = await tx.get(ref);
        const progress = migrateProgress((snap.exists() && snap.data().progress) || createEmptyProgress());

        const playtime = progress.playtime || {};
        const lastMs = toMillis(playtime.lastHeartbeatAt);

        // Скільки реально минуло від попереднього heartbeat.
        // Перший виклик у сесії довіри не має — беремо заявлене як є.
        const realElapsed = lastMs ? Math.max(0, (nowMs - lastMs) / 1000) : deltaSeconds;
        const accepted = clampPlaytimeDelta(deltaSeconds, realElapsed);

        const totalSeconds = Math.max(0, (playtime.totalSeconds || 0) + accepted);

        const grant = computeBonusGrant({
            totalSeconds,
            creditedSeconds: playtime.creditedSeconds || 0,
            balance: progress.bonus?.balance || 0,
            todayEarned: progress.bonus?.todayEarned || 0,
            todayDate: progress.bonus?.todayDate || null
        }, key);

        const nextProgress = {
            ...progress,
            playtime: {
                totalSeconds,
                creditedSeconds: grant.creditedSeconds,
                lastHeartbeatAt: nowMs
            },
            bonus: {
                ...progress.bonus,
                balance: grant.balance,
                earnedTotal: (progress.bonus?.earnedTotal || 0) + grant.granted,
                todayEarned: grant.todayEarned,
                todayDate: grant.todayDate
            }
        };

        tx.set(ref, { progress: nextProgress, progressUpdatedAt: serverTimestamp() }, { merge: true });

        return {
            acceptedSeconds: accepted,
            starsGranted: grant.granted,
            balance: grant.balance,
            totalSeconds,
            progress: nextProgress
        };
    });
}

// Витрата бонусних зірок на розблокування боса конкретної стадії.
// Списує рівно стільки, скільки бракує — не більше (див. rules.computeBonusSpend).
export async function spendBonusStars(uid, stage, requested) {
    const ref = userRef(uid);

    return runTransaction(requireDb(), async (tx) => {
        const snap = await tx.get(ref);
        const progress = migrateProgress((snap.exists() && snap.data().progress) || createEmptyProgress());

        const stageData = progress.stages[stage] || { bossDefeated: false, bonusApplied: 0, levels: {} };
        const result = computeBonusSpend(stage, stageData, progress.bonus?.balance || 0, requested);

        if (result.spend === 0) {
            return { spent: 0, balance: progress.bonus?.balance || 0, bossUnlocked: result.bossUnlocked, progress };
        }

        const nextProgress = {
            ...progress,
            bonus: {
                ...progress.bonus,
                balance: result.balance,
                spentTotal: (progress.bonus?.spentTotal || 0) + result.spend
            },
            stages: {
                ...progress.stages,
                [stage]: { ...stageData, bonusApplied: result.bonusApplied }
            }
        };

        tx.set(ref, { progress: nextProgress, progressUpdatedAt: serverTimestamp() }, { merge: true });

        return {
            spent: result.spend,
            balance: result.balance,
            bossUnlocked: result.bossUnlocked,
            progress: nextProgress
        };
    });
}

// ── Дрібниці ─────────────────────────────────────────────────────────

// Firestore може повернути Timestamp, число або null — зводимо до мс.
function toMillis(value) {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    return null;
}

// Прапорець BOSS_LEVEL реекспортуємо, щоб сторінки не імпортували config
// заради одного числа.
export { BOSS_LEVEL };

// ── Керування прогресом розробника (100% Unlock) ─────────────────────

export async function grantFullProgress(uid = 'IW5LKzQM5jQJergx42elqvQv28V2', displayName = 'Мацевич Орест Дмитрович') {
    const completedAt = Date.now();
    const fullProgress = createFullProgress(uid, completedAt);
    fullProgress.bonus.todayDate = todayKey();

    // Завжди зберігаємо локально для автора та гостя
    setLocalProgress(uid, fullProgress);
    setLocalProgress('guest', fullProgress);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('istoriya_last_uid', uid);
    }

    // Спроба синхронізувати з Firestore
    try {
        const firestoreDb = requireDb();
        const ref = userRef(uid);

        // 1. Запис у власний документ users/{uid}
        await setDoc(ref, {
            progress: fullProgress,
            displayName,
            progressUpdatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Реєстрація сертифіката у відкритому реєстрі
        try {
            const certCode = fullProgress.certificate.code;
            const certRef = doc(firestoreDb, 'certificates', normalizeCertificateCode(certCode));
            await setDoc(certRef, {
                code: certCode,
                uid: uid,
                completedAt: completedAt,
                course: 'Повний курс НМТ з історії України (8 стадій)',
                status: 'verified'
            });
        } catch (certErr) {
            console.warn('[Certificate Registry Warning] Не вдалося записати сертифікат у /certificates:', certErr);
        }

        // 3. Синхронізація лідерборду
        try {
            const leaderRef = doc(firestoreDb, 'leaderboard', uid);
            await setDoc(leaderRef, {
                displayName,
                highScore: 2500,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (leaderErr) {
            console.warn('[Leaderboard Warning] Не вдалося оновити /leaderboard:', leaderErr);
        }
    } catch (dbErr) {
        console.warn('[ProgressStore] grantFullProgress помилка Firestore (збережено в локальному кеші):', dbErr);
    }

    return fullProgress;
}

export async function resetProgress(uid = 'IW5LKzQM5jQJergx42elqvQv28V2') {
    const empty = createEmptyProgress();
    setLocalProgress(uid, empty);
    setLocalProgress('guest', empty);

    try {
        const ref = userRef(uid);
        await setDoc(ref, { progress: empty, progressUpdatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
        console.warn('[ProgressStore] resetProgress помилка Firestore:', err);
    }
    return empty;
}
