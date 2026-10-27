// boss-test/script.js
// Бій з босом стадії.
//
// Правила бою:
//   HP боса = 6, у гравця 3 життя.
//   Правильна відповідь — мінус 1 HP боса, неправильна — мінус 1 життя.
//   Колода з 11 питань (6 боссових + 5 запасних), бо в найгіршому випадку
//   бій триває 8 питань: 6 влучань + 2 промахи. Якби колода дорівнювала
//   HP, будь-яка помилка робила б перемогу неможливою, а життя — марними.
//
// Відкривається як index.html?stage=1
// Якщо бос ще не розблокований — повертає на екран стадії.

import { getBossFightDeck } from '../core/questions.js';
import { summarizeStage } from '../core/rules.js';
import { saveBossVictory } from '../core/progressStore.js';
import { getStageParam, goToStage } from '../core/nav.js';
import { BOSS } from '../core/config.js';
import { COSSACK_TEXTS } from '../core/cossack.js';
import { generateUniversal, downloadUniversal } from './certificate.js';

const isCossack = () => !!window.istoriyaSettings?.cossackLang;

// ── Фоновий рушій (без змін) ─────────────────────────────────────────

const BOSS_BG_STATE_CONFIG = {
    idle: {
        particleCount: 70, speedMin: 0.15, speedMax: 0.45, sizeMin: 1, sizeMax: 3,
        colors: ['rgba(255,140,60,0.8)', 'rgba(180,80,255,0.6)', 'rgba(255,200,120,0.7)'],
        glow: 6, swayAmount: 0.6, erraticFactor: 0.05, drift: { x: 0, y: -1 }
    },
    critical: {
        particleCount: 110, speedMin: 0.6, speedMax: 1.8, sizeMin: 1, sizeMax: 4,
        colors: ['rgba(255,40,0,0.9)', 'rgba(255,120,0,0.8)', 'rgba(255,220,80,0.7)'],
        glow: 12, swayAmount: 1.4, erraticFactor: 0.35, drift: { x: 0, y: -1.6 }
    },
    victory: {
        particleCount: 90, speedMin: 0.1, speedMax: 0.35, sizeMin: 1, sizeMax: 3.5,
        colors: ['rgba(255,246,200,0.9)', 'rgba(255,215,0,0.8)', 'rgba(255,236,150,0.7)'],
        glow: 18, swayAmount: 0.5, erraticFactor: 0.02, drift: { x: 0, y: -0.8 }
    }
};

class BossBgParticle {
    constructor(width, height) { this.reset(width, height, true); }

    reset(width, height, initial) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.phase = Math.random() * Math.PI * 2;
        this.alpha = 0.4 + Math.random() * 0.6;
        this.twinkleSpeed = 1 + Math.random() * 2;
    }

    configure(config) {
        this.speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        this.size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
    }

    update(dt, width, height, config, time) {
        const sway = Math.sin(time * 0.001 * this.twinkleSpeed + this.phase) * config.swayAmount;
        const jitterX = (Math.random() - 0.5) * config.erraticFactor * 60;
        const jitterY = (Math.random() - 0.5) * config.erraticFactor * 60;
        this.x += (config.drift.x * this.speed + sway * 0.3 + jitterX) * dt;
        this.y += (config.drift.y * this.speed + jitterY) * dt;
        if (this.y < -10 || this.x < -20 || this.x > width + 20) {
            this.reset(width, height, false);
            this.configure(config);
        }
    }

    draw(ctx, config) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = config.glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class BossBackgroundController {
    constructor(canvas, rootEl) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.root = rootEl;
        this.flashEl = rootEl.querySelector('.boss-bg__flash');
        this.particles = [];
        this.state = 'idle';
        this.lastTime = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);

        this.resize();
        this.spawnParticles();
        window.addEventListener('resize', this.resize);
        this.flashEl.addEventListener('animationend', () => this.flashEl.classList.remove('is-active'));
        document.body.addEventListener('animationend', (e) => {
            if (e.animationName === 'bossShake') document.body.classList.remove('screen-shake');
        });

        requestAnimationFrame(this.loop);
    }

    resize() {
        const { innerWidth: w, innerHeight: h } = window;
        this.width = w;
        this.height = h;
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    spawnParticles() {
        const config = BOSS_BG_STATE_CONFIG[this.state];
        this.particles = Array.from({ length: config.particleCount }, () => {
            const p = new BossBgParticle(this.width, this.height);
            p.configure(config);
            return p;
        });
    }

    setState(state) {
        if (!BOSS_BG_STATE_CONFIG[state] || state === this.state) return;
        this.state = state;
        this.root.classList.remove('state-idle', 'state-critical', 'state-victory');
        this.root.classList.add('state-' + state);

        const config = BOSS_BG_STATE_CONFIG[state];
        if (this.particles.length < config.particleCount) {
            while (this.particles.length < config.particleCount) {
                const p = new BossBgParticle(this.width, this.height);
                p.configure(config);
                this.particles.push(p);
            }
        } else {
            this.particles.length = config.particleCount;
        }
        this.particles.forEach((p) => p.configure(config));
    }

    triggerDamage() {
        this.flashEl.classList.remove('is-active');
        void this.flashEl.offsetWidth;
        this.flashEl.classList.add('is-active');

        document.body.classList.remove('screen-shake');
        void document.body.offsetWidth;
        document.body.classList.add('screen-shake');
    }

    loop(time) {
        const dt = Math.min((time - this.lastTime) / 16.67, 3) || 1;
        this.lastTime = time;
        const config = BOSS_BG_STATE_CONFIG[this.state];

        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const p of this.particles) {
            p.update(dt, this.width, this.height, config, time);
            p.draw(this.ctx, config);
        }
        requestAnimationFrame(this.loop);
    }
}

// ── Боси ─────────────────────────────────────────────────────────────
// Плейсхолдери: емодзі замість портретів. Раніше тут стояли посилання
// на фото з Вікіпедії — для роботи їх усе одно довелося б замінити
// через ліцензії. Імена нейтральні, прив'язані до теми стадії.

const BOSSES = {
    1: { name: 'Хранитель Витоків', icon: '🛡' },
    2: { name: 'Літописець Тіней', icon: '📜' },
    3: { name: 'Гетьман Мороку', icon: '⚔' },
    4: { name: 'Імперський Намісник', icon: '👑' },
    5: { name: 'Архіваріус Забуття', icon: '🗝' },
    6: { name: 'Екзаменатор', icon: '📝' },
    7: { name: 'Магістр Дат', icon: '⏳' },
    8: { name: 'Володар Іспиту', icon: '🏛' }
};

// ── Стан бою ─────────────────────────────────────────────────────────

const stage = getStageParam() ?? 1;
const boss = BOSSES[stage];

let background = null;
let deck = [];
let index = 0;
let bossHp = BOSS.HP;
let lives = BOSS.PLAYER_LIVES;
let answered = false;
let finished = false;
let uid = null;

const el = {
    portrait: document.getElementById('boss-portrait'),
    name: document.getElementById('boss-name'),
    hpFill: document.getElementById('hp-fill'),
    hpText: document.getElementById('hp-text'),
    lives: document.getElementById('lives'),
    question: document.getElementById('question'),
    answers: document.getElementById('answers'),
    explanation: document.getElementById('explanation'),
    next: document.getElementById('next-btn'),
    overlay: document.getElementById('overlay'),
    overlayIcon: document.getElementById('overlay-icon'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayText: document.getElementById('overlay-text'),
    cert: document.getElementById('cert'),
    certHint: document.getElementById('cert-hint'),
    universalBlock: document.getElementById('universal-block'),
    universalCanvas: document.getElementById('universal-canvas'),
    universalDownloadBtn: document.getElementById('universal-download-btn'),
    saveState: document.getElementById('save-state'),
    retry: document.getElementById('retry-btn'),
    toStage: document.getElementById('stage-btn')
};

// ── Запуск ───────────────────────────────────────────────────────────

async function init() {
    background = new BossBackgroundController(
        document.getElementById('boss-bg-canvas'),
        document.getElementById('boss-bg')
    );

    // Гейт: без прогресу невідомо, чи бос відкритий, тож чекаємо на нього.
    const ready = window.limboReady ? await window.limboReady : null;
    uid = ready?.uid ?? null;

    const info = summarizeStage(stage, ready?.progress ?? null);

    if (!info.bossUnlocked) {
        goToStage(stage);
        return;
    }

    // 11 питань: 6 боссових + 5 запасних (див. коментар угорі файлу).
    deck = getBossFightDeck(stage, { size: 11, fillerCount: 5 });

    el.portrait.textContent = boss.icon;
    el.name.textContent = boss.name;

    updateHud();
    render();
}

// ── HUD ──────────────────────────────────────────────────────────────

function updateHud() {
    const ratio = bossHp / BOSS.HP;

    el.hpFill.style.width = `${ratio * 100}%`;
    el.hpFill.classList.toggle('low', ratio <= BOSS.CRITICAL_HP_RATIO);
    el.hpText.textContent = isCossack()
        ? COSSACK_TEXTS.boss.hpText(bossHp, BOSS.HP).cossack
        : `HP ${bossHp} / ${BOSS.HP}`;
    el.lives.textContent = '❤️'.repeat(lives) + '🖤'.repeat(BOSS.PLAYER_LIVES - lives);

    // Фон стає «критичним», коли бос уже сильно поранений.
    if (ratio <= BOSS.CRITICAL_HP_RATIO && bossHp > 0) background.setState('critical');
}

// ── Питання ──────────────────────────────────────────────────────────

function render() {
    const q = deck[index];

    answered = false;
    el.question.textContent = q.text;
    el.explanation.classList.add('hidden');
    el.next.disabled = true;
    el.answers.innerHTML = '';

    q.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = option;
        btn.addEventListener('click', () => answer(i));
        el.answers.appendChild(btn);
    });
}

function answer(chosen) {
    if (answered || finished) return;
    answered = true;

    const q = deck[index];
    const buttons = [...el.answers.children];

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add('correct');
        else if (i === chosen) btn.classList.add('wrong');
    });

    if (chosen === q.correctIndex) {
        bossHp--;
    } else {
        lives--;
        background.triggerDamage();   // спалах + тряска екрана
    }

    updateHud();

    el.explanation.textContent = q.explanation;
    el.explanation.classList.remove('hidden');

    if (bossHp <= 0) {
        el.next.disabled = true;
        win();
    } else if (lives <= 0) {
        el.next.disabled = true;
        lose();
    } else {
        el.next.disabled = false;
    }
}

function next() {
    index++;
    if (index < deck.length) render();
}

// ── Кінець бою ───────────────────────────────────────────────────────

function showOverlay(icon, title, text) {
    finished = true;
    el.overlayIcon.textContent = icon;
    el.overlayTitle.textContent = title;
    el.overlayText.textContent = text;
    el.overlay.classList.remove('hidden');
}

async function win() {
    background.setState('victory');
    const winTitle = isCossack() ? COSSACK_TEXTS.boss.winTitle.cossack : 'Перемога!';
    const winText = isCossack() ? COSSACK_TEXTS.boss.winText(boss.name).cossack : `${boss.name} переможений`;
    showOverlay('🏆', winTitle, winText);

    if (el.retry) el.retry.textContent = isCossack() ? COSSACK_TEXTS.boss.btnRetry.cossack : 'Ще раз';
    if (el.toStage) el.toStage.textContent = isCossack() ? COSSACK_TEXTS.boss.btnToStage.cossack : 'До стадії';

    // Блокуємо кнопки навігації, поки триває запис.
    el.toStage.disabled = true;
    el.retry.disabled = true;
    el.saveState.textContent = 'Зберігаємо…';

    try {
        if (!uid) {
            el.saveState.textContent = 'Не збережено: ви не увійшли';
            return;
        }

        const result = await saveBossVictory(uid, stage);

        el.saveState.textContent = result.nextStageUnlocked
            ? `Відкрито наступну стадію (${result.nextStageUnlocked})`
            : 'Прогрес збережено';

        // Фінал гри — показуємо код підтвердження та рендеримо Гетьманський Універсал.
        if (result.gameCompleted && result.certificate) {
            el.overlayText.textContent = isCossack() ? COSSACK_TEXTS.boss.gameComplete.cossack : 'Ти пройшов усі 8 стадій!';
            el.cert.textContent = isCossack() ? COSSACK_TEXTS.boss.certCode(result.certificate.code).cossack : `Код підтвердження: ${result.certificate.code}`;
            el.cert.classList.remove('hidden');
            if (el.certHint) el.certHint.classList.remove('hidden');

            if (el.universalBlock && el.universalCanvas) {
                el.universalBlock.classList.remove('hidden');
                const studentName = window.istoriyaUser?.displayName || 'Мацевич Орест Дмитрович';
                
                generateUniversal(el.universalCanvas, {
                    name: studentName,
                    code: result.certificate.code,
                    date: new Date(result.certificate.completedAt || Date.now()).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
                }).catch(err => console.error('Помилка рендерингу універсалу:', err));

                if (el.universalDownloadBtn) {
                    el.universalDownloadBtn.onclick = () => {
                        downloadUniversal(el.universalCanvas, `Hetmanskyi_Universal_${result.certificate.code}.png`);
                    };
                }
            }
        }
    } catch (error) {
        console.error('Не вдалося зберегти перемогу:', error);
        el.saveState.textContent = 'Не вдалося зберегти прогрес';
    } finally {
        // Запис завершився (успішно чи ні) — тепер переходити безпечно.
        el.toStage.disabled = false;
        el.retry.disabled = false;
    }
}

function lose() {
    if (el.universalBlock) el.universalBlock.classList.add('hidden');
    if (el.cert) el.cert.classList.add('hidden');
    if (el.certHint) el.certHint.classList.add('hidden');
    const loseTitle = isCossack() ? COSSACK_TEXTS.boss.loseTitle.cossack : 'Поразка';
    const loseText = isCossack() ? COSSACK_TEXTS.boss.loseText(boss.name).cossack : `${boss.name} виявився сильнішим. Спробуй ще раз.`;
    showOverlay('💀', loseTitle, loseText);
    if (el.retry) el.retry.textContent = isCossack() ? COSSACK_TEXTS.boss.btnRetry.cossack : 'Ще раз';
    if (el.toStage) el.toStage.textContent = isCossack() ? COSSACK_TEXTS.boss.btnToStage.cossack : 'До стадії';
    el.saveState.textContent = '';
}

// ── Обробники ────────────────────────────────────────────────────────

el.next.addEventListener('click', next);
el.retry.addEventListener('click', () => window.location.reload());
el.toStage.addEventListener('click', () => goToStage(stage));

init();
