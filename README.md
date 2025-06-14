# Better Context

<div align="center">
  <img src="src-tauri/icons/128x128.png" alt="Better Context" width="128" height="128">
</div>

<div align="center">
  <b>Structured code context for smarter LLMs</b>
</div>

---

Better Context is a developer tool that transforms how Large Language Models understand and work with your codebase. By running a single command from any project directory, it spins up an MCP (Model Context Protocol) server that gives LLMs structured, contextual access to your repository.

<div align="center">
  <img src="app-screen.png" alt="Desktop UI" width="100%" height="auto">
</div>

https://github.com/user-attachments/assets/cad20507-1a9b-4326-bf87-3e6c4dd634fe

## ⚠ Development Status

Better Context is currently under active development and has been published for preview purposes only. For now, the project runs in development mode and will be published to npm once it's ready for beta testing.

```bash
# Clone the repository
git clone https://github.com/bettercontext/btrx.git

# Navigate to the cloned repository
cd btrx

# Install dependencies
npm install

# Link the global command
npm link

# Launch from any project directory
btrx
```

This command starts the development server with hot-reloading for both server and frontend. The server automatically detects the directory from which `btrx` was executed. The frontend opens in a Tauri desktop application.

## Configuration

Better Context uses several configurable ports that can be adjusted in `src/config.ts`.

## Architecture Overview

- **MCP Server**: Provides structured access to your codebase via the Model Context Protocol
- **HTTP Streamable Transport**: Real-time communication using HTTP streaming
- **Desktop App**: Cross-platform Tauri application with Vue.js frontend
- **Database**: Local PGlite database with Drizzle ORM

## Documentation

For detailed documentation, please refer to the [Better Context Documentation](https://docs.bettercontext.dev).

## Technical Resources

If you're interested in contributing or exploring the codebase, here are some useful links:

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bettercontext/btrx)

[MCP Inspector](https://github.com/alpic-ai/grizzly)

## License

This repository is under the Apache 2.0 license, see NOTICE and LICENSE file.
