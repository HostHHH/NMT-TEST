// core/questions.js
// Репозиторій питань — єдина точка доступу до ques.js.
//
// Навіщо шар-обгортка, а не прямий імпорт ques.js у сторінках:
//   1. Формат ques.js (snake_case, correct_option_index) стає внутрішньою
//      деталлю. Якщо базу колись перегенерують з іншими назвами полів —
//      правити доведеться лише цей файл.
//   2. Перемішування варіантів вимагає перерахунку індексу правильної
//      відповіді. Робити це в кожному споживачі — гарантована помилка.
//   3. Вибірка за змістом (стадія/рівень), а не за числовим індексом,
//      як було в старій test/arrays.js.

import uaHistoryQuestions from '../ques.js';
import {
    TOTAL_STAGES,
    QUESTIONS_PER_LEVEL,
    NORMAL_LEVELS_PER_STAGE,
    BOSS_LEVEL,
    STAGES,
    BOSS,
    SHUFFLE
} from './config.js';

// ── Індекс ───────────────────────────────────────────────────────────
// Будується один раз при завантаженні модуля. База невелика (248 питань),
// але індекс робить наміри явними й прибирає повторні лінійні проходи.
//
// Ключ: `${stage}:${level}` → масив сирих питань у порядку з ques.js.
const byStageLevel = new Map();

for (const raw of uaHistoryQuestions) {
    const key = `${raw.stage}:${raw.level}`;
    if (!byStageLevel.has(key)) {
        byStageLevel.set(key, []);
    }
    byStageLevel.get(key).push(raw);
}

function rawFor(stage, level) {
    return byStageLevel.get(`${stage}:${level}`) || [];
}

// ── Внутрішні утиліти ────────────────────────────────────────────────

// Fisher-Yates. Повертає НОВИЙ масив — вхідний не мутується, бо це
// зрізи спільного індексу, і псувати їх не можна.
function shuffled(array) {
    const out = array.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// Перетворює сире питання з ques.js у нормалізовану форму для UI.
//
// Ключовий момент: якщо варіанти перемішуються, correct_option_index
// стає недійсним. Тому спершу запам'ятовуємо ТЕКСТ правильної відповіді,
// а після перемішування знаходимо його нову позицію.
function prepare(raw) {
    const correctText = raw.options[raw.correct_option_index];
    const options = SHUFFLE.OPTIONS ? shuffled(raw.options) : raw.options.slice();

    return {
        id: raw.id,
        stage: raw.stage,
        stageTag: raw.stage_tag,
        level: raw.level,
        isBoss: raw.is_boss,
        text: raw.question_text,
        options,
        correctIndex: options.indexOf(correctText),
        explanation: raw.explanation
    };
}

function prepareAll(list) {
    const ordered = SHUFFLE.QUESTIONS ? shuffled(list) : list;
    return ordered.map(prepare);
}

function assertValidStage(stage) {
    if (!Number.isInteger(stage) || stage < 1 || stage > TOTAL_STAGES) {
        throw new RangeError(
            `questions: некоректна стадія ${stage} (очікується 1..${TOTAL_STAGES})`
        );
    }
}

// ── Публічний API ────────────────────────────────────────────────────

// Метадані стадії: тег, людська назва, поріг боса.
export function getStageMeta(stage) {
    assertValidStage(stage);
    const meta = STAGES[stage];

    return {
        stage,
        tag: meta.tag,
        name: meta.name,
        bossUnlockStars: meta.bossUnlockStars,
        normalLevels: NORMAL_LEVELS_PER_STAGE,
        bossLevel: BOSS_LEVEL
    };
}

export function getAllStagesMeta() {
    const out = [];
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        out.push(getStageMeta(stage));
    }
    return out;
}

// Питання звичайного рівня (1-4). Готові до показу: перемішані,
// correctIndex уже перерахований.
export function getLevelQuestions(stage, level) {
    assertValidStage(stage);

    if (!Number.isInteger(level) || level < 1 || level > NORMAL_LEVELS_PER_STAGE) {
        throw new RangeError(
            `questions: рівень ${level} не є звичайним рівнем стадії ${stage} ` +
            `(очікується 1..${NORMAL_LEVELS_PER_STAGE}; для боса — getBossQuestions)`
        );
    }

    return prepareAll(rawFor(stage, level));
}

// Боссові питання стадії — ті, що з is_boss: true на рівні 5.
// Їх рівно BOSS.HP (6) у кожній стадії.
export function getBossQuestions(stage) {
    assertValidStage(stage);
    return prepareAll(rawFor(stage, BOSS_LEVEL).filter(q => q.is_boss));
}

// Резервний пул (рішення B2, варіант C): 5 звичайних питань, що лежать
// на бос-рівні поруч із боссовими. Використовуються для варіативності
// повторних боїв.
export function getFillerQuestions(stage) {
    assertValidStage(stage);
    return prepareAll(rawFor(stage, BOSS_LEVEL).filter(q => !q.is_boss));
}

// Колода для одного бою з босом.
//
// Свідомо НЕ вирішує тут, скільки саме питань підмішувати з резерву —
// це питання балансу бою, і його місце в модулі боса (Етап 5).
// Репозиторій лише надає зріз даних за заданими параметрами.
//
//   size        — скільки питань у колоді (за замовчуванням = HP боса)
//   fillerCount — скільки з них взяти з резервного пулу замість боссових
export function getBossFightDeck(stage, { size = BOSS.HP, fillerCount = 0 } = {}) {
    assertValidStage(stage);

    const bossPool = getBossQuestions(stage);
    const safeFiller = BOSS.USE_FILLER_POOL ? Math.max(0, Math.min(fillerCount, size)) : 0;
    const bossTake = Math.max(0, size - safeFiller);

    const deck = bossPool.slice(0, bossTake);

    if (safeFiller > 0) {
        deck.push(...getFillerQuestions(stage).slice(0, safeFiller));
    }

    // Добираємо боссовими, якщо резерву не вистачило.
    if (deck.length < size) {
        const used = new Set(deck.map(q => q.id));
        for (const q of bossPool) {
            if (deck.length >= size) break;
            if (!used.has(q.id)) deck.push(q);
        }
    }

    return shuffled(deck);
}

// ── Перевірка цілісності бази ────────────────────────────────────────
// Тестів у проєкті поки немає, тож це найдешевший спосіб упевнитися,
// що ques.js відповідає очікуваній структурі. Викликати вручну з консолі
// або підключити в майбутньому до тестів rules.js.
//
// Повертає { ok, errors[], stats }.
export function validateBank() {
    const errors = [];

    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
        if (!STAGES[stage]) {
            errors.push(`Стадія ${stage} відсутня в config.STAGES`);
            continue;
        }

        // Звичайні рівні: рівно QUESTIONS_PER_LEVEL питань, жодного боса.
        for (let level = 1; level <= NORMAL_LEVELS_PER_STAGE; level++) {
            const list = rawFor(stage, level);

            if (list.length !== QUESTIONS_PER_LEVEL) {
                errors.push(
                    `Стадія ${stage}, рівень ${level}: ${list.length} питань ` +
                    `(очікується ${QUESTIONS_PER_LEVEL})`
                );
            }
            if (list.some(q => q.is_boss)) {
                errors.push(`Стадія ${stage}, рівень ${level}: боссове питання на звичайному рівні`);
            }
        }

        // Бос-рівень: щонайменше BOSS.HP боссових питань.
        const bossList = rawFor(stage, BOSS_LEVEL).filter(q => q.is_boss);
        if (bossList.length < BOSS.HP) {
            errors.push(
                `Стадія ${stage}: боссових питань ${bossList.length}, ` +
                `а HP боса — ${BOSS.HP}`
            );
        }

        // Тег стадії в даних має збігатися з конфігом.
        const tags = new Set(
            uaHistoryQuestions.filter(q => q.stage === stage).map(q => q.stage_tag)
        );
        if (tags.size !== 1 || !tags.has(STAGES[stage].tag)) {
            errors.push(
                `Стадія ${stage}: тег у даних [${[...tags].join(', ')}] ` +
                `не збігається з config (${STAGES[stage].tag})`
            );
        }
    }

    // Кожне питання має бути структурно валідним.
    const seenIds = new Set();
    for (const q of uaHistoryQuestions) {
        if (seenIds.has(q.id)) errors.push(`Дубльований id: ${q.id}`);
        seenIds.add(q.id);

        if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`${q.id}: некоректний масив options`);
            continue;
        }
        if (q.correct_option_index < 0 || q.correct_option_index >= q.options.length) {
            errors.push(`${q.id}: correct_option_index поза межами options`);
        }
        if (new Set(q.options).size !== q.options.length) {
            errors.push(`${q.id}: дубльовані варіанти відповіді`);
        }
    }

    return {
        ok: errors.length === 0,
        errors,
        stats: {
            total: uaHistoryQuestions.length,
            stages: TOTAL_STAGES,
            uniqueIds: seenIds.size
        }
    };
}
