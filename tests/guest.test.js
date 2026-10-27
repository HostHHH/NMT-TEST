// tests/guest.test.js
// Тестування логіки та стану Демо-режиму (Гостьовий доступ для журі).

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createEmptyProgress,
    isStageUnlocked,
    isLevelUnlocked,
    isBossUnlocked,
    calculateStars,
    isLevelPassed,
    summarizeStage,
    summarizeAllStages
} from '../core/rules.js';

import {
    ROUTES,
    TOTAL_STAGES,
    NORMAL_LEVELS_PER_STAGE,
    STAGES
} from '../core/config.js';

import {
    buildUrl,
    resolveRootPrefix,
    lobbyUrl,
    aboutUrl,
    mapUrl,
    stageUrl,
    levelUrl
} from '../core/nav.js';

test('Демо-режим: початковий порожній прогрес гостя', () => {
    const progress = createEmptyProgress();

    assert.equal(progress.totalStars, 0, 'Початкові зірки гостя мають дорівнювати 0');
    assert.equal(progress.certificate, null, 'У гостя спочатку немає грамоти');
    assert.equal(typeof progress.stages, 'object', 'Стадії мають бути обʼєктом');
    assert.equal(Object.keys(progress.stages).length, TOTAL_STAGES, 'Усі 8 стадій мають бути присутні');

    // Стадія 1 відкрита за замовчуванням
    assert.equal(isStageUnlocked(1, progress), true, 'Стадія 1 має бути доступною для гостя');

    // Стадії 2-8 закриті
    for (let s = 2; s <= TOTAL_STAGES; s++) {
        assert.equal(isStageUnlocked(s, progress), false, `Стадія ${s} має бути закритою без проходження попередньої`);
    }

    // Бос стадії 1 закритий (потрібно 9 зірок)
    assert.equal(isBossUnlocked(1, progress), false, 'Бос 1 стадії має бути закритим');
});

test('Демо-режим: зріз стадії 1 для гостя', () => {
    const progress = createEmptyProgress();
    const summary = summarizeStage(1, progress);

    assert.equal(summary.stage, 1);
    assert.equal(summary.unlocked, true, 'Стадія 1 розблокована');
    assert.equal(summary.earnedStars, 0);
    assert.equal(summary.effectiveStars, 0);
    assert.equal(summary.threshold, STAGES[1].bossUnlockStars);
    assert.equal(summary.starsNeeded, STAGES[1].bossUnlockStars);
    assert.equal(summary.bossUnlocked, false);
    assert.equal(summary.bossDefeated, false);
    assert.equal(summary.levels.length, NORMAL_LEVELS_PER_STAGE);

    // Перший рівень стадії 1 доступний
    assert.equal(summary.levels[0].level, 1);
    assert.equal(summary.levels[0].completed, false);
    assert.equal(summary.levels[0].stars, 0);
});

test('Демо-режим: проходження Рівня 1 розраховує зірки без помилок', () => {
    // 5 правильних відповідей із 5
    assert.equal(calculateStars(5), 3, '5/5 дає 3 зірки');
    assert.equal(isLevelPassed(5), true, '5/5 зараховано');

    // 4 правильних із 5
    assert.equal(calculateStars(4), 2, '4/5 дає 2 зірки');
    assert.equal(isLevelPassed(4), true, '4/5 зараховано');

    // 3 правильних із 5
    assert.equal(calculateStars(3), 1, '3/5 дає 1 зірку');
    assert.equal(isLevelPassed(3), true, '3/5 зараховано');

    // Менше 3 правильних
    assert.equal(calculateStars(2), 0, '2/5 не дає зірок');
    assert.equal(isLevelPassed(2), false, '2/5 не зараховано');
});

test('Демо-режим: маршрутизація відвідувача', () => {
    // Демо-клік веде на Про проєкт
    assert.equal(aboutUrl('lobby/lobby.html'), '../about/about.html');
    assert.equal(mapUrl('about/about.html'), '../map/map.html');
    assert.equal(stageUrl(1, 'map/map.html'), '../stage/stage.html?stage=1');
    assert.equal(levelUrl(1, 1, 'stage/stage.html'), '../test/test.html?stage=1&level=1');
});
