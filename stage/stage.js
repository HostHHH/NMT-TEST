// stage/stage.js
// Екран вибору рівня всередині стадії.
//
// Відкривається як stage.html?stage=1
//
// Майже вся робота вже зроблена в rules.js: summarizeStage() повертає
// готовий зріз — зірки, поріг боса, скільки бракує, чи бос відкритий.
// Тут лишається намалювати це на екрані.

import { summarizeStage } from '../core/rules.js';
import { spendBonusStars, subscribeProgress } from '../core/progressStore.js';
import { getStageParam, goToMap, goToLevel, goToBoss } from '../core/nav.js';
import { STARS_MAX_PER_LEVEL, TOTAL_STAGES } from '../core/config.js';
import { COSSACK_TEXTS } from '../core/cossack.js';

const stage = getStageParam() ?? 1;

const el = {
    name: document.getElementById('stage-name'),
    tag: document.getElementById('stage-tag'),
    starsCount: document.getElementById('stars-count'),
    bonusNote: document.getElementById('bonus-note'),
    barFill: document.getElementById('bar-fill'),
    hint: document.getElementById('hint'),
    levels: document.getElementById('levels'),
    bossCard: document.getElementById('boss-card'),
    bossIcon: document.getElementById('boss-icon'),
    bossSub: document.getElementById('boss-sub'),
    lockedMsg: document.getElementById('locked-msg'),
    back: document.getElementById('back-btn'),
    bonusBlock: document.getElementById('bonus-block'),
    bonusText: document.getElementById('bonus-text'),
    bonusBtn: document.getElementById('bonus-btn')
};

// Зберігаємо між перемальовуваннями: після витрати бонусів прогрес
// оновлюється, і треба перемалювати з новими даними.
let uid = null;
let currentProgress = null;

let lastInfo = null;
const isCossack = () => !!window.istoriyaSettings?.cossackLang;

// Три зірки: здобуті заповнені, решта порожні.
function starsText(count) {
    return '★'.repeat(count) + '☆'.repeat(STARS_MAX_PER_LEVEL - count);
}

function render(info) {
    lastInfo = info;
    const cossack = isCossack();
    const stTexts = COSSACK_TEXTS.stage;

    el.name.textContent = info.name;
    el.tag.textContent = cossack ? stTexts.stageTag(info.stage).cossack : stTexts.stageTag(info.stage).normal;

    // ── Лічильник і смуга до порогу ──
    el.starsCount.textContent = cossack
        ? stTexts.starsCount(info.effectiveStars, info.maxStars).cossack
        : stTexts.starsCount(info.effectiveStars, info.maxStars).normal;

    el.bonusNote.textContent = info.bonusApplied > 0
        ? (cossack ? stTexts.bonusNote(info.bonusApplied).cossack : stTexts.bonusNote(info.bonusApplied).normal)
        : '';

    // Смуга показує шлях саме до боса, а не до 12 зірок — гравцеві
    // важливо бачити, скільки лишилось до наступної цілі.
    const ratio = Math.min(info.effectiveStars / info.threshold, 1);
    el.barFill.style.width = `${ratio * 100}%`;
    el.barFill.classList.toggle('full', info.bossUnlocked);

    // Скидаємо видимість до базового стану на КОЖНОМУ рендері.
    el.lockedMsg.classList.add('hidden');
    el.levels.classList.remove('hidden');
    el.bossCard.classList.remove('hidden');

    const bossTitleEl = el.bossCard.querySelector('.boss-title');
    if (bossTitleEl) {
        bossTitleEl.textContent = cossack ? stTexts.bossTitle.cossack : stTexts.bossTitle.normal;
    }

    // ── Стадія закрита ──
    if (!info.unlocked) {
        el.lockedMsg.textContent = cossack ? stTexts.stageLockedMsg.cossack : stTexts.stageLockedMsg.normal;
        el.lockedMsg.classList.remove('hidden');
        el.levels.classList.add('hidden');
        el.bossCard.classList.add('hidden');
        el.hint.textContent = '';
        return;
    }

    // ── Картки рівнів ──
    el.levels.innerHTML = '';

    info.levels.forEach((lvl) => {
        const card = document.createElement('button');
        card.className = 'level-card styled';
        if (lvl.completed) card.classList.add('done');

        const isGuestLock = !uid && lvl.level > 1;
        if (isGuestLock) {
            card.classList.add('guest-locked');
            card.innerHTML = `
                <div class="level-num">${lvl.level} <span class="guest-lock-indicator">🔒</span></div>
                <div class="level-stars">${cossack ? 'замок' : 'демо-замок'}</div>
            `;
            card.addEventListener('click', () => {
                showGuestStageModal(
                    cossack ? 'Рубіж закритий у поході' : 'Рівень закритий у демо-режимі',
                    cossack
                        ? 'У розвідувальному поході відкрито 1-й рубіж. Запишись до козацького реєстру через Google, аби зняти замок з усіх рубежів та вийти на супостата!'
                        : 'У демо-режимі відкрито Рівень 1. Щоб розблокувати всі 4 рівні стадії, битву з Босом та зберігати свої зірки — увійдіть через Google!'
                );
            });
        } else {
            card.innerHTML = `
                <div class="level-num">${lvl.level}</div>
                <div class="level-stars">${starsText(lvl.stars)}</div>
            `;
            card.addEventListener('click', () => goToLevel(info.stage, lvl.level));
        }

        el.levels.appendChild(card);
    });

    // ── Бос ──
    el.bossCard.classList.remove('defeated', 'unlocked', 'locked');
    if (info.bossDefeated) {
        const isFinal = info.stage >= TOTAL_STAGES;
        el.hint.textContent = cossack ? stTexts.bossDefeatedHint(isFinal).cossack : stTexts.bossDefeatedHint(isFinal).normal;
        el.bossIcon.textContent = '🏆';
        el.bossSub.textContent = cossack ? `${stTexts.bossDefeatedSub.cossack} (натисни для реваншу)` : `${stTexts.bossDefeatedSub.normal} (натисніть, щоб перепройти)`;
        el.bossCard.classList.add('defeated');
        el.bossCard.disabled = false;
        el.bossCard.title = 'Перепройти битву з босом';
    } else if (info.bossUnlocked) {
        el.hint.textContent = cossack ? stTexts.bossReadyHint.cossack : stTexts.bossReadyHint.normal;
        el.bossIcon.textContent = '⚔';
        el.bossSub.textContent = cossack ? stTexts.bossReadySub.cossack : stTexts.bossReadySub.normal;
        el.bossCard.classList.add('unlocked');
        el.bossCard.disabled = false;
        el.bossCard.title = 'Вийти на бій з босом';
    } else {
        el.hint.textContent = cossack
            ? stTexts.bossLockedHint(info.starsNeeded, info.threshold, info.maxStars).cossack
            : stTexts.bossLockedHint(info.starsNeeded, info.threshold, info.maxStars).normal;
        el.bossIcon.textContent = '🔒';
        el.bossSub.textContent = cossack
            ? stTexts.bossLockedSub(info.threshold).cossack
            : stTexts.bossLockedSub(info.threshold).normal;
        el.bossCard.classList.add('locked');
        el.bossCard.disabled = true;
        el.bossCard.title = 'Бос заблокований';
    }
}

// Бонусний блок: пропозиція витратити зароблені в аркаді зірки на боса.
function renderBonus(info) {
    const balance = currentProgress?.bonus?.balance || 0;
    const cossack = isCossack();
    const stTexts = COSSACK_TEXTS.stage;

    // Показуємо лише коли є сенс: стадія відкрита, бос ще закритий,
    // і на балансі щось є.
    if (!info.unlocked || info.bossUnlocked || balance <= 0) {
        el.bonusBlock.classList.add('hidden');
        return;
    }

    el.bonusBlock.classList.remove('hidden');

    if (balance >= info.starsNeeded) {
        // Вистачає, щоб одразу відкрити боса.
        el.bonusText.textContent = cossack
            ? stTexts.bonusAffordText(balance).cossack
            : stTexts.bonusAffordText(balance).normal;
        el.bonusBtn.textContent = cossack
            ? stTexts.bonusAffordBtn(info.starsNeeded).cossack
            : stTexts.bonusAffordBtn(info.starsNeeded).normal;
        el.bonusBtn.classList.remove('hidden');
        el.bonusBtn.disabled = false;
    } else {
        // Замало — не даємо витратити частково (зірки списуються назавжди).
        el.bonusText.textContent = cossack
            ? stTexts.bonusShortText(balance, info.starsNeeded).cossack
            : stTexts.bonusShortText(balance, info.starsNeeded).normal;
        el.bonusBtn.classList.add('hidden');
    }
}

function refresh() {
    const info = summarizeStage(stage, currentProgress);
    render(info);
    renderBonus(info);
}

// Малюємо одразу з порожнім прогресом (щоб не було білого екрана), а далі
// підписуємось на ЖИВИЙ прогрес із Firestore.
//
// Чому підписка, а не разове window.limboReady: одноразовий знімок міг
// застигнути на застарілому стані (напр., ще не встиг долетіти запис
// перемоги над босом попередньої стадії), і екран уже ніколи не оновлювався
// — через це стадія 1 показувала «переможено», а стадія 2 «закрита».
// onSnapshot дає поточний стан сервера й сам оновлює екран, коли дані
// змінюються. Розсинхрон між екранами стає неможливим.
refresh();

if (window.limboReady) {
    window.limboReady.then((r) => {
        uid = r?.uid ?? null;
        if (!uid) {
            currentProgress = r?.progress ?? null;
            refresh();
            return;
        }
        subscribeProgress(uid, (progress) => {
            currentProgress = progress;
            // Діагностика (можна прибрати): що саме бачить цей екран.
            console.log(
                `[stage ${stage}] прогрес: stages[${stage - 1}].bossDefeated =`,
                progress?.stages?.[stage - 1]?.bossDefeated,
                '| unlocked =', summarizeStage(stage, progress).unlocked
            );
            refresh();
        });
    });
}

function showGuestStageModal(title, text) {
    const existing = document.getElementById('stage-guest-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'stage-guest-modal';
    modal.className = 'stage-guest-modal';
    modal.innerHTML = `
        <div class="stage-guest-dialog">
            <div style="font-size: 40px; margin-bottom: 8px;">🔒</div>
            <h3>${title}</h3>
            <p>${text}</p>
            <div class="stage-guest-actions">
                <button type="button" class="gold-btn" id="modal-guest-login-btn">Увійти через Google</button>
                <button type="button" class="close-btn" id="modal-guest-close-btn">Зрозуміло</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#modal-guest-login-btn').addEventListener('click', () => {
        if (typeof window.signInWithGoogle === 'function') {
            window.signInWithGoogle();
        }
    });
    modal.querySelector('#modal-guest-close-btn').addEventListener('click', () => {
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

el.back.addEventListener('click', () => goToMap());
el.bossCard.addEventListener('click', () => {
    if (!uid) {
        const cossack = isCossack();
        showGuestStageModal(
            cossack ? 'Супостат чекає на козака з реєстру' : 'Бос закритий у демо-режимі',
            cossack
                ? 'Герць із супостатом відкривається після проходження випробувань авторизованим козаком. Увійди через Google!'
                : 'Битва з Босом вимагає проходження рівнів і збереження результату. Увійдіть через Google, щоб отримати повний доступ!'
        );
        return;
    }
    goToBoss(stage);
});
window.addEventListener('cossackLangChange', () => refresh());
window.addEventListener('istoriyaAuthChange', (e) => {
    uid = e.detail?.uid ?? null;
    currentProgress = e.detail?.progress ?? null;
    const modal = document.getElementById('stage-guest-modal');
    if (modal) modal.remove();
    refresh();
});

el.bonusBtn.addEventListener('click', async () => {
    if (!uid) return;

    const needed = summarizeStage(stage, currentProgress).starsNeeded;
    el.bonusBtn.disabled = true;

    try {
        const res = await spendBonusStars(uid, stage, needed);
        currentProgress = res.progress;   // прогрес оновлено — перемальовуємо
        refresh();
    } catch (error) {
        console.error('Не вдалося витратити бонусні зірки:', error);
        el.bonusBtn.disabled = false;
    }
});
