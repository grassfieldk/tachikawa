# テーブル設計

## 方針

- 収集元ごとの違いを吸収し、記事、イベント、スポットの 3 種類に正規化して保存する
- 日時は timestamptz で保存し、表示時に日本時間へ変換する
- 古いお知らせや終了したイベントも削除せずに残す（街の記録として価値があるため）
- 原文の全文は保存せず、要約と原文へのリンクを持つ
- LLM で抽出した項目は、抽出方法と要確認フラグを持たせる
- 位置は `geometry(Point, 4326)` で保存する。段階 1 では NULL を許容し、後から埋める
- 距離検索は `geography` にキャストして行う。数万件程度までは、専用のインデックスなしでも問題ない
- 主キーは bigint の連番とし、すべてのテーブルに `created_at` と `updated_at` を持たせる

## 段階

| 段階 | テーブル |
|---|---|
| 1 | sources、fetch_runs、areas、articles、events、places |
| 3 | place_changes、submissions |
| 任意 | raw_documents（LLM の抽出をやり直したくなったとき） |

## 収集まわり

sources（収集元）

| 列 | 説明 |
|---|---|
| id | 主キー |
| slug | 識別名（一意） |
| name | 表示名 |
| kind | rss、html、api、manual のいずれか |
| url | 取得先の基準 URL（認証付き URL は置かない） |
| enabled | 収集するか |
| interval_minutes | 収集間隔 |
| terms_note | 利用規約やライセンスの確認結果 |
| terms_checked_on | 規約を確認した日 |

fetch_runs（収集ログ）

| 列 | 説明 |
|---|---|
| id | 主キー |
| source_id | sources への参照 |
| started_at、finished_at | 実行の開始と終了 |
| status | success、partial、failed のいずれか |
| items_seen、items_changed | 見つけた件数と、新規または変更があった件数 |
| error | 失敗時のメッセージ |

最終収集日時の表示や、更新停止の検知に使う。

raw_documents（任意、非公開）

| 列 | 説明 |
|---|---|
| id | 主キー |
| source_id、url | 取得元 |
| fetched_at | 取得日時 |
| content_hash | 内容のハッシュ |
| body | 取得した内容。保存期間を限る（例: 90 日） |

## 地区

areas

| 列 | 説明 |
|---|---|
| id | 主キー |
| code | 町丁目などのコード（一意） |
| name | 地区名 |
| kind | 町丁目、地区などの種別 |
| parent_id | 上位の地区への参照 |
| geom | `geometry(MultiPolygon, 4326)` |

境界データは e-Stat の公開データを使う。

## 公開コンテンツ

articles（お知らせ、ニュース）

| 列 | 説明 |
|---|---|
| id | 主キー |
| source_id、source_url | 取得元と原文の URL（この 2 つで一意） |
| title | 見出し |
| summary | 要約または公式の概要 |
| category | 分類 |
| published_at | 原文の公開日時 |
| content_hash | 変更の検知に使う |
| first_seen_at、last_seen_at | 初めて見つけた日時と、最後に見つけた日時 |
| extracted_by | rule、llm、manual のいずれか |
| needs_review | 人の確認が必要か |

events（イベント）

| 列 | 説明 |
|---|---|
| id | 主キー |
| source_id、source_url | 取得元と原文の URL（この 2 つで一意） |
| title、description | 名称と概要 |
| starts_at、ends_at、all_day | 開催日時 |
| venue_name、address | 会場名と住所 |
| location | `geometry(Point, 4326)`、NULL 可 |
| area_id | areas への参照、NULL 可 |
| category | 分類 |
| status | scheduled、cancelled、postponed のいずれか |
| fee_text、organizer | 料金と主催者の記載 |
| content_hash | 変更の検知に使う |
| first_seen_at、last_seen_at | 初めて見つけた日時と、最後に見つけた日時 |
| extracted_by、needs_review | articles と同じ |
| merged_into_id | 重複を統合した先の events への参照 |

終了したイベントは status を変えず、`ends_at` と現在時刻で判定する。

places（スポット、施設、店舗）

| 列 | 説明 |
|---|---|
| id | 主キー |
| name | 名称 |
| kind | shop、restaurant、facility、shelter、park などの種別 |
| category | 分類 |
| address、location、area_id | 住所と位置 |
| status | open、closed、planned、unknown のいずれか |
| opened_on、closed_on | 開店日と閉店日 |
| website_url | 公式サイト |
| source_id、external_id | 取得元とその中での ID（この 2 つで一意） |
| osm_id | OpenStreetMap の ID、NULL 可 |
| corporate_number | 法人番号、NULL 可 |
| attributes | jsonb。避難所の収容人数など、種別ごとの項目 |

place_changes（開店・閉店の情報、段階 3）

| 列 | 説明 |
|---|---|
| id | 主キー |
| place_id | places への参照。未登録の店は NULL |
| place_name | 名称の控え（未登録の店用） |
| change_type | open、close、relocate、renovate のいずれか |
| effective_on | 実施日（予定を含む）、NULL 可 |
| source_url | 情報源の URL |
| published_at | 情報の公開日 |
| confirmed | 人が確認したか。確認前は公開しない |

submissions（情報提供、段階 3、非公開）

| 列 | 説明 |
|---|---|
| id | 主キー |
| kind | event、store、other のいずれか |
| body | 内容 |
| contact | 連絡先、NULL 可 |
| status | new、accepted、rejected のいずれか |

個人情報を含み得るため公開せず、保存期間を決めて削除する。

## インデックス（主なもの）

- events: `starts_at`、`location`（GiST）
- articles: `published_at` の降順
- places: `kind` と `status`、`location`（GiST）
- areas: `geom`（GiST）
