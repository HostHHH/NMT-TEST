// tests/nav.test.js
// Тести маршрутизації. Перевіряються лише чисті функції — обгортки, що
// звертаються до window.location, у Node не мають сенсу.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as N from '../core/nav.js';

describe('resolveRootPrefix — глибина сторінки', () => {
    it('корінь сайту', () =>
        assert.equal(N.resolveRootPrefix('/index.html'), ''));
    it('сторінка в теці', () =>
        assert.equal(N.resolveRootPrefix('/home/index.html'), '../'));
    it('карта', () =>
        assert.equal(N.resolveRootPrefix('/map/map.html'), '../'));
    it('бос (тека з дефісом)', () =>
        assert.equal(N.resolveRootPrefix('/boss-test/index.html'), '../'));

    // Найважливіший випадок: сайт роздається не з кореня домену,
    // як на GitHub Pages (user.github.io/limbo/...).
    it('підкаталог розгортання — корінь', () =>
        assert.equal(N.resolveRootPrefix('/limbo/index.html'), ''));
    it('підкаталог розгортання — сторінка в теці', () =>
        assert.equal(N.resolveRootPrefix('/limbo/home/index.html'), '../'));

    it('шлях без імені файлу', () =>
        assert.equal(N.resolveRootPrefix('/game/'), '../'));
    it('порожній шлях', () =>
        assert.equal(N.resolveRootPrefix(''), ''));
    it('null не ламає функцію', () =>
        assert.equal(N.resolveRootPrefix(null), ''));
});

describe('buildUrl', () => {
    it('без параметрів з кореня', () =>
        assert.equal(N.buildUrl('map/map.html', {}, '/index.html'), 'map/map.html'));
    it('без параметрів із теки', () =>
        assert.equal(N.buildUrl('map/map.html', {}, '/home/index.html'), '../map/map.html'));
    it('з параметрами', () =>
        assert.equal(N.buildUrl('test/test.html', { stage: 3, level: 2 }, '/map/map.html'),
            '../test/test.html?stage=3&level=2'));
    it('null-параметри пропускаються', () =>
        assert.equal(N.buildUrl('a/b.html', { stage: 1, level: null }, ''), 'a/b.html?stage=1'));
});

describe('Побудова маршрутів', () => {
    it('stageUrl', () =>
        assert.equal(N.stageUrl(4, '/map/map.html'), '../stage/stage.html?stage=4'));
    it('levelUrl', () =>
        assert.equal(N.levelUrl(2, 3, '/stage/stage.html'), '../test/test.html?stage=2&level=3'));
    it('bossUrl', () =>
        assert.equal(N.bossUrl(7, '/stage/stage.html'), '../boss-test/index.html?stage=7'));
    it('mapUrl з кореня', () =>
        assert.equal(N.mapUrl('/index.html'), 'map/map.html'));
});

describe('parseStage', () => {
    it('коректна стадія', () => assert.equal(N.parseStage('?stage=5'), 5));
    it('перша стадія', () => assert.equal(N.parseStage('?stage=1'), 1));
    it('остання стадія', () => assert.equal(N.parseStage('?stage=8'), 8));
    it('поза межами згори', () => assert.equal(N.parseStage('?stage=9'), null));
    it('нуль', () => assert.equal(N.parseStage('?stage=0'), null));
    it('від’ємна', () => assert.equal(N.parseStage('?stage=-1'), null));
    it('дробова', () => assert.equal(N.parseStage('?stage=2.5'), null));
    it('не число', () => assert.equal(N.parseStage('?stage=abc'), null));
    it('порожнє значення', () => assert.equal(N.parseStage('?stage='), null));
    it('параметра немає', () => assert.equal(N.parseStage('?level=2'), null));
    it('порожній рядок запиту', () => assert.equal(N.parseStage(''), null));
    it('серед інших параметрів', () => assert.equal(N.parseStage('?level=2&stage=6'), 6));
});

describe('parseLevel', () => {
    it('звичайний рівень', () => assert.equal(N.parseLevel('?level=3'), 3));
    it('бос-рівень допускається', () => assert.equal(N.parseLevel('?level=5'), 5));
    it('поза межами', () => assert.equal(N.parseLevel('?level=6'), null));
    it('нуль', () => assert.equal(N.parseLevel('?level=0'), null));
    it('не число', () => assert.equal(N.parseLevel('?level=x'), null));
});

describe('isNormalLevel', () => {
    it('1..4 — звичайні', () =>
        assert.deepEqual([1, 2, 3, 4].map(N.isNormalLevel), [true, true, true, true]));
    it('5 — бос, не звичайний', () => assert.equal(N.isNormalLevel(5), false));
    it('null', () => assert.equal(N.isNormalLevel(null), false));
});

describe('Повний цикл: побудова → розбір', () => {
    it('stage і level переживають дорогу туди й назад', () => {
        const url = N.levelUrl(6, 4, '/stage/stage.html');
        const search = url.slice(url.indexOf('?'));

        assert.equal(N.parseStage(search), 6);
        assert.equal(N.parseLevel(search), 4);
    });

    it('посилання на боса розбирається тією ж функцією', () => {
        const url = N.bossUrl(8, '/stage/stage.html');
        assert.equal(N.parseStage(url.slice(url.indexOf('?'))), 8);
    });
});
