#!/usr/bin/env bash
# deploy/ の雛形から systemd の設定を deploy/local/ に生成し、登録して起動する
# 使い方: deploy/install.sh [collect|web]（省略時は両方）
set -euo pipefail

cd "$(dirname "$0")/.."
workdir=$(pwd)
user=$(id -un)
mise_shims="${MISE_DATA_DIR:-$HOME/.local/share/mise}/shims"

targets=("$@")
[ ${#targets[@]} -eq 0 ] && targets=(collect web)

declare -A units=(
  [collect]="tachikawa-collect.service tachikawa-collect.timer"
  [web]="tachikawa-web.service"
)
declare -A starts=(
  [collect]="tachikawa-collect.timer"
  [web]="tachikawa-web.service"
)

mkdir -p deploy/local
for t in "${targets[@]}"; do
  [ -n "${units[$t]:-}" ] || { echo "不明な対象: $t" >&2; exit 1; }
  for unit in ${units[$t]}; do
    sed -e "s|@USER@|$user|g" -e "s|@WORKDIR@|$workdir|g" -e "s|@MISE_SHIMS@|$mise_shims|g" \
      "deploy/$unit" > "deploy/local/$unit"
    sudo install -m 644 "deploy/local/$unit" "/etc/systemd/system/$unit"
  done
done

sudo systemctl daemon-reload
for t in "${targets[@]}"; do
  sudo systemctl enable --now "${starts[$t]}"
done
