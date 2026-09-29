# RCP-00R — Baseline Recovery

**Status:** IN PROGRESS  
**Repository:** `jarotandi/Rebim-Copilot`  
**Branch:** `rcp-00r-baseline-recovery`  
**Starting SHA:** `e02d7ad58deeadf7cc47c2681dcecb369a5a9f5a`  
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

## 4. Recovery changes

- fix Gateway configuration typing;
- use `crypto.randomUUID()` in approval service;
- make root test suite discoverable from the Gateway package;
- correct schema assertion for error-code enum;
- correct tool-registry test contradiction;
- correct test imports to Gateway source;
- add explicit `IpcServer.IsRunning` state;
- make the pipe scaffold process one request deterministically instead of disposing a fire-and-forget client handler immediately;
- add GitHub Actions Gateway baseline verification;
- mark RCP-02 transport/auth/ExternalEvent work explicitly deferred.

## 5. RCP-00R acceptance gate

Required before sealing:

- [ ] Gateway dependency install succeeds on clean CI runner.
- [ ] `npm run build` PASS.
- [ ] `npm test` PASS and discovers the intended tests.
- [ ] No test contains contradictory assertions.
- [ ] Known RCP-02/RCP-07/RCP-08+ runtime gaps are documented.
- [ ] No later RCP stage is represented as sealed.
- [ ] Branch diff is limited to baseline recovery.
- [ ] Final SHA recorded.
- [ ] Working branch is ready for review/merge.

## 6. Deferred to next stages

### RCP-00
Freeze canonical command/result/context contracts and remove contract duplication/drift.

### RCP-01
Prove a real Revit 2025 add-in load, ribbon, dockable pane, diagnostics and clean shutdown.

### RCP-02
Replace transport scaffold with canonical authenticated Named Pipe + queue + ExternalEvent execution.

## 7. STOP boundary

Do not start RCP-00 feature/contract freeze until RCP-00R CI evidence is green.
