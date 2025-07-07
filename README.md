# Student Matching App - 完全セットアップ情報

**GitHubリポジトリ:** https://github.com/Tech0-SWAT/MatchingApp

## 🏗️ アーキテクチャ
**フルスタック Next.js アプリケーション（学生マッチングアプリ）**

* **フロントエンド**: Next.js 14 + React + TypeScript
* **バックエンド**: Next.js API Routes（同一プロジェクト内）
* **データベース**: Prisma ORM + SQLite（開発環境）
* **UI**: Tailwind CSS + Radix UI + shadcn/ui
* **認証**: bcryptjs + JSON Web Token (JWT)
* **AI機能**: OpenAI API（自動フォールバック対応）

## 🚀 セットアップ手順

```bash
# リポジトリクローン
git clone https://github.com/Tech0-SWAT/MatchingApp.git
cd MatchingApp

# 依存関係インストール
npm install

# Prismaセットアップ
npx prisma generate
npx prisma db push

# シードデータ投入（オプション）
npm run db:seed

# 開発サーバー起動
npm run dev
```

**アクセス:** http://localhost:3000

## 📝 環境変数ファイル（.env）
プロジェクトルートに作成: `MatchingApp/.env`

```bash
# Environment variables declared in this file are automatically made available to Prisma.

# SQLite database connection URL (for local development)
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-12345

# OpenAI API Key for matching functionality
# APIキーが設定されている場合は自動的にOpenAI APIを使用
# API制限やエラー時は自動的にハードコードマッチングにフォールバック
OPENAI_API_KEY=your-openai-api-key-here

# ====== 以前のデータベース設定（保存用） ======
# Azure MySQL (現在は使用停止)
# DATABASE_URL="mysql://tech0admin:Soarainori1@mysql-stmatching1.mysql.database.azure.com:3306/team_matching_system"
```

## 🎯 重要な修正情報
**最新修正 (2025/7/8)**: ページリロード時のログアウト問題を解決済み
- 認証チェックAPIのPrismaフィールド名修正
- 認証エンドポイントの `/api/auth/` 配下への統一
- 認証状態の永続化改善

## 📁 主要ディレクトリ構造

```
MatchingApp/
├── app/
│   ├── api/                    # API エンドポイント
│   │   ├── auth/              # 認証関連API
│   │   ├── matching/          # マッチング機能API
│   │   ├── profile/           # プロフィール管理API
│   │   └── users/             # ユーザー管理API
│   ├── globals.css            # グローバルスタイル
│   ├── layout.tsx             # ルートレイアウト
│   └── page.tsx               # メインページ
├── components/
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── login-screen.tsx       # ログイン画面
│   ├── profile-setup-screen.tsx # プロフィール設定
│   ├── search-results-screen.tsx # 検索結果画面
│   └── team-management-screen.tsx # チーム管理画面
├── prisma/
│   ├── dev.db                 # SQLite データベース
│   ├── schema.prisma          # データベーススキーマ
│   └── seed.ts                # シードデータ
└── lib/
    ├── prisma.ts              # Prisma クライアント
    └── utils.ts               # ユーティリティ関数
```

## 🔧 利用可能なコマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# データベースシード実行
npm run db:seed

# Prisma Studio起動（データベース管理UI）
npx prisma studio
```

## 🎨 主要機能

- ✅ **ユーザー認証**: ログイン/ログアウト/新規登録
- ✅ **プロフィール管理**: スキル、経験、希望役割の設定
- ✅ **学生マッチング**: OpenAI APIによる高精度マッチング
- ✅ **チーム管理**: チーム作成・参加・管理
- ✅ **レスポンシブUI**: モバイル/デスクトップ対応

## 🔑 認証機能

- **JWT認証**: HTTPOnlyクッキーベース
- **パスワードハッシュ化**: bcryptjs使用
- **セッション管理**: ページリロード対応
- **認証エンドポイント**: `/api/auth/*`

## 🤖 AI マッチング機能

- **OpenAI API統合**: GPT-4ベースの高精度マッチング
- **自動フォールバック**: API制限時にハードコードマッチング
- **カスタムアルゴリズム**: スキル、経験、性格を総合評価

## 🗄️ データベース

- **SQLite**: 軽量で設定不要
- **Prisma ORM**: 型安全なデータベース操作
- **マイグレーション**: スキーマ変更の履歴管理
- **シードデータ**: 開発用テストデータ自動投入

## 🚨 注意事項

1. **データベースパス**: 環境に応じて `DATABASE_URL` を調整
2. **OpenAI APIキー**: 必須ではないが、高精度マッチングには必要
3. **JWT_SECRET**: 本番環境では強力なシークレットキーに変更
4. **Node.js**: v18以上推奨

## 🆘 トラブルシューティング

**データベース接続エラー**:
```bash
npx prisma db push
npx prisma generate
```

**依存関係エラー**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**認証エラー**:
- `.env` ファイルの `JWT_SECRET` を確認
- ブラウザのクッキーをクリア

---

**作成日**: 2025年7月7日  
**最終更新**: 認証システム修正完了時点