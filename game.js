const player = document.querySelector('.def');
const heartsDisplay = document.querySelector('.hearts');
const pointsDisplay = document.querySelector('.scored');
const colorPicker = document.getElementById('nativeColorPicker');
const bonus = document.querySelector('.bonus');
const luckyBonus = document.querySelector('.lucky');
const lookBonus1 = document.querySelector('.reverse');
const slowBonus = document.querySelector('.slow');
const shieldBonus = document.querySelector('.shield');

let work = false;
let speedIntervalTime = 100;
let timeLast = 0;
let totalLanes = 7;
let blocks = [];
let pointsCount = 0;
let hearts = 3;
let currentStage = 0;
let reverse = false;
let TriggerEvent2 = false;
let shield = false;
let playerDisplay = 0;
let speedInterval;
let physics;
let checkTimer;

const totalPoints = 5;
let currentPoint = Math.floor(totalPoints / 2);

const audio = new Audio('musik.mp3');
audio.loop = true;
audio.currentTime = 59;
audio.volume = 0.01;

const damageAudio = new Audio('damage.mp3');
damageAudio.volume = 0.1;

const pointAudio = new Audio('coin.mp3');
pointAudio.volume = 0.1;

audio.play().catch(error => {
    console.log(error);
});

let spinning = setInterval(() => {
    if (work) {
        blocks.forEach(blockObj => {
            blockObj.element.style.transform = `rotate(${(Date.now() / 100) + blockObj.angleOffset}deg)`;
        });
    }
}, 50);

if (playerDisplay === 0) {
    player.style.left = '50%';
}

function addBlocks(lanesArray) {
    lanesArray.forEach(laneIndex => {
        const el = document.createElement('div');
        el.classList.add('block');
        el.style.position = 'absolute';
        const blockObj = {
            element: el,
            lane: laneIndex,
            isPos: false
        };
        blocks.push(blockObj);
        runBlock(blockObj);
        document.body.appendChild(blockObj.element);
    });
}

function initBlocks() {
    blocks.forEach(b => {
        if (b.element.parentNode) {
            b.element.parentNode.removeChild(b.element);
        }
    });
    blocks = [];
    addBlocks([2, 3, 4]);
}

function update(isTeleport = false) {
    if (work) {
        const wx = window.innerWidth;
        const playerWidth = player.offsetWidth;
        const segmentWidth = wx / totalPoints;
        
        let x = (currentPoint * segmentWidth) + (segmentWidth / 2) - (playerWidth / 2);
        
        if (isTeleport === true) {
            player.style.transition = 'none';
            player.style.left = x + 'px';
            player.offsetHeight;
            player.style.transition = 'left 0.15s ease-out';
        } else {
            player.style.transition = 'left 0.15s ease-out';
            player.style.left = x + 'px';
        }
    }
}

function moveLeft() {
    if (!reverse) {
        const isTeleport = currentPoint === 0;
        currentPoint = (currentPoint - 1 + totalPoints) % totalPoints;
        update(isTeleport);
    } else {
        const isTeleport = currentPoint === totalPoints - 1;
        currentPoint = (currentPoint + 1) % totalPoints;
        update(isTeleport);
    }
}

function moveRight() {
    if (!reverse) {
        const isTeleport = currentPoint === totalPoints - 1;
        currentPoint = (currentPoint + 1) % totalPoints;
        update(isTeleport);
    } else {
        const isTeleport = currentPoint === 0;
        currentPoint = (currentPoint - 1 + totalPoints) % totalPoints;
        update(isTeleport);
    }
}

window.addEventListener('resize', () => {
    update(true);
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyA') moveLeft();
    if (event.code === 'KeyD') moveRight();
});

function runBlock(blockObj) {
    let probability = 0.3;
    
    if (TriggerEvent2 === true) {
        probability = 0.7;
    }
    
    blockObj.isPos = Math.random() < probability;
    blockObj.angleOffset = Math.floor(Math.random() * 360);
    
    if (blockObj.isPos) {
        blockObj.element.classList.add('pos');
    } else {
        blockObj.element.classList.remove('pos');
    }

    const laneWidth = window.innerWidth / totalLanes;
    const randomX = (blockObj.lane * laneWidth) + (Math.random() * (laneWidth - 50));
    
    blockObj.element.style.left = `${randomX}px`;
    blockObj.element.style.top = '-60px';
}

function phBlocks() {
    blocks.forEach(blockObj => {
        const currentY = blockObj.element.offsetTop;
        blockObj.element.style.top = (currentY + 5) + 'px';
        if (blockObj.element.offsetTop > window.innerHeight) {
            runBlock(blockObj);
        }
    });
}

function speedUp() {
    if (speedIntervalTime > 50) {
        speedIntervalTime -= 5;
        clearInterval(physics);
        physics = setInterval(phBlocks, Math.floor(speedIntervalTime / 4) + timeLast);
    }
}

function startGameLoops() {
    clearInterval(physics);
    clearInterval(speedInterval);
    clearInterval(checkTimer);

    speedInterval = setInterval(speedUp, 5000);
    physics = setInterval(phBlocks, Math.floor(speedIntervalTime / 4) + timeLast);
    
    checkTimer = setInterval(() => {
        if (!work) return;
        const pRect = player.getBoundingClientRect();
        
        blocks.forEach(blockObj => {
            const bRect = blockObj.element.getBoundingClientRect();
            if (
                pRect.left < bRect.right &&
                pRect.right > bRect.left &&
                pRect.top < bRect.bottom &&
                pRect.bottom > bRect.top
            ) {
                handlePoints(blockObj);
            }
        });
        
    }, 50);
}

function start() {
    work = true;
    audio.play();
    reverse = false;
    TriggerEvent2 = false;
    timeLast = 0;
    let invisibleLine = document.querySelector('.invisible-line');
    invisibleLine.classList.remove('hidden');
    heartsDisplay.classList.remove('hidden');
    pointsDisplay.classList.remove('hidden');
    pointsCount = 0;
    hearts = 3;
    currentStage = 0;
    speedIntervalTime = 100;
    
    colorPicker.classList.add('hidden');
    document.querySelector('.mobile-controls').style.display = window.matchMedia("(max-width: 768px)").matches ? 'flex' : 'none';
    
    const startBtn = document.querySelector('.start');
    startBtn.style.display = 'none';
    initBlocks();
    update(true);
    startGameLoops();
}

function checkProgression() {
    if (pointsCount >= 1000 && currentStage === 0) {
        currentStage = 1;
        addBlocks([1, 5]);
    } else if (pointsCount >= 3000 && currentStage === 1) {
        currentStage = 2;
        addBlocks([0, 6]);
    }
}

function handlePoints(blockObj) {
    if (work === true) {
        if (blockObj.isPos) {
            pointsCount += 100;
            document.querySelector('.scored').textContent = `Score: ${pointsCount}`;
            checkProgression();
            pointAudio.currentTime = 0;
            pointAudio.play();
        } else {
            if (shield === false) {
                hearts -= 1;
                damageAudio.currentTime = 0;
                damageAudio.play();
                heartsDisplay.textContent = `Hearts: ${hearts}`;
            }
            checkEnd();
        }
        runBlock(blockObj);
    }
}

function checkEnd() {
    if (hearts <= 0) {
        clearInterval(checkTimer);
        clearInterval(physics);
        clearInterval(speedInterval);
        work = false;
        alert('Гру закінчено! Ваш рахунок: ' + pointsCount);
        
        if (window.updateHighScore) {
            window.updateHighScore(pointsCount);
        }
        
        document.querySelector('.start').style.display = 'block';
        colorPicker.classList.remove('hidden');
        document.querySelector('.mobile-controls').style.display = 'none';
    }
}

function resetGame() {
    pointsCount = 0;
    hearts = 3;
    currentStage = 0;
    speedIntervalTime = 100;
    initBlocks();
    if (work) {
        startGameLoops();
    }
}

colorPicker.addEventListener('input', (event) => {
    player.style.background = `${event.target.value}`;
});

function bonusCreate() {
    if (work === true) {
        bonus.classList.remove('hidden');
        bonus.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
        bonus.style.top = `${Math.random() * (window.innerHeight - 50)}px`;
        setTimeout(() => {
            bonus.classList.add('hidden');
        }, 5000);
    }
}

function FirstEvent() {
    reverse = true;
    lookBonus1.classList.remove('hidden');
    
    setTimeout(() => {
        reverse = false;
        lookBonus1.classList.add('hidden');
    }, 10000);
}

function SecondEvent() {
    luckyBonus.classList.remove('hidden');
    TriggerEvent2 = true;
    setTimeout(() => {
        TriggerEvent2 = false;
        luckyBonus.classList.add('hidden');
    }, 10000);
}

function ThirdEvent() {
    timeLast = 40;
    slowBonus.classList.remove('hidden');
    clearInterval(physics);
    physics = setInterval(phBlocks, Math.floor(speedIntervalTime / 4) + timeLast);
    setTimeout(() => {
        timeLast = 0;
        clearInterval(physics);
        physics = setInterval(phBlocks, Math.floor(speedIntervalTime / 4) + timeLast);
        slowBonus.classList.add('hidden');
    }, 10000);
}

function FourthEvent() {
    shield = true;
    shieldBonus?.classList.remove('hidden');
    player?.classList.add('shield');
    
    setTimeout(() => {
        shield = false;
        shieldBonus?.classList.add('hidden');
        player?.classList.remove('shield');
    }, 10000);
}

const functions = [FourthEvent, FirstEvent, SecondEvent, ThirdEvent];

function RandomEvent() {
    const randomFunction = functions[Math.floor(Math.random() * functions.length)];
    randomFunction();
    bonus.classList.add('hidden');
}

let bonusInterval = setInterval(() => {
    bonusCreate();
}, 20000);