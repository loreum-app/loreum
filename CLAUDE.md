# CLAUDE.md

Deliver correct, maintainable software that a staff engineer can review with confidence. Prefer clear behavior, explicit ownership, and the simplest design that meets the requirements. Scale planning and documentation to the work's scope and risk. These standards apply to new projects and existing codebases.

## Before implementation

- Read the available requirements and repository instructions. In an existing codebase, inspect relevant implementation, callers, tests, and build commands. For a new project, establish the minimal structure and tooling needed to run, build, and verify it.
- Establish what the software does, who uses it, its inputs and outputs, acceptance criteria, constraints, and scope. Identify important invariants: what must always be true and what must never happen. Use concrete examples to resolve ambiguity.
- Ask when an unknown affects scope, user-visible behavior, compatibility, or a costly decision. For routine details, follow applicable conventions or choose the simplest suitable option and proceed. State material assumptions.
- For substantial work, give a short plan covering the approach, components, interfaces and data, main risks, and verification. Discuss alternatives when they present a real trade-off. Honor review gates the user requests.

## Scope and design

- Implement the requested behavior and necessary supporting code. Avoid speculative features, placeholder files, and unused configuration. In an existing codebase, preserve unrelated work and avoid opportunistic refactors.
- Use consistent conventions for structure, naming, and error handling. In a new project, choose conventions suited to its needs. In an existing codebase, follow established conventions unless they cause a concrete problem. Explain a necessary departure.
- Model ownership, invariants, and meaningful state transitions before implementing them. Use types and constraints to prevent invalid states where practical. Use diagrams when they clarify a complex relationship.
- Keep related behavior together behind a small, coherent interface. Imagine removing the module. If complexity disappears, reconsider the layer. If complexity spreads into its callers, the boundary is useful.
- Add an abstraction for demonstrated variation or complexity. A straightforward function or switch is often sufficient. Do not introduce registries, classes, wrappers, or dependency injection solely to satisfy a pattern.
- Keep control flow easy to follow. Reduce unnecessary nesting and separate distinct responsibilities. Treat length as a prompt to inspect a function, not a reason to fragment cohesive code.
- Make state changes and side effects explicit. Keep business logic separate from I/O where useful, and make clocks or randomness controllable when correctness depends on them. Avoid hidden mutation of caller-owned data.

## Correctness and failure handling

- Validate untrusted input at system boundaries and convert it to a consistent internal form. Do not use type assertions as a substitute for runtime validation.
- Define clear contracts for interfaces and data formats. When changing an existing contract, preserve compatibility unless a break is intentional, and account for existing data and callers.
- Handle relevant failures deliberately. Preserve useful error context. Do not swallow exceptions, return success-shaped defaults after failure, or retry without limits and a reason that repetition is safe.
- When introducing a safeguard against a non-obvious failure, reproduce the failure and verify that the safeguard prevents it.
- When applicable, enforce authorization before side effects, protect shared-state invariants with transactions or synchronization, and handle duplicate requests. Await asynchronous work and release resources on failure as well as success.
- Keep secrets and sensitive payloads out of source code, logs, and error messages. Include enough safe context to diagnose failures.

## Dependencies

- Check existing dependencies and platform features before adding a package. Add one when it reduces complexity or risk enough to justify its maintenance and integration cost. Verify that it supports the actual required format or protocol.
- Use established libraries for security-sensitive operations and complex standards. Avoid both trivial dependencies and unnecessary custom replacements for mature libraries.
- Use the ecosystem's version and lockfile mechanisms for reproducible dependency resolution, following repository conventions where established. Record the reason for a significant dependency where maintainers will find it.

## Tests

- Test the required behavior and relevant failure paths. Choose meaningful boundaries, malformed inputs, duplicates, or empty cases based on the contract; do not mechanically apply every category to every function.
- For a bug fix, add a regression test that reproduces the failure when practical. Verify that it fails for the intended reason before the fix and passes afterward. For new behavior, establish expected results before implementation.
- Test through the smallest stable interface that exposes the behavior. Private helpers do not automatically need direct tests or separate test files. Include integration tests when correctness depends on wiring, persistence, or an external boundary.
- Name tests with a specific condition and observable outcome in domain language. Do not write them as pseudocode, execution traces, or lists of internal error codes.
- Keep each test focused on one behavior. Multiple assertions are appropriate when they establish that behavior, including the absence of unwanted effects.
- Use small, readable fixtures. Keep the inputs and expected results visible; helpers should remove irrelevant setup without hiding the values that explain the case.
- Derive expected results from requirements, worked examples, or independent reference data. Do not compute them with the production logic or duplicate its algorithm in the assertion.
- Compare the complete output when it is a stable contract, including unexpected extra results. Otherwise, assert the relevant guarantees explicitly. Avoid count-only or truthiness assertions when incorrect content could still pass.
- Mock external boundaries when needed. Do not replace the behavior under test with a mock, or assert internal call sequences unless those interactions are the contract. Use real integration coverage for behavior a mock cannot establish.
- Keep tests deterministic and isolated. Avoid arbitrary sleeps and shared mutable fixtures. Do not skip tests, weaken assertions, or update expected results merely to make checks pass; resolve the underlying discrepancy.

### Example: test names and assertions

Here, `anonymous_id` is required. The contract treats `anonymousId` as a naming error, without also reporting the required property as missing.

```ts
// Bad: the name is pseudocode, internal error codes, and a case number.
// Counts miss incorrect error details and unrelated extra errors.
it("camelCase twin -> NAME_CONVENTION, derived missing-required suppressed (case 14)", () => {
  const violations = validate(event({ anonymousId: "a", step: 1 }));
  expect(violations.filter((v) => v.code === "NAME_CONVENTION")).toHaveLength(
    1,
  );
  expect(violations.filter((v) => v.code === "MISSING_REQUIRED")).toHaveLength(
    0,
  );
});
```

```ts
// Good: the name describes behavior. The assertion checks the complete output,
// so incorrect details or an extra violation fail the test.
it("reports a misnamed required property without also reporting it as missing", () => {
  const violations = validate(event({ anonymousId: "a", step: 1 }));
  expect(violations).toEqual([
    {
      code: "NAME_CONVENTION",
      severity: "error",
      path: "/properties/anonymousId",
      message:
        'property "anonymousId" does not follow the snake_case convention',
      details: { did_you_mean: "anonymous_id" },
    },
  ]);
});
```

## Names, comments, and documentation

- Use precise domain names. Avoid unexplained abbreviations and vague names such as `data`, `manager`, or `helper` when a more specific name exists. Follow local naming conventions.
- Explain non-obvious reasons, constraints, and compatibility decisions in comments. Remove comments that merely restate the code, obsolete explanations, and unnecessary narration.
- Document public contracts when callers need information the types do not express, such as units, side effects, ordering, or failure behavior.
- Write and maintain the documentation needed to install, use, and test the software. Keep commands accurate. Record durable design decisions and meaningful rejected alternatives; create separate spec or design documents only when the work warrants them.
- Write concise, factual prose and commit messages. Explain what changed and why without promotional language or claims unsupported by verification.

## Before handing off

- Review the completed work as a maintainer: correctness, unnecessary complexity, contracts, error paths, misleading names, and stale comments. Check that the components work together through the intended entry points. For existing codebases, also inspect the diff for regressions and unrelated changes.
- Run the relevant tests and required build, type, lint, and format checks. Investigate failures. Do not suppress warnings or errors, add unsafe casts, or bypass checks just to obtain a clean result.
- Verify setup and usage instructions by running them where practical. For work involving migrations or external systems, check the relevant integration path and identify any remaining validation needed.
- Report the outcome, important decisions, checks actually run and their results, and any limitations or unresolved risks. Distinguish verified behavior from assumptions. Never claim a check passed unless it ran successfully.
