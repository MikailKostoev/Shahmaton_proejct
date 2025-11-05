// ============================================
// FIREBASE AUTHENTICATION MODULE
// ============================================

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Ждем, пока Firebase будет инициализирован
let auth = null;
let isInitialized = false;

// Проверяем инициализацию Firebase
const waitForFirebase = () => {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (window.firebaseAuth) {
                auth = window.firebaseAuth;
                clearInterval(checkFirebase);
                isInitialized = true;
                resolve();
            }
        }, 100);
    });
};

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async function() {
    await waitForFirebase();
    setupAuthListeners();
    setupAuthStateObserver();
    
    // Auth загружен
    if (window.loadingProgress) {
        window.loadingProgress.update();
    }
});

// ============================================
// НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ============================================
function setupAuthListeners() {
    // Открытие модального окна
    const openLoginBtn = document.getElementById('open-login-btn');
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', openAuthModal);
    }

    // Закрытие модального окна
    const closeAuth = document.getElementById('close-auth');
    if (closeAuth) {
        closeAuth.addEventListener('click', closeAuthModal);
    }

    // Закрытие по клику вне окна
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAuthModal();
            }
        });
    }

    // Переключение между формами
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToRegister();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToLogin();
        });
    }

    // Показать/скрыть пароль
    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    
    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener('click', function() {
            togglePasswordVisibility('login-password', this);
        });
    }
    
    if (toggleRegisterPassword) {
        toggleRegisterPassword.addEventListener('click', function() {
            togglePasswordVisibility('register-password', this);
        });
    }

    // Отправка формы входа
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', handleLogin);
    }

    // Вход по Enter в форме логина
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    
    if (loginUsername) {
        loginUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // Отправка формы регистрации
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', handleRegister);
    }

    // Регистрация по Enter
    const registerUsername = document.getElementById('register-username');
    const registerPassword = document.getElementById('register-password');
    
    if (registerUsername) {
        registerUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleRegister();
        });
    }
    
    if (registerPassword) {
        registerPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleRegister();
        });
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ============================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ============================================
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        // Показываем форму входа по умолчанию
        switchToLogin();
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
        clearAuthForms();
    }
}

function switchToLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.style.display = 'flex';
    if (registerForm) registerForm.style.display = 'none';
}

function switchToRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'flex';
}

function clearAuthForms() {
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const registerUsername = document.getElementById('register-username');
    const registerPassword = document.getElementById('register-password');
    
    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
    if (registerUsername) registerUsername.value = '';
    if (registerPassword) registerPassword.value = '';
}

// ============================================
// ПОКАЗАТЬ/СКРЫТЬ ПАРОЛЬ
// ============================================
function togglePasswordVisibility(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleElement.textContent = '🙈';
    } else {
        input.type = 'password';
        toggleElement.textContent = '👁️';
    }
}

// ============================================
// ВХОД В СИСТЕМУ
// ============================================
async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showAuthMessage('Пожалуйста, заполните все поля!');
        return;
    }

    // Проверка тестового пользователя
    if (username === 'test' && password === 'test') {
        // Создаем тестовый email и пароль
        const testEmail = 'test@shahmaton.local';
        const testPassword = 'testtest123'; // Минимум 6 символов для Firebase
        
        try {
            // Сначала пытаемся войти
            const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
            
            if (!userCredential.user.displayName) {
                await updateProfile(userCredential.user, { displayName: 'test' });
            }
            
            showAuthMessage('✅ Вход выполнен успешно!');
            setTimeout(() => closeAuthModal(), 1000);
            
        } catch (error) {
            // Если пользователь не существует, создаем его автоматически
            if (error.code === 'auth/user-not-found') {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
                    await updateProfile(userCredential.user, { displayName: 'test' });
                    showAuthMessage('✅ Тестовый пользователь создан и вход выполнен!');
                    setTimeout(() => closeAuthModal(), 1000);
                } catch (createError) {
                    console.error('Ошибка создания тестового пользователя:', createError);
                    showAuthMessage('❌ Ошибка создания тестового пользователя: ' + createError.message);
                }
            } else {
                showAuthMessage('❌ Ошибка входа: ' + error.message);
            }
        }
        return;
    }

    // Преобразуем username в email (username@shahmaton.local)
    const email = `${username}@shahmaton.local`;
    await loginUser(email, password, username);
}

async function loginUser(email, password, displayName) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Обновляем displayName если его нет
        if (!userCredential.user.displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        
        showAuthMessage('✅ Вход выполнен успешно!');
        
        setTimeout(() => {
            closeAuthModal();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            showAuthMessage('❌ Неверный логин или пароль!');
        } else if (error.code === 'auth/too-many-requests') {
            showAuthMessage('❌ Слишком много попыток входа. Попробуйте позже.');
        } else {
            showAuthMessage('❌ Ошибка входа: ' + error.message + ' (код: ' + error.code + ')');
        }
    }
}

// ============================================
// РЕГИСТРАЦИЯ
// ============================================
async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
        showAuthMessage('Пожалуйста, заполните все поля!');
        return;
    }

    // Валидация
    if (username.length < 3) {
        showAuthMessage('Логин должен содержать минимум 3 символа!');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Пароль должен содержать минимум 6 символов!');
        return;
    }

    // Преобразуем username в email
    const email = `${username}@shahmaton.local`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Устанавливаем displayName
        await updateProfile(userCredential.user, {
            displayName: username
        });
        
        showAuthMessage('✅ Регистрация прошла успешно!');
        
        setTimeout(() => {
            closeAuthModal();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        
        if (error.code === 'auth/email-already-in-use') {
            showAuthMessage('❌ Этот логин уже занят!');
        } else if (error.code === 'auth/weak-password') {
            showAuthMessage('❌ Слишком простой пароль. Минимум 6 символов.');
        } else {
            showAuthMessage('❌ Ошибка регистрации: ' + error.message + ' (код: ' + error.code + ')');
        }
    }
}

// ============================================
// ВЫХОД ИЗ СИСТЕМЫ
// ============================================
async function handleLogout() {
    try {
        await signOut(auth);
        showAuthMessage('Вы вышли из системы');
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showAuthMessage('Ошибка при выходе: ' + error.message);
    }
}

// ============================================
// ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ АУТЕНТИФИКАЦИИ
// ============================================
function setupAuthStateObserver() {
    let previousUserId = null;

    onAuthStateChanged(auth, async (user) => {
        const loginPrompt = document.getElementById('login-prompt');
        const userInfo = document.getElementById('user-info');
        const currentUserElement = document.getElementById('current-user');

        if (user) {
            // Пользователь залогинен
            const displayName = user.displayName || user.email.split('@')[0];
            
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (userInfo) userInfo.style.display = 'block';
            if (currentUserElement) currentUserElement.textContent = displayName;
            
            // Обновляем gameState
            if (window.gameState) {
                const isUserChanged = previousUserId !== null && previousUserId !== user.uid;
                
                window.gameState.currentUser = displayName;
                window.gameState.userId = user.uid;
                
                // Сбрасываем уровень на 1 при смене пользователя
                if (isUserChanged) {
                    console.log('🔄 Смена пользователя, сброс уровня и игры');
                    
                    // Останавливаем текущую игру если она идет
                    if (window.gameState.isPlaying) {
                        clearInterval(window.gameState.timerInterval);
                        window.gameState.isPlaying = false;
                        document.getElementById('start-btn').disabled = false;
                        document.getElementById('hint-btn').disabled = true;
                    }
                    
                    // Сбрасываем на 1 уровень
                    window.gameState.level = 1;
                    
                    // Обновляем отображение
                    if (window.updateDisplay) {
                        window.updateDisplay();
                    }
                }
                
                // Загружаем прогресс пользователя из Firestore
                await loadUserProgress(user.uid);
                
                previousUserId = user.uid;
                
                console.log('✅ gameState обновлен:', {
                    currentUser: window.gameState.currentUser,
                    userId: window.gameState.userId,
                    level: window.gameState.level
                });
            } else {
                console.warn('⚠️ window.gameState еще не инициализирован!');
            }
            
            console.log('👤 Пользователь вошел:', displayName);
            
        } else {
            // Пользователь не залогинен
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
            if (currentUserElement) currentUserElement.textContent = '';
            
            // Обновляем gameState
            if (window.gameState) {
                // Останавливаем игру если она идет
                if (window.gameState.isPlaying) {
                    clearInterval(window.gameState.timerInterval);
                    window.gameState.isPlaying = false;
                    document.getElementById('start-btn').disabled = false;
                    document.getElementById('hint-btn').disabled = true;
                }
                
                window.gameState.currentUser = null;
                window.gameState.userId = null;
                window.gameState.level = 1; // Сброс уровня при выходе
                
                if (window.updateDisplay) {
                    window.updateDisplay();
                }
            }
            
            previousUserId = null;
            console.log('👤 Пользователь вышел, уровень сброшен на 1');
        }
    });
}

// Загрузка прогресса пользователя из Firestore
async function loadUserProgress(userId) {
    // Эта функция будет реализована позже для сохранения прогресса
    // Пока просто сбрасываем на 1 при каждом входе
    console.log('📊 Прогресс пользователя: level 1 (новый старт)');
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function showAuthMessage(text) {
    // Используем существующую функцию showMessage из script.js
    if (typeof window.showMessage === 'function') {
        window.showMessage(text);
    } else {
        alert(text);
    }
}

// Экспортируем для использования в других модулях
window.firebaseAuthModule = {
    openAuthModal,
    closeAuthModal,
    handleLogout
};

