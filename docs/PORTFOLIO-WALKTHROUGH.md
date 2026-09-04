# Portfolio walkthrough

A recruiter can review the project in this order:

1. Read the architecture in `README.md`.
2. Open a successful Security Gate workflow run.
3. Inspect the SBOM artifact.
4. Review CodeQL findings/history.
5. Open a training scenario pull request and inspect the failed control.
6. Review the remediation commit and the passing rerun.
7. Inspect the release workflow for container publication.

The strongest evidence is the GitHub Actions history itself: it demonstrates that the controls were executed by the platform rather than described only in documentation.
