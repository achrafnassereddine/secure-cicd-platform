# Security methodology

The project follows a pull-request security gate model:

1. Build and test the application.
2. Inspect source code with SAST.
3. Search repository history and content for credentials.
4. Review dependency and configuration risk.
5. Generate an SBOM.
6. Build a production-style container.
7. Scan the image.
8. Run DAST against the ephemeral CI deployment.
9. Block merge/release on policy-defined critical findings.
10. Publish only after all required checks pass.

The objective is not to maximize scanner count. Each control should have a defined role, evidence artifact, failure condition, and remediation path.
