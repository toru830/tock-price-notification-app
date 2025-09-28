# 株価通知アプリ 📈

毎日の株価を通知してくれるWebアプリケーションです。保有銘柄、ウォッチリスト、ホット銘柄を3つのタブで管理できます。

## 機能 ✨

- **保有銘柄**: S&P 500、NVIDIA、Meta Platforms
- **ウォッチリスト**: SOXL、QQQ
- **ホット銘柄**: FANG+関連銘柄（Apple、Google、Amazon、Netflix、Tesla）
- **リアルタイム株価**: Yahoo Finance APIを使用した最新の株価データ
- **レスポンシブデザイン**: スマートフォンでも快適に閲覧可能
- **自動更新**: 5分ごとに株価データを自動更新

## 技術スタック 🛠️

- **フロントエンド**: HTML5、CSS3、JavaScript (ES6+)
- **API**: Yahoo Finance API
- **デプロイ**: GitHub Pages
- **デザイン**: モダンなグラデーションとカード型レイアウト

## デプロイ手順 🚀

### 1. リポジトリの作成

1. GitHubで新しいリポジトリを作成
2. リポジトリ名を `stock-price-notification-app` に設定
3. このプロジェクトのファイルをリポジトリにアップロード

### 2. GitHub Pagesの設定

1. リポジトリの「Settings」タブに移動
2. 左サイドバーの「Pages」をクリック
3. 「Source」で「GitHub Actions」を選択
4. 設定が完了すると、自動的にGitHub Actionsが実行されます

### 3. アクセス

デプロイが完了すると、以下のURLでアクセスできます：
```
https://yourusername.github.io/stock-price-notification-app/
```

## ローカル開発 🔧

### 前提条件

- Python 3.x がインストールされていること

### 起動方法

1. プロジェクトディレクトリに移動
```bash
cd stock-price-notification-app
```

2. ローカルサーバーを起動
```bash
python -m http.server 8000
```

3. ブラウザでアクセス
```
http://localhost:8000
```

## ファイル構成 📁

```
stock-price-notification-app/
├── index.html              # メインHTMLファイル
├── styles.css              # スタイルシート
├── script.js               # JavaScriptファイル
├── package.json            # プロジェクト設定
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions設定
└── README.md               # このファイル
```

## カスタマイズ 🎨

### 銘柄の追加・変更

`script.js` の `STOCK_CONFIG` オブジェクトを編集することで、表示する銘柄を変更できます：

```javascript
const STOCK_CONFIG = {
    myStocks: [
        { symbol: '^GSPC', name: 'S&P 500', category: 'index' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock' },
        // 新しい銘柄を追加
        { symbol: 'TSLA', name: 'Tesla Inc', category: 'stock' }
    ],
    // ...
};
```

### 更新間隔の変更

`script.js` の以下の部分を編集して、更新間隔を変更できます：

```javascript
// 5分ごとにデータを更新（現在の設定）
setInterval(loadStockData, 5 * 60 * 1000);

// 1分ごとに更新する場合
setInterval(loadStockData, 1 * 60 * 1000);
```

## 注意事項 ⚠️

- Yahoo Finance APIは無料ですが、レート制限があります
- 大量のリクエストを送信すると、一時的にアクセスが制限される可能性があります
- 本番環境では、適切なAPIキーを取得することを推奨します

## ライセンス 📄

MIT License

## 貢献 🤝

プルリクエストやイシューの報告を歓迎します！

## 更新履歴 📝

- v1.0.0: 初回リリース
  - 基本的な株価表示機能
  - 3つのタブ（保有銘柄、ウォッチリスト、ホット銘柄）
  - レスポンシブデザイン
  - GitHub Pages対応
