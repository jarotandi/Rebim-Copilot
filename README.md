# ReBIM Copilot Hybrid — Revit First

> **Latest sealed stage:** RCP-00 Contract Freeze — protocol/contract `0.1.0`.
> **Next stage:** RCP-01 Revit 2025 Add-in runtime proof. No RCP-01+ runtime stage is considered PASS without fresh stage evidence.

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

The repository contains the architectural scaffold, while runtime behavior remains phase-gated. RCP-00 freezes the semantic contracts; RCP-01 proves the real Revit add-in; RCP-02 owns the authenticated Named Pipe + ExternalEvent execution boundary.

## Current contract baseline

Canonical contract set:

- Protocol: `0.1.0`
- Contract version: `0.1.0`
- Status: **FROZEN**
- Initial host: `revit`

See:

- `contracts/README.md`
- `docs/architecture/RCP-00-CONTRACT-ACCEPTANCE-MATRIX.md`
- `docs/checkpoints/RCP-00-CONTRACT-FREEZE.md`

## Repository components

- `contracts/` — canonical command/result/context schemas, tool registry, error catalog and fixtures.
- `addin/` — C#/.NET 8 Revit 2025 add-in scaffold.
- `gateway/` — TypeScript AI/MCP/provider gateway.
- `ui/` — WPF sidebar scaffold.
- `tests/` — contract/tool/IPC baseline verification.

## Stage map

| Stage | Focus | Status / Gate |
|---|---|---|
| RCP-00R | Baseline recovery | ✅ PASS |
| RCP-00 | Freeze contracts | ✅ PASS |
| RCP-01 | Revit 2025 Add-in | NEXT — real add-in loads |
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
8. Incompatible changes to frozen contracts require a version bump.

## Baseline development commands

```bash
cd gateway
npm install
npm run build
npm test
```

Revit runtime verification requires Revit 2025 on Windows and begins at RCP-01.
