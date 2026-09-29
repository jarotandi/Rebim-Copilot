# RCP-00 Contract Acceptance Matrix

| Invariant | Evidence |
|---|---|
| Protocol version is explicit | `manifest.json`, envelope schemas, TS constant |
| Host is explicit | command/context host enum = `revit` |
| Unknown envelope fields fail closed | `additionalProperties: false` + tests |
| Success and error results are mutually exclusive | result schema conditional tests |
| Tool definitions have one canonical source | `contracts/tool-registry.json` |
| Tool inputs are valid JSON Schema | AJV compile test for every tool |
| READ/UI never mutate | registry invariant test |
| Mutations require approval | registry invariant test |
| `set_parameter` hidden from Ask/Analyze | registry + progressive disclosure test |
| Error catalog matches result schema | exact equality test |
| Context is bounded | selection max 100 + fixture validation |
| Transport auth is not conflated with semantic command | contract README; RCP-02 ownership |
| Incompatible post-freeze changes require version bump | contract README |
