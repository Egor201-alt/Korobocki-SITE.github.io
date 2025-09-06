document.addEventListener('DOMContentLoaded', () => {
    
    // --- БЛОК 1: ПРОВЕРКА АВТОРИЗАЦИИ ---
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        const main = document.querySelector('.orders-page');
        if (main) {
            main.innerHTML = `
                <h1>Мои заказы</h1>
                <div class="auth-required-message">
                    <p>Чтобы просматривать заказы, необходимо войти в аккаунт.</p>
                    <a href="login.html" class="auth-btn">Войти</a>
                </div>
            `;
        }
        return;
    }

    // --- БЛОК 2: ОБНОВЛЕНИЕ СЧЕТЧИКОВ В ШАПКЕ ---
    function updateCounters() {
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCounter.textContent = totalItems;
            cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        const notificationCounter = document.querySelector('.notification-counter');
        if (notificationCounter && currentUser) {
            const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
            const userNotifications = allNotifications[currentUser.nickname] || [];
            const unreadCount = userNotifications.filter(n => !n.read).length;
            notificationCounter.textContent = unreadCount;
            notificationCounter.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }
    updateCounters();
    window.addEventListener('storage', updateCounters);

    // --- БЛОК 3: ПОЛНОЦЕННАЯ ЛОГИКА ОТОБРАЖЕНИЯ ЗАКАЗОВ ---
    const ordersList = document.getElementById('orders-list');
    const allOrders = JSON.parse(localStorage.getItem('userOrders')) || {};
    const userOrders = allOrders[currentUser.nickname] || [];

    if (userOrders.length === 0) {
        ordersList.innerHTML = `<p class="empty-message">У вас пока нет заказов</p>`;
    } else {
        ordersList.innerHTML = '';
        userOrders.forEach(order => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.dataset.status = order.status;
            itemElement.dataset.orderId = order.id;

            // Логика превью товаров
            const uniqueItems = [];
            order.items.forEach(itemInOrder => {
                if (!uniqueItems.find(unique => unique.id === itemInOrder.id)) {
                    uniqueItems.push(itemInOrder);
                }
            });
            const itemsToShow = uniqueItems.slice(0, 3);
            const remainingItemsCount = uniqueItems.length - itemsToShow.length;
            let previewImagesHTML = '';
            itemsToShow.forEach(item => {
                previewImagesHTML += `<img src="${item.image}" alt="${item.name}">`;
            });
            if (remainingItemsCount > 0) {
                previewImagesHTML += `<div class="more-items-indicator">+${remainingItemsCount}</div>`;
            }

            itemElement.innerHTML = `
                <div class="order-info">
                    <h2>Заказ <span class="order-id-highlight">${order.id}</span></h2>
                    <div class="order-timeline">
                        <div class="timeline-line"><div class="timeline-line-progress"></div></div>
                        <div class="timeline-step"><div class="timeline-dot"></div><div class="timeline-label">Сбор заказа</div></div>
                        <div class="timeline-step"><div class="timeline-dot"></div><div class="timeline-label">Доставка</div></div>
                        <div class="timeline-step"><div class="timeline-dot"></div><div class="timeline-label">Ожидает получения</div></div>
                        <div class="timeline-step"><div class="timeline-dot"></div><div class="timeline-label">Получено</div></div>
                    </div>
                </div>
                <div class="order-preview">
                    <div class="preview-images">${previewImagesHTML}</div>
                    <a href="#" class="order-details-link">Подробнее</a>
                </div>
            `;
            ordersList.appendChild(itemElement);
        });

        // Применяем классы для таймлайна после отрисовки
        document.querySelectorAll('.order-item').forEach(orderElement => {
            const status = orderElement.dataset.status;
            const steps = orderElement.querySelectorAll('.timeline-step');
            const statusMap = ['processing', 'shipping', 'delivered', 'received'];
            const currentStatusIndex = statusMap.indexOf(status);
            if (currentStatusIndex !== -1) {
                steps.forEach((step, index) => {
                    if (index < currentStatusIndex) step.classList.add('completed');
                    else if (index === currentStatusIndex) step.classList.add('active');
                });
            }
        });
    }

    // --- БЛОК 4: ЛОГИКА МОДАЛЬНОГО ОКНА "ПОДРОБНЕЕ" ---
    const detailsModal = document.getElementById('order-details-modal');
    const closeDetailsBtn = document.getElementById('close-order-details-btn');
    const modalOrderId = document.getElementById('modal-order-id');
    const modalOrderItems = document.getElementById('modal-order-items');
    const modalTotalItems = document.getElementById('modal-total-items');
    const modalSubtotal = document.getElementById('modal-subtotal');
    const modalDiscountLine = document.getElementById('modal-discount-line');
    const modalDiscount = document.getElementById('modal-discount');
    const modalCommission = document.getElementById('modal-commission');
    const modalDelivery = document.getElementById('modal-delivery');
    const modalTotal = document.getElementById('modal-total');

    if (ordersList && detailsModal && closeDetailsBtn) {
        ordersList.addEventListener('click', (e) => {
            if (e.target.classList.contains('order-details-link')) {
                e.preventDefault();
                const orderItem = e.target.closest('.order-item');
                const orderId = orderItem.dataset.orderId;
                const orderData = userOrders.find(o => o.id === orderId);

                if (orderData) {
                    modalOrderId.innerHTML = `Детали заказа <span class="order-id-highlight">${orderData.id}</span>`;
                    
                    modalOrderItems.innerHTML = '';
                    orderData.items.forEach(item => {
                        modalOrderItems.innerHTML += `
                            <div class="order-detail-item">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="item-info">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">${item.quantity} шт.</span>
                                </div>
                            </div>
                        `;
                    });

                    const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
                    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    let totalDiscount = 0;
                    orderData.items.forEach(item => {
                        if (item.discount > 0) {
                            totalDiscount += Math.round(item.price * (item.discount / 100)) * item.quantity;
                        }
                    });
                    
                    const finalPrice = subtotal - totalDiscount;
                    const commission = Math.max(2, Math.round(finalPrice * 0.03));
                    let delivery = 0;
                    if (totalItems <= 3) delivery = 5;
                    else if (totalItems <= 7) delivery = 8;
                    else delivery = 10;
                    
                    const total = orderData.total; 
                    
                    modalTotalItems.textContent = totalItems;
                    modalSubtotal.textContent = `${subtotal} AP`;
                    modalCommission.textContent = `${commission} AP`;
                    modalDelivery.textContent = `${delivery} AP`;
                    modalTotal.textContent = `${total} AP`;
                    
                    if (totalDiscount > 0) {
                        modalDiscount.textContent = `-${totalDiscount} AP`;
                        modalDiscountLine.style.display = 'flex';
                    } else {
                        modalDiscountLine.style.display = 'none';
                    }
                    
                    detailsModal.classList.add('active');
                }
            }
        });

        closeDetailsBtn.addEventListener('click', () => {
            detailsModal.classList.remove('active');
        });

        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.classList.remove('active');
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

    // --- БЛОК 5: ЛОГИКА ПОИСКА (перенаправление) ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }
});