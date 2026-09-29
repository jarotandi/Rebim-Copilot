# ReBIM Copilot Contracts

## Overview
This directory contains the frozen contracts for ReBIM Copilot Hybrid POC.

## Files

| File | Description |
|------|-------------|
| `command.schema.json` | Command envelope schema |
| `result.schema.json` | Result envelope schema |
| `context.schema.json` | BIM context model schema |
| `tool-registry.json` | Tool registry with risk classification |
| `error-codes.json` | Error code catalog |

## Version
All contracts are at version 0.1.0 (RCP-00 frozen).

## Unit Boundary
- Length values: millimeters (mm)
- All unit conversions happen at public boundary

## Tool Risk Levels
- READ: Read-only operations
- UI: User interface operations
- SAFE_WRITE: Write operations requiring preview + approval
- WRITE: Direct write operations
- DESTRUCTIVE: Destructive operations requiring strong confirmation
