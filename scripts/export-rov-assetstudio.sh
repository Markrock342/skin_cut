#!/usr/bin/env bash
# Export Texture2D/Sprite จาก APK ที่แตกแล้ว ด้วย AssetStudioMod CLI (Wine)
# ครั้งแรก: ดาวน์โหลด CLI อัตโนมัติ (~10MB)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${SRC:-$ROOT/scratch/apk-rov-device/unpacked/assets}"
OUT="${OUT:-$ROOT/scratch/rov-frames-export}"
TOOLS="$ROOT/scratch/tools"
CLI_DIR="$TOOLS/AssetStudioModCLI_win/AssetStudioModCLI_net472_win32_64"
CLI_ZIP_URL="https://github.com/aelurum/AssetStudio/releases/download/v0.19.0/AssetStudioModCLI_net472_win32_64.zip"
FILTER="${FILTER:-frame,avatar,profile,lobby,head,border,title,decorate,ornament}"
EXPORT_ALL="${EXPORT_ALL:-0}"

if ! command -v wine >/dev/null 2>&1; then
  echo "ต้องมี wine — brew install --cask wine-stable"
  exit 1
fi

if [[ ! -d "$SRC" ]]; then
  echo "ไม่พบ $SRC — รันก่อน: npm run extract:rov:from-phone"
  exit 1
fi

if [[ ! -f "$CLI_DIR/AssetStudioModCLI.exe" ]]; then
  echo "ดาวน์โหลด AssetStudioMod CLI…"
  mkdir -p "$TOOLS"
  curl -sL -o "$TOOLS/AssetStudioModCLI_win.zip" "$CLI_ZIP_URL"
  unzip -o -q "$TOOLS/AssetStudioModCLI_win.zip" -d "$TOOLS/AssetStudioModCLI_win"
fi

mkdir -p "$OUT"
cd "$CLI_DIR"

ARGS=( "$SRC" -m export -t tex2d,sprite -o "$OUT" --image-format png -g none --log-level warning )
if [[ "$EXPORT_ALL" == "1" ]]; then
  echo "Export ทุก texture ที่อ่านได้จาก APK…"
else
  echo "Export เฉพาะชื่อที่ตรง filter: $FILTER"
  ARGS+=( --filter-by-text "$FILTER" )
fi

WINEDEBUG=-all wine AssetStudioModCLI.exe "${ARGS[@]}"

COUNT=$(find "$OUT" -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "เสร็จ — PNG $COUNT ไฟล์ → $OUT"
echo "หมายเหตุ: กรอบโปรไฟล์ ROV มักอยู่ใน game_resources (เข้ารหัส) — ไฟล์ที่ได้อาจเป็นแค่ UI Unity ทั่วไป"
