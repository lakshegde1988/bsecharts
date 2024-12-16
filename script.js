let stocks = [];
let currentIndex = 0;
let widget;

async function fetchStocks() {
    try {
        const response = await fetch('stocks.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        stocks = await response.json();
        if (stocks.length > 0) {
            loadTradingViewWidget();
            updatePaginationText();
            setupCustomSearch();
        } else {
            throw new Error('No stocks found in the data');
        }
    } catch (e) {
        console.error("Failed to fetch or process stocks data:", e);
        document.getElementById('tradingview_widget').innerHTML = 
            "<p class='text-red-500 p-4'>Failed to load stocks data. Please try again later.</p>";
    }
}

function loadTradingViewWidget() {
    const container = document.getElementById('tradingview_widget');
    container.innerHTML = '';
    const footerHeight = 48;
    const searchHeight = 76; // Adjust based on your layout
    const containerHeight = window.innerHeight - footerHeight - searchHeight;
    container.style.height = `${containerHeight}px`;
    
    widget = new TradingView.widget({
        autosize: true,
        symbol: `BSE:${stocks[currentIndex].Symbol}`,
        interval: 'D',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        style: '1',
        locale: 'in',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: 'tradingview_widget',
        hide_side_toolbar: false,
    });
}

function updatePaginationText() {
    document.getElementById('paginationText').textContent = 
        stocks.length > 0 ? `${currentIndex + 1} / ${stocks.length}` : '- / -';
}

function handlePrevious() {
    currentIndex = (currentIndex - 1 + stocks.length) % stocks.length;
    loadTradingViewWidget();
    updatePaginationText();
}

function handleNext() {
    currentIndex = (currentIndex + 1) % stocks.length;
    loadTradingViewWidget();
    updatePaginationText();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function setupCustomSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredStocks = stocks.filter(stock => 
            stock.Symbol.toLowerCase().includes(query) ||
            (stock.CompanyName && stock.CompanyName.toLowerCase().includes(query))
        );
        
        searchResults.innerHTML = '';
        filteredStocks.slice(0, 5).forEach(stock => {
            const li = document.createElement('li');
            li.textContent = `${stock.Symbol} - ${stock.CompanyName || ''}`;
            li.className = 'p-2 hover:bg-gray-100 cursor-pointer';
            li.addEventListener('click', () => {
                currentIndex = stocks.findIndex(s => s.Symbol === stock.Symbol);
                loadTradingViewWidget();
                updatePaginationText();
                searchInput.value = '';
                searchResults.innerHTML = '';
            });
            searchResults.appendChild(li);
        });
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.innerHTML = '';
        }
    });

    // Navigate search results with arrow keys
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.getElementsByTagName('li');
        if (items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[0].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[items.length - 1].focus();
            }
        }
    });

    searchResults.addEventListener('keydown', (e) => {
        const items = searchResults.getElementsByTagName('li');
        const currentIndex = Array.from(items).indexOf(document.activeElement);
        if (currentIndex > -1) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                items[currentIndex].click();
            }
        }
    });
}

document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

window.addEventListener('resize', loadTradingViewWidget);

document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6-7 7"/><path d="M20 10h-6m0 0V4m0 6 7-7"/></svg>';
    } else {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6m0 0v6m0-6-7 7"/><path d="M9 21H3m0 0v-6m0 6 7-7"/></svg>';
    }
});

fetchStocks();

