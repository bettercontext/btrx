---
home: true
title: Documentation
heroImage: /logo.png
heroImageDark: /logo-dark.png
tagline: Structured code context for smarter LLMs
actions:
  - text: Get Started
    link: /user-guide/getting-started.html
    type: primary

features:
  - title: ⚡ Intelligent Code Analysis
    details: Automatically detects project structure and generates contextual guidelines based on your codebase.
  - title: 🖥️ Cross-Platform App
    details: Desktop application built with Tauri and Vue.js that provides a dedicated interface, eliminating the need to hunt for it among dozens of browser tabs.
  - title: 🔌 MCP Server Integration
    details: Built on the Model Context Protocol with HTTP streamable transport for real-time communication between your tools and LLMs.

footer: Apache 2.0 Licensed | Copyright © 2025 Eddy Bordi
---

## What is Better Context?

Better Context is a developer tool that transforms how Large Language Models understand and work with your codebase. By running a single command from any project directory, it spins up an MCP (Model Context Protocol) server that gives LLMs structured, contextual access to your repository.

## Quick Start

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

The command automatically detects your current directory, starts the MCP server, and opens the desktop interface with your project context.

## Architecture Overview

Better Context combines several technologies to create a seamless AI-assisted development experience:

- **MCP Server**: Provides structured access to your codebase via the Model Context Protocol
- **HTTP Streamable Transport**: Real-time communication using HTTP streaming
- **Desktop App**: Cross-platform Tauri application with Vue.js
- **Database**: Local PGlite database with Drizzle ORM

## ⚠ Development Status

Better Context is currently under active development and has been published for preview purposes only. For now, the project runs in development mode and will be published to npm once it's ready for beta testing.
