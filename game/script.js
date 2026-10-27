const player = document.getElementById('player');
const enemy = document.getElementById('enemy');
const playerHpEl = document.getElementById('playerHp');
const enemyHpEl = document.getElementById('enemyHp');
const gameMenu = document.getElementById('gameMenu');
const menuTitle = document.getElementById('menuTitle');
const menuSubtitle = document.getElementById('menuSubtitle');
const startBtn = document.getElementById('startBtn');
const shopBtn = document.getElementById('shopBtn');
const healBtn = document.getElementById('healBtn');
const randomBtn = document.getElementById('randomBtn');
const strikeBtn = document.getElementById('strikeBtn');
const playerPortrait = document.getElementById('playerPortrait');
const enemyName = document.getElementById('enemyName');
const cutsceneOverlay = document.getElementById('cutsceneOverlay');
const cutsceneText = document.getElementById('cutsceneText');
const deathOverlay = document.getElementById('deathOverlay');
const charBlock = document.querySelector('.characters');
const hotbar = document.querySelector('.hotbar');
const slider = document.getElementById('slider');
const bar = slider ? slider.parentElement : null;
const playerSl = document.getElementById('playerSl');
const shootBar = document.getElementById("shootBar")
const shoot = document.getElementById("shoot")
let secret = 0
let playerhp = 200;
let enemyhp = Math.floor(Math.random() * 21) + 140;
let buff = 1;
let enemyNum = 0;
let isTransitioning = false;
let y = 0;
let hero = 'bodka';
let heroBuff = 1.5;
let deathRules = false;
let isFirstTime = false;
window.__gameActive = true;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================
// СИСТЕМА ОЗВУЧКИ ПЕРСОНАЖІВ (БОГДАН, БАЙДА, ОЛЕГ)
// ========================================================
const HERO_VOICES = {
  bodka: {
    basic: 'sounds/chmel_hetmanskyi_sud.mp3',             // «Гетьманський суд швидкий на руку!»
    random: 'sounds/chmel_khto_ne_ryzykuie.mp3',           // «Хто не ризикує, той не панує!»
    strike: 'sounds/chmel_vohon_iz_kushchiv.mp3',          // «Вогонь із кущів! Не давати перепочинку!»
    heal: 'sounds/chmel_razom_do_peremohy.mp3',            // «Разом до перемоги!»
    victory: 'sounds/chmel_victory_kozatska_zemlia.mp3',   // «Ось так гине кожен, хто зазіхнув на козацьку землю!»
    death: 'sounds/chmel_death_inshyi_hetman_bulavu.mp3',  // «Нехай інший гетьман підніме мою булаву!»
    death_old_woman: 'sounds/chmel_prokliata_vidma_temriava.mp3' // залишено окремо для смерті від старухи
  },
  baida: {
    basic: 'sounds/bayda_lovy_hostynets.mp3',              // «Лови гостинець від Байди!»
    random: 'sounds/bayda_anu_vhaday_zvidky_pryletyt.mp3', // «Ану вгадай, звідки прилетить, виродку!»
    strike: 'sounds/bayda_roznesy_u_trisky.mp3',           // «Рознеси їх у тріски!»
    heal: 'sounds/bayda_otse_kovtnuv_krov_zakypla.mp3',    // «Оце ковтнув, аж кров закипіла!»
    victory: 'sounds/bayda_lezhy_v_pylu_zoloto.mp3',       // «Лежи в пилу, всякрев! Справжнє золото дістається сильнішим.»
    death: 'sounds/bayda_death_padaie.mp3',                // «Байда падає, але пам'ять про мене вас у снах душитиме!»
    death_old_woman: 'sounds/bayda_pidlyi_barmatskyi_tsvyakh.mp3' // залишено окремо для смерті від старухи
  },
  olezhko: {
    basic: 'sounds/oleg_stal_predkiv.mp3',                 // «Сталь моїх предків не прощає.»
    random: 'sounds/oleg_zahybel_naprorokuvaly.mp3',       // «Твою загибель мені напророкували.»
    strike: 'sounds/oleg_bohy_obraly_fatum.mp3',           // «Боги вже обрали твій фатум.»
    heal: 'sounds/oleg_perune_vlyi_sylu.mp3',              // «Перуне, влий силу в мої жили!»
    victory: 'sounds/oleg_kyivskym_mechem.mp3',            // «Ще один володар схилив голову перед київським мечем.»
    death: 'sounds/oleg_death_tuman_zabyraie.mp3',         // «Туман забирає мене... але пророцтво здійсниться!»
    death_old_woman: 'sounds/oleg_death_prorotstvo_barmatskykh_pahorbiv.mp3' // залишено окремо для смерті від старухи
  }
};

let currentVoice = null;
function playHeroVoice(action) {
  if (typeof window.isVoiceMiniGameEnabled === 'function' && !window.isVoiceMiniGameEnabled()) return;
  const heroVoiceSet = HERO_VOICES[hero] || HERO_VOICES['bodka'];
  const soundPath = heroVoiceSet[action];
  if (!soundPath) return;

  try {
    if (currentVoice) {
      currentVoice.pause();
      currentVoice.currentTime = 0;
    }
    currentVoice = new Audio(soundPath);
    currentVoice.volume = 0.95;
    currentVoice.play().catch(err => {
      console.warn('Voice play blocked or failed:', err);
    });
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

function stopVoice() {
  if (currentVoice) {
    currentVoice.pause();
    currentVoice.currentTime = 0;
    currentVoice = null;
  }
}

// ========================================================
// ЗВУКОВІ ЕФЕКТИ УРОНУ (ДАЧА ТА ОТРИМАННЯ УРОНУ)
// ========================================================
function playHitSound(attackType) {
  if (typeof window.isVoiceMiniGameEnabled === 'function' && !window.isVoiceMiniGameEnabled()) return;
  try {
    let soundFile = 'sounds/hit_slash.wav';
    if (attackType === 'basic') {
      soundFile = 'sounds/hit_slash.wav'; // Шабельний розріз
    } else if (attackType === 'random') {
      soundFile = Math.random() < 0.5 ? 'sounds/hit_strike.wav' : 'sounds/hit_slice.ogg'; // Різкий бойовий удар / козацький ніж
    } else if (attackType === 'strikes' || attackType === 'shoot') {
      soundFile = 'sounds/hit_strike.wav'; // Потужний удар залпу
    } else {
      const pool = ['sounds/hit_slash.wav', 'sounds/hit_strike.wav', 'sounds/hit_slice.ogg'];
      soundFile = pool[Math.floor(Math.random() * pool.length)];
    }

    const hitAudio = new Audio(soundFile);
    hitAudio.volume = 0.85;
    hitAudio.play().catch(e => console.warn('Hit audio error:', e));
  } catch (e) {
    console.warn(e);
  }
}

function playHurtSound() {
  if (typeof window.isVoiceMiniGameEnabled === 'function' && !window.isVoiceMiniGameEnabled()) return;
  try {
    const hurtAudio = new Audio('sounds/player_hurt.wav');
    hurtAudio.volume = 0.9;
    hurtAudio.play().catch(e => console.warn('Hurt audio error:', e));
  } catch (e) {
    console.warn(e);
  }
}

let attackVoiceCounter = 0;
let voiceInterval = 5;
const cutsceneDialogs = [
  "Здоров будь! Я — Богдан Хмельницький. Бачу, ти тут новенький.",
  "Твоя задача — вести військо Запорозьке до перемоги. Ми будемо битися з Московитами, Татарами та Поляками.",
  "У тебе є різні атаки на панелі знизу. 'Задум Молодого Джури' б'є випадково, 'Залп із Засідки' вимагає влучності (пробіл), а 'Штабний Удар' б'є стабільно.",
  "Не забувай лікуватися 'Гетьманським Натхненням' та використовувати предмети з бойового мішка (клавіші 1-5).",
  "За перемогу ти отримуватимеш монети. Витрачай їх у магазині з розумом. Ну що ж, до бою!"
];
let currentDialogIndex = 0;
let isTyping = false;
let typeInterval;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTypeSound() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // ігноруємо помилки аудіо
  }
}

function typeWriterEffect(text, index) {
  if (index === 0) {
    cutsceneText.textContent = "";
    isTyping = true;
    clearTimeout(typeInterval);
  }
  
  if (index < text.length) {
    cutsceneText.textContent += text.charAt(index);
    if(text.charAt(index) !== ' ') {
       playTypeSound();
    }
    typeInterval = setTimeout(() => typeWriterEffect(text, index + 1), 35);
  } else {
    isTyping = false;
  }
}

function showCutsceneDialog() {
  currentDialogIndex = 0;
  if(cutsceneOverlay) cutsceneOverlay.classList.remove('hidden');
  typeWriterEffect(cutsceneDialogs[currentDialogIndex], 0);
}
const muscoviteEnemies = [
  "Стрілець-Заблуда", "Застінковий Шляхтич", "Боярський Посіпака",
  "Опричник", "Воєвода Василь Шереметьєв", "Цар Олексій Михайлович",
  "Князь Семен Пожарський", "Дячок-Доносчик", "Драгун-Забіяка",
  "Челядник", "Лапотник", "Под’ячий Викритовець", "Посадський Отаман"
];

const tatarEnemies = [
  "Степовий Нукер", "Ханський Мурза", "Мурза Тугай-Бей",
  "Хан Іслям III Ґерай", "Чауш-Вісник", "Башибузук-Нападник",
  "Ясавул Тремтячий", "Аскер-Стрілець", "Алпаут-Ватажок",
  "Степовий Арканник", "Загонич Людолов", "Сайдак-Охоронець"
];

const polishEnemies = [
  "Гусар-Пійбук", "Яничар-Сорвиголова", "Найманець-Рейтар",
  "Князь Ярема Вишневецький", "Гетьман Миколай Потоцький", "Гетьман Марцин Калиновський",
  "Пан Жолнєж", "Коронний Хорунжий", "Шляхтич-Забіяка",
  "Лисовчик-Грабіжник", "Ротмістр Стражний", "Надвірний Надглядач"
];

const muscoviteBosses = [
  "Цар Іван Грозний", "Цар Петро I", "Імператриця Катерина II", "Цар Федір Іванович"
];

const polishBosses = [
  "Король Ян II Казимир", "Король Сигізмунд III Ваза", "Король Ян III Собеський", "Польний гетьман Марцин Калиновський"
];

const tatarBosses = [
  "Хан Іслям III Ґерай", "Хан Сахіб I Ґерай", "Мурза Тугай-Бей", "Хан Мехмед IV Ґерай"
];


// Helper для оновлення картки поточного лицаря у головному меню
function updateHeroBadge() {
  const thumb = document.getElementById('selectedHeroThumb');
  const nameEl = document.getElementById('selectedHeroName');
  
  const heroInfo = {
    bodka: {
      name: 'Бодька Хмельницький',
      avatar: 'https://lh3.googleusercontent.com/d/1GZtuUiAZ7RML6HIC12HXH35ZfjUOafzG'
    },
    baida: {
      name: 'Байда Вишнелюб',
      avatar: 'https://lh3.googleusercontent.com/d/1i8lX1vupJFUOkvU0qsd4r9lARJGUstbe'
    },
    olezhko: {
      name: 'Олежко Передбач',
      avatar: 'https://lh3.googleusercontent.com/d/1s-crFw98YTLUCE8CryYUqP0xGSmf6cSZ'
    }
  };

  const current = heroInfo[hero] || heroInfo.bodka;
  if (thumb) thumb.style.backgroundImage = `url('${current.avatar}')`;
  if (nameEl) nameEl.textContent = current.name;
}
window.updateHeroBadge = updateHeroBadge;

function toggleReadme() {
  const modal = document.getElementById('readmeModal') || document.querySelector('.readme-modal');
  if (modal) modal.classList.toggle('hidden');
}
window.toggleReadme = toggleReadme;

function showMenu(title, subtitle) {
  if (menuTitle && title) menuTitle.textContent = title;
  if (menuSubtitle && subtitle) menuSubtitle.textContent = subtitle;
  if (gameMenu) gameMenu.classList.remove('hidden');
  updateHeroBadge();
}

function hideMenu() {
  if (gameMenu) gameMenu.classList.add('hidden');
}

function pickChar() {
  const modal = document.getElementById('charactersModal') || document.querySelector('.characters-modal') || document.querySelector('.characters');
  if (modal) modal.classList.toggle('hidden');
}

function startBattleLogic() {
  hideMenu();
  enableHotbar();

  if (enemyNum === 0 || (enemyNum === 4 && enemyhp <= 0)) {
    enemyNum = 0;
    nextEnemy();
  }
}

if (startBtn) {
  startBtn.addEventListener('click', () => {
    startBattleLogic();
  });
}

function nextCutsceneDialog() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  if (isTyping) {
    clearTimeout(typeInterval);
    cutsceneText.textContent = cutsceneDialogs[currentDialogIndex];
    isTyping = false;
    return;
  }

  currentDialogIndex++;
  if (currentDialogIndex < cutsceneDialogs.length) {
    typeWriterEffect(cutsceneDialogs[currentDialogIndex], 0);
  } else {
    cutsceneOverlay.classList.add('hidden');
    isFirstTime = false;
    showMenu('Головне Меню', 'Натисніть кнопку для початку');
  }
}

function showDamage(amount, targetElement) {
  const pop = document.createElement('div');
  pop.classList.add('damage-popup');

  if (amount <= 0) {
    pop.textContent = 'Промах!';
    pop.classList.add('miss');
  } else {
    pop.textContent = `-${amount}`;
    const isCrit = amount >= 70;
    if (isCrit) {
      pop.classList.add('crit');
    }
    targetElement.classList.remove('hit-anim', 'hit-heavy-anim');
    void targetElement.offsetWidth;
    targetElement.classList.add(isCrit ? 'hit-heavy-anim' : 'hit-anim');
    setTimeout(() => {
      targetElement.classList.remove('hit-anim', 'hit-heavy-anim');
    }, 400);
  }

  targetElement.appendChild(pop);

  setTimeout(() => {
    pop.remove();
  }, 850);
}

function showHeal(amount, targetElement) {
  const pop = document.createElement('div');
  pop.classList.add('damage-popup');
  pop.style.color = '#00ff77';
  pop.textContent = `+${amount}`;

  targetElement.appendChild(pop);

  setTimeout(() => {
    pop.remove();
  }, 850);
}

function heal(amount, targetElement) {
  if (targetElement === player) {
    playerhp = Math.min(200, playerhp + amount);
  } else if (targetElement === enemy) {
    enemyhp += amount;
  }

  showHeal(amount, targetElement);
  update();
}

function updateDeathScreen() {
  const avatar = document.getElementById('deathHeroAvatar');
  const title = document.getElementById('deathHeroTitle');
  const quote = document.getElementById('deathHeroLastWords');
  const dTitle = document.getElementById('deathTitle');
  const dSub = document.getElementById('deathSubtitle');

  const heroData = {
    bodka: {
      name: 'Бодька Хмельницький',
      avatar: 'https://lh3.googleusercontent.com/d/1GZtuUiAZ7RML6HIC12HXH35ZfjUOafzG',
      quote: deathRules ? '«Проклята відьма... темрява застилає очі...»' : '«Нехай інший гетьман підніме мою булаву!»'
    },
    baida: {
      name: 'Байда Вишнелюб',
      avatar: 'https://lh3.googleusercontent.com/d/1i8lX1vupJFUOkvU0qsd4r9lARJGUstbe',
      quote: deathRules ? '«Підлий бармацький цвях... кості ламаються...»' : '«Байда падає, але пам\'ять про мене вас у снах душитиме!»'
    },
    olezhko: {
      name: 'Олежко Передбач',
      avatar: 'https://lh3.googleusercontent.com/d/1s-crFw98YTLUCE8CryYUqP0xGSmf6cSZ',
      quote: deathRules ? '«Пророцтво бармацьких пагорбів збулося...»' : '«Туман забирає мене... але пророцтво здійсниться!»'
    }
  };

  const current = heroData[hero] || heroData.bodka;
  if (avatar) avatar.style.backgroundImage = `url('${current.avatar}')`;
  if (title) title.textContent = current.name;
  if (quote) quote.textContent = current.quote;

  if (deathRules) {
    if (dTitle) dTitle.textContent = 'ПОЛІГ ВІД РУКИ СМЕРТІ';
    if (dSub) dSub.textContent = 'Стара з косою забрала вашу душу у вічну темряву...';
  } else {
    if (dTitle) dTitle.textContent = 'ВИ ЗАГИНУЛИ';
    if (dSub) dSub.textContent = 'Ваше хоробре військо було розбите ворогами...';
  }
}

function loss() {
  updateDeathScreen();
  if (deathOverlay) {
    deathOverlay.classList.remove('hidden');
  }
  if (deathRules) {
    playHeroVoice('death_old_woman');
  } else {
    playHeroVoice('death');
  }
}

function retryGame() {
  stopVoice();
  playerhp = 200;
  enemyNum = 0;
  secret = 0;
  deathRules = false;
  buff = 1;
  isTransitioning = false;
  if (deathOverlay) deathOverlay.classList.add('hidden');
  resetAllCooldowns();
  selectHero(hero);
  update();
  enableHotbar();
  nextEnemy();
}
window.retryGame = retryGame;

function restartGame() {
  stopVoice();
  playerhp = 200;
  enemyNum = 0;
  secret = 0;
  deathRules = false;
  buff = 1;
  isTransitioning = false;
  
  if (deathOverlay) {
    deathOverlay.classList.add('hidden');
  }
  
  if (hero === 'bodka') {
    selectHero('bodka');
  } else if (hero === 'baida') {
    selectHero('baida');
  } else if (hero === 'olezhko') {
    selectHero('olezhko');
  }
  
  update();
  showMenu('Головне Меню', 'Натисніть кнопку для початку');
}

function update() {
  if (playerHpEl) {
    playerHpEl.textContent = Math.max(0, playerhp);
  } else if (player) {
    player.textContent = Math.max(0, playerhp);
  }

  if (enemyHpEl) {
    enemyHpEl.textContent = Math.max(0, enemyhp);
  } else if (enemy) {
    enemy.textContent = Math.max(0, enemyhp);
  }
}

// 1. Проста перевірка наявності предмета в мішку
function hasInBag(itemName) {
  return bag.some(item => item && item.name === itemName);
}

// 2. Атака ворога
function enemyAttack() {
  if (enemyhp <= 0 || playerhp <= 0) {
    disableHotbar();
    return;
  }

  let pickAttack = Math.floor(Math.random() * 3) + 1;
  let tempEnemyDamage = 0;

  setTimeout(() => {
    if (enemyhp <= 0) return;

    if (deathRules === true || (enemy && enemy.bastard === 'death')) {
      if (pickAttack === 1) {
        tempEnemyDamage = 28; // Косовиця душ
      } else if (pickAttack === 2) {
        tempEnemyDamage = Math.floor(Math.random() * 11) + 25; // 25-35 (Крижаний зашморг)
      } else if (pickAttack === 3) {
        tempEnemyDamage = 34; // Подих мороку
      }
    } else {
      if (pickAttack === 1) {
        switch (enemyNum) {
          case 1: tempEnemyDamage = 20; break;
          case 2: tempEnemyDamage = 35; break;
          case 3: tempEnemyDamage = 45; break;
          case 4: tempEnemyDamage = 60; break;
        }
      } else if (pickAttack === 2) {
        switch (enemyNum) {
          case 1: tempEnemyDamage = Math.floor(Math.random() * 31) + 10; break;
          case 2: tempEnemyDamage = Math.floor(Math.random() * 46) + 15; break;
          case 3: tempEnemyDamage = Math.floor(Math.random() * 51) + 20; break;
          case 4: tempEnemyDamage = Math.floor(Math.random() * 81) + 10; break;
        }
      } else if (pickAttack === 3) {
        if (enemyNum === 4) {
          tempEnemyDamage = 30;
        } else {
          tempEnemyDamage = 0;
        }
      }
    }

    // Предмети в мішку зменшують урон ворога
    if (tempEnemyDamage > 0) {
      let damageReduce = 0;
      if (hasInBag('Тризуб УНР') && deathRules == false) damageReduce += 10;
      if (hasInBag('Залізний кунтуш') && deathRules == false) damageReduce += 3;

      tempEnemyDamage = Math.max(0, tempEnemyDamage - damageReduce);
    }

    // Анімація випаду ворога
    if (enemy) {
      enemy.classList.remove('enemy-attacking');
      void enemy.offsetWidth;
      enemy.classList.add('enemy-attacking');
      setTimeout(() => {
        if (enemy) enemy.classList.remove('enemy-attacking');
      }, 380);
    }

    playerhp -= tempEnemyDamage;
    showDamage(tempEnemyDamage, player);
    if (tempEnemyDamage > 0) {
      playHurtSound();
    }

    update();
    checkHP();

    if (playerhp > 0 && enemyhp > 0) {
      enableHotbar();
    }
  }, 1000);
}

// 3. Атака гравця
function attack(x, customDmg) {
  if (playerhp <= 0 || enemyhp <= 0 || isTransitioning) return;
  let mosMult = 1;
  let tatMult = 1;
  let polMult = 1;
  switch (hero) {
    case 'bodka':    
      polMult = 1.15;
      tatMult = 0.85;
      break;
    case 'baida':
      tatMult = 1.15;
      polMult = 0.85;
      break;
    case 'olezhko':
      mosMult = 1.15;
      tatMult = 0.85;
      break;
  }
  let dmg = 0;
  let tempShowDamage = 0;
  if (x !== 'strike') { disableHotbar(); }

  // Рідкісний евент репліки героя: раз на 5-6 ударів (щоб не повторювалось щоразу)
  if (!deathRules) {
    if (x === 'heal') {
      playHeroVoice('heal'); // Лікування має окремий кулдаун у 3 ходи
    } else {
      attackVoiceCounter++;
      if (attackVoiceCounter >= voiceInterval) {
        attackVoiceCounter = 0;
        voiceInterval = Math.floor(Math.random() * 2) + 5; // Наступна репліка через 5 або 6 ударів
        if (x === 'basic') playHeroVoice('basic');
        else if (x === 'random') playHeroVoice('random');
        else if (x === 'strikes' || x === 'shoot') playHeroVoice('strike');
      }
    }
  }

  // Візуальні спецефекти атаки
  triggerAttackVFX(x);

  if (healBtn && healBtn.disabled && x !== 'heal') disHealBtn();
  if (strikeBtn && strikeBtn.disabled && x !== 'strikes' && x !== 'shoot') disStrBtn();
  if (randomBtn && randomBtn.disabled && x !== 'random') disRandBtn();

  if (customDmg !== undefined) {
    dmg = customDmg;
  } else if (x === 'shoot'){
    dmg = shootDamage || 90;
  } else if (x === 'random') {
    if (deathRules == true){
      dmg = Math.floor(45 + clicks * 2.2);
    } else {
      dmg = (Math.floor(Math.random() * 81) + 40);
    }
  } else if (x === 'strikes') {
    dmg = Math.max(0, Math.round(80 * (1 - Math.max(0, Math.abs((posXslider + slider.clientWidth / 2) - (posXplayersl + playerSl.clientWidth / 2)) - 5) / ((slider.clientWidth + playerSl.clientWidth) / 2 - 5))));
  } else if (x === 'basic') {
    dmg = deathRules === true ? 80 : 50;
  }

  if (x === 'random' && randomBtn && !randomBtn.disabled) {
    disRandBtn();
  }
  if ((x === 'strikes' || x === 'shoot') && strikeBtn && !strikeBtn.disabled) {
    disStrBtn();
  }
  if (x === 'heal') {
    if (deathRules == true){
    } else {
      heal(50, player);
      buff = 1.5;
    }
    if (healBtn && !healBtn.disabled) {
      disHealBtn();
    }
  }

  if (x !== 'heal') {
    let extraDamage = 0;
    if (hasInBag('Меч Володьки Великого') && deathRules == false) extraDamage += 10;
    if (hasInBag('Загартована козацька шабля') && deathRules == false) extraDamage += 5;

    dmg += extraDamage;

    switch (enemy.bastard) {
      case 'moscow':
        tempShowDamage = Math.floor(dmg * buff * heroBuff * mosMult);
        enemyhp -= tempShowDamage;
        break;

      case 'tatar':
        tempShowDamage = Math.floor(dmg * buff * heroBuff * tatMult);
        enemyhp -= tempShowDamage;
        break;

      case 'poland':
        tempShowDamage = Math.floor(dmg * buff * heroBuff * polMult);
        enemyhp -= tempShowDamage;
        break;
      case 'death':
        tempShowDamage = Math.floor(dmg * buff * heroBuff);
        enemyhp -= tempShowDamage;
        break;
    }

    showDamage(tempShowDamage, enemy);
    buff = 1;
  }
  update();

  if (enemyhp <= 0) {
    checkHP();
  } else {
    setTimeout(() => {
      enemyAttack();
    }, 700);
  }
}

// ========================================================
// ВІЗУАЛЬНІ ЕФЕКТИ АТАКИ (VFX)
// ========================================================
function triggerAttackVFX(type) {
  const vfxContainer = document.getElementById('vfxContainer') || document.body;

  // 1. Анімація руху гравця
  if (player) {
    player.classList.remove('player-attacking', 'hero-heal-pulse');
    void player.offsetWidth;
    if (type === 'heal') {
      player.classList.add('hero-heal-pulse');
    } else {
      player.classList.add('player-attacking');
    }
    setTimeout(() => {
      if (player) player.classList.remove('player-attacking', 'hero-heal-pulse');
    }, 400);
  }

  const playerRect = player ? player.getBoundingClientRect() : null;
  const enemyRect = enemy ? enemy.getBoundingClientRect() : null;
  if (!enemyRect) return;

  const enemyCenterX = enemyRect.left + enemyRect.width / 2;
  const enemyCenterY = enemyRect.top + enemyRect.height / 2;

  if (type === 'basic') {
    playHitSound('basic');
    // Шабельний розріз з іскрами
    const slash = document.createElement('div');
    slash.className = 'vfx-slash';
    slash.style.left = `${enemyCenterX}px`;
    slash.style.top = `${enemyCenterY}px`;
    vfxContainer.appendChild(slash);

    createSparks(enemyCenterX, enemyCenterY, 8, vfxContainer);
    setTimeout(() => slash.remove(), 350);

  } else if (type === 'random') {
    playHitSound('random');
    // Подвійний перехресний розріз (X-slash)
    const slash1 = document.createElement('div');
    slash1.className = 'vfx-cross-slash slash-1';
    slash1.style.left = `${enemyCenterX}px`;
    slash1.style.top = `${enemyCenterY}px`;
    vfxContainer.appendChild(slash1);

    const slash2 = document.createElement('div');
    slash2.className = 'vfx-cross-slash slash-2';
    slash2.style.left = `${enemyCenterX}px`;
    slash2.style.top = `${enemyCenterY}px`;
    vfxContainer.appendChild(slash2);

    createSparks(enemyCenterX, enemyCenterY, 12, vfxContainer);
    setTimeout(() => {
      slash1.remove();
      slash2.remove();
    }, 450);

  } else if (type === 'strikes' || type === 'shoot') {
    // Політ снаряда від гравця до ворога + вибух
    if (playerRect) {
      const startX = playerRect.left + playerRect.width;
      const startY = playerRect.top + playerRect.height / 2;

      const bullet = document.createElement('div');
      bullet.className = 'vfx-projectile';
      bullet.style.left = `${startX}px`;
      bullet.style.top = `${startY}px`;
      vfxContainer.appendChild(bullet);

      setTimeout(() => {
        bullet.style.left = `${enemyCenterX}px`;
        bullet.style.top = `${enemyCenterY}px`;
      }, 20);

      setTimeout(() => {
        bullet.remove();
        playHitSound('strikes');
        const explosion = document.createElement('div');
        explosion.className = 'vfx-explosion';
        explosion.style.left = `${enemyCenterX}px`;
        explosion.style.top = `${enemyCenterY}px`;
        vfxContainer.appendChild(explosion);

        // Струс екрана
        document.body.classList.remove('shake-screen');
        void document.body.offsetWidth;
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 280);

        createSparks(enemyCenterX, enemyCenterY, 14, vfxContainer);
        setTimeout(() => explosion.remove(), 400);
      }, 220);
    }
  } else if (type === 'heal') {
    // Цілюща аура навколо героя
    if (playerRect) {
      const pCenterX = playerRect.left + playerRect.width / 2;
      const pCenterY = playerRect.top + playerRect.height / 2;

      const aura = document.createElement('div');
      aura.className = 'vfx-heal-aura';
      aura.style.left = `${pCenterX}px`;
      aura.style.top = `${pCenterY}px`;
      vfxContainer.appendChild(aura);

      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const sparkle = document.createElement('div');
          sparkle.className = 'vfx-heal-sparkle';
          sparkle.textContent = ['✨', '❇️', '⭐', '💚'][Math.floor(Math.random() * 4)];
          const offsetX = (Math.random() - 0.5) * 120;
          sparkle.style.left = `${pCenterX + offsetX}px`;
          sparkle.style.top = `${pCenterY + (Math.random() * 40 - 20)}px`;
          vfxContainer.appendChild(sparkle);
          setTimeout(() => sparkle.remove(), 800);
        }, i * 70);
      }

      setTimeout(() => aura.remove(), 900);
    }
  }
}

function createSparks(x, y, count, container) {
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'vfx-spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
    const dist = Math.random() * 60 + 35;
    spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    container.appendChild(spark);
    setTimeout(() => spark.remove(), 400);
  }
}

// ========================================================
// КЕРУВАННЯ ТА ЛОГІКА АТАКИ STRIKE (З ПІДТРИМКОЮ МИШІ ТА СЕНСОРА)
// ========================================================
let strike = false;
let posXslider = 0;
let speed = 3.6;
let posXplayersl = 0;
let speedplayer = -2.2;
const keysDown = {};

function executeStrikeShot() {
  if (!strike) return;
  strike = false;

  // Оцінка влучності залпу
  const sWidth = slider ? slider.clientWidth : 48;
  const pWidth = playerSl ? playerSl.clientWidth : 52;
  const sliderCenter = posXslider + sWidth / 2;
  const playerCenter = posXplayersl + pWidth / 2;
  const dist = Math.abs(sliderCenter - playerCenter);
  const maxDist = (sWidth + pWidth) / 2;

  showStrikeFeedback(dist, maxDist);

  setTimeout(() => {
    hideStrikeBar();
    attack('strikes');
  }, 450);
}

// Прицілювання мишкою / пальцем прямо по смузі
function updatePlayerSlAim(clientX) {
  if (!strike || !bar || !playerSl) return;
  const rect = bar.getBoundingClientRect();
  const maxPlayerLeft = bar.clientWidth - playerSl.clientWidth;
  const targetX = clientX - rect.left - (playerSl.clientWidth / 2);
  posXplayersl = Math.max(0, Math.min(targetX, maxPlayerLeft));
  playerSl.style.transform = `translateX(${posXplayersl}px)`;
}

let isAimDragging = false;
if (bar) {
  bar.addEventListener('pointerdown', (e) => {
    if (!strike) return;
    e.stopPropagation();
    isAimDragging = true;
    updatePlayerSlAim(e.clientX);
  });
}

window.addEventListener('pointermove', (e) => {
  if (isAimDragging && strike) {
    updatePlayerSlAim(e.clientX);
  }
});

window.addEventListener('pointerup', () => {
  isAimDragging = false;
  if (aimInterval) {
    clearInterval(aimInterval);
    aimInterval = null;
  }
});

// Кнопки покрокового прицілювання для мобільних
let aimInterval = null;
function nudgeAim(dir) {
  if (!strike || !bar || !playerSl) return;
  const maxPlayerLeft = bar.clientWidth - playerSl.clientWidth;
  posXplayersl = Math.max(0, Math.min(posXplayersl + dir * 18, maxPlayerLeft));
  playerSl.style.transform = `translateX(${posXplayersl}px)`;
}

const aimLeftBtn = document.getElementById('aimLeftBtn');
const aimRightBtn = document.getElementById('aimRightBtn');
if (aimLeftBtn) {
  aimLeftBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    nudgeAim(-1);
    clearInterval(aimInterval);
    aimInterval = setInterval(() => nudgeAim(-1), 75);
  });
}
if (aimRightBtn) {
  aimRightBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    nudgeAim(1);
    clearInterval(aimInterval);
    aimInterval = setInterval(() => nudgeAim(1), 75);
  });
}

// Постріл по великій кнопці ЗАЛП
const strikeFireBtn = document.getElementById('strikeFireBtn');
if (strikeFireBtn) {
  strikeFireBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    executeStrikeShot();
  });
}

// Постріл по кліку/дотику будь-де на екрані чи модалці під час атаки
const strikeModal = document.getElementById('strikeModal');
if (strikeModal) {
  strikeModal.addEventListener('click', (e) => {
    if (!strike) return;
    if (e.target.closest('#strikeBar') || e.target.closest('.strike-aim-controls')) return;
    executeStrikeShot();
  });
}

window.addEventListener('click', (e) => {
  if (!strike) return;
  if (e.target.closest('#strikeBar') || e.target.closest('.strike-aim-controls')) return;
  executeStrikeShot();
});

window.addEventListener('keydown', (e) => {
  keysDown[e.code] = true;

  if (brawlActive && (e.code === 'Space' || e.code === 'Enter')) {
    e.preventDefault();
    brawlHit();
    return;
  }

  if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && strike) {
    e.preventDefault();
    executeStrikeShot();
    return;
  }

  // Використання предметів у мішку по клавішах 1-5
  if (['1', '2', '3', '4', '5'].includes(e.key)) {
    const index = parseInt(e.key) - 1;
    useBagItem(index);
  }
});

window.addEventListener('keyup', (e) => {
  keysDown[e.code] = false;
});

function animate() {
  if (strike && bar) {
    const maxSliderLeft = bar.clientWidth - slider.clientWidth;
    const maxPlayerLeft = bar.clientWidth - playerSl.clientWidth;

    // Рух червоного бігунка (відбивається від стінок)
    posXslider += speed;
    if (posXslider >= maxSliderLeft) {
      posXslider = maxSliderLeft;
      speed = -Math.abs(speed);
    } else if (posXslider <= 0) {
      posXslider = 0;
      speed = Math.abs(speed);
    }

    // Асинхронний автоматичний рух зеленого бігунка
    posXplayersl += speedplayer;
    if (posXplayersl >= maxPlayerLeft) {
      posXplayersl = maxPlayerLeft;
      speedplayer = -Math.abs(speedplayer);
    } else if (posXplayersl <= 0) {
      posXplayersl = 0;
      speedplayer = Math.abs(speedplayer);
    }

    // Додаткове підправлення гравцем клавішами A/D або стрілками
    if (keysDown['KeyA'] || keysDown['ArrowLeft']) {
      posXplayersl -= 2.5;
    }
    if (keysDown['KeyD'] || keysDown['ArrowRight']) {
      posXplayersl += 2.5;
    }

    posXplayersl = Math.max(0, Math.min(posXplayersl, maxPlayerLeft));

    slider.style.transform = `translateX(${posXslider}px)`;
    playerSl.style.transform = `translateX(${posXplayersl}px)`;
  }

  requestAnimationFrame(animate);
}

function showStrikeBar() {
  const strikeModal = document.getElementById('strikeModal');
  if (strikeModal) {
    strikeModal.classList.remove('hidden');
  } else if (bar) {
    bar.classList.remove('hidden');
  }
  const feedback = document.getElementById('strikeFeedback');
  if (feedback) feedback.classList.add('hidden');
}

function hideStrikeBar() {
  const strikeModal = document.getElementById('strikeModal');
  if (strikeModal) {
    strikeModal.classList.add('hidden');
  } else if (bar) {
    bar.classList.add('hidden');
  }
}

function showStrikeFeedback(dist, maxDist) {
  const feedback = document.getElementById('strikeFeedback');
  if (!feedback) return;
  feedback.classList.remove('hidden', 'feedback-perfect', 'feedback-good', 'feedback-miss');

  if (dist <= 15) {
    feedback.textContent = 'ІДЕАЛЬНО! (80)';
    feedback.classList.add('feedback-perfect');
  } else if (dist <= maxDist * 0.65) {
    feedback.textContent = 'ВЛУЧНО!';
    feedback.classList.add('feedback-good');
  } else {
    feedback.textContent = 'МИМО!';
    feedback.classList.add('feedback-miss');
  }
}

let shootDamage = 0;
function summonStrike() {
  if (strikeBtn && strikeBtn.disabled) return;
  if (deathRules == true) {
    disableHotbar();
    startCannonVolley();
  } else {
    if (!bar) return;
    disableHotbar();
    showStrikeBar();
    posXslider = 0;
    speed = 3.6;
    const maxPlayerLeft = bar.clientWidth - playerSl.clientWidth;
    posXplayersl = Math.floor(maxPlayerLeft * 0.7);
    speedplayer = -2.2;
    slider.style.transform = `translateX(${posXslider}px)`;
    playerSl.style.transform = `translateX(${posXplayersl}px)`;
    strike = true;
  }
}

let roundsRand = 0;
function disRandBtn() {
  if (!randomBtn) return;
  if (!randomBtn.disabled) {
    randomBtn.disabled = true;
    roundsRand = 0;
  } else {
    roundsRand += 1;
    if (roundsRand >= 3) {
      randomBtn.disabled = false;
      roundsRand = 0;
    }
  }
}

let roundsHeal = 0;
function disHealBtn() {
  if (!healBtn) return;
  if (!healBtn.disabled) {
    healBtn.disabled = true;
    roundsHeal = 0;
  } else {
    roundsHeal += 1;
    if (roundsHeal >= 3) {
      healBtn.disabled = false;
      roundsHeal = 0;
    }
  }
}

let roundsStr = 0;
function disStrBtn() {
  if (!strikeBtn) return;
  if (!strikeBtn.disabled) {
    strikeBtn.disabled = true;
    roundsStr = 0;
  } else {
    roundsStr += 1;
    if (roundsStr >= 3) {
      strikeBtn.disabled = false;
      roundsStr = 0;
    }
  }
}

function disableHotbar() {
  if (!hotbar) return;
  hotbar.inert = true;
  hotbar.classList.add('disabled-state');
}

function enableHotbar() {
  if (!hotbar) return;
  hotbar.inert = false;
  hotbar.classList.remove('disabled-state');
}
let olezhkoBuff = 1
function nextEnemy() {
  if (isTransitioning) return;
  isTransitioning = true;

  if (enemyNum > 0) {
    if(hero === 'olezhko'){olezhkoBuff = 1.5}
    updateScore(Math.floor(Math.random() * 4 * olezhkoBuff) );
    let tempHeal = Math.floor(Math.random() * 41) + 25;
    heal(tempHeal, player);
  }

  disableHotbar();
  let tempEnemyHp = 1;
  enemy.style.left = '110%';

  enemyNum += 1;

  setTimeout(() => {
    switch (enemyNum) {
      case 1: tempEnemyHp = Math.floor(Math.random() * 21) + 140; break;
      case 2: tempEnemyHp = Math.floor(Math.random() * 31) + 205; break;
      case 3: tempEnemyHp = Math.floor(Math.random() * 31) + 250; break;
      case 4: tempEnemyHp = Math.floor(Math.random() * 41) + 300; break;
      default: tempEnemyHp = Math.floor(Math.random() * 21) + 140; break;
    }
    enemyhp = tempEnemyHp;

    const portraitEl = document.getElementById('enemyPortrait');
    y = Math.floor(Math.random() * 3) + 1;

    if (enemyNum === 4) {
      if (hasInBag('Іржавий цвях старухи')) secret += 1;
      if (hero === 'baida') { secret += 1; }
      const bossIdx = Math.floor(Math.random() * 4);
      const posNum = bossIdx + 1;
      if (secret >= 3) {
        y = 4;
      }
      switch (y) {
        case 1:
          enemyName.textContent = muscoviteBosses[bossIdx];
          enemy.bastard = 'moscow';
          break;
        case 2:
          enemyName.textContent = tatarBosses[bossIdx];
          enemy.bastard = 'tatar';
          break;
        case 3:
          enemyName.textContent = polishBosses[bossIdx];
          enemy.bastard = 'poland';
          break;
          case 4:
          summonDeath()
          
          break;
      }

      // ЗМІНА ТУТ: використовуємо окремий клас для боса, наприклад "boss-portrait" замість "p-3"
      if (portraitEl) portraitEl.className = `boss-${enemy.bastard} boss-p-${posNum}`;
      if (secret >= 3 && portraitEl) { portraitEl.className = 'death'; }
    } else {
      const randomIdx = Math.floor(Math.random() * 4) + 1;

      switch (y) {
        case 1:
          enemyName.textContent = muscoviteEnemies[Math.floor(Math.random() * muscoviteEnemies.length)];
          enemy.bastard = 'moscow';
          break;
        case 2:
          enemyName.textContent = tatarEnemies[Math.floor(Math.random() * tatarEnemies.length)];
          enemy.bastard = 'tatar';
          break;
        case 3:
          enemyName.textContent = polishEnemies[Math.floor(Math.random() * polishEnemies.length)];
          enemy.bastard = 'poland';
          break;
      }

      if (portraitEl) portraitEl.className = `faction-${enemy.bastard} p-${randomIdx}`;
    }

    update();
    enemy.style.left = '75%';
    enableHotbar();
    isTransitioning = false;
  }, 2000);
}

function checkHP() {
  if (enemyhp <= 0 && !isTransitioning) {
    if (deathRules === true || (enemy && enemy.bastard === 'death')) {
      disableHotbar();
      startDeathFinale();
      return;
    }
    if (enemyNum === 4) {
      disableHotbar();
      updateScore(Math.floor(Math.random() * 21) + 50);
      showMenu('Перемога над Босом!', 'Ви здолали боса.');
      playerhp = 200;
      deathRules = false;
      resetAllCooldowns();
      playHeroVoice('victory');
    } else {
      nextEnemy();
    }
  }

  if (playerhp <= 0) {
    disableHotbar();
    loss();
  }
}
basicBtn = document.getElementById('basicBtn')
const playerName = document.getElementById('playerName')
function selectHero(heros) {
  hero = heros;
  switch (hero) {
    case 'bodka':
      if (playerPortrait) {
        
        playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1GZtuUiAZ7RML6HIC12HXH35ZfjUOafzG')";
      }
      randomBtn.textContent = 'Задум Молодого Джури'
      strikeBtn.textContent = 'Залп із Засідки'
      basicBtn.textContent = 'Штабний Удар'
      healBtn.textContent = 'Гетьманське Натхнення'
      playerName.textContent = 'Бодька Хмель'
      heroBuff = 1.25;
      document.body.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1SVuVSK0z2QougDlakw4Xn3y5xTh34yWR')";
      break;
    case 'baida':
      if (playerPortrait) {
        randomBtn.textContent = 'Хортицький Хитрощ'
        strikeBtn.textContent = 'Гарматний Залп Хортиці'
        basicBtn.textContent = 'Шабельний Випад'
        healBtn.textContent = 'Мед-Пиво з Хортиці'
        playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1i8lX1vupJFUOkvU0qsd4r9lARJGUstbe')";
      }
      playerName.textContent = 'Байда Вишнелюб'
      heroBuff = 1;
      document.body.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1g9S7a0mPpsssC_0xdQ5Z0QGnmc9QJlPU')";
      break;
    case 'olezhko':
      if (playerPortrait) {
        playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1s-crFw98YTLUCE8CryYUqP0xGSmf6cSZ')";
      }
      randomBtn.textContent = 'Хитрість Віщого'
      strikeBtn.textContent = 'Стріла Долі'
      basicBtn.textContent = 'Княжа Дружина'
      healBtn.textContent = 'Варязьке Братерство'
      playerName.textContent = 'Олежко Передбач'
      heroBuff = 1;
      document.body.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1cnOuhXontzpYSMX8qnHVfqCp8NWVoYGN')";
      break;
  }


  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
  updateHeroBadge();
}function resetAllCooldowns() {
  roundsHeal = 0;
  roundsRand = 0;
  roundsStr = 0;

  if (healBtn) healBtn.disabled = false;
  if (randomBtn) randomBtn.disabled = false;
  if (strikeBtn) strikeBtn.disabled = false;
}

/* ========================================================
   ПРОСТА СИСТЕМА МАГАЗИНУ, ІНВЕНТАРЮ ТА БОЙОВОГО МІШКА
   ======================================================== */

// Товари в магазині (прості об'єкти без типів та ускладнень)
const shopCatalog = [
  {
    id: 'barmatska_pot',
    name: 'Бармацька настоянка',
    price: 50,
    description: 'Відновлює 30 HP',
    icon: '🧪'
  },
  {
    id: 'monocat_gold',
    name: 'Золота морда кота Монобанку',
    price: 150,
    description: '+50% до знайдених монет',
    icon: '🐱'
  },
  {
    id: 'sword_volodya',
    name: 'Меч Володьки Великого',
    price: 200,
    description: '+10 до урону на кожен удар',
    icon: '⚔️'
  },
  {
    id: 'cossack_saber',
    name: 'Загартована козацька шабля',
    price: 60,
    description: '+5 до урону на кожен удар',
    icon: '🗡️'
  },
  {
    id: 'trident_unr',
    name: 'Тризуб УНР',
    price: 180,
    description: '-10 отримуваного урону',
    icon: '🔱'
  },
  {
    id: 'iron_kuntush',
    name: 'Залізний кунтуш',
    price: 50,
    description: '-3 отримуваного урону',
    icon: '🛡️'
  },
  {
    id: 'rusty_nail',
    name: 'Іржавий цвях старухи',
    price: 1,
    description: 'Звичайний іржавий цвях... Чи ні?',
    icon: '📌'
  }
];


const INVENTORY_SIZE = 20;
const BAG_SIZE = 5;

let inventory = new Array(INVENTORY_SIZE).fill(null);
let bag = new Array(BAG_SIZE).fill(null);

let draggedItem = null;
let countScore = 150; 

// DOM елементи
const shop = document.getElementById('shop');
const score = document.getElementById('score');
const shopScore = document.getElementById('ShopScore');
const shopGoodsList = document.getElementById('shopGoodsList');
const inventoryGrid = document.getElementById('inventoryGrid');
const bagGrid = document.getElementById('bagGrid');
const battleBagGrid = document.getElementById('battleBagGrid');
const invCountEl = document.getElementById('invCount');
const bagCountEl = document.getElementById('bagCount');
const trashZone = document.getElementById('trashZone');
const shopToast = document.getElementById('shopToast');

let toastTimer = null;

// Нарахування монет (з перевіркою кота Монобанку)
function updateScore(x) {
  let coins = x;
  if (coins > 0 && hasInBag('Золота морда кота Монобанку')) {
    coins = Math.floor(coins * 1.5);
  }

  countScore += coins;
  if (score) score.textContent = countScore + ' Монет';
  if (shopScore) shopScore.textContent = countScore + ' Монет';
}

// Повідомлення в магазині
function showShopToast(message, isError = false) {
  if (!shopToast) return;
  clearTimeout(toastTimer);
  shopToast.textContent = message;
  shopToast.className = `shop-toast ${isError ? 'error' : 'success'}`;
  shopToast.classList.remove('hidden');
  toastTimer = setTimeout(() => shopToast.classList.add('hidden'), 2500);
}

// Використання зілля або предмета з мішка
function useBagItem(index) {
  const item = bag[index];
  if (!item) return;

  if (item.name === 'Бармацька настоянка' && deathRules == false) {
    heal(30, player);
    bag[index] = null;
    renderBag();
    showShopToast('Використано: Бармацька настоянка (+30 HP)', false);
    secret +=1
  }
}

// Рендеринг списку товарів у магазині
function renderShopGoods() {
  if (!shopGoodsList) return;
  shopGoodsList.innerHTML = '';

  shopCatalog.forEach(item => {
    const card = document.createElement('div');
    card.className = 'shop-item';
    card.innerHTML = `
      <div class="item-main">
        <div class="item-icon">${item.icon}</div>
        <div class="item-text">
          <div class="item-title" title="${item.name}">${item.name}</div>
          <div class="item-desc">${item.description}</div>
        </div>
      </div>
      <div class="item-buy-row">
        <div class="item-price">🪙 ${item.price} золота</div>
        <button class="buy-btn" onclick="buyItem('${item.id}')">Купити</button>
      </div>
    `;
    shopGoodsList.appendChild(card);
  });
}

// Купівля товару в магазині
function buyItem(itemId) {
  const item = shopCatalog.find(i => i.id === itemId);
  if (!item) return;

  if (countScore < item.price) {
    showShopToast('Не вистачає золота!', true);
    return;
  }

  const emptyIndex = inventory.indexOf(null);
  if (emptyIndex === -1) {
    showShopToast('Інвентар заповнено (20/20)!', true);
    return;
  }

  countScore -= item.price;
  inventory[emptyIndex] = { ...item };

  updateScore(0);
  renderInventory();
  showShopToast(`Куплено: ${item.name}!`, false);
}

// Універсальний рендеринг сіток інвентарю та мішка
function renderGrid(container, itemsArray, type, size, countEl, extraClass = '') {
  if (!container) return;
  container.innerHTML = '';
  let occupied = 0;

  for (let i = 0; i < size; i++) {
    const slot = document.createElement('div');
    slot.className = `inv-slot ${extraClass}`.trim();
    slot.dataset.index = i;
    slot.dataset.type = type;

    const item = itemsArray[i];
    if (item) {
      occupied++;
      slot.appendChild(createItemElement(item, type, i));
    }

    attachSlotDropEvents(slot, type, i);
    container.appendChild(slot);
  }

  if (countEl) countEl.textContent = `${occupied}/${size}`;
}

// Рендеринг сітки інвентарю
function renderInventory() {
  renderGrid(inventoryGrid, inventory, 'inventory', INVENTORY_SIZE, invCountEl);
}

// Рендеринг сітки мішка
function renderBag() {
  renderGrid(bagGrid, bag, 'bag', BAG_SIZE, bagCountEl, 'bag-slot');
  renderBattleBag(); // Оновлюємо нижній бойовий мішок
}

// Рендеринг нижньої панелі мішка у бою
function renderBattleBag() {
  if (!battleBagGrid) return;
  battleBagGrid.innerHTML = '';

  for (let i = 0; i < BAG_SIZE; i++) {
    const item = bag[i];
    const slot = document.createElement('div');
    slot.className = `battle-bag-slot ${item ? 'filled' : 'empty'}`;
    slot.dataset.index = i;

    const keyBadge = `<span class="slot-key">${i + 1}</span>`;

    if (item) {
      slot.innerHTML = `
        ${keyBadge}
        <div class="battle-item-icon">${item.icon}</div>
        <div class="battle-item-name" title="${item.name}">${item.name}</div>
        <div class="item-tooltip">
          <div class="tt-title">${item.name}</div>
          <div class="tt-desc">${item.description}</div>
          <div class="tt-hint">Клік або клавіша [${i + 1}] щоб використати</div>
        </div>
      `;
      slot.onclick = () => useBagItem(i);
    } else {
      slot.innerHTML = `
        ${keyBadge}
        <div class="battle-item-empty-icon">·</div>
        <div class="battle-item-empty-label">Порожньо</div>
      `;
    }

    battleBagGrid.appendChild(slot);
  }
}

// Створення елемента предмета (для перетягування та кліків)
function createItemElement(item, type, index) {
  const itemEl = document.createElement('div');
  itemEl.className = 'inv-item';
  itemEl.draggable = true;

  const hintText = type === 'inventory'
    ? 'Клік: перенести в мішок'
    : 'Клік: повернути на склад / використати';

  itemEl.innerHTML = `
    <div class="inv-item-icon">${item.icon}</div>
    <div class="item-tooltip">
      <div class="tt-title">${item.name}</div>
      <div class="tt-desc">${item.description}</div>
      <div class="tt-hint">${hintText}</div>
    </div>
  `;

  itemEl.onclick = (e) => {
    e.stopPropagation();
    handleItemClick(type, index);
  };

  itemEl.ondragstart = (e) => {
    draggedItem = { type, index };
    itemEl.style.opacity = '0.5';
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  itemEl.ondragend = () => {
    itemEl.style.opacity = '1';
    draggedItem = null;
    clearAllDragHighlights();
  };

  return itemEl;
}

// Переміщення предмета кліком між інвентарем і мішком
function handleItemClick(sourceType, sourceIndex) {
  const isInv = sourceType === 'inventory';
  const srcArray = isInv ? inventory : bag;
  const tgtArray = isInv ? bag : inventory;
  const tgtLimit = isInv ? BAG_SIZE : INVENTORY_SIZE;
  const tgtName = isInv ? 'Бойовий мішок' : 'Склад';

  const emptyIndex = tgtArray.indexOf(null);
  if (emptyIndex === -1) {
    showShopToast(`${tgtName} заповнено (макс. ${tgtLimit})!`, true);
    return;
  }

  tgtArray[emptyIndex] = srcArray[sourceIndex];
  srcArray[sourceIndex] = null;
  
  renderInventory();
  renderBag();
}

// Drag and Drop для слотів
function attachSlotDropEvents(slot, targetType, targetIndex) {
  slot.ondragover = (e) => {
    e.preventDefault();
    if (draggedItem) {
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    }
  };

  slot.ondragleave = () => slot.classList.remove('drag-over');

  slot.ondrop = (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    if (!draggedItem) return;

    const { type: srcType, index: srcIndex } = draggedItem;
    if (srcType === targetType && srcIndex === targetIndex) return;

    const srcArray = srcType === 'inventory' ? inventory : bag;
    const tgtArray = targetType === 'inventory' ? inventory : bag;

    const temp = tgtArray[targetIndex];
    tgtArray[targetIndex] = srcArray[srcIndex];
    srcArray[srcIndex] = temp;

    renderInventory();
    renderBag();
  };
}

// Налаштування смітника
function setupTrashZone() {
  if (!trashZone) return;

  trashZone.ondragover = (e) => {
    e.preventDefault();
    if (draggedItem) {
      e.dataTransfer.dropEffect = 'move';
      trashZone.classList.add('drag-over');
    }
  };

  trashZone.ondragleave = () => trashZone.classList.remove('drag-over');

  trashZone.ondrop = (e) => {
    e.preventDefault();
    trashZone.classList.remove('drag-over');
    if (!draggedItem) return;

    const srcArray = draggedItem.type === 'inventory' ? inventory : bag;
    const item = srcArray[draggedItem.index];
    
    if (item) {
      srcArray[draggedItem.index] = null;
      renderInventory();
      renderBag();
      showShopToast(`«${item.name}» видалено!`, false);
    }
    draggedItem = null;
  };

  trashZone.onclick = () => showShopToast('Перетягніть сюди предмет для видалення 🗑️', false);
}

function clearAllDragHighlights() {
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

// Відкриття / закриття магазину
function showShop() {
  if (!shop) return;
  shop.classList.toggle('hidden');
  updateScore(0);

  if (!shop.classList.contains('hidden')) {
    renderShopGoods();
    renderInventory();
    renderBag();
  }
}
function pickingHero(x) {
  const tabs = document.querySelectorAll('.hero-tab');
  const details = document.querySelectorAll('.char-details');
  tabs.forEach((el, idx) => {
    if (idx === x) el.classList.add('active');
    else el.classList.remove('active');
  });
  details.forEach((el, idx) => {
    if (idx === x) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}

function summonDeath(){
  enemyName.textContent = 'Смерть З Косою';
  enemy.bastard = 'death';
  deathRules = true;
  enemyhp = 700; // Збалансовано на 6-8 ходів замість швидких 2-3
  playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1_fJIATbEYyIQqRqr1UWSlp7A2NSIsgii')";
  randomBtn.textContent = 'Гнівний Заміс';
  strikeBtn.textContent = 'Гарматний Залп Хортиці';
  basicBtn.textContent = "Козацький «Добридень»";
  healBtn.textContent = 'Боже допоможи';
  playBaydaSound();
}

// ========================================================
// МІНІГРА 1: ГНІВНИЙ ЗАМІС (Rage Brawl Minigame)
// ========================================================
let brawlActive = false;
let brawlClicks = 0;
let brawlTimerInterval = null;
let brawlLastAudioTime = 0;

function startBrawl() {
  disableHotbar();
  brawlActive = true;
  brawlClicks = 0;

  const modal = document.getElementById('brawlModal');
  const countEl = document.getElementById('brawlHits');
  const timerFill = document.getElementById('brawlTimerFill');
  const timerText = document.getElementById('brawlTimerText');
  const rankEl = document.getElementById('brawlRank');

  if (countEl) countEl.textContent = '0';
  if (timerFill) timerFill.style.width = '100%';
  if (timerText) timerText.textContent = '4.5с';
  if (rankEl) {
    rankEl.textContent = 'Розігрів...';
    rankEl.style.color = '#ffd54f';
  }
  if (modal) modal.classList.remove('hidden');

  const startTime = Date.now();
  const totalDuration = 4500;

  clearInterval(brawlTimerInterval);
  brawlTimerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    const pct = (remaining / totalDuration) * 100;

    if (timerFill) timerFill.style.width = `${pct}%`;
    if (timerText) timerText.textContent = `${(remaining / 1000).toFixed(1)}с`;

    if (remaining <= 0) {
      clearInterval(brawlTimerInterval);
      endBrawl();
    }
  }, 50);
}

function brawlHit(e) {
  if (!brawlActive) return;
  brawlClicks++;

  const countEl = document.getElementById('brawlHits');
  const target = document.getElementById('brawlTarget');
  const arena = document.getElementById('brawlArena');
  const rankEl = document.getElementById('brawlRank');

  if (countEl) countEl.textContent = brawlClicks;

  if (target) {
    target.classList.remove('hit-pulse');
    void target.offsetWidth;
    target.classList.add('hit-pulse');
  }

  const now = Date.now();
  if (now - brawlLastAudioTime > 80) {
    brawlLastAudioTime = now;
    playHitSound('basic');
  }

  if (rankEl) {
    if (brawlClicks >= 30) {
      rankEl.textContent = 'ЛЕГЕНДАРНИЙ ЗАМІС! (КРИТ)';
      rankEl.style.color = '#ff1744';
    } else if (brawlClicks >= 20) {
      rankEl.textContent = 'НЕСТРИМНА ЛЮТЬ! (+20%)';
      rankEl.style.color = '#ff9100';
    } else if (brawlClicks >= 10) {
      rankEl.textContent = 'Козацький чад!';
      rankEl.style.color = '#ffcc00';
    }
  }

  if (arena) {
    const punchWords = ['ХРЯСЬ!', 'БАХ!', 'ЛЮТЬ!', 'ДУХ!', 'ТРАХ!', '+1', 'ВЛУЧИВ!'];
    const word = punchWords[Math.floor(Math.random() * punchWords.length)];
    const floater = document.createElement('div');
    floater.className = 'brawl-float-text';
    floater.textContent = word;

    const rect = arena.getBoundingClientRect();
    const x = e && e.clientX ? e.clientX - rect.left : arena.clientWidth / 2 + (Math.random() * 80 - 40);
    const y = e && e.clientY ? e.clientY - rect.top : arena.clientHeight / 2 + (Math.random() * 60 - 30);

    floater.style.left = `${x}px`;
    floater.style.top = `${y}px`;
    arena.appendChild(floater);
    setTimeout(() => floater.remove(), 450);
  }
}

function endBrawl() {
  brawlActive = false;
  const modal = document.getElementById('brawlModal');
  if (modal) modal.classList.add('hidden');

  let multiplier = 1;
  if (brawlClicks >= 30) multiplier = 1.25;
  else if (brawlClicks >= 20) multiplier = 1.15;

  const brawlDamage = Math.floor((45 + brawlClicks * 2.2) * multiplier);
  clicks = brawlClicks;

  attack('random', brawlDamage);
}

// Зворотна сумісність для клікера
let clicks = 0;
const clicer = document.getElementById('clicer');
function clickes() { brawlHit(); }
function onClicer() { startBrawl(); }

// ========================================================
// МІНІГРА 2: ГАРМАТНИЙ ЗАЛП ХОРТИЦІ (Artillery Volley)
// ========================================================
let cannonActive = false;
let cannonBallsLoaded = 0;
let cannonTimerInterval = null;

function startCannonVolley() {
  disableHotbar();
  cannonActive = true;
  cannonBallsLoaded = 0;

  const modal = document.getElementById('cannonModal');
  const countEl = document.getElementById('cannonAmmoCount');
  const timerFill = document.getElementById('cannonTimerFill');
  const timerText = document.getElementById('cannonTimerText');

  if (countEl) countEl.textContent = '0';
  if (timerFill) timerFill.style.width = '100%';
  if (timerText) timerText.textContent = '5.0с';
  if (modal) modal.classList.remove('hidden');

  repositionCannonTarget();

  const startTime = Date.now();
  const totalDuration = 5000;

  clearInterval(cannonTimerInterval);
  cannonTimerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    const pct = (remaining / totalDuration) * 100;

    if (timerFill) timerFill.style.width = `${pct}%`;
    if (timerText) timerText.textContent = `${(remaining / 1000).toFixed(1)}с`;

    if (remaining <= 0) {
      clearInterval(cannonTimerInterval);
      endCannonVolley();
    }
  }, 50);
}

function repositionCannonTarget() {
  const target = document.getElementById('cannonTarget');
  const field = document.getElementById('cannonField');
  if (!target || !field) return;

  const maxX = Math.max(20, field.clientWidth - 56);
  const maxY = Math.max(20, field.clientHeight - 56);
  const rx = Math.floor(Math.random() * (maxX - 10) + 10);
  const ry = Math.floor(Math.random() * (maxY - 10) + 10);

  target.style.left = `${rx}px`;
  target.style.top = `${ry}px`;
}

function cannonHit(e) {
  if (!cannonActive) return;
  cannonBallsLoaded++;

  playHitSound('strikes');

  const countEl = document.getElementById('cannonAmmoCount');
  const field = document.getElementById('cannonField');

  if (countEl) countEl.textContent = cannonBallsLoaded;

  if (field && e) {
    const rect = field.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'cannon-hit-burst';
    burst.textContent = '+1';
    burst.style.left = `${e.clientX - rect.left - 10}px`;
    burst.style.top = `${e.clientY - rect.top - 15}px`;
    field.appendChild(burst);
    setTimeout(() => burst.remove(), 400);
  }

  repositionCannonTarget();
}

function endCannonVolley() {
  cannonActive = false;
  const modal = document.getElementById('cannonModal');
  if (modal) modal.classList.add('hidden');

  // Озвучення Байди "Рознеси у тріски!"
  const roznesyAudio = new Audio('sounds/bayda_roznesy_u_trisky.mp3');
  roznesyAudio.volume = 0.9;
  roznesyAudio.play().catch(() => {});

  fireCannonBarrage(cannonBallsLoaded);

  const cannonDamage = Math.floor(50 + cannonBallsLoaded * 8.5);
  shootDamage = cannonDamage;

  setTimeout(() => {
    attack('shoot', cannonDamage);
  }, 850);
}

function fireCannonBarrage(count) {
  const shots = Math.max(3, Math.min(count, 7));
  for (let i = 0; i < shots; i++) {
    setTimeout(() => {
      triggerAttackVFX('strikes');
    }, i * 150);
  }
}

function randomeMove() { repositionCannonTarget(); }

function randomAttack(){
  if (randomBtn && randomBtn.disabled) return;
  if(deathRules == false){
    attack('random');
  } else {
    disableHotbar();
    startBrawl();
  }
}

const baydaSounds = [
  'sounds/bayda1.mp3',
  'sounds/bayda2.mp3',
  'sounds/bayda3.mp3'
];

function playBaydaSound() {
  const randomUrl = baydaSounds[Math.floor(Math.random() * baydaSounds.length)];
  const audio = new Audio(randomUrl);
  
  audio.volume = 0.8; 
  
  audio.play().catch(err => {
    console.warn('Помилка відтворення звуку:', err);
  });
}
const hook = document.getElementById('hook');

async function basicAttack() {
  if (basicBtn && basicBtn.disabled) return;
  if(deathRules == true){
    disableHotbar();
    const animTime = 300; 
    hook.classList.remove('hidden');
    await wait(animTime);
    hook.style.left = '70%';
    await wait(animTime);
    hook.style.left = '20%';
    enemy.style.left = '20%';
    await wait(animTime);
    attack('basic');
    await wait(1000);
    enemy.style.left = '75%';
    hook.style.left = '20%'; 
    hook.classList.add('hidden');
  } else {
    attack('basic');
  }
}

const praySound = new Audio('sounds/bayda_pray.mp3');
praySound.volume = 0.2; 

const hitSound = new Audio('sounds/bayda_after_pray.mp3');
hitSound.volume = 1.0; 

function NewHeal(){
  if (healBtn && healBtn.disabled) return;
  disableHotbar();
  disHealBtn();

  if(deathRules == false){
    attack('heal');
  } else {
    playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1apDNggxwhFhgf944_3eU-i8_S5DYxPWh')";
    praySound.currentTime = 0;
    praySound.play().catch(() => {});
    setTimeout(() => {
      heal(40, player);
      setTimeout(() => {
        playerPortrait.style.backgroundImage = "url('https://lh3.googleusercontent.com/d/1_fJIATbEYyIQqRqr1UWSlp7A2NSIsgii')";
        player.style.left = "85%";
        setTimeout(() => {
          enemyhp -= 85;
          hitSound.currentTime = 0;
          hitSound.play().catch(() => {});
          showDamage(85, enemy);
          setTimeout(() => {
            player.style.left = "10%";
            attack('heal');
          }, 200);
        }, 400);
      }, 1700);
    }, 2000);
  }
}
setupTrashZone();
renderShopGoods();
renderInventory();
renderBag();

updateScore(0);
selectHero('bodka');
animate();
update();
disableHotbar();

if (isFirstTime) {
  hideMenu();
  showCutsceneDialog();
} else {
  showMenu('Головне Меню', 'Натисніть кнопку для початку');
}

function devDeath() {
  hideMenu();
  isTransitioning = false;
  enemyNum = 3;
  secret = 10; // Гарантовано активує Смерть
  playerhp = 200;
  selectHero('baida');
  nextEnemy();
}

// ========================================================
// ФІНАЛЬНА КАТСЦЕНА ТА ТИТРИ (Смерть від старої з косою)
// ========================================================
async function startDeathFinale() {
  isTransitioning = true;
  disableHotbar();
  if (hotbar) hotbar.classList.add('hidden');
  if (typeof hook !== 'undefined' && hook) hook.classList.add('hidden');
  stopVoice();

  const finaleOverlay = document.getElementById('finaleOverlay');
  const finaleCinematic = document.getElementById('finaleCinematic');
  const finaleCredits = document.getElementById('finaleCredits');
  const finaleCamera = document.getElementById('finaleCamera');
  const finaleFlash = document.getElementById('finaleFlash');
  const triangleSvg = document.getElementById('triangleEnergySvg');
  const actorBaida = document.getElementById('actorBaida');
  const actorBohdan = document.getElementById('actorBohdan');
  const actorOleg = document.getElementById('actorOleg');
  const actorDeath = document.getElementById('actorDeath');
  const finaleDialogBox = document.getElementById('finaleDialogBox');
  const finaleSpeaker = document.getElementById('finaleSpeaker');
  const finaleLine = document.getElementById('finaleLine');

  if (!finaleOverlay) return;

  // 1. Початковий стан сцени: скидання камер, спалахів та анімацій
  finaleOverlay.classList.remove('hidden');
  if (finaleCinematic) {
    finaleCinematic.classList.remove('hidden', 'shaking-hard');
    finaleCinematic.style.opacity = '1';
    finaleCinematic.style.transition = '';
  }
  if (finaleCredits) finaleCredits.classList.add('hidden');
  if (finaleDialogBox) finaleDialogBox.classList.add('hidden');
  if (finaleFlash) {
    finaleFlash.className = 'finale-flash';
  }
  if (finaleCamera) {
    finaleCamera.classList.remove('zooming-out');
    finaleCamera.style.transform = 'scale(1)';
  }
  if (triangleSvg) {
    triangleSvg.classList.remove('active-overcharge');
  }

  // Показуємо усіх трьох героїв і смерть у трикутнику
  if (actorBohdan) {
    actorBohdan.classList.remove('hidden');
    actorBohdan.style.animation = 'fadeIn 0.6s ease-out';
  }
  if (actorOleg) {
    actorOleg.classList.remove('hidden');
    actorOleg.style.animation = 'fadeIn 0.6s ease-out';
  }
  if (actorBaida) {
    actorBaida.classList.remove('hidden');
    actorBaida.style.animation = 'fadeIn 0.6s ease-out';
  }
  if (actorDeath) {
    actorDeath.classList.remove('hidden', 'defeated-smoke');
    actorDeath.classList.add('death-trapped-shake');
  }

  const showDialog = (speaker, text) => {
    if (!finaleDialogBox || !finaleSpeaker || !finaleLine) return;
    finaleSpeaker.textContent = speaker;
    finaleLine.textContent = text;
    finaleDialogBox.classList.remove('hidden');
  };

  const hideDialog = () => {
    if (finaleDialogBox) finaleDialogBox.classList.add('hidden');
  };

  const playSound = (src, vol = 0.95) => {
    try {
      const a = new Audio(src);
      a.volume = vol;
      a.play().catch(e => console.warn('Audio play failed:', e));
      return a;
    } catch (e) {
      console.warn('Audio err:', e);
      return null;
    }
  };

  // 2. ГЕРОЇ СТАЛИ В ТРИКУТНИК (БОГДАН, ОЛЕГ, БАЙДА), А МІЖ НИМИ СМЕРТЬ!
  playSound('sounds/chmel_razom_do_peremohy.mp3', 1.0);
  showDialog('Богдан Хмельницький', '«Тримайте стрій! Смерть у пастці священного трикутника!»');
  await wait(2200);

  playSound('sounds/bayda_anu_vhaday_zvidky_pryletyt.mp3', 0.95);
  showDialog('Байда Вишнелюб', '«Не випустимо стару потвору! Козацька земля буде вільною!»');
  await wait(2000);

  playSound('sounds/oleg_stal_predkiv.mp3', 0.95);
  showDialog('Олег Передбач', '«Сталь предків не прощає нечисть! Перуне, спопели її!»');
  await wait(1800);
  hideDialog();

  // 3. ЕКРАН ПОЧИНАЄ ВІДДАЛЯТИСЯ І ТРУСИТИСЯ!
  // Віддалення камери (scale 1 -> 0.48)
  if (finaleCamera) {
    finaleCamera.classList.add('zooming-out');
  }
  // Шалена тряска кінематографічного екрану
  if (finaleCinematic) {
    finaleCinematic.classList.add('shaking-hard');
  }
  if (triangleSvg) {
    triangleSvg.classList.add('active-overcharge');
  }

  // Наростання грому та ударів сили
  playSound('sounds/hit_strike.wav', 1.0);
  playSound('sounds/hit_slash.wav', 1.0);
  try {
    playSound('sounds/sound_options/deal_damage_2_heavy_impact.wav', 1.0);
  } catch(e) {}

  showDialog('Богдан Хмельницький', '«ЗГИ-И-ИНЬ, НЕЧИСТА СИЛО!»');
  await wait(3600);
  hideDialog();

  // 4. СПАЛАХ (НАЧЕ ВСПИШКА)
  if (finaleFlash) {
    finaleFlash.classList.add('active');
  }
  playSound('sounds/hit_strike.wav', 1.0);
  try {
    playSound('sounds/sound_options/deal_damage_3_sharp_strike.wav', 1.0);
  } catch(e) {}

  // Під час спалаху зупиняємо тряску і перемикаємо сцену на фінальні титри
  await wait(700);
  if (finaleCinematic) {
    finaleCinematic.classList.remove('shaking-hard');
    finaleCinematic.classList.add('hidden');
  }
  if (finaleCamera) {
    finaleCamera.classList.remove('zooming-out');
  }

  // 5. ПЕРЕНОСИТЬ НА ЕКРАН "ТИ ПЕРЕМІГ МОЛОДЕЦЬ" ТА ТИТРИ!
  if (finaleCredits) {
    finaleCredits.classList.remove('hidden');
    finaleCredits.scrollTop = 0;
  }

  // Спалах плавно розсіюється, відкриваючи екран перемоги
  if (finaleFlash) {
    finaleFlash.classList.add('fade-out');
  }

  // Урочиста музика перемоги
  playSound('sounds/chmel_victory_kozatska_zemlia.mp3', 1.0);

  // Плавний автоскрол титрів через 2.5 секунди
  setTimeout(() => {
    if (finaleCredits && !finaleCredits.classList.contains('hidden')) {
      const scrollDist = finaleCredits.scrollHeight - finaleCredits.clientHeight;
      if (scrollDist > 0) {
        let currentPos = 0;
        const autoScrollTimer = setInterval(() => {
          if (!finaleCredits || finaleCredits.classList.contains('hidden')) {
            clearInterval(autoScrollTimer);
            return;
          }
          currentPos += 1;
          finaleCredits.scrollTop = currentPos;
          if (currentPos >= scrollDist) {
            clearInterval(autoScrollTimer);
          }
        }, 35);
      }
    }
  }, 2500);
}

function restartFromCredits() {
  const finaleOverlay = document.getElementById('finaleOverlay');
  const finaleCinematic = document.getElementById('finaleCinematic');
  const finaleCredits = document.getElementById('finaleCredits');
  const finaleFlash = document.getElementById('finaleFlash');
  const finaleCamera = document.getElementById('finaleCamera');
  const actorDeath = document.getElementById('actorDeath');

  if (finaleOverlay) finaleOverlay.classList.add('hidden');
  if (finaleCredits) finaleCredits.classList.add('hidden');
  if (finaleFlash) finaleFlash.className = 'finale-flash';
  if (finaleCinematic) {
    finaleCinematic.classList.add('hidden');
    finaleCinematic.classList.remove('shaking-hard');
    finaleCinematic.style.opacity = '1';
    finaleCinematic.style.transition = '';
  }
  if (finaleCamera) {
    finaleCamera.classList.remove('zooming-out');
    finaleCamera.style.transform = '';
  }
  if (actorDeath) {
    actorDeath.classList.remove('death-trapped-shake', 'defeated-smoke');
  }

  stopVoice();
  deathRules = false;
  enemyNum = 0;
  secret = 0;
  playerhp = 200;
  enemyhp = Math.floor(Math.random() * 21) + 140;
  buff = 1;
  isTransitioning = false;

  if (hotbar) hotbar.classList.remove('hidden');
  resetAllCooldowns();
  update();
  showMenu('Головне Меню', 'Вітаємо з великою перемогою! Оберіть героя та вирушайте у новий похід.');
}

function devFinale() {
  deathRules = true;
  if (enemy) enemy.bastard = 'death';
  enemyhp = 0;
  startDeathFinale();
}

// Початкова ініціалізація бейджа героя
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateHeroBadge);
} else {
  updateHeroBadge();
}

window.startDeathFinale = startDeathFinale;
window.restartFromCredits = restartFromCredits;
window.devFinale = devFinale;
window.updateHeroBadge = updateHeroBadge;
window.toggleReadme = toggleReadme;
window.startDeathFinale = startDeathFinale;
window.restartFromCredits = restartFromCredits;
window.devFinale = devFinale;
window.updateHeroBadge = updateHeroBadge;
window.toggleReadme = toggleReadme;
window.pickChar = pickChar;
window.selectHero = selectHero;
window.pickingHero = pickingHero;
window.restartGame = restartGame;
window.retryGame = retryGame;
window.showShop = showShop;
window.loss = loss;
