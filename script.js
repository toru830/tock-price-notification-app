// 株価データの設定
const STOCK_CONFIG = {
    // 保有銘柄
    myStocks: [
        { symbol: '^GSPC', name: 'S&P 500', category: 'index' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock' },
        { symbol: 'META', name: 'Meta Platforms Inc', category: 'stock' }
    ],
    
    // ウォッチリスト
    watchlist: [
        { symbol: 'SOXL', name: 'Direxion Daily Semiconductor Bull 3X Shares', category: 'etf' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etf' }
    ],
    
    // ホット銘柄（FANG+関連）
    hotStocks: [
        { symbol: 'AAPL', name: 'Apple Inc', category: 'stock' },
        { symbol: 'GOOGL', name: 'Alphabet Inc Class A', category: 'stock' },
        { symbol: 'AMZN', name: 'Amazon.com Inc', category: 'stock' },
        { symbol: 'NFLX', name: 'Netflix Inc', category: 'stock' },
        { symbol: 'TSLA', name: 'Tesla Inc', category: 'stock' }
    ]
};

// グローバル変数
let currentTab = 'my-stocks';
let stockData = {};

// DOM要素の取得
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const lastUpdatedElement = document.getElementById('lastUpdated');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadStockData();
    
    // 5分ごとにデータを更新
    setInterval(loadStockData, 5 * 60 * 1000);
});

// タブ機能の初期化
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // アクティブなタブを切り替え
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            currentTab = targetTab;
            
            // 該当する株価データを表示
            displayStocks(targetTab);
        });
    });
}

// 株価データの読み込み
async function loadStockData() {
    showLoading();
    hideError();
    
    try {
        // すべての銘柄のシンボルを取得
        const allSymbols = [
            ...STOCK_CONFIG.myStocks,
            ...STOCK_CONFIG.watchlist,
            ...STOCK_CONFIG.hotStocks
        ].map(stock => stock.symbol);
        
        // 株価データを並列で取得
        const promises = allSymbols.map(symbol => fetchStockData(symbol));
        const results = await Promise.allSettled(promises);
        
        // 成功したデータのみを保存
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                stockData[allSymbols[index]] = result.value;
            }
        });
        
        // 現在のタブのデータを表示
        displayStocks(currentTab);
        updateLastUpdated();
        hideLoading();
        
    } catch (error) {
        console.error('株価データの取得に失敗:', error);
        showError();
    }
}

// 個別の株価データを取得
async function fetchStockData(symbol) {
    try {
        // Yahoo Finance APIの代替として、Alpha Vantage APIを使用
        // 実際のプロダクションでは、適切なAPIキーを取得してください
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const quote = result.indicators.quote[0];
            
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.previousClose;
            const change = currentPrice - previousClose;
            const changePercent = (change / previousClose) * 100;
            
            return {
                symbol: symbol,
                name: meta.longName || symbol,
                price: currentPrice,
                change: change,
                changePercent: changePercent,
                previousClose: previousClose,
                high: meta.regularMarketDayHigh,
                low: meta.regularMarketDayLow,
                volume: meta.regularMarketVolume,
                marketCap: meta.marketCap,
                currency: meta.currency || 'USD'
            };
        }
        
        return null;
    } catch (error) {
        console.error(`株価データの取得に失敗 (${symbol}):`, error);
        return null;
    }
}

// 株価データの表示
function displayStocks(tabName) {
    const gridElement = document.getElementById(`${tabName}Grid`);
    if (!gridElement) return;
    
    const stocks = STOCK_CONFIG[tabName] || [];
    
    gridElement.innerHTML = '';
    
    stocks.forEach(stock => {
        const data = stockData[stock.symbol];
        const card = createStockCard(stock, data);
        gridElement.appendChild(card);
    });
}

// 株価カードの作成
function createStockCard(stock, data) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    
    if (!data) {
        card.innerHTML = `
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
            </div>
            <div class="stock-price">データ取得中...</div>
            <div class="stock-change neutral">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;
        return card;
    }
    
    const changeClass = data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : 'neutral';
    const changeIcon = data.change > 0 ? 'fa-arrow-up' : data.change < 0 ? 'fa-arrow-down' : 'fa-minus';
    
    card.innerHTML = `
        <div class="stock-header">
            <div>
                <div class="stock-symbol">${data.symbol}</div>
                <div class="stock-name">${data.name}</div>
            </div>
        </div>
        <div class="stock-price">$${data.price.toFixed(2)}</div>
        <div class="stock-change ${changeClass}">
            <i class="fas ${changeIcon}"></i>
            $${data.change.toFixed(2)} (${data.changePercent.toFixed(2)}%)
        </div>
        <div class="stock-details">
            <div class="detail-item">
                <span class="detail-label">前日終値</span>
                <span class="detail-value">$${data.previousClose.toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">高値</span>
                <span class="detail-value">$${data.high.toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">安値</span>
                <span class="detail-value">$${data.low.toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">出来高</span>
                <span class="detail-value">${formatNumber(data.volume)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// 数値のフォーマット
function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
}

// ローディング表示
function showLoading() {
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

// エラー表示
function showError() {
    errorElement.style.display = 'block';
    loadingElement.style.display = 'none';
}

function hideError() {
    errorElement.style.display = 'none';
}

// 最終更新時刻の更新
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdatedElement.textContent = timeString;
}

// 手動でデータを再読み込み
window.loadStockData = loadStockData;
