document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ЭЛЕМЕНТЫ И ИНИЦИАЛИЗАЦИЯ ---
    const cartIcon = document.querySelector('.cart-icon');
    const cartCounter = document.querySelector('.cart-counter');
    const productGrid = document.querySelector('.product-grid');
    
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ КОРЗИНЫ ---
    const saveCart = () => { localStorage.setItem('shoppingCart', JSON.stringify(cart)); };

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
    
    const triggerFlyAnimation = (button) => {
        const flyIcon = document.createElement('div');
        flyIcon.classList.add('fly-to-cart-icon');
        document.body.appendChild(flyIcon);
        const buttonRect = button.getBoundingClientRect();
    
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        const guestIcons = document.getElementById('guest-icons');
        const userProfileHeader = document.getElementById('user-profile-header');

        // 1. Определяем, какой из блоков сейчас виден
        const visibleContainer = window.getComputedStyle(guestIcons).display !== 'none' 
            ? guestIcons 
            : userProfileHeader;

        // 2. Ищем иконку ТОЛЬКО внутри видимого блока
        const visibleCartIcon = visibleContainer.querySelector('.cart-icon');
        if (!visibleCartIcon) return; // Если иконка не найдена, выходим

        const cartRect = visibleCartIcon.getBoundingClientRect();
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        const startX = buttonRect.left + buttonRect.width / 2;
        const startY = buttonRect.top + buttonRect.height / 2;
        flyIcon.style.left = `${startX}px`;
        flyIcon.style.top = `${startY}px`;
    
        requestAnimationFrame(() => {
            const endX = cartRect.left + cartRect.width / 2;
            const endY = cartRect.top + cartRect.height / 2;
            flyIcon.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.3)`;
            flyIcon.style.opacity = '0';
        });

        flyIcon.addEventListener('transitionend', () => {
            flyIcon.remove();
            updateCartIcon(true);
        });
    };

    const updateCardState = (cardElement) => {
        if (!cardElement) return;
        const id = cardElement.dataset.id;
        const itemInCart = cart.find(item => item.id === id);
        const increaseBtn = cardElement.querySelector('.quantity-btn-card[data-action="increase"]');
        if (itemInCart) {
            cardElement.classList.add('is-in-cart');
            cardElement.querySelector('.quantity-display-card').textContent = itemInCart.quantity;
            if(increaseBtn) increaseBtn.disabled = itemInCart.quantity >= 10;
        } else {
            cardElement.classList.remove('is-in-cart');
            if(increaseBtn) increaseBtn.disabled = false;
        }
    };
    
    // --- ОБРАБОТЧИК ДЛЯ КАРТОЧЕК ТОВАРОВ ---
    if (productGrid) {
        productGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            const id = card.dataset.id;
            let itemInCart = cart.find(item => item.id === id);
            let isNewItemAdded = false;

            if (e.target.classList.contains('add-to-cart-btn')) {
                if (!itemInCart) {
                    const name = card.dataset.name;
                    const price = parseInt(card.dataset.price);
                    const discount = parseInt(card.dataset.discount) || 0;
                    const image = card.dataset.image;
                    cart.push({ id, name, price, quantity: 1, discount, image });
                    isNewItemAdded = true;
                }
            }
            if (e.target.classList.contains('quantity-btn-card')) {
                const action = e.target.dataset.action;
                if (action === 'increase' && itemInCart.quantity < 10) {
                    itemInCart.quantity++;
                    isNewItemAdded = true;
                } else if (action === 'decrease') {
                    itemInCart.quantity--;
                    if (itemInCart.quantity <= 0) {
                        cart = cart.filter(item => item.id !== id);
                    }
                }
            }
            if (isNewItemAdded) {
                triggerFlyAnimation(e.target);
            } else {
                updateCartIcon(false);
            }
            saveCart();
            updateCardState(card);
        });
    }
    
    // --- ЛОГИКА ПОИСКА ---
    const searchInput = document.getElementById('search-input');
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('search-suggestions');
    const searchResultsTitle = document.getElementById('search-results-title');
    const searchHistoryContainer = document.getElementById('search-history');
    const popularSearchesContainer = document.getElementById('popular-searches');
    const allCards = document.querySelectorAll('.product-card');

    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const popularSearches = ['элитры', 'незеритовая броня', 'починка', 'тотем'];

    const renderSearchHistory = () => {
        if (!searchHistoryContainer) return;
        const section = searchHistoryContainer.closest('.suggestions-section');
        if (!section) return;
        if (searchHistory.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';
        searchHistoryContainer.innerHTML = '';
        searchHistory.forEach(term => {
            const item = document.createElement('div');
            item.className = 'suggestion-item history-item';
            item.innerHTML = `<div class="history-term"><i class="fas fa-history"></i><span>${term}</span></div><i class="fas fa-times delete-history"></i>`;
            searchHistoryContainer.appendChild(item);
        });
    };

    const renderPopularSearches = () => {
        if (!popularSearchesContainer) return;
        popularSearchesContainer.innerHTML = '';
        popularSearches.forEach(term => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `<i class="fas fa-search"></i><span>${term}</span>`;
            popularSearchesContainer.appendChild(item);
        });
    };
    
    const saveSearchTerm = (term) => {
        if (!term || term.trim() === '') return;
        term = term.trim().toLowerCase();
        searchHistory = searchHistory.filter(t => t !== term);
        searchHistory.unshift(term);
        if (searchHistory.length > 5) searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    };
    
    const performSearch = (term) => {
        const searchTerm = term.trim().toLowerCase();
        let count = 0;
        
        allCards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            const isVisible = name.includes(searchTerm);
            card.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) count++;
        });
        
        if (searchResultsTitle) {
            if (searchTerm) {
                searchResultsTitle.innerHTML = `Результаты по запросу: <span>“${term}”</span> (${count} результата)`;
                searchResultsTitle.style.display = 'block';
            } else {
                searchResultsTitle.style.display = 'none';
            }
        }
    };
    
    const updateURLWithSearchTerm = (term) => {
        const url = new URL(window.location);
        const searchTerm = term.trim();
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        history.pushState({}, '', url);
    };

    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (searchSuggestions) searchSuggestions.classList.add('active');
            if (searchBar) searchBar.classList.add('active');
            renderSearchHistory();
            renderPopularSearches();
        });
    
        searchInput.addEventListener('input', () => {
            performSearch(searchInput.value);
            updateURLWithSearchTerm(searchInput.value); 
        });
    
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const term = searchInput.value;
                saveSearchTerm(term);
                updateURLWithSearchTerm(term);
                if (searchSuggestions) searchSuggestions.classList.remove('active');
                if (searchBar) searchBar.classList.remove('active');
                searchInput.blur();
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            if (searchSuggestions) searchSuggestions.classList.remove('active');
            if (searchBar) searchBar.classList.remove('active');
        }
    });
    
    if (searchSuggestions) {
        searchSuggestions.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-history')) {
                e.stopPropagation(); 
                const termToDelete = e.target.closest('.history-item').querySelector('.history-term span').textContent;
                searchHistory = searchHistory.filter(t => t !== termToDelete);
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                renderSearchHistory();
                return; 
            }
    
            const suggestion = e.target.closest('.suggestion-item');
            if (suggestion) {
                const term = suggestion.querySelector('span').textContent;
                performSearch(term);
                saveSearchTerm(term);
                updateURLWithSearchTerm(term);
                if (searchInput) searchInput.value = term;
                searchSuggestions.classList.remove('active');
                searchBar.classList.remove('active');
            }
        });
    }
    
    // --- ФУНКЦИИ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
    const renderProductsWithDiscounts = () => {
        const allCards = document.querySelectorAll('.product-card');
        allCards.forEach(card => {
            const price = parseInt(card.dataset.price);
            const discount = parseInt(card.dataset.discount) || 0;
            if (discount > 0) {
                const newPrice = Math.round(price * (1 - discount / 100));
                const priceContainer = card.querySelector('.price-container');
                priceContainer.innerHTML = `<span class="price">${newPrice} AP</span><span class="original-price">${price} AP</span>`;
                const saleBadge = document.createElement('div');
                saleBadge.className = 'sale-badge';
                saleBadge.textContent = `-${discount}%`;
                card.prepend(saleBadge);
            }
        });
    };
    
    const initialRenderCardStates = () => {
        const allCards = document.querySelectorAll('.product-card');
        allCards.forEach(card => updateCardState(card));
    };

    renderProductsWithDiscounts();
    updateCartIcon(false);
    initialRenderCardStates();

    const urlParams = new URLSearchParams(window.location.search);
    const searchTermFromURL = urlParams.get('search');
    if (searchTermFromURL) {
        performSearch(searchTermFromURL);
        if (searchInput) searchInput.value = searchTermFromURL;
    }

    // --- ЛОГИКА ФИЛЬТРОВ И СОРТИРОВКИ ---
    const allProductCardsOriginal = Array.from(productGrid.querySelectorAll('.product-card'));
    const categoryBtn = document.getElementById('category-btn');
    const categoryDropdown = document.getElementById('category-dropdown');
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');

    if (categoryBtn && sortBtn) {
        const toggleDropdown = (button, dropdown) => {
            dropdown.classList.toggle('active');
            button.classList.toggle('active');
        };
        
        categoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(categoryBtn, categoryDropdown);
            sortDropdown.classList.remove('active');
            sortBtn.classList.remove('active');
        });
    
        sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(sortBtn, sortDropdown);
            categoryDropdown.classList.remove('active');
            categoryBtn.classList.remove('active');
        });
        
        window.addEventListener('click', () => {
            if (categoryDropdown) categoryDropdown.classList.remove('active');
            if (categoryBtn) categoryBtn.classList.remove('active');
            if (sortDropdown) sortDropdown.classList.remove('active');
            if (sortBtn) sortBtn.classList.remove('active');
        });
    
        categoryDropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('a'); if (!target) return;
            const selectedCategory = target.dataset.category;
            categoryBtn.querySelector('.filter-text').textContent = target.textContent;
            allProductCardsOriginal.forEach(card => {
                card.style.display = (selectedCategory === 'all' || card.dataset.category === selectedCategory) ? 'flex' : 'none';
            });
        });
    
        sortDropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('a'); if (!target) return;
            const sortBy = target.dataset.sort;
            sortBtn.querySelector('.filter-text').textContent = target.textContent;
            let sortedCards = [...allProductCardsOriginal];
            if (sortBy === 'price-asc') sortedCards.sort((a, b) => a.dataset.price - b.dataset.price);
            else if (sortBy === 'price-desc') sortedCards.sort((a, b) => b.dataset.price - a.dataset.price);
            else sortedCards.sort((a, b) => a.dataset.id - b.dataset.id);
            if(productGrid) {
                productGrid.innerHTML = '';
                sortedCards.forEach(card => productGrid.appendChild(card));
            }
        });
    }

    // --- ОБНОВЛЕНИЕ СЧЕТЧИКА УВЕДОМЛЕНИЙ ---
    const updateNotificationCounter = () => {
        const notificationCounters = document.querySelectorAll('.notification-counter');
        if (notificationCounters.length === 0) return;
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
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

    // --- СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ ---
    window.addEventListener('storage', (event) => {
        if (event.key === 'notificationsUpdated') {
            updateNotificationCounter();
        }
        if (event.key === 'shoppingCart') {
            cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            updateCartIcon(false);
            initialRenderCardStates();
        }
        if (event.key === 'currentUser' || event.key === null || event.key === 'users') {
            updateHeaderAuthState();
        }
    });
});