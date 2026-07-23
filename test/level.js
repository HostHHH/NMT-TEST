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
import { getStageParam, getLevelParam, goToMap, isNormalLevel } from '../core/nav.js';
import { STARS_MAX_PER_LEVEL } from '../core/config.js';

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
    map: document.getElementById('map-btn'),
    back: document.getElementById('back-btn')
};

el.title.textContent = `${meta.name} · рівень ${level}`;

// ── Показ питання ────────────────────────────────────────────────────

function render() {
    const q = questions[index];

    answered = false;
    el.counter.textContent = `${index + 1} / ${questions.length}`;
    el.question.textContent = q.text;
    el.explanation.classList.add('hidden');
    el.next.disabled = true;
    el.next.textContent = index === questions.length - 1 ? 'Результат →' : 'Далі →';

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

    el.result.classList.remove('hidden');

    // Три зірки: здобуті — заповнені, решта — порожні.
    el.stars.textContent = '★'.repeat(stars) + '☆'.repeat(STARS_MAX_PER_LEVEL - stars);
    el.stars.classList.toggle('failed', stars === 0);

    el.score.textContent = `${correctCount} з ${questions.length}`;
    el.verdict.textContent = passed
        ? (stars === STARS_MAX_PER_LEVEL ? 'Бездоганно!' : 'Рівень пройдено')
        : 'Рівень не зараховано — потрібно щонайменше 3 правильні';

    await save();
}

async function save() {
    el.saveState.textContent = 'Збереження…';

    try {
        // main.js резолвить цей промис після входу й ініціалізації прогресу.
        const { uid } = await window.limboReady;

        if (!uid) {
            el.saveState.textContent = 'Не збережено: ви не увійшли';
            return;
        }

        const result = await saveLevelResult(uid, stage, level, correctCount);

        el.saveState.textContent = result.improved
            ? 'Новий найкращий результат збережено'
            : 'Збережено (попередній результат кращий)';
    } catch (error) {
        // Прогрес не зберігся, але результат гравець уже бачить —
        // рівень не має "зникати" через проблему з мережею.
        console.error('Не вдалося зберегти результат:', error);
        el.saveState.textContent = 'Не вдалося зберегти прогрес';
    }
}

// ── Обробники ────────────────────────────────────────────────────────

el.next.addEventListener('click', next);
el.back.addEventListener('click', () => goToMap());
el.map.addEventListener('click', () => goToMap());
el.retry.addEventListener('click', () => window.location.reload());

render();
