import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { initProgressStore, ensureProgress, createEmptyProgress, grantFullProgress, resetProgress } from "../core/progressStore.js";
import { normalizeCertificateCode } from "../core/rules.js";
import { CERTIFICATE } from "../core/config.js";
// nav.js реєструє goToMap/goToDef/goToGame у window
import "../core/nav.js";
import { applyCossackTranslations, COSSACK_TEXTS } from "../core/cossack.js";
import { mountQuotesTicker } from "../core/ticker.js";

const firebaseConfig = {
    apiKey: "AIzaSyBKwDPowjfNRm-Y9WHn37ytoC_Wy_QYYRI",
    authDomain: "hhhh-c5f0a.firebaseapp.com",
    projectId: "hhhh-c5f0a",
    storageBucket: "hhhh-c5f0a.firebasestorage.app",
    messagingSenderId: "147481155429",
    appId: "1:147481155429:web:f4cd60795159ff7f1df38c",
    measurementId: "G-71R689GG66"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Сховище прогресу
initProgressStore(db);

let currentProgress = null;
let currentUserUid = null;
let saveTimeout = null;
let unsubListener = null;

let h = 0, o = 0, s = 0, h2 = 0, o2 = 0, s2 = 0;
let bgColor = '#0e1117';
let guiColor = '#c5a47e';
let voiceMiniGame = true;
let cossackLang = false;
let fontState = false, backState = false, thingsState = false;

let resolveLimboReady;
window.limboReady = new Promise((resolve) => { resolveLimboReady = resolve; });
window.istoriyaReady = window.limboReady;
window.limboGetProgress = () => currentProgress;
window.istoriyaGetProgress = () => currentProgress;

window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
});

const isSubfolder = /\/(home|game|lobby|test|map|stage|boss-test|about)\//.test(window.location.pathname);
const isLobbyPage = window.location.pathname.includes('lobby.html');
const loader = document.getElementById('loader');

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => mountQuotesTicker(cossackLang));
    } else {
        mountQuotesTicker(cossackLang);
    }
}

// Встановлення теми з пресетів (фон + акцентний колір GUI)
window.setThemePreset = function(newBg, newGui) {
    bgColor = newBg;
    guiColor = newGui;
    updateUI();
    scheduleSave();
};

// Зворотна сумісність для старих викликів
window.setPreset = function(nH, nO, nS, nH2, nO2, nS2) {
    h = nH; o = nO; s = nS;
    h2 = nH2; o2 = nO2; s2 = nS2;
    bgColor = `hsl(${h}, ${o}%, ${s}%)`;
    updateUI();
    scheduleSave();
};

window.randomBackground = function() {
    h = Math.trunc(Math.random() * 360);
    o = Math.trunc(40 + Math.random() * 55);
    s = Math.trunc(15 + Math.random() * 35);
    bgColor = `hsl(${h}, ${o}%, ${s}%)`;
    updateUI();
    scheduleSave();
};

function applyColors() {
    // Встановлюємо фон сторінки
    document.body.style.backgroundColor = bgColor;

    // Встановлюємо акцентні змінні для інтерфейсу
    document.documentElement.style.setProperty('--gui-color', guiColor);
    document.documentElement.style.setProperty('--accent-gold', guiColor);
    document.documentElement.style.setProperty('--border-active', guiColor);

    // Оновлення елементів сторінки налаштувань (два квадрати: Фон та GUI)
    const bgSquare = document.getElementById('bg-square-preview');
    if (bgSquare) bgSquare.style.backgroundColor = bgColor;
    const bgHex = document.getElementById('bg-hex-val');
    if (bgHex) bgHex.textContent = bgColor.toUpperCase();
    const bgPicker = document.getElementById('bg-color-picker');
    if (bgPicker && bgPicker.value !== bgColor && bgColor.startsWith('#')) {
        bgPicker.value = bgColor;
    }

    const guiSquare = document.getElementById('gui-square-preview');
    if (guiSquare) guiSquare.style.backgroundColor = guiColor;
    const guiHex = document.getElementById('gui-hex-val');
    if (guiHex) guiHex.textContent = guiColor.toUpperCase();
    const guiPicker = document.getElementById('gui-color-picker');
    if (guiPicker && guiPicker.value !== guiColor && guiColor.startsWith('#')) {
        guiPicker.value = guiColor;
    }

    // Класи шрифту, текстури та стилізації
    document.body.classList.toggle('custom-font', fontState);
    document.body.classList.toggle('pattern-back', backState);
    document.body.classList.toggle('glow-effects', thingsState);
    document.body.classList.toggle('cossack-mode', cossackLang);

    window.istoriyaSettings = {
        bgColor,
        guiColor,
        voiceMiniGame,
        cossackLang,
        fontState,
        backState,
        thingsState
    };
    window.isVoiceMiniGameEnabled = () => voiceMiniGame;
    window.isCossackLangEnabled = () => cossackLang;
}

function updateUI() {
    const bgPicker = document.getElementById('bg-color-picker');
    if (bgPicker && bgColor.startsWith('#')) bgPicker.value = bgColor;
    const guiPicker = document.getElementById('gui-color-picker');
    if (guiPicker && guiColor.startsWith('#')) guiPicker.value = guiColor;

    const tVoice = document.getElementById('toggle-voice-minigame');
    if (tVoice) tVoice.checked = voiceMiniGame;

    const tCossack = document.getElementById('toggle-cossack-lang');
    if (tCossack) tCossack.checked = cossackLang;

    const tFonts = document.getElementById('toggle-fonts');
    if (tFonts) tFonts.checked = fontState;

    const tBack = document.getElementById('toggle-back');
    if (tBack) tBack.checked = backState;

    const tThings = document.getElementById('toggle-things');
    if (tThings) tThings.checked = thingsState;

    applyColors();
    mountQuotesTicker(cossackLang);
    applyCossackTranslations(cossackLang);
    window.dispatchEvent(new CustomEvent('cossackLangChange', { detail: { enabled: cossackLang } }));
}

async function saveToFirebase() {
    if (!currentUserUid) return;
    const settings = {
        h, o, s, h2, o2, s2,
        bgColor,
        guiColor,
        voiceMiniGame,
        cossackLang,
        fontState,
        backState,
        thingsState
    };
    await setDoc(doc(db, "users", currentUserUid), { settings }, { merge: true });
}

function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToFirebase, 1000);
}

// Слухачі для кольорових квадратів
const inputBgColor = document.getElementById('bg-color-picker');
if (inputBgColor) {
    inputBgColor.addEventListener('input', (e) => {
        bgColor = e.target.value;
        applyColors();
        scheduleSave();
    });
}

const inputGuiColor = document.getElementById('gui-color-picker');
if (inputGuiColor) {
    inputGuiColor.addEventListener('input', (e) => {
        guiColor = e.target.value;
        applyColors();
        scheduleSave();
    });
}

// Слухачі для перемикачів розділу "Інше"
[
    { id: 'toggle-voice-minigame', setter: (v) => { voiceMiniGame = v; } },
    { id: 'toggle-cossack-lang', setter: (v) => { cossackLang = v; } },
    { id: 'toggle-fonts', setter: (v) => { fontState = v; } },
    { id: 'toggle-back', setter: (v) => { backState = v; } },
    { id: 'toggle-things', setter: (v) => { thingsState = v; } }
].forEach(({ id, setter }) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', function() {
            setter(this.checked);
            applyColors();
            scheduleSave();
        });
    }
});

if (isLobbyPage) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error(error);
            }
        });
    }
} else {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => signOut(auth));
    }
}

function handleFirstLogin() {
    bgColor = '#0e1117';
    guiColor = '#c5a47e';
    voiceMiniGame = true;
    cossackLang = false;
    fontState = false;
    backState = false;
    thingsState = false;
    updateUI();
}

window.updateHighScore = async function(newScore) {
    if (!currentUserUid) return;
    const docRef = doc(db, "users", currentUserUid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const userData = docSnap.data();
        const currentHigh = userData.highScore || 0;
        if (newScore > currentHigh) {
            await setDoc(docRef, { highScore: newScore }, { merge: true });
            
            // Синхронізуємо з окремою публічною колекцією leaderboard
            try {
                const leaderRef = doc(db, "leaderboard", currentUserUid);
                await setDoc(leaderRef, {
                    displayName: userData.displayName || "user",
                    highScore: newScore,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (leaderErr) {
                console.warn('[Leaderboard Sync Warning]', leaderErr);
            }
        }
    }
};

window.loadTopPlayers = async function() {
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (!leaderboardEl) return;

    try {
        let players = [];
        try {
            const q = query(collection(db, "leaderboard"), orderBy("highScore", "desc"), limit(10));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                players.push({
                    name: data.displayName || "user",
                    score: data.highScore || 0
                });
            });
        } catch (leaderboardErr) {
            console.warn('[Leaderboard] Запит до /leaderboard не пройшов, використовую fallback /users:', leaderboardErr);
            const fallbackQ = query(collection(db, "users"), orderBy("highScore", "desc"), limit(10));
            const fallbackSnap = await getDocs(fallbackQ);
            fallbackSnap.forEach((docSnap) => {
                const data = docSnap.data();
                players.push({
                    name: data.displayName || "user",
                    score: data.highScore || 0
                });
            });
        }
        
        leaderboardEl.innerHTML = '';
        let count = 0;
        
        players.forEach((p) => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = p.name;
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = String(p.score);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            leaderboardEl.appendChild(li);
            count++;
        });

        for (let i = count; i < 10; i++) {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = "user";
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = "0";
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            leaderboardEl.appendChild(li);
        }
    } catch (error) {
        console.error('Помилка завантаження лідерборду:', error);
    }
};

window.verifyCertificate = async function(inputCode) {
    const raw = String(inputCode || '').trim();
    if (!raw) {
        return { ok: false, error: 'Введіть код сертифіката' };
    }

    const normalized = normalizeCertificateCode(raw);
    if (!normalized.startsWith(CERTIFICATE.PREFIX)) {
        return { ok: false, error: `Код повинен починатися з префікса «${CERTIFICATE.PREFIX}-»` };
    }

    const payload = normalized.slice(CERTIFICATE.PREFIX.length);
    const expectedLen = CERTIFICATE.SEGMENTS * CERTIFICATE.SEGMENT_LENGTH;
    if (payload.length !== expectedLen) {
        return { 
            ok: false, 
            error: `Невірна довжина: очікується ${expectedLen} знаків після префікса (введено ${payload.length})` 
        };
    }

    const allowed = new Set(CERTIFICATE.ALPHABET.split(''));
    for (const char of payload) {
        if (!allowed.has(char)) {
            return { ok: false, error: `Некоректний символ у коді: «${char}»` };
        }
    }

    // Перевірка в базі Firestore (колекція certificates)
    try {
        const snap = await getDoc(doc(db, "certificates", normalized));
        if (snap.exists()) {
            const data = snap.data();
            const dateStr = data.completedAt 
                ? new Date(data.completedAt).toLocaleString('uk-UA', { dateStyle: 'long', timeStyle: 'short' })
                : 'Підтверджено';
            return {
                ok: true,
                inRegistry: true,
                code: data.code || raw.toUpperCase(),
                date: dateStr,
                course: data.course || 'Повний курс НМТ з історії України (8 стадій)',
                message: '✓ Сертифікат дійсний та підтверджений в офіційному реєстрі iSторія!'
            };
        }
    } catch (err) {
        console.warn('Перевірка реєстру Firestore недоступна:', err);
    }

    return {
        ok: true,
        inRegistry: false,
        code: raw.toUpperCase(),
        course: 'Повний курс НМТ з історії України (8 стадій)',
        message: '✓ Код відповідає стандарту IST-v1. (Офіційний статус у хмарі фіксується при проходженні з підключеного Google-акаунту).'
    };
};

window.grantFullProgress = async function() {
    if (!currentUserUid) {
        alert('Помилка: ви не авторизовані. Спочатку увійдіть через Google!');
        return;
    }
    const name = window.istoriyaUser?.displayName || 'Мацевич Орест Дмитрович';
    try {
        console.log('⚡ Надаємо 100% прогрес для:', currentUserUid);
        const full = await grantFullProgress(currentUserUid, name);
        currentProgress = full;
        alert(`⚡ 100% ПРОГРЕСУ УСПІШНО НАДАНО!\n\n• Відкрито всі 8 стадій\n• Нараховано 96 зірок (по 3 на кожен рівень)\n• Усі 8 босів переможені\n• Згенеровано валідний сертифікат: ${full.certificate.code}\n• Зареєстровано в базі даних Firestore\n\nСторінка зараз оновиться.`);
        window.location.reload();
    } catch (e) {
        console.error('Помилка надання прогресу:', e);
        alert('Помилка збереження прогресу у Firestore: ' + e.message);
    }
};

window.resetProgress = async function() {
    if (!currentUserUid) return;
    if (confirm('Скинути весь прогрес до нуля (початковий стан)?')) {
        await resetProgress(currentUserUid);
        window.location.reload();
    }
};

window.showLeaderboard = function() {
    document.getElementById('leaderboard-modal')?.classList.remove('hidden');
    window.loadTopPlayers();
};

window.hideLeaderboard = function() {
    document.getElementById('leaderboard-modal')?.classList.add('hidden');
};

window.signInWithGoogle = async function() {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Помилка авторизації Google:", error);
    }
};

function setupGuestNav() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.classList.remove('nav-logout');
        logoutBtn.classList.add('nav-login-btn');
        logoutBtn.title = 'Увійти через Google';
        logoutBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Увійти</span>
        `;
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            window.signInWithGoogle();
        };
    }

    const brand = document.querySelector('.nav-brand');
    if (brand && !document.getElementById('nav-guest-pill')) {
        const pill = document.createElement('span');
        pill.id = 'nav-guest-pill';
        pill.className = 'nav-guest-pill';
        pill.textContent = 'Демо';
        pill.title = 'Ознайомчий режим для оцінки журі';
        brand.appendChild(pill);
    }
}

function setupUserNav() {
    const pill = document.getElementById('nav-guest-pill');
    if (pill) pill.remove();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.classList.remove('nav-login-btn');
        logoutBtn.classList.add('nav-logout');
        logoutBtn.title = 'Вийти з акаунту';
        logoutBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>${cossackLang ? COSSACK_TEXTS.nav.logout.cossack : COSSACK_TEXTS.nav.logout.normal}</span>
        `;
        logoutBtn.onclick = async () => {
            sessionStorage.removeItem('istoriya_guest');
            await signOut(auth);
            window.location.href = isSubfolder ? '../lobby/lobby.html' : 'lobby/lobby.html';
        };
    }
}

function setupGuestSettingsLock() {
    const isSettings = window.location.pathname.includes('/home/') || window.location.pathname.endsWith('home/index.html');
    if (!isSettings) return;

    if (document.getElementById('guest-lock-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'guest-lock-overlay';
    overlay.className = 'guest-lock-overlay';
    overlay.innerHTML = `
        <div class="guest-lock-card">
            <div class="guest-lock-icon">🔒</div>
            <div class="guest-lock-badge">ХМАРНА СИНХРОНІЗАЦІЯ</div>
            <h2 class="guest-lock-title">Налаштування закриті в демо-режимі</h2>
            <p class="guest-lock-text">
                Усі параметри теми, кольори GUI, фактура фону та обрані плейлисти прив'язані до хмарної бази Firestore і синхронізуються з обліковим записом Google.
            </p>
            <p class="guest-lock-sub">
                Увійдіть через Google, щоб персоналізувати власний стиль та зберегти налаштування між пристроями.
            </p>
            <div class="guest-lock-actions">
                <button type="button" class="guest-lock-login-btn" id="guest-overlay-login-btn">Увійти через Google</button>
                <button type="button" class="guest-lock-back-btn" onclick="window.goToAbout()">Про проєкт</button>
                <button type="button" class="guest-lock-back-btn" onclick="window.goToMap()">До карти 3D</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('#guest-overlay-login-btn');
    if (btn) {
        btn.addEventListener('click', () => window.signInWithGoogle());
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        sessionStorage.removeItem('istoriya_guest');
        const guestOverlay = document.getElementById('guest-lock-overlay');
        if (guestOverlay) guestOverlay.remove();

        setupUserNav();

        if (isLobbyPage) {
            window.location.href = '../about/about.html';
        } else {
            currentUserUid = user.uid;
            const docRef = doc(db, "users", currentUserUid);
            
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                handleFirstLogin();
                
                const initialSettings = { 
                    h, o, s, h2, o2, s2, 
                    bgColor, guiColor, voiceMiniGame, cossackLang,
                    fontState, backState, thingsState 
                };
                await setDoc(docRef, { 
                    settings: initialSettings,
                    displayName: user.displayName || "user",
                    highScore: 0
                });
                try {
                    await setDoc(doc(db, "leaderboard", currentUserUid), {
                        displayName: user.displayName || "user",
                        highScore: 0,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                } catch (e) {
                    console.warn('[Leaderboard Sync Warning] Хмарні правила ще не дозволяють запис у /leaderboard:', e);
                }
            } else {
                const existingName = docSnap.data().displayName || user.displayName || "user";
                const existingScore = docSnap.data().highScore || 0;
                if (docSnap.data().displayName === undefined) {
                    await setDoc(docRef, { 
                        displayName: existingName,
                        highScore: existingScore
                    }, { merge: true });
                }
                // Гарантуємо запис у відкритому лідерборді
                try {
                    await setDoc(doc(db, "leaderboard", currentUserUid), {
                        displayName: existingName,
                        highScore: existingScore,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                } catch (e) {
                    console.warn('[Leaderboard Sync Warning] Хмарні правила ще не дозволяють запис у /leaderboard:', e);
                }
            }

            try {
                currentProgress = await ensureProgress(currentUserUid);
            } catch (error) {
                console.error('Не вдалося ініціалізувати прогрес:', error);
            }
            resolveLimboReady({ uid: currentUserUid, isGuest: false, progress: currentProgress });
            window.istoriyaUser = { uid: currentUserUid, isGuest: false, progress: currentProgress };
            window.dispatchEvent(new CustomEvent('istoriyaAuthChange', { detail: { uid: currentUserUid, isGuest: false, progress: currentProgress } }));

            if (unsubListener) unsubListener();

            unsubListener = onSnapshot(docRef, (snap) => {
                if (snap.exists() && snap.data().settings) {
                    const data = snap.data().settings;
                    
                    h = data.h ?? 0; o = data.o ?? 0; s = data.s ?? 0;
                    h2 = data.h2 ?? 0; o2 = data.o2 ?? 0; s2 = data.s2 ?? 0;
                    
                    bgColor = data.bgColor || (data.h !== undefined && data.o && data.s ? `hsl(${data.h}, ${data.o}%, ${data.s}%)` : '#0e1117');
                    guiColor = data.guiColor || '#c5a47e';
                    voiceMiniGame = data.voiceMiniGame !== undefined ? !!data.voiceMiniGame : true;
                    cossackLang = !!data.cossackLang;

                    fontState = !!data.fontState; 
                    backState = !!data.backState; 
                    thingsState = !!data.thingsState;
                    
                    updateUI();
                }
            });

            if (loader) loader.style.display = 'none';
            const appContent = document.getElementById('app-content');
            if (appContent) appContent.style.display = 'block';

            const DEV_UID = 'IW5LKzQM5jQJergx42elqvQv28V2';
            if (currentUserUid === DEV_UID) {
                console.log('👑 Авторизовано автора (Орест Мацевич). Доступна команда: grantFullProgress()');
                const devSec = document.getElementById('dev-admin-section');
                if (devSec) devSec.classList.remove('hidden');
            }
        }
    } else {
        if (unsubListener) {
            unsubListener();
            unsubListener = null;
        }

        if (isLobbyPage) {
            if (loader) loader.style.display = 'none';
            const authUi = document.getElementById('auth-ui');
            if (authUi) authUi.style.display = 'block';
        } else {
            // Демо-режим (Гість без авторизації)
            currentUserUid = null;
            currentProgress = createEmptyProgress();
            resolveLimboReady({ uid: null, isGuest: true, progress: currentProgress });
            window.istoriyaUser = { uid: null, isGuest: true, progress: currentProgress };

            handleFirstLogin();

            if (loader) loader.style.display = 'none';
            const appContent = document.getElementById('app-content');
            if (appContent) appContent.style.display = 'block';

            const DEV_UID = 'IW5LKzQM5jQJergx42elqvQv28V2';
            if (currentUserUid === DEV_UID) {
                console.log('👑 Авторизовано автора (Орест Мацевич). Доступна команда: grantFullProgress()');
                const devSec = document.getElementById('dev-admin-section');
                if (devSec) devSec.classList.remove('hidden');
            }

            setupGuestNav();
            setupGuestSettingsLock();
            window.dispatchEvent(new CustomEvent('istoriyaAuthChange', { detail: { uid: null, isGuest: true, progress: currentProgress } }));
        }
    }
});

export { app, auth, db };
