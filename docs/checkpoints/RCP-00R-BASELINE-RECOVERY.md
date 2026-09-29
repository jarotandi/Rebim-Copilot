# RCP-00R — Baseline Recovery

**Status:** PASS — READY FOR REVIEW / MERGE  
**Repository:** `jarotandi/Rebim-Copilot`  
**Branch:** `rcp-00r-baseline-recovery`  
**Starting SHA:** `e02d7ad58deeadf7cc47c2681dcecb369a5a9f5a`  
**Verified implementation SHA:** `2ffb1aba4a881cd438e5dc6d3b9224dcc1d76d13`  
**Purpose:** recover a deterministic engineering baseline before RCP-00 is sealed.

## 1. Why this recovery exists

The starting commit created the intended ReBIM Copilot architecture in one scaffold, but it also claimed broad RCP-00 to RCP-14 readiness before fresh stage-by-stage evidence existed.

The recovery phase does **not** add product features. It separates scaffold presence from verified implementation.

## 2. Authorized scope

RCP-00R may:

- repair TypeScript compile blockers;
- repair test discovery/import/assertion defects;
- repair obvious source-level compile blockers;
- add baseline CI;
- document known runtime mismatches;
- correct status wording that could be read as a PASS claim.

RCP-00R must not:

- implement production Named Pipe/authentication;
- implement Revit model reads beyond existing scaffold;
- implement write transactions;
- implement provider-normalized agent execution;
- claim any RCP-01+ runtime gate as PASS.

## 3. Starting defects recorded

1. Gateway IPC client uses TCP `localhost:8080` while add-in scaffold uses `NamedPipeServerStream`.
2. Authentication handshake is not defined end-to-end.
3. IPC listener currently calls `CommandHandler.Execute` directly instead of routing all Revit API work through `ExternalEvent`.
4. WPF sidebar files exist but are not yet a registered Revit DockablePane.
5. WPF `GatewayClient` expects HTTP endpoints that the Gateway does not yet expose.
6. `get_element`, `get_element_properties`, `find_elements`, and `set_parameter` remain stubs.
7. Agent loop assumes an OpenAI-shaped tool-call response; provider normalization is not yet implemented.
8. Existing tests had path/assertion inconsistencies and were not wired deterministically to the Gateway test command.
9. Approval service used a non-existent `crypto.v4` import.
10. Gateway configuration type was not strict enough for `ProviderRouter`.
11. Diagnostics referenced `IpcServer.IsRunning` before the property existed.

## 4. Recovery changes completed

- fixed Gateway configuration typing;
- replaced invalid approval ID generation with `crypto.randomUUID()`;
- made the root test suite discoverable from the Gateway package;
- corrected result-schema error-code assertion;
- removed contradictory tool-registry assertions;
- corrected test imports to Gateway source;
- added explicit `IpcServer.IsRunning` state;
- made the pipe scaffold process one request deterministically instead of disposing a fire-and-forget handler immediately;
- added GitHub Actions Gateway baseline verification;
- documented that production IPC/auth/ExternalEvent remains owned by RCP-02;
- corrected repository status wording so scaffold presence is not confused with sealed implementation.

## 5. Verification evidence

GitHub Actions ran against implementation SHA `2ffb1aba4a881cd438e5dc6d3b9224dcc1d76d13`.

### Push workflow

- Run: `36568285852`
- Conclusion: **SUCCESS**
- Node: `v22.23.2`
- TypeScript build: **PASS**
- Test files: **3/3 PASS**
- Tests: **27/27 PASS**

### Pull-request workflow

- Run: `36568335359`
- Conclusion: **SUCCESS**
- Same head SHA: `2ffb1aba4a881cd438e5dc6d3b9224dcc1d76d13`

### Test breakdown

- `contracts.test.ts`: 15/15 PASS
- `tool-registry.test.ts`: 9/9 PASS
- `ipc.test.ts`: 3/3 PASS

## 6. RCP-00R acceptance gate

- [x] Gateway dependency install succeeds on clean CI runner.
- [x] `npm run build` PASS.
- [x] `npm test` PASS and discovers the intended tests.
- [x] No test contains contradictory assertions.
- [x] Known RCP-02/RCP-07/RCP-08+ runtime gaps are documented.
- [x] No later RCP stage is represented as sealed.
- [x] Branch diff is limited to baseline recovery.
- [x] Verified implementation SHA recorded.
- [x] Working branch is ready for review/merge.

## 7. Deferred to next stages

### RCP-00
Freeze canonical command/result/context contracts and remove contract duplication/drift.

### RCP-01
Prove a real Revit 2025 add-in load, ribbon, dockable pane, diagnostics and clean shutdown.

### RCP-02
Replace transport scaffold with canonical authenticated Named Pipe + queue + ExternalEvent execution.

## 8. Seal statement

```text
RCP-00R BASELINE RECOVERY

START:
e02d7ad58deeadf7cc47c2681dcecb369a5a9f5a

VERIFIED IMPLEMENTATION:
2ffb1aba4a881cd438e5dc6d3b9224dcc1d76d13

GATEWAY BUILD:
PASS

TESTS:
27 / 27 PASS

PUSH CI:
PASS

PR CI:
PASS

RCP-01+ RUNTIME CLAIMS:
NONE

STATUS:
PASS — READY FOR REVIEW / MERGE
```

## 9. STOP boundary

RCP-00R is complete. Do not begin RCP-00 contract freeze on this branch. Start RCP-00 from the reviewed/merged recovery baseline in a new stage branch.
