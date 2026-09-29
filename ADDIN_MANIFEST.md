# ReBIM Copilot Add-in Manifest

## File: ReBIM.Revit.Addin.addin

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>ReBIM Copilot</Name>
    <Assembly>ReBIM.Revit.Addin.dll</Assembly>
    <AddInId>e18ae9d3-e8f8-4ae9-b7ac-80467cad65c6</AddInId>
    <FullClassName>ReBIM.Revit.Addin.Application</FullClassName>
    <VendorId>REBIM</VendorId>
    <VendorDescription>ReBIM Copilot Hybrid - Revit First</VendorDescription>
  </AddIn>
</RevitAddIns>
```

## FROZEN GUIDs (generated 2026-09-29)

| Component | GUID |
|-----------|------|
| AddInId | `e18ae9d3-e8f8-4ae9-b7ac-80467cad65c6` |
| DockablePaneId | `d3b005f6-7e7b-4381-83ea-1c7415544db9` |

**DO NOT REGENERATE THESE GUIDS**

## Installation

1. Build the add-in: `dotnet build -c Release`
2. Run installation script: `.\addin\install.ps1`
3. Or manually copy files to:
   - `%AppData%\Autodesk\Revit\Addins\2025\ReBIM.Copilot\`

## Verification

- Open Revit 2025
- Check ribbon tab "ReBIM"
- Click "Open Copilot" to open DockablePane
- Click "Diagnostics" to view status
