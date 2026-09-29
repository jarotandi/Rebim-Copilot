# ReBIM Copilot Hybrid - Revit First

Proof of Concept untuk ReBIM Copilot Hybrid dengan strategi Revit-first. Menghubungkan percakapan natural language dengan konteks BIM dan tool eksekusi yang aman di Autodesk Revit 2025.

## Arsitektur

```
ReBIM Copilot UI (WPF Sidebar)
       |
       v
ReBIM AI Gateway (TypeScript/Node.js)
       |
       v
Provider Router (Ollama / OpenAI / Claude)
       |
       v
ReBIM MCP Server (TypeScript)
       |
       v
Named Pipe IPC
       |
       v
Revit 2025 Add-in (C#/.NET 8)
       |
       v
ExternalEvent -> Transaction -> Revit API
```

## Komponen

### 1. Contracts (`/contracts`)
- JSON schemas untuk command, result, dan context
- Tool registry dengan risk classification
- Error code catalog

### 2. Revit Add-in (`/addin`)
- C#/.NET 8 Add-in untuk Revit 2025
- Named Pipe IPC server
- Command handler registry
- ExternalEvent untuk thread-safe Revit API access

### 3. AI Gateway (`/gateway`)
- TypeScript/Node.js gateway server
- MCP (Model Context Protocol) server
- Provider router (Ollama, OpenAI, Anthropic)
- Tool registry dan audit logger

### 4. UI (`/ui`)
- WPF Sidebar dengan chat interface
- Context chips untuk view dan selection
- Mode selector (Ask/Analyze/Edit/Automate)
- Provider selector

### 5. Tests (`/tests`)
- Contract validation tests
- Tool registry tests
- IPC communication tests

## Development Setup

### Prerequisites
- Windows 11
- Autodesk Revit 2025
- .NET 8 SDK
- Node.js 22+
- Ollama (untuk local AI)

### Build

```bash
# Build Revit Add-in
cd addin
dotnet build

# Build Gateway
cd gateway
npm install
npm run build
```

### Run

```bash
# Start Ollama
ollama serve

# Start Gateway
cd gateway
npm run dev

# Load Add-in di Revit 2025
# Buka Revit -> Ribbon -> ReBIM Copilot -> Open Copilot
```

## RCP Stages

| Stage | Fokus | Gate |
|-------|-------|------|
| RCP-00 | Freeze architecture + schema | Blueprint + contracts PASS |
| RCP-01 | Revit 2025 Add-in | Add-in loads |
| RCP-02 | Named Pipe bridge | Ping Revit PASS |
| RCP-03 | get_selection | Selection returned |
| RCP-04 | View + properties | Real BIM context |
| RCP-05 | MCP TS server | Inspector PASS |
| RCP-06 | Ollama + tools | Local AI -> Revit PASS |
| RCP-07 | Sidebar + textbox | End-to-end Ask |
| RCP-08 | set_parameter dry-run | Preview PASS |
| RCP-09 | Approval + Transaction | Apply PASS |
| RCP-10 | Undo / rollback | Undo PASS |
| RCP-11 | Hybrid router | Local/OpenAI/Claude switch |
| RCP-12 | Privacy + snapshot | Stale mutation rejected |
| RCP-13 | Audit + diagnostics | All actions traceable |
| RCP-14 | Fresh E2E verification | Works in Revit |

## Safety Rules

1. **No silent model mutation** - Semua perubahan harus melalui approval
2. **Tool allowlist** - Hanya tool yang terdaftar yang bisa dipanggil
3. **Write action validation** - Preview + approval + transaction
4. **ExternalEvent only** - Revit API hanya dipanggil dari context yang valid
5. **Native Undo** - Semua perubahan dapat di-undo dengan Ctrl+Z
6. **Context revision** - Stale context detection untuk mencegah konflik

## Tool Registry

| Tool | Risk | Mode | Deskripsi |
|------|------|------|-----------|
| get_project_info | READ | Ask+ | Metadata project/session |
| get_active_view | READ | Ask+ | Current view context |
| get_selection | READ | Ask+ | Current selected elements |
| get_element | READ | Ask+ | Element identity/details |
| get_element_properties | READ | Ask+ | Parameter values |
| find_elements | READ | Analyze+ | Filtered search with limits |
| select_elements | UI | Ask+ | Select returned IDs |
| highlight_elements | UI | Ask+ | Visual focus |
| set_parameter | SAFE_WRITE | Edit+ | Change one validated parameter |

## Error Codes

| Code | Makna | Action |
|------|-------|--------|
| REBIM_VALIDATION_ERROR | Arguments/schema invalid | Fix request / regenerate |
| REBIM_CAPABILITY_UNAVAILABLE | Tool unsupported | Switch mode/host |
| REBIM_PERMISSION_DENIED | Policy blocks action | Request permission |
| REBIM_STALE_CONTEXT | Model changed after proposal | Refresh and regenerate |
| REBIM_IPC_UNAVAILABLE | Revit bridge not connected | Reconnect/restart |
| REBIM_REVIT_CONTEXT_BUSY | Revit not ready | Retry when idle |
| REBIM_EXECUTION_FAILED | Handler/transaction failed | Show error; rollback |
| REBIM_PROVIDER_UNAVAILABLE | AI provider unavailable | Fallback if allowed |
| REBIM_CLOUD_BLOCKED | Privacy policy blocks cloud | Use local provider

## Lisensi

Experimental POC - ReBIM Internal
