# Troubleshooting

Common issues and solutions when using Better Context.

## Installation Issues

### Command Not Found

**Problem**: `btrx: command not found`

**Causes**:

- Better Context not installed globally
- Path issues after installation
- npm link not executed

**Solutions**:

1. **Check if npm link was run**:

   ```bash
   cd /path/to/better-context
   npm link
   ```

2. **Verify global installation**:

   ```bash
   npm list -g btrx
   ```

3. **Check your PATH**:

   ```bash
   echo $PATH
   which btrx
   ```

4. **Reinstall if needed**:
   ```bash
   npm unlink btrx
   npm link
   ```

### Dependencies Issues

**Problem**: Error during `npm install`

**Common Errors**:

```
npm ERR! peer dep missing
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

1. **Clear npm cache**:

   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall**:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use legacy peer deps (if needed)**:

   ```bash
   npm install --legacy-peer-deps
   ```

4. **Check Node.js version**:
   ```bash
   node --version
   # Should be >= 22
   ```

## Startup Issues

### Port Already in Use

**Problem**: "Port 3001 is already in use"

**Solutions**:

1. **Find what's using the port**:

   ```bash
   lsof -i :3001
   lsof -i :3002
   ```

2. **Kill the process**:

   ```bash
   kill -9 <PID>
   ```

3. **Use different ports**:

   ```bash
   # Modify src/config.ts
   export const API_PORT = 3011  // Changed from 3001
   export const MCP_PORT = 3012  // Changed from 3002
   ```

4. **Check for other Better Context instances**:
   ```bash
   ps aux | grep btrx
   ```

### Database Migration Errors

**Problem**: "Migration failed" or database errors

**Solutions**:

1. **Reset database**:

   ```bash
   rm -rf ~/.bettercontext
   btrx
   ```

2. **Verify permissions**:
   ```bash
   ls -la ~/.bettercontext
   ```

### Desktop App Won't Open

**Problem**: Command runs but desktop app doesn't appear

**Causes**:

- Tauri build issues
- Display/graphics problems
- Permission issues

**Solutions**:

1. **Check if Tauri is built**:

   ```bash
   ls -la src-tauri/target/debug/
   ```

2. **Check system requirements**:
   - macOS: 10.14 or later
   - Windows: Windows 10 or later
   - Linux: Recent distribution with GUI

## Runtime Issues

### AI Integration Issues

**Problem**: AI tools can't connect to Better Context

**Symptoms**:

- "MCP server unavailable"
- "Tools not found"
- "Connection timeout"

**Diagnostic Steps**:

1. **Test MCP server directly**:

   ```bash
   curl http://localhost:3002/health
   ```

2. **Check MCP server status**:

   ```bash
   btrx status
   ```

3. **Verify AI tool configuration**:
   ```bash
   # For Claude Desktop
   cat ~/.config/Claude/claude_desktop_config.json
   ```

**Solutions**:

1. **Restart MCP server**

2. **Test with direct connection**:
   ```bash
   curl -X POST http://localhost:3002/message \
     -H "Content-Type: application/json" \
     -d '{"method": "tools/list"}'
   ```

## Getting Help

### Collect System Information

When reporting issues, include:

```bash
# System info
uname -a
node --version
npm --version

# Better Context version
# Are you using the latest commit from the main branch?
```

### Report Issues

When reporting bugs:

1. **Include error messages** (full stack traces)
2. **Describe steps to reproduce**
3. **Provide system information**
4. **Share relevant configuration**
5. **Include sample code** (if possible)

### Community Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check latest documentation updates
