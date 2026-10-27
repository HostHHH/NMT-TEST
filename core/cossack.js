// core/cossack.js
// Модуль динамічної локалізації режиму «Козацька мова» (Січова говірка).
// Забезпечує переклад елементів інтерфейсу та динамічних повідомлень на
// колоритну козацьку термінологію, затверджену для проєкту iSторія.

export const COSSACK_TEXTS = {
    // ── 1. Навігація ──
    nav: {
        logo: { normal: 'iSторія', cossack: 'Козацька iSторія' },
        map: { normal: 'Карта', cossack: 'Мапа походів' },
        game: { normal: 'Гра', cossack: 'Січовий герць' },
        about: { normal: 'Про проєкт', cossack: 'Про козацьку справу' },
        settings: { normal: 'Налаштування', cossack: 'Козацький лад' },
        logout: { normal: 'Вийти', cossack: 'Зійти з коня' }
    },

    // ── 2. Бігуча стрічка (Ticker) ──
    ticker: {
        badge: { normal: 'ГЕТЬМАНИ & РОК-ЛЕГЕНДИ', cossack: 'ГЕТЬМАНСЬКИЙ УНІВЕРСАЛ & РОК-ЛЕГЕНДИ' }
    },

    // ── 3. Налаштування (home/index.html) ──
    settings: {
        musicTitle: { normal: 'Музика', cossack: 'Січові музики' },
        chipMetal: { normal: 'Рок-підтримка', cossack: 'Гуркіт гармат' },
        chipPop: { normal: 'Поп-хіти', cossack: 'Ярмаркові приспівки' },
        chipUkr: { normal: 'Укр-поп', cossack: 'Дніпровський вайб' },
        chipLofi: { normal: 'Lo-Fi', cossack: 'Спочинок біля ватри' },
        chipEpic: { normal: 'Епік-фолк', cossack: 'Кобзарські думи' },
        radioBtn: { normal: '📻 Ефір', cossack: '📻 Січовий гомін' },
        trackListTitle: { normal: 'Треки у плейлисті', cossack: 'Пісні в обозі' },
        playerPaused: { normal: 'Пауза', cossack: 'Притримай коней' },
        playerPlaying: { normal: 'Відтворення', cossack: 'Вдар по струнах!' },

        styleTitle: { normal: 'Стиль та колір', cossack: 'Шати та барви куреня' },
        styleBadge: { normal: 'Особиста тема', cossack: 'Власний жупан' },
        labelBgColor: { normal: 'Колір фону', cossack: 'Барва намету' },
        labelGuiColor: { normal: 'Колір GUI', cossack: 'Барва клейнодів' },
        presetsTitle: { normal: 'Швидкі теми оформлення:', cossack: 'Готові бойові строї:' },
        presetNight: { normal: 'Ніч', cossack: 'Нічна варта' },
        presetSteppe: { normal: 'Степ', cossack: 'Дике Поле' },
        presetForest: { normal: 'Ліс', cossack: 'Холодний Яр' },
        presetClay: { normal: 'Глина', cossack: 'Опішнянська глина' },
        presetGraphite: { normal: 'Графіт', cossack: 'Гарматний порох' },

        otherTitle: { normal: 'Інше', cossack: 'Обозні дрібниці' },
        otherBadge: { normal: 'Додаткові опції', cossack: 'Характерницькі штучки' },

        optVoiceTitle: { normal: 'Озвучка в мінігрі', cossack: 'Брязкіт зброї у грі' },
        optVoiceDesc: { normal: 'Звукові ефекти монет і пошкоджень у грі', cossack: 'Дзвін талярів та гуркіт шабель у бою' },

        optCossackTitle: { normal: 'Козацька мова', cossack: 'Січова говірка' },
        optCossackDesc: { normal: 'Стилізовані назви та колоритний стиль інтерфейсу', cossack: 'Справжній козацький дух, примовки та давній стрій' },

        optFontsTitle: { normal: 'Автентичні шрифти', cossack: 'Писарське письмо' },
        optFontsDesc: { normal: 'Українські шрифти: Кобзар KS, Маріуполь', cossack: 'Давні рукописні літери: Кобзар KS та Маріуполь' },

        optBackTitle: { normal: 'Фактура фону', cossack: 'Полотно шатра' },
        optBackDesc: { normal: 'Легкий текстурний візерунок позаду блоків', cossack: 'Незримий візерунок домотканого полотна на тлі' },

        optThingsTitle: { normal: 'Сяйво елементів', cossack: 'Отаманський відблиск' },
        optThingsDesc: { normal: 'М\'яка підсвітка акцентних блоків та кнопок', cossack: 'М\'яке сяйво клейнодів та бойових кнопок' }
    },

    // ── 4. Карта та Стадія (map/ & stage/) ──
    stage: {
        backToMap: { normal: '← Карта', cossack: '← До мапи походів' },
        bossTitle: { normal: 'Бос стадії', cossack: 'Лихий супостат рубежу' },
        stageTag: (s) => ({ normal: `стадія ${s} з 8`, cossack: `рубіж ${s} з 8` }),
        starsCount: (c, max) => ({ normal: `⭐ ${c} / ${max}`, cossack: `⭐ ${c} / ${max} звитяг` }),
        bonusNote: (b) => ({ normal: `(з них ${b} бонусних)`, cossack: `(з них ${b} характерницьких)` }),

        bossDefeatedHint: (isFinal) => ({
            normal: isFinal ? 'Боса переможено — гру пройдено!' : 'Боса переможено — наступна стадія відкрита',
            cossack: isFinal ? 'Усіх супостатів подолано — козацька слава на віки!' : 'Ворога розбито вщент — шлях до нового походу відкритий!'
        }),
        bossDefeatedSub: { normal: 'Переможено', cossack: 'Повержений до ніг!' },

        bossReadyHint: { normal: 'Боса відкрито — час для бою', cossack: 'Супостат чекає — час оголити шаблі!' },
        bossReadySub: { normal: 'Виклик прийнято?', cossack: 'Вийдеш на герць?' },

        bossLockedHint: (needed, thresh, max) => ({
            normal: `Ще ${needed} ⭐ до боса (потрібно ${thresh} з ${max})`,
            cossack: `Ще ${needed} ⭐ слави до ворожого ватажка (треба ${thresh} з ${max})`
        }),
        bossLockedSub: (thresh) => ({
            normal: `Потрібно ${thresh} ⭐`,
            cossack: `Треба здобути ${thresh} ⭐ слави`
        }),

        stageLockedMsg: {
            normal: 'Ця стадія ще закрита. Переможи боса попередньої стадії, щоб її відкрити.',
            cossack: 'Цей шлях ще під вартою. Здолай ворожого ватажка на попередньому рубежі, аби пройти далі.'
        },

        bonusAffordText: (balance) => ({
            normal: `Бонусних ★: ${balance}`,
            cossack: `Маєш ${balance} ⭐ здобичі з герцю.`
        }),
        bonusAffordBtn: (needed) => ({
            normal: `Відкрити боса за ${needed} ★`,
            cossack: `Кинути в бій ${needed} ⭐ проти ватажка`
        }),
        bonusShortText: (balance, needed) => ({
            normal: `Бонусних ★: ${balance}. До боса бракує ${needed} — заробляй час в аркаді.`,
            cossack: `Маєш ${balance} ⭐ здобичі з герцю. До ворожого ватажка бракує ${needed} — вирушай на Січ.`
        })
    },

    // ── 5. Тестовий тренажер (test/) ──
    test: {
        backToStage: { normal: '← До стадії', cossack: '← Назад до рубежу' },
        questionNum: (curr, total) => ({
            normal: `Питання ${curr} з ${total}`,
            cossack: `Випробування ${curr} з ${total}`
        }),
        btnNext: { normal: 'Далі →', cossack: 'Далі рушай →' },
        btnResult: { normal: 'Результат →', cossack: 'Рахунок звитяги →' },

        score: (correct, total) => ({
            normal: `${correct} з ${total}`,
            cossack: `Влучив ${correct} з ${total} разів`
        }),
        verdictPerfect: { normal: 'Бездоганно!', cossack: 'Чиста звитяга! Любо глянути!' },
        verdictPassed: { normal: 'Рівень пройдено', cossack: 'Рубіж здолано!' },
        verdictFailed: {
            normal: 'Рівень не зараховано — потрібно щонайменше 3 правильні',
            cossack: 'Відступили з поля бою — треба щонайменше 3 вірні відповіді!'
        },

        btnToLevels: { normal: 'До списку рівнів', cossack: 'До переліку рубежів' },
        btnRetry: { normal: 'Ще раз', cossack: 'Ще раз на герць!' },
        btnMap: { normal: 'Карта 3D', cossack: 'Степова мапа 3D' },

        saveSaving: { normal: 'Збереження…', cossack: 'Військовий писар записує…' },
        saveSaved: { normal: 'Прогрес збережено', cossack: 'До козацького реєстру записано!' },
        saveGuest: {
            normal: 'Не збережено: ви не увійшли',
            cossack: 'Не записано в реєстр: ти не назвав своє козацьке псевдо (не увійшов)'
        }
    },

    // ── 6. Битва з босом (boss-test/) ──
    boss: {
        pageTitle: { normal: 'iSторія — Бій з босом', cossack: 'Козацька iSторія — Герць із супостатом' },
        hpText: (hp, max) => ({
            normal: `HP ${hp} / ${max}`,
            cossack: `Снага ${hp} / ${max}`
        }),
        winTitle: { normal: 'Перемога!', cossack: 'Слава! Козацька звитяга!' },
        winText: (name) => ({
            normal: `${name} переможений`,
            cossack: `${name} повалений у степовий порох!`
        }),
        gameComplete: {
            normal: 'Ти пройшов усі 8 стадій!',
            cossack: 'Ти подолав усі 8 великих походів! Справжній кошовий отаман!'
        },
        certCode: (code) => ({
            normal: `Код підтвердження: ${code}`,
            cossack: `Вірча грамота лицаря: ${code}`
        }),
        loseTitle: { normal: 'Поразка', cossack: 'Шабля щербата...' },
        loseText: (name) => ({
            normal: `${name} виявився сильнішим. Спробуй ще раз.`,
            cossack: `${name} взяв гору хитрощами. Підведись, побратиме, вигостри шаблю й помстися!`
        }),
        btnRetry: { normal: 'Ще раз', cossack: 'Знову до бою!' },
        btnToStage: { normal: 'До стадії', cossack: 'До рубежу' }
    },

    // ── 7. Лоббі (lobby/lobby.html) ──
    lobby: {
        loginBtn: { normal: 'Увійти через Google', cossack: 'Записатися до реєстру через Google' },
        card1Title: { normal: '3D Глобус & 8 Стадій', cossack: '3D Куля земна & 8 Великих походів' },
        card1Desc: {
            normal: 'Від витоків державності до сучасної історії та іспиту НМТ.',
            cossack: 'Від княжих часів і козацької вольниці до новітніх днів та переможного НМТ.'
        },
        card2Title: { normal: 'Битви з Босами', cossack: 'Герці з лютими супостатами' },
        card2Desc: {
            normal: 'Перевірка знань у форматі динамічного бою з життями та таймінгом.',
            cossack: 'Справжній вишкіл пам\'яті у шаленому двобої — рахуй час і бережи козацьке серце.'
        },
        card3Title: { normal: 'Зірки та Бонуси', cossack: 'Зорі слави та характерницька здобич' },
        card3Desc: {
            normal: 'Мікронавчання, таблиця лідерів та підтримка через аркадний режим.',
            cossack: 'Щоденна січова наука, реєстр найславніших лицарів та бойова підмога в мінігрі.'
        },
        aboutTitle: { normal: 'ПРО ПРОЄКТ', cossack: 'ПРО КОЗАЦЬКУ СПРАВУ' },
        quote: {
            normal: '«Історія оживає тоді, коли навчання перетворюється на захопливу гру.»',
            cossack: '«Історія оживає тоді, коли суха наука стає гарячим козацьким походом та лицарським герцем.»'
        }
    }
};

/**
 * Отримує текст за об'єктом перекладу відповідно до поточного режиму.
 */
export function t(entry, isCossack) {
    if (!entry) return '';
    return isCossack ? entry.cossack : entry.normal;
}

/**
 * Застосовує переклади до спільних статичних елементів DOM.
 * Викликається у браузерному середовищі.
 */
export function applyCossackTranslations(isCossack) {
    if (typeof document === 'undefined') return;

    // 1. Верхня панель (Top Nav)
    const brandTitle = document.querySelector('.brand-title, .nav-brand-title');
    if (brandTitle) {
        brandTitle.textContent = isCossack ? COSSACK_TEXTS.nav.logo.cossack : COSSACK_TEXTS.nav.logo.normal;
    }

    const navLinks = document.querySelectorAll('.nav-links .nav-link, .top-nav a.nav-link, .nav-menu a.nav-link');
    navLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const textSpan = link.querySelector('span:not(.nav-icon):not(.nav-brand-tag)') || link.querySelector('span') || link;

        let key = null;
        if (href.includes('map')) key = COSSACK_TEXTS.nav.map;
        else if (href.includes('game')) key = COSSACK_TEXTS.nav.game;
        else if (href.includes('about')) key = COSSACK_TEXTS.nav.about;
        else if (href.includes('home')) key = COSSACK_TEXTS.nav.settings;

        if (key) {
            textSpan.textContent = t(key, isCossack);
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const span = logoutBtn.querySelector('span');
        if (span) {
            span.textContent = t(COSSACK_TEXTS.nav.logout, isCossack);
        } else {
            logoutBtn.textContent = t(COSSACK_TEXTS.nav.logout, isCossack);
        }
    }

    // 2. Бігуча стрічка (Ticker Badge)
    const tickerBadgeLabel = document.querySelector('.quotes-ticker-bar .ticker-label');
    if (tickerBadgeLabel) {
        tickerBadgeLabel.textContent = t(COSSACK_TEXTS.ticker.badge, isCossack);
    }

    // 3. Сторінка Налаштувань (home/index.html)
    applySettingsTranslations(isCossack);

    // 4. Сторінка Лоббі (lobby/lobby.html)
    applyLobbyTranslations(isCossack);

    // 5. Кнопки повернення назад
    const backBtn = document.getElementById('back-btn') || document.querySelector('.back-btn');
    if (backBtn) {
        if (backBtn.textContent.includes('Карта') || backBtn.textContent.includes('походів')) {
            backBtn.textContent = t(COSSACK_TEXTS.stage.backToMap, isCossack);
        } else if (backBtn.textContent.includes('стадії') || backBtn.textContent.includes('рубежу')) {
            backBtn.textContent = t(COSSACK_TEXTS.test.backToStage, isCossack);
        }
    }
}

function applySettingsTranslations(isCossack) {
    const s = COSSACK_TEXTS.settings;

    // Музика
    const musicTitle = document.querySelector('.music-section .card-title');
    if (musicTitle) musicTitle.textContent = t(s.musicTitle, isCossack);

    const chipMap = [
        { sel: '.playlist-chip[data-index="0"] .chip-text', text: s.chipMetal },
        { sel: '.playlist-chip[data-index="1"] .chip-text', text: s.chipPop },
        { sel: '.playlist-chip[data-index="2"] .chip-text', text: s.chipUkr },
        { sel: '.playlist-chip[data-index="3"] .chip-text', text: s.chipLofi },
        { sel: '.playlist-chip[data-index="4"] .chip-text', text: s.chipEpic }
    ];
    chipMap.forEach(({ sel, text }) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = t(text, isCossack);
    });

    const radioBtn = document.getElementById('radio-btn');
    if (radioBtn) radioBtn.textContent = t(s.radioBtn, isCossack);

    const trackListHead = document.querySelector('.tracks-block-title');
    if (trackListHead) trackListHead.textContent = t(s.trackListTitle, isCossack);

    // Стиль та колір
    const styleCard = document.querySelector('.style-section');
    if (styleCard) {
        const styleTitle = styleCard.querySelector('.card-title');
        if (styleTitle) styleTitle.textContent = t(s.styleTitle, isCossack);
        const styleBadge = styleCard.querySelector('.card-tag');
        if (styleBadge) styleBadge.textContent = t(s.styleBadge, isCossack);
    }

    const presetHead = document.querySelector('.presets-label');
    if (presetHead) presetHead.textContent = t(s.presetsTitle, isCossack);

    const presetChips = [
        { sel: '.preset-chip[data-preset="night"] .preset-name', text: s.presetNight },
        { sel: '.preset-chip[data-preset="steppe"] .preset-name', text: s.presetSteppe },
        { sel: '.preset-chip[data-preset="forest"] .preset-name', text: s.presetForest },
        { sel: '.preset-chip[data-preset="clay"] .preset-name', text: s.presetClay },
        { sel: '.preset-chip[data-preset="graphite"] .preset-name', text: s.presetGraphite }
    ];
    presetChips.forEach(({ sel, text }) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = t(text, isCossack);
    });

    // Інше (Тумблери)
    const otherCard = document.querySelector('.other-section');
    if (otherCard) {
        const otherTitle = otherCard.querySelector('.card-title');
        if (otherTitle) otherTitle.textContent = t(s.otherTitle, isCossack);
        const otherBadge = otherCard.querySelector('.card-tag');
        if (otherBadge) otherBadge.textContent = t(s.otherBadge, isCossack);
    }

    const toggleMap = [
        { id: 'toggle-voice-minigame', title: s.optVoiceTitle, desc: s.optVoiceDesc },
        { id: 'toggle-cossack-lang', title: s.optCossackTitle, desc: s.optCossackDesc },
        { id: 'toggle-fonts', title: s.optFontsTitle, desc: s.optFontsDesc },
        { id: 'toggle-back', title: s.optBackTitle, desc: s.optBackDesc },
        { id: 'toggle-things', title: s.optThingsTitle, desc: s.optThingsDesc }
    ];

    toggleMap.forEach(({ id, title, desc }) => {
        const input = document.getElementById(id);
        if (!input) return;
        const row = input.closest('.toggle-row') || input.parentElement;
        if (!row) return;
        const tEl = row.querySelector('.toggle-title');
        const dEl = row.querySelector('.toggle-desc');
        if (tEl) tEl.textContent = t(title, isCossack);
        if (dEl) dEl.textContent = t(desc, isCossack);
    });
}

function applyLobbyTranslations(isCossack) {
    const l = COSSACK_TEXTS.lobby;
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.textContent = t(l.loginBtn, isCossack);

    const c1 = document.querySelector('.feature-card.card-1');
    if (c1) {
        const h = c1.querySelector('h3');
        const p = c1.querySelector('p');
        if (h) h.textContent = t(l.card1Title, isCossack);
        if (p) p.textContent = t(l.card1Desc, isCossack);
    }

    const c2 = document.querySelector('.feature-card.card-2');
    if (c2) {
        const h = c2.querySelector('h3');
        const p = c2.querySelector('p');
        if (h) h.textContent = t(l.card2Title, isCossack);
        if (p) p.textContent = t(l.card2Desc, isCossack);
    }

    const c3 = document.querySelector('.feature-card.card-3');
    if (c3) {
        const h = c3.querySelector('h3');
        const p = c3.querySelector('p');
        if (h) h.textContent = t(l.card3Title, isCossack);
        if (p) p.textContent = t(l.card3Desc, isCossack);
    }

    const aboutTitle = document.querySelector('.about-title');
    if (aboutTitle) aboutTitle.textContent = t(l.aboutTitle, isCossack);

    const quoteP = document.querySelector('.about-quote p');
    if (quoteP) quoteP.textContent = t(l.quote, isCossack);
}
