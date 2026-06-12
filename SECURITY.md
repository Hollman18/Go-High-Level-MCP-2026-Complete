# Security Policy

GoHighLevel MCP Server can access private CRM data, sales conversations,
contacts, opportunities, calendars, payments, and reporting records. Treat every
deployment as production infrastructure, even when it is used only by an
internal team.

## Supported Versions

Security fixes are applied to the `main` branch and to the hosted production
connector when it is deployed from this repository.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Forks or modified deployments | Maintained by the fork owner |

## Reporting a Vulnerability

Report security issues through GitHub Security Advisories for this repository
whenever possible. If that is not available, open a private support channel with
the maintainers before sharing exploit details publicly.

Please include:

- A short summary of the issue.
- Affected endpoint, tool, route, workflow, or file.
- Reproduction steps using placeholder credentials only.
- Expected impact and whether CRM data, tokens, or hosted access could be
  exposed.

Do not include real GoHighLevel tokens, OAuth secrets, private keys, customer
data, session tokens, or production bearer tokens in reports.

## Credential Handling

Never commit real credentials. Keep these values in local `.env` files, GitHub
Actions secrets, Hostinger environment files, or another secret manager:

- `GHL_API_KEY`
- `GHL_LOCATION_ID`
- `MCP_AUTH_TOKEN`
- `MCP_OAUTH_SECRET`
- `OPENAI_API_KEY`
- SSH private keys
- Any exported customer, contact, message, or call data

If a secret is exposed, rotate it immediately in the source system and redeploy
the MCP server with the new value.

## Production Hardening Checklist

Before exposing a hosted MCP endpoint:

- Use `MCP_AUTH_MODE=byo-ghl-oauth` for public multi-user connectors.
- Set `MCP_PUBLIC_BASE_URL` to the public HTTPS origin.
- Set a long random `MCP_OAUTH_SECRET`; do not reuse your bearer token.
- Set `MCP_AUTH_TOKEN` for remote MCP access.
- Restrict browser origins with `MCP_ALLOWED_ORIGINS`.
- Keep `MCP_JSON_LIMIT` and `MCP_FORM_LIMIT` small unless a specific workflow
  requires larger payloads.
- Use HTTPS only.
- Use least-privilege GoHighLevel Private Integration Token scopes.
- Run `npm audit` and `npm audit --prefix mcp-apps` before deployment.
- Run `npm run build` and `npm test -- --runInBand`.
- Keep Docker running as a non-root user.
- Keep `.env`, keys, logs, backups, build output, and exports out of git and
  Docker build context.

## Built-In Security Controls

The server includes these controls by default:

- Optional bearer auth for hosted MCP routes.
- BYO-GHL public connector mode with sealed user credentials.
- CORS allowlisting with local development exceptions.
- Disabled `x-powered-by` Express header.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, and related response headers.
- JSON and form request size limits.
- Generic client-facing execution errors with detailed server-side logs.
- Non-root Docker runtime user.
- Git and Docker ignore rules for common secret and backup file types.

## Responsible Use

This project is not a substitute for GoHighLevel account governance. Each
business remains responsible for user permissions, API scopes, data retention,
consent, privacy notices, audit logs, and compliance with applicable laws and
third-party platform terms.
