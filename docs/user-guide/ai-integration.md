# AI Integration

Better Context integrates with AI tools using the Model Context Protocol (MCP) with HTTP streamable transport for real-time, context-aware assistance.

## Overview

All Better Context integrations use **MCP with HTTP streamable transport**, providing:

- **Real-time communication** between AI tools and Better Context
- **Live updates** of guidelines and repository context
- **Seamless integration** with modern AI assistants
- **Local processing** with no external data sharing

Supported by any MCP-compatible AI tool (Claude Desktop, Cursor, Cline, etc.).

## Cline Integration

Cline (VS Code AI assistant) connects to Better Context via MCP HTTP streamable transport for enhanced coding assistance.

### Setup

**Configure MCP connection:**

Open VS Code settings and add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": [
     "btrx": {
       "autoApprove": [],
       "disabled": false,
       "url": "http://localhost:3001/mcp",
       "type": "streamableHttp"
     }
  ]
}
```

## Advanced Configuration

### Port Configuration

Better Context uses two ports for different services:

- **Port 3000**: Web interface (`WEB_PORT`)
- **Port 3001**: API server and MCP transport (`API_PORT`)

The MCP server now runs on the same port as the API server, accessible at `/mcp` endpoint.

### Custom Port Setup

If the API port (3001) is unavailable, configure a different port:

1. **Update Better Context config:**

   ```typescript
   // src/config.ts
   export const WEB_PORT = 3100 // Web interface
   export const API_PORT = 3101 // API server and MCP transport
   ```

2. **Update AI tool configurations:**
   ```json
   {
     "url": "http://localhost:3101/mcp"
   }
   ```

**Note:** Only the API port needs to be configured in AI tools at the `/mcp` endpoint. The web port is used internally by Better Context for the desktop interface.

## Next Steps

- [Learn how to use Better Context](./using-better-context.md)
- [Generate coding guidelines](./guidelines-analysis.md)

## Need Help?

- Check the [troubleshooting guide](./troubleshooting.md)
- Report issues on GitHub
