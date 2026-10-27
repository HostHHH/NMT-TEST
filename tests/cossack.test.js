// tests/cossack.test.js
// Тести словника, функцій динамічного форматування та перемикання «Козацька мова».

import test from 'node:test';
import assert from 'node:assert/strict';
import { COSSACK_TEXTS, t } from '../core/cossack.js';

test('t() повертає правильний рядок залежно від прапорця', () => {
    const entry = { normal: 'Карта', cossack: 'Мапа походів' };
    assert.equal(t(entry, false), 'Карта');
    assert.equal(t(entry, true), 'Мапа походів');
    assert.equal(t(null, true), '');
});

test('Навігація містить усі затверджені козацькі еквіваленти', () => {
    assert.equal(COSSACK_TEXTS.nav.logo.cossack, 'Козацька iSторія');
    assert.equal(COSSACK_TEXTS.nav.map.cossack, 'Мапа походів');
    assert.equal(COSSACK_TEXTS.nav.game.cossack, 'Січовий герць');
    assert.equal(COSSACK_TEXTS.nav.about.cossack, 'Про козацьку справу');
    assert.equal(COSSACK_TEXTS.nav.settings.cossack, 'Козацький лад');
    assert.equal(COSSACK_TEXTS.nav.logout.cossack, 'Зійти з коня');
});

test('Бігуча стрічка має правильний заголовок', () => {
    assert.equal(COSSACK_TEXTS.ticker.badge.cossack, 'ГЕТЬМАНСЬКИЙ УНІВЕРСАЛ & РОК-ЛЕГЕНДИ');
    assert.equal(COSSACK_TEXTS.ticker.badge.normal, 'ГЕТЬМАНИ & РОК-ЛЕГЕНДИ');
});

test('Розділ налаштувань містить переклади музики, стилю та тумблерів', () => {
    const s = COSSACK_TEXTS.settings;
    assert.equal(s.musicTitle.cossack, 'Січові музики');
    assert.equal(s.chipMetal.cossack, 'Гуркіт гармат');
    assert.equal(s.chipPop.cossack, 'Ярмаркові приспівки');
    assert.equal(s.chipUkr.cossack, 'Дніпровський вайб');
    assert.equal(s.chipLofi.cossack, 'Спочинок біля ватри');
    assert.equal(s.chipEpic.cossack, 'Кобзарські думи');

    assert.equal(s.styleTitle.cossack, 'Шати та барви куреня');
    assert.equal(s.presetNight.cossack, 'Нічна варта');
    assert.equal(s.presetSteppe.cossack, 'Дике Поле');
    assert.equal(s.presetForest.cossack, 'Холодний Яр');
    assert.equal(s.presetClay.cossack, 'Опішнянська глина');
    assert.equal(s.presetGraphite.cossack, 'Гарматний порох');

    assert.equal(s.optVoiceTitle.cossack, 'Брязкіт зброї у грі');
    assert.equal(s.optCossackTitle.cossack, 'Січова говірка');
    assert.equal(s.optFontsTitle.cossack, 'Писарське письмо');
    assert.equal(s.optBackTitle.cossack, 'Полотно шатра');
    assert.equal(s.optThingsTitle.cossack, 'Отаманський відблиск');
});

test('Динамічні тексти стадії та боса коректно інтерполюють змінні', () => {
    const st = COSSACK_TEXTS.stage;
    assert.equal(st.stageTag(3).normal, 'стадія 3 з 8');
    assert.equal(st.stageTag(3).cossack, 'рубіж 3 з 8');

    assert.equal(st.starsCount(9, 12).normal, '⭐ 9 / 12');
    assert.equal(st.starsCount(9, 12).cossack, '⭐ 9 / 12 звитяг');

    assert.equal(st.bonusNote(2).cossack, '(з них 2 характерницьких)');

    assert.equal(st.bossLockedHint(3, 9, 12).cossack, 'Ще 3 ⭐ слави до ворожого ватажка (треба 9 з 12)');
    assert.equal(st.bossLockedSub(9).cossack, 'Треба здобути 9 ⭐ слави');

    assert.equal(st.bossDefeatedHint(false).cossack, 'Ворога розбито вщент — шлях до нового походу відкритий!');
    assert.equal(st.bossDefeatedHint(true).cossack, 'Усіх супостатів подолано — козацька слава на віки!');
});

test('Динамічні тексти тесту та фіналу коректно формують повідомлення', () => {
    const tst = COSSACK_TEXTS.test;
    assert.equal(tst.questionNum(2, 5).cossack, 'Випробування 2 з 5');
    assert.equal(tst.score(4, 5).cossack, 'Влучив 4 з 5 разів');
    assert.equal(tst.verdictPerfect.cossack, 'Чиста звитяга! Любо глянути!');
    assert.equal(tst.verdictPassed.cossack, 'Рубіж здолано!');
    assert.equal(tst.verdictFailed.cossack, 'Відступили з поля бою — треба щонайменше 3 вірні відповіді!');
    assert.equal(tst.saveSaved.cossack, 'До козацького реєстру записано!');
});

test('Динамічні тексти бою з босом', () => {
    const b = COSSACK_TEXTS.boss;
    assert.equal(b.hpText(4, 6).normal, 'HP 4 / 6');
    assert.equal(b.hpText(4, 6).cossack, 'Снага 4 / 6');
    assert.equal(b.winTitle.cossack, 'Слава! Козацька звитяга!');
    assert.equal(b.winText('Хранитель').cossack, 'Хранитель повалений у степовий порох!');
    assert.equal(b.loseTitle.cossack, 'Шабля щербата...');
    assert.equal(b.certCode('IST-1234-5678-9012').cossack, 'Вірча грамота лицаря: IST-1234-5678-9012');
});

test('Лоббі містить козацькі відповідники блоків та цитати', () => {
    const l = COSSACK_TEXTS.lobby;
    assert.equal(l.loginBtn.cossack, 'Записатися до реєстру через Google');
    assert.equal(l.card1Title.cossack, '3D Куля земна & 8 Великих походів');
    assert.equal(l.card2Title.cossack, 'Герці з лютими супостатами');
    assert.equal(l.card3Title.cossack, 'Зорі слави та характерницька здобич');
    assert.equal(l.aboutTitle.cossack, 'ПРО КОЗАЦЬКУ СПРАВУ');
});
