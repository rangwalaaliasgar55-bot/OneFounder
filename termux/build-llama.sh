#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Build llama.cpp for ARM Android (Termux)
# Compiles llama-server with NEON optimizations
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LLAMA_DIR="$SCRIPT_DIR/llama.cpp"
BUILD_DIR="$LLAMA_DIR/build"

echo "=========================================="
echo "  Building llama.cpp for ARM Android"
echo "=========================================="
echo ""

# Clone or update llama.cpp
if [ -d "$LLAMA_DIR" ]; then
    echo "[1/4] Updating llama.cpp..."
    cd "$LLAMA_DIR"
    git pull
else
    echo "[1/4] Cloning llama.cpp..."
    git clone --depth 1 https://github.com/ggerganov/llama.cpp.git "$LLAMA_DIR"
    cd "$LLAMA_DIR"
fi

# Create build directory
echo "[2/4] Configuring build..."
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure with ARM optimizations
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DGGML_NEON=ON \
    -DGGML_ARM_NEON=ON \
    -DLLAMA_CURL=OFF \
    -DGGML_OPENMP=OFF \
    -DCMAKE_C_FLAGS="-O3 -march=armv8-a" \
    -DCMAKE_CXX_FLAGS="-O3 -march=armv8-a"

# Build llama-server only (faster than building everything)
echo "[3/4] Building llama-server (this takes 5-15 minutes on phone)..."
cmake --build . --target llama-server -j$(nproc)

# Verify build
echo "[4/4] Verifying build..."
if [ -f "$BUILD_DIR/bin/llama-server" ]; then
    echo ""
    echo "=========================================="
    echo "  Build successful!"
    echo "=========================================="
    echo ""
    echo "  Binary: $BUILD_DIR/bin/llama-server"
    echo ""
    echo "Next: Run bash download-model.sh"
else
    echo "ERROR: Build failed — llama-server binary not found"
    exit 1
fi
