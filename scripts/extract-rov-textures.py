#!/usr/bin/env python3
"""
Export Unity Texture2D / Sprite จาก APK ที่แตกแล้ว (Mac / CLI — ไม่ต้องใช้ AssetStudio GUI)

ติดตั้งครั้งเดียว:
  pip3 install UnityPy Pillow

Usage:
  python3 scripts/extract-rov-textures.py
  python3 scripts/extract-rov-textures.py --src=scratch/apk-rov-device/unpacked/assets
  python3 scripts/extract-rov-textures.py --filter=frame,avatar,profile,border,lobby,head
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / "scratch" / "apk-rov-device" / "unpacked" / "assets"
DEFAULT_OUT = ROOT / "scratch" / "rov-textures-export"

SKIP_SUFFIXES = (
    ".meta",
    ".html",
    ".json",
    ".ini",
    ".cfg",
    ".dll",
    ".so",
    ".otf",
    ".zip",
    ".tsb",
    ".dat",
    ".bytes",
    ".config",
    ".png",  # raw png/atlas — ไม่ใช่ Unity serialized (ยกเว้นโหลดแยก)
)

SKIP_PARTS = (
    "/GCloudVoice/",
    "/centauri_",
    "/dexopt/",
    "/Managed/",
)


def safe_name(name: str, fallback: str) -> str:
    n = (name or "").strip() or fallback
    n = re.sub(r"[^\w.\-]+", "_", n)
    return n[:120] or fallback


def iter_load_paths(src: Path) -> list[Path]:
    paths: list[Path] = []
    data_dir = src / "bin" / "Data"
    if data_dir.is_dir():
        paths.append(data_dir)

    ab = src / "assetbundle"
    if ab.is_dir():
        for f in ab.rglob("*"):
            if f.is_file() and f.suffix.lower() in (".assetbundle", ""):
                if f.name.endswith(".assetbundle") or f.suffix == "":
                    paths.append(f)

    for f in src.iterdir():
        if f.is_file() and f.suffix.lower() == ".assetbundle":
            paths.append(f)

    return paths


def should_skip_file(path: Path) -> bool:
    s = str(path)
    if any(p in s for p in SKIP_PARTS):
        return True
    low = path.suffix.lower()
    if low in SKIP_SUFFIXES and "assetbundle" not in path.name:
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Export ROV Unity textures (CLI)")
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--filter",
        default="frame,avatar,profile,border,lobby,head,title,decorate,ornament,portrait",
        help="คำค้นในชื่อ (คั่นด้วย comma) ว่าง = export ทั้งหมด",
    )
    parser.add_argument("--all", action="store_true", help="export ทุก texture ไม่กรองชื่อ")
    args = parser.parse_args()

    src: Path = args.src if args.src.is_absolute() else ROOT / args.src
    out: Path = args.out if args.out.is_absolute() else ROOT / args.out

    if not src.is_dir():
        print(f"ไม่พบโฟลเดอร์: {src}", file=sys.stderr)
        print("รันก่อน: npm run extract:rov:from-phone", file=sys.stderr)
        return 1

    try:
        import UnityPy
        from PIL import Image
    except ImportError:
        print("ติดตั้ง: pip3 install UnityPy Pillow", file=sys.stderr)
        return 1

    keywords = [] if args.all else [k.strip().lower() for k in args.filter.split(",") if k.strip()]
    out.mkdir(parents=True, exist_ok=True)

    load_paths = iter_load_paths(src)
    if not load_paths:
        print(f"ไม่พบ bin/Data หรือ assetbundle ใต้ {src}", file=sys.stderr)
        return 1

    exported = 0
    skipped_encrypt = 0
    errors = 0

    for load_path in load_paths:
        label = load_path.relative_to(src) if load_path.is_relative_to(src) else load_path.name
        print(f"Scan: {label}")
        try:
            env = UnityPy.load(str(load_path))
        except Exception as e:
            msg = str(e)
            if "encrypted" in msg.lower() or "decrypt" in msg.lower():
                skipped_encrypt += 1
                print(f"  skip (encrypted bundle): {load_path.name}")
            else:
                errors += 1
                print(f"  skip: {e}")
            continue

        for obj in env.objects:
            if obj.type.name not in ("Texture2D", "Sprite"):
                continue
            try:
                data = obj.read()
                name = getattr(data, "m_Name", "") or f"{obj.type.name}_{obj.path_id}"
                if keywords and not any(k in name.lower() for k in keywords):
                    continue
                img = data.image
                if img is None:
                    continue
                sub = "matched" if keywords else "all"
                dest = out / sub / f"{safe_name(name, str(obj.path_id))}.png"
                dest.parent.mkdir(parents=True, exist_ok=True)
                img.save(dest)
                exported += 1
            except Exception:
                errors += 1

    print(f"\nDone — exported: {exported} → {out}")
    if skipped_encrypt:
        print(
            f"Encrypted bundles skipped: {skipped_encrypt} "
            "(กรอบโปรไฟล์มักอยู่ใน game_resources / bundle เข้ารหัส — ต้อง AssetStudio+Wine หรือ screenshot)"
        )
    if exported == 0:
        print(
            "\nไม่มีรูปที่ตรง filter — ลอง:\n"
            "  python3 scripts/extract-rov-textures.py --all\n"
            "หรือโหลด game_resources ด้วย AssetStudio (Wine)"
        )
    return 0 if exported else 2


if __name__ == "__main__":
    raise SystemExit(main())
