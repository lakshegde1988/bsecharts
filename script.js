let stocks = [];
let currentIndex = 0;
let widget;


  // add event listener for keydown event
  window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      }
    });

async function fetchStocks() {
    try {
        const response = await fetch('bse500.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        stocks = await response.json();
        if (stocks.length > 0) {
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
        interval: '12M',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        style: '1',
        locale: 'in',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: 'tradingview_widget',
        height: containerHeight,
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
