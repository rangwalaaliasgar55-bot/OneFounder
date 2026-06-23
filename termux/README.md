# OneFounder Mobile AI Server

Run your own AI model on your Android phone via Termux. Your phone becomes an AI server that OneFounder connects to over WiFi — zero cost, full privacy, no cloud dependency.

## What This Does

```
Your Phone (Termux)
├── llama-server (port 8080)    ← Runs the AI model
└── ollama-proxy (port 11434)   ← Ollama-compatible API
        ↑
OneFounder (anywhere on WiFi) connects here
```

**OneFounder needs zero code changes** — just set `OLLAMA_BASE_URL` to your phone's IP.

## Requirements

- Android phone with **4GB+ RAM** (6GB+ recommended)
- **Termux** installed from [F-Droid](https://f-droid.org/packages/com.termux/) (NOT Play Store — that version is broken)
- ~2GB free storage for model + build tools
- Phone and OneFounder server on the **same WiFi network**

## Quick Start (4 commands)

Open Termux on your phone and run:

```bash
# 1. Install everything
bash setup.sh

# 2. Build llama.cpp (5-15 minutes)
bash build-llama.sh

# 3. Download AI model (~1GB, 5-20 minutes)
bash download-model.sh

# 4. Start the server!
bash start-server.sh
```

That's it! The server is now running.

## Step-by-Step Instructions

### Step 1: Install Termux

1. Go to [F-Droid](https://f-droid.org/packages/com.termux/) and install Termux
2. Open Termux and grant storage permission when prompted
3. Clone or copy this `termux/` folder to your phone

**Get the files onto your phone:**
```bash
# In Termux, clone the repo:
pkg install git
git clone https://github.com/rangwalaaliasgar55-bot/OneFounder.git
cd OneFounder/termux
```

Or copy via USB/ADB:
```bash
adb push termux/ /data/data/com.termux/files/home/OneFounder/termux/
```

### Step 2: Run Setup

```bash
bash setup.sh
```

This installs: Node.js, git, cmake, clang, make, wget, and npm dependencies.

### Step 3: Build llama.cpp

```bash
bash build-llama.sh
```

Compiles llama.cpp with ARM NEON optimizations. Takes 5-15 minutes on phone.

### Step 4: Download Model

```bash
# Default (recommended): Qwen2.5 1.5B (~1GB)
bash download-model.sh

# Or choose a different model:
bash download-model.sh tinyllama    # Smaller, faster (~670MB)
bash download-model.sh phi-2        # Better quality (~1.6GB)
```

### Step 5: Start Server

```bash
bash start-server.sh
```

You'll see:
```
==========================================
  Server Running!
==========================================

  From other devices on same WiFi:
  OLLAMA_BASE_URL=http://192.168.1.XXX:11434

  OneFounder .env config:
  OLLAMA_BASE_URL=http://192.168.1.XXX:11434
  OLLAMA_MODEL=qwen2.5-1.5b-instruct
```

### Step 6: Connect OneFounder

In your OneFounder project, set these in `.env`:

```env
OLLAMA_BASE_URL=http://192.168.1.XXX:11434
OLLAMA_MODEL=qwen2.5-1.5b-instruct
```

Replace `192.168.1.XXX` with your phone's actual IP (shown when you start the server).

Restart OneFounder and the AI chat will use your phone's model!

## Managing the Server

```bash
# Start
bash start-server.sh

# Stop
bash stop-server.sh

# Check if running
curl http://localhost:11434/api/tags

# View logs
cat logs/llama.log
cat logs/proxy.log
```

## Model Comparison

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `qwen2.5-1.5b-instruct` | ~1GB | 10-20 tok/s | Good | General chat, startup advice |
| `tinyllama` | ~670MB | 15-25 tok/s | Basic | Fast responses, simple tasks |
| `phi-2` | ~1.6GB | 8-15 tok/s | Better | Reasoning, code generation |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLAMA_PORT` | `8080` | llama-server port |
| `PROXY_PORT` | `11434` | Ollama-compatible proxy port |
| `MODEL_NAME` | `qwen2.5-1.5b-instruct` | Model name for API responses |
| `CONTEXT_SIZE` | `2048` | Context window (lower = faster, less RAM) |
| `THREADS` | `$(nproc)` | CPU threads to use |
| `GPU_LAYERS` | `0` | GPU layers (0 = CPU only) |

Example:
```bash
CONTEXT_SIZE=1024 THREADS=4 bash start-server.sh
```

## Troubleshooting

### "Model is loading" error
The model takes 10-30 seconds to load into memory. Wait and retry.

### Phone IP changes after router restart
Find new IP: `ip addr show wlan0 | grep inet`

### Out of memory
Reduce context size: `CONTEXT_SIZE=1024 bash start-server.sh`

### Slow responses
- Use `tinyllama` model (fastest)
- Reduce context: `CONTEXT_SIZE=512`
- Close other apps on phone

### Can't connect from PC
- Make sure phone and PC are on same WiFi
- Check phone firewall (some routers block inter-device traffic)
- Test from phone first: `curl http://localhost:11434/api/tags`

### Termux killed in background
Android may kill Termux to save battery:
1. Disable battery optimization for Termux
2. Acquire Termux wakelock: `termux-wake-lock`
3. Or run in Termux:Notification mode

## Architecture

```
┌──────────────────────────────────────┐
│  ollama-proxy.js (Express server)    │
│  Port 11434                          │
│                                      │
│  GET  /api/tags   → model listing    │
│  POST /api/chat   → chat completion  │
│  POST /api/generate → text gen       │
└──────────────┬───────────────────────┘
               │ HTTP
               ▼
┌──────────────────────────────────────┐
│  llama-server (llama.cpp binary)     │
│  Port 8080                           │
│                                      │
│  POST /completion → inference        │
│  GET  /health     → status           │
└──────────────────────────────────────┘
```

The proxy translates Ollama API format to llama.cpp format, so OneFounder's existing `OllamaProvider` works without any code changes.
