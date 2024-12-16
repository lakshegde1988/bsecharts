let stocks = [];
let currentIndex = 0;
let widget;
let isMobile = false;

function checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function fetchStocks() {
    try {
        const response = await fetch('stocks.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        stocks = await response.json();
        if (stocks.length > 0) {
            isMobile = checkMobile();
            if (isMobile) {
                document.getElementById('mobileSearch').classList.remove('hidden');
            }
            loadTradingViewWidget();
            updatePaginationText();
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
    const containerHeight = window.innerHeight - footerHeight;
    container.style.height = `${containerHeight}px`;
    
    widget = new TradingView.widget({
        autosize: true,
        symbol: `BSE:${stocks[currentIndex].Symbol}`,
        interval: 'W',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        style: '1',
        locale: 'in',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tradingview_widget',
        height: containerHeight,
        // Add these options:
        hide_side_toolbar: false,
        studies: [],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        // Disable auto-selection of first result
        no_referral_id: true,
        // Custom search handler
        custom_search: function(symbol, onResultReadyCallback) {
            // Implement custom search logic here if needed
            // For now, we'll just pass the symbol through
            onResultReadyCallback([{
                symbol: symbol,
                full_name: symbol,
                description: symbol,
                exchange: 'BSE',
                type: 'stock'
            }]);
        }
    });

    // Add an event listener for the widget's ready event
    widget.onChartReady(function() {
        const searchBox = document.querySelector('.tv-search-row__input');
        if (searchBox) {
            searchBox.addEventListener('focus', function(e) {
                // Prevent default focus behavior
                e.preventDefault();
                // Clear the search box
                this.value = '';
            });
        }
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

function handleMobileSearch() {
    const input = document.getElementById('mobileSearchInput');
    const results = document.getElementById('searchResults');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredStocks = stocks.filter(stock => 
            stock.Symbol.toLowerCase().includes(query) ||
            (stock.CompanyName && stock.CompanyName.toLowerCase().includes(query))
        );
        
        results.innerHTML = '';
        filteredStocks.forEach(stock => {
            const li = document.createElement('li');
            li.textContent = `${stock.Symbol} - ${stock.CompanyName || ''}`;
            li.className = 'p-2 hover:bg-gray-100 cursor-pointer';
            li.addEventListener('click', () => {
                currentIndex = stocks.findIndex(s => s.Symbol === stock.Symbol);
                loadTradingViewWidget();
                updatePaginationText();
                input.value = '';
                results.innerHTML = '';
            });
            results.appendChild(li);
        });
    });
}

function changeSymbol(symbol) {
    if (widget && widget.chart && typeof widget.chart.setSymbol === 'function') {
        widget.chart.setSymbol(`BSE:${symbol}`, function() {
            console.log('Symbol changed to:', symbol);
        });
    }
}

document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Add this event listener for symbol change
document.addEventListener('symbolChange', function(e) {
    const newSymbol = e.detail.symbol;
    changeSymbol(newSymbol);
});

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
handleMobileSearch();

