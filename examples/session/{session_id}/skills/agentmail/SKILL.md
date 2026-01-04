---
name: agentmail
description: Klaus email capabilities via AgentMail API. Send emails, check inbox, list threads, reply to messages. Use when user asks to send email, check mail, reply to messages, or manage the klaus@agentmail.to mailbox.
---

# AgentMail - Klaus Email System

Send and receive emails via the `klaus@agentmail.to` mailbox using REST API calls.

## Credentials

```
API Key: am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48
Inbox ID: klaus@agentmail.to
Base URL: https://api.agentmail.to/v0
```

---

## API Operations (use curl or web_fetch)

### Check Inbox (List Messages)

```bash
curl -X GET "https://api.agentmail.to/v0/inboxes/klaus@agentmail.to/messages" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json"
```

Response fields: `count`, `messages[]` with `from_`, `subject`, `preview`, `timestamp`, `labels`, `message_id`, `thread_id`

### Send Email

```bash
curl -X POST "https://api.agentmail.to/v0/inboxes/klaus@agentmail.to/messages" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "Subject Line",
    "text": "Plain text version",
    "html": "<p>HTML version</p>"
  }'
```

### List Threads

```bash
curl -X GET "https://api.agentmail.to/v0/threads" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json"
```

### Get Thread Details

```bash
curl -X GET "https://api.agentmail.to/v0/threads/{thread_id}" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json"
```

### Reply to Message

```bash
curl -X POST "https://api.agentmail.to/v0/inboxes/klaus@agentmail.to/messages/{message_id}/reply" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your reply text",
    "html": "<p>Your HTML reply</p>"
  }'
```

### Update Message Labels

```bash
curl -X PATCH "https://api.agentmail.to/v0/inboxes/klaus@agentmail.to/messages/{message_id}" \
  -H "Authorization: Bearer am_db24821076a43cf7273e1cd66220f96450434371764c72e1bef8e9f943c43c48" \
  -H "Content-Type: application/json" \
  -d '{
    "add_labels": ["replied"],
    "remove_labels": ["unreplied"]
  }'
```

---

## Labels

| Label | Purpose |
|-------|---------|
| `unreplied` | Messages awaiting response |
| `replied` | Messages already responded to |
| `important` | Priority messages |
| `archived` | Processed/old messages |

---

## Best Practices

1. **Always provide both `text` and `html`** for best email deliverability
2. **Use labels** to track message status (unreplied/replied)
3. **Use bash tool with curl** for all API calls (curl to api.agentmail.to bypasses bwrap sandbox)
