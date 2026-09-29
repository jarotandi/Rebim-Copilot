# ReBIM Copilot Add-in Manifest

## File: ReBIM.Revit.Addin.addin

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>ReBIM Copilot</Name>
    <Assembly>ReBIM.Revit.Addin.dll</Assembly>
    <AddInId>a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d</AddInId>
    <FullClassName>ReBIM.Revit.Addin.Application</FullClassName>
    <VendorId>REBIM</VendorId>
    <VendorDescription>ReBIM Copilot Hybrid - Revit First</VendorDescription>
  </AddIn>
</RevitAddIns>
```

## Stable GUIDs

| Component | GUID |
|-----------|------|
| AddInId | `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` |
| DockablePaneId | `f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c` |

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
