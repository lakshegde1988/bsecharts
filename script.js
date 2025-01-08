let stocks = [];
let currentIndex = 0;
let chart;
let candleSeries;
let volumeSeries;
let currentInterval = '1y';

// Initialize the chart
function initChart() {
    const container = document.getElementById('chart_container');
    const footerHeight = 48;
    const containerHeight = window.innerHeight - footerHeight;
    container.style.height = `${containerHeight}px`;

    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: containerHeight,
        layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
        },
        grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    });

    // Create the candlestick series
    candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    });

    // Create volume series
    volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', // Set as an overlay
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });
}

// Fetch data from Yahoo Finance
async function fetchYahooFinanceData(symbol, interval) {
    // Convert BSE symbol to Yahoo Finance format (add .BO)
    const yahooSymbol = `${symbol}.BO`;
    
    // Calculate start and end dates
    const end = Math.floor(Date.now() / 1000);
    let start;
    
    switch(interval) {
        case '1mo':
            start = end - (30 * 24 * 60 * 60);
            break;
        case '3mo':
            start = end - (90 * 24 * 60 * 60);
            break;
        case '1y':
        default:
            start = end - (365 * 24 * 60 * 60);
            break;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${start}&period2=${end}&interval=1d`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return formatYahooData(data);
    } catch (error) {
        console.error('Error fetching Yahoo Finance data:', error);
        return null;
    }
}

// Format Yahoo Finance data for Lightweight Charts
function formatYahooData(yahooData) {
    const timestamps = yahooData.chart.result[0].timestamp;
    const quotes = yahooData.chart.result[0].indicators.quote[0];
    
    const candleData = [];
    const volumeData = [];

    for (let i = 0; i < timestamps.length; i++) {
        if (quotes.high[i] && quotes.low[i] && quotes.open[i] && quotes.close[i]) {
            const time = timestamps[i];
            
            candleData.push({
                time: time,
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
            });

            volumeData.push({
                time: time,
                value: quotes.volume[i],
                color: quotes.close[i] >= quotes.open[i] ? '#26a69a' : '#ef5350',
            });
        }
    }

    return { candleData, volumeData };
}

async function loadChart() {
    if (!chart) {
        initChart();
    }

    try {
        const symbol = stocks[currentIndex].Symbol;
        const data = await fetchYahooFinanceData(symbol, currentInterval);
        
        if (data) {
            candleSeries.setData(data.candleData);
            volumeSeries.setData(data.volumeData);
            document.title = `${symbol} - BseCharts`;
        }
    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

async function fetchStocks() {
    try {
        const response = await fetch('bse500.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        stocks = await response.json();
        if (stocks.length > 0) {
            await loadChart();
            updatePaginationText();
        } else {
            throw new Error('No stocks found in the data');
        }
    } catch (e) {
        console.error("Failed to fetch or process stocks data:", e);
        document.getElementById('chart_container').innerHTML = 
            "<p class='text-red-500 p-4'>Failed to load stocks data. Please try again later.</p>";
    }
}

function updatePaginationText() {
    document.getElementById('paginationText').textContent = 
        stocks.length > 0 ? `${currentIndex + 1} / ${stocks.length}` : '- / -';
}

async function handlePrevious() {
    currentIndex = (currentIndex - 1 + stocks.length) % stocks.length;
    await loadChart();
    updatePaginationText();
}

async function handleNext() {
    currentIndex = (currentIndex + 1) % stocks.length;
    await loadChart();
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

async function handleIntervalChange(interval) {
    currentInterval = interval;
    await loadChart();
}

// Event Listeners
document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Add event listeners for interval buttons
document.querySelectorAll('.interval-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        await handleIntervalChange(e.target.dataset.interval);
        
        // Update active state of interval buttons
        document.querySelectorAll('.interval-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100');
            btn.classList.add('bg-gray-100');
        });
        e.target.classList.remove('bg-gray-100');
        e.target.classList.add('bg-blue-100');
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    if (chart) {
        const container = document.getElementById('chart_container');
        const footerHeight = 48;
        const containerHeight = window.innerHeight - footerHeight;
        container.style.height = `${containerHeight}px`;
        chart.resize(container.clientWidth, containerHeight);
    }
});

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6-7 7"/><path d="M20 10h-6m0 0V4m0 6 7-7"/></svg>';
    } else {
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6m0 0v6m0-6-7 7"/><path d="M9 21H3m0 0v-6m0 6 7-7"/></svg>';
    }
});

fetchStocks();
