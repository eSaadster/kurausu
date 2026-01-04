# Kurausu (Klaus CLI)

Kurausu is the open-source distribution of the Klaus WhatsApp relay. It connects to WhatsApp Web via Baileys to send, receive, and auto-reply messages, with optional agent mode for richer workflows.

## Features

- WhatsApp send/receive via Baileys (no Twilio required).
- Auto-reply using static text, CLI commands, or built-in pi-agent.
- Heartbeat polling for proactive alerts.
- Admin console with MCP endpoint for automation.
- Skills + scratchpad system for agent workflows.

## Requirements

- Node.js 22+.
- A WhatsApp account (dedicated account recommended for automation).

## Setup

### Option A: Install globally

```bash
npm install -g klaus
# or
pnpm add -g klaus
```

### Option B: Run from source

```bash
git clone https://github.com/eSaadster/kurausu
cd kurausu
pnpm install
pnpm build
pnpm klaus --help
```

## Quick Start

### Link your WhatsApp

```bash
klaus login --verbose
# or pairing code (easier on servers)
klaus login --phone +15551234567 --verbose
```

### Send a message

```bash
klaus send --to +15551234567 --message "Hello from Kurausu"
```

### Start the relay

```bash
klaus relay --verbose
```

## CLI Commands

| Command | Description | Key Flags |
|---------|-------------|-----------|
| `klaus login` | Link WhatsApp via QR or pairing code | `--phone <number>` `--verbose` |
| `klaus logout` | Clear stored credentials | `--yes` |
| `klaus send` | Send a WhatsApp message | `--to <e164>` `--message <text>` `--media <path>` |
| `klaus relay` | Auto-reply loop | `--verbose` `--heartbeat-now` |
| `klaus relay:tmux` | Run relay in tmux session | |
| `klaus status` | Show authentication status | `--json` |
| `klaus heartbeat` | Trigger one heartbeat poll | `--to <e164>` `--all` |
| `klaus admin` | Start admin console | `--port <number>` `--host <address>` `--read-only` |

## Configuration

Configuration is stored in `~/.klaus/klaus.json` (JSON5 format).

### Minimal config (command mode)

```json5
{
  inbound: {
    allowFrom: ["+15551234567"],
    reply: {
      mode: "command",
      command: ["claude", "{{BodyStripped}}"],
      session: { scope: "per-sender", resetTriggers: ["/new"] }
    }
  }
}
```

### Pi-agent config example

```json5
{
  inbound: {
    allowFrom: ["+15551234567"],
    reply: {
      mode: "pi-agent",
      piAgentModel: "claude-haiku-4-5",
      piAgentThinkingLevel: "minimal",
      session: { scope: "per-sender", resetTriggers: ["/new"], idleMinutes: 720 }
    }
  }
}
```

Pi-agent sessions store scratchpads under `~/klaus/whatsapp/<session>/scratchpad/`. Set `USE_ENTITY_MEMORY=true` to enable entity-based memory extraction.

### Templating

Supported tokens:
- `{{Body}}` - Full message body
- `{{BodyStripped}}` - Body without leading/trailing whitespace
- `{{From}}` - Sender's phone number
- `{{To}}` - Recipient's phone number
- `{{SessionId}}` - Current session ID
- `{{IsNewSession}}` - "true" or "false"

### Voice note transcription

```json5
{
  inbound: {
    transcribeAudio: {
      command: ["openai", "api", "audio.transcriptions.create", "-m", "whisper-1", "-f", "{{MediaPath}}", "--response-format", "text"],
      timeoutSeconds: 45
    },
    reply: { mode: "command", command: ["claude", "{{Body}}"] }
  }
}
```

### Logging

```json5
{
  logging: {
    level: "warn",
    file: "/tmp/klaus/klaus.log"
  }
}
```

## Admin Console + MCP

Start the admin console:

```bash
klaus admin --port 3847
```

- Web UI: `http://127.0.0.1:3847/admin`
- MCP endpoint: `http://127.0.0.1:3847/admin/mcp`

Global MCP config lives at `config/mcporter.json`. Session-level config is `~/klaus/whatsapp/<session>/mcporter.json`.

## Skills

Skills are convention-based folders:
- Global: `~/klaus/whatsapp/skills/`
- Per-session: `~/klaus/whatsapp/<session>/skills/`

An example bundle is included under `examples/session/{session_id}/skills`.

## Media Sending

```bash
klaus send --to +15551234567 --message "Check this out" --media ./photo.jpg
```

Limits:
- Images: up to 6MB (auto-resized)
- Audio/Video: up to 16MB
- Documents: up to 100MB

## Heartbeat (Proactive Alerts)

When `heartbeatMinutes` is configured, Klaus periodically runs your command/agent with a heartbeat prompt. If the result is `HEARTBEAT_OK`, the reply is suppressed.

```bash
klaus heartbeat --to +15551234567
klaus heartbeat --all
```

## Key Paths

| Item | Path |
|------|------|
| Config | `~/.klaus/klaus.json` |
| Credentials | `~/.klaus/credentials/` |
| Sessions | `~/.klaus/sessions.json` |
| Logs | `/tmp/klaus/klaus.log` |

## Troubleshooting

- Session logged out: `klaus login --verbose`
- Messages not received: verify relay is running and sender is in `allowFrom`.
- Restart relay: `tmux kill-session -t klaus-relay` then `klaus relay:tmux`.

## Safety Notes

- WhatsApp may rate-limit or log out automated accounts. Keep message volume reasonable.
- Dedicated WhatsApp accounts are strongly recommended for automation.
- Group chats are not supported in this repo.

## License

MIT
