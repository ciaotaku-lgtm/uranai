# キャラクター占い 🔮

四柱推命 × 自由テーマのキャラクター占いアプリ

## デプロイ手順（Vercel）

### 1. GitHubにアップロード
1. [github.com](https://github.com) でアカウント作成（無料）
2. 「New repository」→ 名前を入力（例：`uranai`）→「Create repository」
3. このフォルダのファイルを全てアップロード

### 2. Vercelにデプロイ
1. [vercel.com](https://vercel.com) でアカウント作成（GitHubでログイン）
2. 「New Project」→ GitHubの`uranai`リポジトリを選択
3. 「Deploy」をクリック

### 3. APIキーを設定（重要）
1. Vercelのダッシュボード → プロジェクト → 「Settings」→「Environment Variables」
2. 以下を追加：
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: あなたのAnthropicAPIキー（[console.anthropic.com](https://console.anthropic.com) で取得）
3. 「Save」→「Redeploy」

### APIキーの取得方法
1. [console.anthropic.com](https://console.anthropic.com) にアクセス
2. 「API Keys」→「Create Key」
3. 表示されたキーをコピー（一度しか表示されないので注意）

## ローカルで試す場合

```bash
# .env.localファイルを作成
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

npm install
npm run dev
```
