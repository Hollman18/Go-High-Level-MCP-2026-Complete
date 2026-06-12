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
| `generate_historical_activity_report` | "Scan the full month of calls/messages by seller and leader with automatic pagination." |
| `get_saas_subscription_report` | "Build a SaaS subscription sales report for setters, closers, sales leaders, and management." |
| `get_value_ladder_info_product_report` | "Build a Value Ladder report across webinar/masterclass, workshop, entry offer, high ticket, and upsells." |

## SaaS Subscription Reporting Map

Use `get_saas_subscription_report` for subscription software teams with setters and closers.

Core report questions:

- Calls: total calls, effective calls, non-effective calls, outbound/inbound mix, daily averages, monthly averages, yearly averages, and sample call details.
- SMS: total SMS by user, effective vs non-effective, delivered, failed, inbound, outbound, period totals, period averages, and samples.
- WhatsApp: total messages by user, delivered/failed proxy, inbound/outbound, period totals, period averages, and samples.
- Email: total emails by user, delivered/failed proxy, inbound/outbound, period totals, period averages, and samples.
- Contacts: assigned contacts by user, contacts with email, contacts with phone, contacts missing fields, and unassigned contacts.
- Pipeline: open, won, lost, abandoned, total value, stage distribution, pipeline distribution, and sample opportunities.

Seller view:

- What did I do today, this month, and this year?
- Which calls/messages were effective or non-effective?
- Which demos, trials, proposals, or subscription opportunities are open?
- Which contacts assigned to me are missing phone or email?

Sales leader view:

- Which setters book or create the most qualified pipeline?
- Which closers own the most open, won, lost, and stalled pipeline?
- Who has high activity but weak effective conversations?
- Who has strong pipeline but weak follow-up activity?
- Which records are unassigned and need routing cleanup?

Management view:

- How much subscription pipeline and won value exists by user?
- Which stage is creating the biggest bottleneck?
- What is the team trend by day, month, and year?
- Which channels drive the most effective sales activity?
- Where is forecast risk concentrated?

## Value Ladder Info-Product Reporting Map

Use `get_value_ladder_info_product_report` for infoproduct teams selling through a ladder such as lead magnet, masterclass/webinar, workshop, application, strategy call, high ticket, and upsells.

Core report questions:

- Event follow-up: calls, SMS, WhatsApp, and emails after webinar/masterclass/workshop events.
- Ladder movement: contacts and opportunities by stage from lead magnet to high-ticket or continuity.
- Seller activity: effective vs non-effective follow-up by user and channel.
- Pipeline: open/won/lost value by seller, offer, event, and stage.
- Data hygiene: unassigned leads, failed messages, missing phone/email, and opportunities without clear ownership.

Seller view:

- Which webinar, workshop, or application leads need follow-up?
- How many effective conversations did I create after the event?
- Which booked calls, applications, and high-ticket opportunities are open?
- What did I win or lose during this launch window?

Sales leader view:

- Which users converted the most event leads into opportunities?
- Who followed up consistently after the masterclass or workshop?
- Where did leads stop moving through the ladder?
- Which users have high activity but low booked calls or won value?

Management view:

- How much revenue and pipeline came from each ladder level?
- Which event or offer created the most high-ticket pipeline?
- What is the trend by day, month, and year during launch periods?
- Where are the operational bottlenecks: channel, user, offer, or stage?

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

## Large Historical Reports

Use `generate_historical_activity_report` when the user asks for a full month or any large history. It automatically follows export cursors and applies safety limits so the agent does not stop after the first page.

Recommended prompt:

```text
Use generate_historical_activity_report for calls from YYYY-MM-DD to YYYY-MM-DD.
Set channel to Call, pageLimit to 500, maxPages to 50, and maxRecords to 25000.
Group by seller and leader. Include answered, no-answer, missed, duration totals,
average duration, unique contacts, unique conversations, summary CSV, and 500 detail rows.
```

For scheduled reporting, run the same MCP tool from a VPS cron job and store the returned summary/detail CSV in Drive, object storage, or a private reports folder.

## Notes For Agents

- Use `get_user_business_report` first for executive summaries.
- Use the channel-specific tools when the user asks for details or examples.
- Use `generate_historical_activity_report` for large histories instead of manually following cursors in chat.
- Results depend on the user fields returned by HighLevel. Records without user fields are grouped as `unassigned`.
- Use pagination cursors from each response when the user needs a larger report.
- These tools are read-only and do not send messages, update contacts, or modify pipeline records.
