// test/level.js
// Проходження одного звичайного рівня: 5 питань → зірки → запис у Firestore.
//
// Замінює стару test/arrays.js, яка тримала питання у чотирьох паралельних
// масивах і завжди брала їх з одного й того ж діапазону індексів.
//
// Який рівень грати — визначає URL: test.html?stage=1&level=1

import { getLevelQuestions, getStageMeta } from '../core/questions.js';
import { calculateStars, isLevelPassed } from '../core/rules.js';
import { saveLevelResult } from '../core/progressStore.js';
import { getStageParam, getLevelParam, goToMap, goToStage, isNormalLevel } from '../core/nav.js';
import { STARS_MAX_PER_LEVEL } from '../core/config.js';
import { COSSACK_TEXTS } from '../core/cossack.js';

const isCossack = () => !!window.istoriyaSettings?.cossackLang;

// ── Що саме граємо ───────────────────────────────────────────────────
// Якщо параметрів немає (зайшли напряму) — беремо перший рівень.
const stage = getStageParam() ?? 1;
const level = getLevelParam() ?? 1;

// Бос живе на окремій сторінці (Етап 5). Сюди він потрапити не має.
if (!isNormalLevel(level)) {
    goToMap();
}

const questions = getLevelQuestions(stage, level);
const meta = getStageMeta(stage);

// ── Стан проходження ─────────────────────────────────────────────────
let index = 0;          // яке питання показуємо
let correctCount = 0;   // скільки правильних
let answered = false;   // чи вже відповіли на поточне

const el = {
    title: document.getElementById('level-title'),
    counter: document.getElementById('counter'),
    question: document.getElementById('question'),
    answers: document.getElementById('answers'),
    explanation: document.getElementById('explanation'),
    next: document.getElementById('next-btn'),
    result: document.getElementById('result'),
    stars: document.getElementById('stars'),
    score: document.getElementById('score'),
    verdict: document.getElementById('verdict'),
    saveState: document.getElementById('save-state'),
    retry: document.getElementById('retry-btn'),
    stage: document.getElementById('stage-btn'),
    map: document.getElementById('map-btn'),
    back: document.getElementById('back-btn')
};

el.title.textContent = `${meta.name} · рівень ${level}`;

// ── Показ питання ────────────────────────────────────────────────────

function render() {
    const q = questions[index];
    const cossack = isCossack();

    answered = false;
    el.counter.textContent = cossack
        ? COSSACK_TEXTS.test.questionNum(index + 1, questions.length).cossack
        : `${index + 1} / ${questions.length}`;
    el.question.textContent = q.text;
    el.explanation.classList.add('hidden');
    el.next.disabled = true;
    el.next.textContent = index === questions.length - 1
        ? (cossack ? COSSACK_TEXTS.test.btnResult.cossack : 'Результат →')
        : (cossack ? COSSACK_TEXTS.test.btnNext.cossack : 'Далі →');

    // Кнопки створюються заново на кожне питання. Так не доводиться
    // вручну знімати класи correct/wrong і старі обробники.
    el.answers.innerHTML = '';

    q.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn styled';
        btn.textContent = option;
        // addEventListener, а не onclick у розмітці: модулі не потрапляють
        // у глобальну область, тож інлайнові обробники тут не спрацювали б.
        btn.addEventListener('click', () => answer(i));
        el.answers.appendChild(btn);
    });
}

function answer(chosen) {
    if (answered) return;   // захист від подвійного кліку
    answered = true;

    const q = questions[index];
    const buttons = [...el.answers.children];

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add('correct');
        else if (i === chosen) btn.classList.add('wrong');
    });

    if (chosen === q.correctIndex) correctCount++;

    // Пояснення показуємо завжди — і після помилки, і після правильної
    // відповіді. У цьому ж і сенс: рівень має вчити, а не лише оцінювати.
    el.explanation.textContent = q.explanation;
    el.explanation.classList.remove('hidden');
    el.next.disabled = false;
}

function next() {
    index++;
    if (index < questions.length) {
        render();
    } else {
        finish();
    }
}

// ── Результат ────────────────────────────────────────────────────────

async function finish() {
    const stars = calculateStars(correctCount);
    const passed = isLevelPassed(correctCount);
    const cossack = isCossack();
    const tTexts = COSSACK_TEXTS.test;

    el.result.classList.remove('hidden');

    // Три зірки: здобуті — заповнені, решта — порожні.
    el.stars.textContent = '★'.repeat(stars) + '☆'.repeat(STARS_MAX_PER_LEVEL - stars);
    el.stars.classList.toggle('failed', stars === 0);

    el.score.textContent = cossack
        ? tTexts.score(correctCount, questions.length).cossack
        : `${correctCount} з ${questions.length}`;

    el.verdict.textContent = passed
        ? (stars === STARS_MAX_PER_LEVEL
            ? (cossack ? tTexts.verdictPerfect.cossack : 'Бездоганно!')
            : (cossack ? tTexts.verdictPassed.cossack : 'Рівень пройдено'))
        : (cossack ? tTexts.verdictFailed.cossack : 'Рівень не зараховано — потрібно щонайменше 3 правильні');

    if (el.stage) el.stage.textContent = cossack ? tTexts.btnToLevels.cossack : 'До списку рівнів';
    if (el.retry) el.retry.textContent = cossack ? tTexts.btnRetry.cossack : 'Ще раз';
    if (el.map) el.map.textContent = cossack ? tTexts.btnMap.cossack : 'Карта 3D';

    await save();
}

async function save() {
    const cossack = isCossack();
    const tTexts = COSSACK_TEXTS.test;
    el.saveState.textContent = cossack ? tTexts.saveSaving.cossack : 'Збереження…';

    try {
        // main.js резолвить цей промис після входу й ініціалізації прогресу.
        const { uid } = await window.limboReady;

        if (!uid) {
            el.saveState.textContent = cossack ? tTexts.saveGuest.cossack : 'Не збережено: ви не увійшли';
            renderGuestPrompt();
            return;
        }

        const result = await saveLevelResult(uid, stage, level, correctCount);

        el.saveState.textContent = cossack
            ? tTexts.saveSaved.cossack
            : (result.improved ? 'Новий найкращий результат збережено' : 'Збережено (попередній результат кращий)');
    } catch (error) {
        // Прогрес не зберігся, але результат гравець уже бачить —
        // рівень не має "зникати" через проблему з мережею.
        console.error('Не вдалося зберегти результат:', error);
        el.saveState.textContent = 'Не вдалося зберегти прогрес';
    }
}

function renderGuestPrompt() {
    const existing = document.getElementById('guest-prompt-box');
    if (existing) existing.remove();

    const cossack = isCossack();
    const box = document.createElement('div');
    box.id = 'guest-prompt-box';
    box.className = 'guest-prompt-box';
    box.innerHTML = `
        <div class="guest-prompt-badge">⚡ ${cossack ? 'ОЗНАЙОМЧИЙ ПОХІД' : 'ДЕМО-РЕЖИМ ЗАВЕРШЕНО'}</div>
        <h3 class="guest-prompt-title">${cossack ? 'Славний початок, лицарю!' : 'Звитяжний початок!'}</h3>
        <p class="guest-prompt-text">
            ${cossack
                ? 'Назви своє ім\'я писарю (увійди через Google), аби записати свій бал у козацький реєстр та розблокувати всі 8 рубежів із супостатами!'
                : 'Зареєструйся через Google, щоб зафіксувати свій бал у реєстрі та розблокувати решту 7 стадій і битви з босами.'}
        </p>
        <button type="button" class="guest-prompt-btn" id="guest-auth-now-btn">
            <span>${cossack ? 'Записатися до реєстру через Google' : 'Зареєструватися через Google'}</span>
            <span>➔</span>
        </button>
    `;

    const actions = el.result.querySelector('.result-actions');
    if (actions) {
        el.result.insertBefore(box, actions);
    } else {
        el.result.appendChild(box);
    }

    const btn = box.querySelector('#guest-auth-now-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            if (typeof window.signInWithGoogle === 'function') {
                btn.disabled = true;
                btn.textContent = 'Авторизація…';
                try {
                    await window.signInWithGoogle();
                } catch (e) {
                    console.error('Помилка авторизації з результату:', e);
                    btn.disabled = false;
                    btn.textContent = 'Спробувати знову';
                }
            }
        });
    }
}

window.addEventListener('istoriyaAuthChange', async (e) => {
    const newUid = e.detail?.uid;
    if (newUid) {
        try {
            await saveLevelResult(newUid, stage, level, correctCount);
            el.saveState.textContent = isCossack() ? COSSACK_TEXTS.test.saveSaved.cossack : 'Збережено в базі даних!';
            const box = document.getElementById('guest-prompt-box');
            if (box) {
                box.innerHTML = `
                    <div class="guest-prompt-badge">✓ УСПІШНО АВТОРИЗОВАНО</div>
                    <h3 class="guest-prompt-title">Бал зафіксовано в базі!</h3>
                    <p class="guest-prompt-text">Тепер усі 8 стадій та збереження доступні для тебе.</p>
                `;
            }
        } catch (err) {
            console.error('Помилка збереження після авторизації:', err);
        }
    }
});

// ── Обробники ────────────────────────────────────────────────────────

el.next.addEventListener('click', next);
el.back.addEventListener('click', () => goToStage(stage));
el.stage?.addEventListener('click', () => goToStage(stage));
el.map?.addEventListener('click', () => goToMap());
el.retry.addEventListener('click', () => window.location.reload());

render();
