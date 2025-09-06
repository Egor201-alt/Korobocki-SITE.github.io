document.addEventListener('DOMContentLoaded', () => {
    
    // --- БЛОК 1: ПРОВЕРКА АВТОРИЗАЦИИ ---
    const currentUserJSON = sessionStorage.getItem('currentUser');
    if (!currentUserJSON) {
        window.location.href = 'login.html';
        return;
    }
    const currentUser = JSON.parse(currentUserJSON);

    // --- БЛОК 2: ПОИСК ЭЛЕМЕНТОВ НА СТРАНИЦЕ ---
    const userAvatar = document.querySelector('.user-card .avatar');
    const nicknameSpan = document.querySelector('.user-card .nickname');
    const balanceValue = document.getElementById('balance-value');
    const logoutBtn = document.getElementById('logout-btn');
    const statusValue = document.getElementById('status-value');
    const statusCard = document.querySelector('.status-card');
    const adminPanelLink = document.getElementById('admin-panel-link');

    // --- БЛОК 3: ЗАПОЛНЕНИЕ СТРАНИЦЫ ДАННЫМИ ПОЛЬЗОВАТЕЛЯ ---
    nicknameSpan.textContent = currentUser.nickname;
    balanceValue.textContent = `${currentUser.balance} AP`;
    userAvatar.src = `https://visage.surgeplay.com/face/250/${currentUser.nickname}.png`;
    
    const userRole = currentUser.role || 'Покупатель';
    statusValue.textContent = userRole;
    
    if (statusCard) {
        statusCard.classList.remove('role-покупатель', 'role-продавец', 'role-администратор');
        statusCard.classList.add(`role-${userRole.toLowerCase().replace(' ', '-')}`);
    }
    
    if (currentUser.role === 'Администратор' && adminPanelLink) {
        adminPanelLink.style.display = 'flex';
    }

    // --- БЛОК 4: ЛОГИКА ВЫХОДА ИЗ АККАУНТА ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // --- БЛОК 5: ОБНОВЛЕНИЕ СЧЕТЧИКОВ В ШАПКЕ ---
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
    
    const updateNotificationCounter = () => {
        const notificationCounters = document.querySelectorAll('.notification-counter');
        if (notificationCounters.length === 0) return;
        let unreadCount = 0;
        if (currentUser) {
            const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
            const userNotifications = allNotifications[currentUser.nickname] || [];
            unreadCount = userNotifications.filter(n => !n.read).length;
        }
        notificationCounters.forEach(counter => {
            counter.textContent = unreadCount;
            counter.style.display = unreadCount > 0 ? 'flex' : 'none';
        });
    };
    updateNotificationCounter();
    
    window.addEventListener('storage', (event) => {
        if (event.key === 'notificationsUpdated') {
            updateNotificationCounter();
        }
        if (event.key === 'shoppingCart') {
            const updatedCart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            cart.length = 0;
            Array.prototype.push.apply(cart, updatedCart);
            updateCartIcon();
        }
    });

    // --- БЛОК 6: ЛОГИКА ПОИСКА (перенаправление) ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

   // --- БЛОК 7: ЛОГИКА МОДАЛЬНЫХ ОКОН ---
    const customAlert = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    const showCustomAlert = (message) => {
        if (customAlert && alertMessage) {
            alertMessage.textContent = message;
            customAlert.classList.add('active');
        }
    };
    if (alertOkBtn) {
        alertOkBtn.addEventListener('click', () => customAlert.classList.remove('active'));
    }
   
    const balanceModal = document.getElementById('balance-modal');
    const openBalanceBtn = document.getElementById('open-balance-modal-btn');
    const closeBalanceBtn = document.getElementById('close-balance-modal-btn');
    const modalRefillBtn = document.getElementById('modal-refill-btn');
    const modalWithdrawBtn = document.getElementById('modal-withdraw-btn');
    const modalBalanceValue = document.getElementById('modal-balance-value');
    const transactionsList = document.getElementById('transactions-list');

    const renderTransactions = () => {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        const userNotifications = allNotifications[currentUser.nickname] || [];
        const allOrders = JSON.parse(localStorage.getItem('userOrders')) || {};
        const userOrders = allOrders[currentUser.nickname] || [];
        let transactions = [];

        userNotifications.filter(n => n.type === 'balance').forEach(n => {
            const amount = parseInt(n.message.match(/-?\d+/)[0]);
            const desc = n.subType === 'credit' ? `Пополнение` : `Списание`;
            transactions.push({ type: n.subType, desc: desc, amount: Math.abs(amount), timestamp: n.timestamp });
        });

        userOrders.forEach(order => {
            transactions.push({ type: 'debit', desc: `Покупка (заказ ${order.id})`, amount: order.total, timestamp: order.timestamp });
        });
        
        transactions.sort((a, b) => b.timestamp - a.timestamp);

        transactionsList.innerHTML = '';
        if (transactions.length === 0) {
            transactionsList.innerHTML = `<p style="text-align: center; color: var(--light-text); padding: 20px 0;">История пуста</p>`;
            return;
        }

        transactions.forEach(t => {
            const date = new Date(t.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const sign = t.type === 'credit' ? '+' : '-';
            const icon = t.type === 'credit' ? 'fa-plus' : 'fa-minus';

            transactionsList.innerHTML += `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-info">
                        <div class="transaction-icon"><i class="fas ${icon}"></i></div>
                        <div class="transaction-details">
                            <div class="desc">${t.desc}</div>
                            <div class="date">${date}</div>
                        </div>
                    </div>
                    <div class="transaction-amount">${sign}${t.amount} AP</div>
                </div>
            `;
        });
    };

    if (openBalanceBtn) {
        openBalanceBtn.addEventListener('click', () => {
            modalBalanceValue.textContent = `${currentUser.balance} AP`;
            renderTransactions();
            balanceModal.classList.add('active');
        });
    }

    if(closeBalanceBtn) closeBalanceBtn.addEventListener('click', () => balanceModal.classList.remove('active'));
    if(balanceModal) balanceModal.addEventListener('click', (e) => { if(e.target === balanceModal) balanceModal.classList.remove('active') });

    if (modalRefillBtn) {
        modalRefillBtn.addEventListener('click', () => {
            balanceModal.classList.remove('active');
            setTimeout(() => {
                showCustomAlert('На данный момент пополнение с банка недоступно. Обратитесь к администратору сайта.');
            }, 300);
        });
    }

    if (modalWithdrawBtn) {
        modalWithdrawBtn.addEventListener('click', () => {
            balanceModal.classList.remove('active');
            setTimeout(() => {
                showCustomAlert('Вывод средств временно недоступен. Обратитесь к администратору сайта.');
            }, 300);
        });
    }
});