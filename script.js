let stocks = [];
let currentIndex = 0;
let searchTimeout;
const CACHE_KEY = 'stocksCache';

async function fetchStocks() {
    showLoadingIndicator();
    try {
        const cachedStocks = localStorage.getItem(CACHE_KEY);
        if (cachedStocks) {
            stocks = JSON.parse(cachedStocks);
            if (stocks.length > 0) {
                loadTradingViewWidget();
                updatePaginationText();
                hideLoadingIndicator();
                return;
            }
        }

        const response = await fetch('stocks.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        stocks = await response.json();
        if (stocks.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(stocks));
            loadTradingViewWidget();
            updatePaginationText();
        } else {
            throw new Error('No stocks found in the data');
        }
    } catch (e) {
        console.error("Failed to fetch or process stocks data:", e);
        document.getElementById('tradingview_widget').innerHTML = 
            "<p class='text-red-500 p-4'>Failed to load stocks data. Please try again later.</p>";
    } finally {
        hideLoadingIndicator();
    }
}

function loadTradingViewWidget(stock = stocks[currentIndex]) {
    const container = document.getElementById('tradingview_widget');
    container.innerHTML = '';
    
    new TradingView.widget({
        autosize: true,
        symbol: `BSE:${stock.Symbol}`,
        interval: 'D',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        style: '1',
        locale: 'in',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tradingview_widget'
    });
}

function updatePaginationText() {
    document.getElementById('paginationText').textContent = `${currentIndex + 1} / ${stocks.length}`;
}

function showLoadingIndicator() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

function searchStocks(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const filteredStocks = stocks.filter(stock => 
            stock.Symbol.toLowerCase().includes(query.toLowerCase()) ||
            (stock.CompanyName && stock.CompanyName.toLowerCase().includes(query.toLowerCase()))
        );
        if (filteredStocks.length > 0) {
            currentIndex = stocks.indexOf(filteredStocks[0]);
            loadTradingViewWidget();
            updatePaginationText();
        }
    }, 300);
}

function handlePrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        loadTradingViewWidget();
        updatePaginationText();
    }
}

function handleNext() {
    if (currentIndex < stocks.length - 1) {
        currentIndex++;
        loadTradingViewWidget();
        updatePaginationText();
    }
}

function toggleFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('searchInput').addEventListener('input', (e) => searchStocks(e.target.value));

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        handlePrevious();
    } else if (e.key === 'ArrowRight') {
        handleNext();
    }
});

window.addEventListener('resize', () => {
    if (stocks.length > 0) {
        loadTradingViewWidget();
    }
});

document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6-7 7"/><path d="M20 10h-6m0 0V4m0 6 7-7"/></svg>';
    } else {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6m0 0v6m0-6-7 7"/><path d="M9 21H3m0 0v-6m0 6 7-7"/></svg>';
    }
});

fetchStocks();

