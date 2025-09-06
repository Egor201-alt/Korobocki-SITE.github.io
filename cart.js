document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ЭЛЕМЕНТЫ И ИНИЦИАЛИЗАЦИЯ ---
    const cartIcon = document.querySelector('.cart-icon');
    const cartCounter = document.querySelector('.cart-counter');
    const cartItemsList = document.getElementById('cart-items-list');
    
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    const saveCart = () => {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    };

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

    // --- ФУНКЦИИ ОТРИСОВКИ ---
    const renderCartItems = () => {
        if (!cartItemsList) return;
        cartItemsList.innerHTML = '';
        if (cart.length === 0) {
            cartItemsList.innerHTML = `<div class="cart-empty-message">Ваша корзина пуста. <br><a href="index.html">Вернуться к покупкам</a></div>`;
            return;
        }
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">${item.price} AP</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-action="decrease">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10">
                        <button class="quantity-btn" data-action="increase">+</button>
                    </div>
                    <button class="remove-item-btn"><i class="fas fa-trash"></i></button>
                </div>`;
            cartItemsList.appendChild(itemElement);
        });
    };

    const updateSummary = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let totalDiscount = 0;
    
        cart.forEach(item => {
            if (item.discount > 0) {
                const itemDiscount = Math.round(item.price * (item.discount / 100));
                totalDiscount += itemDiscount * item.quantity;
            }
        });
    
        const finalPrice = subtotal - totalDiscount;
        let commission = 0;
        let delivery = 0;

        if (cart.length > 0) {
            // Расчет комиссии остается прежним
            commission = Math.round(finalPrice * 0.03);
            if (commission < 2) commission = 2;

            // --- НОВАЯ ЛОГИКА РАСЧЕТА ДОСТАВКИ ---
            // 1. Компонент, зависящий от цены (например, 1% от общей стоимости)
            const priceComponent = subtotal * 0.01; 
        
            // 2. Компонент, зависящий от количества (например, 0.5 AP за каждый товар)
            const quantityComponent = totalItems * 0.5;
        
            // 3. Складываем компоненты и округляем
            let calculatedDelivery = Math.round(priceComponent + quantityComponent);
        
            // 4. Устанавливаем минимальную стоимость доставки
            const minimumDelivery = 5;
            delivery = Math.max(calculatedDelivery, minimumDelivery);
        }
    
        const total = finalPrice + commission + delivery;
    
        document.getElementById('total-items-count').textContent = totalItems;
        document.getElementById('subtotal-price').textContent = `${subtotal} AP`;
        document.getElementById('discount-amount').textContent = `-${totalDiscount} AP`;
        document.getElementById('commission-amount').textContent = `${commission} AP`;
        document.getElementById('delivery-amount').textContent = `${delivery} AP`;
        document.getElementById('total-price').textContent = `${total} AP`;
    };

    // --- ОБРАБОТЧИКИ СОБЫТИЙ В КОРЗИНЕ ---
    if (cartItemsList) {
        cartItemsList.addEventListener('input', (e) => {
            const target = e.target;
            if (!target.classList.contains('quantity-input')) return;
            const cartItemElement = target.closest('.cart-item');
            const id = cartItemElement.dataset.id;
            const itemInCart = cart.find(item => item.id === id);
            let newQuantity = parseInt(target.value);
            if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
            if (newQuantity > 10) newQuantity = 10;
            target.value = newQuantity;
            itemInCart.quantity = newQuantity;
            saveCart();
            updateSummary();
            updateCartIcon();
        });
    
        cartItemsList.addEventListener('click', (e) => {
            const target = e.target.closest('button'); if (!target) return;
            const cartItemElement = e.target.closest('.cart-item');
            const id = cartItemElement.dataset.id;
            const itemInCart = cart.find(item => item.id === id);
            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                if (action === 'increase' && itemInCart.quantity < 10) itemInCart.quantity++;
                else if (action === 'decrease' && itemInCart.quantity > 1) itemInCart.quantity--;
            }
            if (target.classList.contains('remove-item-btn')) {
                cart = cart.filter(item => item.id !== id);
            }
            saveCart();
            renderCartItems();
            updateSummary();
            updateCartIcon();
        });
    }
    
    // --- ЛОГИКА ПОИСКА И УВЕДОМЛЕНИЙ ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }
    const updateNotificationCounter = () => {
        const notificationCounter = document.querySelector('.notification-counter');
        if (!notificationCounter) return;
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser) {
            const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
            const userNotifications = allNotifications[currentUser.nickname] || [];
            const unreadCount = userNotifications.filter(n => !n.read).length;
            notificationCounter.textContent = unreadCount;
            notificationCounter.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    };
    window.addEventListener('storage', (event) => {
        if (event.key === 'notificationsUpdated') {
            updateNotificationCounter();
        }
    });

    // --- СИСТЕМА КАСТОМНЫХ УВЕДОМЛЕНИЙ ---
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    const showCustomAlert = (message) => {
        if (alertModal && alertMessage) {
            alertMessage.textContent = message;
            alertModal.classList.add('active');
        }
    };
    if (alertOkBtn) {
        alertOkBtn.addEventListener('click', () => {
            alertModal.classList.remove('active');
        });
    }
    if (alertModal) {
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                alertModal.classList.remove('active');
            }
        });
    }
    const addNotification = (nickname, type, message, subType = '') => {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        if (!allNotifications[nickname]) {
            allNotifications[nickname] = [];
        }
        const newNotification = {
            id: Date.now(), type, subType, message, timestamp: Date.now(), read: false
        };
        allNotifications[nickname].unshift(newNotification);
        localStorage.setItem('userNotifications', JSON.stringify(allNotifications));
        localStorage.setItem('notificationsUpdated', Date.now());
    };

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

    // --- ЛОГИКА КНОПКИ ОФОРМЛЕНИЯ ЗАКАЗА ---
    const checkoutButton = document.querySelector('.checkout-btn');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (checkoutButton) {
        checkoutButton.textContent = currentUser ? 'Оформить заказ' : 'Войти, и оформить заказ';

        checkoutButton.addEventListener('click', () => {
            if (cart.length === 0) {
                showCustomAlert("Ваша корзина пуста!");
                return;
            }
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }

            const totalCost = parseInt(document.getElementById('total-price').textContent);
            const userBalance = currentUser.balance;

            if (userBalance < totalCost) {
                showCustomAlert(`Недостаточно средств! У вас ${userBalance} AP, а требуется ${totalCost} AP.`);
                return;
            }

            const updatedUser = { ...currentUser, balance: userBalance - totalCost };
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.map(u => u.nickname === updatedUser.nickname ? updatedUser : u);
            localStorage.setItem('users', JSON.stringify(users));

            let globalOrderCounter = parseInt(localStorage.getItem('globalOrderCounter')) || 1000;
            globalOrderCounter++;
            localStorage.setItem('globalOrderCounter', globalOrderCounter);

            const allOrders = JSON.parse(localStorage.getItem('userOrders')) || {};
            if (!allOrders[currentUser.nickname]) { allOrders[currentUser.nickname] = []; }
            const newOrder = { id: `#${globalOrderCounter}`, status: 'processing', items: [...cart], timestamp: Date.now(), total: totalCost };
            allOrders[currentUser.nickname].unshift(newOrder);
            localStorage.setItem('userOrders', JSON.stringify(allOrders));
            
            addNotification(currentUser.nickname, 'order', `Ваш заказ ${newOrder.id} оформлен и готовится к сборке.`);
            
            localStorage.removeItem('shoppingCart');
            
            showCustomAlert('Заказ успешно оформлен!');
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        });
    }

    // --- ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
    updateCartIcon();
    renderCartItems();
    updateSummary();
    updateNotificationCounter();
});