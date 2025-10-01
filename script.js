// 株価データの設定
const STOCK_CONFIG = {
    // 保有銘柄
    myStocks: [
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'etf' },
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

// 比較期間の設定
const COMPARISON_CONFIG = [
    { key: 'previousDay', label: '前日比価格', tradingDays: 1 },
    { key: 'oneWeek', label: '一週間前比価格', tradingDays: 5 },
    { key: 'oneMonth', label: '1ヶ月前比価格', tradingDays: 21 },
    { key: 'threeMonths', label: '3ヶ月前比価格', tradingDays: 63 },
    { key: 'sixMonths', label: '半年前比価格', tradingDays: 126 },
    { key: 'oneYear', label: '一年前比価格', tradingDays: 252 },
    { key: 'twoYears', label: '二年前比価格', tradingDays: 504 }
];

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
        // CORS制限のないAPIを使用
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2);

        const formattedStart = formatDate(startDate);
        const formattedEnd = formatDate(endDate);

        const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${formattedStart}/${formattedEnd}?adjusted=true&sort=desc&limit=600&apikey=demo`);

        if (!response.ok) {
            // フォールバック: モックデータを使用
            return generateMockData(symbol);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const results = data.results.slice().sort((a, b) => b.t - a.t);
            const current = results[0];

            if (!current || !current.c) {
                return generateMockData(symbol);
            }

            const currentPrice = current.c;

            return {
                symbol: symbol,
                name: getStockName(symbol),
                price: currentPrice,
                currency: 'USD',
                comparisons: buildComparisons(results, currentPrice)
            };
        }

        return generateMockData(symbol);
    } catch (error) {
        console.error(`株価データの取得に失敗 (${symbol}):`, error);
        return generateMockData(symbol);
    }
}

// モックデータを生成（デモ用）
function generateMockData(symbol) {
    const basePrice = getBasePrice(symbol);
    const change = (Math.random() - 0.5) * basePrice * 0.1; // ±5%の変動
    const currentPrice = basePrice + change;

    return {
        symbol: symbol,
        name: getStockName(symbol),
        price: currentPrice,
        currency: 'USD',
        comparisons: generateMockComparisons(currentPrice)
    };
}

// 銘柄の基本価格を取得
function getBasePrice(symbol) {
    const basePrices = {
        'SPY': 450,
        'NVDA': 800,
        'META': 300,
        'SOXL': 25,
        'QQQ': 400,
        'AAPL': 180,
        'GOOGL': 140,
        'AMZN': 150,
        'NFLX': 400,
        'TSLA': 250
    };
    return basePrices[symbol] || 100;
}

// 銘柄名を取得
function getStockName(symbol) {
    const names = {
        'SPY': 'SPDR S&P 500 ETF Trust',
        'NVDA': 'NVIDIA Corporation',
        'META': 'Meta Platforms Inc',
        'SOXL': 'Direxion Daily Semiconductor Bull 3X Shares',
        'QQQ': 'Invesco QQQ Trust',
        'AAPL': 'Apple Inc',
        'GOOGL': 'Alphabet Inc Class A',
        'AMZN': 'Amazon.com Inc',
        'NFLX': 'Netflix Inc',
        'TSLA': 'Tesla Inc'
    };
    return names[symbol] || symbol;
}

// 株価データの表示
function displayStocks(tabName) {
    console.log('Displaying stocks for tab:', tabName);
    const gridElement = document.getElementById(`${tabName}Grid`);
    if (!gridElement) {
        console.error('Grid element not found for tab:', tabName);
        return;
    }
    
    const stocks = STOCK_CONFIG[tabName] || [];
    console.log('Stocks for', tabName, ':', stocks);
    
    gridElement.innerHTML = '';
    
    stocks.forEach(stock => {
        const data = stockData[stock.symbol];
        console.log('Stock data for', stock.symbol, ':', data);
        const card = createStockCard(stock, data);
        gridElement.appendChild(card);
    });
}

// 株価カードの作成
function createStockCard(stock, data) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    
    if (!data) {
        const placeholderItems = COMPARISON_CONFIG.map(config => `
            <div class="comparison-item neutral">
                <span class="comparison-label">${config.label}</span>
                <span class="comparison-value">-</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
            </div>
            <div class="stock-price">データ取得中...</div>
            <div class="comparison-list">
                ${placeholderItems}
            </div>
        `;
        return card;
    }
    
    const comparisonItems = COMPARISON_CONFIG.map(config => {
        const comparison = data.comparisons ? data.comparisons[config.key] : null;
        const changeClass = getChangeClass(comparison);
        const value = formatComparisonValue(comparison, data.currency);
        return `
            <div class="comparison-item ${changeClass}">
                <span class="comparison-label">${config.label}</span>
                <span class="comparison-value">${value}</span>
            </div>
        `;
    }).join('');

    card.innerHTML = `
        <div class="stock-header">
            <div>
                <div class="stock-symbol">${data.symbol}</div>
                <div class="stock-name">${data.name}</div>
            </div>
        </div>
        <div class="stock-price">価格: ${formatPrice(data.price, data.currency)}</div>
        <div class="comparison-list">
            ${comparisonItems}
        </div>
    `;

    return card;
}

// 比較データの生成
function buildComparisons(results, currentPrice) {
    const comparisons = {};
    COMPARISON_CONFIG.forEach(config => {
        comparisons[config.key] = calculateComparison(results, config.tradingDays, currentPrice);
    });
    return comparisons;
}

function calculateComparison(results, index, currentPrice) {
    if (!results || results.length <= index) {
        return null;
    }

    const reference = results[index];
    const referencePrice = reference.c;

    if (!referencePrice || referencePrice === 0) {
        return null;
    }

    const change = currentPrice - referencePrice;
    const percent = (change / referencePrice) * 100;

    return {
        basePrice: referencePrice,
        change: change,
        percent: percent
    };
}

function generateMockComparisons(currentPrice) {
    const comparisons = {};
    COMPARISON_CONFIG.forEach(config => {
        const variation = 1 + (Math.random() - 0.5) * 0.2; // ±10%
        const referencePrice = currentPrice / variation;
        const change = currentPrice - referencePrice;
        comparisons[config.key] = {
            basePrice: referencePrice,
            change: change,
            percent: (change / referencePrice) * 100
        };
    });
    return comparisons;
}

function getChangeClass(comparison) {
    if (!comparison) {
        return 'neutral';
    }
    if (comparison.change > 0) {
        return 'positive';
    }
    if (comparison.change < 0) {
        return 'negative';
    }
    return 'neutral';
}

function formatComparisonValue(comparison, currency) {
    if (!comparison) {
        return '-';
    }

    const change = formatPrice(Math.abs(comparison.change), currency);
    const percent = Math.abs(comparison.percent).toFixed(2);
    const changeSign = comparison.change > 0 ? '+' : comparison.change < 0 ? '-' : '';
    const percentSign = comparison.percent > 0 ? '+' : comparison.percent < 0 ? '-' : '';

    return `${changeSign}${change} (${percentSign}${percent}%)`;
}

function formatPrice(value, currency = 'USD') {
    try {
        const hasFraction = currency === 'JPY' ? 0 : 2;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: hasFraction,
            maximumFractionDigits: hasFraction
        }).format(value);
    } catch (error) {
        const symbol = currency === 'JPY' ? '¥' : '$';
        return `${symbol}${value.toFixed(2)}`;
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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