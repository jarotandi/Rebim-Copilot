# RCP-01 — Revit 2025 Add-in Shell

**Status:** PASS — SEALED CANDIDATE  
**Branch:** `rcp-01-revit-addin-shell`  
**Starting baseline:** `c06888010a56346e8182bc5707cabd81e11cd1a3` (merged RCP-00)  
**Final implementation SHA before seal:** `fd22b82308480ccaa1a39cce0b894356bae4c68a`  
**Contract baseline:** `0.1.0` — FROZEN

## Goal

Prove that ReBIM Copilot is a real, loadable Autodesk Revit 2025 add-in before IPC, AI, MCP, or model-mutation work begins.

## Delivered scope

- Revit 2025 .NET 8 / WPF add-in project;
- valid Revit add-in manifest and reproducible per-user installer;
- frozen AddInId `e18ae9d3-e8f8-4ae9-b7ac-80467cad65c6`;
- frozen DockablePaneId `d3b005f6-7e7b-4381-83ea-1c7415544db9`;
- `ReBIM` ribbon tab and `ReBIM Copilot` panel;
- Open Copilot and Diagnostics external commands;
- required `Transaction(TransactionMode.Manual)` metadata on external commands;
- registered DockablePane and non-blocking sidebar shell;
- startup/shutdown/event logging;
- runtime diagnostics for Revit version/build and active document/view;
- embedded 16x16 and 32x32 ribbon icons with graceful fallback;
- side-by-side runtime-test procedure that does not disturb an active work Revit instance.

## Runtime acceptance — PASS

Fresh manual verification in Autodesk Revit 2025 confirmed:

- [x] Revit 2025 launches with the add-in enabled.
- [x] Add-in loads without startup error.
- [x] ReBIM ribbon tab is visible.
- [x] Open Copilot command executes.
- [x] Registered DockablePane opens.
- [x] Sidebar renders and Revit remains responsive.
- [x] DockablePane can be closed and reopened.
- [x] Diagnostics command executes.
- [x] Diagnostics detects the active document and active view.
- [x] Ribbon icons render for Open Copilot and Diagnostics.
- [x] Clean Revit shutdown verified.
- [x] Build verified with 0 errors.

Known build warnings remain non-blocking for RCP-01: Revit/.NET assembly conflict warnings and nullable-analysis warnings.

## Safety acceptance — PASS

- [x] Frozen RCP-00 semantic contracts remain unchanged.
- [x] Frozen AddInId and DockablePaneId remain unchanged.
- [x] No Named Pipe/authentication implementation.
- [x] No ExternalEvent command queue implementation.
- [x] No MCP runtime.
- [x] No AI provider runtime.
- [x] No live `get_selection`.
- [x] No model-write transaction implementation.

## Recovery sequence

RCP-01 was proven through incremental repair rather than hiding runtime failures:

- `d988d60` — initial Revit 2025 add-in shell;
- `6bdfc32` — compile/runtime repair;
- `e37ea30` — installer layout repair;
- `e807597` — required Revit transaction attributes;
- `fd22b82` — ribbon icons and final UI polish.

## Seal decision

**RCP-01 PASS.**

The Revit-host shell boundary is now proven in a real Revit 2025 runtime. RCP-01 is frozen after merge to `main`.

The next stage is **RCP-02 — Authenticated Local IPC + ExternalEvent Bridge**.

RCP-02 may establish transport/authentication, command dispatch, queueing, and Revit API-context marshalling, but must not implement RCP-03 live BIM tools or later AI/MCP/write stages.

## STOP boundary

Do not add more RCP-01 features after seal. Any new runtime transport or Revit command execution infrastructure belongs to RCP-02 or later.
