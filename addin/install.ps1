# ReBIM Copilot Add-in Installation Script
# Targets: %AppData%\Autodesk\Revit\Addins\2025\

param(
    [string]$BuildPath = "..\addin\bin\Release\net8.0",
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$AddInName = "ReBIM.Revit.Addin"
$AddInGuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
$TargetDir = Join-Path $env:APPDATA "Autodesk\Revit\Addins\2025\ReBIM.Copilot"
$ManifestName = "ReBIM.Revit.Addin.addin"

function Write-Status {
    param([string]$Message)
    Write-Host "[ReBIM] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[ReBIM] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ReBIM] ERROR: $Message" -ForegroundColor Red
}

function Install-AddIn {
    Write-Status "Installing ReBIM Copilot Add-in..."
    
    # Create target directory
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        Write-Status "Created directory: $TargetDir"
    }
    
    # Copy DLL
    $sourceDll = Join-Path $BuildPath "$AddInName.dll"
    $targetDll = Join-Path $TargetDir "$AddInName.dll"
    
    if (Test-Path $sourceDll) {
        Copy-Item -Path $sourceDll -Destination $targetDll -Force
        Write-Success "Copied: $AddInName.dll"
    } else {
        Write-Error "Source DLL not found: $sourceDll"
        exit 1
    }
    
    # Copy manifest
    $sourceManifest = Join-Path $PSScriptRoot $ManifestName
    $targetManifest = Join-Path $TargetDir "$ManifestName"
    
    if (Test-Path $sourceManifest) {
        Copy-Item -Path $sourceManifest -Destination $targetManifest -Force
        Write-Success "Copied: $ManifestName"
    } else {
        Write-Error "Manifest not found: $sourceManifest"
        exit 1
    }
    
    Write-Success "Installation complete!"
    Write-Status "Target: $TargetDir"
    Write-Status "Please restart Revit 2025 to load the add-in."
}

function Uninstall-AddIn {
    Write-Status "Uninstalling ReBIM Copilot Add-in..."
    
    if (Test-Path $TargetDir) {
        Remove-Item -Path $TargetDir -Recurse -Force
        Write-Success "Removed: $TargetDir"
    } else {
        Write-Status "Add-in not installed."
    }
    
    Write-Success "Uninstallation complete!"
}

# Main
if ($Uninstall) {
    Uninstall-AddIn
} else {
    Install-AddIn
}
