# 構成

## 全体像

すべて自宅の Ubuntu サーバー 1 台で動かす。

```
外部ソース（公式サイト、RSS、API）
        │ 定期取得
        ▼
   collector（cron または systemd timer）
        │ 書き込み
        ▼
   PostgreSQL + PostGIS ◀── web（Astro SSR、Node.js）
                               ▲
                   cloudflared（Tunnel）
                               ▲
                          インターネット
```

## 技術

| 役割 | 採用 | 補足 |
|---|---|---|
| 言語 | Node.js、TypeScript | バージョンは mise で固定する |
| サイト | Astro | 動的なページは SSR、固定記事は Markdown から静的生成 |
| DB | PostgreSQL + PostGIS | 位置検索に PostGIS を使う |
| ORM | Drizzle | PostGIS の型を扱える |
| 地図 | MapLibre GL JS | 背景は国土地理院タイル、位置データを重ねる |
| 検索 | Pagefind と SQL | 固定記事は Pagefind、DB 内のデータは SQL |
| 抽出と要約 | Claude API | HTML から日付や場所を取り出す処理と要約に限定する |

## ディレクトリ構成（予定）

```
docs/            設計メモ
src/             Astro サイト（pages、components、DB アクセス）
content/         Markdown の固定記事（歴史、地区ガイド、年表）
collector/       収集スクリプト（ソースごとに 1 ファイル）
db/              Drizzle のスキーマとマイグレーション
deploy/          systemd や compose の雛形（プレースホルダのみ）
```

## プロセス

- web: 常駐させ、localhost だけで待ち受ける。Tunnel がここへ転送する
- collector: 定期実行する。ソースごとに取得と整形の処理を持ち、結果を DB に書き込む
- DB: localhost だけで待ち受ける。外部には公開しない

ソースを追加するときは、`collector/` に取得と整形の処理を足し、`sources` テーブルに登録する。

## DB ロール

| ロール | 権限 |
|---|---|
| app_web | 公開テーブルの読み取りと、情報提供の書き込みだけ |
| app_collector | 収集系と公開テーブルの読み書き |
| 管理用 | マイグレーション専用。普段は使わない |

## 環境依存値の扱い

- 設定は環境変数で受け取り、`.env.example` にキー名とダミー値だけを書く
- 実際の値は `.env` に書き、git には入れない
- パスはリポジトリルートからの相対パスで書く
- systemd の設定ファイルなどは、`deploy/` にプレースホルダ入りの雛形を置く。実環境用に生成したものは `deploy/local/` に置き、git には入れない
- ドキュメントやコードコメントにも、実ドメインや IP アドレスなどを書かない

## 公開時の対策

Tunnel を使っても、サイトは誰でも開ける。アプリ側で次の対策を行う。

- DB 操作はすべてパラメータ化する
- 外部から集めた文章と LLM の要約は、表示前にサニタイズする
- フォームにはスパム対策と投稿回数の制限を入れる
- 管理画面は Cloudflare Access などで保護する
- 動的でないページは Cloudflare 側でキャッシュし、レート制限を設定する
- サービスはコンテナなどで隔離し、Tunnel には公開するサービスだけを登録する
- バックアップは `pg_dump` を定期実行し、自宅の外にも保存する
- 更新が止まったことに気付けるよう、最終収集日時を表示する
