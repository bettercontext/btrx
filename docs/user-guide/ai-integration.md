# AI Integration

Better Context integrates with AI tools using the Model Context Protocol (MCP) with Server-Sent Events (SSE) transport for real-time, context-aware assistance.

## Overview

All Better Context integrations use **MCP with SSE transport**, providing:

- **Real-time communication** between AI tools and Better Context
- **Live updates** of guidelines and repository context
- **Seamless integration** with modern AI assistants
- **Local processing** with no external data sharing

Supported by any MCP-compatible AI tool (Claude Desktop, Cursor, Cline, etc.).

## Cline Integration

Cline (VS Code AI assistant) connects to Better Context via MCP SSE for enhanced coding assistance.

### Setup

**Configure MCP connection:**

Open VS Code settings and add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": [
     "btrx": {
       "autoApprove": [],
       "disabled": false,
       "timeout": 60,
       "url": "http://localhost:3002/sse",
       "transportType": "sse"
     }
  ]
}
```

## Advanced Configuration

### Port Configuration

Better Context uses three ports for different services:

- **Port 3000**: Web interface (`WEB_PORT`)
- **Port 3001**: API server (`API_PORT`)
- **Port 3002**: MCP SSE transport (`MCP_PORT`)

### Custom Port Setup

If any ports are unavailable, configure different ports:

1. **Update Better Context config:**

   ```typescript
   // src/config.ts
   export const WEB_PORT = 3100 // Web interface
   export const API_PORT = 3101 // API server
   export const MCP_PORT = 3102 // MCP SSE transport
   ```

2. **Update AI tool configurations:**
   ```json
   {
     "url": "http://localhost:3102/sse"
   }
   ```

**Note:** Only the MCP port (3102 in this example) needs to be configured in AI tools. The web and API ports are used internally by Better Context.

## Next Steps

- [Learn how to use Better Context](./using-better-context.md)
- [Generate coding guidelines](./guidelines-analysis.md)

## Need Help?

- Check the [troubleshooting guide](./troubleshooting.md)
- Report issues on GitHub
