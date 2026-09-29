# RCP-00 — Contract Freeze

**Status:** IN PROGRESS  
**Branch:** `rcp-00-contract-freeze`  
**Starting baseline:** `e370dbb75316fb789444288a06aca28e956b9273` (merged RCP-00R)  
**Protocol candidate:** `0.1.0`

## Scope

Freeze the provider-neutral semantic boundary before Revit runtime implementation.

### Included

- command envelope schema;
- result envelope schema;
- BIM context schema;
- tool registry schema and canonical registry;
- error catalog schema and canonical catalog;
- fixtures;
- TypeScript contract bindings;
- C# semantic DTO bindings;
- progressive tool disclosure semantics;
- contract acceptance matrix;
- automated contract validation.

### Explicitly excluded

- Named Pipe/auth framing (RCP-02);
- real Revit add-in load (RCP-01);
- live get_selection execution (RCP-03);
- write transaction execution (RCP-08+);
- AI provider runtime behavior (RCP-06/RCP-11).

## Candidate invariants

1. Semantic protocol version is `0.1.0`.
2. Transport auth is outside the semantic envelope.
3. `contracts/tool-registry.json` is the single source of tool definitions.
4. READ/UI tools cannot mutate.
5. Mutating tools require approval.
6. `set_parameter` is visible only in Edit/Automate.
7. Result success/error forms are mutually exclusive.
8. Error codes are synchronized with the result schema.
9. Unknown envelope fields fail closed.
10. Incompatible changes after seal require a version bump.

## Gate

- [ ] Gateway build PASS.
- [ ] All contract tests PASS.
- [ ] Tool input schemas compile under AJV.
- [ ] Fixtures validate.
- [ ] Tool registry canonical-source test PASS.
- [ ] Error catalog equality test PASS.
- [ ] No RCP-01+ runtime claims.
- [ ] Manifest promoted from CANDIDATE to FROZEN after green CI.
- [ ] Final SHA and CI evidence recorded.
