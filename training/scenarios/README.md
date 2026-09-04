# Training scenarios

These scenarios are designed to be introduced as separate pull requests against the secure baseline.

## Scenario 01 — SQL injection regression

Patch `src/app.ts` to concatenate the `q` search parameter into SQL. Expected control: SAST review/CodeQL finding and security review.

## Scenario 02 — Authorization regression

Remove the `owner_id = ?` predicate from `/api/documents/:id`. Expected control: automated regression test failure plus manual review.

## Scenario 03 — Weak security headers

Remove `helmet()` middleware. Expected control: DAST identifies missing headers.

## Scenario 04 — Hard-coded credential

Add a fake-but-scanner-detectable credential string to a test-only file. Expected control: Gitleaks failure. Never add a real credential.

## Scenario 05 — Vulnerable dependency

Temporarily upgrade a dependency to an intentionally vulnerable release selected for the training branch. Expected control: Trivy dependency scan failure.

Each scenario should be demonstrated through a GitHub pull request, not applied to the default branch.
