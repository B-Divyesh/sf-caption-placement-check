#!/bin/sh
set -eu

MANIFEST_URL="https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest/download/latest.json"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Darwin) PLATFORM="mac" ;;
  Linux) PLATFORM="linux" ;;
  *) echo "Unsupported system: $OS. Use the downloads page instead." >&2; exit 1 ;;
esac

curl -fsSL "$MANIFEST_URL" -o "$TMP_DIR/latest.json"
ASSET_DATA="$(python3 - "$TMP_DIR/latest.json" "$PLATFORM" "$ARCH" <<'PY'
import json, sys
manifest = json.load(open(sys.argv[1], encoding="utf-8"))
assets = manifest["platforms"][sys.argv[2]]
if isinstance(assets, dict): assets = [assets]
arch = sys.argv[3]
is_arm = arch in {"arm64", "aarch64"}
is_x64 = arch in {"x86_64", "amd64"}
if not (is_arm or is_x64):
    raise SystemExit(f"Unsupported architecture: {arch}. Use the downloads page instead.")
arch_names = ("aarch64", "arm64") if is_arm else ("x86_64", "x64", "amd64")
matching = [a for a in assets if any(name in a.get("name", "").lower() for name in arch_names)]
if sys.argv[2] == "linux":
    # A portable AppImage is safe across distros; only choose a matching architecture.
    matching = [a for a in matching if a.get("name", "").endswith(".AppImage")]
if not matching:
    raise SystemExit(f"No compatible {sys.argv[2]} build for {arch}. Use the downloads page instead.")
asset = matching[0]
print(asset["url"])
print(asset["sha256"])
print(asset["name"])
PY
)"
URL="$(printf '%s\n' "$ASSET_DATA" | sed -n '1p')"
EXPECTED="$(printf '%s\n' "$ASSET_DATA" | sed -n '2p')"
NAME="$(printf '%s\n' "$ASSET_DATA" | sed -n '3p')"
URL="$(python3 - "$URL" <<'PY'
import sys
from urllib.parse import quote
print(quote(sys.argv[1], safe=":/?=&%"))
PY
)"
curl -fL "$URL" -o "$TMP_DIR/$NAME"
if command -v sha256sum >/dev/null 2>&1; then ACTUAL="$(sha256sum "$TMP_DIR/$NAME" | awk '{print $1}')"; else ACTUAL="$(shasum -a 256 "$TMP_DIR/$NAME" | awk '{print $1}')"; fi
[ "$ACTUAL" = "$EXPECTED" ] || { echo "Checksum verification failed." >&2; exit 1; }

if [ "$PLATFORM" = "linux" ]; then
  INSTALL_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
  mkdir -p "$INSTALL_DIR"
  cp "$TMP_DIR/$NAME" "$INSTALL_DIR/caption-placement-check"
  chmod +x "$INSTALL_DIR/caption-placement-check"
  echo "Installed Caption Placement Check to $INSTALL_DIR/caption-placement-check (SHA-256 verified)."
else
  DEST="$HOME/Downloads/$NAME"
  cp "$TMP_DIR/$NAME" "$DEST"
  echo "Downloaded and verified $DEST. Opening it now; drag the app to Applications."
  open "$DEST"
fi
