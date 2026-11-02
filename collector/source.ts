// 情報源の定義
import type { Db } from '../db/client';
import type { SourceKind } from '../src/data/types';

export interface CollectResult {
  seen: number;
  changed: number;
  // 一部の項目を取り込めなかったときの内容
  warning?: string;
}

export interface SourceDefinition {
  slug: string;
  name: string;
  kind: SourceKind;
  url: string;
  intervalMinutes: number;
  termsNote: string;
  // YYYY-MM-DD
  termsCheckedOn: string;
  // 取得元の内容のハッシュ。定義すると、前回収集したときと同じ内容なら収集せず、fetch_runs にも記録しない
  contentHash?(): Promise<string>;
  collect(db: Db, sourceId: number): Promise<CollectResult>;
}
