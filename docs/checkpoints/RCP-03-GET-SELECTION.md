# RCP-03 — Get Selection Read-Only Vertical Slice

**Status:** IMPLEMENTATION IN PROGRESS — NOT SEALED  
**Branch:** `rcp-03-get-selection`  
**Starting baseline:** `d00c9a9ae0f2948e95b959733d59fff5c6981122` (merged/sealed RCP-02)  
**Contract baseline:** `0.1.0` — FROZEN

## Goal

Implement the first real semantic BIM read command: `get_selection`

End-to-end path:

```
TypeScript Gateway
    ↓
Frozen ReBIM semantic CommandEnvelope 0.1.0
    ↓
Authenticated RCP-02 Named Pipe
    ↓
private bridge semantic-command carrier
    ↓
bounded queue
    ↓
single existing ExternalEvent
    ↓
Revit UI/API context
    ↓
read current selection
    ↓
Frozen ResultEnvelope 0.1.0
    ↓
Gateway
```

RCP-03 is READ ONLY.

No model mutation.
No Transaction.
No MCP exposure.
No AI/provider integration.
No get_element.
No get_active_view.
No get_element_properties.
No find_elements.
No select_elements.
No highlight_elements.
No set_parameter.

STOP after RCP-03A acceptance.

DO NOT seal/merge in this run.

## Frozen Contract — MUST NOT CHANGE

Canonical source:

- `contracts/tool-registry.json`
- `contracts/command.schema.json`
- `contracts/result.schema.json`
- `contracts/context.schema.json`
- `contracts/fixtures/command.get-selection.json`
- `contracts/fixtures/result.get-selection.json`
- `contracts/fixtures/context.selection.json`

Protocol: `0.1.0`

### get_selection registry definition

```json
{
  "name": "get_selection",
  "risk": "READ",
  "mutatesModel": false,
  "requiresApproval": false,
  "modes": ["Ask", "Analyze", "Edit", "Automate"],
  "arguments": {
    "maxResults": "integer 1..100, optional, default 100"
  },
  "additionalProperties": false
}
```

### Canonical semantic command example

```json
{
  "protocolVersion": "0.1.0",
  "requestId": "req-001",
  "host": "revit",
  "command": "get_selection",
  "contextRevision": "0123456789abcdef",
  "arguments": {
    "maxResults": 25
  }
}
```

### Canonical successful semantic result shape

```json
{
  "protocolVersion": "0.1.0",
  "requestId": "req-001",
  "ok": true,
  "result": {
    "elements": [
      {
        "id": "183728",
        "category": "Doors",
        "family": "Single Flush",
        "type": "900x2100",
        "level": "Level 2"
      }
    ]
  }
}
```

### For RCP-03 DO NOT add to get_selection result:

- parameters
- geometry
- bounding boxes
- view data
- document paths
- materials
- cost
- classification
- worksets
- phases
- location
- coordinates
- parameter values

## Semantic Error Codes

Use ONLY frozen semantic error codes from `result.schema.json`.

For RCP-03:
- invalid semantic envelope or invalid maxResults: `REBIM_VALIDATION_ERROR`
- valid semantic command but capability not implemented: `REBIM_CAPABILITY_UNAVAILABLE`
- no active Revit document: `REBIM_CAPABILITY_UNAVAILABLE`
- unexpected command execution failure: `REBIM_EXECUTION_FAILED`

Do NOT add new semantic error codes.

Transport errors (`AUTH_REQUIRED`, `AUTH_FAILED`, `QUEUE_FULL`, `REQUEST_TIMEOUT`, `REVIT_CONTEXT_BUSY`) remain PRIVATE RCP-02 bridge errors. Do not mix transport errors with semantic ResultEnvelope errors.

## Important Two-Layer Rule

Maintain strict separation:

**OUTER:** private BridgeResponse  
**INNER:** frozen semantic ResultEnvelope

Example conceptually:

```json
{
  "bridgeVersion": 1,
  "requestId": "<transport request>",
  "ok": true,
  "result": {
    "protocolVersion": "0.1.0",
    "requestId": "<semantic request>",
    "ok": true,
    "result": {
      "elements": [...]
    }
  }
}
```

- Outer `ok=false`: ONLY transport/bridge failure
- Inner `ok=false`: semantic command failure

Do NOT collapse these two layers.

## Implementation Plan

### 4. Add Private Semantic Bridge Operation
- Extend private bridge protocol minimally
- Operation name: `semantic_command`
- Carry frozen semantic command envelope

### 5. Work Item Payload
- Extend `BridgeWorkItem` minimally
- Carry outer transport requestId, bridge operation, frozen semantic command envelope

### 6. Named Pipe Server
- After authentication: `semantic_command` enters same bounded ExternalEvent queue
- Server: parse, authenticate, ensure semantic payload, enqueue, await, return exactly one framed response

### 7. Semantic Dispatcher
- Add `SemanticCommandDispatcher.cs` and `GetSelectionCommand.cs`
- Flow: `BridgeExternalEventHandler.Execute()` → semantic dispatcher → get_selection handler
- Other valid semantic commands return `REBIM_CAPABILITY_UNAVAILABLE`

### 8. Semantic Envelope Validation
- Validate: `protocolVersion == "0.1.0"`, `host == "revit"`, `requestId` non-empty, `command == "get_selection"`, `arguments` is object
- `maxResults`: missing=100, valid=1..100 integer, invalid→`REBIM_VALIDATION_ERROR`
- `contextRevision`: accept if present, no stale-context comparison in RCP-03

### 9. GetSelection Revit Implementation
- Run ONLY inside ExternalEvent valid API context
- Use: `UIApplication` → `ActiveUIDocument` → `UIDocument.Selection.GetElementIds()`
- No ActiveUIDocument → `REBIM_CAPABILITY_UNAVAILABLE`
- Empty selection → SUCCESS with `elements: []`
- Bound results to `maxResults`
- Deterministic truncation: stable ordering (ElementId ascending)

### 10. Element Normalization
Each element contains ONLY:
- `id`: string, required, ElementId value converted invariantly
- `category`: string, required, `element.Category?.Name` or empty string
- `family`: string or null
- `type`: string or null
- `level`: string or null

Use generic metadata APIs. DO NOT use `LookupParameter()`. DO NOT iterate parameters. DO NOT expose parameter values.

### 11. Missing/Deleted Element Safety
- Skip unresolved element IDs safely
- Result count never exceeds `maxResults`
- No placeholder fake elements

### 12. Semantic Result Envelope
Success:
```json
{
  "protocolVersion": "0.1.0",
  "requestId": "<semantic command requestId>",
  "ok": true,
  "result": { "elements": [...] }
}
```

Failure:
```json
{
  "protocolVersion": "0.1.0",
  "requestId": "<same semantic requestId if available>",
  "ok": false,
  "error": { "code": "...", "message": "..." }
}
```

### 13. Gateway IPC Types
Extend `gateway/src/ipc/types.ts` only as required. Import/reference `CommandEnvelope`, `ResultEnvelope` from `gateway/src/contracts/types.ts`. Do NOT duplicate semantic contract types.

### 14. Gateway Client
Preserve all existing RCP-02 APIs. Add `executeSemanticCommand(command: CommandEnvelope): Promise<ResultEnvelope>` that:
1. Requires authenticated connection
2. Sends private `semantic_command` bridge operation
3. Receives OUTER BridgeResponse
4. If outer `ok=false`: transport failure
5. If outer `ok=true`: validate inner semantic ResultEnvelope
6. Verify semantic requestId correlation
7. Return inner ResultEnvelope

### 15. Optional GetSelection Convenience API
May add `getSelection(maxResults?: number)` as thin wrapper generating frozen semantic command.

### 16. Do Not Modify MCP/Agent
These files MUST remain unchanged:
- `gateway/src/mcp/server.ts`
- `gateway/src/agent/loop.ts`

## Acceptance Gates

### Static/Build
- [ ] Gateway build PASS
- [ ] All gateway tests PASS (count > 64)
- [ ] Revit add-in Release build: 0 errors
- [ ] `git diff -- contracts/` → NO OUTPUT
- [ ] `git diff --check` PASS

### RCP-02 Regression
- [ ] Existing 16-gate smoke test PASS (exit code 0)

### Real Revit 2025 RCP-03
- [ ] Basic get_selection: outer ok=true, inner ok=true, elements array with correct fields
- [ ] maxResults=1: exactly 1 element, deterministic ordering
- [ ] Empty selection: `elements: []` (if manually testable)
- [ ] Invalid arguments (0, 101, non-integer, unknown): inner `REBIM_VALIDATION_ERROR`, transport healthy
- [ ] Unsupported command (get_element): outer ok=true, inner `REBIM_CAPABILITY_UNAVAILABLE`
- [ ] 10 sequential: 10/10 PASS, requestId correlation correct
- [ ] 8 concurrent: 8/8 PASS, requestId correlation correct, no deadlock
- [ ] Revit responsive throughout

### Lifecycle
- [ ] Disconnect PASS
- [ ] Reconnect PASS
- [ ] Post-reconnect get_selection PASS
- [ ] Final disconnect PASS
- [ ] Descriptor auto-remove if test Revit closed

### Read-Only Proof
- [ ] NO `Transaction`, `TransactionGroup`, `SubTransaction`
- [ ] NO `Selection.SetElementIds`
- [ ] NO element parameter `Set`
- [ ] NO Delete/Create/NewElement
- [ ] Selection read path does not change current Revit selection
- [ ] No undo item created by get_selection

## Scope Audit

Allowed implementation files:
- `docs/checkpoints/RCP-03-GET-SELECTION.md`
- `addin/BridgeProtocol.cs`
- `addin/BridgeNamedPipeServer.cs`
- `addin/BridgeWorkItem.cs`
- `addin/BridgeExternalEventHandler.cs`
- `addin/ContractDtos.cs`
- New semantic dispatcher/handler files under `addin/`
- `gateway/src/ipc/types.ts`
- `gateway/src/ipc/client.ts`
- Focused tests
- Optional dedicated RCP-03 CI workflow

MUST NOT CHANGE:
- `contracts/**`
- `gateway/src/mcp/server.ts`
- `gateway/src/agent/loop.ts`

## Lineage

START: `d00c9a9ae0f2948e95b959733d59fff5c6981122`
RCP-03 OPEN: `<filled after commit>`
RCP-03 IMPL: `<filled after implementation>`