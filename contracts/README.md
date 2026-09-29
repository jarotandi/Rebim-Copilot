# ReBIM Copilot Contracts v0.1.0

RCP-00 freezes the provider-neutral semantic contracts used between the Copilot/Gateway and host adapters.

## Canonical version

- Protocol: `0.1.0`
- Contract set: `0.1.0`
- Initial host target: `revit`

## Boundary rule

Transport authentication and Named Pipe framing are **not** part of the semantic command envelope. Those concerns belong to RCP-02.

The canonical command envelope is:

```text
protocolVersion
requestId
host
command
contextRevision?
arguments
```

The canonical result envelope is:

```text
protocolVersion
requestId
ok
result | error
```

## Safety invariants

- READ/UI tools must not mutate model state.
- Any tool with `mutatesModel=true` must have `requiresApproval=true`.
- `set_parameter` is not visible in Ask/Analyze mode.
- Tool inputs are standard JSON Schema objects.
- Result error codes must match the canonical error catalog.
- Unknown top-level envelope fields are rejected.

## Change policy

After RCP-00 is sealed, incompatible changes require a protocol or contract version bump. Do not silently change field meaning under `0.1.0`.
