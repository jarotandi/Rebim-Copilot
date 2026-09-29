# ReBIM Copilot Hybrid - Project Summary

## Overview

ReBIM Copilot Hybrid adalah Proof of Concept untuk AI-powered BIM assistant yang menghubungkan percakapan natural language dengan konteks BIM dan tool eksekusi yang aman di Autodesk Revit 2025.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ReBIM Copilot UI                             │
│              (WPF Sidebar + Chat Interface)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ReBIM AI Gateway                               │
│         (TypeScript/Node.js + MCP Server)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Ollama    │  │   OpenAI    │  │  Anthropic  │             │
│  │  (Local)    │  │   (Cloud)   │  │   (Cloud)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Named Pipe IPC                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Revit 2025 Add-in                                 │
│              (C#/.NET 8 + ExternalEvent)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Command   │  │ Transaction │  │    Revit    │             │
│  │   Handler   │  │   Manager   │  │    API      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
D:\Rebim Copilot\experiments\revit-copilot\
├── contracts/                    # JSON schemas & contracts
│   ├── command.schema.json
│   ├── result.schema.json
│   ├── context.schema.json
│   ├── tool-registry.json
│   └── error-codes.json
├── addin/                        # C# Revit Add-in
│   ├── ReBIM.Revit.Addin.csproj
│   ├── Application.cs
│   ├── IpcServer.cs
│   ├── CommandHandler.cs
│   ├── ExternalEventHandler.cs
│   ├── OpenCopilotCommand.cs
│   └── DiagnosticsCommand.cs
├── gateway/                      # TypeScript AI Gateway
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── ipc/client.ts
│       ├── mcp/server.ts
│       ├── tools/registry.ts
│       ├── providers/
│       │   ├── router.ts
│       │   ├── ollama.ts
│       │   ├── openai.ts
│       │   └── anthropic.ts
│       ├── agent/loop.ts
│       ├── approval/service.ts
│       ├── privacy/policy.ts
│       ├── context/snapshot.ts
│       ├── audit/logger.ts
│       └── utils/
│           ├── units.ts
│           └── validation.ts
├── ui/                           # WPF UI components
│   ├── Sidebar.xaml
│   ├── Sidebar.xaml.cs
│   └── GatewayClient.cs
├── tests/                        # Test suites
│   ├── contracts.test.ts
│   ├── tool-registry.test.ts
│   └── ipc.test.ts
├── README.md
├── ADDIN_MANIFEST.md
├── DEVELOPMENT.md
└── PROJECT_SUMMARY.md
```

## Key Features

### 1. Contract-First Architecture
- JSON schemas untuk semua communication boundaries
- Tool registry dengan risk classification
- Error code taxonomy yang konsisten

### 2. Safety-First Design
- No silent model mutation
- Approval-based write execution
- ExternalEvent untuk thread-safe Revit API access
- Native Undo/Redo support
- Context revision untuk stale detection

### 3. Hybrid AI Provider
- Local-first dengan Ollama
- Cloud-ready dengan OpenAI/Anthropic
- Provider router dengan capability-based routing
- Privacy policy engine

### 4. MCP (Model Context Protocol)
- Standard tool interface
- Provider-agnostic execution
- Inspector-compatible

### 5. Comprehensive Audit
- Structured logging
- Trace IDs untuk semua actions
- Secret masking
- Action receipts

## RCP Stages (15 Stages)

| Stage | Focus | Key Deliverable |
|-------|-------|-----------------|
| RCP-00 | Freeze architecture | Contracts & schemas |
| RCP-01 | Add-in shell | Revit loads add-in |
| RCP-02 | IPC bridge | Named Pipe works |
| RCP-03 | get_selection | Selection readable |
| RCP-04 | View + properties | BIM context available |
| RCP-05 | MCP server | Inspector PASS |
| RCP-06 | Ollama + tools | Local AI works |
| RCP-07 | Sidebar UI | End-to-end Ask |
| RCP-08 | set_parameter dry-run | Preview works |
| RCP-09 | Approval + Transaction | Apply works |
| RCP-10 | Undo/rollback | Undo works |
| RCP-11 | Hybrid router | Multi-provider |
| RCP-12 | Privacy + snapshot | Stale detection |
| RCP-13 | Audit + diagnostics | Full traceability |
| RCP-14 | Fresh E2E | Complete verification |

## Tool Registry (9 Tools)

| Tool | Risk | Modes | Description |
|------|------|-------|-------------|
| get_project_info | READ | Ask+ | Project metadata |
| get_active_view | READ | Ask+ | Current view |
| get_selection | READ | Ask+ | Selected elements |
| get_element | READ | Ask+ | Element details |
| get_element_properties | READ | Ask+ | Parameter values |
| find_elements | READ | Analyze+ | Search with filters |
| select_elements | UI | Ask+ | Select by ID |
| highlight_elements | UI | Ask+ | Visual highlight |
| set_parameter | SAFE_WRITE | Edit+ | Change parameter |

## Error Codes (9 Codes)

- REBIM_VALIDATION_ERROR
- REBIM_CAPABILITY_UNAVAILABLE
- REBIM_PERMISSION_DENIED
- REBIM_STALE_CONTEXT
- REBIM_IPC_UNAVAILABLE
- REBIM_REVIT_CONTEXT_BUSY
- REBIM_EXECUTION_FAILED
- REBIM_PROVIDER_UNAVAILABLE
- REBIM_CLOUD_BLOCKED

## Technology Stack

| Component | Technology |
|-----------|------------|
| Revit Add-in | C# / .NET 8 / Revit API 2025 |
| Gateway | TypeScript / Node.js 22+ |
| MCP | TypeScript SDK v2 |
| Local AI | Ollama |
| Cloud AI | OpenAI / Anthropic |
| UI | WPF (Windows) |
| IPC | Named Pipe |
| Testing | Vitest |

## Getting Started

### Prerequisites
- Windows 11
- Autodesk Revit 2025
- .NET 8 SDK
- Node.js 22+
- Ollama

### Build & Run
```bash
# Build Add-in
cd addin
dotnet build -c Release

# Build Gateway
cd gateway
npm install
npm run build

# Start Gateway
npm run dev

# Load in Revit 2025
# Ribbon -> ReBIM Copilot -> Open Copilot
```

## Safety Rules

1. No silent model mutation by default
2. Tool allowlist enforcement
3. Write action requires validation + preview + approval
4. ExternalEvent-only Revit API access
5. Native Transaction and Undo preserved
6. Context snapshot for stale detection
7. Arbitrary code execution disabled
8. Sensitive project policy can force local-only mode

## Next Steps

1. **RCP-00**: Review and freeze contracts
2. **RCP-01**: Build and test add-in shell
3. **RCP-02**: Implement and test IPC bridge
4. **RCP-03/04**: Implement context read tools
5. **RCP-05**: Set up MCP server
6. **RCP-06**: Integrate Ollama
7. **RCP-07**: Build sidebar UI
8. **RCP-08/09**: Implement write with approval
9. **RCP-10**: Verify undo/rollback
10. **RCP-11**: Add cloud providers
11. **RCP-12**: Implement privacy controls
12. **RCP-13**: Add audit logging
13. **RCP-14**: Fresh E2E verification

## Success Criteria

ReBIM Copilot POC dianggap berhasil jika:
- Add-in muncul dan stabil di Revit 2025
- Named Pipe discovery dan authenticated ping PASS
- Selection dan active view terbaca
- MCP Inspector dapat memanggil tool
- Ollama local dapat tool-call ke Revit
- Sidebar textbox melakukan Ask end-to-end
- set_parameter menghasilkan dry-run preview
- Approval wajib untuk commit
- ExternalEvent + Transaction commit PASS
- Rollback dan native Undo PASS
- Provider router local/OpenAI/Claude bekerja
- Privacy local-only dan stale context rejection PASS
- Audit trail lengkap
- Fresh E2E run dari clean state PASS
