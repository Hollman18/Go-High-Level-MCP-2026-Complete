# GoHighLevel Business Reporting Tools

This repo includes MCP tools for common business reporting questions that teams ask about sellers, agents, and pipeline production.

## Official Sources Reviewed

- HighLevel MCP Server: `https://marketplace.gohighlevel.com/docs/other/mcp/`
- HighLevel API docs home: `https://marketplace.gohighlevel.com/docs/`
- Official OpenAPI source tracked by this repo: `https://github.com/GoHighLevel/highlevel-api-docs.git`
- Local generated endpoint data: `src/tools/official-spec-endpoints.json`

The HighLevel MCP docs describe HTTP-based MCP usage for compatible agents and clients, including Cursor, Windsurf, OpenAI Playground, n8n, and other MCP clients. The reporting tools here therefore use agent-neutral wording and are not tied to Claude.

## Endpoint Strategy

Some aggregate reporting endpoints, such as `/reporting/sms`, may return `404` depending on the account, plan, or HighLevel surface. For production-grade reporting, these MCP tools prefer official source-of-truth records and build the rollups locally.

| Report area | Primary endpoint used | Version | Scope needed |
| --- | --- | --- | --- |
| SMS, WhatsApp, email, calls | `GET /conversations/messages/export` | `2021-04-15` | `conversations/message.readonly` |
| Sales and pipeline | `POST /opportunities/search`, fallback `GET /opportunities/search` | `2021-07-28` | `opportunities.readonly` |
| Contact ownership | `GET /contacts/`, fallback `POST /contacts/search` | `2021-07-28` | `contacts.readonly` |
| User names/email mapping | `GET /users/search` | repo default | user/location read access |

## Added MCP Tools

Use these when an agent needs seller, user, or team production reports:

| Tool | Best question |
| --- | --- |
| `get_user_business_report` | "Give me a complete report by seller: pipeline, contacts, SMS, WhatsApp, email, and calls." |
| `get_pipeline_activity_by_user` | "How much pipeline and sales value does each seller have?" |
| `get_contact_ownership_report` | "How many contacts are assigned to each user?" |
| `get_sms_activity_by_user` | "How many SMS did each seller send and receive?" |
| `get_whatsapp_activity_by_user` | "Show WhatsApp activity by seller with message details." |
| `get_email_activity_by_user` | "Show email activity by seller." |
| `get_call_activity_by_user` | "Show call activity by seller with call details." |
| `get_message_activity_by_user` | "Show activity by seller for one channel or all exported conversation channels." |

## Recommended Agent Prompt

```text
Use the GoHighLevel MCP tools to create a business performance report for this location.
Group results by user/seller. Include pipeline value, open/won/lost opportunities,
assigned contacts, SMS, WhatsApp, email, and calls.

Use startDate: YYYY-MM-DD
Use endDate: YYYY-MM-DD
If an aggregate reporting endpoint fails, use the conversation export, contacts,
opportunities, and users tools to build the report from source records.
```

## Notes For Agents

- Use `get_user_business_report` first for executive summaries.
- Use the channel-specific tools when the user asks for details or examples.
- Results depend on the user fields returned by HighLevel. Records without user fields are grouped as `unassigned`.
- Use pagination cursors from each response when the user needs a larger report.
- These tools are read-only and do not send messages, update contacts, or modify pipeline records.
