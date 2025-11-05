// ============================================
// FIREBASE FIRESTORE LEADERBOARD
// Глобальная таблица рекордов для всех игроков
// ============================================

import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    onSnapshot,
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let db = null;
let unsubscribeLeaderboard = null;

// Ждем инициализации Firebase
const waitForFirebase = () => {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (window.firebaseDB) {
                db = window.firebaseDB;
                clearInterval(checkFirebase);
                resolve();
            }
        }, 100);
    });
};

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    await waitForFirebase();
    console.log('🔥 Firestore готов для работы с таблицей рекордов');
    
    // Leaderboard модуль загружен
    if (window.loadingProgress) {
        window.loadingProgress.update();
    }
    
    // Загружаем таблицу рекордов при старте (данные загрузятся асинхронно)
    loadGlobalLeaderboard();
});

// ============================================
// СОХРАНЕНИЕ РЕКОРДА В FIRESTORE
// ============================================
export async function saveScoreToFirestore(user, userId, score, level, gameData) {
    if (!db) {
        console.error('❌ Firestore не инициализирован');
        return false;
    }

    try {
        console.log('💾 Сохранение рекорда в Firestore:', { user, score, level });

        const leaderboardRef = collection(db, 'leaderboard');
        
        const entry = {
            user: user,
            userId: userId,
            score: score,
            level: level,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            time: gameData.time,
            mode: gameData.mode,
            errors: gameData.errors,
            hintUsed: gameData.hintUsed,
            accuracy: Math.round((gameData.currentMove / gameData.maxMoves) * 100),
            isPerfect: gameData.errors === 0 && !gameData.hintUsed
        };

        const docRef = await addDoc(leaderboardRef, entry);
        console.log('✅ Рекорд сохранен в Firestore с ID:', docRef.id);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения рекорда в Firestore:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        
        // Fallback на localStorage
        console.log('⚠️ Используем localStorage как запасной вариант');
        saveToLocalStorage(user, score, level, gameData);
        
        return false;
    }
}

// ============================================
// ЗАГРУЗКА ГЛОБАЛЬНОЙ ТАБЛИЦЫ РЕКОРДОВ
// ============================================
export async function loadGlobalLeaderboard() {
    if (!db) {
        console.warn('⚠️ Firestore не готов, ждем инициализации...');
        // НЕ вызываем loadFromLocalStorage, ждем Firestore
        return;
    }

    try {
        console.log('📖 Загрузка глобальной таблицы рекордов из Firestore...');

        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
            leaderboardRef, 
            orderBy('score', 'desc'), 
            limit(50) // Топ-50 рекордов
        );

        // Отписываемся от предыдущих обновлений
        if (unsubscribeLeaderboard) {
            unsubscribeLeaderboard();
        }

        // Real-time обновление таблицы рекордов
        unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
            const leaderboard = [];
            snapshot.forEach((doc) => {
                leaderboard.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('📊 Получено рекордов из Firestore:', leaderboard.length);
            displayLeaderboard(leaderboard);
            
            // Уведомляем систему загрузки, что данные получены ИЗ FIRESTORE
            if (window.loadingProgress && !window.loadingProgress.leaderboardDataLoaded) {
                console.log('✅ Данные из Firestore загружены, уведомляем систему загрузки');
                window.loadingProgress.setLeaderboardDataLoaded();
            }
        }, (error) => {
            console.error('❌ Ошибка загрузки рекордов:', error);
            console.error('Код ошибки:', error.code);
            
            // Fallback на localStorage
            console.log('⚠️ Используем localStorage как запасной вариант');
            loadFromLocalStorage();
        });

    } catch (error) {
        console.error('❌ Ошибка при загрузке таблицы рекордов:', error);
        loadFromLocalStorage();
    }
}

// ============================================
// ОТОБРАЖЕНИЕ ТАБЛИЦЫ РЕКОРДОВ
// ============================================
function displayLeaderboard(leaderboard) {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    if (!leaderboardList) {
        console.error('❌ Элемент leaderboard-list не найден');
        return;
    }

    leaderboardList.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p>Рекордов пока нет</p>';
        return;
    }

    // Показываем топ-10
    const topEntries = leaderboard.slice(0, 10);

    topEntries.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';

        // Медали для топ-3
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';

        // Иконки достижений
        let badges = '';
        if (entry.isPerfect) badges += '⭐ ';
        if (entry.mode === 'blindfold') badges += '😎 ';
        if (entry.accuracy === 100) badges += '🎯 ';

        // Форматирование времени
        const minutes = Math.floor(entry.time / 60);
        const seconds = entry.time % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Форматирование даты
        let dateStr = '';
        try {
            const date = entry.timestamp ? new Date(entry.timestamp) : new Date(entry.date);
            dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        } catch (e) {
            dateStr = entry.date || '';
        }

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-weight: bold;">${medal}${index + 1}. ${entry.user}</span>
                <span style="color: #FFD700; font-weight: bold;">${entry.score} ${badges}</span>
            </div>
            <div style="font-size: 0.8em; color: rgba(255,255,255,0.7); margin-top: 3px;">
                Уровень ${entry.level} • ${timeStr} • ${entry.accuracy}% • ${dateStr}
            </div>
        `;

        // Добавляем специальный стиль для топ-3
        if (index < 3) {
            item.style.background = 'rgba(255, 215, 0, 0.1)';
            item.style.borderLeft = '3px solid #FFD700';
        }

        // Подсветка текущего пользователя
        if (window.gameState && entry.userId === window.gameState.userId) {
            item.style.background = 'rgba(76, 175, 80, 0.2)';
            item.style.borderLeft = '3px solid #4CAF50';
        }

        leaderboardList.appendChild(item);
    });

    console.log('✅ Таблица рекордов отображена:', topEntries.length, 'записей');
}

// ============================================
// FALLBACK НА LOCALSTORAGE
// ============================================
function saveToLocalStorage(user, score, level, gameData) {
    let leaderboard = JSON.parse(localStorage.getItem('chessTrainerLeaderboard') || '[]');

    const entry = {
        user: user,
        userId: gameData.userId || 'local',
        score: score,
        level: level,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        time: gameData.time,
        mode: gameData.mode,
        errors: gameData.errors,
        hintUsed: gameData.hintUsed,
        accuracy: Math.round((gameData.currentMove / gameData.maxMoves) * 100),
        isPerfect: gameData.errors === 0 && !gameData.hintUsed
    };

    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 50);

    localStorage.setItem('chessTrainerLeaderboard', JSON.stringify(leaderboard));
    console.log('💾 Рекорд сохранен в localStorage');
    
    displayLeaderboard(leaderboard);
}

function loadFromLocalStorage() {
    const leaderboard = JSON.parse(localStorage.getItem('chessTrainerLeaderboard') || '[]');
    console.log('📖 Загрузка из localStorage (fallback):', leaderboard.length, 'записей');
    displayLeaderboard(leaderboard);
    
    // Уведомляем систему загрузки, что данные получены (только если Firestore недоступен)
    if (window.loadingProgress && !window.loadingProgress.leaderboardDataLoaded) {
        console.log('✅ Данные из localStorage загружены, уведомляем систему загрузки');
        window.loadingProgress.setLeaderboardDataLoaded();
    }
}

// Делаем функции доступными глобально
window.firebaseLeaderboard = {
    saveScoreToFirestore,
    loadGlobalLeaderboard
};

