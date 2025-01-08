let stocks = [];
let currentIndex = 0;
let chart;
let candleSeries;
let volumeSeries;

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
async function fetchYahooFinanceData(symbol) {
    const yahooSymbol = `${symbol}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1y`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            throw new Error('Invalid data structure received from Yahoo Finance');
        }
        
        return formatYahooData(data);
    } catch (error) {
        console.error('Error fetching Yahoo Finance data:', error);
        return null;
    }
}

// Format Yahoo Finance data for Lightweight Charts
function formatYahooData(yahooData) {
    const result = yahooData.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    const candleData = [];
    const volumeData = [];

    for (let i = 0; i < timestamps.length; i++) {
        const time = timestamps[i];
        
        // Check if we have valid OHLC data
        if (quotes.open[i] !== null && quotes.high[i] !== null && 
            quotes.low[i] !== null && quotes.close[i] !== null) {
            
            candleData.push({
                time: time,
                open: parseFloat(quotes.open[i].toFixed(2)),
                high: parseFloat(quotes.high[i].toFixed(2)),
                low: parseFloat(quotes.low[i].toFixed(2)),
                close: parseFloat(quotes.close[i].toFixed(2))
            });

            // Add volume data if available
            if (quotes.volume[i] !== null) {
                volumeData.push({
                    time: time,
                    value: quotes.volume[i],
                    color: quotes.close[i] >= quotes.open[i] ? '#26a69a' : '#ef5350'
                });
            }
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
        console.log('Loading data for symbol:', symbol);
        
        // Clear existing data
        candleSeries.setData([]);
        volumeSeries.setData([]);
        
        const data = await fetchYahooFinanceData(symbol);
        
        if (data && data.candleData.length > 0) {
            console.log('Received data:', data.candleData.length, 'candles');
            candleSeries.setData(data.candleData);
            volumeSeries.setData(data.volumeData);
            
            // Fit content
            chart.timeScale().fitContent();
            
            document.title = `${symbol} - BseCharts`;
        } else {
            console.error('No valid data received for symbol:', symbol);
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

// Event Listeners
document.getElementById('prevBtn').addEventListener('click', handlePrevious);
document.getElementById('nextBtn').addEventListener('click', handleNext);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Add event listeners for interval buttons
document.querySelectorAll('.interval-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        // Remove active state from all buttons
        document.querySelectorAll('.interval-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100');
            btn.classList.add('bg-gray-100');
        });
        // Add active state to clicked button
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
        chart.timeScale().fitContent();
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
