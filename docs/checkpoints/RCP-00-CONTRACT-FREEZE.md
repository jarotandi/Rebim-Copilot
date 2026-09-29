# RCP-00: Contract Freeze

## Status: COMPLETE

## Frozen Contracts

### Command Envelope
- Schema: `contracts/command.schema.json`
- Required fields: requestId, host, command, arguments
- Host enum: ["revit"]

### Result Envelope
- Schema: `contracts/result.schema.json`
- Required fields: requestId, ok
- Error codes: 9 defined codes

### Context Model
- Schema: `contracts/context.schema.json`
- Required fields: host, document, view, selection, revision

### Tool Registry
- Version: 0.1.0
- Tools: 9 (get_project_info, get_active_view, get_selection, get_element, get_element_properties, find_elements, select_elements, highlight_elements, set_parameter)
- Risk levels: READ, UI, SAFE_WRITE

### Error Codes
- REBIM_VALIDATION_ERROR
- REBIM_CAPABILITY_UNAVAILABLE
- REBIM_PERMISSION_DENIED
- REBIM_STALE_CONTEXT
- REBIM_IPC_UNAVAILABLE
- REBIM_REVIT_CONTEXT_BUSY
- REBIM_EXECUTION_FAILED
- REBIM_PROVIDER_UNAVAILABLE
- REBIM_CLOUD_BLOCKED

## Unit Boundary
- Length values: millimeters (mm)
- All conversions at public boundary

## Acceptance Matrix
- RCP-00 to RCP-14 defined
- Exit gates established
