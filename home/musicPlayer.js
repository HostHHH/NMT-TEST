// home/musicPlayer.js
// Повнофункціональний контролер аудіоплеєра, локальних треків та онлайн-радіостанцій

export const PLAYLISTS = [
    {
        id: 'metal',
        name: 'Метал-бенгери',
        badge: 'Heavy & Fast',
        icon: '🎸',
        desc: 'Качаючий важкий саунд із твого списку для тих, хто любить пожосткіше:',
        liveStream: 'https://online.radioroks.ua/RadioROKS_HD',
        liveStreamName: 'Radio ROKS HD (Україна)',
        tracks: [
            { title: 'Fast as a Shark', artist: 'Accept', duration: '3:49', src: '../music/fast_as_a_shark.mp3' },
            { title: 'AC/DC - Thunderstruck', artist: 'Miro1973', duration: '4:52', src: '../music/thunderstruck.mp3' },
            { title: 'Battery (Metallica)', artist: 'PROTOTYPE', duration: '5:12', src: '../music/battery.mp3' },
            { title: 'Benzin', artist: 'Diezel / RammsteinTribute', duration: '3:46', src: '../music/benzin.mp3' },
            { title: 'The Beautiful People (Marilyn Manson)', artist: 'SOS Management', duration: '3:38', src: '../music/the_beautiful_people.mp3' },
            { title: 'Bloodline', artist: 'TrueStar / Slayer', duration: '3:36', src: '../music/bloodline.mp3' },
            { title: 'Radio', artist: 'Rammstein', duration: '4:37', src: '../music/radio.mp3' }
        ]
    },
    {
        id: 'global-pop',
        name: 'Радіо-поп хіти',
        badge: 'Global Pop',
        icon: '📻',
        desc: 'Найвідоміші чартові треки, які знає буквально кожен і які ставлять на фон:',
        liveStream: 'https://online.hitfm.ua/HitFM_HD',
        liveStreamName: 'Хіт FM HD (Global Pop)',
        tracks: [
            { title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a' },
            { title: 'Levitating', artist: 'Dua Lipa', duration: '3:23', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a' },
            { title: 'As It Was', artist: 'Harry Styles', duration: '2:47', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a' },
            { title: 'Flowers', artist: 'Miley Cyrus', duration: '3:20', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/68/9e/f7/689ef7fe-14fe-a846-c87f-7d3b2d6344b1/mzaf_4167137058064023087.plus.aac.p.m4a' },
            { title: 'Bad Habits', artist: 'Ed Sheeran', duration: '3:51', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f2/08/5d/f2085d7c-a4d0-451b-4d1d-ccc3057ab6e2/mzaf_11771336260379351390.plus.aac.p.m4a' }
        ]
    },
    {
        id: 'ua-pop',
        name: 'Сучасна укр-сцена',
        badge: 'UA Pop / Indie',
        icon: '🇺🇦',
        desc: 'Рідне й актуальне — звучить стильно, сучасно і прямо в тему сайту про Україну:',
        liveStream: 'https://online.radiobayraktar.ua/RadioBayraktar_HD',
        liveStreamName: 'Радіо Байрактар HD (UA Музика)',
        tracks: [
            { title: 'Чи разом?', artist: 'KOLA', duration: '3:15', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/73/fd/16/73fd16cf-4315-3706-2c61-011e2e45a8a1/mzaf_13361203733140546163.plus.aac.p.m4a' },
            { title: 'Гуси', artist: 'Wellboy', duration: '3:05', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c2/5d/ae/c25daee6-a47e-19b0-09ec-b1b069a59c13/mzaf_3003270467237166884.plus.aac.p.m4a' },
            { title: 'Дежавю', artist: 'Артем Пивоваров', duration: '3:42', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/be/7c/51/be7c5177-827d-6ea2-b446-9408942ddf0b/mzaf_13508347127706542272.plus.aac.p.m4a' },
            { title: 'Той день (feat. KOLA & Jerry Heil)', artist: 'YAKTAK', duration: '2:56', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/44/ac/46/44ac46e2-eb38-c36e-c280-7d0f57b91954/mzaf_14519011576608496781.plus.aac.p.m4a' },
            { title: 'Мрія', artist: 'Jerry Heil', duration: '3:10', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/96/90/0a/96900a33-bff4-7dd5-52ba-3b3b7b5d7ac8/mzaf_4326761663651915104.plus.aac.p.m4a' }
        ]
    },
    {
        id: 'lofi',
        name: 'Lo-Fi Hip-Hop / Chill',
        badge: 'Chill & Study',
        icon: '☕',
        desc: 'Класичний формат «музика для навчання та тестів» — м’які ненав’язливі біти:',
        liveStream: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
        liveStreamName: '24/7 Lo-Fi Chillhop Radio',
        tracks: [
            { title: 'Snowman', artist: 'Lofi Girl / ChilledCow', duration: '2:40', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/66/e2/88/66e288bc-28e6-7275-cd4a-eaf531a15c24/mzaf_15212669421150687722.plus.aac.p.m4a' },
            { title: "The Girl I Haven't Met", artist: 'Kudasaibeats', duration: '2:12', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9d/b5/a4/9db5a492-557e-a3b7-b07a-e7a3cb0943f7/mzaf_13442994239320567104.plus.aac.p.m4a' },
            { title: 'im closing my eyes', artist: 'potsu', duration: '2:07', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/92/46/17/924617d7-5f7d-38ee-6015-6f967e58d63e/mzaf_2929103300763082961.plus.aac.p.m4a' },
            { title: 'affection', artist: 'jinsang', duration: '1:54', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/27/7f/5a/277f5a90-6ca3-a8e8-931c-8dd7c1d472fd/mzaf_4569701282117560653.plus.aac.p.m4a' },
            { title: 'Both of Us', artist: 'Idealism', duration: '2:35', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/3d/f5/ee/3df5ee5a-4406-fab8-4b47-973026c648f1/mzaf_14128045008363865077.plus.aac.p.m4a' }
        ]
    },
    {
        id: 'epic-folk',
        name: 'Epic / Folk / Cinematic',
        badge: 'Козацька Атмосфера',
        icon: '⚔️',
        desc: 'Кінематографічний саундтрек для гри про козаків та сюжетних історичних тестів:',
        liveStream: 'https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3',
        liveStreamName: 'Epic Orchestral Radio',
        tracks: [
            { title: 'Victory', artist: 'Two Steps From Hell', duration: '5:20', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8f/56/9b/8f569b90-dab2-362e-f781-3e4d8fe55a80/mzaf_11933332260505895878.plus.aac.p.m4a' },
            { title: 'Time', artist: 'Hans Zimmer', duration: '4:35', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e0/1d/a4/e01da4a2-a75f-7ebf-9971-3d49e17efc57/mzaf_10500078769097048384.plus.aac.p.m4a' },
            { title: 'Helvegen', artist: 'Wardruna', duration: '6:57', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6f/4d/43/6f4d43cc-3f58-335c-4c52-697d81987cc9/mzaf_9782517602348447361.plus.aac.p.m4a' },
            { title: 'Ягудки (інструментал)', artist: 'ДахаБраха', duration: '4:48', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8d/c9/94/8dc99408-afe2-f7d3-f766-90975d0a73f8/mzaf_14852627444334733852.plus.aac.p.m4a' },
            { title: 'Legend', artist: 'Adrian von Ziegler', duration: '3:47', src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fd/43/94/fd439430-b520-1898-9aae-c55943bf6891/mzaf_14139166160937566542.plus.aac.p.m4a' }
        ]
    }
];

// Допоміжні функції часу
function parseDurationToSeconds(durStr) {
    if (!durStr) return 180;
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 180;
}

function formatSeconds(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
}

// Стан плеєра
let currentPlIndex = 0;
let currentTrackIndex = 0;
let isPlaying = false;
let isLiveRadio = false;
let isMuted = false;
let savedVolume = 0.5;

// Відновлення стану зі сховища
try {
    const savedPl = localStorage.getItem('istoriya_music_pl');
    if (savedPl !== null && PLAYLISTS[Number(savedPl)]) currentPlIndex = Number(savedPl);
    const savedTr = localStorage.getItem('istoriya_music_track');
    if (savedTr !== null) currentTrackIndex = Number(savedTr);
    const savedVol = localStorage.getItem('istoriya_music_vol');
    if (savedVol !== null) savedVolume = parseFloat(savedVol);
} catch (e) {
    // Ігноруємо обмеження доступу до сховища
}

// DOM елементи
const audio = document.getElementById('audio-player');
const btnPlay = document.getElementById('btn-play');
const playIcon = document.getElementById('play-icon');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnBackward = document.getElementById('btn-backward');
const btnForward = document.getElementById('btn-forward');
const timeline = document.getElementById('music-timeline');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const trackNameEl = document.getElementById('track-name');
const trackGroupEl = document.getElementById('track-group');
const playerTrackIcon = document.getElementById('player-track-icon');
const plBadgeEl = document.getElementById('current-playlist-badge');
const plTitleEl = document.getElementById('pl-title');
const plDescEl = document.getElementById('pl-desc');
const tracklistCountEl = document.getElementById('tracklist-count');
const tracklistItemsEl = document.getElementById('tracklist-items');
const volumeSlider = document.getElementById('volume-slider');
const volLabel = document.getElementById('vol-label');
const btnMute = document.getElementById('btn-mute');
const btnLiveRadio = document.getElementById('btn-live-radio');
const playingStateBadge = document.getElementById('playing-state-badge');
const playlistsNav = document.getElementById('playlists-nav');

function showToast(msg) {
    let toast = document.querySelector('.player-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'player-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2400);
}

function getActivePlaylist() {
    return PLAYLISTS[currentPlIndex] || PLAYLISTS[0];
}

function getActiveTrack() {
    const pl = getActivePlaylist();
    if (!pl.tracks[currentTrackIndex]) {
        currentTrackIndex = 0;
    }
    return pl.tracks[currentTrackIndex];
}

// Рендер списку композицій
function renderTracklist() {
    if (!tracklistItemsEl) return;
    const pl = getActivePlaylist();
    tracklistItemsEl.innerHTML = '';

    pl.tracks.forEach((track, idx) => {
        const item = document.createElement('div');
        const isCurrent = !isLiveRadio && idx === currentTrackIndex;
        item.className = `track-item ${isCurrent ? 'active' : ''}`;
        item.dataset.index = idx;

        const numStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
        item.innerHTML = `
            <span class="track-num">${numStr}</span>
            <div class="track-meta">
                <span class="track-row-title">${track.title}</span>
                <span class="track-row-artist">${track.artist}</span>
            </div>
            <span class="track-row-duration">${track.duration}</span>
            <span class="track-row-icon">${isCurrent && isPlaying ? '⏸' : '▶'}</span>
        `;

        item.addEventListener('click', () => {
            selectTrack(idx, true);
        });

        tracklistItemsEl.appendChild(item);
    });

    if (tracklistCountEl) {
        tracklistCountEl.textContent = `${pl.tracks.length} треків`;
    }
}

// Оновлення стану відтворення в інтерфейсі
function updatePlayStateUI() {
    if (playingStateBadge) {
        if (isPlaying) {
            playingStateBadge.textContent = isLiveRadio ? 'ЕФІР' : 'Грає';
            playingStateBadge.classList.add('playing');
        } else {
            playingStateBadge.textContent = 'Пауза';
            playingStateBadge.classList.remove('playing');
        }
    }

    if (playIcon) {
        playIcon.textContent = isPlaying ? '⏸' : '▶';
    }

    if (btnLiveRadio) {
        btnLiveRadio.classList.toggle('active', isLiveRadio);
    }

    renderTracklist();
}

// Оновлення прогресу та таймлайну
function updateTimelineUI() {
    if (!audio) return;

    if (isLiveRadio) {
        if (currentTimeEl) currentTimeEl.textContent = '🔴 LIVE';
        if (durationTimeEl) durationTimeEl.textContent = 'ЕФІР';
        if (timeline) timeline.value = 100;
        return;
    }

    const currentSec = audio.currentTime || 0;
    const totalSec = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : parseDurationToSeconds(getActiveTrack()?.duration);

    if (currentTimeEl) {
        currentTimeEl.textContent = formatSeconds(currentSec);
    }

    if (durationTimeEl) {
        durationTimeEl.textContent = Number.isFinite(audio.duration) && audio.duration > 0
            ? formatSeconds(audio.duration)
            : getActiveTrack()?.duration || '0:00';
    }

    if (timeline && totalSec > 0) {
        timeline.value = Math.min(100, (currentSec / totalSec) * 100);
    }
}

// Оновлення текстової інформації плеєра
function updatePlayerUI() {
    const pl = getActivePlaylist();

    if (plBadgeEl) plBadgeEl.textContent = pl.name;
    if (plTitleEl) plTitleEl.textContent = `${currentPlIndex + 1}. ${pl.name} (${pl.badge})`;
    if (plDescEl) plDescEl.textContent = pl.desc;
    if (playerTrackIcon) playerTrackIcon.textContent = pl.icon;

    if (isLiveRadio) {
        if (trackNameEl) trackNameEl.textContent = pl.liveStreamName || 'Онлайн-радіо';
        if (trackGroupEl) trackGroupEl.textContent = '🔴 Прямий трансляційний ефір';
        if (durationTimeEl) durationTimeEl.textContent = 'ЕФІР';
    } else {
        const track = getActiveTrack();
        if (trackNameEl) trackNameEl.textContent = track.title;
        if (trackGroupEl) trackGroupEl.textContent = track.artist;
        if (durationTimeEl) durationTimeEl.textContent = track.duration;
    }

    // Чіпи плейлистів
    if (playlistsNav) {
        const chips = playlistsNav.querySelectorAll('.playlist-chip');
        chips.forEach((c, idx) => {
            c.classList.toggle('active', idx === currentPlIndex);
        });
    }

    updatePlayStateUI();
    updateTimelineUI();
}

// Завантаження треку в аудіоелемент
function loadTrackAudio(track, autoPlay = true) {
    if (!audio) return;
    isLiveRadio = false;

    // Встановлення джерела треку
    const targetSrc = track.src;
    if (!audio.src || !audio.src.endsWith(targetSrc.replace(/^\.\.\//, ''))) {
        audio.src = targetSrc;
        audio.load();
    }

    updatePlayerUI();

    if (autoPlay) {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayStateUI();
        }).catch((err) => {
            console.warn('Autoplay requires user interaction:', err);
            isPlaying = false;
            updatePlayStateUI();
        });
    }
}

// Вибір плейлиста
export function selectPlaylist(index, autoPlay = false) {
    if (index < 0 || index >= PLAYLISTS.length) return;
    currentPlIndex = index;
    currentTrackIndex = 0;
    isLiveRadio = false;

    try {
        localStorage.setItem('istoriya_music_pl', currentPlIndex);
        localStorage.setItem('istoriya_music_track', currentTrackIndex);
    } catch (e) {}

    const pl = getActivePlaylist();
    showToast(`Плейлист: ${pl.icon} ${pl.name}`);

    const track = getActiveTrack();
    loadTrackAudio(track, autoPlay || isPlaying);
}

// Вибір треку
export function selectTrack(trackIdx, autoPlay = true) {
    const pl = getActivePlaylist();
    if (trackIdx < 0 || trackIdx >= pl.tracks.length) return;
    currentTrackIndex = trackIdx;
    isLiveRadio = false;

    try {
        localStorage.setItem('istoriya_music_track', currentTrackIndex);
    } catch (e) {}

    const track = getActiveTrack();
    showToast(`🎵 ${track.artist} — ${track.title}`);
    loadTrackAudio(track, autoPlay);
}

// Увімкнення прямого онлайн-ефіру радіо
export function playLiveRadio() {
    const pl = getActivePlaylist();
    if (!pl.liveStream || !audio) {
        showToast('Прямий ефір недоступний для цього списку');
        return;
    }

    isLiveRadio = true;
    audio.src = pl.liveStream;
    audio.load();

    audio.play().then(() => {
        isPlaying = true;
        updatePlayerUI();
        showToast(`📻 Ефір: ${pl.liveStreamName}`);
    }).catch((err) => {
        console.warn('Stream connect error:', err);
        showToast('Помилка з’єднання з радіоефіром');
        isLiveRadio = false;
        updatePlayerUI();
    });
}

// Перемикання Play/Pause
export function togglePlay() {
    if (!audio) return;

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayStateUI();
    } else {
        if (!audio.src || audio.src === window.location.href) {
            const track = getActiveTrack();
            loadTrackAudio(track, true);
        } else {
            audio.play().then(() => {
                isPlaying = true;
                updatePlayStateUI();
            }).catch((err) => {
                console.warn('Play error:', err);
            });
        }
    }
}

// Попередній трек
export function prevTrack() {
    if (isLiveRadio) {
        isLiveRadio = false;
        selectTrack(currentTrackIndex, true);
        return;
    }

    if (audio && audio.currentTime > 4) {
        audio.currentTime = 0;
        updateTimelineUI();
        return;
    }

    const pl = getActivePlaylist();
    let nextIdx = currentTrackIndex - 1;
    if (nextIdx < 0) nextIdx = pl.tracks.length - 1;
    selectTrack(nextIdx, isPlaying);
}

// Наступний трек
export function nextTrack() {
    if (isLiveRadio) {
        isLiveRadio = false;
    }
    const pl = getActivePlaylist();
    let nextIdx = currentTrackIndex + 1;
    if (nextIdx >= pl.tracks.length) nextIdx = 0;
    selectTrack(nextIdx, isPlaying);
}

// Перемотка на дельту секунд
function seekRelative(deltaSeconds) {
    if (isLiveRadio || !audio) return;
    const dur = (Number.isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : parseDurationToSeconds(getActiveTrack()?.duration);

    audio.currentTime = Math.max(0, Math.min(dur, audio.currentTime + deltaSeconds));
    updateTimelineUI();
}

// Перемотка за слайдером (0..100)
function seekToPercent(pct) {
    if (isLiveRadio || !audio) return;
    const dur = (Number.isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : parseDurationToSeconds(getActiveTrack()?.duration);

    audio.currentTime = (pct / 100) * dur;
    updateTimelineUI();
}

// Гучність
function setVolume(val) {
    savedVolume = Math.max(0, Math.min(1, val));
    if (audio) audio.volume = isMuted ? 0 : savedVolume;
    if (volumeSlider) volumeSlider.value = Math.round(savedVolume * 100);
    if (volLabel) volLabel.textContent = `${Math.round(savedVolume * 100)}%`;
    if (btnMute) {
        btnMute.textContent = isMuted || savedVolume === 0 ? '🔇' : (savedVolume < 0.5 ? '🔉' : '🔊');
    }
    try {
        localStorage.setItem('istoriya_music_vol', savedVolume);
    } catch (e) {}
}

function toggleMute() {
    isMuted = !isMuted;
    if (audio) audio.volume = isMuted ? 0 : savedVolume;
    if (btnMute) {
        btnMute.textContent = isMuted ? '🔇' : (savedVolume < 0.5 ? '🔉' : '🔊');
    }
    if (volLabel) {
        volLabel.textContent = isMuted ? '0%' : `${Math.round(savedVolume * 100)}%`;
    }
}

// Налаштування слухачів аудіоелемента
if (audio) {
    audio.volume = savedVolume;

    audio.addEventListener('play', () => {
        isPlaying = true;
        updatePlayStateUI();
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayStateUI();
    });

    audio.addEventListener('timeupdate', () => {
        updateTimelineUI();
    });

    audio.addEventListener('loadedmetadata', () => {
        updateTimelineUI();
    });

    audio.addEventListener('ended', () => {
        if (!isLiveRadio) {
            nextTrack();
        }
    });

    audio.addEventListener('error', (e) => {
        console.warn('Audio playback error:', e);
        // Якщо це не помилка зупинки користувачем
        if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
            showToast('Помилка аудіопотоку');
        }
    });
}

// Прив'язка подій елементів керування
if (btnPlay) btnPlay.addEventListener('click', togglePlay);
if (btnPrev) btnPrev.addEventListener('click', prevTrack);
if (btnNext) btnNext.addEventListener('click', nextTrack);
if (btnBackward) btnBackward.addEventListener('click', () => seekRelative(-10));
if (btnForward) btnForward.addEventListener('click', () => seekRelative(10));

if (btnLiveRadio) {
    btnLiveRadio.addEventListener('click', () => {
        if (isLiveRadio && isPlaying) {
            togglePlay();
        } else {
            playLiveRadio();
        }
    });
}

if (timeline) {
    timeline.addEventListener('input', () => {
        seekToPercent(parseFloat(timeline.value) || 0);
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
        isMuted = false;
        setVolume((parseFloat(volumeSlider.value) || 0) / 100);
    });
}

if (btnMute) {
    btnMute.addEventListener('click', toggleMute);
}

// Клік по чіпах вибору плейлистів
if (playlistsNav) {
    playlistsNav.addEventListener('click', (e) => {
        const chip = e.target.closest('.playlist-chip');
        if (!chip) return;
        const idx = parseInt(chip.dataset.index, 10);
        if (!isNaN(idx)) {
            selectPlaylist(idx, isPlaying);
        }
    });
}

// Початкова ініціалізація
setVolume(savedVolume);
const initialTrack = getActiveTrack();
if (initialTrack) {
    loadTrackAudio(initialTrack, false);
} else {
    updatePlayerUI();
}
