Student Matching App - セットアップガイド
プロジェクトチーム編成を支援するマッチングアプリケーションです。プロフィール、スキル、活動時間などを基に最適なチームメンバーを提案します。
🏗️ 技術構成

フロントエンド: Next.js 14 + React + TypeScript + Tailwind CSS
バックエンド: Next.js API Routes + Prisma ORM
データベース: SQLite (開発用)
認証: JWT + bcryptjs
AI 機能: OpenAI API (オプション)

🚀 セットアップ手順
前提条件

Node.js v18 以上
npm

1. プロジェクトを取得
   bashgit clone https://github.com/Tech0-SWAT/MatchingApp.git
   cd MatchingApp
2. 依存関係をインストール
   bashnpm install
3. 環境変数を設定
   bash# .env.example から.env ファイルを作成
   cp .env.example .env
   重要: .env ファイルで以下を設定してください：
   JWT_SECRET の作成方法
   認証用の秘密鍵を生成します：
   bash# ターミナルで実行して秘密鍵を生成
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   出力された文字列（例：c4f2a8b9d5e7f1a3b8c2d9e6f4a7b3c8）を.env ファイルに設定します：
   bash# 必須: データベースファイルの場所
   DATABASE_URL="file:./prisma/dev.db"

# 必須: 認証用の秘密鍵（上記で生成した文字列に変更）

JWT_SECRET=your-jwt-secret-key-here

# オプション: AI 機能を使用する場合のみ設定

OPENAI_API_KEY=your-openai-api-key-here 4. データベースをセットアップ
bash# データベースとテーブルを作成
npx prisma migrate dev

# サンプルデータを投入

npm run db:seed 5. アプリを起動
bashnpm run dev 6. アクセス

アプリケーション: http://localhost:3000
初期ユーザー: tanaka@example.com / パスワード: Soarainori1

🔧 主要コマンド
bash# 開発サーバー起動
npm run dev

# プロダクションビルド

npm run build && npm run start

# データベース管理画面を開く

npx prisma studio

# テストデータを再投入

npm run db:seed
🔑 環境変数の説明
変数名必須説明 DATABASE_URL✅SQLite データベースファイルのパス JWT_SECRET✅ 認証トークン用の秘密鍵（32 文字のランダム文字列）OPENAI_API_KEY⭕AI マッチング機能用（なくても基本機能は動作）
JWT_SECRET について
ユーザーのログイン状態を管理するための秘密鍵です。アプリがユーザーを識別し、認証を行うために使用されます。上記の手順で生成した 32 文字のランダム文字列を設定してください。
🎯 主要機能

✅ ユーザー認証: 安全なログイン/登録システム
✅ プロフィール管理: スキル、経験、希望役割の設定
✅ スマートマッチング: AI または独自アルゴリズムによる相性判定
✅ チーム管理: チーム作成・参加・メンバー管理
✅ レスポンシブデザイン: PC・スマホ対応

🚨 トラブルシューティング
よくある問題

1. データベース関連エラー
   bash# データベースをリセット
   npx prisma migrate reset
   npm run db:seed
2. モジュール関連エラー
   bash# 依存関係を再インストール
   rm -rf node_modules package-lock.json
   npm install
3. 認証エラー

.env ファイルの JWT_SECRET が正しく設定されているか確認
JWT_SECRET を再生成して設定し直す
ブラウザのクッキーをクリア

4. OpenAI API エラー（AI マッチング使用時）

.env の OPENAI_API_KEY が正しく設定されているか確認
API キーの先頭に余分な文字（=など）がないか確認

5. 依存関係の問題
   bash# 必要な依存関係が正しくインストールされているか確認
   npm list --depth=0

# 不足している場合は再インストール

rm -rf node_modules package-lock.json
npm install
開発環境の確認
bash# Node.js バージョン確認
node --version # v18 以上必要

# 環境変数確認

cat .env

# データベース状態確認

npx prisma studio
📁 プロジェクト構造
MatchingApp/
├── app/ # Next.js App Router
│ ├── api/ # API エンドポイント
│ ├── globals.css # グローバルスタイル
│ └── page.tsx # メインページ
├── components/ # React コンポーネント
├── prisma/ # データベース設定
│ ├── schema.prisma # DB スキーマ定義
│ └── seed.ts # サンプルデータ
├── lib/ # ユーティリティ
└── .env.example # 環境変数テンプレート
🤝 コントリビューション

このリポジトリをフォーク
フィーチャーブランチを作成 (git checkout -b feature/amazing-feature)
変更をコミット (git commit -m 'Add amazing feature')
ブランチをプッシュ (git push origin feature/amazing-feature)
プルリクエストを作成

⚠️ セキュリティ注意事項

本番環境では:

JWT_SECRET を新しく生成し直す
DATABASE_URL を本番データベースに変更
.env ファイルを Git にコミットしない（.gitignore で除外済み）

作成: Tech0-SWAT Team
