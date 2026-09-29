# ReBIM Copilot - Development Guide

## Project Structure

```
experiments/revit-copilot/
├── contracts/              # JSON schemas dan contracts
│   ├── command.schema.json
│   ├── result.schema.json
│   ├── context.schema.json
│   ├── tool-registry.json
│   └── error-codes.json
├── addin/                  # C# Revit Add-in
│   ├── ReBIM.Revit.Addin.csproj
│   ├── Application.cs
│   ├── IpcServer.cs
│   ├── CommandHandler.cs
│   └── RevitContext.cs
├── gateway/                # TypeScript AI Gateway
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── ipc/
│       │   └── client.ts
│       ├── mcp/
│       │   └── server.ts
│       ├── tools/
│       │   └── registry.ts
│       ├── providers/
│       │   ├── router.ts
│       │   ├── ollama.ts
│       │   ├── openai.ts
│       │   └── anthropic.ts
│       └── audit/
│           └── logger.ts
├── ui/                     # WPF UI components
│   ├── Sidebar.xaml
│   ├── Sidebar.xaml.cs
│   └── GatewayClient.cs
└── tests/                  # Test suites
    ├── contracts.test.ts
    ├── tool-registry.test.ts
    └── ipc.test.ts
```

## Development Workflow

### 1. Contract-First Development
- Selalu update contracts sebelum implementasi
- Validasi semua perubahan terhadap schema
- Test contract compliance di CI

### 2. Build Process

```bash
# Build Add-in
cd addin
dotnet build -c Release

# Build Gateway
cd gateway
npm install
npm run build

# Run Tests
npm test
```

### 3. Testing Strategy

| Layer | Test Type | Tools |
|-------|-----------|-------|
| Contracts | Unit | Vitest |
| Gateway | Unit/Integration | Vitest |
| IPC | Integration | Vitest + Revit |
| Revit Handlers | Runtime | Manual + Revit |
| MCP | Protocol | MCP Inspector |
| AI | Scenario | Manual |
| E2E | Manual | Scripted |

### 4. Debugging

#### Add-in Debugging
```bash
# Attach Visual Studio debugger to Revit.exe
# Set breakpoints in CommandHandler.cs
# Use Diagnostics command untuk check status
```

#### Gateway Debugging
```bash
# Run dengan debug logging
DEBUG=rebim:* npm run dev

# Check MCP server
npx @modelcontextprotocol/inspector
```

## RCP Implementation Checklist

### RCP-00: Freeze Architecture + Contracts
- [ ] Blueprint document reviewed
- [ ] JSON schemas frozen
- [ ] Tool registry v0 defined
- [ ] Error code catalog complete
- [ ] Acceptance matrix created
- [ ] Contract tests passing

### RCP-01: Revit 2025 Add-in Shell
- [ ] Solution builds successfully
- [ ] Add-in loads in Revit 2025
- [ ] Ribbon buttons visible
- [ ] Logging works
- [ ] Clean shutdown

### RCP-02: Named Pipe Bridge
- [ ] IPC server starts
- [ ] Authentication works
- [ ] Ping command responds
- [ ] Timeout handling
- [ ] Reconnection logic

### RCP-03: get_selection
- [ ] Command handler registered
- [ ] Selection DTO mapped
- [ ] Empty selection handled
- [ ] Max count guard
- [ ] Runtime test passed

### RCP-04: Active View + Properties
- [ ] get_project_info works
- [ ] get_active_view works
- [ ] get_element_properties works
- [ ] Parameter serialization correct
- [ ] Unit normalization (mm)

### RCP-05: MCP Server TypeScript
- [ ] MCP server starts
- [ ] tools/list stable
- [ ] Tool schemas valid
- [ ] Inspector can connect
- [ ] Read-only mode works

### RCP-06: Ollama + Tool Calling
- [ ] Ollama provider connects
- [ ] Model discovery works
- [ ] Tool calling functional
- [ ] Agent loop completes
- [ ] Max iterations guard

### RCP-07: Sidebar + Textbox
- [ ] Panel opens/closes
- [ ] Textbox functional
- [ ] Context chips update
- [ ] Mode selector works
- [ ] End-to-end Ask works

### RCP-08: set_parameter + Dry-Run
- [ ] Write intent schema defined
- [ ] Parameter validation works
- [ ] Type coercion correct
- [ ] Before/after diff shown
- [ ] No model mutation on dry-run

### RCP-09: Approval + Transaction
- [ ] Approval token generated
- [ ] ExternalEvent execution
- [ ] Transaction commit works
- [ ] Rollback on failure
- [ ] Action receipt returned

### RCP-10: Undo / Rollback
- [ ] Transaction naming clear
- [ ] Ctrl+Z restores original
- [ ] Exception rollback works
- [ ] No orphan transactions
- [ ] Audit status correct

### RCP-11: Hybrid Provider Router
- [ ] AIProvider interface defined
- [ ] OpenAI adapter works
- [ ] Anthropic adapter works
- [ ] Router rules implemented
- [ ] Manual switch works
- [ ] Fallback with reason

### RCP-12: Privacy + Context Snapshot
- [ ] Context revision generated
- [ ] Expected value checks
- [ ] Proposal expiry
- [ ] Privacy profiles work
- [ ] Cloud consent UI

### RCP-13: Audit + Diagnostics
- [ ] Event schema defined
- [ ] Structured logs written
- [ ] Trace IDs linked
- [ ] Diagnostics command works
- [ ] Secret masking works

### RCP-14: Fresh E2E Verification
- [ ] Clean checkout
- [ ] Fresh build
- [ ] Revit 2025 clean launch
- [ ] Ollama healthy
- [ ] Full demo scenario passes
- [ ] Evidence captured
- [ ] POC sealed

## Common Issues

### Add-in Not Loading
- Check .addin manifest location
- Verify DLL path in manifest
- Check Revit version compatibility
- Review journal file for errors

### IPC Connection Failed
- Verify add-in is loaded
- Check pipe name matches
- Verify authentication token
- Check firewall settings

### MCP Tools Not Showing
- Verify gateway is running
- Check MCP server logs
- Validate tool schemas
- Test with MCP Inspector

### AI Provider Unavailable
- Check Ollama is running
- Verify API keys for cloud providers
- Check network connectivity
- Review provider health status
