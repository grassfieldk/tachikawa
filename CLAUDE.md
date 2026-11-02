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
- `npm run dev`: 開発サーバー（ローカルネットワーク内からもアクセスできる）
- `npm run check`: 型チェック
- `npm run build` と `npm run start`: 本番ビルドと起動（待ち受けは環境変数 `HOST` と `PORT` で指定）
- `npm run db:generate`: `db/schema.ts` の変更からマイグレーションを作る
- `npm run db:migrate`: マイグレーションを DB に適用する
- `npm run db:seed`: DB のデータを収集したものも含めて消し、`db/dummy.ts` のダミーデータを入れ直す
- `npm run collect`: 収集間隔を過ぎた情報源を収集する。`npm run collect -- <slug>` で指定した情報源をすぐに収集する
- `deploy/install.sh [collect|web]`: `deploy/` の雛形から systemd の設定を `deploy/local/` に生成し、登録して起動する。collect は 5 分ごとの timer で `npm run collect` を実行し、web は `npm run start` を常駐させる（事前に `npm run build` が必要）

DB の接続先は `.env` の `DATABASE_URL_WEB`（サイト用、読み取り専用）と `DATABASE_URL_ADMIN`（マイグレーションと投入用）で指定する。

画面は React と Mantine で作る。見た目は Mantine の部品と標準のテーマに任せ、独自の CSS は書かない。

- `src/pages/`: データを取得し、`src/views/` の画面に渡すだけにする
- `src/views/`: ページごとの画面（React）
- `src/components/`: 画面で共通に使う部品（React）
- `src/lib/views.ts`: 画面に渡す形へデータを整える。現在時刻に依存する判定はここで済ませ、ブラウザ側では計算しない

画面の文言は事実だけを簡潔に書き、キャッチコピーのような表現は使わない。

収集処理は `collector/` にあり、情報源ごとの定義を `collector/sources/` に置いて `collector/run.ts` の一覧に加える。お知らせは立川市公式サイトの RSS から収集し、それ以外は `db/dummy.ts` のダミーデータ。画面は `src/data/index.ts` の関数だけを通して DB を読む。
