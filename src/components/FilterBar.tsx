import { Select, Stack } from '@mantine/core';

interface Option {
  value: string;
  label: string;
}

interface Field {
  label: string;
  param: string;
  options: Option[];
  allLabel?: string;
}

interface Props {
  fields: Field[];
  // 現在のクエリ文字列（サーバー側の値を渡し、描画結果をそろえる）
  search: string;
}

const ALL = '__all__';

// 選択を変えたら、クエリ文字列を書き換えてページを読み直す
export default function FilterBar({ fields, search }: Props) {
  const params = new URLSearchParams(search);

  function change(param: string, value: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (!value || value === ALL) next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    window.location.assign(qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }

  return (
    <Stack gap="sm">
      {fields.map((f) => (
        <Select
          key={f.param}
          label={f.label}
          data={[{ value: ALL, label: f.allLabel ?? 'すべて' }, ...f.options]}
          value={params.get(f.param) ?? ALL}
          onChange={(v) => change(f.param, v)}
          allowDeselect={false}
        />
      ))}
    </Stack>
  );
}
