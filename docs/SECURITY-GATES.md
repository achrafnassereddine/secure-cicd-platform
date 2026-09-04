# Security gates

The repository separates detection from enforcement so reviewers can understand why a pipeline fails.

| Gate | Enforcement | Evidence |
|---|---|---|
| Tests | Required | CI job output |
| CodeQL | Findings uploaded | Code scanning |
| Gitleaks | Fail on detected secrets | Job log |
| Trivy filesystem | Fail on HIGH/CRITICAL | SARIF artifact |
| Container scan | Fail on HIGH/CRITICAL | Job log |
| ZAP baseline | Fail on actionable baseline findings | ZAP report |
| Release signing | Tag-only, OIDC-backed | Container signature |

Training scenarios are intentionally designed to trigger one or more gates. The goal is to show a complete detection → remediation → verification loop.
