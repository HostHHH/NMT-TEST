import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { initProgressStore, ensureProgress } from "../core/progressStore.js";
// nav.js реєструє goToMap/goToDef/goToGame у window
import "../core/nav.js";

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

let currentUserUid = null;
let saveTimeout = null;
let unsubListener = null;

let h = 0, o = 0, s = 0, h2 = 0, o2 = 0, s2 = 0;
let bgColor = '#0e1117';
let guiColor = '#c5a47e';
let voiceMiniGame = false;
let cossackLang = false;
let fontState = false, backState = false, thingsState = false;

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
    voiceMiniGame = false;
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
        const currentHigh = docSnap.data().highScore || 0;
        if (newScore > currentHigh) {
            await setDoc(docRef, { highScore: newScore }, { merge: true });
        }
    }
};

window.loadTopPlayers = async function() {
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (!leaderboardEl) return;

    try {
        const q = query(collection(db, "users"), orderBy("highScore", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        leaderboardEl.innerHTML = '';
        let count = 0;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = data.displayName || "user";
            const score = data.highScore || 0;
            
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = String(score);
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
        console.error(error);
    }
};

window.showLeaderboard = function() {
    document.getElementById('leaderboard-modal')?.classList.remove('hidden');
    window.loadTopPlayers();
};

window.hideLeaderboard = function() {
    document.getElementById('leaderboard-modal')?.classList.add('hidden');
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (isLobbyPage) {
            window.location.href = '../home/index.html';
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
            } else {
                if (docSnap.data().displayName === undefined) {
                    await setDoc(docRef, { 
                        displayName: user.displayName || "user",
                        highScore: docSnap.data().highScore || 0
                    }, { merge: true });
                }
            }

            try {
                currentProgress = await ensureProgress(currentUserUid);
            } catch (error) {
                console.error('Не вдалося ініціалізувати прогрес:', error);
            }
            resolveLimboReady({ uid: currentUserUid, progress: currentProgress });

            if (unsubListener) unsubListener();

            unsubListener = onSnapshot(docRef, (snap) => {
                if (snap.exists() && snap.data().settings) {
                    const data = snap.data().settings;
                    
                    h = data.h ?? 0; o = data.o ?? 0; s = data.s ?? 0;
                    h2 = data.h2 ?? 0; o2 = data.o2 ?? 0; s2 = data.s2 ?? 0;
                    
                    bgColor = data.bgColor || (data.h !== undefined && data.o && data.s ? `hsl(${data.h}, ${data.o}%, ${data.s}%)` : '#0e1117');
                    guiColor = data.guiColor || '#c5a47e';
                    voiceMiniGame = !!data.voiceMiniGame;
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
        }
    } else {
        if (unsubListener) {
            unsubListener();
            unsubListener = null;
        }
        
        if (!isLobbyPage) {
            window.location.href = isSubfolder ? '../lobby/lobby.html' : 'lobby/lobby.html';
        } else {
            if (loader) loader.style.display = 'none';
            const authUi = document.getElementById('auth-ui');
            if (authUi) authUi.style.display = 'block';
        }
    }
});
