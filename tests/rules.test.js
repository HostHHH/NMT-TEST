// tests/rules.test.js
// Тести правил гри. Запуск: npm test
//
// Залежностей немає — використовується вбудований раннер Node (node:test).
// rules.js складається з чистих функцій, тож ані Firestore, ані DOM,
// ані моків тут не потрібно.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as R from '../core/rules.js';
import { STAGES, BONUS, MAX_STAGE_STARS, CERTIFICATE } from '../core/config.js';

// ── Помічники для побудови об'єктів прогресу ─────────────────────────
const stageWith = (starsArr, extra = {}) => ({
    levels: Object.fromEntries(starsArr.map((s, i) => [i + 1, { stars: s }])),
    ...extra
});
const progressOf = (stages) => ({ stages });
const emptyProgress = progressOf({});

describe('calculateStars', () => {
    it('5/5 без помилок → 3 зірки', () => assert.equal(R.calculateStars(5), 3));
    it('4/5 одна помилка → 2 зірки', () => assert.equal(R.calculateStars(4), 2));
    it('3/5 дві помилки → 1 зірка', () => assert.equal(R.calculateStars(3), 1));
    it('2/5 → провал, 0 зірок', () => assert.equal(R.calculateStars(2), 0));
    it('0/5 → 0 зірок', () => assert.equal(R.calculateStars(0), 0));
    it('від’ємне значення → 0', () => assert.equal(R.calculateStars(-1), 0));
    it('NaN → 0', () => assert.equal(R.calculateStars(NaN), 0));
});

describe('isLevelPassed', () => {
    it('3 правильних — зараховано', () => assert.equal(R.isLevelPassed(3), true));
    it('2 правильних — провал', () => assert.equal(R.isLevelPassed(2), false));
});

describe('mergeLevelResult — зберігає найкраще', () => {
    it('перша спроба на 5/5', () => {
        assert.deepEqual(R.mergeLevelResult(null, 5, 1000),
            { stars: 3, bestCorrect: 5, attempts: 1, lastPlayedAt: 1000 });
    });

    it('гірша спроба НЕ знижує вже здобуті зірки', () => {
        assert.deepEqual(R.mergeLevelResult({ stars: 3, bestCorrect: 5, attempts: 1 }, 3, 2000),
            { stars: 3, bestCorrect: 5, attempts: 2, lastPlayedAt: 2000 });
    });

    it('краща спроба підвищує результат', () => {
        assert.deepEqual(R.mergeLevelResult({ stars: 1, bestCorrect: 3, attempts: 4 }, 5, 3000),
            { stars: 3, bestCorrect: 5, attempts: 5, lastPlayedAt: 3000 });
    });

    it('провал теж зараховується як спроба', () => {
        assert.deepEqual(R.mergeLevelResult({ stars: 2, bestCorrect: 4, attempts: 1 }, 0, 4000),
            { stars: 2, bestCorrect: 4, attempts: 2, lastPlayedAt: 4000 });
    });
});

describe('Зірки стадії', () => {
    it('3+3+3+3 = 12 (максимум)', () =>
        assert.equal(R.getStageEarnedStars(stageWith([3, 3, 3, 3])), 12));
    it('3+3+3+2 = 11', () =>
        assert.equal(R.getStageEarnedStars(stageWith([3, 3, 3, 2])), 11));
    it('порожня стадія = 0', () =>
        assert.equal(R.getStageEarnedStars({}), 0));
    it('MAX_STAGE_STARS дорівнює 12', () =>
        assert.equal(MAX_STAGE_STARS, 12));
    it('effective = зароблені + бонусні', () =>
        assert.equal(R.getStageEffectiveStars(stageWith([3, 3, 2, 0], { bonusApplied: 2 })), 10));
    it('effective не перевищує максимум стадії', () =>
        assert.equal(R.getStageEffectiveStars(stageWith([3, 3, 3, 3], { bonusApplied: 3 })), 12));
});

describe('Пороги розблокування боса (рішення A1c)', () => {
    it('9/9/9/10/10/11/11/11 по стадіях', () => {
        assert.deepEqual(
            [1, 2, 3, 4, 5, 6, 7, 8].map(R.getBossUnlockThreshold),
            [9, 9, 9, 10, 10, 11, 11, 11]
        );
    });

    it('назви стадій відповідають конфігу', () => {
        assert.deepEqual([1, 4, 8].map(s => STAGES[s].name),
            ['Витоки', 'Нова історія', 'Майстер НМТ']);
    });
});

describe('Розблокування боса', () => {
    it('стадія 1: 9 зірок → відкрито', () =>
        assert.ok(R.isBossUnlocked(1, stageWith([3, 3, 3, 0]))));
    it('стадія 1: 8 зірок → закрито', () =>
        assert.ok(!R.isBossUnlocked(1, stageWith([3, 3, 2, 0]))));
    it('показує, скільки зірок бракує', () =>
        assert.equal(R.getStarsNeededForBoss(1, stageWith([3, 3, 2, 0])), 1));
    it('уже відкритий → бракує 0', () =>
        assert.equal(R.getStarsNeededForBoss(1, stageWith([3, 3, 3, 3])), 0));
    it('стадія 6 (поріг 11): 10 зірок → закрито', () =>
        assert.ok(!R.isBossUnlocked(6, stageWith([3, 3, 3, 1]))));
    it('стадія 6: 11 зірок → відкрито', () =>
        assert.ok(R.isBossUnlocked(6, stageWith([3, 3, 3, 2]))));
    it('бонусні зірки відкривають боса', () =>
        assert.ok(R.isBossUnlocked(6, stageWith([3, 3, 3, 0], { bonusApplied: 2 }))));
});

describe('Розблокування стадій', () => {
    const afterBoss1 = progressOf({ 1: stageWith([3, 3, 3, 3], { bossDefeated: true }) });

    it('стадія 1 відкрита завжди', () =>
        assert.ok(R.isStageUnlocked(1, emptyProgress)));
    it('стадія 2 закрита на старті', () =>
        assert.ok(!R.isStageUnlocked(2, emptyProgress)));
    it('стадія 2 відкривається після перемоги над босом 1', () =>
        assert.ok(R.isStageUnlocked(2, afterBoss1)));
    it('стадія 3 при цьому лишається закритою', () =>
        assert.ok(!R.isStageUnlocked(3, afterBoss1)));
    it('getMaxStageUnlocked', () =>
        assert.equal(R.getMaxStageUnlocked(afterBoss1), 2));
});

describe('Розблокування рівнів (рішення B1 — вільний доступ)', () => {
    it('рівень 1 доступний одразу', () =>
        assert.ok(R.isLevelUnlocked(1, 1, emptyProgress)));
    it('рівень 4 доступний без проходження 1-3', () =>
        assert.ok(R.isLevelUnlocked(1, 4, emptyProgress)));
    it('бос закритий без зірок', () =>
        assert.ok(!R.isLevelUnlocked(1, 5, emptyProgress)));
    it('бос відкритий при 9 зірках', () =>
        assert.ok(R.isLevelUnlocked(1, 5, progressOf({ 1: stageWith([3, 3, 3, 0]) }))));
    it('рівень у закритій стадії недоступний', () =>
        assert.ok(!R.isLevelUnlocked(2, 1, emptyProgress)));
    it('неіснуючий рівень 6 недоступний', () =>
        assert.ok(!R.isLevelUnlocked(1, 6, emptyProgress)));
});

describe('Бонусні зірки — нарахування', () => {
    it('конфіг: 600 с/зірка, 3 на добу, стеля 3', () =>
        assert.deepEqual(
            [BONUS.SECONDS_PER_STAR, BONUS.MAX_PER_DAY, BONUS.MAX_BALANCE],
            [600, 3, 3]));

    it('20 хвилин → 2 зірки', () => {
        assert.deepEqual(
            R.computeBonusGrant({ totalSeconds: 1200, creditedSeconds: 0, balance: 0, todayEarned: 0, todayDate: 'D1' }, 'D1'),
            { granted: 2, balance: 2, creditedSeconds: 1200, todayEarned: 2, todayDate: 'D1' });
    });

    it('9 хвилин — ще недостатньо', () =>
        assert.equal(R.computeBonusGrant({ totalSeconds: 540, creditedSeconds: 0 }, 'D1').granted, 0));

    // Найважливіший тест блоку: час за невидані зірки НЕ згорає.
    it('денний ліміт ріже до 3, решта часу зберігається', () => {
        assert.deepEqual(
            R.computeBonusGrant({ totalSeconds: 3000, creditedSeconds: 0, balance: 0, todayEarned: 0, todayDate: 'D1' }, 'D1'),
            { granted: 3, balance: 3, creditedSeconds: 1800, todayEarned: 3, todayDate: 'D1' });
    });

    it('стеля балансу блокує нарахування', () =>
        assert.equal(R.computeBonusGrant({ totalSeconds: 1200, balance: 3 }, 'D1').granted, 0));

    it('вичерпаний денний ліміт блокує', () =>
        assert.equal(R.computeBonusGrant({ totalSeconds: 1200, todayEarned: 3, todayDate: 'D1' }, 'D1').granted, 0));

    it('новий день скидає денний лічильник', () => {
        assert.deepEqual(
            R.computeBonusGrant({ totalSeconds: 1200, creditedSeconds: 0, balance: 0, todayEarned: 3, todayDate: 'D1' }, 'D2'),
            { granted: 2, balance: 2, creditedSeconds: 1200, todayEarned: 2, todayDate: 'D2' });
    });

    it('порожній стан не ламає функцію', () =>
        assert.equal(R.computeBonusGrant({}, 'D1').granted, 0));
});

describe('Захист від накрутки ігрового часу', () => {
    it('чесний приріст проходить', () => assert.equal(R.clampPlaytimeDelta(60, 60), 60));
    it('невеликий дрейф дозволено', () => assert.equal(R.clampPlaytimeDelta(80, 60), 80));
    it('явну накрутку зрізано', () => assert.equal(R.clampPlaytimeDelta(6000, 60), 90));
});

describe('Витрачання бонусних зірок', () => {
    it('списує рівно скільки бракує, а не скільки просять', () => {
        assert.deepEqual(R.computeBonusSpend(1, stageWith([3, 3, 2, 0]), 3, 3),
            { spend: 1, balance: 2, bonusApplied: 1, bossUnlocked: true });
    });

    it('не витрачає більше за наявний баланс', () =>
        assert.equal(R.computeBonusSpend(6, stageWith([3, 3, 0, 0]), 1, 3).spend, 1));

    it('бос уже відкритий → витрата 0', () =>
        assert.equal(R.computeBonusSpend(1, stageWith([3, 3, 3, 0]), 3, 2).spend, 0));

    it('накопичує bonusApplied до наявного', () =>
        assert.equal(R.computeBonusSpend(6, stageWith([3, 3, 2, 0], { bonusApplied: 1 }), 2, 2).bonusApplied, 3));
});

describe('Загальний прогрес', () => {
    const twoStages = progressOf({
        1: stageWith([3, 3, 3, 3], { bossDefeated: true }),
        2: stageWith([3, 2, 0, 0], { bonusApplied: 2 })
    });

    it('totalStars рахує лише зароблені, без бонусних', () =>
        assert.equal(R.getTotalStars(twoStages), 17));
    it('гру ще не пройдено', () =>
        assert.ok(!R.isGameCompleted(twoStages)));
    it('гру пройдено після перемоги над босом стадії 8', () =>
        assert.ok(R.isGameCompleted(progressOf({ 8: { bossDefeated: true } }))));
});

describe('summarizeStage — зріз для UI', () => {
    const twoStages = progressOf({
        1: stageWith([3, 3, 3, 3], { bossDefeated: true }),
        2: stageWith([3, 2, 0, 0], { bonusApplied: 2 })
    });
    const s2 = R.summarizeStage(2, twoStages);

    it('людська назва стадії', () => assert.equal(s2.name, 'Ранні часи'));
    it('зароблені зірки', () => assert.equal(s2.earnedStars, 5));
    it('вкладені бонусні', () => assert.equal(s2.bonusApplied, 2));
    it('ефективні зірки', () => assert.equal(s2.effectiveStars, 7));
    it('поріг стадії', () => assert.equal(s2.threshold, 9));
    it('скільки бракує', () => assert.equal(s2.starsNeeded, 2));
    it('бос закритий', () => assert.ok(!s2.bossUnlocked));
    it('чотири звичайні рівні у зрізі', () => assert.equal(s2.levels.length, 4));
    it('усі рівні позначені доступними (B1)', () =>
        assert.ok(s2.levels.every(l => l.unlocked)));
    it('summarizeAllStages повертає 8 стадій', () =>
        assert.equal(R.summarizeAllStages(twoStages).length, 8));
});

describe('Код підтвердження — генерація', () => {
    const uid = 'aBc123XyZuid';
    const ts = 1784000000000;
    const code = R.generateCertificateCode(uid, ts);

    it('формат LMB-XXXX-XXXX-XXXX', () =>
        assert.match(code, /^LMB(-[A-Z0-9]{4}){3}$/));
    it('детермінований для тих самих аргументів', () =>
        assert.equal(R.generateCertificateCode(uid, ts), code));
    it('інший timestamp → інший код', () =>
        assert.notEqual(R.generateCertificateCode(uid, ts + 1), code));
    it('інший uid → інший код', () =>
        assert.notEqual(R.generateCertificateCode(uid + 'x', ts), code));
    it('не містить плутаних символів I, O, 1, 0', () =>
        assert.ok(!/[IO10]/.test(code.replace(/^LMB/, '').replaceAll('-', ''))));
    it('усі символи з дозволеного алфавіту', () =>
        assert.ok(code.replace(/^LMB-/, '').replaceAll('-', '')
            .split('').every(c => CERTIFICATE.ALPHABET.includes(c))));
});

describe('Код підтвердження — звірка (case-insensitive)', () => {
    const uid = 'aBc123XyZuid';
    const ts = 1784000000000;
    const code = R.generateCertificateCode(uid, ts);

    it('точний збіг', () => assert.ok(R.verifyCertificateCode(code, uid, ts)));
    it('нижній регістр приймається', () =>
        assert.ok(R.verifyCertificateCode(code.toLowerCase(), uid, ts)));
    it('код без дефісів приймається', () =>
        assert.ok(R.verifyCertificateCode(code.replaceAll('-', ''), uid, ts)));
    it('пробіли й зайві символи ігноруються', () =>
        assert.ok(R.verifyCertificateCode('  ' + code.replaceAll('-', ' ') + ' ', uid, ts)));
    it('чужий uid не проходить', () =>
        assert.ok(!R.verifyCertificateCode(code, 'someoneElse', ts)));
    it('інший час не проходить', () =>
        assert.ok(!R.verifyCertificateCode(code, uid, ts + 1)));
    it('вигаданий код не проходить', () =>
        assert.ok(!R.verifyCertificateCode('LMB-AAAA-BBBB-CCCC', uid, ts)));
    it('порожній код не проходить', () =>
        assert.ok(!R.verifyCertificateCode('', uid, ts)));
});

describe('Код підтвердження — розподіл', () => {
    it('5000 різних uid не дають колізій', () => {
        const ts = 1784000000000;
        const codes = new Set();
        for (let i = 0; i < 5000; i++) codes.add(R.generateCertificateCode('user' + i, ts));
        assert.ok(codes.size >= 4975, `унікальних: ${codes.size} з 5000`);
    });
});

describe('Захист аргументів', () => {
    const ts = 1784000000000;

    it('стадія 0 → RangeError', () =>
        assert.throws(() => R.getBossUnlockThreshold(0), RangeError));
    it('стадія 9 → RangeError', () =>
        assert.throws(() => R.getBossUnlockThreshold(9), RangeError));
    it('uid не рядок → TypeError', () =>
        assert.throws(() => R.generateCertificateCode(null, ts), TypeError));
    it('timestamp не число → TypeError', () =>
        assert.throws(() => R.generateCertificateCode('uid', 'вчора'), TypeError));
});
