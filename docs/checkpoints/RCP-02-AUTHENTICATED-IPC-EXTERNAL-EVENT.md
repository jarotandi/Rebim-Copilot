# RCP-02 — Authenticated Local IPC + ExternalEvent Bridge

**Status:** SEALED — REAL REVIT 2025 RUNTIME PASS  
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

- [x] Revit add-in Release build: 0 errors.
- [x] Gateway TypeScript build: PASS.
- [x] Existing RCP-00 contract/tool tests remain PASS.
- [x] Named Pipe is the only production local IPC transport.
- [x] No TCP localhost fallback remains in the active RCP-02 path.
- [x] Authentication is mandatory before bridge requests.
- [x] Authentication/session secret is cryptographically random and not hard-coded.
- [x] Input/frame size is bounded.
- [x] Request queue is bounded.
- [x] Timeouts are explicit.
- [x] One ExternalEvent handler instance is paired with one ExternalEvent and actually owns queued executions.
- [x] No model-write Transaction exists in RCP-02 code.
- [x] Frozen contracts remain unchanged.

### Runtime — real Revit 2025

- [x] Revit starts and RCP-01 UI still works.
- [x] Bridge runtime starts cleanly.
- [x] Gateway discovers the running Revit instance.
- [x] Unauthenticated request is rejected.
- [x] Authenticated handshake succeeds.
- [x] Authenticated local ping succeeds.
- [x] Internal context probe executes through ExternalEvent and returns correlated response.
- [x] At least 10 sequential requests succeed without deadlock.
- [x] Concurrent/burst requests are serialized or safely bounded according to policy.
- [x] Timeout path returns deterministic error without hanging Revit.
- [x] Gateway disconnect/reconnect succeeds.
- [x] Revit remains responsive throughout.
- [x] Revit shutdown stops the pipe/queue cleanly.
- [x] No background process/thread prevents clean exit.

## Evidence required before seal

- [x] exact starting/final SHA;
- [x] Release build results;
- [x] gateway test results;
- [x] frozen-contract regression results;
- [x] transport/auth focused tests;
- [x] real Revit 2025 handshake/ping/context-probe evidence;
- [x] rejection evidence for unauthenticated request;
- [x] reconnect evidence;
- [x] clean shutdown evidence;
- [x] final scope diff proving no RCP-03+ implementation.

## STOP boundary

RCP-02 is complete only when the authenticated local bridge and ExternalEvent marshalling are proven in a real Revit 2025 runtime.

Do **not** implement `get_selection` or any later BIM/MCP/AI/write capability while closing RCP-02.

## Implementation and hardening history

### RCP-02 opening
- baseline RCP-01 main: `d5eb118fc3f8f84b48ee260bead9322a6609982c`
- opening checkpoint: `b144c766935d35353fa819ce7c1bcfe582f4ea5d`

### A1-A4: iterative static/transport hardening
- A4: `d8751f11512fc437c140a71fe871d82b8d0474c0`
- bounded queue/work item/timeout correctness

### R1: runtime discovery found descriptor JSON casing mismatch
- C# default JSON differed from expected camelCase

### R2: `e15320988d1f6efb66d54f1df8ad503f1fe1af3c`
- aligned runtime descriptor JSON contract
- first R2 runtime attempt was invalid because installed DLL was stale/locked, so do NOT treat that attempt as runtime acceptance

### R3:
- fresh Revit descriptor worked
- raw Node response exposed wire-response issue
- old smoke error swallowing masked parser failure as timeout

### R4:
- test Revit exited before evidence completion
- no code change / no acceptance

### R5: `bd97a37c6c28cb2ae704c88c1e162622d3461d98`
- **REAL ROOT CAUSE:** server response was double-framed
- ProcessFrame/EncodeResponse already returned framed bytes and HandleClientAsync framed them again
- fixed to exactly one response frame
- do NOT describe R5 as merely a harness issue

### R6: `5df6d0715673d28084e399f760f4e9b3c2d14fdf`
- deterministic same-client timeout via inbound pause/resume
- raw AUTH_REQUIRED probe hardened
- error swallowing removed

### R7:
- fresh Revit loader diagnosis
- "Security - Unsigned Add-In" trust dialog was proven to block OnStartup in one test launch
- user selected/used Always Load for test environment
- treat this as environment/trust diagnosis, not bridge protocol defect

### R8 runtime:
- core path/stress/timeout passed
- reconnect exposed lifecycle synchronization gap

### R9:
- disconnect() semantics hardened to wait for actual socket close
- bounded explicit reconnect behavior added to runtime smoke
- no automatic production reconnect introduced

### R9B: `36321d58a6f94c6c83072e7a367b3c19eff473e8`
- found local connect Promise could settle at raw socket connection before authentication completed
- corrected connect() contract:
  await connect() now means transport connected + auth succeeded + authenticated state true
- focused lifecycle regression coverage
- 64/64 tests PASS

## Final real Revit 2025 acceptance

**Test PID:** 15184  
**Protected/work Revit:** PID 17836 untouched  
**PID 14028:** not running during final test  

### Descriptor
- camelCase: PASS
- bridgeVersion: 1
- processId: matched
- token present but NEVER recorded

### Connection semantics
- await connect: PASS
- isConnectedToRevit() true immediately after await: true
- ping: PASS
- context_probe: PASS
- executedOnExternalEvent: true
- disconnect close observed: PASS

### 16-gate smoke
| Gate | Test | Result |
|------|------|--------|
| 1 | discovery | PASS |
| 2 | AUTH_REQUIRED | PASS |
| 3 | authenticated connect | PASS |
| 3 | immediate authenticated state | PASS |
| 4 | ping | PASS |
| 5 | context_probe | PASS |
| 5 | executedOnExternalEvent | true |
| 6 | 10/10 sequential | PASS |
| 7 | 8/8 concurrent | PASS |
| 7 | 8/8 ExternalEvent | PASS |
| 8 | 40/40 durability | PASS |
| 8 | 40/40 ExternalEvent | PASS |
| 9 | deterministic timeout | PASS |
| 10 | pending count zero | PASS |
| 11 | post-timeout ping | PASS |
| 12 | post-timeout context_probe | PASS |
| 12 | ExternalEvent | true |
| 13 | disconnect | PASS |
| 13 | close observed | PASS |
| 14 | explicit reconnect | PASS (attempt 1, 0 transient failures) |
| 15 | ping after reconnect | PASS |
| 16 | final disconnect | PASS |
| | exit code | 0 |

### Lifecycle
- Revit responsive before/after: true
- graceful CloseMainWindow: PASS
- PID exited naturally: true
- descriptor auto-removed: true
- Named Pipe stopped: true (log confirmed)
- bridge stopped: true (log confirmed)
- add-in shutdown completed: true (log confirmed)
- unexpected errors: none

### Static
- gateway build: PASS
- 64/64 tests: PASS
- Revit build: 0 errors
- contracts frozen/unchanged: true
- no RCP-03 leakage: true

## Final lineage

START: `d5eb118fc3f8f84b48ee260bead9322a6609982c`  
R5: `bd97a37c6c28cb2ae704c88c1e162622d3461d98`  
R6: `5df6d0715673d28084e399f760f4e9b3c2d14fdf`  
R9B: `36321d58a6f94c6c83072e7a367b3c19eff473e8`  
Seal commit: `<filled after commit>`