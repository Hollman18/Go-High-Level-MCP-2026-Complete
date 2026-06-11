# Deployment

## Local Clone

```bash
npm install
npm run build
npm run start:stdio
```

## npx / Global Install

After publishing:

```bash
npx go-high-level-mcp-server ghl-mcp doctor
npm install -g go-high-level-mcp-server
ghl-mcp doctor
```

Publishing is manual. Verify first:

```bash
npm pack --dry-run
```

## Docker

```bash
docker compose up --build
```

Pass credentials through `.env`.

For hosted deployments, set `MCP_AUTH_TOKEN` in `.env`. When it is set, HTTP MCP routes require:

```http
Authorization: Bearer your_strong_remote_mcp_token
```

`docker-compose.yml` binds the container to `127.0.0.1:8000` so a reverse proxy can expose HTTPS without publishing the MCP port directly.

## Hostinger VPS CI/CD

Use [Hostinger CI/CD](HOSTINGER-CICD.md) to deploy from a GitHub fork to a Hostinger VPS on every push to `main`.

## Release Checklist

- Update changelog.
- Confirm semantic version.
- Run `npm run build`.
- Run `npm test`.
- Run `npm pack --dry-run`.
- Install from the tarball in a temp directory.
