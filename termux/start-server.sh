#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Start OneFounder Mobile AI Server
# Launches llama-server + Ollama-compatible proxy
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LLAMA_BIN="$SCRIPT_DIR/llama.cpp/build/bin/llama-server"
MODELS_DIR="$SCRIPT_DIR/models"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# Config (override with env vars)
LLAMA_PORT="${LLAMA_PORT:-8080}"
PROXY_PORT="${PROXY_PORT:-11434}"
MODEL_NAME="${MODEL_NAME:-qwen2.5-1.5b-instruct}"
CONTEXT_SIZE="${CONTEXT_SIZE:-2048}"
THREADS="${THREADS:-$(nproc)}"
GPU_LAYERS="${GPU_LAYERS:-0}"

mkdir -p "$LOG_DIR" "$PID_DIR"

echo "=========================================="
echo "  OneFounder Mobile AI — Starting"
echo "=========================================="
echo ""

# ── Find model file ──────────────────────────────────────────
MODEL_FILE=""
for f in "$MODELS_DIR"/*.gguf; do
    [ -f "$f" ] && MODEL_FILE="$f" && break
done

if [ -z "$MODEL_FILE" ]; then
    echo "ERROR: No .gguf model found in $MODELS_DIR"
    echo "Run: bash download-model.sh"
    exit 1
fi

echo "  Model:    $MODEL_FILE"
echo "  Size:     $(du -h "$MODEL_FILE" | cut -f1)"
echo "  Threads:  $THREADS"
echo "  Context:  $CONTEXT_SIZE"
echo ""

# ── Check if already running ────────────────────────────────
if [ -f "$PID_DIR/llama.pid" ] && kill -0 "$(cat "$PID_DIR/llama.pid")" 2>/dev/null; then
    echo "llama-server is already running (PID: $(cat "$PID_DIR/llama.pid"))"
else
    # ── Start llama-server ──────────────────────────────────
    echo "[1/2] Starting llama-server on port $LLAMA_PORT..."
    "$LLAMA_BIN" \
        -m "$MODEL_FILE" \
        --host 0.0.0.0 \
        --port "$LLAMA_PORT" \
        -c "$CONTEXT_SIZE" \
        -t "$THREADS" \
        -ngl "$GPU_LAYERS" \
        --log-disable \
        > "$LOG_DIR/llama.log" 2>&1 &

    LLAMA_PID=$!
    echo "$LLAMA_PID" > "$PID_DIR/llama.pid"
    echo "  PID: $LLAMA_PID"

    # Wait for llama-server to be ready
    echo "  Waiting for model to load..."
    for i in $(seq 1 60); do
        if curl -s "http://localhost:$LLAMA_PORT/health" 2>/dev/null | grep -q '"status"'; then
            echo "  llama-server ready!"
            break
        fi
        sleep 1
        printf "  Loading... %ds\r" "$i"
    done
    echo ""
fi

# ── Start proxy server ──────────────────────────────────────
if [ -f "$PID_DIR/proxy.pid" ] && kill -0 "$(cat "$PID_DIR/proxy.pid")" 2>/dev/null; then
    echo "Proxy is already running (PID: $(cat "$PID_DIR/proxy.pid"))"
else
    echo "[2/2] Starting Ollama-compatible proxy on port $PROXY_PORT..."
    cd "$SCRIPT_DIR"
    LLAMA_PORT="$LLAMA_PORT" \
    PROXY_PORT="$PROXY_PORT" \
    MODEL_NAME="$MODEL_NAME" \
    node ollama-proxy.js > "$LOG_DIR/proxy.log" 2>&1 &

    PROXY_PID=$!
    echo "$PROXY_PID" > "$PID_DIR/proxy.pid"
    echo "  PID: $PROXY_PID"
fi

sleep 1

# ── Get phone IP ────────────────────────────────────────────
PHONE_IP=$(ip addr show wlan0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
if [ -z "$PHONE_IP" ]; then
    PHONE_IP="<check-with: ip addr show wlan0>"
fi

echo ""
echo "=========================================="
echo "  Server Running!"
echo "=========================================="
echo ""
echo "  llama-server:  http://localhost:$LLAMA_PORT"
echo "  Proxy:         http://localhost:$PROXY_PORT"
echo ""
echo "  From other devices on same WiFi:"
echo "  OLLAMA_BASE_URL=http://$PHONE_IP:$PROXY_PORT"
echo ""
echo "  OneFounder .env config:"
echo "  OLLAMA_BASE_URL=http://$PHONE_IP:$PROXY_PORT"
echo "  OLLAMA_MODEL=$MODEL_NAME"
echo ""
echo "  Logs:  $LOG_DIR/"
echo "  Stop:  bash stop-server.sh"
echo ""
