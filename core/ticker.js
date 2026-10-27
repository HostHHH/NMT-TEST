// core/ticker.js
// Універсальний модуль бігучої стрічки цитат (Ticker).
// Забезпечує наявність бігучої стрічки з цитатами гетьманів та світових
// рок-легенд на всіх сторінках проєкту.

export const TICKER_QUOTES = [
    { author: 'Богдан Хмельницький', text: 'Хто не ризикує, той не панує!' },
    { author: 'Іван Мазепа', text: 'А за віру хоч умріте, і вольностей бороніте!' },
    { author: 'Петро Сагайдачний', text: 'Лицарю личить не словом, а гострою шаблею честь добувати.' },
    { author: 'Дмитро Байда-Вишневецький', text: 'Справжнє золото дістається сміливим, а ворогам — гостра криця!' },
    { author: 'Пилип Орлик', text: 'Ніякі союзи не мають сили, якщо народ втрачає свою волю.' },
    { author: 'Іван Сірко', text: 'Нуте, козаки, у шаблі! Перемога за тим, хто правду боронить!' },
    { author: 'Святослав Хоробрий', text: 'Іду на ви! Мертві сорому не знають!' },
    { author: 'Данило Галицький', text: 'Не гоже чужому панувати на землі Руській!' },
    { author: 'Козацька мудрість', text: 'Козацькому роду нема переводу!' },
    { author: 'Іван Богун', text: 'Краще в полі полягти, ніж у ярмо московське лягти!' },
    { author: 'Джеймс Гетфілд (Metallica)', text: 'Ми стоїмо разом з нашими українськими братами і сестрами у цей темний час.' },
    { author: 'Роб Гелфорд (Judas Priest)', text: 'Україно, тримайся, боріться за свою свободу, нехай хеві-метал дає вам силу!' },
    { author: 'Брюс Дікінсон (Iron Maiden)', text: 'Ми не забуваємо про Україну. Ми з вами всім серцем — залишайтеся сильними!' },
    { author: 'Дейв Мастейн (Megadeth)', text: 'Музика має об\'єднувати світ, і ми всім серцем молимося за мир і силу для людей України.' },
    { author: 'Оззі Осборн', text: 'Ми виступаємо за Україну. Необхідно зупинити цю війну та захистити тих, хто цього потребує.' }
];

export function generateTickerItemsHTML() {
    return TICKER_QUOTES.map(q =>
        `<span class="ticker-item"><strong class="ticker-author">${q.author}:</strong> «${q.text}»</span><span class="ticker-dot">✦</span>`
    ).join('');
}

export function generateTickerHTML(isCossack = false) {
    const badgeText = isCossack ? 'ГЕТЬМАНСЬКИЙ УНІВЕРСАЛ & РОК-ЛЕГЕНДИ' : 'ГЕТЬМАНИ & РОК-ЛЕГЕНДИ';
    const items = generateTickerItemsHTML();

    return `
        <div class="ticker-badge">
            <span class="ticker-icon">⚔️</span>
            <span class="ticker-label">${badgeText}</span>
        </div>
        <div class="ticker-track-wrapper">
            <div class="ticker-track">
                <div class="ticker-group">
                    ${items}
                </div>
                <div class="ticker-group" aria-hidden="true">
                    ${items}
                </div>
            </div>
        </div>
    `.trim();
}

/**
 * Гарантує наявність стилів та DOM-вузла бігучої стрічки на поточній сторінці.
 */
export function mountQuotesTicker(isCossack = false) {
    if (typeof document === 'undefined') return;

    ensureTickerStyles();

    let tickerBar = document.getElementById('quotes-ticker-bar');
    if (!tickerBar) {
        tickerBar = document.createElement('div');
        tickerBar.className = 'quotes-ticker-bar';
        tickerBar.id = 'quotes-ticker-bar';
        tickerBar.setAttribute('aria-label', 'Цитати гетьманів та світових рок-легенд');
        tickerBar.innerHTML = generateTickerHTML(isCossack);

        const topNav = document.querySelector('.top-nav');
        if (topNav && topNav.parentNode) {
            topNav.parentNode.insertBefore(tickerBar, topNav.nextSibling);
        } else {
            tickerBar.classList.add('no-top-nav');
            document.body.insertBefore(tickerBar, document.body.firstChild);
        }
    } else {
        const label = tickerBar.querySelector('.ticker-label');
        if (label) {
            label.textContent = isCossack
                ? 'ГЕТЬМАНСЬКИЙ УНІВЕРСАЛ & РОК-ЛЕГЕНДИ'
                : 'ГЕТЬМАНИ & РОК-ЛЕГЕНДИ';
        }
    }
}

function ensureTickerStyles() {
    if (document.getElementById('quotes-ticker-injected-style')) return;

    const style = document.createElement('style');
    style.id = 'quotes-ticker-injected-style';
    style.textContent = `
        .quotes-ticker-bar {
            position: fixed;
            top: 56px;
            left: 0;
            right: 0;
            height: 36px;
            display: flex;
            align-items: center;
            background: rgba(12, 15, 21, 0.94);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            z-index: 99;
            user-select: none;
            box-sizing: border-box;
        }

        .quotes-ticker-bar.no-top-nav {
            top: 0;
        }

        body:has(.quotes-ticker-bar.no-top-nav) {
            padding-top: 42px;
        }

        .ticker-badge {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 0 16px;
            height: 100%;
            background: rgba(255, 255, 255, 0.04);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
            z-index: 2;
        }

        .ticker-icon {
            font-size: 13px;
        }

        .ticker-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            color: var(--gui-color, #c5a47e);
            text-transform: uppercase;
            white-space: nowrap;
        }

        .ticker-track-wrapper {
            flex: 1;
            overflow: hidden;
            position: relative;
            display: flex;
            align-items: center;
            mask-image: linear-gradient(90deg, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%);
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%);
        }

        .ticker-track {
            display: flex;
            width: max-content;
            will-change: transform;
            animation: tickerLoop 72s linear infinite;
        }

        .ticker-track:hover {
            animation-play-state: paused;
            cursor: pointer;
        }

        .ticker-group {
            display: flex;
            align-items: center;
            gap: 24px;
            padding-right: 24px;
            white-space: nowrap;
        }

        .ticker-item {
            font-size: 12.5px;
            color: var(--text-primary, #e6edf3);
            font-weight: 500;
            letter-spacing: 0.2px;
        }

        .ticker-author {
            color: var(--gui-color, #c5a47e);
            font-weight: 700;
            margin-right: 6px;
        }

        .ticker-dot {
            color: rgba(255, 255, 255, 0.25);
            font-size: 10px;
        }

        body.glow-effects .quotes-ticker-bar {
            box-shadow: 0 4px 18px -4px var(--glow-ambient, rgba(197, 164, 126, 0.35));
            border-bottom-color: color-mix(in srgb, var(--gui-color, #c5a47e) 45%, transparent);
        }

        body.glow-effects .ticker-label,
        body.glow-effects .ticker-author {
            text-shadow: 0 0 8px var(--gui-color, #c5a47e);
        }

        @keyframes tickerLoop {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        @media (max-width: 650px) {
            .ticker-label { display: none; }
            .ticker-badge { padding: 0 10px; }
            .ticker-item { font-size: 11.5px; }
        }
    `;
    (document.head || document.documentElement).appendChild(style);
}
