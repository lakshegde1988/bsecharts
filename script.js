let stocks = [];
let currentIndex = 0;
let widget;
let currentInterval = '12M';

// add event listener for keydown event
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        handlePrevious();
    } else if (event.key === 'ArrowRight') {
        handleNext();
    }
});

async function fetchStocks() {
    const container = document.getElementById('tradingview_widget');
    try {
        container.innerHTML = "<p class='text-blue-500 p-4'>Loading stocks data...</p>";
        
        const response = await fetch('bse500.json');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data loaded, first item:', data[0]);
        
        if (!Array.isArray(data)) {
            throw new Error('Data is not an array');
        }
        
        if (data.length === 0) {
            throw new Error('No stocks found in the data');
        }
        
        // Verify data structure
        if (!data[0].Symbol) {
            throw new Error('Invalid data structure - missing Symbol property');
        }
        
        stocks = data;
        loadTradingViewWidget();
        updatePaginationText();
        
    } catch (e) {
        console.error("Detailed error:", e);
        let errorMessage = "Failed to load stocks data. ";
        
        if (e.message.includes('HTTP error')) {
            errorMessage += "Server returned an error. ";
        } else if (e.message.includes('Invalid data structure')) {
            errorMessage += "Data format is incorrect. ";
        } else if (e.message === 'No stocks found in the data') {
            errorMessage += "No stocks data available. ";
        } else if (e.name === 'SyntaxError') {
            errorMessage += "Invalid JSON format. ";
        }
        
        errorMessage += "Please check the console for more details.";
        
        container.innerHTML = `
            <div class='p-4'>
                <p class='text-red-500 font-medium'>Error Loading Data</p>
                <p class='text-gray-700 mt-2'>${errorMessage}</p>
                <button onclick="fetchStocks()" class='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>
                    Retry Loading
                </button>
            </div>`;
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
        interval: currentInterval,
        timezone: 'Asia/Kolkata',
        theme: 'light',
        style: '1',
        locale: 'in',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: 'tradingview_widget',
        height: containerHeight,
        disabled_features: ["header_widget"],
        enabled_features: ["hide_left_toolbar_by_default"],
        save_image: false,
        backgroundColor: "white",
        // Setting up default properties for logarithmic mode
        defaults: {
            "scalesProperties.scaleSeriesOnly": false,
            "mainSeriesProperties.logDisabled": false,
            "mainSeriesProperties.priceFormat.type": "price",
            "mainSeriesProperties.style": 1,
            "scalesProperties.showLeftScale": false,
        }
    });

    // Set up widget ready callback to ensure logarithmic mode
    widget.onChartReady(() => {
        widget.activeChart().setChartType(1);  // 1 is for candlestick
        widget.activeChart().setPriceScale('right', {
            mode: 1,  // 1 means logarithmic
            autoScale: true
        });
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

function handleIntervalChange(interval) {
    currentInterval = interval;
    loadTradingViewWidget();
}

// Event Listeners
document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Add event listeners for interval buttons
document.querySelectorAll('.interval-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        handleIntervalChange(e.target.dataset.interval);
        
        // Update active state of interval buttons
        document.querySelectorAll('.interval-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100');
            btn.classList.add('bg-gray-100');
        });
        e.target.classList.remove('bg-gray-100');
        e.target.classList.add('bg-blue-100');
    });
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

// Initialize the app
fetchStocks();
