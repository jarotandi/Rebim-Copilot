# RCP-01: Revit 2025 Add-in Shell

## Status: IN PROGRESS

## Target
Create a real Autodesk Revit 2025 add-in that proves:
- Revit 2025 loads the add-in
- ReBIM Copilot Ribbon appears
- Open Copilot button opens registered DockablePane
- Diagnostics button shows status
- Startup/shutdown logging works

## Requirements

### A. Project / Build
- Target .NET 8 for Revit 2025
- Reference RevitAPI.dll and RevitAPIUI.dll safely
- WPF support
- No machine-specific absolute paths in committed files

### B. Add-in Identity
- Stable GUID for Application AddInId
- Stable GUID for DockablePaneId
- No placeholder GUIDs

### C. Revit Application
- IExternalApplication OnStartup
- Create ribbon tab "ReBIM"
- Create panel "ReBIM Copilot"
- Add "Open Copilot" button
- Add "Diagnostics" button
- Register DockablePane
- OnShutdown cleanup

### D. Dockable Pane
- IDockablePaneProvider implementation
- Shell UI with status, mode, provider, view, selection
- Non-functional placeholders for RCP-01

### E. Diagnostics
- ReBIM Copilot version
- Revit version/build
- Active document title
- Active view
- Add-in loaded status
- DockablePane registration status
- IPC: "Not implemented — RCP-02"

### F. Logging
- Startup
- Ribbon registration
- Dockable pane registration
- Open Copilot
- Diagnostics
- Shutdown
- Exceptions

### G. Addin Manifest
- Valid Revit 2025 .addin manifest
- Installation script

## Exit Gate
PASS if:
- Add-in appears in Revit 2025
- Ribbon visible with buttons
- DockablePane opens
- Diagnostics works
- Clean shutdown
