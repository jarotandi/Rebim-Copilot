# ReBIM Copilot Add-in Installation Script
# Targets: %AppData%\Autodesk\Revit\Addins\2025\

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$AddInName = "ReBIM.Revit.Addin"
$TargetDir = Join-Path $env:APPDATA "Autodesk\Revit\Addins\2025\ReBIM.Copilot"
$ManifestName = "ReBIM.Revit.Addin.addin"

# Resolve paths based on script location
$ScriptDir = $PSScriptRoot
$RepoRoot = Split-Path -Parent $ScriptDir
$BuildPath = Join-Path $ScriptDir "bin\Release\net8.0-windows"
$SourceManifest = Join-Path $RepoRoot $ManifestName

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
    Write-Status "Script directory: $ScriptDir"
    Write-Status "Build path: $BuildPath"
    Write-Status "Source manifest: $SourceManifest"
    
    # Verify source files exist
    $sourceDll = Join-Path $BuildPath "$AddInName.dll"
    if (-not (Test-Path $sourceDll)) {
        Write-Error "Source DLL not found: $sourceDll"
        Write-Error "Please build the add-in first: dotnet build -c Release"
        exit 1
    }
    
    if (-not (Test-Path $SourceManifest)) {
        Write-Error "Manifest not found: $SourceManifest"
        exit 1
    }
    
    # Create target directory
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        Write-Status "Created directory: $TargetDir"
    }
    
    # Copy DLL
    $targetDll = Join-Path $TargetDir "$AddInName.dll"
    Copy-Item -Path $sourceDll -Destination $targetDll -Force
    Write-Success "Copied: $AddInName.dll"
    
    # Copy manifest and update assembly path
    $targetManifest = Join-Path $TargetDir $ManifestName
    $manifestContent = Get-Content $SourceManifest -Raw
    
    # Update assembly path in manifest to point to installed location
    $assemblyPath = $targetDll.Replace('\', '\\')
    $manifestContent = $manifestContent -replace '(?<=<Assembly>).*?(?=</Assembly>)', $assemblyPath
    
    Set-Content -Path $targetManifest -Value $manifestContent -Encoding UTF8
    Write-Success "Copied: $ManifestName (with updated assembly path)"
    
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
