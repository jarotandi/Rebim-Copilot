# RCP-01 — Revit 2025 Add-in Shell

**Status:** READY TO START  
**Branch:** `rcp-01-revit-addin-shell`  
**Starting baseline:** `c06888010a56346e8182bc5707cabd81e11cd1a3` (merged RCP-00)  
**Contract baseline:** `0.1.0` — FROZEN

## Goal

Prove that the ReBIM Copilot add-in is a real, loadable Revit 2025 add-in before any IPC, AI, or model mutation work proceeds.

## Authorized scope

- Revit 2025 add-in project structure;
- valid add-in manifest with stable GUIDs;
- ribbon tab/panel/buttons;
- registered DockablePane shell;
- sidebar host shell (no AI runtime requirement);
- diagnostics command;
- startup/shutdown logging;
- install/copy script for local Revit 2025;
- build instructions and runtime verification checklist.

## Explicitly excluded

- production Named Pipe/authentication (RCP-02);
- ExternalEvent command queue for model operations (RCP-02);
- live `get_selection` (RCP-03);
- BIM context extraction (RCP-04);
- MCP verification (RCP-05);
- Ollama/OpenAI/Claude runtime (RCP-06+);
- write transactions (RCP-08+).

## Acceptance gate

- [ ] Add-in project builds in a Windows/Revit 2025 development environment.
- [ ] Manifest contains stable non-placeholder GUIDs.
- [ ] Revit 2025 starts without add-in load errors.
- [ ] ReBIM Copilot ribbon is visible.
- [ ] Open Copilot opens a registered DockablePane.
- [ ] Sidebar shell renders without blocking Revit.
- [ ] Diagnostics reports Revit version, active document/view, and add-in status.
- [ ] Startup/shutdown logging works.
- [ ] Revit closes cleanly.
- [ ] Fresh install instructions are reproducible.
- [ ] Evidence from a real Revit 2025 run is captured before seal.

## STOP boundary

Do not claim RCP-01 PASS from static code alone. The final gate requires real Revit 2025 runtime evidence.
