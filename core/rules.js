// core/rules.js
// Правила гри — ЧИСТІ функції без побічних ефектів.
//
// Тут немає Firestore, немає DOM, немає Date.now(). Усе, що змінюється
// з часом, передається аргументом. Причини:
//   1. Функції можна тестувати без мережі й без моків Firebase.
//   2. Ті самі правила можна буде повторно використати в Cloud Function
//      на Етапі 9 — файл портативний і не залежить від браузера.
//   3. Помилку в підрахунку зірок видно з одного погляду на функцію,
//      а не після розкопування UI-коду.
//
// Домовленість про форму даних: функції приймають ЧАСТКОВІ об'єкти
// прогресу. Документ у Firestore може бути неповним (старий акаунт,
// обірваний запис), тож усі звернення захищені значеннями за замовчуванням.

import {
    SCHEMA_VERSION,
    STAR_THRESHOLDS,
    PASS_MIN_CORRECT,
    STARS_MAX_PER_LEVEL,
    NORMAL_LEVELS_PER_STAGE,
    MAX_STAGE_STARS,
    BOSS_LEVEL,
    TOTAL_STAGES,
    FIRST_STAGE,
    STAGES,
    BONUS,
    CERTIFICATE
} from './config.js';

// ── Внутрішні хелпери ────────────────────────────────────────────────

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Безпечно дістає стадію з прогресу. Повертає порожню заготовку,
// якщо стадії ще немає в документі.
function stageOf(progress, stage) {
    return (progress && progress.stages && progress.stages[stage]) || {};
}

// Безпечно дістає рівень зі стадії.
function levelOf(stageProgress, level) {
    return (stageProgress && stageProgress.levels && stageProgress.levels[level]) || {};
}

function assertStage(stage) {
    if (!Number.isInteger(stage) || stage < 1 || stage > TOTAL_STAGES) {
        throw new RangeError(`rules: некоректна стадія ${stage} (1..${TOTAL_STAGES})`);
    }
}

// ── Зірки за рівень ──────────────────────────────────────────────────

// Скільки зірок дає результат. Іде таблицею STAR_THRESHOLDS згори вниз
// і повертає перший поріг, який гравець подолав.
export function calculateStars(correctCount) {
    if (!Number.isFinite(correctCount) || correctCount < 0) return 0;

    for (const threshold of STAR_THRESHOLDS) {
        if (correctCount >= threshold.minCorrect) return threshold.stars;
    }
    return 0;
}

// Чи зарахований рівень взагалі. Нижче порогу зірки не нараховуються.
export function isLevelPassed(correctCount) {
    return Number.isFinite(correctCount) && correctCount >= PASS_MIN_CORRECT;
}

// Злиття нового результату з наявним.
//
// Ключове правило: зберігаємо НАЙКРАЩЕ. Гравець, який має 3 зірки й
// перегравав рівень заради практики, не повинен їх втратити через
// невдалу спробу — інакше повторення стає покаранням, а для навчального
// застосунку це прямо шкідливо.
//
// nowMs передається аргументом, щоб функція лишалась чистою.
export function mergeLevelResult(existing, correctCount, nowMs) {
    const prev = existing || {};
    const stars = calculateStars(correctCount);

    return {
        stars: Math.max(prev.stars || 0, stars),
        bestCorrect: Math.max(prev.bestCorrect || 0, Math.max(0, correctCount || 0)),
        attempts: (prev.attempts || 0) + 1,
        lastPlayedAt: nowMs
    };
}

// ── Зірки за стадію ──────────────────────────────────────────────────

// Сума зірок, зароблених на звичайних рівнях 1-4. Бос-рівень не рахується.
export function getStageEarnedStars(stageProgress) {
    let sum = 0;
    for (let level = 1; level <= NORMAL_LEVELS_PER_STAGE; level++) {
        const stars = levelOf(stageProgress, level).stars || 0;
        sum += clamp(stars, 0, STARS_MAX_PER_LEVEL);
    }
    return sum;
}

// Зароблені зірки + вкладені в цю стадію бонусні.
// Саме це число порівнюється з порогом розблокування боса.
export function getStageEffectiveStars(stageProgress) {
    const bonus = Math.max(0, (stageProgress && stageProgress.bonusApplied) || 0);
    return clamp(getStageEarnedStars(stageProgress) + bonus, 0, MAX_STAGE_STARS);
}

// Поріг для конкретної стадії (рішення A1c: 9 / 10 / 11 залежно від стадії).
export function getBossUnlockThreshold(stage) {
    assertStage(stage);
    return STAGES[stage].bossUnlockStars;
}

export function isBossUnlocked(stage, stageProgress) {
    if (stageProgress && stageProgress.bossDefeated) return true;
    return getStageEffectiveStars(stageProgress) >= getBossUnlockThreshold(stage);
}

// Скільки зірок ще бракує до відкриття боса. 0 — якщо вже відкритий або переможений.
export function getStarsNeededForBoss(stage, stageProgress) {
    if (stageProgress && stageProgress.bossDefeated) return 0;
    const need = getBossUnlockThreshold(stage) - getStageEffectiveStars(stageProgress);
    return Math.max(0, need);
}

export function isBossDefeated(stageProgress) {
    return Boolean(stageProgress && stageProgress.bossDefeated);
}

// ── Розблокування стадій і рівнів ────────────────────────────────────

// Стадія 1 відкрита завжди. Кожна наступна — лише після перемоги
// над босом попередньої.
export function isStageUnlocked(stage, progress) {
    assertStage(stage);
    if (stage === FIRST_STAGE) return true;
    return isBossDefeated(stageOf(progress, stage - 1));
}

// Рішення B1: рівні 1-4 усередині відкритої стадії доступні вільно,
// у будь-якому порядку. Це дозволяє підтягувати слабкі теми, не
// перепроходячи всю стадію послідовно.
//
// Бос-рівень (5) — єдиний, що має гейт по зірках.
export function isLevelUnlocked(stage, level, progress) {
    assertStage(stage);
    if (!isStageUnlocked(stage, progress)) return false;

    if (level >= 1 && level <= NORMAL_LEVELS_PER_STAGE) return true;
    if (level === BOSS_LEVEL) return isBossUnlocked(stage, stageOf(progress, stage));

    return false;
}

// ── Бонусні зірки ────────────────────────────────────────────────────

// Скільки бонусних зірок нарахувати за накопичений ігровий час.
//
// Повертає НОВИЙ стан блоку bonus + playtime — викликач просто записує
// його у Firestore. Функція нічого не мутує.
//
// todayKey — рядок дати ('2026-07-22'), передається ззовні, щоб функція
// не залежала від системного годинника.
//
// Важливо: секунди списуються (creditedSeconds) ЛИШЕ за фактично видані
// зірки. Якщо впертий денний ліміт — час зберігається й спрацює завтра.
export function computeBonusGrant(state, todayKey) {
    const totalSeconds = Math.max(0, (state && state.totalSeconds) || 0);
    const creditedSeconds = Math.max(0, (state && state.creditedSeconds) || 0);
    const balance = Math.max(0, (state && state.balance) || 0);
    const storedDate = (state && state.todayDate) || null;

    // Новий день — денний лічильник обнуляється.
    const todayEarned = storedDate === todayKey
        ? Math.max(0, (state && state.todayEarned) || 0)
        : 0;

    const uncredited = Math.max(0, totalSeconds - creditedSeconds);

    let stars = Math.floor(uncredited / BONUS.SECONDS_PER_STAR);
    stars = Math.min(stars, Math.max(0, BONUS.MAX_PER_DAY - todayEarned));
    stars = Math.min(stars, Math.max(0, BONUS.MAX_BALANCE - balance));
    stars = Math.max(0, stars);

    return {
        granted: stars,
        balance: balance + stars,
        creditedSeconds: creditedSeconds + stars * BONUS.SECONDS_PER_STAR,
        todayEarned: todayEarned + stars,
        todayDate: todayKey
    };
}

// Захист від накрутки клієнтського лічильника: приріст не може суттєво
// перевищувати реально минулий час за серверним годинником.
//
// Повертає дозволений приріст у секундах.
export function clampPlaytimeDelta(claimedDeltaSeconds, realElapsedSeconds) {
    const claimed = Math.max(0, claimedDeltaSeconds || 0);
    const real = Math.max(0, realElapsedSeconds || 0);
    return Math.min(claimed, Math.floor(real * BONUS.MAX_DRIFT_RATIO));
}

// Скільки бонусних зірок можна витратити на розблокування боса стадії.
//
// Не дозволяє витратити більше, ніж потрібно: якщо до порогу бракує 2,
// а гравець просить 3 — спишеться рівно 2. Зайві зірки лишаються.
export function computeBonusSpend(stage, stageProgress, balance, requested) {
    assertStage(stage);

    const available = Math.max(0, balance || 0);
    const needed = getStarsNeededForBoss(stage, stageProgress);
    const want = Math.max(0, requested || 0);

    const spend = Math.min(want, available, needed);
    const nextBonusApplied = Math.max(0, (stageProgress && stageProgress.bonusApplied) || 0) + spend;

    return {
        spend,
        balance: available - spend,
        bonusApplied: nextBonusApplied,
        // Чи відкриється бос після цієї витрати.
        bossUnlocked: getStageEffectiveStars({ ...stageProgress, bonusApplied: nextBonusApplied })
            >= getBossUnlockThreshold(stage)
    };
}

// ── Загальний прогрес ────────────────────────────────────────────────

// Сума ЗАРОБЛЕНИХ зірок по всіх стадіях. Бонусні свідомо не враховуються —
// це метрика реального навчання, придатна для лідерборду.
export function getTotalStars(progress) {
    let sum = 0;
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        sum += getStageEarnedStars(stageOf(progress, stage));
    }
    return sum;
}

export function getMaxStageUnlocked(progress) {
    let max = FIRST_STAGE;
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        if (isStageUnlocked(stage, progress)) max = stage;
    }
    return max;
}

// Гру пройдено, коли переможений бос останньої стадії.
export function isGameCompleted(progress) {
    return isBossDefeated(stageOf(progress, TOTAL_STAGES));
}

// Готовий зріз стадії для UI (екран вибору рівня та хотспоти мапи).
// Збирає в одному місці все, що потрібно намалювати.
export function summarizeStage(stage, progress) {
    assertStage(stage);

    const sp = stageOf(progress, stage);
    const meta = STAGES[stage];

    const levels = [];
    for (let level = 1; level <= NORMAL_LEVELS_PER_STAGE; level++) {
        const lp = levelOf(sp, level);
        levels.push({
            level,
            stars: clamp(lp.stars || 0, 0, STARS_MAX_PER_LEVEL),
            bestCorrect: lp.bestCorrect || 0,
            attempts: lp.attempts || 0,
            unlocked: true,             // рішення B1
            completed: (lp.stars || 0) > 0
        });
    }

    return {
        stage,
        tag: meta.tag,
        name: meta.name,
        unlocked: isStageUnlocked(stage, progress),
        earnedStars: getStageEarnedStars(sp),
        bonusApplied: Math.max(0, sp.bonusApplied || 0),
        effectiveStars: getStageEffectiveStars(sp),
        maxStars: MAX_STAGE_STARS,
        threshold: meta.bossUnlockStars,
        starsNeeded: getStarsNeededForBoss(stage, sp),
        bossUnlocked: isBossUnlocked(stage, sp),
        bossDefeated: isBossDefeated(sp),
        levels
    };
}

export function summarizeAllStages(progress) {
    const out = [];
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        out.push(summarizeStage(stage, progress));
    }
    return out;
}

// ── Код підтвердження проходження ────────────────────────────────────
//
// ⚠️ ПОВТОРЮ ГОЛОВНЕ: це НЕ доказ проходження гри. Сіль лежить у
// клієнтському коді, тож будь-хто може згенерувати валідний з вигляду
// код. Він служить ІДЕНТИФІКАТОРОМ для пошуку запису.
//
// Cloud Function на Етапі 9 має перевіряти так:
//   1. Знайти users/{uid} у Firestore
//   2. Переконатися, що stages.8.bossDefeated === true
//   3. Звірити збережений certificate.code з наданим (CASE-INSENSITIVE)
// І в жодному разі не «код валідний за формулою → видати сертифікат».
//
// Алгоритм навмисно простий (FNV-1a), щоб його можна було один в один
// відтворити на сервері без залежностей.

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const SEED_STEP = 0x9e3779b9; // золотий перетин — розводить сегменти

function fnv1a32(str, seed) {
    let hash = seed >>> 0;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, FNV_PRIME) >>> 0;
    }
    return hash >>> 0;
}

function segmentFrom(hash, length) {
    const alphabet = CERTIFICATE.ALPHABET;
    let out = '';
    let value = hash >>> 0;

    for (let i = 0; i < length; i++) {
        out += alphabet[value % alphabet.length];
        value = Math.floor(value / alphabet.length);
    }
    return out;
}

// Формує рядок, який хешується. Винесено окремо, бо Cloud Function
// має зібрати РІВНО такий самий payload.
function certificatePayload(uid, completedAtMs) {
    return `${CERTIFICATE.VERSION}|${uid}|${Math.floor(completedAtMs)}|${CERTIFICATE.SALT}`;
}

// Детермінований код виду IST-A3K9-QW2M-7XPT.
// Однакові (uid, completedAtMs) завжди дають однаковий результат.
export function generateCertificateCode(uid, completedAtMs) {
    if (typeof uid !== 'string' || uid.length === 0) {
        throw new TypeError('rules: uid має бути непорожнім рядком');
    }
    if (!Number.isFinite(completedAtMs)) {
        throw new TypeError('rules: completedAtMs має бути числом (мс)');
    }

    const payload = certificatePayload(uid, completedAtMs);
    const parts = [CERTIFICATE.PREFIX];

    for (let i = 0; i < CERTIFICATE.SEGMENTS; i++) {
        const hash = fnv1a32(payload, (FNV_OFFSET + i * SEED_STEP) >>> 0);
        parts.push(segmentFrom(hash, CERTIFICATE.SEGMENT_LENGTH));
    }

    return parts.join('-');
}

// Приводить введений гравцем код до канонічного вигляду:
// верхній регістр, без дефісів, пробілів і будь-яких роздільників.
export function normalizeCertificateCode(code) {
    return String(code == null ? '' : code).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Звірка коду. CASE-INSENSITIVE і стійка до дефісів/пробілів —
// гравець переписуватиме код вручну.
export function verifyCertificateCode(code, uid, completedAtMs) {
    if (typeof uid !== 'string' || uid.length === 0) return false;
    if (!Number.isFinite(completedAtMs)) return false;

    const expected = normalizeCertificateCode(generateCertificateCode(uid, completedAtMs));
    return normalizeCertificateCode(code) === expected;
}

// ── Початковий стан прогресу ─────────────────────────────────────────

export function createEmptyProgress() {
    const stages = {};
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        stages[stage] = {
            bossDefeated: false,
            bonusApplied: 0,
            levels: {}
        };
    }

    return {
        schemaVersion: SCHEMA_VERSION,
        totalStars: 0,
        bonus: {
            balance: 0,
            earnedTotal: 0,
            spentTotal: 0,
            todayEarned: 0,
            todayDate: null
        },
        playtime: {
            totalSeconds: 0,
            creditedSeconds: 0,
            lastHeartbeatAt: null
        },
        certificate: null,
        stages
    };
}

// ── Повний 100% прогрес (для тестування та автора проєкту) ─────────────

export function createFullProgress(uid = 'IW5LKzQM5jQJergx42elqvQv28V2', completedAt = Date.now()) {
    const stages = {};
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        const levels = {};
        for (let lvl = 1; lvl <= NORMAL_LEVELS_PER_STAGE; lvl++) {
            levels[lvl] = { stars: 3, bestCorrect: 5, attempts: 1, lastPlayedAt: completedAt };
        }
        stages[stage] = {
            bossDefeated: true,
            bonusApplied: 0,
            levels
        };
    }

    return {
        schemaVersion: SCHEMA_VERSION,
        totalStars: TOTAL_STAGES * NORMAL_LEVELS_PER_STAGE * 3, // 96 зірок
        bonus: {
            balance: 3,
            earnedTotal: 24,
            spentTotal: 0,
            todayEarned: 3,
            todayDate: null
        },
        playtime: {
            totalSeconds: 7200,
            creditedSeconds: 7200,
            lastHeartbeatAt: completedAt
        },
        certificate: {
            code: generateCertificateCode(uid, completedAt),
            completedAt,
            version: 1
        },
        stages
    };
}

