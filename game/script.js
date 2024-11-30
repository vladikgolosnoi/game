const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gridSize = 10;
let cellSize;

let playerX = 0;
let playerY = 0;
let targetX = 0;
let targetY = 0;
let obstacles = [];
let newObstacles = [];
let initialPlayerX = 0;
let initialPlayerY = 0;
let playerColor = 'blue';
let trail = [];
let animationFrameId = null;
let difficulty = 'easy';

let obstacleImage = new Image();
obstacleImage.src = 'obstacle.png';
obstacleImage.onload = drawField;

let playerImage = new Image();
playerImage.src = 'player.png';
playerImage.onload = drawField;

let targetImage = new Image();
targetImage.src = 'target.png';
targetImage.onload = drawField;

let newObstacleImage = new Image();
newObstacleImage.src = 'new_obstacle.png';
newObstacleImage.onload = drawField;

function generateRandomField(difficulty) {
    do {
        playerX = Math.floor(Math.random() * gridSize);
        playerY = Math.floor(Math.random() * gridSize);
        targetX = Math.floor(Math.random() * gridSize);
        targetY = Math.floor(Math.random() * gridSize);
    } while (Math.abs(playerX - targetX) + Math.abs(playerY - targetY) < 3 || isObstacle(targetX, targetY));

    initialPlayerX = playerX;
    initialPlayerY = playerY;

    obstacles = [];
    newObstacles = [];
    let obstacleCount = 0;
    let newObstacleCount = 0;
    switch (difficulty) {
        case 'easy':
            obstacleCount = gridSize / 2;
            newObstacleCount = gridSize / 2;
            break;
        case 'medium':
            obstacleCount = gridSize;
            newObstacleCount = gridSize;
            break;
        case 'hard':
            obstacleCount = gridSize * 1.5;
            newObstacleCount = gridSize * 1.5;
            break;
    }

    // Генерация препятствий
    for (let i = 0; i < obstacleCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
        } while ((x === playerX && y === playerY) || (x === targetX && y === targetY) || isObstacle(x, y) || !isPathClear(playerX, playerY, targetX, targetY, obstacles));
        obstacles.push([x, y]);
    }

    // Генерация новых препятствий
    for (let i = 0; i < newObstacleCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
        } while ((x === playerX && y === playerY) || (x === targetX && y === targetY) || isObstacle(x, y) || !isPathClear(playerX, playerY, targetX, targetY, obstacles.concat(newObstacles)));
        newObstacles.push([x, y]);
    }

    // Проверка на возможность прохождения уровня
    if (!isPathClear(playerX, playerY, targetX, targetY, obstacles.concat(newObstacles))) {
        generateRandomField(difficulty); // Перегенерация уровня, если путь невозможен
    }
}

function isObstacle(x, y) {
    return obstacles.some(obstacle => obstacle[0] === x && obstacle[1] === y) || newObstacles.some(obstacle => obstacle[0] === x && obstacle[1] === y);
}

function isPathClear(startX, startY, endX, endY, obstacles) {
    const queue = [[startX, startY]];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0]
    ];

    while (queue.length > 0) {
        const [currentX, currentY] = queue.shift();

        if (currentX === endX && currentY === endY) {
            return true;
        }

        for (const [dx, dy] of directions) {
            const newX = currentX + dx;
            const newY = currentY + dy;

            if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize && !visited.has(`${newX},${newY}`) && !isObstacle(newX, newY)) {
                queue.push([newX, newY]);
                visited.add(`${newX},${newY}`);
            }
        }
    }

    return false;
}

function drawField() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ccc';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }

    if (obstacleImage.complete) {
        obstacles.forEach(obstacle => {
            ctx.drawImage(obstacleImage, obstacle[0] * cellSize, obstacle[1] * cellSize, cellSize, cellSize);
        });
    }

    if (newObstacleImage.complete) {
        newObstacles.forEach(obstacle => {
            ctx.drawImage(newObstacleImage, obstacle[0] * cellSize, obstacle[1] * cellSize, cellSize, cellSize);
        });
    }

    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    trail.forEach(pos => {
        ctx.fillRect(pos[0] * cellSize, pos[1] * cellSize, cellSize, cellSize);
    });

    if (playerImage.complete) {
        ctx.drawImage(playerImage, playerX * cellSize, playerY * cellSize, cellSize, cellSize);
    }

    if (targetImage.complete) {
        ctx.drawImage(targetImage, targetX * cellSize, targetY * cellSize, cellSize, cellSize);
    }
}

function animateMovement(startX, startY, endX, endY, callback) {
    const startTime = performance.now();
    const duration = 200;

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        playerX = startX + (endX - startX) * progress;
        playerY = startY + (endY - startY) * progress;

        drawField();

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
        } else {
            cancelAnimationFrame(animationFrameId);
            callback();
        }
    }

    animationFrameId = requestAnimationFrame(step);
}

document.getElementById('start-game-button').addEventListener('click', function() {
    document.querySelector('.welcome-container').style.display = 'none';
    document.querySelector('.editor-container').style.display = 'flex';
    document.querySelector('.game-container').style.display = 'flex';
    generateRandomField(difficulty);
    drawField();
});

document.getElementById('run-button').addEventListener('click', async function() {
    const code = document.getElementById('code-editor').value;
    const resultMessage = document.getElementById('result-message');
    const tryAgainButton = document.getElementById('try-again-button');
    resultMessage.textContent = '';
    tryAgainButton.style.display = 'none';

    playerX = initialPlayerX;
    playerY = initialPlayerY;
    trail = [];
    drawField();

    try {
        const wrappedCode = `(async () => { ${code.replace(/(\w+\((\d+)?\))/g, 'await $1')} })()`;
        await eval(wrappedCode);

        if (Math.floor(playerX) === targetX && Math.floor(playerY) === targetY) {
            Swal.fire({
                title: 'Победа!',
                text: 'Вы достигли цели и получаете награду!',
                icon: 'success',
                confirmButtonText: 'Отлично!'
            });
        } else {
            resultMessage.textContent = 'Вы не достигли цели. Попробуйте снова!';
            resultMessage.style.color = 'red';
            tryAgainButton.style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка выполнения кода:', error);
        resultMessage.textContent = 'Ошибка выполнения кода.';
        resultMessage.style.color = 'red';
        tryAgainButton.style.display = 'block';
    }
});

document.getElementById('try-again-button').addEventListener('click', function() {
    const resultMessage = document.getElementById('result-message');
    const tryAgainButton = document.getElementById('try-again-button');
    resultMessage.textContent = '';
    tryAgainButton.style.display = 'none';

    playerX = initialPlayerX;
    playerY = initialPlayerY;
    trail = [];
    drawField();
});

document.getElementById('difficulty').addEventListener('change', function() {
    difficulty = this.value;
    generateRandomField(difficulty);
    drawField();
});

document.getElementById('instructions-button').addEventListener('click', function() {
    Swal.fire({
        title: 'Инструкция по игре',
        html: `
            <p>Это игра с редактором кода, где вам нужно написать код для перемещения персонажа по игровому полю. Ваша цель — достичь финиша, избегая препятствий.</p>
            <p>Используйте следующие функции для перемещения:</p>
            <ul>
                <li><code>moveIntoLeft(steps)</code> - Движение влево на указанное количество шагов.</li>
                <li><code>moveIntoRight(steps)</code> - Движение вправо на указанное количество шагов.</li>
                <li><code>moveIntoUp(steps)</code> - Движение вверх на указанное количество шагов.</li>
                <li><code>moveIntoDown(steps)</code> - Движение вниз на указанное количество шагов.</li>
            </ul>
            <p>Пример кода:</p>
            <pre>
await moveIntoRight(3);
await moveIntoDown(2);
await moveIntoLeft(1);
await moveIntoUp(1);
            </pre>
        `,
        icon: 'info',
        confirmButtonText: 'Понятно!'
    });
});

Swal.fire({
    title: 'Добро пожаловать в игру!',
    html: `
        <p>Помоги змейке добраться до сокровищ, спрятанных в лабиринте! Напиши код, чтобы провести её через препятствия и достичь цели.</p>
    `,
    icon: 'info',
    confirmButtonText: 'Начать игру',
}).then((result) => {
    if (result.isConfirmed) {
        generateRandomField(difficulty);
        drawField();
    }
});

async function moveIntoLeft(steps = 1) {
    for (let i = 0; i < steps; i++) {
        if (playerX > 0 && !isObstacle(Math.floor(playerX) - 1, Math.floor(playerY))) {
            trail.push([Math.floor(playerX), Math.floor(playerY)]);
            await new Promise(resolve => animateMovement(playerX, playerY, playerX - 1, playerY, resolve));
        }
    }
}

async function moveIntoRight(steps = 1) {
    for (let i = 0; i < steps; i++) {
        if (playerX < gridSize - 1 && !isObstacle(Math.floor(playerX) + 1, Math.floor(playerY))) {
            trail.push([Math.floor(playerX), Math.floor(playerY)]);
            await new Promise(resolve => animateMovement(playerX, playerY, playerX + 1, playerY, resolve));
        }
    }
}

async function moveIntoUp(steps = 1) {
    for (let i = 0; i < steps; i++) {
        if (playerY > 0 && !isObstacle(Math.floor(playerX), Math.floor(playerY) - 1)) {
            trail.push([Math.floor(playerX), Math.floor(playerY)]);
            await new Promise(resolve => animateMovement(playerX, playerY, playerX, playerY - 1, resolve));
        }
    }
}

async function moveIntoDown(steps = 1) {
    for (let i = 0; i < steps; i++) {
        if (playerY < gridSize - 1 && !isObstacle(Math.floor(playerX), Math.floor(playerY) + 1)) {
            trail.push([Math.floor(playerX), Math.floor(playerY)]);
            await new Promise(resolve => animateMovement(playerX, playerY, playerX, playerY + 1, resolve));
        }
    }
}

function resizeCanvas() {
    const containerWidth = document.querySelector('.game-container').clientWidth;
    canvas.width = containerWidth;
    canvas.height = containerWidth;
    cellSize = canvas.width / gridSize;
    drawField();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();