# ReBIM Copilot Add-in Manifest

## File: ReBIM.Revit.Addin.addin

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>ReBIM Copilot</Name>
    <Assembly>ReBIM.Revit.Addin.dll</Assembly>
    <AddInId>YOUR-GUID-HERE-1234-567890ABCDEF</AddInId>
    <FullClassName>ReBIM.Revit.Addin.Application</FullClassName>
    <VendorId>REBIM</VendorId>
    <VendorDescription>ReBIM Copilot Hybrid - Revit First</VendorDescription>
  </AddIn>
</RevitAddIns>
```

## Installation

1. Build the add-in: `dotnet build -c Release`
2. Copy `ReBIM.Revit.Addin.dll` dan dependencies ke:
   - `C:\ProgramData\Autodesk\Revit\Addins\2025\ReBIM.Copilot\`
3. Copy manifest file ke:
   - `C:\ProgramData\Autodesk\Revit\Addins\2025\ReBIM.Copilot.addin`
4. Restart Revit 2025

## Verification

- Buka Revit 2025
- Cek ribbon tab "ReBIM Copilot"
- Klik "Open Copilot" untuk membuka sidebar
- Klik "Diagnostics" untuk melihat status koneksi
