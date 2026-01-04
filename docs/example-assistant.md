# Building Your Own AI Personal Assistant with Klaus

> **TL;DR:** Klaus lets you turn Claude into a proactive personal assistant that lives in your pocket via WhatsApp. It can check in on you, remember context across conversations, run commands on your computer, and more. This doc shows you how.

---

## Warning: Here Be Dragons

**This setup gives an AI full access to your computer.** Before you proceed, understand what you're signing up for:

- **`--dangerously-skip-permissions`** means Claude can run *any* shell command without asking
- **AI makes mistakes** - it might delete files, send emails, or do things you didn't intend
- **Heartbeats run autonomously** - your AI acts even when you're not watching
- **WhatsApp is not encrypted E2E here** - messages pass through your machine in plaintext

**The good news:** We use Claude Code CLI, so you can reuse your existing [Claude Pro/Max subscription](https://claude.ai) - no separate API costs!

**Start conservative:**
1. Use Sonnet instead of Opus for faster responses (still great!)
2. Skip `--dangerously-skip-permissions` until you trust the setup
3. Set `heartbeatMinutes: 0` to disable proactive pings initially
4. Use a test phone number in `allowFrom` first

This is experimental software running experimental AI. **You are responsible for what your AI does.**

---

## Prerequisites: The Two-Phone Setup

**Important:** You need a **separate phone number** for your AI assistant. Here's why and how:

### Why a Dedicated Number?

Klaus uses WhatsApp Web to receive messages. If you link your personal WhatsApp, *you* become the assistant - every message to you goes to Claude. Instead, give Claude its own identity:

- **Get a second SIM** - cheap prepaid SIM, eSIM, or old phone with a number
- **Install WhatsApp** on that phone and verify the number
- **Link to Klaus** - run `klaus login` and scan the QR with that phone's WhatsApp
- **Message your AI** - now you (and others) can text that number to reach Claude

### The Setup

```
Your Phone (personal)          Second Phone (AI)
┌─────────────────┐           ┌─────────────────┐
│  Your WhatsApp  │  ──────▶  │  AI's WhatsApp  │
│  +1-555-YOU     │  message  │  +1-555-ASSISTANT│
└─────────────────┘           └────────┬────────┘
                                       │ linked via QR
                                       ▼
                              ┌─────────────────┐
                              │  Your Computer  │
                              │  (klaus)        │
                              │  Claude Code    │
                              └─────────────────┘
```

The second phone just needs to stay on and connected to the internet occasionally (WhatsApp Web stays linked for ~14 days without the phone being online).

---

## Prerequisites

- Node 22+, `klaus` installed: `npm install -g klaus`
- Claude CLI installed and logged in:
  ```sh
  brew install anthropic-ai/cli/claude
  claude login
  ```
- Optional: set `ANTHROPIC_API_KEY` in your shell profile for non-interactive use

## Example Configuration

Here's a full-featured config (`~/.klaus/klaus.json`):

```json5
{
  logging: { level: "trace", file: "/tmp/klaus/klaus.log" },
  inbound: {
    allowFrom: ["+15551234567"],  // your phone number
    reply: {
      mode: "command",
      cwd: "~/my-assistant",              // Give your AI a workspace!
      bodyPrefix: "ultrathink ",          // Triggers extended thinking
      sessionIntro: `You are my personal AI assistant. You run 24/7 on my computer via Claude Code, receiving messages through WhatsApp.

**Your home:** ~/my-assistant - store memories, notes, and files here.

**Your powers:**
- Full shell access on this computer (use responsibly)
- Read/write files, run commands, check system status

**Your style:**
- Concise (WhatsApp ~1500 char limit) - save long content to files
- Direct and useful, not sycophantic
- Proactive during heartbeats - check battery, calendar, surprise occasionally

**Heartbeats:** Every 10 min you get "HEARTBEAT ultrathink". Reply "HEARTBEAT_OK" if nothing needs attention. Otherwise share something useful.`,
      command: [
        "claude",
        "--model", "claude-opus-4-5-20251101",   // or claude-sonnet-4-5 for faster/cheaper
        "-p",
        "--output-format", "json",
        "--dangerously-skip-permissions",        // lets Claude run commands freely
        "{{BodyStripped}}"
      ],
      session: {
        scope: "per-sender",
        resetTriggers: ["/new"],                 // say /new to start fresh
        idleMinutes: 10080,                      // 7 days of context!
        heartbeatIdleMinutes: 10080,
        sessionArgNew: ["--session-id", "{{SessionId}}"],
        sessionArgResume: ["--resume", "{{SessionId}}"],
        sessionArgBeforeBody: true,
        sendSystemOnce: true                     // intro only on first message
      },
      timeoutSeconds: 900                        // 15 min timeout for complex tasks
    }
  }
}
```

### Key Design Decisions

| Setting | Why |
|---------|-----|
| `cwd: ~/my-assistant` | Give your AI a home! It can store memories, notes, images here |
| `bodyPrefix: "ultrathink "` | Extended thinking = better reasoning on every message |
| `idleMinutes: 10080` | 7 days of context - your AI remembers conversations |
| `sendSystemOnce: true` | Intro prompt only on first message, saves tokens |
| `--dangerously-skip-permissions` | Full autonomy - Claude can run any command |

## Heartbeats: Your Proactive Assistant

This is where Klaus gets interesting. Every 10 minutes (configurable), Klaus pings Claude with:

```
HEARTBEAT ultrathink
```

Claude is instructed to reply with exactly `HEARTBEAT_OK` if nothing needs attention. That response is **suppressed** - you don't see it. But if Claude notices something worth mentioning, it sends a real message.

### What Can Heartbeats Do?

Your AI can use heartbeats to do **real work**, not just check in:

- **Monitor battery** - `pmset -g batt` (macOS) - warns <30%, critical <15%
- **Calendar** - checks upcoming meetings in next 2 hours
- **Email** - scans inbox for urgent/important unread messages
- **System health** - check disk space, running services
- **Home tidying** - occasionally cleans temp files, updates memories
- **Wake-up alarms** - triggers voice + music alarms at scheduled times
- **Surprise** - occasionally shares something fun or interesting

The key insight: heartbeats let your AI be **proactive**, not just reactive. Configure what matters to you!

### Heartbeat Config

```json5
{
  inbound: {
    reply: {
      heartbeatMinutes: 10,  // how often to ping (default 10 for command mode)
      // ... rest of config
    }
  }
}
```

Set to `0` to disable heartbeats entirely.

### Manual Heartbeat

Test it anytime:
```sh
klaus heartbeat --to +15551234567 --verbose
```

## How Messages Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│    Klaus    │────▶│   Claude    │────▶│  Your Mac   │
│  (phone)    │◀────│   relay     │◀────│   CLI       │◀────│  (commands) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Inbound**: WhatsApp message arrives via Baileys (WhatsApp Web protocol)
2. **Queue**: Klaus queues it (one Claude run at a time)
3. **Typing**: "composing" indicator shows while Claude thinks
4. **Execute**: Claude runs with full shell access in your `cwd`
5. **Parse**: Klaus extracts text + any `MEDIA:` paths from output
6. **Reply**: Response sent back to WhatsApp

## Media: Images, Voice, Documents

### Receiving Media
Inbound images/audio/video are downloaded and available as `{{MediaPath}}`. Voice notes can be auto-transcribed:

```json5
{
  inbound: {
    transcribeAudio: {
      command: ["openai", "api", "audio.transcriptions.create", "-m", "whisper-1", "-f", "{{MediaPath}}", "--response-format", "text"]
    }
  }
}
```

### Sending Media
Include `MEDIA:/path/to/file.png` in Claude's output to attach images. Klaus handles resizing and format conversion automatically.

## Starting the Relay

```sh
# Foreground (see all logs)
klaus relay --verbose

# Background in tmux (recommended)
klaus relay:tmux

# With immediate heartbeat on startup
klaus relay:heartbeat:tmux
```

## Tips for a Great Personal Assistant

1. **Give it a home** - A dedicated folder lets your AI build persistent memory
2. **Use extended thinking** - `bodyPrefix: "ultrathink "` dramatically improves reasoning
3. **Long sessions** - 7-day `idleMinutes` means rich context across conversations
4. **Let it surprise you** - Configure heartbeats to occasionally share something fun
5. **Trust but verify** - Start with `--dangerously-skip-permissions` off, add it once comfortable

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No reply | Check `claude login` was run in same environment |
| Timeout | Increase `timeoutSeconds` or simplify the task |
| Media fails | Ensure file exists and is under size limits |
| Heartbeat spam | Tune `heartbeatMinutes` or set to 0 |
| Session lost | Check `idleMinutes` hasn't expired; use `/new` to reset |

## Minimal Config (Just Chat)

Don't need the fancy stuff? Here's the simplest setup:

```json5
{
  inbound: {
    reply: {
      mode: "command",
      command: ["claude", "{{Body}}"],
      claudeOutputFormat: "text"
    }
  }
}
```

Still gets you: message queue, typing indicators, auto-reconnect. Just no sessions or heartbeats.

## MCP Servers (Optional)

MCP (Model Context Protocol) servers supercharge your assistant by giving Claude access to external services:

| MCP | What It Does | Install |
|-----|--------------|---------|
| **Google Calendar** | Read/create events, check availability | `npx @cocal/google-calendar-mcp` |
| **Gmail** | Search, read, send emails | `npx @gongrzhe/server-gmail-autoauth-mcp` |
| **Obsidian** | Read/write notes in your vault | `npx obsidian-mcp-server@latest` |
| **GitHub** | Manage repos, issues, PRs | `npx @anthropic/mcp-server-github` |

### Adding MCPs to Claude Code

```bash
# Add an MCP server
claude mcp add google-calendar -- npx @cocal/google-calendar-mcp

# With environment variables
claude mcp add gmail -e GMAIL_OAUTH_PATH=~/.gmail-mcp -- npx @gongrzhe/server-gmail-autoauth-mcp

# List configured servers
claude mcp list
```

## Useful CLI Tools

These make your AI much more capable on macOS:

| Tool | What It Does |
|------|--------------|
| **say** | Text-to-speech (built-in) |
| **afplay** | Play audio files (built-in) |
| **pmset** | Battery status (built-in) |
| **osascript** | AppleScript for system control (built-in) |

**Wake-up alarm example:**
```bash
# Generate voice message
curl -s "https://api.openai.com/v1/audio/speech" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"tts-1-hd","voice":"echo","input":"Wake up! Time for your meeting."}' \
  -o /tmp/wakeup.mp3

# Set volume and play
osascript -e 'set volume output volume 60'
afplay /tmp/wakeup.mp3
```

---

*Happy hacking!*
