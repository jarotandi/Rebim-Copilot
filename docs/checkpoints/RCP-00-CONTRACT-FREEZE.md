# RCP-00 — Contract Freeze

**Status:** PASS — READY FOR REVIEW / MERGE  
**Branch:** `rcp-00-contract-freeze`  
**Starting baseline:** `e370dbb75316fb789444288a06aca28e956b9273` (merged RCP-00R)  
**Verified implementation SHA:** `4ab49867ab69fafb43cde3305f72a6cadad0848a`  
**Protocol:** `0.1.0` — **FROZEN**

## 1. Scope completed

RCP-00 freezes the provider-neutral semantic boundary before Revit runtime implementation.

Included:

- command envelope schema;
- result envelope schema;
- bounded BIM context schema;
- tool registry schema and canonical registry;
- error catalog schema and canonical catalog;
- canonical fixtures;
- TypeScript contract bindings;
- C# semantic DTO bindings;
- progressive MCP tool disclosure;
- contract acceptance matrix;
- automated contract verification.

Explicitly excluded:

- Revit add-in runtime load (RCP-01);
- Named Pipe/auth/ExternalEvent runtime path (RCP-02);
- live selection/model reads (RCP-03/RCP-04);
- local AI runtime (RCP-06);
- write execution/transactions (RCP-08+).

## 2. Frozen invariants

1. Semantic protocol version is `0.1.0`.
2. Transport authentication/framing is outside the semantic command envelope.
3. `contracts/tool-registry.json` is the canonical tool-definition source.
4. READ/UI tools are non-mutating.
5. Every model mutation requires approval.
6. `set_parameter` is visible only in Edit/Automate.
7. Success and error result forms are mutually exclusive.
8. Error catalog and result-schema error enum match exactly.
9. Unknown top-level envelope fields fail closed.
10. Tool inputs are standard JSON Schema objects.
11. Context selection is bounded.
12. Incompatible post-freeze changes require a protocol/contract version bump.

## 3. Verification evidence

Verified against implementation SHA:

`4ab49867ab69fafb43cde3305f72a6cadad0848a`

### RCP-00 contract gate — push

- Workflow run: `36570219745`
- TypeScript build: **PASS**
- Test files: **3/3 PASS**
- Tests: **32/32 PASS**
  - contracts: **20/20**
  - tool registry: **9/9**
  - IPC baseline: **3/3**

### RCP-00 contract gate — pull request

- Workflow run: `36570224092`
- Conclusion: **PASS**

### Baseline regression — pull request

- Workflow run: `36570224578`
- Conclusion: **PASS**

Two earlier contract candidates failed due AJV module resolution. They were not sealed. The final verified implementation uses Node's package-scoped `createRequire` to load AJV from the Gateway dependency boundary.

## 4. Acceptance gate

- [x] Gateway build PASS.
- [x] All contract tests PASS.
- [x] Tool input schemas compile under AJV.
- [x] Canonical fixtures validate.
- [x] Tool registry canonical-source test PASS.
- [x] Error catalog equality test PASS.
- [x] Progressive disclosure test PASS.
- [x] Mutation/approval invariants PASS.
- [x] No RCP-01+ runtime claims.
- [x] Manifest promoted from CANDIDATE to FROZEN.
- [x] CI evidence recorded.

## 5. Contract ownership

```text
contracts/
├── manifest.json                 protocol + contract version
├── command.schema.json           semantic command envelope
├── result.schema.json            success/error result envelope
├── context.schema.json           bounded BIM context
├── tool-registry.schema.json     registry structure
├── tool-registry.json            canonical tool source
├── error-codes.schema.json       catalog structure
├── error-codes.json              canonical error source
└── fixtures/                     executable contract examples
```

TypeScript consumes the canonical tool registry instead of duplicating tool definitions.

C# has semantic DTO bindings, while transport authentication/framing remains intentionally deferred to RCP-02.

## 6. Change policy

After this seal:

- compatible clarifications may be documented without changing field meaning;
- adding or changing incompatible required fields requires a version bump;
- changing tool safety semantics requires a reviewed contract amendment;
- no host adapter may silently bypass these contracts.

## 7. Next stage

```text
RCP-00
CONTRACT FREEZE
✅ PASS

        ↓

RCP-01
REAL REVIT 2025 ADD-IN
NEXT
```

RCP-01 must prove a real Revit 2025 add-in load, ribbon, registered dockable pane, diagnostics, and clean shutdown.

## 8. STOP boundary

Do not implement RCP-01 runtime work on this branch. Start RCP-01 from the reviewed/merged RCP-00 baseline in a new stage branch.
