import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const isSubfolder = window.location.pathname.includes('/Rus/');
const isLobbyPage = window.location.pathname.includes('lobby.html');
const loader = document.getElementById('loader');

let currentUserUid = null;
let saveTimeout = null;
let unsubListener = null;

let h = 0, o = 0, s = 0, h2 = 0, o2 = 0, s2 = 0;
let fontState = false, backState = false, thingsState = false;

window.goToRus = function() { 
    window.location.href = isSubfolder ? 'rus.html' : 'Rus/rus.html'; 
}

window.goToDef = function() { 
    window.location.href = isSubfolder ? '../index.html' : 'index.html'; 
}

window.other = function() {
    const color1 = document.querySelector('.color1');
    const color2 = document.querySelector('.color2');
    if(color1 && color2) {
        color1.classList.toggle('hidden');
        color2.classList.toggle('hidden');
    }
}

window.randomBackground = function() {
    h = Math.trunc(Math.random() * 360);
    o = Math.trunc(Math.random() * 100);
    s = Math.trunc(Math.random() * 100);
    
    h2 = Math.trunc(Math.random() * 360);
    o2 = Math.trunc(Math.random() * 100);
    s2 = Math.trunc(Math.random() * 100);

    updateUI();
    scheduleSave();
}

const inputH = document.querySelector('.aa');
const inputO = document.querySelector('.bb');
const inputS = document.querySelector('.cc');
const inputH2 = document.querySelector('.aa2');
const inputO2 = document.querySelector('.bb2');
const inputS2 = document.querySelector('.cc2');

const fontCheckbox = document.querySelector('.switch.font input');
const backCheckbox = document.querySelector('.switch.back input');
const thingsCheckbox = document.querySelector('.SwitcherIn.things input');

function applyColors() {
    document.body.style.background = `linear-gradient(45deg, hsl(${h}, ${o}%, ${s}%), hsl(${h2}, ${o2}%, ${s2}%))`;
}

function updateUI() {
    if (inputH && inputO && inputS && inputH2 && inputO2 && inputS2) {
        inputH.value = h;
        inputO.value = o;
        inputS.value = s;
        inputH2.value = h2;
        inputO2.value = o2;
        inputS2.value = s2;
    }
    
    if (fontCheckbox) fontCheckbox.checked = fontState;
    if (backCheckbox) backCheckbox.checked = backState;
    if (thingsCheckbox) thingsCheckbox.checked = thingsState;
    
    applyColors();
}

async function saveToFirebase() {
    if (!currentUserUid) return;
    const settings = { h, o, s, h2, o2, s2, fontState, backState, thingsState };
    await setDoc(doc(db, "users", currentUserUid), { settings }, { merge: true });
}

function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToFirebase, 1000);
}

if (inputH) {
    [inputH, inputO, inputS, inputH2, inputO2, inputS2].forEach(input => {
        input.addEventListener('input', (e) => {
            if(e.target === inputH) h = e.target.value;
            if(e.target === inputO) o = e.target.value;
            if(e.target === inputS) s = e.target.value;
            if(e.target === inputH2) h2 = e.target.value;
            if(e.target === inputO2) o2 = e.target.value;
            if(e.target === inputS2) s2 = e.target.value;
            
            applyColors();
            scheduleSave();
        });
    });
}

const toggles = [
    { el: fontCheckbox, key: 'fontState' },
    { el: backCheckbox, key: 'backState' },
    { el: thingsCheckbox, key: 'thingsState' }
];

toggles.forEach(item => {
    if (item.el) {
        item.el.addEventListener('change', function() {
            if(item.key === 'fontState') fontState = this.checked;
            if(item.key === 'backState') backState = this.checked;
            if(item.key === 'thingsState') thingsState = this.checked;
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
    h = 200;
    o = 50;
    s = 50;
    
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
        
        let html = '';
        let count = 0;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = data.displayName || "user";
            const score = data.highScore || 0;
            html += `<li><span>${name}</span><span>${score}</span></li>`;
            count++;
        });

        for (let i = count; i < 10; i++) {
            html += `<li><span>user</span><span>0</span></li>`;
        }

        leaderboardEl.innerHTML = html;
    } catch (error) {
        console.error(error);
    }
};

window.showLeaderboard = function() {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    window.loadTopPlayers();
};

window.hideLeaderboard = function() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (isLobbyPage) {
            window.location.href = 'index.html';
        } else {
            currentUserUid = user.uid;
            const docRef = doc(db, "users", currentUserUid);
            
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                handleFirstLogin();
                
                const initialSettings = { h, o, s, h2, o2, s2, fontState, backState, thingsState };
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
            
            if (unsubListener) unsubListener();
            
            unsubListener = onSnapshot(docRef, (snap) => {
                if (snap.exists() && snap.data().settings) {
                    const data = snap.data().settings;
                    
                    h = data.h ?? 0; o = data.o ?? 0; s = data.s ?? 0;
                    h2 = data.h2 ?? 0; o2 = data.o2 ?? 0; s2 = data.s2 ?? 0;
                    
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
            window.location.href = isSubfolder ? '../lobby.html' : 'lobby.html';
        } else {
            if (loader) loader.style.display = 'none';
            const authUi = document.getElementById('auth-ui');
            if (authUi) authUi.style.display = 'block';
        }
    }
});