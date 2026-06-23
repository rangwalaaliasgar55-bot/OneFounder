#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Stop OneFounder Mobile AI Server
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

echo "=========================================="
echo "  Stopping OneFounder Mobile AI"
echo "=========================================="
echo ""

# Stop proxy
if [ -f "$PID_DIR/proxy.pid" ]; then
    PID=$(cat "$PID_DIR/proxy.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "  Stopped proxy (PID: $PID)"
    else
        echo "  Proxy was not running"
    fi
    rm -f "$PID_DIR/proxy.pid"
else
    echo "  No proxy PID file found"
fi

# Stop llama-server
if [ -f "$PID_DIR/llama.pid" ]; then
    PID=$(cat "$PID_DIR/llama.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "  Stopped llama-server (PID: $PID)"
    else
        echo "  llama-server was not running"
    fi
    rm -f "$PID_DIR/llama.pid"
else
    echo "  No llama-server PID file found"
fi

# Clean up any stray processes
pkill -f "llama-server" 2>/dev/null && echo "  Cleaned up stray llama-server"
pkill -f "ollama-proxy" 2>/dev/null && echo "  Cleaned up stray proxy"

echo ""
echo "  All stopped."
echo ""
