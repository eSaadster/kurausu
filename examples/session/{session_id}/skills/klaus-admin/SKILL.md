---
name: klaus-admin
description: Self-administration capabilities via the klaus-admin MCP server. Allows Klaus to manage sessions, configs, MCP servers, and poke other sessions programmatically.
---

# Klaus Admin MCP

This skill provides access to the klaus-admin MCP server, which exposes all admin console operations as MCP tools. This gives Klaus the ability to self-modify configurations, manage sessions, and interact with other Klaus instances.

## Connecting to klaus-admin

The server is available via MCP:
```
mcp action="list-servers"
→ klaus-admin, twitter, reddit, ...

mcp action="list-tools" server="klaus-admin"
→ [all available tools]
```

## Tool Categories

### 1. Dashboard Tools

Get system-wide status and health information.

| Tool | Description |
|------|-------------|
| `get_dashboard` | Overview of all sessions, MCP servers, clicks, and grips |
| `health_check` | Check if admin server is healthy |
| `reload_config` | Signal Klaus to reload its configuration |

**Examples:**
```
mcp action="call" server="klaus-admin" tool="get_dashboard"
→ {
    "mcpCount": 4,
    "clicksCount": 3,
    "clicksEnabled": 2,
    "gripsActive": 0,
    "sessionsCount": 2,
    "sessions": [{"name": "@17206598123", ...}]
  }

mcp action="call" server="klaus-admin" tool="reload_config"
→ {"success": true, "message": "Config reload signal sent"}
```

---

### 2. Session Tools

Manage Klaus sessions - list, inspect, and modify their configurations.

| Tool | Description |
|------|-------------|
| `list_sessions` | List all discovered sessions with metadata |
| `get_session` | Get full details of a specific session |
| `update_session_env` | Update a session's .env file |
| `update_session_system` | Update a session's SYSTEM.md |
| `update_session_mcporter` | Update a session's mcporter.json |
| `update_session_clicks` | Update a session's clicks.json |
| `update_session_config` | Update a session's config.json |
| `update_session_watchers` | Update a session's watchers.json |
| `poke_session` | Inject a message into another session's conversation |

**List all sessions:**
```
mcp action="call" server="klaus-admin" tool="list_sessions"
→ [
    {"name": "@17206598123", "hasSystem": true, "hasEnv": true, ...},
    {"name": "@other-user", "hasSystem": true, ...}
  ]
```

**Get session details:**
```
mcp action="call" server="klaus-admin" tool="get_session" args={"name": "@17206598123"}
→ {
    "name": "@17206598123",
    "path": "/home/clawd/klaus/whatsapp/@17206598123",
    "hasEnv": true,
    "hasSystem": true,
    "hasMcporter": true,
    "env": {"COMPOSIO_API_KEY": "..."},
    "system": "# Klaus System Prompt...",
    "mcporter": {"mcpServers": {...}}
  }
```

**Update session environment:**
```
mcp action="call" server="klaus-admin" tool="update_session_env" args={
  "name": "@17206598123",
  "env": {
    "COMPOSIO_API_KEY": "new-key",
    "OTHER_VAR": "value"
  }
}
```

**Update SYSTEM.md:**
```
mcp action="call" server="klaus-admin" tool="update_session_system" args={
  "name": "@17206598123",
  "content": "# New System Prompt\n\nYou are Klaus..."
}
```

**Poke another session (cross-session communication):**
```
mcp action="call" server="klaus-admin" tool="poke_session" args={
  "name": "@other-user",
  "message": "Hey, check the latest metrics",
  "sendViaWhatsapp": true
}
→ {
    "success": true,
    "response": "I checked the metrics. Everything looks good.",
    "messageCount": 5,
    "isNewSession": false,
    "sentViaWhatsapp": true
  }
```

The `poke_session` tool is powerful - it lets you:
- Inject prompts into other Klaus sessions
- Get their response back
- Optionally send the response via WhatsApp to the user

---

### 3. Main Config Tools (warelay.json)

Manage the main Klaus configuration file.

| Tool | Description |
|------|-------------|
| `get_warelay_config` | Read the main config |
| `update_warelay_config` | Update the main config |
| `list_config_backups` | List available backups |
| `restore_config_backup` | Restore from a backup |

**Get config:**
```
mcp action="call" server="klaus-admin" tool="get_warelay_config"
→ {"config": {...}, "exists": true}
```

**Update config:**
```
mcp action="call" server="klaus-admin" tool="update_warelay_config" args={
  "config": {
    "inbound": {
      "reply": {
        "piAgentModel": "claude-sonnet-4-20250514"
      }
    }
  }
}
```

**List and restore backups:**
```
mcp action="call" server="klaus-admin" tool="list_config_backups"
→ ["2024-01-04T10:30:00.000Z", "2024-01-03T15:45:00.000Z"]

mcp action="call" server="klaus-admin" tool="restore_config_backup" args={
  "timestamp": "2024-01-03T15:45:00.000Z"
}
```

---

### 4. Pi Agent Settings Tools

Manage Pi Agent defaults.

| Tool | Description |
|------|-------------|
| `get_pi_settings` | Get current Pi Agent settings |
| `update_pi_settings` | Update Pi Agent settings |

**Examples:**
```
mcp action="call" server="klaus-admin" tool="get_pi_settings"
→ {"settings": {"defaultProvider": "anthropic", "defaultModel": "claude-sonnet-4-20250514"}}

mcp action="call" server="klaus-admin" tool="update_pi_settings" args={
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium"
}
```

---

### 5. Global MCP Config Tools

Manage the global mcporter.json (config/mcporter.json).

| Tool | Description |
|------|-------------|
| `get_mcp_config` | Get global MCP server config |
| `update_mcp_config` | Replace entire MCP config |
| `add_mcp_server` | Add or update a single MCP server |
| `delete_mcp_server` | Remove an MCP server |

**Get MCP config:**
```
mcp action="call" server="klaus-admin" tool="get_mcp_config"
→ {
    "config": {
      "mcpServers": {
        "twitter": {"baseUrl": "https://...", "headers": {...}},
        "reddit": {"baseUrl": "https://..."}
      }
    },
    "exists": true
  }
```

**Add a new MCP server:**
```
mcp action="call" server="klaus-admin" tool="add_mcp_server" args={
  "name": "github",
  "baseUrl": "https://mcp.example.com/github",
  "headers": {"Authorization": "Bearer token"}
}
```

**Delete an MCP server:**
```
mcp action="call" server="klaus-admin" tool="delete_mcp_server" args={
  "name": "old-server"
}
```

---

### 6. Clicks Tools

Manage scheduled click tasks.

| Tool | Description |
|------|-------------|
| `list_clicks` | List all clicks from all sessions |
| `toggle_click` | Enable or disable a click |

**List clicks:**
```
mcp action="call" server="klaus-admin" tool="list_clicks"
→ [
    {
      "session": "@17206598123",
      "id": "market-check",
      "name": "Market Check",
      "intervalMinutes": 60,
      "enabled": true,
      "lastRun": 1704380400000,
      "lastResult": "OK"
    }
  ]
```

**Toggle a click:**
```
mcp action="call" server="klaus-admin" tool="toggle_click" args={
  "session": "@17206598123",
  "clickId": "market-check"
}
→ {"success": true, "enabled": false}
```

---

### 7. Grips Tools

Monitor active grip sessions.

| Tool | Description |
|------|-------------|
| `list_grips` | List all active grips |

**List grips:**
```
mcp action="call" server="klaus-admin" tool="list_grips"
→ [
    {
      "id": "research-task-001",
      "status": "active",
      "started": "2024-01-04T10:00:00.000Z",
      "template": "deep-research"
    }
  ]
```

---

## Common Use Cases

### Self-Modification
Klaus can update its own configuration:
```
# Update own SYSTEM.md
mcp action="call" server="klaus-admin" tool="update_session_system" args={
  "name": "@17206598123",
  "content": "# Updated prompt..."
}

# Add a new MCP server to own session
mcp action="call" server="klaus-admin" tool="get_session" args={"name": "@17206598123"}
# Then update mcporter with the new server added
```

### Cross-Session Communication
Send a task to another Klaus session:
```
mcp action="call" server="klaus-admin" tool="poke_session" args={
  "name": "@research-bot",
  "message": "Summarize the latest AI news and send it to me"
}
```

### Monitoring
Check system health and status:
```
mcp action="call" server="klaus-admin" tool="get_dashboard"
mcp action="call" server="klaus-admin" tool="list_clicks"
mcp action="call" server="klaus-admin" tool="list_grips"
```

### Configuration Backup/Restore
Before making changes, check available backups:
```
mcp action="call" server="klaus-admin" tool="list_config_backups"
```

If something goes wrong:
```
mcp action="call" server="klaus-admin" tool="restore_config_backup" args={
  "timestamp": "2024-01-04T10:00:00.000Z"
}
```

---

## Important Notes

1. **Backups are automatic** - All update operations create backups before modifying files
2. **Validation is enforced** - Invalid configs will be rejected with error details
3. **Read-only mode** - If admin is in read-only mode, write operations will fail with 403
4. **Cache invalidation** - After updating mcporter.json, the session needs restart to pick up changes (mcporter runtime is cached)
5. **WhatsApp relay** - The `poke_session` tool can optionally send responses via WhatsApp if `sendViaWhatsapp: true`
6. **Default port** - The admin console runs on port 8085 (`http://127.0.0.1:8085/admin/mcp`)
