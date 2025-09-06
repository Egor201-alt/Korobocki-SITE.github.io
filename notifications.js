document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ПРОВЕРКА АВТОРИЗАЦИИ ---
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- 2. ПОИСК ЭЛЕМЕНТОВ ---
    const notificationsList = document.getElementById('notifications-list');
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationCounter = document.querySelector('.notification-counter');
    const cartCounter = document.querySelector('.cart-counter');

    // --- 3. ФУНКЦИИ ---
    
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

    const getUserNotifications = () => {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        return allNotifications[currentUser.nickname] || [];
    };

    const getIconForType = (type) => {
        switch(type) {
            case 'balance': return 'fa-wallet';
            case 'role_change': return 'fa-user-shield';
            case 'order': return 'fa-box-open';
            default: return 'fa-info-circle';
        }
    };

    const renderNotifications = () => {
        const userNotifications = getUserNotifications();
        if (userNotifications.length === 0) {
            notificationsList.innerHTML = `<p class="empty-message">У вас пока нет уведомлений</p>`;
            return;
        }

        notificationsList.innerHTML = '';
        userNotifications.sort((a, b) => b.timestamp - a.timestamp);

        userNotifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = `notification-item type-${notif.type} ${notif.subType ? `type-${notif.subType}` : ''} ${!notif.read ? 'unread' : ''}`;
            
            const date = new Date(notif.timestamp).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            item.innerHTML = `
                <div class="notification-icon-container"><i class="fas ${getIconForType(notif.type)}"></i></div>
                <div class="notification-content">
                    <p>${notif.message}</p>
                    <span class="notification-date">${date}</span>
                </div>
            `;
            notificationsList.appendChild(item);
        });
    };

    const markAllAsRead = () => {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        let userNotifications = allNotifications[currentUser.nickname] || [];
        userNotifications.forEach(notif => notif.read = true);
        allNotifications[currentUser.nickname] = userNotifications;
        localStorage.setItem('userNotifications', JSON.stringify(allNotifications));
        localStorage.setItem('notificationsUpdated', Date.now());
    };

    const updateHeaderCounters = (animateIcon = false) => {
        const userNotifications = getUserNotifications();
        const unreadCount = userNotifications.filter(n => !n.read).length;
        
        if (notificationCounter) {
            notificationCounter.textContent = unreadCount;
            notificationCounter.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        if (animateIcon && unreadCount > 0 && notificationIcon) {
            notificationIcon.classList.remove('notification-bounce');
            void notificationIcon.offsetWidth;
            notificationIcon.classList.add('notification-bounce');
        }

        if (cartCounter) {
            const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCounter.textContent = totalItems;
            cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    };

    // --- 4. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ ---
    window.addEventListener('storage', (event) => {
        if (event.key === 'notificationsUpdated') {
            renderNotifications();
            updateHeaderCounters(true); 
        }
    });
    
    // --- 5. ЛОГИКА ПОИСКА (перенаправление) ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // --- ОБНОВЛЕНИЕ ВИДА ШАПКИ ---
    const updateHeaderAuthState = () => {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const guestIcons = document.getElementById('guest-icons');
        const userProfileHeader = document.getElementById('user-profile-header');

        if (currentUser && guestIcons && userProfileHeader) {
            guestIcons.style.display = 'none';
            userProfileHeader.style.display = 'flex';
            document.querySelector('#user-profile-header .header-avatar').src = `https://visage.surgeplay.com/face/32/${currentUser.nickname}.png`;
            document.querySelector('#user-profile-header .header-nickname').textContent = currentUser.nickname;
            document.getElementById('header-balance-value').textContent = `${currentUser.balance} AP`;
        } else if (guestIcons && userProfileHeader) {
            guestIcons.style.display = 'flex';
            userProfileHeader.style.display = 'none';
        }
    };
    updateHeaderAuthState();

    // --- 6. ПЕРВЫЙ ЗАПУСК ---
    updateHeaderCounters(false);
    renderNotifications();
    markAllAsRead();
    setTimeout(() => updateHeaderCounters(false), 100);
});