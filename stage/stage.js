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

// Три зірки: здобуті заповнені, решта порожні.
function starsText(count) {
    return '★'.repeat(count) + '☆'.repeat(STARS_MAX_PER_LEVEL - count);
}

function render(info) {
    el.name.textContent = info.name;
    el.tag.textContent = `стадія ${info.stage} з 8`;

    // ── Лічильник і смуга до порогу ──
    el.starsCount.textContent = `⭐ ${info.effectiveStars} / ${info.maxStars}`;
    el.bonusNote.textContent = info.bonusApplied > 0
        ? `(з них ${info.bonusApplied} бонусних)`
        : '';

    // Смуга показує шлях саме до боса, а не до 12 зірок — гравцеві
    // важливо бачити, скільки лишилось до наступної цілі.
    const ratio = Math.min(info.effectiveStars / info.threshold, 1);
    el.barFill.style.width = `${ratio * 100}%`;
    el.barFill.classList.toggle('full', info.bossUnlocked);

    // Скидаємо видимість до базового стану на КОЖНОМУ рендері. Без цього
    // перехід «закрита → відкрита» (коли підписка приносить свіжі дані)
    // лишав би рівні схованими, а напис «закрита» — видимим, хоча дані
    // вже кажуть unlocked=true. render() має повністю задавати вигляд із
    // info, а не залежати від попереднього стану DOM.
    el.lockedMsg.classList.add('hidden');
    el.levels.classList.remove('hidden');
    el.bossCard.classList.remove('hidden');

    // ── Стадія закрита ──
    if (!info.unlocked) {
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

        card.innerHTML = `
            <div class="level-num">${lvl.level}</div>
            <div class="level-stars">${starsText(lvl.stars)}</div>
        `;
        card.addEventListener('click', () => goToLevel(info.stage, lvl.level));
        el.levels.appendChild(card);
    });

    // ── Бос ──
    if (info.bossDefeated) {
        el.hint.textContent = info.stage < TOTAL_STAGES
            ? 'Боса переможено — наступна стадія відкрита'
            : 'Боса переможено — гру пройдено!';
        el.bossIcon.textContent = '🏆';
        el.bossSub.textContent = 'Переможено';
        el.bossCard.classList.add('defeated');
        el.bossCard.disabled = false;
    } else if (info.bossUnlocked) {
        el.hint.textContent = 'Боса відкрито — час для бою';
        el.bossIcon.textContent = '⚔';
        el.bossSub.textContent = 'Виклик прийнято?';
        el.bossCard.classList.add('unlocked');
        el.bossCard.disabled = false;
    } else {
        el.hint.textContent =
            `Ще ${info.starsNeeded} ⭐ до боса (потрібно ${info.threshold} з ${info.maxStars})`;
        el.bossIcon.textContent = '🔒';
        el.bossSub.textContent = `Потрібно ${info.threshold} ⭐`;
        el.bossCard.disabled = true;
    }
}

// Бонусний блок: пропозиція витратити зароблені в аркаді зірки на боса.
function renderBonus(info) {
    const balance = currentProgress?.bonus?.balance || 0;

    // Показуємо лише коли є сенс: стадія відкрита, бос ще закритий,
    // і на балансі щось є.
    if (!info.unlocked || info.bossUnlocked || balance <= 0) {
        el.bonusBlock.classList.add('hidden');
        return;
    }

    el.bonusBlock.classList.remove('hidden');

    if (balance >= info.starsNeeded) {
        // Вистачає, щоб одразу відкрити боса.
        el.bonusText.textContent = `Бонусних ★: ${balance}`;
        el.bonusBtn.textContent = `Відкрити боса за ${info.starsNeeded} ★`;
        el.bonusBtn.classList.remove('hidden');
        el.bonusBtn.disabled = false;
    } else {
        // Замало — не даємо витратити частково (зірки списуються назавжди).
        el.bonusText.textContent =
            `Бонусних ★: ${balance}. До боса бракує ${info.starsNeeded} — заробляй час в аркаді.`;
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

el.back.addEventListener('click', () => goToMap());
el.bossCard.addEventListener('click', () => goToBoss(stage));

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
