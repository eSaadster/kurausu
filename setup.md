# WaRelay Setup Guide

## Overview

WaRelay is a WhatsApp relay that uses Baileys (WhatsApp Web protocol) to receive messages and auto-reply using Claude.

## Architecture

WaRelay connects directly to WhatsApp Web via Baileys - no external bridge needed. It:
1. Maintains a WebSocket connection to WhatsApp
2. Listens for incoming messages
3. Invokes Claude CLI to generate replies
4. Sends replies back via the same connection
5. Runs periodic heartbeat checks for proactive alerts

## Service

- **tmux session**: `warelay-relay`
- **directory**: `/home/clawd/warelay`
- **command**: `npx tsx src/index.ts relay --verbose`
- **logs**: `/tmp/warelay/warelay.log`

## Configuration

### WaRelay Config (`~/.warelay/warelay.json`)
```json
{
  "inbound": {
    "allowFrom": ["+17206598123"],
    "reply": {
      "mode": "command",
      "cwd": "/home/clawd/scratchpad",
      "command": ["claude", "--dangerously-skip-permissions", "--model", "haiku", "{{BodyStripped}}"],
      "bodyPrefix": "You are a helpful WhatsApp assistant.\n\n",
      "session": {
        "scope": "per-sender",
        "resetTriggers": ["/new"],
        "idleMinutes": 60
      },
      "heartbeatMinutes": 10
    }
  }
}
```

### WhatsApp Credentials (`~/.warelay/credentials/`)
Baileys auth state stored here after login. Contains `creds.json` and signal keys.

## Commands

### Login (link WhatsApp)
```bash
# Via pairing code (easier on servers)
npx tsx src/index.ts login --phone +923135756673 --verbose

# Via QR code
npx tsx src/index.ts login --verbose
```

### Start Relay
```bash
# In tmux (recommended)
tmux new-session -d -s warelay-relay "npx tsx src/index.ts relay --verbose"

# Or via built-in tmux command
npx tsx src/index.ts relay:tmux
```

### Send a message
```bash
npx tsx src/index.ts send --to +17206598123 --message "Hello!"
```

### Check status
```bash
npx tsx src/index.ts status
```

## Monitoring

```bash
# List active sessions
tmux list-sessions

# View relay output
tmux capture-pane -t warelay-relay -p -S -50

# View log file
tail -f /tmp/warelay/warelay.log

# Attach to session (Ctrl+B, D to detach)
tmux attach -t warelay-relay
```

## Troubleshooting

### Messages not received
1. Check connection is open: look for `Connection opened successfully!` in tmux
2. Verify sender is in `allowFrom` list in config
3. Check WhatsApp shows device as linked (Settings → Linked Devices)

### Session logged out
```bash
# Re-login
npx tsx src/index.ts login --phone +923135756673 --verbose
```

### Restart relay
```bash
tmux kill-session -t warelay-relay
tmux new-session -d -s warelay-relay "npx tsx src/index.ts relay --verbose"
```

## Key Paths

| Item | Path |
|------|------|
| WaRelay source | `/home/clawd/warelay/src/` |
| WaRelay config | `~/.warelay/warelay.json` |
| WhatsApp credentials | `~/.warelay/credentials/` |
| WaRelay logs | `/tmp/warelay/warelay.log` |
| Claude scratchpad | `/home/clawd/scratchpad` |
