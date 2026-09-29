# RCP-02 — Authenticated Local IPC + ExternalEvent Bridge

**Status:** READY TO START  
**Branch:** `rcp-02-authenticated-ipc-external-event`  
**Starting baseline:** `d5eb118fc3f8f84b48ee260bead9322a6609982c` (merged/sealed RCP-01)  
**Contract baseline:** `0.1.0` — FROZEN

## Goal

Prove a safe local bridge from the TypeScript gateway to the Autodesk Revit 2025 add-in without implementing live BIM tools, MCP behavior, AI providers, or model mutation.

Canonical boundary:

```text
Gateway / local client
        |
        v
Authenticated local Named Pipe
        |
        v
Revit add-in transport boundary
        |
        v
Bounded command queue
        |
        v
ExternalEvent
        |
        v
Valid Revit API UI context
```

RCP-02 proves transport, authentication, framing, queueing, timeout/cancellation behavior, and Revit API-context marshalling only.

## Architectural invariants

1. **Local only.** No TCP listener and no LAN/WAN exposure.
2. **Authenticated before semantic commands.** Transport authentication is outside the frozen RCP-00 semantic command envelope.
3. **No Revit API calls from pipe/background threads.** Any operation that requires Revit API context must be marshalled through `ExternalEvent`.
4. **Bounded input.** Frames, queue length, payload size, and timeouts must be bounded and fail closed.
5. **Single authoritative ExternalEvent handler instance.** Requests must not create disconnected handler/event instances.
6. **No silent mutation.** RCP-02 does not open Revit model transactions or mutate model state.
7. **Frozen contracts stay frozen.** Incompatible semantic changes require a later contract version bump.
8. **No arbitrary code execution.** The bridge accepts allowlisted internal bridge operations only.
9. **Structured errors.** Disconnect, auth failure, timeout, busy Revit context, malformed frame, and shutdown must return deterministic errors.
10. **Clean lifecycle.** Startup, reconnect, multiple requests, gateway exit, and Revit shutdown must not leave hanging pipe or ExternalEvent state.

## Authorized scope

- C# Named Pipe server hosted by the Revit add-in;
- TypeScript/Node Named Pipe client;
- local Revit-instance discovery metadata;
- per-session authentication token or challenge;
- current-user-only runtime storage/permissions where practical;
- deterministic framing and request correlation;
- bounded request queue;
- one correctly wired `IExternalEventHandler` + `ExternalEvent` pair;
- internal bridge health/ping operation;
- internal Revit-context probe that proves execution inside ExternalEvent without exposing an RCP-03 BIM tool;
- timeout/cancellation/disconnect handling;
- startup/shutdown/reconnect logging;
- focused transport/integration tests;
- local runtime verification in Revit 2025.

## Explicitly excluded

- canonical `get_selection` implementation — RCP-03;
- active-view/element/property context extraction — RCP-04;
- MCP server/Inspector acceptance — RCP-05;
- Ollama/OpenAI/Anthropic runtime — RCP-06+;
- production Copilot chat loop — RCP-07;
- `set_parameter`, previews, approval, or Revit Transactions — RCP-08+;
- arbitrary TCP/HTTP exposure;
- arbitrary reflection/code execution;
- changes to frozen RCP-00 semantic schemas/tool registry unless a separate versioned contract change is explicitly approved.

## Required transport behavior

The implementation must separate **transport control messages** from **semantic Copilot commands**.

A transport session should support, at minimum:

```text
discover
  -> connect local pipe
  -> authenticate session
  -> health/ping
  -> queue internal context probe
  -> ExternalEvent execution
  -> correlated result
```

The internal context probe is diagnostic infrastructure, not a public Copilot/MCP tool. It may return bounded host facts such as Revit version/build and whether an active document exists, solely to prove ExternalEvent marshalling.

## Acceptance gates

### Static/build

- [ ] Revit add-in Release build: 0 errors.
- [ ] Gateway TypeScript build: PASS.
- [ ] Existing RCP-00 contract/tool tests remain PASS.
- [ ] Named Pipe is the only production local IPC transport.
- [ ] No TCP localhost fallback remains in the active RCP-02 path.
- [ ] Authentication is mandatory before bridge requests.
- [ ] Authentication/session secret is cryptographically random and not hard-coded.
- [ ] Input/frame size is bounded.
- [ ] Request queue is bounded.
- [ ] Timeouts are explicit.
- [ ] One ExternalEvent handler instance is paired with one ExternalEvent and actually owns queued executions.
- [ ] No model-write Transaction exists in RCP-02 code.
- [ ] Frozen contracts remain unchanged.

### Runtime — real Revit 2025

- [ ] Revit starts and RCP-01 UI still works.
- [ ] Bridge runtime starts cleanly.
- [ ] Gateway discovers the running Revit instance.
- [ ] Unauthenticated request is rejected.
- [ ] Authenticated handshake succeeds.
- [ ] Authenticated local ping succeeds.
- [ ] Internal context probe executes through ExternalEvent and returns correlated response.
- [ ] At least 10 sequential requests succeed without deadlock.
- [ ] Concurrent/burst requests are serialized or safely bounded according to policy.
- [ ] Timeout path returns deterministic error without hanging Revit.
- [ ] Gateway disconnect/reconnect succeeds.
- [ ] Revit remains responsive throughout.
- [ ] Revit shutdown stops the pipe/queue cleanly.
- [ ] No background process/thread prevents clean exit.

## Evidence required before seal

- exact starting/final SHA;
- Release build results;
- gateway test results;
- frozen-contract regression results;
- transport/auth focused tests;
- real Revit 2025 handshake/ping/context-probe evidence;
- rejection evidence for unauthenticated request;
- reconnect evidence;
- clean shutdown evidence;
- final scope diff proving no RCP-03+ implementation.

## STOP boundary

RCP-02 is complete only when the authenticated local bridge and ExternalEvent marshalling are proven in a real Revit 2025 runtime.

Do **not** implement `get_selection` or any later BIM/MCP/AI/write capability while closing RCP-02.
