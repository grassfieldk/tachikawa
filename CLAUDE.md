# tachikawa

東京都立川市の情報を集めたポータルサイト。自宅の Ubuntu サーバーで PostgreSQL と Astro を動かし、Cloudflare Tunnel で公開する。設計は `docs/` を参照する。

## コミットしてはいけないもの

- API キー、パスワード、トークン（Cloudflare Tunnel のトークンを含む）
- 絶対パス、ホスト名、ドメイン、IP アドレス、ユーザー名などの環境依存値
- DB のダンプや、収集した生データ

設定は環境変数で受け取り、`.env.example` にはキー名とダミー値だけを書く。パスはリポジトリルートからの相対パスで書く。ドキュメントやコードコメントにも、実環境の値を書かない。

## ブランチ

作業用ブランチは作らず、`main` を使う。コミットと push は、ユーザーが指示するまで行わない。

## 開発環境

Node.js などのツールは mise で管理する。

## 開発コマンド

- `npm install`: 依存の取得
- `npm run dev`: 開発サーバー
- `npm run check`: 型チェック
- `npm run build` と `npm run start`: 本番ビルドと起動（待ち受けは環境変数 `HOST` と `PORT` で指定）

表示しているデータは `src/data/` のダミーデータ。データの取り出し口は `src/data/index.ts` に集約している。
