document.addEventListener('DOMContentLoaded', () => {
    
    // --- НАСТРОЙКИ "БАЗЫ ДАННЫХ" ---
    const API_KEY = '$2a$10$GqsWKT8niEUqQgRma/vHUu5fRiSmSa3t.Bk1whMP.1R3wbSFNqUu.';
    const BIN_ID = '68bc2f89ae596e708fe4ad5b';
    const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

    // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК ---
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
    
    /** Загружает данные из JSONBin */
    const getDb = async () => {
        try {
            const response = await fetch(`${BIN_URL}/latest`, { 
                headers: { 'X-Master-Key': API_KEY } 
            });
            if (!response.ok) {
                showMessage('Ошибка загрузки данных. Попробуйте позже.', true);
                console.error("Failed to fetch DB:", response.statusText);
                return null;
            }
            return response.json();
        } catch (error) {
            showMessage('Сетевая ошибка. Проверьте подключение.', true);
            console.error("Network error:", error);
            return null;
        }
    };
    
    /** Обновляет данные в JSONBin */
    const updateDb = async (data) => {
        try {
            return await fetch(BIN_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
                body: JSON.stringify(data)
            });
        } catch (error) {
            showMessage('Сетевая ошибка. Не удалось сохранить данные.', true);
            console.error("Network error on update:", error);
            return null;
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
            
            const dbData = await getDb();
            if (!dbData) { toggleButtonLoading(submitButton, false); return; }
            
            const users = dbData.record.users || [];
            const existingUser = users.find(user => user.nickname.toLowerCase() === nickname.toLowerCase());
    
            if (existingUser) {
                showMessage('Пользователь с таким ником уже существует!', true);
                generateCaptcha();
                toggleButtonLoading(submitButton, false);
                return;
            }
    
            let role = 'Покупатель';
            if (nickname.toLowerCase() === 'egor201') {
                role = 'Администратор';
            }
            
            users.push({ nickname, password, balance: 0, role: role });
            const response = await updateDb({ ...dbData.record, users });

            if(response && response.ok) {
                showMessage('Вы успешно зарегистрированы! Теперь можете войти.', false);
                registerForm.reset();
                loginTab.click();
            } else {
                showMessage('Ошибка регистрации. Попробуйте позже.', true);
            }
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
            
            const dbData = await getDb();
            if (!dbData) { toggleButtonLoading(submitButton, false); return; }

            const users = dbData.record.users || [];
            let user = users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());
    
            if (user && user.password === password) {
                if (user.nickname.toLowerCase() === 'egor201') { user.role = 'Администратор'; } 
                else if (!user.role) { user.role = 'Покупатель'; }
                
                const { password: _, ...userToSave } = user;
                
                showMessage('Вход выполнен успешно!', false);
                sessionStorage.setItem('currentUser', JSON.stringify(userToSave));
                window.location.href = 'profile.html';
            } else {
                showMessage('Неверный никнейм или пароль!', true);
                toggleButtonLoading(submitButton, false);
            }
        });
    }
});