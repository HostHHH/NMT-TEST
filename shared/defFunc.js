function goToMap() {
    if (window.location.pathname.includes('/map/')) {
        window.location.href = 'map.html';
    } else {
        window.location.href = '../map/map.html';
    }
}

function goToDef() {
    if (window.location.pathname.includes('/home/')) {
        window.location.href = 'index.html';
    } else {
        window.location.href = '../home/index.html';
    }
}

function goToTest() {
    if (window.location.pathname.includes('/test/')) {
        window.location.href = 'test.html';
    } else {
        window.location.href = '../test/test.html';
    }
}
function goToGame() {
    if (window.location.pathname.includes('/game/')) {
        window.location.href = 'game.html';
    } else {
        window.location.href = '../game/game.html';
    }
}