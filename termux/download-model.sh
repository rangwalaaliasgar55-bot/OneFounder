#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Download a quantized model for mobile inference
# Default: Qwen2.5-1.5B-Instruct Q4_K_M (~1GB)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODELS_DIR="$SCRIPT_DIR/models"

# Default model
MODEL_NAME="${1:-qwen2.5-1.5b-instruct}"
MODEL_FILE=""
MODEL_URL=""

mkdir -p "$MODELS_DIR"

echo "=========================================="
echo "  Download AI Model for Mobile"
echo "=========================================="
echo ""

# Model selection
case "$MODEL_NAME" in
    qwen2.5-1.5b-instruct)
        MODEL_FILE="qwen2.5-1.5b-instruct-q4_k_m.gguf"
        MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"
        echo "Model: Qwen2.5 1.5B Instruct (Q4_K_M, ~1GB)"
        echo "Best for: General chat, coding help, startup advice"
        ;;
    tinyllama)
        MODEL_FILE="tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        MODEL_URL="https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        echo "Model: TinyLlama 1.1B Chat (Q4_K_M, ~670MB)"
        echo "Best for: Fast responses, light tasks"
        ;;
    phi-2)
        MODEL_FILE="phi-2.Q4_K_M.gguf"
        MODEL_URL="https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf"
        echo "Model: Phi-2 2.7B (Q4_K_M, ~1.6GB)"
        echo "Best for: Reasoning, code generation"
        ;;
    *)
        echo "Unknown model: $MODEL_NAME"
        echo ""
        echo "Available models:"
        echo "  qwen2.5-1.5b-instruct  (default, ~1GB, recommended)"
        echo "  tinyllama               (~670MB, fastest)"
        echo "  phi-2                   (~1.6GB, best quality)"
        echo ""
        echo "Usage: bash download-model.sh [model-name]"
        exit 1
        ;;
esac

DEST="$MODELS_DIR/$MODEL_FILE"

# Check if already downloaded
if [ -f "$DEST" ]; then
    echo ""
    echo "Model already exists: $DEST"
    echo "Size: $(du -h "$DEST" | cut -f1)"
    echo ""
    echo "To re-download, delete it first: rm $DEST"
    exit 0
fi

echo ""
echo "Downloading to: $DEST"
echo "This may take 5-20 minutes depending on your connection..."
echo ""

# Download with progress
wget -q --show-progress -O "$DEST" "$MODEL_URL"

# Verify
if [ -f "$DEST" ]; then
    SIZE=$(du -h "$DEST" | cut -f1)
    echo ""
    echo "=========================================="
    echo "  Download complete!"
    echo "=========================================="
    echo ""
    echo "  File: $DEST"
    echo "  Size: $SIZE"
    echo ""
    echo "Next: Run bash start-server.sh"
else
    echo "ERROR: Download failed"
    exit 1
fi
