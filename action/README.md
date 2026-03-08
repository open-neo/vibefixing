# VibeFixing GitHub Action

Run VibeFixing on every pull request to catch code health issues before they merge.

## Quick Start

```yaml
name: VibeFixing
on:
  pull_request:

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: open-neo/vibefixing-action@v1
        with:
          scan: 'true'
          severity: 'medium'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Inputs

| Input | Description | Default |
|---|---|---|
| `scan` | Run scan on project | `true` |
| `review` | Run AI review (requires API key) | `false` |
| `severity` | Minimum severity to report | `medium` |
| `skills` | Comma-separated skill IDs | auto-detect |
| `fail-on-findings` | Fail check on findings | `true` |
| `comment` | Post PR comment | `true` |
| `format` | Output format | `table` |
| `working-directory` | Working directory | `.` |

## Outputs

| Output | Description |
|---|---|
| `findings-count` | Number of findings |
| `architecture-score` | Architecture health score (0-100) |
| `security-score` | Security health score (0-100) |
| `quality-score` | Quality health score (0-100) |
| `overall-score` | Overall health score (0-100) |
| `sarif-file` | Path to SARIF file |

## PR Comment

The action posts a formatted comment on each PR:

- Severity counts with color indicators
- Table of findings with file, issue, and line number
- Links to VibeFixing documentation

## SARIF Upload

For GitHub Code Scanning integration:

```yaml
- uses: open-neo/vibefixing-action@v1
  with:
    format: 'sarif'

- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: /tmp/vibefixing.sarif
```

## License

Apache 2.0
