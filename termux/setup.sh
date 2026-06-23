#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# OneFounder Mobile AI Server — Termux Setup
# Run this ONCE on your Android phone in Termux
# ============================================================

set -e

echo "=========================================="
echo "  OneFounder Mobile AI — Termux Setup"
echo "=========================================="
echo ""

# Update packages
echo "[1/5] Updating Termux packages..."
pkg update -y && pkg upgrade -y

# Install required packages
echo "[2/5] Installing dependencies..."
pkg install -y nodejs git cmake clang make wget

# Verify installations
echo "[3/5] Verifying installations..."
echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"
echo "  git:     $(git --version)"
echo "  cmake:   $(cmake --version | head -1)"
echo "  clang:   $(clang --version | head -1)"

# Install Node.js dependencies for the proxy server
echo "[4/5] Installing Node.js dependencies..."
cd "$(dirname "$0")"
npm install

# Request storage permissions (for model downloads)
echo "[5/5] Requesting storage access..."
termux-setup-storage 2>/dev/null || echo "  (storage permission skipped — run termux-setup-storage manually if needed)"

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run: bash build-llama.sh"
echo "  2. Run: bash download-model.sh"
echo "  3. Run: bash start-server.sh"
echo ""
