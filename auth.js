document.addEventListener('DOMContentLoaded', () => {
    
    // --- ПРОВЕРКА АВТОРИЗАЦИИ ---
    if (sessionStorage.getItem('currentUser')) {
        window.location.href = 'profile.html';
        return; 
    }

    // --- ПОИСК ЭЛЕМЕНТОВ ---
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const activeLine = document.querySelector('.active-line');
    const authMessage = document.getElementById('auth-message');
    const captchaLabel = document.getElementById('captcha-label');
    const captchaInput = document.getElementById('captcha-input');
    let captchaAnswer;

    // --- ЛОГИКА КАПЧИ ---
    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaAnswer = num1 + num2;
        if (captchaLabel) captchaLabel.textContent = `Решите пример: ${num1} + ${num2} = ?`;
        if(captchaInput) captchaInput.value = "";
    };

    // --- ОБНОВЛЕНИЕ СЧЕТЧИКОВ В ШАПКЕ ---
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const updateCartIcon = () => {
        const counters = document.querySelectorAll('.cart-counter');
        if (counters.length === 0) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        let displayText = totalItems;
        if (totalItems > 9) displayText = '9+';
        counters.forEach(counter => {
            counter.textContent = displayText;
            counter.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    };
    updateCartIcon();

    // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК И АНИМАЦИИ ПОЛОСКИ ---
    const updateActiveLine = (activeTab) => {
        if (!activeLine || !activeTab) return;
        activeLine.style.width = `${activeTab.offsetWidth}px`;
        activeLine.style.left = `${activeTab.offsetLeft}px`;
    };

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', (e) => {
            e.preventDefault();
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authMessage.textContent = '';
            updateActiveLine(loginTab);
        });

        registerTab.addEventListener('click', (e) => {
            e.preventDefault();
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            authMessage.textContent = '';
            generateCaptcha();
            updateActiveLine(registerTab);
        });

        updateActiveLine(loginTab);
        generateCaptcha();
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    const showMessage = (text, isError = false) => {
        authMessage.textContent = text;
        authMessage.style.color = isError ? '#FF3B3B' : '#4CAF50';
    };

    const toggleButtonLoading = (button, isLoading) => {
        if (button) {
            button.classList.toggle('loading', isLoading);
            button.disabled = isLoading;
        }
    };

    // --- ОБРАБОТЧИКИ ФОРМ С FIREBASE ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = registerForm.querySelector('.auth-btn');
            toggleButtonLoading(submitButton, true);
    
            const nickname = document.getElementById('register-nickname').value.trim();
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;
            const captchaValue = parseInt(captchaInput.value);
    
            if (captchaValue !== captchaAnswer) {
                showMessage('Неверный ответ на капчу!', true);
                generateCaptcha();
                toggleButtonLoading(submitButton, false);
                return;
            }
    
            if (password !== passwordConfirm) {
                showMessage('Пароли не совпадают!', true);
                generateCaptcha();
                toggleButtonLoading(submitButton, false);
                return;
            }

            try {
                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('nickname', '==', nickname).get();

                if (!snapshot.empty) {
                    showMessage('Пользователь с таким ником уже существует!', true);
                    generateCaptcha();
                    toggleButtonLoading(submitButton, false);
                    return;
                }

                let role = 'Покупатель';
                if (nickname.toLowerCase() === 'egor201') {
                    role = 'Администратор';
                }
                
                await usersRef.add({
                    nickname: nickname,
                    password: password,
                    balance: 0,
                    role: role
                });

                showMessage('Вы успешно зарегистрированы! Теперь можете войти.', false);
                registerForm.reset();
                loginTab.click();
                toggleButtonLoading(submitButton, false);

            } catch (error) {
                console.error("Ошибка при регистрации:", error);
                showMessage('Ошибка связи с базой данных. Попробуйте позже.', true);
                toggleButtonLoading(submitButton, false);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('.auth-btn');
            toggleButtonLoading(submitButton, true);
            
            const nickname = document.getElementById('login-nickname').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('nickname', '==', nickname).limit(1).get();

                if (snapshot.empty) {
                    showMessage('Неверный никнейм или пароль!', true);
                    toggleButtonLoading(submitButton, false);
                    return;
                }
                
                const userDoc = snapshot.docs[0];
                let user = userDoc.data();
                user.id = userDoc.id; // Добавляем ID документа Firebase

                if (user.password === password) {
                    if (user.nickname.toLowerCase() === 'egor201') {
                        user.role = 'Администратор';
                    } else if (!user.role) {
                        user.role = 'Покупатель';
                    }
                    
                    const { password: _, ...userToSave } = user;
                    
                    showMessage('Вход выполнен успешно!', false);
                    sessionStorage.setItem('currentUser', JSON.stringify(userToSave));
                    
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 500);

                } else {
                    showMessage('Неверный никнейм или пароль!', true);
                    toggleButtonLoading(submitButton, false);
                }
            } catch (error) {
                console.error("Ошибка при входе:", error);
                showMessage('Ошибка связи с базой данных. Попробуйте позже.', true);
                toggleButtonLoading(submitButton, false);
            }
        });
    }
});