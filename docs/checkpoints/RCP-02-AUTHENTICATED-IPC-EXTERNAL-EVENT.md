# RCP-02: Authenticated IPC + ExternalEvent Bridge

**Status:** IN PROGRESS
**Branch:** `rcp-02-authenticated-ipc-external-event`
**Starting baseline:** `d5eb118fc3f8f84b48ee260bead9322a6609982c` (merged RCP-01)
**Contract baseline:** `0.1.0` — FROZEN

## Goal

Implement ONLY this boundary:

```
Gateway / local client
        ↓
Authenticated local Windows Named Pipe
        ↓
Revit add-in bridge server
        ↓
Bounded request queue
        ↓
ONE authoritative ExternalEvent
        ↓
valid Revit API UI context
```

## Authorized scope

- Windows Named Pipe transport (local only)
- Length-prefixed framing protocol
- Authentication with random token
- Runtime discovery descriptor
- Bounded work queue
- ONE ExternalEvent for Revit API marshalling
- Bridge control operations: authenticate, ping, context_probe
- Smoke test CLI
- CI workflow for gateway

## Explicitly excluded

- get_selection, get_active_view, get_element, get_element_properties
- find_elements, set_parameter
- model creation/modification
- Revit Transaction for model writes
- MCP acceptance/runtime
- Ollama, OpenAI, Claude
- chat loop
- arbitrary code execution
- TCP fallback
- HTTP server for Revit transport

## Acceptance gate

- [ ] Build 0 errors
- [ ] Gateway build PASS
- [ ] Gateway tests PASS
- [ ] No TCP fallback
- [ ] Authentication works
- [ ] Ping works
- [ ] Context probe works via ExternalEvent
- [ ] Multiple Revit instances handled correctly
- [ ] Frozen contracts unchanged
- [ ] No RCP-03+ scope leakage

## STOP boundary

Do not claim RCP-02 PASS from static code alone. The final gate requires real Revit 2025 runtime evidence.
