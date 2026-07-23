// tests/questions.test.js
// Тести репозиторію питань і цілісності бази ques.js. Запуск: npm test

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as Q from '../core/questions.js';
import rawBank from '../ques.js';
import {
    TOTAL_STAGES,
    QUESTIONS_PER_LEVEL,
    NORMAL_LEVELS_PER_STAGE,
    BOSS,
    STAGES
} from '../core/config.js';

describe('Цілісність бази ques.js', () => {
    const report = Q.validateBank();

    it('validateBank не знаходить помилок', () => {
        assert.deepEqual(report.errors, []);
        assert.equal(report.ok, true);
    });

    it('248 питань, усі id унікальні', () => {
        assert.equal(report.stats.total, 248);
        assert.equal(report.stats.uniqueIds, 248);
    });

    it('усі питання мають рівно 4 варіанти', () => {
        const wrong = rawBank.filter(q => q.options.length !== 4);
        assert.deepEqual(wrong.map(q => q.id), []);
    });

    it('жодне питання не має дубльованих варіантів', () => {
        // Критично: prepare() шукає правильну відповідь через indexOf.
        // При двох однакових варіантах індекс вказав би не туди.
        const dups = rawBank.filter(q => new Set(q.options).size !== q.options.length);
        assert.deepEqual(dups.map(q => q.id), []);
    });
});

describe('Метадані стадій', () => {
    it('getAllStagesMeta повертає 8 стадій', () =>
        assert.equal(Q.getAllStagesMeta().length, TOTAL_STAGES));

    it('теги в даних збігаються з config для всіх стадій', () => {
        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            const tags = new Set(rawBank.filter(q => q.stage === stage).map(q => q.stage_tag));
            assert.deepEqual([...tags], [STAGES[stage].tag], `стадія ${stage}`);
        }
    });
});

describe('getLevelQuestions', () => {
    it('кожен звичайний рівень кожної стадії дає рівно 5 питань', () => {
        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            for (let level = 1; level <= NORMAL_LEVELS_PER_STAGE; level++) {
                assert.equal(Q.getLevelQuestions(stage, level).length, QUESTIONS_PER_LEVEL,
                    `стадія ${stage}, рівень ${level}`);
            }
        }
    });

    // Найважливіший тест файлу: після перемішування варіантів correctIndex
    // мусить указувати на той самий ТЕКСТ, що й у сирій базі.
    it('correctIndex вказує на правильну відповідь у всіх 8 стадіях', () => {
        const mismatches = [];

        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            for (let level = 1; level <= NORMAL_LEVELS_PER_STAGE; level++) {
                for (const q of Q.getLevelQuestions(stage, level)) {
                    const raw = rawBank.find(r => r.id === q.id);
                    const expected = raw.options[raw.correct_option_index];
                    if (q.options[q.correctIndex] !== expected) {
                        mismatches.push({ id: q.id, got: q.options[q.correctIndex], expected });
                    }
                }
            }
        }

        assert.deepEqual(mismatches, []);
    });

    it('повертає нормалізовану форму (camelCase)', () => {
        const q = Q.getLevelQuestions(1, 1)[0];
        assert.deepEqual(Object.keys(q).sort(), [
            'correctIndex', 'explanation', 'id', 'isBoss',
            'level', 'options', 'stage', 'stageTag', 'text'
        ]);
    });

    it('не мутує спільний індекс між викликами', () => {
        const first = Q.getLevelQuestions(1, 1);
        Q.getLevelQuestions(1, 1);
        const again = Q.getLevelQuestions(1, 1);
        assert.deepEqual(
            first.map(q => q.id).sort(),
            again.map(q => q.id).sort()
        );
    });
});

describe('Перемішування', () => {
    it('порядок питань змінюється між викликами', () => {
        const orders = new Set();
        for (let i = 0; i < 30; i++) {
            orders.add(Q.getLevelQuestions(1, 1).map(q => q.id).join(','));
        }
        // 5 питань дають 120 перестановок; за 30 прогонів однаковий
        // порядок щоразу практично неможливий.
        assert.ok(orders.size > 5, `унікальних порядків: ${orders.size}`);
    });

    it('правильна відповідь потрапляє на всі 4 позиції', () => {
        const positions = new Set();
        for (let i = 0; i < 50; i++) {
            Q.getLevelQuestions(1, 1).forEach(q => positions.add(q.correctIndex));
        }
        assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
    });
});

describe('Боссові питання', () => {
    it('кожна стадія має рівно 6 боссових питань', () => {
        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            const boss = Q.getBossQuestions(stage);
            assert.equal(boss.length, BOSS.HP, `стадія ${stage}`);
            assert.ok(boss.every(q => q.isBoss), `стадія ${stage}: не всі isBoss`);
        }
    });

    it('резервний пул — 5 небоссових питань бос-рівня', () => {
        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            const filler = Q.getFillerQuestions(stage);
            assert.equal(filler.length, 5, `стадія ${stage}`);
            assert.ok(filler.every(q => !q.isBoss), `стадія ${stage}`);
        }
    });
});

describe('getBossFightDeck', () => {
    it('типово — 6 боссових питань, без резерву', () => {
        const deck = Q.getBossFightDeck(1);
        assert.equal(deck.length, BOSS.HP);
        assert.equal(deck.filter(q => q.isBoss).length, BOSS.HP);
    });

    it('fillerCount: 2 → 4 боссових + 2 резервних', () => {
        const deck = Q.getBossFightDeck(1, { fillerCount: 2 });
        assert.equal(deck.length, BOSS.HP);
        assert.equal(deck.filter(q => q.isBoss).length, 4);
        assert.equal(deck.filter(q => !q.isBoss).length, 2);
    });

    it('усі питання в колоді унікальні', () => {
        for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
            for (const fillerCount of [0, 1, 2, 3]) {
                const deck = Q.getBossFightDeck(stage, { fillerCount });
                assert.equal(new Set(deck.map(q => q.id)).size, deck.length,
                    `стадія ${stage}, filler ${fillerCount}`);
            }
        }
    });

    it('надмірний fillerCount не ламає розмір колоди', () => {
        const deck = Q.getBossFightDeck(1, { fillerCount: 99 });
        assert.equal(deck.length, BOSS.HP);
        assert.equal(new Set(deck.map(q => q.id)).size, BOSS.HP);
    });
});

describe('Захист аргументів', () => {
    it('стадія 0 → RangeError', () =>
        assert.throws(() => Q.getLevelQuestions(0, 1), RangeError));
    it('стадія 9 → RangeError', () =>
        assert.throws(() => Q.getLevelQuestions(9, 1), RangeError));
    it('бос-рівень через getLevelQuestions → RangeError', () =>
        assert.throws(() => Q.getLevelQuestions(1, 5), RangeError));
    it('стадія рядком → RangeError', () =>
        assert.throws(() => Q.getLevelQuestions('1', 1), RangeError));
    it('getBossQuestions зі стадією 0 → RangeError', () =>
        assert.throws(() => Q.getBossQuestions(0), RangeError));
});
