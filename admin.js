document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА ---
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'Администратор') {
        window.location.href = 'index.html';
        return;
    }

    // --- 2. ЛОГИКА ДЛЯ ШАПКИ ---
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
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        const userNotifications = allNotifications[currentUser.nickname] || [];
        const unreadCount = userNotifications.filter(n => !n.read).length;
        notificationCounter.textContent = unreadCount;
        notificationCounter.style.display = unreadCount > 0 ? 'flex' : 'none';
    };
    updateNotificationCounter();

    window.addEventListener('storage', (event) => {
        if (event.key === 'notificationsUpdated') {
            updateNotificationCounter();
        }
    });

    // --- 3. УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---
    const usersTableBody = document.getElementById('users-table-body');
    const userSearchInput = document.getElementById('user-search-input');
    const userModal = document.getElementById('edit-user-modal');
    const closeUserModalBtn = document.getElementById('close-edit-modal-btn');
    const editUserForm = document.getElementById('edit-user-form');
    const editingAvatar = document.getElementById('editing-avatar');
    const editingNickname = document.getElementById('editing-nickname');
    const editRole = document.getElementById('edit-role');
    const editBalance = document.getElementById('edit-balance');

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let userToEdit = null;
    
    // --- 4. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ СОЗДАНИЯ УВЕДОМЛЕНИЙ ---
    const addNotification = (nickname, type, message, subType = '') => {
        const allNotifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        if (!allNotifications[nickname]) { allNotifications[nickname] = []; }
        const newNotification = { id: Date.now(), type, subType, message, timestamp: Date.now(), read: false };
        allNotifications[nickname].unshift(newNotification);
        localStorage.setItem('userNotifications', JSON.stringify(allNotifications));
        localStorage.setItem('notificationsUpdated', Date.now());

        // Создаем триггер для Push-уведомления
        const pushData = { nickname, message };
        localStorage.setItem('showPushNotification', JSON.stringify(pushData));
        localStorage.removeItem('showPushNotification');
    };

    // --- 5. ФУНКЦИИ И ОБРАБОТЧИКИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ---
    const renderUsers = (filterTerm = '') => {
        usersTableBody.innerHTML = '';
        const filteredUsers = users.filter(user => user.nickname.toLowerCase().includes(filterTerm.toLowerCase()));
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.nickname}</td>
                <td>${user.role || 'Покупатель'}</td>
                <td>${user.balance}</td>
                <td><button class="edit-btn" data-nickname="${user.nickname}"><i class="fas fa-pencil-alt"></i></button></td>
            `;
            usersTableBody.appendChild(row);
        });
    };

    const openUserModal = (nickname) => {
        userToEdit = users.find(u => u.nickname === nickname);
        if (userToEdit) {
            editingNickname.textContent = `Редактирование: ${userToEdit.nickname}`;
            editingAvatar.src = `https://visage.surgeplay.com/face/48/${userToEdit.nickname}.png`;
            editRole.value = userToEdit.role || 'Покупатель';
            editBalance.value = userToEdit.balance;
            userModal.classList.add('active');
        }
    };
    const closeUserModal = () => { userModal.classList.remove('active'); userToEdit = null; };
    usersTableBody.addEventListener('click', (e) => { const btn = e.target.closest('.edit-btn'); if (btn && btn.dataset.nickname) { openUserModal(btn.dataset.nickname); } });
    closeUserModalBtn.addEventListener('click', closeUserModal);
    userModal.addEventListener('click', (e) => { if (e.target === userModal) closeUserModal(); });
    editUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (userToEdit) {
            const oldRole = userToEdit.role || 'Покупатель';
            const oldBalance = userToEdit.balance;
            const newRole = editRole.value;
            const newBalance = parseInt(editBalance.value) || 0;
            if (oldRole !== newRole) { addNotification(userToEdit.nickname, 'role_change', `Ваша роль была изменена на "${newRole}".`); }
            if (oldBalance !== newBalance) {
                const diff = newBalance - oldBalance;
                if (diff > 0) { addNotification(userToEdit.nickname, 'balance', `Ваш баланс пополнен на ${diff} AP.`, 'credit'); } 
                else if (diff < 0) { addNotification(userToEdit.nickname, 'balance', `С вашего баланса было списано ${Math.abs(diff)} AP.`, 'debit'); }
            }
            userToEdit.role = newRole;
            userToEdit.balance = newBalance;
            users = users.map(u => u.nickname === userToEdit.nickname ? userToEdit : u);
            localStorage.setItem('users', JSON.stringify(users));
            if (currentUser.nickname === userToEdit.nickname) { sessionStorage.setItem('currentUser', JSON.stringify(userToEdit)); }
            closeUserModal();
            renderUsers(userSearchInput.value);
        }
    });
    userSearchInput.addEventListener('input', () => { renderUsers(userSearchInput.value); });
    renderUsers();

    // --- 6. УПРАВЛЕНИЕ ЗАКАЗАМИ ---
    const ordersTableBody = document.getElementById('orders-table-body');
    const orderModal = document.getElementById('edit-order-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal-btn');
    const editOrderForm = document.getElementById('edit-order-form');
    const editingOrderId = document.getElementById('editing-order-id');
    const editOrderStatus = document.getElementById('edit-order-status');

    let allOrders = JSON.parse(localStorage.getItem('userOrders')) || {};
    let orderToEdit = null;

    const renderAllOrders = () => {
        ordersTableBody.innerHTML = '';
        for (const nickname in allOrders) {
            allOrders[nickname].forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${nickname}</td>
                    <td>${order.status}</td>
                    <td>${order.total} AP</td>
                    <td><button class="edit-btn" data-order-id="${order.id}" data-owner-nickname="${nickname}"><i class="fas fa-pencil-alt"></i></button></td>
                `;
                ordersTableBody.appendChild(row);
            });
        }
    };

    const openOrderModal = (orderId, ownerNickname) => {
        const userOrders = allOrders[ownerNickname] || [];
        const foundOrder = userOrders.find(o => o.id === orderId);
        if (foundOrder) {
            orderToEdit = { ownerNickname: ownerNickname, order: foundOrder };
            editingOrderId.textContent = `Заказ ${orderToEdit.order.id} (пользователь ${ownerNickname})`;
            editOrderStatus.value = orderToEdit.order.status;
            orderModal.classList.add('active');
        }
    };
    const closeOrderModal = () => { orderModal.classList.remove('active'); orderToEdit = null; };
    ordersTableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        if (editButton && editButton.dataset.orderId) { openOrderModal(editButton.dataset.orderId, editButton.dataset.ownerNickname); }
    });
    closeOrderModalBtn.addEventListener('click', closeOrderModal);
    orderModal.addEventListener('click', (e) => { if (e.target === orderModal) closeOrderModal(); });

    editOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (orderToEdit) {
            const oldStatus = orderToEdit.order.status;
            const newStatus = editOrderStatus.value;
            const owner = orderToEdit.ownerNickname;
            
            if (oldStatus !== newStatus) {
                let message = '';
                if (newStatus === 'shipping') { message = `Заказ ${orderToEdit.order.id} передан в доставку.`; }
                else if (newStatus === 'delivered') { message = `Заказ ${orderToEdit.order.id} доставлен и ожидает получения.`; }
                else if (newStatus === 'received') { message = `Вы получили заказ ${orderToEdit.order.id}. Спасибо за покупку!`; }
                if (message) { addNotification(owner, 'order', message); }
            }
            
            orderToEdit.order.status = newStatus;
            
            allOrders[owner] = allOrders[owner].map(o => o.id === orderToEdit.order.id ? orderToEdit.order : o);
            localStorage.setItem('userOrders', JSON.stringify(allOrders));
            
            closeOrderModal();
            renderAllOrders();
        }
    });
    renderAllOrders();
});