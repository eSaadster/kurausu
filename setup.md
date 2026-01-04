# Klaus Setup Guide

## Overview

Klaus is a WhatsApp relay that uses Baileys (WhatsApp Web protocol) to receive messages and auto-reply using Claude.

## Architecture

Klaus connects directly to WhatsApp Web via Baileys - no external bridge needed. It:
1. Maintains a WebSocket connection to WhatsApp
2. Listens for incoming messages
3. Invokes Claude CLI to generate replies
4. Sends replies back via the same connection
5. Runs periodic heartbeat checks for proactive alerts

## Service

- **tmux session**: `klaus-relay`
- **command**: `klaus relay --verbose`
- **logs**: `/tmp/klaus/klaus.log`

## Configuration

### Klaus Config (`~/.klaus/klaus.json`)
```json
{
  "inbound": {
    "allowFrom": ["+15551234567"],
    "reply": {
      "mode": "command",
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

### WhatsApp Credentials (`~/.klaus/credentials/`)
Baileys auth state stored here after login. Contains `creds.json` and signal keys.

## Commands

### Login (link WhatsApp)
```bash
# Via pairing code (easier on servers)
klaus login --phone +15551234567 --verbose

# Via QR code
klaus login --verbose
```

### Start Relay
```bash
# In tmux (recommended)
tmux new-session -d -s klaus-relay "klaus relay --verbose"

# Or via built-in tmux command
klaus relay:tmux
```

### Send a message
```bash
klaus send --to +15551234567 --message "Hello!"
```

### Check status
```bash
klaus status
```

## Monitoring

```bash
# List active sessions
tmux list-sessions

# View relay output
tmux capture-pane -t klaus-relay -p -S -50

# View log file
tail -f /tmp/klaus/klaus.log

# Attach to session (Ctrl+B, D to detach)
tmux attach -t klaus-relay
```

## Troubleshooting

### Messages not received
1. Check connection is open: look for `Connection opened successfully!` in tmux
2. Verify sender is in `allowFrom` list in config
3. Check WhatsApp shows device as linked (Settings -> Linked Devices)

### Session logged out
```bash
# Re-login
klaus login --verbose
```

### Restart relay
```bash
tmux kill-session -t klaus-relay
tmux new-session -d -s klaus-relay "klaus relay --verbose"
```

## Key Paths

| Item | Path |
|------|------|
| Klaus config | `~/.klaus/klaus.json` |
| WhatsApp credentials | `~/.klaus/credentials/` |
| Klaus logs | `/tmp/klaus/klaus.log` |
