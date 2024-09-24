document.addEventListener('DOMContentLoaded', function () {
  let currentCurrency = localStorage.getItem('currency') || 'usd'; // Default currency
  let currentLanguage = localStorage.getItem('language') || 'ua'; // Default language
  let theme = localStorage.getItem('theme') || 'dark'; // Default theme

  const cryptoList = document.getElementById('crypto-list');
  const notification = document.getElementById('notification');
  const searchBar = document.getElementById('search-bar');
  const languageSelect = document.getElementById('language-select');
  const currencySelect = document.getElementById('currency-select');
  const menuIcon = document.getElementById('menu-icon');
  const filterModal = document.getElementById('filter-modal'); // Модальне вікно для мови та валюти
  const overlay = document.getElementById('overlay'); // Фонова затемнення
  const headingText = document.getElementById('heading-text');
  const modalCryptoName = document.getElementById('modal-crypto-name');
  const modalCryptoPrice = document.getElementById('modal-crypto-price');
  const modalMarketCap = document.getElementById('modal-market-cap');
  const modalChange24h = document.getElementById('modal-change-24h');
  const modalTotalSupply = document.getElementById('modal-total-supply');
  const closeModal = document.getElementsByClassName('close')[0];
  const cryptoModal = document.getElementById('crypto-modal');
  const pageTitle = document.getElementById('page-title');
  const applySettingsBtn = document.getElementById('apply-settings'); // Кнопка "Застосувати"
  const themeIcon = document.getElementById('theme-icon');
  const chartContainer = document.getElementById('chart-container');
  let cryptoData = [];

  // Set theme
  document.body.className = theme;

  // Set theme icon based on current theme
  themeIcon.className = theme === 'dark' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';

  // Function to show notification
  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // Fetch crypto prices from CoinGecko
  function fetchData(currency) {
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc`)
      .then(response => response.json())
      .then(data => {
        cryptoData = data; // Default sorting by market cap
        displayCrypto(cryptoData);
      })
      .catch(error => console.error('Error fetching crypto data:', error));
  }

  // Initial fetch in selected currency
  fetchData(currentCurrency);

  // Auto refresh data every 30 seconds
  setInterval(() => {
    fetchData(currentCurrency);
  }, 30000);

  // Function to display cryptocurrencies
  function displayCrypto(data) {
    cryptoList.innerHTML = ''; // Clear the list before re-rendering
    data.forEach(crypto => {
      const cryptoItem = document.createElement('li');
      cryptoItem.classList.add('crypto-item');

      const cryptoName = document.createElement('span');
      cryptoName.classList.add('crypto-name');
      cryptoName.textContent = crypto.name;

      const cryptoPrice = document.createElement('span');
      cryptoPrice.classList.add('crypto-price');

      // Format price based on currency and add space between symbol and value
      let currencySymbol = currentCurrency === 'uah' ? '₴' : currentCurrency === 'rub' ? '₽' : '$';
      if (crypto.current_price < 0.001) {
        cryptoPrice.textContent = `${currencySymbol} ${crypto.current_price.toFixed(10).toLocaleString()}`;
      } else if (crypto.current_price < 0.10) {
        cryptoPrice.textContent = `${currencySymbol} ${crypto.current_price.toFixed(5).toLocaleString()}`;
      } else {
        cryptoPrice.textContent = `${currencySymbol} ${crypto.current_price.toFixed(2).toLocaleString()}`;
      }

      // Add event listener to show details when clicked
      cryptoItem.addEventListener('click', () => showDetails(crypto));

      cryptoItem.appendChild(cryptoName);
      cryptoItem.appendChild(cryptoPrice);
      cryptoList.appendChild(cryptoItem);
    });
  }

  // Show detailed information when a cryptocurrency is clicked
  function showDetails(crypto) {
    modalCryptoName.textContent = crypto.name;
    let currencySymbol = currentCurrency === 'uah' ? '₴' : currentCurrency === 'rub' ? '₽' : '$';
    modalCryptoPrice.textContent = `${currencySymbol} ${crypto.current_price.toFixed(10)}`;
    modalMarketCap.textContent = `${currencySymbol} ${crypto.market_cap.toLocaleString()}`;
    modalChange24h.textContent = `${crypto.price_change_percentage_24h.toFixed(2)}%`;
    modalTotalSupply.textContent = crypto.total_supply ? crypto.total_supply.toLocaleString() : 'N/A';

    cryptoModal.style.display = 'flex'; // Show the modal

    // Fetch and display price chart
    fetchPriceChart(crypto.id);
  }

  // Fetch and display price chart for the selected cryptocurrency
  function fetchPriceChart(cryptoId) {
    fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=${currentCurrency}&days=1`)
      .then(response => response.json())
      .then(chartData => {
        const ctx = document.getElementById('price-chart').getContext('2d');
        const labels = chartData.prices.map(pricePoint => new Date(pricePoint[0]).toLocaleTimeString());
        const data = chartData.prices.map(pricePoint => pricePoint[1]);

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Price',
              data: data,
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2
            }]
          },
          options: {
            scales: {
              x: { display: true },
              y: { display: true }
            }
          }
        });
      });
  }

  // Close the modal when clicking on the "X"
  closeModal.addEventListener('click', function () {
    cryptoModal.style.display = 'none';
  });

  // Close the modal when clicking outside the modal content
  window.addEventListener('click', function (event) {
    if (event.target === cryptoModal) {
      cryptoModal.style.display = 'none';
    }
  });

  // Search function
  searchBar.addEventListener('input', function () {
    const searchTerm = searchBar.value.toLowerCase();
    const filteredData = cryptoData.filter(crypto =>
      crypto.name.toLowerCase().includes(searchTerm)
    );
    displayCrypto(filteredData); // Display filtered list
  });

  // Open/Close filter modal (language and currency selection) when clicking on the menu icon
  menuIcon.addEventListener('click', function () {
    if (filterModal.style.display === 'block') {
      filterModal.style.display = 'none';
      overlay.style.display = 'none';
    } else {
      filterModal.style.display = 'block';
      overlay.style.display = 'block';
    }
  });

  // Apply the selected language and currency when the button is clicked
  applySettingsBtn.addEventListener('click', function () {
    currentLanguage = languageSelect.value;
    currentCurrency = currencySelect.value;
    
    updateLanguage(currentLanguage);
    fetchData(currentCurrency); // Отримати дані для нової валюти
    
    localStorage.setItem('language', currentLanguage);
    localStorage.setItem('currency', currentCurrency);

    // Закриваємо модальне вікно та фонове затемнення
    filterModal.style.display = 'none';
    overlay.style.display = 'none';
    
    showNotification('Налаштування збережені!');
  });

  // Theme icon click event listener
  themeIcon.addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.body.className = theme;
    themeIcon.className = theme === 'dark' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
    localStorage.setItem('theme', theme);
  });

  // Function to update language dynamically
  function updateLanguage(lang) {
    if (lang === 'ua') {
      headingText.textContent = 'Ціни на криптовалюти';
      document.getElementById('filter-heading').textContent = 'Мова та валюта';
      document.getElementById('modal-price-label').textContent = 'Ціна:';
      document.getElementById('modal-marketcap-label').textContent = 'Капіталізація:';
      document.getElementById('modal-change-label').textContent = 'Зміна за 24 години:';
      document.getElementById('modal-supply-label').textContent = 'Загальна пропозиція:';
      pageTitle.textContent = 'Ціни на криптовалюти';
      showNotification('Мова змінена на Українську');
    } else if (lang === 'ru') {
      headingText.textContent = 'Цены на криптовалюты';
      document.getElementById('filter-heading').textContent = 'Язык и валюта';
      document.getElementById('modal-price-label').textContent = 'Цена:';
      document.getElementById('modal-marketcap-label').textContent = 'Капитализация:';
      document.getElementById('modal-change-label').textContent = 'Изменение за 24 часа:';
      document.getElementById('modal-supply-label').textContent = 'Общее предложение:';
      pageTitle.textContent = 'Цены на криптовалюты';
      showNotification('Язык изменён на Русский');
    } else {
      headingText.textContent = 'Cryptocurrency Prices';
      document.getElementById('filter-heading').textContent = 'Language and Currency';
      document.getElementById('modal-price-label').textContent = 'Price:';
      document.getElementById('modal-marketcap-label').textContent = 'Market Cap:';
      document.getElementById('modal-change-label').textContent = '24h Change:';
      document.getElementById('modal-supply-label').textContent = 'Total Supply:';
      pageTitle.textContent = 'Cryptocurrency Prices';
      showNotification('Language changed to English');
    }
  }
});
