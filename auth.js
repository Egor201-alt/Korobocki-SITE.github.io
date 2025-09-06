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
    
    // Элементы капчи
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
    const updateCartIcon = (shouldAnimate) => {
        const counters = document.querySelectorAll('.cart-counter');
        if (counters.length === 0) return;

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
        let displayText = totalItems;
        if (totalItems > 9) {
            displayText = '9+';
        }
    
        counters.forEach(counter => {
            counter.textContent = displayText;
            counter.style.display = totalItems > 0 ? 'flex' : 'none';
        });

        if (shouldAnimate) {
            const icons = document.querySelectorAll('.cart-icon');
            icons.forEach(icon => {
                icon.classList.remove('cart-bounce');
                void icon.offsetWidth;
                icon.classList.add('cart-bounce');
            });
        }
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

    // --- ОБРАБОТЧИКИ ФОРМ ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = registerForm.querySelector('.auth-btn');
            toggleButtonLoading(submitButton, true);
    
            await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const existingUser = users.find(user => user.nickname.toLowerCase() === nickname.toLowerCase());
    
            if (existingUser) {
                showMessage('Пользователь с таким ником уже существует!', true);
                generateCaptcha();
                toggleButtonLoading(submitButton, false);
                return;
            }
    
            let role = 'Покупатель';
            // ПРИ РЕГИСТРАЦИИ ДАЕМ АДМИНКУ
            if (nickname.toLowerCase() === 'egor201') {
                role = 'Администратор';
            }
            
            users.push({ nickname, password, balance: 0, role: role });
            localStorage.setItem('users', JSON.stringify(users));

            showMessage('Вы успешно зарегистрированы! Теперь можете войти.', false);
            registerForm.reset();
            loginTab.click();
            toggleButtonLoading(submitButton, false);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('.auth-btn');
            toggleButtonLoading(submitButton, true);
    
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const nickname = document.getElementById('login-nickname').value.trim();
            const password = document.getElementById('login-password').value;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());
    
            if (user && user.password === password) {
                // ПРИ ВХОДЕ ПРОВЕРЯЕМ И ПРИ НЕОБХОДИМОСТИ ВОССТАНАВЛИВАЕМ АДМИНКУ
                if (user.nickname.toLowerCase() === 'egor201') {
                    user.role = 'Администратор';
                } 
                // Если у старого пользователя нет роли, даем "Покупатель"
                else if (!user.role) {
                    user.role = 'Покупатель';
                }
                
                // Обновляем данные в основной "базе", чтобы сохранить изменения роли
                const userInDb = users.find(u => u.nickname === user.nickname);
                if(userInDb) userInDb.role = user.role;
                localStorage.setItem('users', JSON.stringify(users));
                
                showMessage('Вход выполнен успешно!', false);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'profile.html';
            } else {
                showMessage('Неверный никнейм или пароль!', true);
                toggleButtonLoading(submitButton, false);
            }
        });
    }
});