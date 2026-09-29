# ReBIM Copilot Hybrid — Revit First

> **Engineering status:** RCP-00R Baseline Recovery is in progress on branch `rcp-00r-baseline-recovery`.
> The current codebase is an architectural scaffold. No RCP-00…RCP-14 stage is considered sealed until its documented gate has fresh evidence.

ReBIM Copilot Hybrid is a Revit-first proof-of-concept for a safe BIM copilot that combines local/cloud AI, MCP tools, explicit approval, and Autodesk Revit execution.

## Canonical target architecture

```text
ReBIM Copilot UI
       |
       v
ReBIM AI Gateway
       |
       v
Provider Router
(Ollama / OpenAI / Anthropic)
       |
       v
ReBIM MCP Tool Layer
       |
       v
Authenticated local IPC
       |
       v
Revit 2025 Add-in
       |
       v
ExternalEvent -> Validation -> Transaction -> Revit API
```

The scaffold currently contains all of these conceptual layers, but several boundaries are intentionally **not yet production-wired**. In particular, RCP-02 owns the canonical Named Pipe/auth/ExternalEvent path, RCP-07 owns the live sidebar-to-gateway path, and RCP-08+ owns write execution.

## Current recovery scope

RCP-00R exists to recover a deterministic baseline before feature development:

- make Gateway TypeScript buildable;
- make tests discoverable and internally consistent;
- remove known compile blockers in scaffold code;
- document unresolved runtime boundaries instead of claiming them PASS;
- add CI for Gateway build/tests;
- preserve the eBook stage order RCP-00 -> RCP-14.

See `docs/checkpoints/RCP-00R-BASELINE-RECOVERY.md`.

## Repository components

- `contracts/` — command/result/context schemas, tool registry, error taxonomy.
- `addin/` — C#/.NET 8 Revit 2025 add-in scaffold.
- `gateway/` — TypeScript AI/MCP/provider gateway.
- `ui/` — WPF sidebar scaffold.
- `tests/` — baseline contract/tool/IPC tests.

## Stage map

| Stage | Focus | Gate |
|---|---|---|
| RCP-00R | Baseline recovery | deterministic scaffold baseline |
| RCP-00 | Freeze contracts | schema/registry/acceptance PASS |
| RCP-01 | Revit 2025 Add-in | real add-in loads |
| RCP-02 | Named Pipe + ExternalEvent | authenticated ping PASS |
| RCP-03 | get_selection | live selection returned |
| RCP-04 | BIM context | view/properties real context |
| RCP-05 | MCP server | Inspector PASS |
| RCP-06 | Ollama + tools | Local AI -> MCP -> Revit PASS |
| RCP-07 | Sidebar | end-to-end Ask PASS |
| RCP-08 | set_parameter dry-run | Preview PASS |
| RCP-09 | Approval + Transaction | Apply PASS |
| RCP-10 | Undo / rollback | native Undo PASS |
| RCP-11 | Hybrid router | provider switching/fallback |
| RCP-12 | Privacy + snapshot | stale mutation rejected |
| RCP-13 | Audit + diagnostics | actions traceable |
| RCP-14 | Fresh E2E | ReBIM Copilot Works in Revit |

## Safety invariants

1. No silent model mutation.
2. Revit API access must be marshalled onto a valid Revit API context.
3. Write tools require validation, preview and approval.
4. Native Revit Transaction/Undo semantics are preserved.
5. Context revision guards stale proposals.
6. Provider choice must not bypass tool policy.
7. Arbitrary code execution is not a normal Copilot capability.

## Baseline development commands

```bash
cd gateway
npm install
npm run build
npm test
```

Revit runtime verification is intentionally phase-gated and requires Revit 2025 on Windows.
