# Getting Started

Better Context is a developer tool that maintains consistent coding guidelines and provides contextual project information to AI assistants. Simply run one command from any project directory to start an MCP server that gives AI tools structured access to your repository while keeping everything local on your machine.

## What Better Context Does

- **Analyzes your codebase** to generate context-specific coding guidelines
- **Connects with AI tools** like Cline or Cursor via MCP
- **Works locally** - all your code stays on your machine

## Quick Installation

### Prerequisites

- Node.js (version 22 or higher)

### Install Better Context

**Clone and install** (currently in development):

```bash
git clone https://github.com/bettercontext/btrx.git
cd btrx
npm install
npm link
```

## First Launch

### Starting Better Context

Navigate to any project directory and run:

```bash
cd /path/to/your/project
btrx
```

Better Context will:

- Open a desktop application
- Start the local server
- Detect your project structure
- Show your project's dashboard

### What You'll See

The Better Context interface has three main sections:

**🏠 Dashboard**

- **Current Directory**: The project you're working on
- **Git Status**: Indicates if the project is a Git repository
- **MCP Server Status**: Connection with AI tools

**📋 Guidelines And Contexts Management**

- **Edit Contexts**: Create and manage contexts for different parts of your project
- **View Guidelines**: Browse generated guidelines by context
- **Edit Guidelines**: Refine or customize generated guidelines

**⚙️ Settings**

- **Repositories Management**: Edit/remove repositories in Better Context

## Understanding Repository Scoping

Better Context organizes all your data (guidelines, contexts, and configurations) by **repository**. This means each project maintains its own separate set of guidelines and contexts, ensuring that coding standards from one project don't interfere with another.

### How Repository Identification Works

Better Context identifies repositories using:

1. **Git Origin URL** (primary): If your project is a Git repository, Better Context uses the remote origin URL to identify it
2. **Project Path** (fallback): For non-Git projects, the full project directory path is used as the identifier

### What This Means for You

**Isolated Data**: Each repository has its own:

- **Guidelines Contexts**: Custom analysis contexts specific to that project
- **Generated Guidelines**: Coding standards tailored to that codebase
- **Settings**: Repository-specific configurations

**Project Switching**: When you run `btrx` from different project directories:

- Better Context automatically loads the correct guidelines and contexts for that project
- You don't need to manually switch between different configurations
- Your work in one project stays completely separate from others

## Data Storage

All your data are stored locally on your machine, ensuring complete privacy and control over your information.

Better Context uses **PGlite** (a lightweight PostgreSQL database, think of it as an alternative to SQLite) to store your data without polluting your project with additional files.

The database is located in your home directory `~/.bettercontext/` and is automatically created when you run the application for the first time.

## Next Steps

- [Set up AI tool integration](./ai-integration.md)
- [Learn how to use Better Context](./using-better-context.md)
- [Generate coding guidelines](./guidelines-analysis.md)

## Need Help?

- Check the [troubleshooting guide](./troubleshooting.md)
- Report issues on GitHub
