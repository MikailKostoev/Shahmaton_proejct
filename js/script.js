// Основные константы и переменные
const CHESS_PIECES = {
    'wK': '♔',
    'wQ': '♕',
    'wR': '♖',
    'wB': '♗',
    'wN': '♘',
    'wP': '♙',
    'bK': '♚',
    'bQ': '♛',
    'bR': '♜',
    'bB': '♝',
    'bN': '♞',
    'bP': '♟'
};

let gameState = {
    mode: 'blindfold',
    level: 1,
    currentMove: 0,
    maxMoves: 20,
    errors: 0,
    maxErrors: 3,
    time: 0,
    timerInterval: null,
    isPlaying: false,
    currentPosition: [],
    activePiece: null,
    activePieceStartPos: null, // Начальная позиция активной фигуры для анимации
    targetPiece: null,
    pieces: [],
    hintUsed: false,
    currentUser: null,
    currentPlayer: 'w', // w для белых, b для черных
    debugMode: false // Режим отладки для проверки взаимодействий
};

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    initializeBoard();
    setupEventListeners();
    loadLeaderboard();
    updatePlayerDisplay();
});

// Инициализация шахматной доски
function initializeBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            chessboard.appendChild(cell);
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки режимов
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameState.mode = this.dataset.mode;
        });
    });

    // Кнопка начала игры
    document.getElementById('start-btn').addEventListener('click', startGame);

    // Кнопка подсказки
    document.getElementById('hint-btn').addEventListener('click', useHint);

    // Кнопка сброса
    document.getElementById('reset-btn').addEventListener('click', resetGame);

    // Регистрация пользователя
    document.getElementById('register-btn').addEventListener('click', registerUser);
}

// Начало игры
function startGame() {
    if (!gameState.currentUser) {
        showMessage('Пожалуйста, зарегистрируйтесь перед началом игры!');
        return;
    }

    resetGameState();
    gameState.isPlaying = true;
    document.getElementById('start-btn').disabled = true;
    document.getElementById('hint-btn').disabled = false;

    // Запуск таймера
    gameState.timerInterval = setInterval(() => {
        gameState.time++;
        updateTimerDisplay();
    }, 1000);

    // Генерация начальной позиции
    generateInitialPosition();
    showPositionBriefly();
}

// Сброс игры
function resetGame() {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('hint-btn').disabled = true;
    clearBoard();
    resetGameState();
}

// Сброс состояния игры
function resetGameState() {
    gameState.currentMove = 0;
    gameState.errors = 0;
    gameState.time = 0;
    gameState.hintUsed = false;
    gameState.currentPlayer = 'w';
    updateDisplay();
    updatePlayerDisplay();
}

// Генерация начальной позиции с учетом шахматных правил
function generateInitialPosition() {
    let maxAttempts = 100;
    let attempt = 0;
    let validPositionFound = false;

    while (!validPositionFound && attempt < maxAttempts) {
        attempt++;
        gameState.pieces = [];
        gameState.currentPosition = [];

        const numPieces = gameState.level + 1;

        // Генерируем позицию без взаимодействий
        if (generateNonInteractingPosition(numPieces)) {
            // Теперь создаем ровно одно взаимодействие
            if (createSingleInteraction()) {
                validPositionFound = true;
            }
        }
    }

    if (!validPositionFound) {
        // Если не удалось создать идеальную позицию, создаем упрощенную
        generateSimplePosition();
    }
}

// Генерация позиции, где фигуры НЕ взаимодействуют друг с другом
function generateNonInteractingPosition(numPieces) {
    const pieceTypes = ['R', 'N', 'B', 'Q', 'K', 'P'];
    const colors = ['w', 'b'];
    let piecesAdded = 0;
    let attempts = 0;
    const maxAttempts = 500;

    const tempPieces = [];

    while (piecesAdded < numPieces && attempts < maxAttempts) {
        attempts++;

        const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const color = piecesAdded === 0 ? gameState.currentPlayer : colors[Math.floor(Math.random() * colors.length)];

        const row = Math.floor(Math.random() * 8);
        const col = Math.floor(Math.random() * 8);

        // Проверяем, что клетка свободна
        if (tempPieces.some(p => p.row === row && p.col === col)) {
            continue;
        }

        const piece = { type: color + type, row, col };

        // Проверяем валидность позиции
        if (!isPositionValid(piece, tempPieces)) {
            continue;
        }

        // Проверяем, что новая фигура не взаимодействует с существующими
        if (!hasAnyInteraction(piece, tempPieces)) {
            tempPieces.push(piece);
            piecesAdded++;
        }
    }

    if (piecesAdded === numPieces) {
        gameState.pieces = tempPieces.map(p => ({...p }));
        return true;
    }

    return false;
}

// Создание ровно одного взаимодействия между фигурами
function createSingleInteraction() {
    // Находим фигуру текущего игрока для активной фигуры
    const playerPieces = gameState.pieces.filter(p => p.type[0] === gameState.currentPlayer);

    if (playerPieces.length === 0) {
        return false;
    }

    // Перебираем фигуры игрока
    for (let activePiece of playerPieces) {
        // Получаем все возможные ходы этой фигуры
        const possibleMoves = ChessRules.getPossibleMoves(activePiece, activePiece.row, activePiece.col, gameState.pieces);

        // Ищем пустые клетки, откуда можно атаковать ровно одну фигуру
        for (let move of possibleMoves) {
            // Проверяем, есть ли на этой клетке фигура
            if (gameState.pieces.some(p => p.row === move.row && p.col === move.col)) {
                continue;
            }

            // Сохраняем старую позицию
            const oldRow = activePiece.row;
            const oldCol = activePiece.col;

            // Временно перемещаем фигуру
            activePiece.row = move.row;
            activePiece.col = move.col;

            // Проверяем взаимодействия
            const interactions = ChessRules.getPieceInteractions(activePiece, gameState.pieces);
            const validInteractions = interactions.filter(i =>
                i.target !== activePiece && i.target.type[0] !== activePiece.type[0]
            );

            if (validInteractions.length === 1) {
                // Нашли позицию с ровно одним взаимодействием!
                gameState.activePiece = activePiece;
                gameState.targetPiece = validInteractions[0].target;
                // Сохраняем начальную позицию для анимации
                gameState.activePieceStartPos = { row: oldRow, col: oldCol };
                return true;
            }

            // Возвращаем фигуру на место
            activePiece.row = oldRow;
            activePiece.col = oldCol;
        }
    }

    return false;
}

// Упрощенная генерация позиции (запасной вариант)
function generateSimplePosition() {
    gameState.pieces = [];
    const numPieces = gameState.level + 1;

    // Размещаем активную фигуру в начальной позиции
    const startRow = 3;
    const startCol = 3;
    const activePiece = {
        type: gameState.currentPlayer + 'N', // Используем коня для простоты
        row: 5, // Конечная позиция после хода
        col: 4
    };
    gameState.pieces.push(activePiece);
    gameState.activePiece = activePiece;

    // Сохраняем начальную позицию для анимации
    gameState.activePieceStartPos = { row: startRow, col: startCol };

    // Размещаем целевую фигуру в зоне атаки коня
    const targetColor = gameState.currentPlayer === 'w' ? 'b' : 'w';
    const targetPiece = {
        type: targetColor + 'P',
        row: 7,
        col: 5
    };
    gameState.pieces.push(targetPiece);
    gameState.targetPiece = targetPiece;

    // Добавляем остальные фигуры в безопасных местах
    const safeCells = [
        { row: 0, col: 0 }, { row: 0, col: 7 }, { row: 1, col: 1 }
    ];

    for (let i = 2; i < numPieces && i - 2 < safeCells.length; i++) {
        const cell = safeCells[i - 2];
        const color = Math.random() < 0.5 ? 'w' : 'b';
        gameState.pieces.push({
            type: color + 'P',
            row: cell.row,
            col: cell.col
        });
    }
}

// Проверка валидности позиции фигуры
function isPositionValid(piece, existingPieces) {
    // Проверка 1: Короли не должны стоять рядом друг с другом
    if (piece.type[1] === 'K') {
        for (let otherPiece of existingPieces) {
            if (otherPiece.type[1] === 'K') {
                const rowDiff = Math.abs(piece.row - otherPiece.row);
                const colDiff = Math.abs(piece.col - otherPiece.col);
                if (rowDiff <= 1 && colDiff <= 1) {
                    return false;
                }
            }
        }
    }

    // Проверка 2: Слоны должны быть на разнопольных клетках
    if (piece.type[1] === 'B') {
        const pieceColor = (piece.row + piece.col) % 2; // 0 = темная, 1 = светлая

        for (let otherPiece of existingPieces) {
            if (otherPiece.type[1] === 'B' && otherPiece.type[0] === piece.type[0]) {
                const otherColor = (otherPiece.row + otherPiece.col) % 2;
                if (pieceColor === otherColor) {
                    return false; // Слоны одного цвета должны быть на разных полях
                }
            }
        }
    }

    // Проверка 3: Пешки не должны быть на крайних горизонталях
    if (piece.type[1] === 'P') {
        if (piece.row === 0 || piece.row === 7) {
            return false;
        }
    }

    // Проверка 4: Не должно быть слишком много королей одного цвета
    if (piece.type[1] === 'K') {
        const sameColorKings = existingPieces.filter(p =>
            p.type[1] === 'K' && p.type[0] === piece.type[0]
        );
        if (sameColorKings.length >= 1) {
            return false; // Только один король каждого цвета
        }
    }

    return true;
}

// Проверка, есть ли у фигуры взаимодействия с другими
function hasAnyInteraction(piece, existingPieces) {
    if (existingPieces.length === 0) {
        return false;
    }

    // Проверяем, атакует ли эта фигура другие
    const moves = ChessRules.getPossibleMoves(piece, piece.row, piece.col, existingPieces);
    for (let move of moves) {
        if (existingPieces.some(p => p.row === move.row && p.col === move.col)) {
            return true; // Фигура атакует другую фигуру
        }
    }

    // Проверяем, атакуют ли эту фигуру другие
    for (let otherPiece of existingPieces) {
        const otherMoves = ChessRules.getPossibleMoves(otherPiece, otherPiece.row, otherPiece.col, existingPieces);
        for (let move of otherMoves) {
            if (move.row === piece.row && move.col === piece.col) {
                return true; // Фигуру атакует другая фигура
            }
        }
    }

    return false;
}

// Проверка занятости клетки
function isCellOccupied(row, col) {
    return gameState.pieces.some(piece => piece.row === row && piece.col === col);
}

// Генерация новой позиции с одним взаимодействием для следующего хода
function generateNextPosition() {
    let maxAttempts = 50;
    let attempt = 0;

    // Сохраняем текущую угаданную фигуру как новую активную
    const newActivePiece = gameState.targetPiece;

    while (attempt < maxAttempts) {
        attempt++;

        // Получаем возможные ходы новой активной фигуры
        const possibleMoves = ChessRules.getPossibleMoves(newActivePiece, newActivePiece.row, newActivePiece.col, gameState.pieces);

        // Перебираем возможные ходы
        for (let move of possibleMoves) {
            // Пропускаем занятые клетки
            if (gameState.pieces.some(p => p.row === move.row && p.col === move.col)) {
                continue;
            }

            // Сохраняем старую позицию
            const oldRow = newActivePiece.row;
            const oldCol = newActivePiece.col;

            // Временно перемещаем фигуру
            newActivePiece.row = move.row;
            newActivePiece.col = move.col;

            // Проверяем количество взаимодействий
            const interactions = ChessRules.getPieceInteractions(newActivePiece, gameState.pieces);
            const validInteractions = interactions.filter(i =>
                i.target !== newActivePiece && i.target.type[0] !== newActivePiece.type[0]
            );

            // Также проверяем, что другие фигуры не взаимодействуют между собой
            let otherInteractions = 0;
            for (let piece of gameState.pieces) {
                if (piece === newActivePiece) continue;

                const pieceInteractions = ChessRules.getPieceInteractions(piece, gameState.pieces);
                for (let interaction of pieceInteractions) {
                    if (interaction.target !== newActivePiece && interaction.target !== piece) {
                        otherInteractions++;
                    }
                }
            }

            if (validInteractions.length === 1 && otherInteractions === 0) {
                // Идеальная позиция найдена!
                gameState.activePiece = newActivePiece;
                gameState.targetPiece = validInteractions[0].target;
                // Сохраняем начальную позицию для анимации
                gameState.activePieceStartPos = { row: oldRow, col: oldCol };
                return true;
            }

            // Возвращаем на место
            newActivePiece.row = oldRow;
            newActivePiece.col = oldCol;
        }
    }

    // Если не удалось найти позицию, генерируем новую с нуля
    return false;
}

// Проверка корректности позиции (для отладки)
function verifyPositionCorrectness() {
    let interactionCount = 0;
    let interactionDetails = [];

    // Считаем взаимодействия активной фигуры
    const activeInteractions = ChessRules.getPieceInteractions(gameState.activePiece, gameState.pieces);
    const validActiveInteractions = activeInteractions.filter(i =>
        i.target !== gameState.activePiece && i.target.type[0] !== gameState.activePiece.type[0]
    );

    interactionCount += validActiveInteractions.length;
    interactionDetails.push(`Active piece (${gameState.activePiece.type}): ${validActiveInteractions.length} interactions`);

    // Проверяем, что другие фигуры не взаимодействуют между собой
    for (let piece of gameState.pieces) {
        if (piece === gameState.activePiece) continue;

        const pieceInteractions = ChessRules.getPieceInteractions(piece, gameState.pieces);
        for (let interaction of pieceInteractions) {
            if (interaction.target !== gameState.activePiece && interaction.target !== piece) {
                interactionCount++;
                interactionDetails.push(`Piece ${piece.type} at (${piece.row},${piece.col}) interacts with ${interaction.target.type}`);
            }
        }
    }

    if (gameState.debugMode) {
        console.log('=== Position Verification ===');
        console.log('Total interactions (should be 1):', interactionCount);
        console.log('Details:', interactionDetails);
        console.log('Active piece:', gameState.activePiece);
        console.log('Target piece:', gameState.targetPiece);
        console.log('===========================');
    }

    return interactionCount === 1;
}

// Краткий показ позиции
function showPositionBriefly() {
    // Проверяем корректность позиции
    if (gameState.debugMode) {
        verifyPositionCorrectness();
    }

    if (gameState.mode === 'blindfold') {
        displayPosition();
        setTimeout(() => {
            clearBoard();
            showActivePieceMove();
        }, 2000);
    } else {
        displayPosition();
        showActivePieceMove();
    }
}

// Отображение позиции на доске
function displayPosition() {
    clearBoard();
    gameState.pieces.forEach(piece => {
        const cell = getCell(piece.row, piece.col);
        cell.textContent = CHESS_PIECES[piece.type];
        cell.classList.add(`piece-${piece.type[0] === 'w' ? 'white' : 'black'}`);
    });
}

// Показать ход активной фигуры по правилам шахмат
function showActivePieceMove() {
    clearBoard();

    // Используем сохраненную начальную позицию
    const startRow = gameState.activePieceStartPos ? gameState.activePieceStartPos.row : gameState.activePiece.row;
    const startCol = gameState.activePieceStartPos ? gameState.activePieceStartPos.col : gameState.activePiece.col;

    // Показываем активную фигуру на начальной позиции
    const activeCell = getCell(startRow, startCol);
    activeCell.textContent = CHESS_PIECES[gameState.activePiece.type];
    activeCell.classList.add('piece-move');
    activeCell.classList.add(`piece-${gameState.activePiece.type[0] === 'w' ? 'white' : 'black'}`);

    // Анимируем ход
    setTimeout(() => {
        activeCell.textContent = '';
        activeCell.classList.remove('piece-move');

        // Показываем фигуру на новой позиции
        const newCell = getCell(gameState.activePiece.row, gameState.activePiece.col);
        newCell.textContent = CHESS_PIECES[gameState.activePiece.type];
        newCell.classList.add('piece-move');
        newCell.classList.add(`piece-${gameState.activePiece.type[0] === 'w' ? 'white' : 'black'}`);

        // После анимации очищаем доску для угадывания
        setTimeout(() => {
            clearBoard();
            if (gameState.mode === 'beginner') {
                displayPosition();
            }
        }, 1000);
    }, 500);
}

// Обработка клика по клетке
function handleCellClick(event) {
    if (!gameState.isPlaying) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    // Проверяем, угадал ли игрок целевую фигуру
    if (row === gameState.targetPiece.row && col === gameState.targetPiece.col) {
        // Правильный ответ
        showMessage('Правильно!');
        gameState.currentMove++;

        // Меняем игрока
        gameState.currentPlayer = gameState.currentPlayer === 'w' ? 'b' : 'w';
        updatePlayerDisplay();

        if (gameState.currentMove >= gameState.maxMoves) {
            levelComplete();
        } else {
            // Генерируем следующую позицию с одним взаимодействием
            if (!generateNextPosition()) {
                // Если не удалось, создаем новую позицию с нуля
                generateInitialPosition();
            }
            showPositionBriefly();
        }
    } else {
        // Неправильный ответ
        gameState.errors++;
        showMessage('Неправильно! Попробуйте еще раз.');

        if (gameState.errors >= gameState.maxErrors) {
            gameOver();
        }
    }

    updateDisplay();
}

// Следующий ход
function nextMove() {
    gameState.currentMove++;

    if (gameState.currentMove >= gameState.maxMoves) {
        levelComplete();
    } else {
        // Меняем игрока
        gameState.currentPlayer = gameState.currentPlayer === 'w' ? 'b' : 'w';
        updatePlayerDisplay();

        // Выбираем новую активную фигуру текущего игрока
        const playerPieces = gameState.pieces.filter(p => p.type[0] === gameState.currentPlayer);
        if (playerPieces.length > 0) {
            gameState.activePiece = playerPieces[Math.floor(Math.random() * playerPieces.length)];
            generateTargetPiece();
            showPositionBriefly();
        } else {
            // Если у игрока не осталось фигур
            gameOver();
        }
    }
}

// Использование подсказки
function useHint() {
    if (gameState.hintUsed) {
        showMessage('Вы уже использовали подсказку на этом уровне!');
        return;
    }

    gameState.hintUsed = true;
    document.getElementById('hint-btn').disabled = true;

    // Показываем целевую фигуру
    const targetCell = getCell(gameState.targetPiece.row, gameState.targetPiece.col);
    targetCell.classList.add('target');

    setTimeout(() => {
        targetCell.classList.remove('target');
        if (gameState.mode === 'blindfold') {
            clearBoard();
        }
    }, 3000);
}

// Завершение уровня
function levelComplete() {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;

    // Вычисляем очки
    const score = calculateScore();
    showMessage(`Уровень ${gameState.level} пройден! Очки: ${score}`);

    // Обновляем таблицу рекордов
    updateLeaderboard(gameState.currentUser, score, gameState.level);

    // Переходим на следующий уровень
    gameState.level++;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('hint-btn').disabled = true;
}

// Конец игры (превышено количество ошибок)
function gameOver() {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;
    showMessage('Игра окончена! Слишком много ошибок.');
    document.getElementById('start-btn').disabled = false;
    document.getElementById('hint-btn').disabled = true;
}

// Расчет очков
function calculateScore() {
    const baseScore = gameState.level * 100;
    const timeBonus = Math.max(0, 300 - gameState.time) * 2;
    const errorPenalty = gameState.errors * 50;
    const hintPenalty = gameState.hintUsed ? 100 : 0;
    const accuracyBonus = Math.round((gameState.currentMove / gameState.maxMoves) * 200);

    return baseScore + timeBonus - errorPenalty - hintPenalty + accuracyBonus;
}

// Регистрация пользователя
function registerUser() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        showMessage('Введите имя пользователя!');
        return;
    }

    gameState.currentUser = username;
    document.getElementById('current-user').textContent = username;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('username').value = '';

    showMessage(`Добро пожаловать, ${username}!`);
}

// Обновление отображения текущего игрока
function updatePlayerDisplay() {
    const playerSide = document.getElementById('player-side');
    playerSide.textContent = gameState.currentPlayer === 'w' ? 'белые' : 'черные';
    playerSide.style.color = gameState.currentPlayer === 'w' ? '#ffffff' : '#000000';
    playerSide.style.textShadow = gameState.currentPlayer === 'w' ?
        '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(255,255,255,0.8)';
}

// Обновление таблицы рекордов
function updateLeaderboard(user, score, level) {
    let leaderboard = JSON.parse(localStorage.getItem('chessTrainerLeaderboard') || '[]');

    leaderboard.push({
        user: user,
        score: score,
        level: level,
        date: new Date().toLocaleDateString(),
        time: gameState.time
    });

    // Сортируем по убыванию очков
    leaderboard.sort((a, b) => b.score - a.score);

    // Ограничиваем топ-10
    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem('chessTrainerLeaderboard', JSON.stringify(leaderboard));
    loadLeaderboard();
}

// Загрузка таблицы рекордов
function loadLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('chessTrainerLeaderboard') || '[]');
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p>Рекордов пока нет</p>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>${index + 1}. ${entry.user}</span>
            <span>${entry.score} (ур. ${entry.level})</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Вспомогательные функции
function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function clearBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('piece-move', 'target', 'piece-white', 'piece-black', 'possible-move');
    });
}

function updateDisplay() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('move').textContent = `${gameState.currentMove}/${gameState.maxMoves}`;
    document.getElementById('errors').textContent = `${gameState.errors}/${gameState.maxErrors}`;
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.time / 60).toString().padStart(2, '0');
    const seconds = (gameState.time % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

function showMessage(text) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}